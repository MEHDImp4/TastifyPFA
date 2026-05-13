import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ShieldAlert, Cpu, Terminal, ArrowRight } from 'lucide-react';

import logoStaff from '../../assets/logo-staff.svg';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
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
      setError('FIELD_ERROR: MISSING_CREDENTIALS');
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
        setError('AUTH_ERROR: INVALID_CREDENTIALS');
      } else {
        setError('SYS_ERROR: UNEXPECTED_EXCEPTION');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-background selection:bg-primary selection:text-white flex flex-col items-center justify-center p-4 scanlines overflow-hidden">
      {/* Structural Grid Background Decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-px bg-zinc-800" />
        <div className="absolute top-10 left-10 h-40 w-px bg-zinc-800" />
        <div className="absolute bottom-10 right-10 w-40 h-px bg-zinc-800" />
        <div className="absolute bottom-10 right-10 h-40 w-px bg-zinc-800" />
        
        <div className="absolute top-1/4 -left-4 font-mono text-[8px] tracking-[0.4em] text-zinc-800 uppercase vertical-text">
          Telemetry stream active // 0xAF32 // Unit-01
        </div>
        <div className="absolute top-1/4 -right-4 font-mono text-[8px] tracking-[0.4em] text-zinc-800 uppercase vertical-text">
          Tastify Systems Protocol // Rev 4.0
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        {/* Top Telemetry Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 border border-zinc-800">
              <Cpu className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="telemetry-label">Access Terminal</p>
              <p className="font-sans font-bold text-xs uppercase tracking-wider text-white">Station 01-A</p>
            </div>
          </div>
          <div className="text-right">
            <p className="telemetry-label">Status</p>
            <div className="flex items-center justify-end gap-2">
              <span className="w-1.5 h-1.5 bg-primary animate-pulse" />
              <span className="font-mono text-[10px] text-primary">ENCRYPTED_AUTH</span>
            </div>
          </div>
        </motion.div>

        {/* Main Interface Box */}
        <section className="glass-terminal p-8 relative overflow-hidden">
          {/* Internal Crosshairs */}
          <div className="absolute top-2 left-2 text-zinc-800"><span className="font-mono text-[10px]">+</span></div>
          <div className="absolute top-2 right-2 text-zinc-800"><span className="font-mono text-[10px]">+</span></div>
          <div className="absolute bottom-2 left-2 text-zinc-800"><span className="font-mono text-[10px]">+</span></div>
          <div className="absolute bottom-2 right-2 text-zinc-800"><span className="font-mono text-[10px]">+</span></div>

          <motion.div variants={itemVariants} className="mb-8 text-center">
            <img src={logoStaff} alt="Tastify Staff" className="mx-auto h-16 w-auto grayscale brightness-200" />
            <h1 className="mt-6 text-4xl font-black leading-none tracking-tighter text-white">
              STAFF OS
            </h1>
            <p className="mt-2 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              Command & Control Interface
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="mb-6 bg-error/10 border border-error/20 p-3 flex items-start gap-3"
              >
                <ShieldAlert className="w-5 h-5 text-error shrink-0" strokeWidth={1.5} />
                <div className="font-mono text-[10px] text-error leading-relaxed uppercase">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="telemetry-label block" htmlFor="username">
                [ USER_IDENTITY ]
              </label>
              <div className="relative group">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 px-4 py-3.5 font-mono text-sm text-white focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                  placeholder="IDENTIFIER"
                  disabled={isLoading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                  <Terminal className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <label className="telemetry-label block" htmlFor="password">
                [ ACCESS_KEY ]
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 px-4 py-3.5 font-mono text-sm text-white focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                placeholder="********"
                disabled={isLoading}
              />
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="group relative w-full bg-primary py-4 flex items-center justify-center gap-3 overflow-hidden disabled:bg-zinc-800 disabled:cursor-not-allowed"
            >
              {/* Button Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              
              <span className="font-sans font-black text-sm uppercase tracking-widest text-white relative z-10">
                {isLoading ? 'ESTABLISHING_LINK...' : 'INITIALIZE_AUTH'}
              </span>
              
              {!isLoading && (
                <ArrowRight className="w-4 h-4 text-white relative z-10 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              )}
              
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white relative z-10" strokeWidth={2.5} />}
            </motion.button>
          </form>
        </section>

        {/* Footer Technical Metadata */}
        <motion.div variants={itemVariants} className="mt-8 flex items-center justify-between">
          <div className="font-mono text-[9px] text-zinc-600 uppercase">
            Built for Tactical Efficiency // Tastify PFA v4.2
          </div>
          <div className="font-mono text-[9px] text-zinc-600 uppercase flex items-center gap-2">
            <span className="w-1 h-1 bg-zinc-700 rounded-full" />
            0x42_STAFF_NODE
          </div>
        </motion.div>
      </motion.div>

      {/* Extreme Visual Detail: Fixed Corner ID */}
      <div className="fixed bottom-6 left-6 font-mono text-[8px] text-zinc-800 uppercase tracking-widest mix-blend-difference hidden md:block">
        Tstfy // Cmd-OS // 2026
      </div>

      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
