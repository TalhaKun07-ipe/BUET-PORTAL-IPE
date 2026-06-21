-- Create tables
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'cr', 'student')),
    section TEXT CHECK (section IN ('A1', 'A2', 'B1', 'B2', NULL)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE public.role_requests (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    requested_role TEXT NOT NULL CHECK (requested_role IN ('admin', 'cr')),
    requested_section TEXT CHECK (requested_section IN ('A1', 'A2', 'B1', 'B2', NULL)),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.notices (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    tag TEXT NOT NULL CHECK (tag IN ('Academic', 'Exam', 'Events')),
    details TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE public.routines (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    section TEXT NOT NULL CHECK (section IN ('A1', 'A2', 'B1', 'B2')),
    day TEXT NOT NULL CHECK (day IN ('S', 'M', 'T', 'W', 'T_thu', 'F', 'S_sat')),
    time_slot TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE public.attachments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    term TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size TEXT NOT NULL,
    drive_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE public.gallery (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);


-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Trigger to automatically create profiles when a new user signs up in Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role TEXT := 'student';
    default_section TEXT := NULL;
    sid TEXT;
BEGIN
    sid := COALESCE(NEW.raw_user_meta_data->>'student_id', '');

    -- Automatically seed the main admin email
    IF NEW.email = 'talhazubayer0724@gmail.com' THEN
        default_role := 'admin';
    -- Auto-assign CR roles and sections by designated student ID
    ELSIF sid = '202508013' THEN
        default_role := 'cr';
        default_section := 'A1';
    ELSIF sid = '202508037' THEN
        default_role := 'cr';
        default_section := 'A2';
    ELSIF sid = '202508061' THEN
        default_role := 'cr';
        default_section := 'B1';
    ELSIF sid = '202508111' THEN
        default_role := 'cr';
        default_section := 'B2';
    END IF;

    INSERT INTO public.profiles (id, full_name, student_id, email, role, section)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        sid,
        NEW.email,
        default_role,
        default_section
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to protect profile role and section from client-side manipulation
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.section IS DISTINCT FROM OLD.section) THEN
        IF CURRENT_USER <> 'postgres' THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            ) THEN
                RAISE EXCEPTION 'Unauthorized to modify role or section columns directly.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.protect_profile_roles();

-- Policies for Profiles
CREATE POLICY "Public profiles are viewable by authenticated users" 
    ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile details" 
    ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" 
    ON public.profiles FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for Role Requests
CREATE POLICY "Users can view their own role requests" 
    ON public.role_requests FOR SELECT TO authenticated 
    USING (auth.uid() = user_id OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')));

CREATE POLICY "Users can submit role requests" 
    ON public.role_requests FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update/review role requests" 
    ON public.role_requests FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for Notices
CREATE POLICY "Notices are viewable by authenticated users" 
    ON public.notices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and CRs can insert notices" 
    ON public.notices FOR INSERT TO authenticated 
    WITH CHECK (
        (author_id = auth.uid()) AND
        (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'cr')))
    );

CREATE POLICY "Authors, CRs and Admins can delete/update notices" 
    ON public.notices FOR ALL TO authenticated 
    USING (auth.uid() = author_id OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'cr'))));

-- Policies for Routines
CREATE POLICY "Routines are viewable by authenticated users" 
    ON public.routines FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and CRs can insert routines" 
    ON public.routines FOR INSERT TO authenticated 
    WITH CHECK (
        (created_by = auth.uid()) AND
        (EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR (role = 'cr' AND section = routines.section))
        ))
    );

CREATE POLICY "Creators and Admins can modify/delete routines" 
    ON public.routines FOR ALL TO authenticated 
    USING (
        auth.uid() = created_by OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Policies for Attachments
CREATE POLICY "Attachments are viewable by authenticated users" 
    ON public.attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and CRs can insert attachments" 
    ON public.attachments FOR INSERT TO authenticated 
    WITH CHECK (
        (uploaded_by = auth.uid()) AND
        (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'cr')))
    );

CREATE POLICY "Uploaders, CRs and Admins can modify/delete attachments" 
    ON public.attachments FOR ALL TO authenticated 
    USING (
        auth.uid() = uploaded_by OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'cr'))
    );

-- Policies for Gallery
CREATE POLICY "Gallery items are viewable by authenticated users" 
    ON public.gallery FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can upload gallery items" 
    ON public.gallery FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Uploaders and Admins can delete gallery items" 
    ON public.gallery FOR DELETE TO authenticated 
    USING (
        auth.uid() = uploaded_by OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Policies for Storage Buckets
CREATE POLICY "Allow authenticated users to upload to moments" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'gallery' AND 
        (storage.foldername(name))[1] = 'moments'
    );

CREATE POLICY "Allow uploaders and admins to delete from moments" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'gallery' AND (
            owner = auth.uid() OR
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    );

-- Trigger to automatically update profile role/section when role request is approved
CREATE OR REPLACE FUNCTION public.handle_role_request_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        UPDATE public.profiles
        SET role = NEW.requested_role,
            section = NEW.requested_section
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_role_request_approved
    AFTER UPDATE ON public.role_requests
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_role_request_approval();

