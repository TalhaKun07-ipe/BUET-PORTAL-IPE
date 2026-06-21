import { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Bell, 
  FileText, 
  Image as ImageIcon, 
  ArrowLeft, 
  Download, 
  Search, 
  Lock, 
  Unlock, 
  Calendar, 
  Terminal, 
  ArrowRight, 
  Check, 
  Loader2, 
  ExternalLink,
  Sliders,
  Settings,
  AlertTriangle,
  User,
  LogOut,
  Plus,
  Trash2,
  AlertCircle,
  KeyRound,
  LogIn,
  Eye,
  EyeOff,
  ShieldCheck,
  Cloud
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { SplineSceneBasic } from '@/components/ui/demo';
import { SmokeBackground } from '@/components/ui/spooky-smoke-animation';
import { GearAssembly } from '@/components/ui/gear-assembly';
import { WrenchGear } from '@/components/ui/wrench-gear';
import { GearClock } from '@/components/ui/gear-clock';

// Supabase and Auth imports
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import { useNotices } from './hooks/useNotices';
import { useRoutines } from './hooks/useRoutines';
import { useAttachments } from './hooks/useAttachments';
import { useGallery } from './hooks/useGallery';
import { useRoleRequests } from './hooks/useRoleRequests';
import { supabase } from './lib/supabase';


gsap.registerPlugin(ScrollTrigger);

// Helper to detect cloud storage host from link
const detectProvider = (url) => {
  if (!url) return { name: 'Cloud', type: 'generic', color: 'text-white/40 bg-white/5 border-white/10' };
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('onedrive.live.com') || lowerUrl.includes('sharepoint.com') || lowerUrl.includes('1drv.ms') || lowerUrl.includes('buet-my.sharepoint.com')) {
    return { name: 'OneDrive', type: 'onedrive', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  }
  if (lowerUrl.includes('drive.google.com') || lowerUrl.includes('google.com/drive')) {
    return { name: 'Google Drive', type: 'gdrive', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  }
  if (lowerUrl.includes('dropbox.com')) {
    return { name: 'Dropbox', type: 'dropbox', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
  }
  return { name: 'Cloud Storage', type: 'generic', color: 'text-white/40 bg-white/5 border-white/10' };
};

// --- Dummy Data ---

const NOTICES_DATA = [
  {
    id: 1,
    date: "June 14, 2026",
    tag: "Academic",
    title: "IPE 302: Operations Research II Term Final Syllabus Outline",
    details: "The Term Final syllabus will cover Operations Research models, including Dynamic Programming, Queueing Theory, and Decision Theory. Class test solutions and formula sheets have been uploaded to the Vault."
  },
  {
    id: 2,
    date: "June 11, 2026",
    tag: "Exam",
    title: "IPE 308: Ergonomics Sessionals Submission Schedule",
    details: "Lab Report 4 (Work Design & Workspace Layout) must be submitted physically by Thursday, June 18, 2026, 2:00 PM to the department office. Late submissions will face grading penalties."
  },
  {
    id: 3,
    date: "June 08, 2026",
    tag: "Events",
    title: "Industrial Visit to Unilever Kalurghat Factory",
    details: "All students are requested to report to the BUET main gate by 7:00 AM on June 22. Official bus transport and lunch will be provided by the department. Wear safety shoes and formal attire."
  },
  {
    id: 4,
    date: "May 30, 2026",
    tag: "Academic",
    title: "Notice Regarding Makeup Class for IPE 312: Quality Control",
    details: "A makeup lecture for IPE 312 will be conducted on Saturday at 10:00 AM in Gallery 302 to cover Statistical Process Control charts and CUSUM models."
  }
];

const ATTACHMENTS_DATA = [
  { id: 1, term: "L-3 T-2", subject: "Operations Research II", title: "Dynamic Programming Lecture Slides", type: "PDF", size: "4.8 MB" },
  { id: 2, term: "L-3 T-2", subject: "Operations Research II", title: "Queueing Models Formula Sheet", type: "PDF", size: "1.2 MB" },
  { id: 3, term: "L-3 T-2", subject: "Product Design", title: "CAD Exercises & Assembly Guide", type: "ZIP", size: "15.4 MB" },
  { id: 4, term: "L-3 T-2", subject: "Ergonomics", title: "Anthropometry Reference Tables", type: "PDF", size: "3.5 MB" },
  { id: 5, term: "L-3 T-1", subject: "Operations Research I", title: "Simplex Method Excel Workbook", type: "XLSM", size: "2.1 MB" },
  { id: 6, term: "L-3 T-1", subject: "Quality Control", title: "Control Chart Constants Table", type: "PDF", size: "0.8 MB" }
];

const GALLERY_DATA = [];

const ROUTINE_DATA = {
  S: { classes: "No classes scheduled.", count: 0 },
  M: { classes: "9:00 AM - Ergonomics Lab | 2:00 PM - Quality Control.", count: 2 },
  T: { classes: "10:30 AM - Product Design | 1:30 PM - Operations Research II.", count: 2 },
  W: { classes: "8:00 AM - Production Management | 11:30 AM - Ergonomics.", count: 2 },
  T_thu: { classes: "9:00 AM - Operations Research Lab | 2:00 PM - Project Management.", count: 2 },
  F: { classes: "Weekend / Self-Study.", count: 0 },
  S_sat: { classes: "10:00 AM - Quality Control (Makeup).", count: 1 }
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

function MainApp() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [view, setView] = useState('home'); // 'home', 'harmonize', 'accelerate', 'preserve', 'admin', 'login'
  const containerRef = useRef(null);
  const lenisRef = useRef(null);

  // Hook-powered backend sync
  const { notices, addNotice, deleteNotice } = useNotices();
  const { schedule, addRoutine, deleteRoutine } = useRoutines();
  const { attachments, addAttachment, deleteAttachment } = useAttachments();
  const { gallery, addPhoto, deletePhoto } = useGallery();

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMobileProfileModal, setShowMobileProfileModal] = useState(false);

  // Helper: navigate to a view, but guard protected views for public (allowlist approach)
  const navigateTo = (targetView) => {
    const publicViews = ['home', 'preserve', 'login'];
    if (!user && !publicViews.includes(targetView)) {
      setView('login');
    } else {
      setView(targetView);
    }
  };

  // If user logs in while on login page, redirect to home
  useEffect(() => {
    if (user && view === 'login') {
      setView('home');
    }
  }, [user, view]);

  // Handle password recovery link events
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordModal(true);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);


  // Smooth Scroll with Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(updateTicker);
      lenisRef.current = null;
    };
  }, []);

  // Ensure scroll is reset when switching subviews
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [view]);

  const scrollToSection = (id) => {
    if (view !== 'home') {
      setView('home');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          if (lenisRef.current) {
            lenisRef.current.scrollTo(el);
          } else {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) {
        if (lenisRef.current) {
          lenisRef.current.scrollTo(el);
        } else {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center font-mono text-xs text-white/40">
        <Loader2 size={32} className="text-champagne animate-spin mb-4" />
        <span>INITIALIZING SECURE BATCH CONNECTION...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-transparent text-ivory flex flex-col md:flex-row relative">
      {/* Global CSS noise overlay */}
      <div className="noise-overlay" />

      {/* Red Smoke Background of the whole website */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
        <SmokeBackground smokeColor="#FF0000" />
      </div>

      {/* LEFT SIDEBAR NAVIGATION (Dashboard Style) */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-72 bg-obsidian/75 backdrop-blur-xl border-r border-white/5 py-10 px-6 flex-col justify-between z-40">
        <div>
          {/* Logo & Branding */}
          <div className="flex items-center mb-12 cursor-pointer" onClick={() => setView('home')}>
            <div>
              <h1 className="font-sans font-bold text-xl tracking-tight text-white leading-none">IPE '25</h1>
              <p className="font-mono text-[9px] uppercase tracking-wider text-champagne/80 mt-1">BUET Student Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <button 
              onClick={() => navigateTo('home')}
              className={`w-full flex items-center space-x-4 px-4 py-3 rounded-2xl transition-all duration-300 font-sans text-sm ${
                view === 'home' 
                  ? 'bg-white/[0.03] text-champagne border border-white/5 font-semibold' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <Home size={18} className={view === 'home' ? 'text-champagne' : 'text-white/60'} />
              <span>Dashboard Home</span>
            </button>

            <button 
              onClick={() => navigateTo('harmonize')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 font-sans text-sm ${
                view === 'harmonize' 
                  ? 'bg-white/[0.03] text-champagne border border-white/5 font-semibold' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <div className="flex items-center space-x-4">
                <Bell size={18} className={view === 'harmonize' ? 'text-champagne' : 'text-white/60'} />
                <span>Notices</span>
              </div>
              {!user && <Lock size={12} className="text-white/25" />}
            </button>

            <button 
              onClick={() => navigateTo('accelerate')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 font-sans text-sm ${
                view === 'accelerate' 
                  ? 'bg-white/[0.03] text-champagne border border-white/5 font-semibold' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <div className="flex items-center space-x-4">
                <FileText size={18} className={view === 'accelerate' ? 'text-champagne' : 'text-white/60'} />
                <span>Vault</span>
              </div>
              {!user && <Lock size={12} className="text-white/25" />}
            </button>

            <button 
              onClick={() => navigateTo('preserve')}
              className={`w-full flex items-center space-x-4 px-4 py-3 rounded-2xl transition-all duration-300 font-sans text-sm ${
                view === 'preserve' 
                  ? 'bg-white/[0.03] text-champagne border border-white/5 font-semibold' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <ImageIcon size={18} className={view === 'preserve' ? 'text-champagne' : 'text-white/60'} />
              <span>Gallery</span>
            </button>

            {user && profile?.role === 'admin' && (
              <button 
                onClick={() => navigateTo('admin')}
                className={`w-full flex items-center space-x-4 px-4 py-3 rounded-2xl transition-all duration-300 font-sans text-sm ${
                  view === 'admin' 
                    ? 'bg-white/[0.03] text-champagne border border-white/5 font-semibold' 
                    : 'text-white/60 hover:text-white hover:bg-white/[0.01]'
                }`}
              >
                <Sliders size={18} className={view === 'admin' ? 'text-champagne' : 'text-white/60'} />
                <span>Admin Console</span>
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Status Footer */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-mono text-xs text-white/80">BUET SERVERS ONLINE</span>
            </div>
            <p className="font-mono text-[9px] text-white/40 mt-1">LATENCY: 14ms | PORTAL SECURE</p>
          </div>

          {user ? (
            /* Authenticated user footer */
            <div className="flex flex-col space-y-2 px-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-white">
                  <User size={16} className="text-champagne" />
                </div>
                <div className="truncate max-w-[150px]">
                  <p className="text-xs font-semibold text-white truncate" title={profile?.full_name || user?.email}>
                    {profile?.full_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[9px] text-white/40 font-mono uppercase">
                    {profile?.role || 'student'} {profile?.section ? `[${profile.section}]` : ''}
                  </p>
                </div>
              </div>
              {profile?.role === 'student' && (
                <button
                  onClick={() => setShowRoleModal(true)}
                  className="w-full py-1.5 px-3 border border-white/10 hover:border-champagne/50 hover:bg-white/[0.02] rounded-xl text-[9px] font-mono text-champagne/80 hover:text-white uppercase font-bold tracking-wider transition-all"
                >
                  Request CR / Admin
                </button>
              )}
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full py-1.5 px-3 border border-white/10 hover:border-champagne/50 hover:bg-white/[0.02] rounded-xl text-[9px] font-mono text-white/50 hover:text-white uppercase font-bold tracking-wider transition-all flex items-center justify-center space-x-1"
              >
                <KeyRound size={10} />
                <span>Change Password</span>
              </button>
              <button
                onClick={signOut}
                className="w-full py-1.5 px-3 bg-red-950/20 hover:bg-red-950/40 border border-red-950/50 hover:border-red-500/50 text-red-400 rounded-xl text-[9px] font-mono uppercase font-bold tracking-wider transition-all flex items-center justify-center space-x-1"
              >
                <LogOut size={10} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            /* Public visitor footer */
            <div className="flex flex-col space-y-2 px-2">
              <button
                onClick={() => setView('login')}
                className="w-full py-2.5 px-3 bg-champagne text-obsidian rounded-xl text-[10px] font-mono uppercase font-bold tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-1.5"
              >
                <LogIn size={12} />
                <span>Sign In / Register</span>
              </button>
              <p className="font-mono text-[8px] text-white/25 text-center leading-relaxed">
                IPE'25 batch members only
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-obsidian/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around z-40 px-6">
        <button onClick={() => navigateTo('home')} className={`flex flex-col items-center ${view === 'home' ? 'text-champagne' : 'text-white/40'}`}>
          <Home size={20} />
          <span className="text-[9px] font-mono mt-1">Home</span>
        </button>
        <button onClick={() => navigateTo('harmonize')} className={`flex flex-col items-center relative ${view === 'harmonize' ? 'text-champagne' : 'text-white/40'}`}>
          <Bell size={20} />
          <span className="text-[9px] font-mono mt-1">Notices</span>
          {!user && <Lock size={8} className="absolute -top-0.5 -right-1 text-white/30" />}
        </button>
        <button onClick={() => navigateTo('accelerate')} className={`flex flex-col items-center relative ${view === 'accelerate' ? 'text-champagne' : 'text-white/40'}`}>
          <FileText size={20} />
          <span className="text-[9px] font-mono mt-1">Vault</span>
          {!user && <Lock size={8} className="absolute -top-0.5 -right-1 text-white/30" />}
        </button>
        <button onClick={() => navigateTo('preserve')} className={`flex flex-col items-center ${view === 'preserve' ? 'text-champagne' : 'text-white/40'}`}>
          <ImageIcon size={20} />
          <span className="text-[9px] font-mono mt-1">Gallery</span>
        </button>
        {user ? (
          <button onClick={() => setShowMobileProfileModal(true)} className="flex flex-col items-center text-white/40 hover:text-champagne">
            <User size={20} className="text-white/50" />
            <span className="text-[9px] font-mono mt-1">Profile</span>
          </button>
        ) : (
          <button onClick={() => setView('login')} className={`flex flex-col items-center ${view === 'login' ? 'text-champagne' : 'text-white/40'}`}>
            <LogIn size={20} />
            <span className="text-[9px] font-mono mt-1">Login</span>
          </button>
        )}
      </nav>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 md:pl-72 pb-16 md:pb-0">
        {view === 'home' && (
          <HomeView 
            setView={setView}
            navigateTo={navigateTo}
            scrollToSection={scrollToSection} 
            notices={notices}
            attachments={attachments}
            schedule={schedule}
            user={user}
          />
        )}
        {view === 'harmonize' && user && (
          <HarmonizeView 
            setView={setView} 
            notices={notices} 
            addNotice={addNotice} 
            deleteNotice={deleteNotice}
            schedule={schedule} 
            addRoutine={addRoutine}
            deleteRoutine={deleteRoutine}
            profile={profile}
          />
        )}
        {view === 'accelerate' && user && (
          <AccelerateView 
            setView={setView} 
            attachments={attachments}
            addAttachment={addAttachment}
            deleteAttachment={deleteAttachment}
            profile={profile}
          />
        )}
        {view === 'preserve' && (
          <PreserveView 
            setView={setView} 
            gallery={gallery} 
            addPhoto={addPhoto}
            deletePhoto={deletePhoto}
            profile={profile}
            user={user}
          />
        )}
        {view === 'admin' && user && profile?.role === 'admin' && (
          <AdminPanel setView={setView} />
        )}
        {view === 'login' && (
          <LoginPage onBack={() => setView('home')} />
        )}
      </main>

      {/* Role Request Escalation Overlay Modal */}
      {user && <RoleRequestModal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} />}
      {/* Change Password Modal */}
      {user && <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />}
      {/* Mobile Profile Modal */}
      {user && (
        <MobileProfileModal 
          isOpen={showMobileProfileModal} 
          onClose={() => setShowMobileProfileModal(false)} 
          profile={profile}
          user={user}
          signOut={signOut}
          setShowRoleModal={setShowRoleModal}
          setShowPasswordModal={setShowPasswordModal}
        />
      )}
    </div>
  );
}

// ==========================================
// HOME VIEW COMPONENT
// ==========================================
function HomeView({ setView, navigateTo, scrollToSection, notices, attachments, schedule, user }) {
  const heroRef = useRef(null);
  const headlineRef = useRef(null);
  const navContainerRef = useRef(null);

  // GSAP Entrance Animations
  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo(navContainerRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      );
      gsap.fromTo(headlineRef.current, 
        { y: 80, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.4, ease: "power3.out", delay: 0.2 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-transparent w-full relative">
      {/* HERO SECTION */}
      <header 
        ref={heroRef} 
        className="relative min-h-screen flex flex-col justify-between px-[5%] py-12 overflow-hidden bg-transparent border-b border-white/5"
      >
        {/* Dynamic Graphic Lines Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <svg className="w-full h-full stroke-white/5 stroke-[0.8]" fill="none">
            {/* Horizontal divider under navbar */}
            <line x1="5%" y1="80" x2="95%" y2="80" />
            {/* Vertical divider on the right side */}
            <line x1="94.2%" y1="80" x2="94.2%" y2="70%" />
            {/* Technical grid angle tick marks */}
            <line x1="83%" y1="190" x2="94.2%" y2="80" />
            <circle cx="94.2%" cy="80" r="2" fill="white" opacity="0.2" />
            <circle cx="94.2%" cy="70%" r="2" fill="white" opacity="0.2" />
          </svg>
        </div>

        {/* Integrated Top Navigation */}
        <div ref={navContainerRef} className="relative z-10 flex justify-between items-center h-12 mb-12">
          {/* Brand Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
            <img 
              src="/buet-logo.png" 
              alt="BUET Logo" 
              className="h-10 md:h-12 w-auto object-contain brightness-100 filter hover:opacity-85 transition-opacity"
            />
          </div>

          {/* Anchor links + Login */}
          <div className="flex items-center space-x-6 text-[10px] sm:text-xs font-sans tracking-wide text-white/80">
            <button onClick={() => navigateTo('harmonize')} className="hover:text-white hover-lift flex items-center space-x-1">
              <span>Notices</span>
              {!user && <Lock size={10} className="text-white/30" />}
            </button>
            <button onClick={() => navigateTo('accelerate')} className="hover:text-white hover-lift flex items-center space-x-1">
              <span>Vault</span>
              {!user && <Lock size={10} className="text-white/30" />}
            </button>
            <button onClick={() => navigateTo('preserve')} className="hover:text-white hover-lift">
              Gallery
            </button>
            {!user && (
              <button 
                onClick={() => setView('login')} 
                className="bg-champagne text-obsidian px-4 py-1.5 rounded-lg font-bold tracking-wider uppercase hover:scale-105 transition-all flex items-center space-x-1.5"
              >
                <LogIn size={12} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Spline 3D Card Container */}
        <div ref={headlineRef} className="relative z-10 w-full my-auto">
          <SplineSceneBasic />
        </div>
      </header>



      {/* C. FEATURES SECTION — "Interactive Functional Artifacts" */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full">


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1: Diagnostic Notice Shuffler */}
          <NoticeShufflerCard navigateTo={navigateTo} notices={notices} />

          {/* Card 2: Telemetry Typewriter */}
          <TelemetryTypewriterCard navigateTo={navigateTo} attachments={attachments} />

          {/* Card 3: Cursor Protocol Scheduler */}
          <CursorSchedulerCard navigateTo={navigateTo} schedule={schedule} />
        </div>
      </section>

      {/* D. PHILOSOPHY — "The Manifesto" (Interactive Console) */}
      <ManifestoSection />

      {/* E. PROTOCOL — "Sticky Stacking Archive" */}
      <ProtocolPinSection navigateTo={navigateTo} />

      {/* G. FOOTER */}
      <FooterView />
    </div>
  );
}

// ==========================================
// FEATURE CARD: NOTICE SHUFFLER
// ==========================================
function NoticeShufflerCard({ navigateTo, notices }) {
  const displayNotices = notices.slice(0, 5);

  return (
    <div 
      onClick={() => navigateTo('harmonize')}
      className="bg-ivory border border-white/10 rounded-[2.5rem] p-8 min-h-[350px] flex flex-col justify-between cursor-pointer group shadow-xl hover:shadow-2xl transition-all duration-300 select-none"
    >
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="w-10 h-10 rounded-full bg-obsidian flex items-center justify-center text-champagne">
            <Bell size={20} />
          </div>
        </div>
        <h4 className="font-sans font-extrabold text-xl text-slate-dark tracking-tight leading-snug">
          Faculty Notice Board
        </h4>
        <p className="font-sans text-xs text-slate-dark/60 mt-2">
          Departmental notifications synced automatically. Click to expand full list.
        </p>

        {/* Scrollable list of last 5 notices */}
        <div className="mt-6 space-y-3 max-h-48 overflow-y-auto pr-1 no-scrollbar">
          {displayNotices.length > 0 ? (
            displayNotices.map((notice) => (
              <div 
                key={notice.id} 
                className="bg-white border border-slate-dark/5 rounded-xl p-3 shadow-sm hover:border-champagne/45 transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[8px] bg-obsidian/5 text-slate-dark/60 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    {notice.tag}
                  </span>
                  <span className="font-mono text-[8px] text-slate-dark/40">{notice.date}</span>
                </div>
                <h5 className="font-sans font-bold text-xs text-slate-dark line-clamp-1">
                  {notice.title}
                </h5>
              </div>
            ))
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-dark/10 rounded-xl">
              <p className="font-mono text-[10px] text-slate-dark/40">No notices posted in database.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 text-champagne font-mono text-[10px] font-bold tracking-wider pt-4 border-t border-slate-dark/5 group-hover:text-obsidian transition-colors">
        <span>VIEW ALL NOTICES</span>
        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

// ==========================================
// FEATURE CARD: TELEMETRY TYPEWRITER
// ==========================================
function TelemetryTypewriterCard({ navigateTo, attachments }) {
  const displayAttachments = attachments.slice(0, 5);

  return (
    <div 
      onClick={() => navigateTo('accelerate')}
      className="bg-ivory border border-white/10 rounded-[2.5rem] p-8 min-h-[350px] flex flex-col justify-between cursor-pointer group shadow-xl hover:shadow-2xl transition-all duration-300 select-none"
    >
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="w-10 h-10 rounded-full bg-obsidian flex items-center justify-center text-champagne">
            <FileText size={18} />
          </div>
        </div>
        <h4 className="font-sans font-extrabold text-xl text-slate-dark tracking-tight leading-snug">
          Academic Resource Vault
        </h4>
        <p className="font-sans text-xs text-slate-dark/60 mt-2 font-light">
          Syllabus-aligned slide collections, worksheets, and lecture backups.
        </p>

        {/* Compact list of last 5 files */}
        <div className="mt-6 space-y-3 max-h-48 overflow-y-auto pr-1 no-scrollbar">
          {displayAttachments.length > 0 ? (
            displayAttachments.map((file) => (
              <div 
                key={file.id} 
                className="bg-white border border-slate-dark/5 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-champagne/45 transition-colors"
              >
                <div className="truncate w-[75%]">
                  <h5 className="font-sans font-bold text-xs text-slate-dark truncate">
                    {file.title}
                  </h5>
                  <div className="flex items-center space-x-1 mt-0.5 truncate">
                    <span className="font-mono text-[8px] text-slate-dark/40 shrink-0">
                      {file.term} | {file.subject}
                    </span>
                    <span className="text-slate-dark/20 font-mono text-[8px] shrink-0">•</span>
                    <span className="font-mono text-[8px] text-champagne font-semibold uppercase truncate">
                      {detectProvider(file.drive_url).name}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[9px] bg-obsidian text-champagne px-1.5 py-0.5 rounded font-semibold uppercase">
                  {file.type}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-dark/10 rounded-xl">
              <p className="font-mono text-[10px] text-slate-dark/40">No resources available.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 text-champagne font-mono text-[10px] font-bold tracking-wider pt-4 border-t border-slate-dark/5 group-hover:text-obsidian transition-colors">
        <span>ENTER FILE VAULT</span>
        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

// ==========================================
// FEATURE CARD: CURSOR SCHEDULER
// ==========================================
function CursorSchedulerCard({ navigateTo, schedule }) {
  const [selectedDay, setSelectedDay] = useState('M');
  const [selectedSection, setSelectedSection] = useState('A1');
  const days = ['S', 'M', 'T', 'W', 'T_thu', 'F', 'S_sat'];
  const dayLabels = {
    'S': 'Sun',
    'M': 'Mon',
    'T': 'Tue',
    'W': 'Wed',
    'T_thu': 'Thu',
    'F': 'Fri',
    'S_sat': 'Sat'
  };

  const dayClasses = schedule[selectedSection]?.[selectedDay] || [];

  return (
    <div 
      onClick={() => navigateTo('harmonize')}
      className="bg-ivory border border-white/10 rounded-[2.5rem] p-8 min-h-[350px] flex flex-col justify-between cursor-pointer group shadow-xl hover:shadow-2xl transition-all duration-300 select-none"
    >
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="w-10 h-10 rounded-full bg-obsidian flex items-center justify-center text-champagne">
            <Calendar size={18} />
          </div>
          {/* Section Selector Pills */}
          <div className="flex items-center space-x-1 bg-obsidian/5 border border-slate-dark/5 p-0.5 rounded-lg" onClick={(e) => e.stopPropagation()}>
            {['A1', 'A2', 'B1', 'B2'].map(sec => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                  selectedSection === sec
                    ? 'bg-champagne text-obsidian shadow-sm'
                    : 'text-slate-dark/50 hover:text-slate-dark/80'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
        <h4 className="font-sans font-extrabold text-xl text-slate-dark tracking-tight leading-snug">
          Class Routine Tracker
        </h4>
        <p className="font-sans text-xs text-slate-dark/60 mt-2 font-light">
          Monitor active schedules, classes, and lab routines for Section {selectedSection}.
        </p>

        {/* Weekly Grid Calendar */}
        <div className="relative mt-6 bg-white border border-slate-dark/10 rounded-2xl p-4 shadow-sm" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between relative h-10 items-center border-b border-slate-dark/5 pb-2">
            {days.map((day) => (
              <button 
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-sans text-xs font-bold transition-colors ${
                  selectedDay === day 
                    ? 'bg-champagne text-obsidian shadow-sm font-extrabold' 
                    : 'text-slate-dark/60 hover:bg-slate-dark/5'
                }`}
              >
                {dayLabels[day][0]}
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-24 overflow-y-auto no-scrollbar">
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="text-[9px] font-mono text-champagne font-bold uppercase">{dayLabels[selectedDay]} Schedule:</span>
            </div>
            {dayClasses.length > 0 ? (
              <div className="space-y-1">
                {dayClasses.map((item, idx) => (
                  <div key={idx} className="flex justify-between font-sans text-[11px] text-slate-dark font-semibold">
                    <span className="text-champagne font-mono font-bold mr-2">{item.time}</span>
                    <span className="truncate">{item.subject}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-sans text-xs font-medium text-slate-dark/40 mt-1 italic">
                No classes scheduled.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-champagne font-mono text-[10px] font-bold tracking-wider pt-4 border-t border-slate-dark/5 group-hover:text-obsidian transition-colors">
        <span>VIEW FULL CALENDAR</span>
        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

// ==========================================
// PROTOCOL PIN STACK SECTION
// ==========================================
function ProtocolPinSection({ navigateTo }) {
  const pinRef = useRef(null);
  const card1 = useRef(null);
  const card2 = useRef(null);
  const card3 = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinRef.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * 2.5}`,
          pin: true,
          pinSpacing: true,
          scrub: 1.2,
          anticipatePin: 1
        }
      });

      tl.fromTo(card2.current, 
        { yPercent: 100, scale: 0.95 },
        { yPercent: 0, scale: 1, ease: 'none' }
      );
      tl.to(card1.current, 
        { scale: 0.9, opacity: 0.4, filter: 'blur(10px)', ease: 'none' }, 
        '<'
      );

      tl.fromTo(card3.current, 
        { yPercent: 100, scale: 0.95 },
        { yPercent: 0, scale: 1, ease: 'none' }
      );
      tl.to(card2.current, 
        { scale: 0.9, opacity: 0.4, filter: 'blur(10px)', ease: 'none' }, 
        '<'
      );
    }, pinRef);

    // Refresh ScrollTrigger after a short delay to account for loading dynamic elements/canvas
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1500);

    return () => {
      ctx.revert();
      clearTimeout(refreshTimer);
    };
  }, []);

  return (
    <div ref={pinRef} className="relative h-screen w-full bg-transparent overflow-hidden">
      {/* CARD 1: PLAN */}
      <div 
        ref={card1}
        className="absolute inset-0 w-full h-full bg-[#121217] flex items-center justify-center p-8 md:p-16 border-t border-white/5"
      >
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">

            <h3 className="font-sans font-extrabold text-3xl sm:text-5xl text-white uppercase leading-none tracking-tight">
              PLAN THE PATH
            </h3>
            <p className="font-sans text-sm md:text-base text-white/60 leading-relaxed">
              Planning the path. Harmonize aggregates notices, routine shifts, and test timelines to map out our academic journey.
            </p>
            <button 
              onClick={() => navigateTo('harmonize')}
              className="px-6 py-3 rounded-xl bg-champagne text-obsidian font-sans font-bold text-xs tracking-wider uppercase inline-flex items-center space-x-2 transition-all hover:scale-105"
            >
              <span>Explore Notice Board</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Canvas/SVG: Rotating Gears */}
          <div className="flex items-center justify-center p-6 bg-white/[0.01] border border-white/5 rounded-[2.5rem] aspect-square max-w-sm mx-auto w-full">
            <GearClock />
          </div>
        </div>
      </div>

      {/* CARD 2: INNOVATE */}
      <div 
        ref={card2}
        className="absolute inset-0 w-full h-full bg-[#17171d] flex items-center justify-center p-8 md:p-16 border-t border-white/5"
      >
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">

            <h3 className="font-sans font-extrabold text-3xl sm:text-5xl text-white uppercase leading-none tracking-tight">
              INNOVATE THE SOLUTION
            </h3>
            <p className="font-sans text-sm md:text-base text-white/60 leading-relaxed">
              Innovating the solution. Accelerate delivers syllabus-aligned slides, sessional manuals, and resource vaults.
            </p>
            <button 
              onClick={() => navigateTo('accelerate')}
              className="px-6 py-3 rounded-xl bg-champagne text-obsidian font-sans font-bold text-xs tracking-wider uppercase inline-flex items-center space-x-2 transition-all hover:scale-105"
            >
              <span>Access Slide Vault</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Interactive Gear Assembly Simulation */}
          <div className="flex items-center justify-center p-4 bg-white/[0.01] border border-white/5 rounded-[2.5rem] aspect-square max-w-sm mx-auto w-full relative overflow-hidden">
            <GearAssembly />
          </div>
        </div>
      </div>

      {/* CARD 3: EXECUTE */}
      <div 
        ref={card3}
        className="absolute inset-0 w-full h-full bg-[#1b1b22] flex items-center justify-center p-8 md:p-16 border-t border-white/5"
      >
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">

            <h3 className="font-sans font-extrabold text-3xl sm:text-5xl text-white uppercase leading-none tracking-tight">
              EXECUTE THE VISION
            </h3>
            <p className="font-sans text-sm md:text-base text-white/60 leading-relaxed">
              Executing the vision. Preserve archives our shared achievements, field tours, sports highlights, and batch legacy.
            </p>
            <button 
              onClick={() => navigateTo('preserve')}
              className="px-6 py-3 rounded-xl bg-champagne text-obsidian font-sans font-bold text-xs tracking-wider uppercase inline-flex items-center space-x-2 transition-all hover:scale-105"
            >
              <span>Explore Photo Gallery</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Interactive Wrench Gear Repair Simulation */}
          <div className="flex items-center justify-center p-4 bg-white/[0.01] border border-white/5 rounded-[2.5rem] aspect-square max-w-sm mx-auto w-full relative overflow-hidden">
            <WrenchGear />
          </div>
        </div>
      </div>
    </div>
  );
}



// ==========================================
// HARMONIZE VIEW (NOTICES PAGE)
// ==========================================
function HarmonizeView({ setView, notices, addNotice, deleteNotice, schedule, addRoutine, deleteRoutine, profile }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [expandedNoticeId, setExpandedNoticeId] = useState(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('Academic');
  const [details, setDetails] = useState('');

  const [isClassFormOpen, setIsClassFormOpen] = useState(false);
  
  // Set default section based on CR's profile
  const isCR = profile?.role === 'cr';
  const defaultSection = isCR && profile?.section ? profile.section : 'A1';
  
  const [classSection, setClassSection] = useState(defaultSection);
  const [classDay, setClassDay] = useState('M');
  const [classTime, setClassTime] = useState('');
  const [classSubject, setClassSubject] = useState('');

  const [viewSection, setViewSection] = useState(profile?.section || 'A1');

  // Keep section updated if profile changes
  useEffect(() => {
    if (profile?.section) {
      setClassSection(profile.section);
      setViewSection(profile.section);
    }
  }, [profile]);

  const handleSubmitNotice = async (e) => {
    e.preventDefault();
    if (!title || !details) return;
    try {
      await addNotice(title, tag, details);
      setTitle('');
      setDetails('');
      setIsFormOpen(false);
    } catch (err) {
      alert('Failed to publish notice: ' + err.message);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!classTime || !classSubject) return;
    try {
      const targetSec = isCR && profile?.section ? profile.section : classSection;
      await addRoutine(targetSec, classDay, classTime, classSubject);
      setClassTime('');
      setClassSubject('');
      setIsClassFormOpen(false);
    } catch (err) {
      alert('Failed to schedule class routine: ' + err.message);
    }
  };


  const filteredNotices = notices.filter(notice => {
    const matchesFilter = filter === 'All' || notice.tag === filter;
    const matchesSearch = notice.title.toLowerCase().includes(search.toLowerCase()) || 
                          notice.details.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const dayLabels = {
    'S': 'Sunday',
    'M': 'Monday',
    'T': 'Tuesday',
    'W': 'Wednesday',
    'T_thu': 'Thursday',
    'F': 'Friday',
    'S_sat': 'Saturday'
  };

  return (
    <div className="min-h-screen bg-transparent py-16 px-6 md:px-16 max-w-5xl mx-auto w-full relative">
      <button 
        onClick={() => setView('home')}
        className="flex items-center space-x-2 font-mono text-[10px] text-champagne/80 tracking-widest uppercase hover:text-champagne hover:translate-y-[-1px] transition-all mb-8 border border-white/5 bg-white/[0.02] rounded-xl px-4 py-2.5"
      >
        <ArrowLeft size={12} />
        <span>Return Dashboard</span>
      </button>

      <div className="mb-12">
        <p className="font-mono text-xs uppercase tracking-widest text-champagne">WIDGET 01 | HARMONIZE</p>
        <h2 className="font-sans font-extrabold text-3xl md:text-5xl text-white tracking-tight uppercase leading-none mt-2">
          Faculty Notice Board
        </h2>
        <p className="font-sans text-sm text-white/50 mt-3 max-w-xl">
          Authorized class bulletins, quiz dates, submission details, and tour notices directly from faculty heads.
        </p>
      </div>

      {/* Interactive Forms Section */}
      {(profile?.role === 'admin' || profile?.role === 'cr') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Collapsible Notice Form */}
          <div className="bg-[#121217] border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setIsFormOpen(!isFormOpen)}>
              <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
                Post Faculty Notice
              </h3>
              <button className="text-champagne font-mono text-[10px] font-bold border border-white/10 px-3 py-1 rounded-lg hover:bg-white/5 transition-colors">
                {isFormOpen ? 'COLLAPSE' : 'EXPAND'}
              </button>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${isFormOpen ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
              <form onSubmit={handleSubmitNotice} className="space-y-4">
                <div>
                  <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Notice Title</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="e.g. Operations Research Class Test 3 rescheduled"
                    className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Tag / Category</label>
                  <select 
                    value={tag} 
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-[#121217] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Exam">Exam</option>
                    <option value="Events">Events</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Notice Details</label>
                  <textarea 
                    value={details} 
                    onChange={(e) => setDetails(e.target.value)} 
                    placeholder="Provide complete notice details..."
                    className="w-full h-24 bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none resize-none"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2.5 rounded-xl bg-champagne text-obsidian font-sans font-bold text-xs uppercase tracking-wider hover:scale-[1.02] transition-transform"
                >
                  Publish Notice
                </button>
              </form>
            </div>
          </div>

          {/* Collapsible Add Class Form */}
          <div className="bg-[#121217] border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setIsClassFormOpen(!isClassFormOpen)}>
              <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
                Add Class Routine Entry
              </h3>
              <button className="text-champagne font-mono text-[10px] font-bold border border-white/10 px-3 py-1 rounded-lg hover:bg-white/5 transition-colors">
                {isClassFormOpen ? 'COLLAPSE' : 'EXPAND'}
              </button>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${isClassFormOpen ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Section</label>
                    <select 
                      value={classSection} 
                      onChange={(e) => setClassSection(e.target.value)}
                      disabled={isCR}
                      className="w-full bg-[#121217] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none disabled:opacity-60"
                    >
                      {isCR && profile?.section ? (
                        <option value={profile.section}>{profile.section}</option>
                      ) : (
                        <>
                          <option value="A1">A1</option>
                          <option value="A2">A2</option>
                          <option value="B1">B1</option>
                          <option value="B2">B2</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Day of Week</label>
                    <select 
                      value={classDay} 
                      onChange={(e) => setClassDay(e.target.value)}
                      className="w-full bg-[#121217] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                    >
                      <option value="S">Sunday</option>
                      <option value="M">Monday</option>
                      <option value="T">Tuesday</option>
                      <option value="W">Wednesday</option>
                      <option value="T_thu">Thursday</option>
                      <option value="F">Friday</option>
                      <option value="S_sat">Saturday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Time Slot</label>
                    <input 
                      type="text" 
                      value={classTime} 
                      onChange={(e) => setClassTime(e.target.value)} 
                      placeholder="e.g. 9:00 AM"
                      className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Subject / Course Title</label>
                  <input 
                    type="text" 
                    value={classSubject} 
                    onChange={(e) => setClassSubject(e.target.value)} 
                    placeholder="e.g. IPE 302: Operations Research II"
                    className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2.5 rounded-xl bg-champagne text-obsidian font-sans font-bold text-xs uppercase tracking-wider hover:scale-[1.02] transition-transform"
                >
                  Schedule Class
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Routine Display Section */}
      <div className="bg-[#121217] border border-white/5 rounded-3xl p-6 shadow-xl mb-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-white/5 pb-4">
          <h3 className="font-sans font-extrabold text-lg text-white uppercase tracking-tight">Current Week Routine</h3>
          
          {/* Section Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-white/[0.02] border border-white/10 p-1 rounded-xl">
            {['A1', 'A2', 'B1', 'B2'].map(sec => (
              <button
                key={sec}
                onClick={() => setViewSection(sec)}
                className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  viewSection === sec
                    ? 'bg-champagne text-obsidian shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Section {sec}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.keys(dayLabels).map((day) => {
            const dayClasses = schedule[viewSection]?.[day] || [];
            return (
              <div key={day} className="bg-black/20 border border-white/5 rounded-2xl p-4">
                <h4 className="font-mono text-xs text-champagne font-extrabold border-b border-white/5 pb-2 mb-3">{dayLabels[day]}</h4>
                {dayClasses.length > 0 ? (
                  <div className="space-y-3">
                    {dayClasses.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start group/item py-1 border-b border-white/[0.02] last:border-0">
                        <div className="space-y-0.5 truncate pr-1">
                          <p className="font-mono text-[9px] text-white/40">{item.time}</p>
                          <p className="font-sans text-xs text-white font-bold truncate" title={item.subject}>{item.subject}</p>
                        </div>
                        {(profile?.role === 'admin' || profile?.role === 'cr' || item.created_by === user?.id) && (
                          <button
                            onClick={async () => {
                              if (confirm('Delete this routine entry?')) {
                                try {
                                  await deleteRoutine(item.id);
                                } catch (err) {
                                  alert('Failed to delete routine entry: ' + err.message);
                                }
                              }
                            }}
                            className="text-red-500/40 hover:text-red-500 transition-colors shrink-0 p-0.5 md:opacity-0 group-hover/item:opacity-100"
                            title="Delete Entry"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-sans text-xs text-white/30 italic">No classes.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-10 pb-8 border-b border-white/5">
        <div className="flex space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['All', 'Academic', 'Exam', 'Events'].map(tag => (
            <button 
              key={tag}
              onClick={() => setFilter(tag)}
              className={`px-4 py-2 rounded-xl text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
                filter === tag 
                  ? 'bg-champagne text-obsidian font-bold' 
                  : 'bg-white/[0.02] border border-white/5 text-white/60 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <input 
            type="text"
            placeholder="Search active notices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121217] border border-white/10 focus:border-champagne/50 rounded-xl pl-10 pr-4 py-2.5 text-xs font-sans text-white outline-none transition-all"
          />
          <Search size={14} className="absolute left-3.5 top-3.5 text-white/40" />
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <div 
              key={notice.id}
              onClick={() => setExpandedNoticeId(expandedNoticeId === notice.id ? null : notice.id)}
              className="group border border-white/5 bg-[#121217] hover:bg-[#15151b] rounded-2xl p-6 transition-all duration-300 cursor-pointer shadow-md hover:translate-y-[-1px]"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[9px] bg-champagne/15 text-champagne px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    {notice.tag}
                  </span>
                  <span className="font-mono text-[10px] text-white/40">{notice.date}</span>
                  {notice.author_name && (
                    <span className="font-mono text-[9px] text-white/40">
                      • Posted by: <span className="text-white/70 font-semibold">{notice.author_name}</span> ({notice.author_role})
                    </span>
                  )}
                </div>
                {(profile?.role === 'admin' || profile?.role === 'cr' || notice.author_id === profile?.id) && (
                  <button 
                    onClick={async (e) => { 
                      e.stopPropagation(); 
                      if (confirm('Delete this notice?')) {
                        try {
                          await deleteNotice(notice.id);
                        } catch (err) {
                          alert('Failed to delete notice: ' + err.message);
                        }
                      }
                    }}
                    className="text-red-500 hover:text-red-400 font-mono text-[9px] font-bold tracking-wider uppercase border border-red-950/50 bg-red-950/20 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 self-start sm:self-auto"
                  >
                    <Trash2 size={10} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
              <h3 className="font-sans font-extrabold text-lg text-white leading-snug tracking-tight">
                {notice.title}
              </h3>
              
              <div className={`font-sans text-xs text-white/60 mt-3 leading-relaxed transition-all duration-300 overflow-hidden ${
                expandedNoticeId === notice.id ? 'max-h-96 opacity-100' : 'max-h-0 sm:max-h-16 opacity-70 line-clamp-2'
              }`}>
                {notice.details}
              </div>

              <div className="mt-4 flex items-center justify-between text-champagne/80 font-mono text-[9px] font-bold tracking-widest pt-4 border-t border-white/[0.02]">
                <span>{expandedNoticeId === notice.id ? "COLLAPSE RECORD" : "EXPAND RECORD"}</span>
                <span className="text-[10px] text-white/30 font-mono">ID: 00{notice.id}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
            <p className="font-mono text-xs text-white/40">No matching notices found in database.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// ACCELERATE VIEW (ACADEMIC VAULT PAGE)
// ==========================================
function AccelerateView({ setView, attachments, addAttachment, deleteAttachment, profile }) {
  const [search, setSearch] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('All');
  const [downloadProgress, setDownloadProgress] = useState({});

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [term, setTerm] = useState('L-3 T-2');
  const [fileType, setFileType] = useState('PDF');
  const [fileSize, setFileSize] = useState('2.5 MB');
  const [driveUrl, setDriveUrl] = useState('');

  const handleSubmitResource = async (e) => {
    e.preventDefault();
    if (!title || !subject || !driveUrl) return;
    try {
      await addAttachment(title, subject, term, fileType.toUpperCase(), fileSize, driveUrl);
      setTitle('');
      setSubject('');
      setDriveUrl('');
      setFileType('PDF');
      setFileSize('2.5 MB');
      setIsFormOpen(false);
    } catch (err) {
      alert('Failed to upload resource: ' + err.message);
    }
  };

  const handleDownload = (id, targetUrl) => {
    if (downloadProgress[id]) return;

    setDownloadProgress(prev => ({ ...prev, [id]: { status: 'loading', percent: 0 } }));

    let currentPercent = 0;
    const interval = setInterval(() => {
      currentPercent += Math.floor(Math.random() * 15) + 5;
      if (currentPercent >= 100) {
        currentPercent = 100;
        clearInterval(interval);
        setDownloadProgress(prev => ({ ...prev, [id]: { status: 'done', percent: 100 } }));
        
        // Open Google Drive URL in a new window/tab
        if (targetUrl) {
          window.open(targetUrl, '_blank');
        }

        setTimeout(() => {
          setDownloadProgress(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }, 3000);
      } else {
        setDownloadProgress(prev => ({ ...prev, [id]: { status: 'loading', percent: currentPercent } }));
      }
    }, 200);
  };

  const filteredAttachments = attachments.filter(file => {
    const matchesTerm = selectedTerm === 'All' || file.term === selectedTerm;
    const matchesSearch = file.title.toLowerCase().includes(search.toLowerCase()) || 
                          file.subject.toLowerCase().includes(search.toLowerCase());
    return matchesTerm && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-transparent py-16 px-6 md:px-16 max-w-5xl mx-auto w-full relative z-10">
      <button 
        onClick={() => setView('home')}
        className="flex items-center space-x-2 font-mono text-[10px] text-champagne/80 tracking-widest uppercase hover:text-champagne hover:translate-y-[-1px] transition-all mb-8 border border-white/5 bg-white/[0.02] rounded-xl px-4 py-2.5"
      >
        <ArrowLeft size={12} />
        <span>Return Dashboard</span>
      </button>

      <div className="mb-12">
        <p className="font-mono text-xs uppercase tracking-widest text-champagne">WIDGET 02 | ACCELERATE</p>
        <h2 className="font-sans font-extrabold text-3xl md:text-5xl text-white tracking-tight uppercase leading-none mt-2">
          Academic Attachments
        </h2>
        <p className="font-sans text-sm text-white/50 mt-3 max-w-xl">
          Search, index, and retrieve official syllabi, lecture presentations, and sessional worksheets curated for IPE courses.
        </p>
      </div>

      <div>
        {/* Add Resource Form */}
        {(profile?.role === 'admin' || profile?.role === 'cr') && (
          <div className="bg-[#121217] border border-white/5 rounded-3xl p-6 shadow-xl mb-10">
            <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setIsFormOpen(!isFormOpen)}>
              <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
                Index New Academic Resource
              </h3>
              <button className="text-champagne font-mono text-[10px] font-bold border border-white/10 px-3 py-1 rounded-lg hover:bg-white/5 transition-colors">
                {isFormOpen ? 'COLLAPSE' : 'EXPAND'}
              </button>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${isFormOpen ? 'max-h-[600px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
              <form onSubmit={handleSubmitResource} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Resource Title</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="e.g. Dynamic Programming Sessional Solutions"
                      className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Subject / Course Name</label>
                    <input 
                      type="text" 
                      value={subject} 
                      onChange={(e) => setSubject(e.target.value)} 
                      placeholder="e.g. Operations Research II"
                      className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Academic Term</label>
                    <input 
                      type="text" 
                      value={term} 
                      onChange={(e) => setTerm(e.target.value)}
                      placeholder="e.g. L-3 T-2"
                      className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">File Format</label>
                    <input 
                      type="text" 
                      value={fileType} 
                      onChange={(e) => setFileType(e.target.value)} 
                      placeholder="e.g. PDF"
                      className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">File Size</label>
                    <input 
                      type="text" 
                      value={fileSize} 
                      onChange={(e) => setFileSize(e.target.value)} 
                      placeholder="e.g. 4.2 MB"
                      className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Resource Link (OneDrive / Google Drive)</label>
                  <input 
                    type="url" 
                    value={driveUrl} 
                    onChange={(e) => setDriveUrl(e.target.value)} 
                    placeholder="OneDrive (e.g. https://buet-my.sharepoint.com/:f:/...) or Google Drive link"
                    className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                    required
                  />
                  <p className="font-mono text-[8px] text-white/30 mt-1.5 tracking-wide">
                    You can host folders/files in your 1TB BUET OneDrive (Share to Copy Link with BUET/anyone permission) or Google Drive.
                  </p>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2.5 rounded-xl bg-champagne text-obsidian font-sans font-bold text-xs uppercase tracking-wider hover:scale-[1.02] transition-transform"
                >
                  Index Resource
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-10 pb-8 border-b border-white/5">
          <div className="flex space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {['All', 'L-3 T-2', 'L-3 T-1'].map(term => (
              <button 
                key={term}
                onClick={() => setSelectedTerm(term)}
                className={`px-4 py-2 rounded-xl text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
                  selectedTerm === term 
                    ? 'bg-champagne text-obsidian font-bold' 
                    : 'bg-white/[0.02] border border-white/5 text-white/60 hover:text-white'
                }`}
              >
                {term}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <input 
              type="text"
              placeholder="Search subject files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#121217] border border-white/10 focus:border-champagne/50 rounded-xl pl-10 pr-4 py-2.5 text-xs font-sans text-white outline-none transition-all"
            />
            <Search size={14} className="absolute left-3.5 top-3.5 text-white/40" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAttachments.length > 0 ? (
            filteredAttachments.map((file) => {
              const prog = downloadProgress[file.id];
              const provider = detectProvider(file.drive_url);
              return (
                <div 
                  key={file.id}
                  className="bg-[#121217] border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:bg-[#15151b] transition-all hover:translate-y-[-1px]"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-mono text-[9px] text-white/40 tracking-wider">
                        {file.term} | {file.subject}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono text-[8px] px-2 py-0.5 rounded border flex items-center space-x-1 uppercase font-semibold transition-all ${provider.color}`}>
                          <Cloud size={8} className="shrink-0" />
                          <span>{provider.name}</span>
                        </span>
                        <span className="font-mono text-[8px] bg-white/5 text-white/70 px-2 py-0.5 rounded">
                          {file.type}
                        </span>
                        {(profile?.role === 'admin' || profile?.role === 'cr' || file.uploaded_by === profile?.id) && (
                          <button 
                            onClick={async (e) => { 
                              e.stopPropagation(); 
                              if (confirm('Delete this sessional resource?')) {
                                try {
                                  await deleteAttachment(file.id);
                                } catch (err) {
                                  alert('Failed to delete sessional resource: ' + err.message);
                                }
                              }
                            }}
                            className="text-red-500/40 hover:text-red-500 transition-colors p-0.5"
                            title="Delete Resource"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="font-sans font-bold text-sm text-white line-clamp-1">{file.title}</h4>
                    <p className="font-mono text-[10px] text-white/40 mt-1">File Size: {file.size}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/[0.02]">
                    {prog ? (
                      prog.status === 'loading' ? (
                        <div className="space-y-2">
                          <div className="flex justify-between font-mono text-[9px] text-champagne/80">
                            <span>CONNECTING TO {provider.name.toUpperCase()}...</span>
                            <span>{prog.percent}%</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-champagne transition-all duration-200" style={{ width: `${prog.percent}%` }} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-[9px]">
                          <Check size={12} />
                          <span>REDIRECTING TO {provider.name.toUpperCase()}</span>
                        </div>
                      )
                    ) : (
                      <button 
                        onClick={() => handleDownload(file.id, file.drive_url)}
                        className="w-full py-2.5 rounded-xl border border-white/5 hover:border-champagne/20 hover:bg-champagne/[0.02] flex items-center justify-center space-x-2 text-[10px] font-mono text-champagne/80 uppercase tracking-widest transition-all"
                      >
                        <Download size={12} />
                        <span>DOWNLOAD FILE</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-16 bg-[#121217] border border-dashed border-white/5 rounded-2xl">
              <p className="font-mono text-xs text-white/40">No matching attachments found in database.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PRESERVE VIEW (GALLERY PAGE)
// ==========================================
function PreserveView({ setView, gallery, addPhoto, deletePhoto, profile, user }) {
  const [activeImage, setActiveImage] = useState(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [uploadType, setUploadType] = useState('preset'); // 'preset', 'url', 'file'
  const [imgUrl, setImgUrl] = useState('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800');
  const [imageFile, setImageFile] = useState(null);

  const sampleImages = [
    { label: "Manufacturing Assembly", url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800" },
    { label: "Operations Lab Session", url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800" },
    { label: "Group Study Project", url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800" },
    { label: "Campus Sunset", url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800" },
    { label: "Team Collaboration", url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800" }
  ];

  const handleSubmitPhoto = async (e) => {
    e.preventDefault();
    if (!title || !subtitle) return;
    
    try {
      let photoSource = '';
      if (uploadType === 'file') {
        if (!imageFile) throw new Error('Please select an image file to upload.');
        photoSource = imageFile;
      } else {
        if (!imgUrl) throw new Error('Please enter or select an image link.');
        photoSource = imgUrl;
      }

      await addPhoto(title, subtitle, photoSource);
      setTitle('');
      setSubtitle('');
      setImageFile(null);
      setImgUrl(sampleImages[0].url);
      setIsFormOpen(false);
    } catch (err) {
      alert('Failed to publish moment: ' + err.message);
    }
  };


  return (
    <div className="min-h-screen bg-transparent py-16 px-6 md:px-16 max-w-6xl mx-auto w-full relative z-10">
      <button 
        onClick={() => setView('home')}
        className="flex items-center space-x-2 font-mono text-[10px] text-champagne/80 tracking-widest uppercase hover:text-champagne hover:translate-y-[-1px] transition-all mb-8 border border-white/5 bg-white/[0.02] rounded-xl px-4 py-2.5"
      >
        <ArrowLeft size={12} />
        <span>Return Dashboard</span>
      </button>

      <div className="mb-12">
        <p className="font-mono text-xs uppercase tracking-widest text-champagne">WIDGET 03 | PRESERVE</p>
        <h2 className="font-sans font-extrabold text-3xl md:text-5xl text-white tracking-tight uppercase leading-none mt-2">
          Batch Moments Archive
        </h2>
        <p className="font-sans text-sm text-white/50 mt-3 max-w-xl">
          A photography museum mapping out academic tours, sessional projects, events, and milestones shared by IPE'25 students.
        </p>
      </div>

      {/* Add Photo Form — only for authenticated users */}
      {user && <div className="bg-[#121217] border border-white/5 rounded-3xl p-6 shadow-xl mb-10">
        <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setIsFormOpen(!isFormOpen)}>
          <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
            Index New Moment Photo
          </h3>
          <button className="text-champagne font-mono text-[10px] font-bold border border-white/10 px-3 py-1 rounded-lg hover:bg-white/5 transition-colors">
            {isFormOpen ? 'COLLAPSE' : 'EXPAND'}
          </button>
        </div>

        <div className={`transition-all duration-300 overflow-hidden ${isFormOpen ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
          <form onSubmit={handleSubmitPhoto} className="space-y-4">
            {/* Upload Type Selector */}
            <div className="flex space-x-2 bg-white/[0.02] border border-white/5 p-1 rounded-xl w-fit">
              {['preset', 'url', 'file'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUploadType(type)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                    uploadType === type
                      ? 'bg-champagne text-obsidian shadow-sm'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {type === 'preset' ? 'SAMPLE PRESET' : type === 'url' ? 'EXTERNAL LINK' : 'UPLOAD FILE'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Photo Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Ergonomics Sessional Group Photo"
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                  required
                />
              </div>

              {uploadType === 'preset' && (
                <div>
                  <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Unsplash Sample Preset Image</label>
                  <select 
                    value={imgUrl} 
                    onChange={(e) => setImgUrl(e.target.value)}
                    className="w-full bg-[#121217] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                  >
                    {sampleImages.map((img, i) => (
                      <option key={i} value={img.url}>{img.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {uploadType === 'url' && (
                <div>
                  <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Custom Image URL</label>
                  <input 
                    type="url" 
                    value={imgUrl} 
                    onChange={(e) => setImgUrl(e.target.value)} 
                    placeholder="Paste any custom image url here..."
                    className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
                    required
                  />
                </div>
              )}

              {uploadType === 'file' && (
                <div>
                  <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Choose Local Image File</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2 text-xs font-sans text-white outline-none"
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Moment Description</label>
              <textarea 
                value={subtitle} 
                onChange={(e) => setSubtitle(e.target.value)} 
                placeholder="Describe this batch milestone..."
                className="w-full h-24 bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none resize-none"
                required
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 rounded-xl bg-champagne text-obsidian font-sans font-bold text-xs uppercase tracking-wider hover:scale-[1.02] transition-transform"
            >
              Upload Photo to Museum
            </button>
          </form>
        </div>
      </div>}

      {/* Grid of gallery moments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {gallery.length > 0 ? (
          gallery.map((item) => (
            <div 
              key={item.id}
              onClick={() => setActiveImage(item)}
              className="group bg-[#121217] border border-white/5 rounded-3xl overflow-hidden cursor-pointer hover:border-champagne/20 transition-all hover:translate-y-[-2px] shadow-lg flex flex-col justify-between"
            >
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              </div>
              <div className="p-6">
                <h4 className="font-sans font-bold text-base text-white">{item.title}</h4>
                <p className="font-sans text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed">{item.subtitle}</p>
              </div>
              <div className="px-6 pb-6 pt-2 border-t border-white/[0.02] flex items-center justify-between font-mono text-[9px] text-champagne/80 tracking-widest font-bold">
                <span>VIEW HIGH-RES</span>
                <div className="flex items-center space-x-2">
                  {user && (profile?.role === 'admin' || profile?.role === 'cr' || item.uploaded_by === profile?.id) && (
                    <button 
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        if (confirm('Delete this moment?')) {
                          try {
                            await deletePhoto(item.id, item.img);
                          } catch (err) {
                            alert('Failed to delete moment: ' + err.message);
                          }
                        }
                      }}
                      className="text-red-500 hover:text-red-400 p-1"
                      title="Delete Moment"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <ExternalLink size={10} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-16 bg-[#121217] border border-dashed border-white/5 rounded-2xl">
            <p className="font-mono text-xs text-white/40">No photo records index in database.</p>
          </div>
        )}
      </div>

      {activeImage && (
        <div 
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-[#121217] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="aspect-video w-full">
              <img src={activeImage.img} alt={activeImage.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-8 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-sans font-extrabold text-xl text-white tracking-tight uppercase">{activeImage.title}</h3>
                <button 
                  onClick={() => setActiveImage(null)}
                  className="font-mono text-[10px] text-champagne/80 border border-champagne/20 rounded px-2.5 py-1 hover:bg-champagne/10 transition-colors"
                >
                  CLOSE
                </button>
              </div>
              <p className="font-sans text-sm text-white/60 leading-relaxed">{activeImage.subtitle}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// FOOTER COMPONENT
// ==========================================
function FooterView() {
  return (
    <footer className="bg-[#0b0b0e] border-t border-white/5 rounded-t-[3.5rem] px-8 md:px-16 py-16 mt-24">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-white/5">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <span className="font-sans font-extrabold text-xl tracking-tight text-white">IPE '25</span>
          </div>
          <p className="font-sans text-xs text-white/45 leading-relaxed">
            Academic portal for the Department of Industrial & Production Engineering, BUET Batch '25.
          </p>
        </div>

        <div className="space-y-4 col-span-2">
          <h4 className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Class Representatives (Level-1 Term-1)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="font-sans text-[11px] text-white/60">
              <p className="font-bold text-white">Mahee Muhtasim (Sec A1)</p>
              <a href="mailto:2508013@ipe.buet.ac.bd" className="text-champagne/80 hover:text-champagne font-mono hover:underline block mt-0.5">2508013@ipe.buet.ac.bd</a>
            </div>
            <div className="font-sans text-[11px] text-white/60">
              <p className="font-bold text-white">Arafat Hossain (Sec A2)</p>
              <a href="mailto:2508037@ipe.buet.ac.bd" className="text-champagne/80 hover:text-champagne font-mono hover:underline block mt-0.5">2508037@ipe.buet.ac.bd</a>
            </div>
            <div className="font-sans text-[11px] text-white/60">
              <p className="font-bold text-white">Naveed Khan (Sec B1)</p>
              <a href="mailto:2508061@ipe.buet.ac.bd" className="text-champagne/80 hover:text-champagne font-mono hover:underline block mt-0.5">2508061@ipe.buet.ac.bd</a>
            </div>
            <div className="font-sans text-[11px] text-white/60">
              <p className="font-bold text-white">Mahir Abchar Shabik (Sec B2)</p>
              <a href="mailto:2508111@ipe.buet.ac.bd" className="text-champagne/80 hover:text-champagne font-mono hover:underline block mt-0.5">2508111@ipe.buet.ac.bd</a>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <h4 className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Developer</h4>
            <div className="font-sans text-xs text-white/60 space-y-1">
              <p className="font-bold text-white">Talha Zubayer (202508059)</p>
              <a href="mailto:2508059@ipe.buet.ac.bd" className="text-champagne/80 hover:text-champagne font-mono hover:underline block mt-0.5">2508059@ipe.buet.ac.bd</a>
              <a href="mailto:talhazubayer0724@gmail.com" className="text-champagne/80 hover:text-champagne font-mono hover:underline block">talhazubayer0724@gmail.com</a>
            </div>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Official Links</h4>
            <a 
              href="https://www.buet.ac.bd" 
              target="_blank" 
              rel="noreferrer" 
              className="text-white/60 hover:text-champagne transition-all hover:translate-y-[-1px] inline-flex items-center space-x-1 font-semibold text-xs"
            >
              <span>BUET Official Website</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="font-mono text-[10px] text-white/30">
          &copy; {new Date().getFullYear()} IPE'25 BUET. ALL UTILITIES SECURED.
        </p>

        <div className="flex items-center space-x-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-4 py-1.5 font-mono text-[9px] text-emerald-500 font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>SYSTEM OPERATIONAL</span>
        </div>
      </div>
    </footer>
  );
}

// ==========================================
// INTERACTIVE MANIFESTO ENGINE SECTION
// ==========================================
function ManifestoSection() {
  const [activeTab, setActiveTab] = useState('innovate'); // 'innovate', 'plan', 'execute'
  
  return (
    <section className="py-24 px-6 md:px-12 bg-black/40 border-y border-white/5 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: `url('/hero-shapes.png')` }}
      />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="font-sans font-black text-xl sm:text-2xl text-white/55 mt-8 tracking-tight leading-none">
            We focus on:
          </h2>
          
          {/* Sleek, professional tabs for Innovate, Plan, Execute */}
          <div className="flex justify-center items-center gap-x-2 sm:gap-x-4 font-mono text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-widest text-white mt-4">
            <span 
              onClick={() => setActiveTab('innovate')}
              className={`cursor-pointer transition-all px-2 duration-300 select-none ${
                activeTab === 'innovate' 
                  ? 'text-[#BA0E24] drop-shadow-[0_0_8px_rgba(186,14,36,0.6)] scale-105' 
                  : 'text-white/20 hover:text-white/45'
              }`}
            >Innovate.</span>
            <span 
              onClick={() => setActiveTab('plan')}
              className={`cursor-pointer transition-all px-2 duration-300 select-none ${
                activeTab === 'plan' 
                  ? 'text-[#BA0E24] drop-shadow-[0_0_8px_rgba(186,14,36,0.6)] scale-105' 
                  : 'text-white/20 hover:text-white/45'
              }`}
            >Plan.</span>
            <span 
              onClick={() => setActiveTab('execute')}
              className={`cursor-pointer transition-all px-2 duration-300 select-none ${
                activeTab === 'execute' 
                  ? 'text-[#BA0E24] drop-shadow-[0_0_8px_rgba(186,14,36,0.6)] scale-105' 
                  : 'text-white/20 hover:text-white/45'
              }`}
            >Execute.</span>
          </div>
        </div>
        
        {/* Core Interactive Workspace Grid */}
        <div className="bg-[#121217] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-2xl relative animate-fadeIn">
          {/* Live Interactive Simulators (Full Width) */}
          <div className="w-full bg-[#0d0d12] border border-white/5 rounded-[2rem] p-6 min-h-[350px] flex flex-col justify-center relative overflow-hidden shadow-inner">
            {activeTab === 'innovate' && <InnovateSimulator />}
            {activeTab === 'plan' && <PlanSimulator />}
            {activeTab === 'execute' && <ExecuteSimulator />}
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// SIMULATOR 1: CPM CRITICAL PATH SCHEDULER
// ==========================================
function PlanSimulator() {
  const [selections, setSelections] = useState([0, 1, 2]); // active row indexes for stages 0, 1, 2

  const stages = [
    {
      name: '01 | Concept',
      nodes: [
        { id: 'A1', label: 'CAD Model', days: 3 },
        { id: 'A2', label: 'Sketching', days: 5 },
        { id: 'A3', label: 'AI Concept', days: 2 }
      ]
    },
    {
      name: '02 | Planning',
      nodes: [
        { id: 'B1', label: 'CPM Sched', days: 4 },
        { id: 'B2', label: 'Gantt Chart', days: 6 },
        { id: 'B3', label: 'Risk Assess', days: 3 }
      ]
    },
    {
      name: '03 | Execution',
      nodes: [
        { id: 'C1', label: 'Lean Assem', days: 7 },
        { id: 'C2', label: 'QC Bench', days: 5 },
        { id: 'C3', label: 'SCM Link', days: 6 }
      ]
    }
  ];

  const stageX = [70, 200, 330];
  const stageY = [45, 105, 165]; // adjusted for centering in a 210px height viewBox

  const selectNode = (stageIdx, nodeIdx) => {
    setSelections(prev => {
      const next = [...prev];
      next[stageIdx] = nodeIdx;
      return next;
    });
  };

  const totalDuration = stages[0].nodes[selections[0]].days + 
                        stages[1].nodes[selections[1]].days + 
                        stages[2].nodes[selections[2]].days;

  const getPathDescription = (duration) => {
    if (duration <= 10) {
      return "AGILE FAST-TRACK: Highly compressed scheduling. Suitable for rapid sessional work under tight deadlines with elevated concurrent risk.";
    } else if (duration <= 14) {
      return "BALANCED PATHWAY: Standard optimized schedule. Balances sessional reporting, resource allocation, and safety buffers efficiently.";
    } else {
      return "QUALITY-CENTRIC SCHEDULE: Extended thorough path. Ideal for complex sessional designs requiring multi-phase reviews and zero-defect checks.";
    }
  };

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-4">
      <div className="w-full flex justify-between items-center border-b border-white/5 pb-3">
        <span className="font-mono text-[10px] text-white/40 uppercase">Gantt & CPM Path Planner</span>
        <span className="font-mono text-[9px] bg-[#BA0E24]/20 text-[#BA0E24] px-2 py-0.5 rounded border border-[#BA0E24]/30 font-bold uppercase select-none">
          Click Nodes to Connect Path
        </span>
      </div>

      <div className="relative w-full aspect-[2/1] bg-black/20 rounded-2xl border border-white/5 p-2 overflow-hidden flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 400 210">
          <defs>
            <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Stage Columns Labels */}
          {stages.map((stage, idx) => (
            <text 
              key={idx}
              x={stageX[idx]} 
              y="18" 
              textAnchor="middle" 
              fill="rgba(255,255,255,0.2)" 
              className="font-mono text-[7px] tracking-widest uppercase font-bold"
            >
              {stage.name}
            </text>
          ))}

          {/* Horizontal Track Guiding Lines */}
          {stageY.map((y, idx) => (
            <line 
              key={idx}
              x1="40" 
              y1={y} 
              x2="360" 
              y2={y} 
              stroke="rgba(255,255,255,0.04)" 
              strokeWidth="1" 
              strokeDasharray="2 4" 
            />
          ))}

          {/* Potential paths (background neural network style) */}
          {stageX.map((x, sIdx) => {
            if (sIdx === stageX.length - 1) return null;
            const nextX = stageX[sIdx + 1];
            return stages[sIdx].nodes.flatMap((_, nIdx1) => 
              stages[sIdx + 1].nodes.map((_, nIdx2) => {
                const y1 = stageY[nIdx1];
                const y2 = stageY[nIdx2];
                // Check if this path segment is active
                const isActiveSegment = selections[sIdx] === nIdx1 && selections[sIdx + 1] === nIdx2;
                if (isActiveSegment) return null; // Draw active path on top later
                return (
                  <line 
                    key={`${sIdx}-${nIdx1}-${nIdx2}`}
                    x1={x} 
                    y1={y1} 
                    x2={nextX} 
                    y2={y2} 
                    stroke="rgba(255,255,255,0.06)" 
                    strokeWidth="0.8" 
                    className="transition-all duration-300"
                  />
                );
              })
            );
          })}

          {/* Active Glowing Path Segment 1 (Col 1 to Col 2) */}
          <line 
            x1={stageX[0]} 
            y1={stageY[selections[0]]} 
            x2={stageX[1]} 
            y2={stageY[selections[1]]} 
            stroke="#BA0E24" 
            strokeWidth="2.5" 
            filter="url(#glow-red)" 
            className="transition-all duration-300"
          />

          {/* Active Glowing Path Segment 2 (Col 2 to Col 3) */}
          <line 
            x1={stageX[1]} 
            y1={stageY[selections[1]]} 
            x2={stageX[2]} 
            y2={stageY[selections[2]]} 
            stroke="#BA0E24" 
            strokeWidth="2.5" 
            filter="url(#glow-red)" 
            className="transition-all duration-300"
          />

          {/* Interactive Nodes */}
          {stages.map((stage, sIdx) => {
            const x = stageX[sIdx];
            return stage.nodes.map((node, nIdx) => {
              const y = stageY[nIdx];
              const isActive = selections[sIdx] === nIdx;
              return (
                <g 
                  key={node.id} 
                  transform={`translate(${x}, ${y})`} 
                  onClick={() => selectNode(sIdx, nIdx)} 
                  className="cursor-pointer group select-none"
                >
                  <circle 
                    r="19" 
                    fill="#0d0d12" 
                    stroke={isActive ? "#BA0E24" : "rgba(255,255,255,0.15)"} 
                    strokeWidth={isActive ? "2.5" : "1"} 
                    filter={isActive ? "url(#glow-red)" : ""} 
                    className="transition-all duration-300 group-hover:scale-105" 
                  />
                  <text 
                    textAnchor="middle" 
                    y="-2" 
                    fill={isActive ? "#FAF8F5" : "rgba(255,255,255,0.6)"} 
                    className="font-mono text-[7px] font-bold pointer-events-none tracking-tight"
                  >
                    {node.label}
                  </text>
                  <text 
                    textAnchor="middle" 
                    y="7" 
                    fill={isActive ? "#BA0E24" : "rgba(255,255,255,0.4)"} 
                    className="font-mono text-[7px] font-bold pointer-events-none"
                  >
                    {node.days}d
                  </text>
                </g>
              );
            });
          })}
        </svg>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[10px] border-t border-white/5 pt-4 text-white/50">
        <div className="space-y-1">
          <div>SELECTED PATH: <span className="text-[#BA0E24] font-bold">
            {stages[0].nodes[selections[0]].label} → {stages[1].nodes[selections[1]].label} → {stages[2].nodes[selections[2]].label}
          </span></div>
          <div>CUMULATIVE DURATION: <span className="text-white font-bold">{totalDuration} DAYS</span></div>
        </div>
        <div className="space-y-1 text-left sm:text-right leading-normal">
          <div>TIME ASSUMPTION PROFILE:</div>
          <div className="text-white text-[9px] font-sans mt-0.5 max-w-sm ml-auto">{getPathDescription(totalDuration)}</div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SIMULATOR 2: QUALITY SPC CHART
// ==========================================
function InnovateSimulator() {
  const [meanOffset, setMeanOffset] = useState(0);
  const [stdDev, setStdDev] = useState(1.0);
  const [points, setPoints] = useState(() => {
    return Array.from({ length: 15 }, () => 10 + (Math.random() - 0.5) * 2);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(prev => {
        const newPoints = [...prev.slice(1)];
        // Generate normally distributed random point
        const u1 = Math.random();
        const u2 = Math.random();
        const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        // Multiply variance deviation by (1 + Math.abs(meanOffset) * 1.5) to change amplitude
        const newPoint = 10 + parseFloat(meanOffset) * 0.5 + (randStdNormal * parseFloat(stdDev) * (1 + Math.abs(parseFloat(meanOffset)) * 1.5));
        newPoints.push(newPoint);
        return newPoints;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [meanOffset, stdDev]);

  const cl = 10;
  const ucl = cl + 3 * stdDev;
  const lcl = cl - 3 * stdDev;

  const isOutOfControl = points.some(pt => pt > ucl || pt < lcl);

  const getCoordinates = () => {
    const xSpacing = 320 / 14;
    return points.map((pt, idx) => {
      const x = 10 + idx * xSpacing;
      const clampedPt = Math.max(5, Math.min(15, pt));
      const y = 130 - ((clampedPt - 5) / 10) * 120;
      return `${x},${y}`;
    }).join(' ');
  };

  const getY = (val) => {
    const clampedVal = Math.max(5, Math.min(15, val));
    return 130 - ((clampedVal - 5) / 10) * 120;
  };

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-4">
      <div className="w-full flex justify-between items-center border-b border-white/5 pb-3">
        <span className="font-mono text-[10px] text-white/40 uppercase">SPC Live Control Chart</span>
        <div className={`flex items-center space-x-1.5 font-mono text-[9px] px-2 py-0.5 rounded border font-bold uppercase select-none ${
          isOutOfControl 
            ? 'bg-[#BA0E24]/20 text-[#BA0E24] border-[#BA0E24]/30 animate-pulse' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOutOfControl ? 'bg-[#BA0E24] animate-ping' : 'bg-emerald-400'}`}></span>
          <span>{isOutOfControl ? "LIMIT VIOLATION" : "PROCESS SECURE"}</span>
        </div>
      </div>

      <div className="relative w-full aspect-[2.4/1] bg-black/20 rounded-2xl border border-white/5 p-2 overflow-hidden flex items-center justify-center">
        <svg className="w-full h-full animate-fadeIn" viewBox="0 0 340 140">
          <line x1="10" y1={getY(ucl)} x2="330" y2={getY(ucl)} stroke="#BA0E24" strokeWidth="1" strokeDasharray="3 3" className="transition-all duration-300" />
          <text x="312" y={Math.max(12, getY(ucl) - 4)} fill="#BA0E24" className="font-mono text-[7px] font-bold">UCL</text>

          <line x1="10" y1={getY(lcl)} x2="330" y2={getY(lcl)} stroke="#BA0E24" strokeWidth="1" strokeDasharray="3 3" className="transition-all duration-300" />
          <text x="312" y={Math.min(134, getY(lcl) + 8)} fill="#BA0E24" className="font-mono text-[7px] font-bold">LCL</text>

          <line x1="10" y1={getY(cl)} x2="330" y2={getY(cl)} stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
          <text x="312" y={getY(cl) - 4} fill="rgba(255,255,255,0.3)" className="font-mono text-[7px]">CL</text>

          <polyline 
            fill="none" 
            stroke="#E2E8F0" 
            strokeWidth="1.5" 
            points={getCoordinates()} 
            className="transition-all duration-300"
          />

          {points.map((pt, idx) => {
            const xSpacing = 320 / 14;
            const x = 10 + idx * xSpacing;
            const y = getY(pt);
            const isOut = pt > ucl || pt < lcl;
            return (
              <circle 
                key={idx} 
                cx={x} 
                cy={y} 
                r="2.5" 
                fill={isOut ? "#BA0E24" : "#E2E8F0"} 
                className={isOut ? "animate-pulse" : ""}
              />
            );
          })}
        </svg>
      </div>

      <div className="w-full grid grid-cols-2 gap-4 font-mono text-[10px] border-t border-white/5 pt-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-white/50">
            <span>Amplitude (Mean Offset):</span>
            <span className="text-white font-bold">{parseFloat(meanOffset) > 0 ? '+' : ''}{parseFloat(meanOffset).toFixed(1)}</span>
          </div>
          <input 
            type="range" 
            min="-1.5" 
            max="1.5" 
            step="0.3"
            value={meanOffset}
            onChange={(e) => setMeanOffset(e.target.value)}
            className="w-full accent-[#BA0E24] bg-white/10 h-1 rounded-lg outline-none cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-white/50">
            <span>Variance Limit (σ):</span>
            <span className="text-white font-bold">{parseFloat(stdDev).toFixed(2)}</span>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="1.8" 
            step="0.1"
            value={stdDev}
            onChange={(e) => setStdDev(e.target.value)}
            className="w-full accent-[#BA0E24] bg-white/10 h-1 rounded-lg outline-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SIMULATOR 3: ASSEMBLY THROUGHPUT BALANCER
// ==========================================
function ExecuteSimulator() {
  const [speed, setSpeed] = useState(3);
  const [defectRate, setDefectRate] = useState(10);
  const [yieldCount, setYieldCount] = useState(0);
  const [scrapCount, setScrapCount] = useState(0);
  const [assemblies, setAssemblies] = useState([]);
  const [lastScanResult, setLastScanResult] = useState('STANDBY');

  useEffect(() => {
    const interval = setInterval(() => {
      setAssemblies(prev => {
        let updated = prev.map(item => {
          const nextX = item.x + (speed * 1.5);
          let nextStatus = item.status;
          let alerted = item.alerted;

          // Scan at x=60%
          if (nextX >= 60 && item.x < 60 && nextStatus === 'pending') {
            const isDefective = (Math.random() * 100) < defectRate;
            nextStatus = isDefective ? 'defective' : 'clean';
            alerted = true;
          }

          return { ...item, x: nextX, status: nextStatus, alerted };
        });

        // QC feedback triggers
        const scanningItem = updated.find(item => item.x >= 60 && item.x <= 75 && item.alerted);
        if (scanningItem) {
          const expectedStatus = scanningItem.status === 'defective' ? 'REJECTED' : 'QC PASSED';
          if (lastScanResult !== expectedStatus) {
            setLastScanResult(expectedStatus);
            if (scanningItem.status === 'defective' && !scanningItem.counted) {
              setScrapCount(s => s + 1);
              scanningItem.counted = true;
            }
          }
        }

        // Increment clean yields
        const exiting = updated.filter(item => item.x >= 94);
        exiting.forEach(item => {
          if (item.status === 'clean' && !item.counted) {
            setYieldCount(y => y + 1);
            item.counted = true;
          }
        });

        // Filter objects off-belt
        return updated.filter(item => item.x < 95);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [speed, defectRate, lastScanResult]);

  // Spawner loop
  useEffect(() => {
    const spawnTimer = setInterval(() => {
      setAssemblies(prev => [
        ...prev, 
        { id: Math.random(), x: 0, status: 'pending', alerted: false, counted: false }
      ]);
    }, 3800 / speed);

    return () => clearInterval(spawnTimer);
  }, [speed]);

  const resetCounters = () => {
    setYieldCount(0);
    setScrapCount(0);
    setAssemblies([]);
    setLastScanResult('STANDBY');
  };

  const total = yieldCount + scrapCount;
  const yieldRate = total > 0 ? ((yieldCount / total) * 100).toFixed(1) : "100.0";

  return (
    <div className="w-full flex flex-col justify-between h-full space-y-4">
      <div className="w-full flex justify-between items-center border-b border-white/5 pb-3">
        <span className="font-mono text-[10px] text-white/40 uppercase">Conveyor Flow balancing</span>
        <button 
          onClick={resetCounters}
          className="font-mono text-[9px] text-[#BA0E24] hover:text-[#BA0E24]/80 transition-colors uppercase font-bold"
        >
          RESET STATS
        </button>
      </div>

      {/* Assembly line visualization */}
      <div className="relative w-full h-20 bg-black/20 rounded-2xl border border-white/5 overflow-hidden flex items-center">
        {/* Track plates */}
        <div className="absolute inset-x-0 bottom-4 h-2.5 bg-white/5 border-t border-b border-white/10 flex justify-between px-2 overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="w-2 h-full bg-white/5 transform skew-x-12" />
          ))}
        </div>


        <div className="absolute left-[60%] top-1 h-[60px] w-[1px] bg-[#BA0E24]/80 shadow-[0_0_8px_#BA0E24]">
          <span className="absolute -top-1 left-[-10px] font-mono text-[6px] bg-black/80 text-[#BA0E24] px-1 border border-[#BA0E24]/20 rounded uppercase">QC</span>
        </div>

        <div className="absolute left-[68%] bottom-1">
          <div className="w-6 h-4 border border-dashed border-[#BA0E24]/30 rounded bg-[#BA0E24]/5 flex items-center justify-center font-mono text-[6px] text-[#BA0E24] font-bold">
            BIN
          </div>
        </div>

        {/* Assemblies rendering */}
        {assemblies.map((item) => {
          const isDef = item.status === 'defective';
          let yOffset = 0;
          if (isDef && item.x > 62) {
            yOffset = Math.min(22, Math.pow(item.x - 62, 1.25));
          }

          return (
            <div 
              key={item.id}
              style={{ 
                left: `${item.x}%`,
                transform: `translateY(${yOffset}px)`,
                transition: 'left 0.1s linear, transform 0.1s ease'
              }}
              className={`absolute w-4.5 h-4.5 rounded flex items-center justify-center font-mono text-[10px] border transition-colors ${
                item.status === 'pending' ? 'bg-white/5 border-white/15 text-white/50' :
                item.status === 'clean' ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400' :
                'bg-[#BA0E24]/10 border-[#BA0E24]/35 text-[#BA0E24] animate-pulse'
              }`}
            >
              ⚙️
            </div>
          );
        })}
      </div>

      <div className="w-full grid grid-cols-3 gap-2 font-mono text-[9px] border-t border-white/5 pt-4 text-white/50">
        <div>YIELD: <span className="text-emerald-400 font-bold">{yieldCount} PCS</span></div>
        <div className="text-center">SCRAP: <span className="text-[#BA0E24] font-bold">{scrapCount} PCS</span></div>
        <div className="text-right">EFFICIENCY: <span className="text-white font-bold">{yieldRate}%</span></div>
      </div>

      {/* Sliders */}
      <div className="w-full grid grid-cols-2 gap-4 font-mono text-[10px]">
        <div className="space-y-1.5">
          <div className="flex justify-between text-white/50">
            <span>Conveyor Speed:</span>
            <span className="text-white font-bold">Level {speed}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="5" 
            step="1"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="w-full accent-[#BA0E24] bg-white/10 h-1 rounded-lg outline-none cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-white/50">
            <span>Defect Frequency:</span>
            <span className="text-white font-bold">{defectRate}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="30" 
            step="5"
            value={defectRate}
            onChange={(e) => setDefectRate(parseInt(e.target.value))}
            className="w-full accent-[#BA0E24] bg-white/10 h-1 rounded-lg outline-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ROLE UPGRADE REQUEST MODAL
// ==========================================
function RoleRequestModal({ isOpen, onClose }) {
  const { submitRoleRequest } = useRoleRequests();
  const [role, setRole] = useState('cr'); // 'cr', 'admin'
  const [section, setSection] = useState('A1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await submitRoleRequest(role, role === 'cr' ? section : null);
      setSuccess('Elevation request submitted successfully! Pending approval from the super admin.');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121217] border border-white/10 rounded-[2rem] p-8 max-w-sm w-full relative">
        <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider mb-2">Request Role Elevation</h3>
        <p className="font-sans text-xs text-white/50 mb-6">Request access to administrative utilities like notice publishing and routine edits.</p>
        
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/20 border border-red-950/50 text-red-400 font-sans text-xs flex items-start space-x-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-green-950/20 border border-green-950/50 text-green-400 font-sans text-xs flex items-start space-x-2">
            <Check size={14} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Target Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[#121217] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
            >
              <option value="cr">Class Representative (CR)</option>
              <option value="admin">Batch Administrator</option>
            </select>
          </div>

          {role === 'cr' && (
            <div>
              <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Your Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full bg-[#121217] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
              >
                <option value="A1">Section A1</option>
                <option value="A2">Section A2</option>
                <option value="B1">Section B1</option>
                <option value="B2">Section B2</option>
              </select>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 bg-white/5 border border-white/10 text-white font-mono text-[10px] font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 bg-champagne text-obsidian font-mono text-[10px] font-bold rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-1"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <span>SUBMIT</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// CHANGE PASSWORD MODAL
// ==========================================
function ChangePasswordModal({ isOpen, onClose }) {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121217] border border-white/10 rounded-[2rem] p-8 max-w-sm w-full relative">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-champagne">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">Change Password</h3>
            <p className="font-mono text-[8px] text-white/40 uppercase tracking-wider">Update your account credentials</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/20 border border-red-950/50 text-red-400 font-sans text-xs flex items-start space-x-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-xl bg-green-950/20 border border-green-950/50 text-green-400 font-sans text-xs flex items-start space-x-2">
            <Check size={14} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                onClose();
                setError(null);
                setSuccess(null);
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="w-1/2 py-2.5 bg-white/5 border border-white/10 text-white font-mono text-[10px] font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 bg-champagne text-obsidian font-mono text-[10px] font-bold rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-1"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <span>UPDATE</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// MOBILE PROFILE DETAILS MODAL
// ==========================================
function MobileProfileModal({ isOpen, onClose, profile, user, signOut, setShowRoleModal, setShowPasswordModal }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121217] border border-white/10 rounded-[2rem] p-8 max-w-sm w-full relative">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-champagne">
            <User size={22} className="text-champagne" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">Your Profile</h3>
            <p className="font-mono text-[8px] text-white/40 uppercase tracking-wider">Account Credentials & Info</p>
          </div>
        </div>

        <div className="space-y-4 font-sans text-xs bg-white/[0.02] border border-white/5 p-4 rounded-xl mb-6">
          <div className="flex justify-between items-center">
            <span className="text-white/45">Name:</span>
            <span className="font-bold text-white">{profile?.full_name || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/45">Email:</span>
            <span className="text-white/80 font-mono text-[11px]">{user?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/45">Student ID:</span>
            <span className="text-white/80 font-mono">{profile?.student_id || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/45">Role & Section:</span>
            <span className="font-bold text-champagne uppercase">
              {profile?.role || 'student'} {profile?.section ? `[${profile.section}]` : ''}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {profile?.role === 'student' && (
            <button
              onClick={() => {
                onClose();
                setShowRoleModal(true);
              }}
              className="w-full py-2.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-champagne/40 text-champagne font-mono text-[10px] font-bold rounded-xl uppercase tracking-wider transition-all"
            >
              Request CR / Admin
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              setShowPasswordModal(true);
            }}
            className="w-full py-2.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-champagne/40 text-white/80 hover:text-white font-mono text-[10px] font-bold rounded-xl uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5"
          >
            <KeyRound size={12} />
            <span>Change Password</span>
          </button>

          <button
            onClick={async () => {
              onClose();
              await signOut();
            }}
            className="w-full py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-950/50 hover:border-red-500/50 text-red-400 font-mono text-[10px] font-bold rounded-xl uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5"
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white/5 border border-white/10 text-white font-mono text-[10px] font-bold rounded-xl hover:bg-white/10 transition-all mt-4"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
