-- Seed notices
INSERT INTO public.notices (title, tag, details, author_id) VALUES
('IPE 302: Operations Research II Term Final Syllabus Outline', 'Academic', 'The Term Final syllabus will cover Operations Research models, including Dynamic Programming, Queueing Theory, and Decision Theory. Class test solutions and formula sheets have been uploaded to the Vault.', NULL),
('IPE 308: Ergonomics Sessionals Submission Schedule', 'Exam', 'Lab Report 4 (Work Design & Workspace Layout) must be submitted physically by Thursday, June 18, 2026, 2:00 PM to the department office. Late submissions will face grading penalties.', NULL),
('Industrial Visit to Unilever Kalurghat Factory', 'Events', 'All students are requested to report to the BUET main gate by 7:00 AM on June 22. Official bus transport and lunch will be provided by the department. Wear safety shoes and formal attire.', NULL),
('Notice Regarding Makeup Class for IPE 312: Quality Control', 'Academic', 'A makeup lecture for IPE 312 will be conducted on Saturday at 10:00 AM in Gallery 302 to cover Statistical Process Control charts and CUSUM models.', NULL);

-- Seed attachments
INSERT INTO public.attachments (title, subject, term, file_type, file_size, drive_url, uploaded_by) VALUES
('Dynamic Programming Lecture Slides', 'Operations Research II', 'L-3 T-2', 'PDF', '4.8 MB', 'https://drive.google.com/file/d/1_o3rS9f_V0x95nUf60y2E_dummy1/view', NULL),
('Queueing Models Formula Sheet', 'Operations Research II', 'L-3 T-2', 'PDF', '1.2 MB', 'https://drive.google.com/file/d/1_o3rS9f_V0x95nUf60y2E_dummy2/view', NULL),
('CAD Exercises & Assembly Guide', 'Product Design', 'L-3 T-2', 'ZIP', '15.4 MB', 'https://drive.google.com/file/d/1_o3rS9f_V0x95nUf60y2E_dummy3/view', NULL),
('Anthropometry Reference Tables', 'Ergonomics', 'L-3 T-2', 'PDF', '3.5 MB', 'https://drive.google.com/file/d/1_o3rS9f_V0x95nUf60y2E_dummy4/view', NULL),
('Simplex Method Excel Workbook', 'Operations Research I', 'L-3 T-1', 'XLSM', '2.1 MB', 'https://drive.google.com/file/d/1_o3rS9f_V0x95nUf60y2E_dummy5/view', NULL),
('Control Chart Constants Table', 'Quality Control', 'L-3 T-1', 'PDF', '0.8 MB', 'https://drive.google.com/file/d/1_o3rS9f_V0x95nUf60y2E_dummy6/view', NULL);
