import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ShieldAlert, ArrowRight, Compass, Activity, ShieldCheck } from 'lucide-react';

import logoStaff from '../../assets/logo-staff.svg';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 80, damping: 18 },
  },
};

const floatVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
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
      setError('Saisie requise : Identifiants manquants');
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
        setError('Accès refusé : Identifiants invalides');
      } else {
        setError('Erreur système : Liaison interrompue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-background flex items-center justify-center p-6 md:p-12 overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[150px] rounded-full" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
      >
        {/* Left Side: Editorial Content */}
        <div className="hidden lg:block space-y-8">
          <motion.div variants={itemVariants} className="space-y-4">
            <span className="editorial-kicker">Backoffice Access</span>
            <h1 className="text-5xl xl:text-7xl font-serif text-on-background leading-[1.05] tracking-tight">
              Service orchestration for the dining room, kitchen, and command floor.
            </h1>
            <p className="text-xl text-on-surface font-body leading-relaxed max-w-[50ch]">
              A curated digital concierge managing complex restaurant operations with grace and heritage-inspired precision.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            <motion.div variants={itemVariants} className="double-bezel p-6 space-y-3 bg-surface-container-low/80">
              <span className="editorial-kicker text-[10px]">Station Control</span>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Compass className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-serif text-on-surface">Staff OS</h2>
              </div>
              <p className="text-sm text-on-surface-variant font-body">
                Un point d'entrée unique pour la salle, les commandes et la cuisine.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="double-bezel p-6 space-y-3 bg-surface-container-low/80">
              <span className="editorial-kicker text-[10px]">Live</span>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 animate-ping rounded-full" />
                  <div className="relative p-2 rounded-lg bg-primary/10">
                    <Activity className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                </div>
                <h2 className="text-2xl font-serif text-on-surface">Systems Ready</h2>
              </div>
              <p className="text-sm text-on-surface-variant font-body">
                Surveillance en temps réel de l'activité opérationnelle.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Login Interface */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="w-full max-w-[460px] relative">
            {/* Logo area above the card */}
            <motion.div 
              variants={itemVariants} 
              className="flex flex-col items-center mb-8"
            >
              <img src={logoStaff} alt="Tastify" className="h-14 mb-2" />
              <div className="flex items-center gap-2">
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface/40">Staff OS</span>
              </div>
            </motion.div>

            <div className="double-bezel bg-surface-container-lowest p-8 md:p-12 shadow-2xl shadow-primary/5">
              <motion.div variants={itemVariants} className="mb-10 text-center lg:text-left">
                <h3 className="text-3xl font-serif mb-2">Bienvenue</h3>
                <p className="text-on-surface-variant font-body">Identifiez-vous pour accéder au poste de commande.</p>
              </motion.div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8 overflow-hidden"
                  >
                    <div className="bg-error/5 border border-error/20 rounded-xl p-4 flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-error shrink-0" strokeWidth={1.5} />
                      <p className="text-sm font-sans font-medium text-error leading-tight">
                        {error}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={itemVariants} className="space-y-2">
                  <label htmlFor="username" className="editorial-kicker text-[10px]">Identifiant</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. mehdi_mgr"
                    disabled={isLoading}
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3 font-sans transition-all outline-none rounded-t-lg disabled:opacity-50"
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <label htmlFor="password" className="editorial-kicker text-[10px]">Clé d'accès</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3 font-sans transition-all outline-none rounded-t-lg disabled:opacity-50"
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full bg-primary text-white py-4 rounded-xl font-sans font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Connexion</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </motion.div>
              </form>

              <motion.div variants={itemVariants} className="mt-12 flex items-center justify-center gap-4 border-t border-outline-variant/30 pt-8">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary/40" />
                  <span className="font-sans text-[9px] uppercase tracking-widest text-on-surface/40 font-bold">Secure Gateway 4.0</span>
                </div>
              </motion.div>
            </div>

            {/* Floating decoration for high-end feel */}
            <motion.div
              variants={floatVariants}
              animate="animate"
              className="absolute -top-6 -right-6 w-12 h-12 bg-primary/20 rounded-full blur-xl"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Footer Meta */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-6xl px-6 flex justify-between items-center opacity-80">
        <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface">Tastify PFA // 2026</span>
        <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface">Operational Terminal 0xAF</span>
      </div>
    </div>
  );
};
