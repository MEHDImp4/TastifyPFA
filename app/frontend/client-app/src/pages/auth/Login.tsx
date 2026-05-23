import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { 
  Loader2, 
  ShieldAlert, 
  ChevronLeft,
  Sparkles,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('IDENTIFIER_REQUIRED');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const response = await api.post('/users/login/', { username, password });
      const { access, role, username: resUsername } = response.data;
      
      if (role !== 'CLIENT') {
          await api.post('/users/logout/');
          setError("GUEST_ACCESS_ONLY");
          setIsLoading(false);
          return;
      }
      
      setAuth(access, role, resUsername);
      toast.success('AUTHENTICATION_SECURED');
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.status === 401 ? 'INVALID_PROTOCOL' : 'SYSTEM_BREACH');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background font-body selection:bg-primary/20 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=2000')] opacity-5 grayscale" />
         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
      </div>

      <Link 
        to="/" 
        aria-label="Return home"
        className="fixed top-12 left-10 z-20 group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant hover:text-primary transition-all"
      >
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-2" />
        Return
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-xl bg-surface-container border border-outline-variant rounded-[3rem] p-12 md:p-16 shadow-2xl flex flex-col items-center gap-12"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
             <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
                <Sparkles className="w-6 h-6" strokeWidth={1.5} />
             </div>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-on-surface uppercase italic tracking-tighter m-0">Welcome Back.</h1>
          <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.4em] leading-relaxed">Secure Guest Authentication</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error-msg"
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              data-testid="login-error" 
              className="w-full p-4 bg-error/5 border border-error/20 rounded-xl flex items-center gap-3"
            >
              <ShieldAlert className="w-4 h-4 text-error" />
              <p className="font-sans text-[10px] font-black text-error uppercase tracking-widest">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="w-full space-y-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="login-username-input" className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">Username</label>
              <div className="relative group">
                <input
                  id="login-username-input"
                  aria-label="Username"
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading}
                  className="w-full h-16 bg-surface-container-lowest border border-outline-variant rounded-2xl px-6 font-sans font-bold text-on-surface focus:border-primary outline-none transition-all uppercase tracking-tight"
                  placeholder="GUEST_ID"
                  data-testid="login-username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                 <label htmlFor="login-password-input" className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">Passkey</label>
                 <Link to="#" className="font-sans text-[9px] font-black text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">Recovery?</Link>
              </div>
              <div className="relative group">
                <input
                  id="login-password-input"
                  aria-label="Passkey"
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                  className="w-full h-16 bg-surface-container-lowest border border-outline-variant rounded-2xl px-6 font-sans font-bold text-on-surface focus:border-primary outline-none transition-all"
                  placeholder="••••••••"
                  data-testid="login-password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit" disabled={isLoading}
            data-testid="login-submit"
            className="w-full h-20 bg-primary text-on-primary rounded-2xl font-sans text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 border border-primary relative overflow-hidden group"
          >
             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <span>Secure Entry</span>
                <Fingerprint className="w-5 h-5 text-on-primary group-hover:text-on-primary transition-colors" />
              </>
            )}
          </button>
        </form>

        <div className="pt-6 border-t border-outline-variant/30 w-full text-center">
          <p className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">
            New to the echelon? {' '}
            <Link to="/register" className="text-primary hover:text-on-surface ml-2 transition-colors">Join Now</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
