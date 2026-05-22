import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ShieldAlert, ArrowRight, Compass, Activity, ShieldCheck, Lock } from 'lucide-react';

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
    <div className="relative min-h-[100dvh] bg-background flex items-center justify-center p-6 md:p-12 overflow-hidden selection:bg-primary selection:text-white">
      {/* Editorial Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'linear-gradient(#301400 1px, transparent 1px), linear-gradient(90deg, #301400 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center"
      >
        {/* Left Side: Editorial Manifesto */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center h-full pr-8 border-r-2 border-on-surface">
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="h-[2px] w-12 bg-primary"></span>
              <span className="text-ui-label-bold text-[11px] text-primary">
                Tastify Tactical Command
              </span>
            </div>
            
            <h1 className="text-display-lg leading-[1.05] text-on-surface">
              Precision. <br />
              <span className="italic font-light">Heritage.</span> <br />
              Control.
            </h1>
            
            <p className="text-xl font-body leading-relaxed max-w-[45ch] text-on-surface-variant mt-8 text-balance">
              The high-end digital concierge designed to orchestrate complex hospitality operations. Authenticate to access the floor, kitchen, and analytics systems.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-8 mt-16">
            <motion.div variants={itemVariants} className="flex flex-col gap-3">
              <Compass className="w-6 h-6 text-primary" strokeWidth={2.5} />
              <h2 className="text-ui-label-bold text-[12px] text-on-surface">Staff OS</h2>
              <p className="text-sm font-body text-on-surface-variant leading-snug">Unified entry point for dining room, orders, and culinary coordination.</p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-3">
              <div className="relative">
                <Activity className="relative w-6 h-6 text-primary" strokeWidth={2.5} />
              </div>
              <h2 className="text-ui-label-bold text-[12px] text-on-surface">Live Systems</h2>
              <p className="text-sm font-body text-on-surface-variant leading-snug">Real-time surveillance of operational activity and flow.</p>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Login Interface */}
        <motion.div variants={itemVariants} className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <div className="w-full max-w-[440px] relative">
            
            {/* Header / Logo */}
            <motion.div variants={itemVariants} className="flex flex-col items-center lg:items-start mb-10">
              <h1 className="font-serif text-4xl text-primary leading-none italic font-bold mb-4">Tastify</h1>
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-primary"  strokeWidth={2.5}/>
                <span className="text-ui-label-bold text-[10px] text-on-surface">Secure Gateway</span>
              </div>
            </motion.div>

            {/* Main Login Card - Hard Borders & Tonal Layering */}
            <div className="bg-surface-container border-2 border-on-surface p-8 md:p-10 shadow-[8px_8px_0px_#301400] relative group">
              <motion.div variants={itemVariants} className="mb-10">
                <h3 className="text-ui-label-bold text-[14px] mb-2 text-on-surface">AUTHENTICATION REQUIRED</h3>
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
                    <div className="bg-error border-2 border-on-surface p-4 flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-on-error shrink-0" strokeWidth={2.5} />
                      <p className="text-ui-label-bold text-[10px] text-on-error mt-0.5">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2 group/input">
                  <label className="block text-ui-label-bold text-[10px] text-on-surface-variant transition-colors group-focus-within/input:text-primary">
                    Operator ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      data-testid="login-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="MEHDI_MGR"
                      disabled={isLoading}
                      className="w-full bg-background px-4 py-3.5 text-ui-data-dense font-black text-on-surface outline-none border-2 border-on-surface focus:bg-white focus:shadow-[4px_4px_0px_#301400] transition-all duration-150 disabled:opacity-50 placeholder:text-on-surface-variant/30"
                    />
                  </div>
                </div>

                <div className="space-y-2 group/input">
                  <label className="block text-ui-label-bold text-[10px] text-on-surface-variant transition-colors group-focus-within/input:text-primary">
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
                      className="w-full bg-background px-4 py-3.5 text-ui-data-dense font-black text-on-surface outline-none border-2 border-on-surface focus:bg-white focus:shadow-[4px_4px_0px_#301400] transition-all duration-150 disabled:opacity-50 placeholder:text-on-surface-variant/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  data-testid="login-submit"
                  disabled={isLoading}
                  className="relative w-full bg-primary text-on-primary py-4 border-2 border-on-surface font-ui-button text-ui-button flex items-center justify-center gap-3 transition-all duration-150 active:translate-y-[2px] active:shadow-none hover:shadow-[4px_4px_0px_#301400] disabled:opacity-50 mt-8"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin relative z-10"  strokeWidth={2.5}/>
                  ) : (
                    <div className="flex items-center gap-2 relative z-10 uppercase tracking-[0.2em] font-black">
                      <span>Engage</span>
                      <ArrowRight className="w-4 h-4"  strokeWidth={2.5}/>
                    </div>
                  )}
                </button>
              </form>
            </div>
            
            {/* Footer tags */}
            <div className="mt-8 flex items-center justify-between px-2">
              <span className="text-ui-data-dense text-[9px] uppercase tracking-[0.25em] font-black text-on-surface-variant/60">Tastify PFA v4.0</span>
              <span className="text-ui-data-dense text-[9px] uppercase tracking-[0.25em] font-black text-on-surface-variant/60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3"  strokeWidth={2}/> Encrypted
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
