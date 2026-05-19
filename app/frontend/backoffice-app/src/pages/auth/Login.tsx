import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ShieldAlert, ArrowRight, Compass, Activity, ShieldCheck, Lock } from 'lucide-react';

import logoStaff from '../../assets/logo-staff.svg';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 90, damping: 20 },
  },
};

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('SAISIE_REQUISE');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/users/login/', { username, password });
      const { access, role, username: resUsername } = response.data;
      setAuth(access, role, resUsername);
      const roleHome: Record<string, string> = { SERVEUR: '/salle', CUISINIER: '/kds' };
      navigate(roleHome[role] ?? '/', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('ACCES_REFUSE');
      } else {
        setError('ERREUR_SYSTEME');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-surface flex items-center justify-center p-6 md:p-12 overflow-hidden selection:bg-primary selection:text-white">
      {/* Editorial Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#8d4e1c 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Soft Tonal Orbs for depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-container opacity-30 blur-[120px] rounded-xl mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary-container opacity-30 blur-[100px] rounded-xl mix-blend-multiply" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center"
      >
        {/* Left Side: Editorial Manifesto */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center h-full pr-8 border-r border-outline-variant/30">
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="h-[1px] w-12 bg-primary"></span>
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
                Tastify Tactical Command
              </span>
            </div>
            
            <h1 className="text-5xl xl:text-[5.5rem] font-serif leading-[1.05] tracking-tight text-on-surface">
              Precision. <br />
              <span className="italic font-light opacity-90">Heritage.</span> <br />
              Control.
            </h1>
            
            <p className="text-xl font-body leading-relaxed max-w-[45ch] text-on-surface-variant mt-8 text-balance">
              The high-end digital concierge designed to orchestrate complex hospitality operations. Authenticate to access the floor, kitchen, and analytics systems.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6 mt-16">
            <motion.div variants={itemVariants} className="flex flex-col gap-3">
              <Compass className="w-6 h-6 text-primary" strokeWidth={2} />
              <h2 className="text-lg font-serif font-bold text-on-surface">Staff OS</h2>
              <p className="text-sm font-body text-on-surface-variant leading-snug">Unified entry point for dining room, orders, and culinary coordination.</p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 animate-pulse rounded-xl" />
                <Activity className="relative w-6 h-6 text-primary" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-serif font-bold text-on-surface">Live Systems</h2>
              <p className="text-sm font-body text-on-surface-variant leading-snug">Real-time surveillance of operational activity and flow.</p>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Login Interface (Liquid Glass & Bento) */}
        <motion.div variants={itemVariants} className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <div className="w-full max-w-[440px] relative">
            
            {/* Header / Logo */}
            <motion.div variants={itemVariants} className="flex flex-col items-center lg:items-start mb-8 lg:mb-10">
              <img src={logoStaff} alt="Tastify" className="h-12 mb-4" />
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-primary"  strokeWidth={2}/>
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface">Secure Gateway</span>
              </div>
            </motion.div>

            {/* Main Login Card - Double Bezel & Glassmorphism */}
            <div className="double-bezel glass p-8 md:p-10 shadow-lg shadow-primary/10 relative group">
              <motion.div variants={itemVariants} className="mb-10">
                <h3 className="text-3xl font-serif mb-2 font-bold text-on-surface">Authentication</h3>
                <p className="font-body text-on-surface-variant text-sm">Please identify yourself to proceed.</p>
              </motion.div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-error-container/40 border border-error/20 rounded-xl p-4 flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-error shrink-0 mt-0.5" strokeWidth={2} />
                      <p className="text-xs font-bold text-error uppercase tracking-wider font-sans mt-0.5">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2 group/input">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant transition-colors group-focus-within/input:text-primary">
                    Operator ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      data-testid="login-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="E.g. MEHDI_MGR"
                      disabled={isLoading}
                      style={{ color: '#301400' }}
                      className="w-full bg-surface-container-low/50 px-4 py-3.5 font-sans font-semibold text-on-surface outline-none rounded-xl border border-outline-variant/50 focus:border-primary focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/10 transition-all duration-300 disabled:opacity-50 placeholder:text-on-surface-variant/40"
                    />
                  </div>
                </div>

                <div className="space-y-2 group/input">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant transition-colors group-focus-within/input:text-primary">
                    Passkey
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      data-testid="login-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full bg-surface-container-low/50 px-4 py-3.5 font-sans font-semibold text-on-surface outline-none rounded-xl border border-outline-variant/50 focus:border-primary focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/10 transition-all duration-300 disabled:opacity-50 placeholder:text-on-surface-variant/40"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  data-testid="login-submit"
                  disabled={isLoading}
                  className="relative w-full overflow-hidden bg-primary text-on-primary py-4 rounded-xl font-sans font-bold uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-transform duration-200 active:scale-[0.98] disabled:opacity-50 hover:shadow-lg shadow-primary/10 hover:shadow-primary/30 mt-8"
                >
                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                  
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin relative z-10"  strokeWidth={2}/>
                  ) : (
                    <div className="flex items-center gap-2 relative z-10">
                      <span>Engage</span>
                      <ArrowRight className="w-4 h-4"  strokeWidth={2}/>
                    </div>
                  )}
                </button>
              </form>
            </div>
            
            {/* Footer tags */}
            <div className="mt-8 flex items-center justify-between px-2">
              <span className="font-sans text-[9px] uppercase tracking-[0.25em] font-bold text-on-surface-variant/60">Tastify PFA v4.0</span>
              <span className="font-sans text-[9px] uppercase tracking-[0.25em] font-bold text-on-surface-variant/60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3"  strokeWidth={2}/> Encrypted
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
