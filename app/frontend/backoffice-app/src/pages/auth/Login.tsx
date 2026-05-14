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
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
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

  const DARK_BROWN = '#301400';
  const PRIMARY_ORANGE = '#8d4e1c';

  return (
    <div className="relative min-h-[100dvh] bg-[#fff8f5] flex items-center justify-center p-6 md:p-12 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#8d4e1c]/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#8f4d17]/10 blur-[130px] rounded-full" />
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
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: PRIMARY_ORANGE }}>
              Backoffice Access
            </span>
            <h1 className="text-5xl xl:text-7xl font-serif leading-[1.05] tracking-tight" style={{ color: DARK_BROWN }}>
              Service orchestration for the dining room, kitchen, and command floor.
            </h1>
            <p className="text-xl font-bold leading-relaxed max-w-[50ch]" style={{ color: DARK_BROWN }}>
              A curated digital concierge managing complex restaurant operations with grace and heritage-inspired precision.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            <motion.div variants={itemVariants} className="rounded-2xl border border-[#d8c2b6] p-6 space-y-3 bg-[#fff1ea]">
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: PRIMARY_ORANGE }}>
                Station Control
              </span>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#8d4e1c]/10">
                  <Compass className="w-5 h-5" style={{ color: PRIMARY_ORANGE }} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-serif font-bold" style={{ color: DARK_BROWN }}>Staff OS</h2>
              </div>
              <p className="text-sm font-bold leading-snug" style={{ color: DARK_BROWN }}>
                Un point d'entrée unique pour la salle, les commandes et la cuisine.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-2xl border border-[#d8c2b6] p-6 space-y-3 bg-[#fff1ea]">
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: PRIMARY_ORANGE }}>
                Live
              </span>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#8d4e1c]/20 animate-ping rounded-full" />
                  <div className="relative p-2 rounded-lg bg-[#8d4e1c]/10">
                    <Activity className="w-5 h-5" style={{ color: PRIMARY_ORANGE }} strokeWidth={2.5} />
                  </div>
                </div>
                <h2 className="text-2xl font-serif font-bold" style={{ color: DARK_BROWN }}>Systems Ready</h2>
              </div>
              <p className="text-sm font-bold leading-snug" style={{ color: DARK_BROWN }}>
                Surveillance en temps réel de l'activité opérationnelle.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Login Interface */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="w-full max-w-[460px] relative">
            <motion.div 
              variants={itemVariants} 
              className="flex flex-col items-center mb-8"
            >
              <img src={logoStaff} alt="Tastify" className="h-14 mb-2" />
              <span className="font-sans text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: DARK_BROWN }}>Staff OS</span>
            </motion.div>

            <div className="rounded-3xl bg-white p-8 md:p-12 shadow-2xl border border-[#d8c2b6]/30">
              <motion.div variants={itemVariants} className="mb-10 text-center lg:text-left">
                <h3 className="text-3xl font-serif mb-2 font-bold" style={{ color: DARK_BROWN }}>Bienvenue</h3>
                <p className="font-bold" style={{ color: DARK_BROWN }}>Identifiez-vous pour accéder au poste de commande.</p>
              </motion.div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-8 bg-[#ba1a1a]/10 border-2 border-[#ba1a1a] rounded-xl p-4 flex items-start gap-3"
                  >
                    <ShieldAlert className="w-5 h-5 text-[#ba1a1a] shrink-0" strokeWidth={2.5} />
                    <p className="text-sm font-black text-[#ba1a1a] uppercase">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: PRIMARY_ORANGE }}>Identifiant</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="E.G. MEHDI_MGR"
                    disabled={isLoading}
                    style={{ color: DARK_BROWN, borderBottom: `2px solid ${DARK_BROWN}` }}
                    className="w-full bg-[#fff1ea] px-4 py-3 font-bold outline-none rounded-t-lg disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: PRIMARY_ORANGE }}>Clé d'accès</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    style={{ color: DARK_BROWN, borderBottom: `2px solid ${DARK_BROWN}` }}
                    className="w-full bg-[#fff1ea] px-4 py-3 font-bold outline-none rounded-t-lg disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ backgroundColor: PRIMARY_ORANGE }}
                  className="w-full text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Connexion</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <div className="mt-12 flex items-center justify-center gap-4 border-t border-[#d8c2b6] pt-8">
                <ShieldCheck className="w-4 h-4" style={{ color: PRIMARY_ORANGE }} />
                <span className="text-[9px] uppercase tracking-widest font-black" style={{ color: DARK_BROWN }}>Secure Gateway 4.0</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-6xl px-6 flex justify-between items-center z-50">
        <span className="font-sans text-[11px] uppercase tracking-[0.2em] font-black" style={{ color: DARK_BROWN }}>Tastify PFA // 2026</span>
        <span className="font-sans text-[11px] uppercase tracking-[0.2em] font-black" style={{ color: DARK_BROWN }}>Operational Terminal 0xAF</span>
      </div>
    </div>
  );
};
