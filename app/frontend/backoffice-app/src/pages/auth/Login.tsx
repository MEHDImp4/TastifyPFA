import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { 
  Loader2, 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Terminal,
  Fingerprint
} from 'lucide-react';
import { toast } from 'sonner';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 20 } },
};

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username || !password) {
      setError('IDENTIFIER_REQUIRED');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/users/login/', { username, password });
      const { access, role, username: resUsername } = response.data;
      setAuth(access, role, resUsername);
      toast.success('ACCESS_GRANTED');
      const roleHome: Record<string, string> = { SERVEUR: '/salle', CUISINIER: '/kds' };
      navigate(roleHome[role] ?? '/', { replace: true });
    } catch (err: any) {
      setError(err.response?.status === 401 ? 'ACCESS_DENIED' : 'SYSTEM_ERROR');
      toast.error('AUTHENTICATION_FAILURE');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-background flex items-center justify-center p-6 md:p-12 overflow-hidden selection:bg-primary/20 blueprint-grid font-body">
      
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div
        variants={containerVariants} initial="hidden" animate="visible"
        className="relative z-10 w-full max-w-lg"
      >
        {/* Terminal Header */}
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center mb-6 shadow-xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
               <Terminal className="w-8 h-8 text-primary relative z-10" strokeWidth={1.5} />
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-black text-on-surface uppercase italic tracking-tighter m-0">Tastify Staff OS</h1>
            <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.4em] mt-3 opacity-60">Command Center Login</p>
        </motion.div>

        {/* Command Card */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          
          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-8 p-4 bg-error/10 border border-error/20 rounded flex items-center gap-3">
                 <ShieldAlert className="w-4 h-4 text-error" />
                 <span className="font-sans text-[10px] font-black text-error uppercase tracking-widest">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Operator ID</label>
              <div className="relative group">
                <input 
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading}
                  placeholder="ID_ALPHA_01"
                  data-testid="login-username"
                  className="w-full h-14 bg-surface-main border border-outline-variant rounded-lg px-5 font-sans font-bold text-on-surface focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/20 uppercase tracking-tight"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Access Passkey</label>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                  placeholder="••••••••"
                  data-testid="login-password"
                  className="w-full h-14 bg-surface-main border border-outline-variant rounded-lg px-5 pr-14 font-sans font-bold text-on-surface focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/20"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide access passkey' : 'Show access passkey'}
                  title={showPassword ? 'Hide access passkey' : 'Show access passkey'}
                  data-testid="login-password-visibility"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-on-surface-variant/40 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" disabled={isLoading}
              data-testid="login-submit"
              className="w-full h-16 bg-primary text-on-primary rounded-lg font-sans text-xs font-black uppercase tracking-[0.4em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 border border-primary relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <span>Authenticate</span>
                  <Fingerprint className="w-5 h-5 text-on-primary/60 group-hover:text-on-primary transition-colors" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
             <button className="font-sans text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">Protocol Recovery / Lost ID?</button>
          </div>
        </div>

        {/* System info tags */}
        <motion.div variants={itemVariants} className="mt-12 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3 text-on-surface-variant/30 font-sans text-[9px] font-black uppercase tracking-[0.4em]">
               <span>Authorized Personnel Only</span>
               <div className="w-1 h-1 rounded-full bg-outline-variant/30" />
               <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> End-to-End Encrypted</span>
            </div>
            <span className="font-mono text-[8px] text-on-surface-variant/20 uppercase tracking-widest mt-2">Node v4.2.1 • Tastify PFA</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

