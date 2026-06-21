import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, ShieldAlert, Loader2, Sparkles, ArrowLeft, KeyRound, Mail } from 'lucide-react';

export default function LoginPage({ onBack }) {
  const { signIn, resetPassword } = useAuth();
  const [mode, setMode] = useState('login'); // 'login', 'forgot'
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'forgot') {
        if (!email) throw new Error('Please enter your registered email address.');
        await resetPassword(email);
        setSuccess('Password reset link sent! Check your email inbox.');
      } else {
        await signIn(email, password);
        // Auth state change will handle the rest
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-obsidian py-12 px-6 overflow-hidden select-none">
      {/* Decorative blurred glow indicators */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-red-950/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-950/10 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-slate-dark/45 border border-white/5 p-8 rounded-[2rem] backdrop-blur-xl relative z-10 shadow-2xl transition-all duration-300">
        
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center space-x-2 font-mono text-[10px] text-champagne/80 tracking-widest uppercase hover:text-champagne transition-all mb-6 border border-white/5 bg-white/[0.02] rounded-xl px-3 py-2"
          >
            <ArrowLeft size={12} />
            <span>Back to Portal</span>
          </button>
        )}

        {/* Branding Headers */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-champagne mb-4 shadow-inner">
            {mode === 'forgot' ? <KeyRound size={24} /> : <Sparkles size={24} />}
          </div>
          <h2 className="font-sans font-bold text-2xl tracking-tight text-white leading-none">
            {mode === 'forgot' ? 'Reset Password' : 'IPE \'25 PORTAL'}
          </h2>
          <p className="font-mono text-[9px] uppercase tracking-widest text-champagne/80 mt-2">
            {mode === 'forgot' 
              ? 'Enter your email to receive a reset link' 
              : 'BUET Industrial & Production Engineering'}
          </p>
        </div>

        {/* Success/Error Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/20 border border-red-950/50 flex items-start space-x-3 text-red-400 font-sans text-xs">
            <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-green-950/20 border border-green-950/50 flex items-start space-x-3 text-green-400 font-sans text-xs">
            <Sparkles size={16} className="text-green-500 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'forgot' && (
            <>
              <div>
                <label className="block font-mono text-[10px] uppercase text-white/50 tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="username@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-champagne/50 transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-white/50 tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-champagne/50 transition-colors"
                />
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <div>
              <label className="block font-mono text-[10px] uppercase text-white/50 tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                required
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-champagne/50 transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-obsidian font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center space-x-2 hover:bg-champagne hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : mode === 'forgot' ? (
              <>
                <Mail size={16} />
                <span>Send Reset Link</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Secure Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Toggles */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-3">
          {mode === 'forgot' ? (
            <button
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccess(null);
              }}
              className="font-mono text-[10px] uppercase tracking-wider text-champagne/60 hover:text-white transition-colors"
            >
              ← Back to Sign In
            </button>
          ) : (
            mode === 'login' && (
              <button
                onClick={() => {
                  setMode('forgot');
                  setError(null);
                  setSuccess(null);
                }}
                className="font-mono text-[10px] uppercase tracking-wider text-white/30 hover:text-champagne/60 transition-colors block mx-auto"
              >
                Forgot Password?
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
