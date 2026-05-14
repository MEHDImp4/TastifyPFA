import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ArrowRight, User as UserIcon, Lock, ShieldCheck, Sparkles, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { BrandWordmark, getBrandName } from '../../components/branding/BrandWordmark';
import { useConfigStore } from '../../store/configStore';

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
  const setAuth = useAuthStore(state => state.setAuth);
  const config = useConfigStore(state => state.config);
  const brandName = getBrandName(config?.nom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/users/login/', { username, password });
      const { access, role, username: resUsername } = response.data;
      
      if (role !== 'CLIENT') {
          await api.post('/users/logout/');
          setError("Accès réservé aux clients.");
          setIsLoading(false);
          return;
      }
      
      setAuth(access, role, resUsername);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Identifiants incorrects.');
      } else {
        setError('Erreur système. Veuillez réessayer.');
      }
      setIsLoading(false);
    }
  };

  const DARK_BROWN = '#301400';
  const PRIMARY_ORANGE = '#8d4e1c';

  const visualContent = (
    <div className="h-full w-full relative flex flex-col justify-end p-12 md:p-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
            <motion.img 
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                src="https://picsum.photos/seed/tastify_auth/1200/1600" 
                className="w-full h-full object-cover opacity-60 grayscale" 
                alt="Atmosphere" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#301400] via-[#301400]/40 to-transparent" />
        </div>
        
        <div className="relative z-10 space-y-8 max-w-xl">
            <motion.div 
                variants={itemVariants}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#8d4e1c] text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-xl"
            >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Client Access</span>
            </motion.div>
            <motion.h2 
                variants={itemVariants}
                className="text-7xl font-serif italic leading-none tracking-tighter text-white"
            >
                The Gateway <br/>
                <span style={{ color: PRIMARY_ORANGE }}>to Taste.</span>
            </motion.h2>
            <motion.p 
                variants={itemVariants}
                className="text-xl leading-relaxed font-bold opacity-80"
                style={{ color: '#fff1ea' }}
            >
                Access your personalized culinary archive and secure your architectural placements at {brandName}.
            </motion.p>
        </div>
    </div>
  );

  return (
    <AuthLayout visual={visualContent}>
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12"
        >
            <div className="text-center lg:text-left space-y-4">
                <div className="hidden lg:flex items-center justify-center lg:justify-start gap-4 mb-10">
                    <BrandWordmark className="text-4xl font-bold tracking-tighter" style={{ color: PRIMARY_ORANGE }} />
                </div>
                <motion.h1 
                    variants={itemVariants}
                    className="text-6xl font-serif italic leading-none tracking-tighter"
                    style={{ color: DARK_BROWN }}
                >
                    Welcome Back.
                </motion.h1>
                <motion.p 
                    variants={itemVariants}
                    className="text-lg font-bold"
                    style={{ color: DARK_BROWN }}
                >
                    Authorize your session to continue your journey.
                </motion.p>
            </div>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="p-5 rounded-2xl bg-[#ba1a1a]/10 border-2 border-[#ba1a1a] flex items-center gap-4"
                    >
                        <ShieldAlert className="w-6 h-6 shrink-0" style={{ color: '#ba1a1a' }} strokeWidth={2.5} />
                        <p className="text-sm font-black uppercase" style={{ color: '#ba1a1a' }}>{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                    <motion.div variants={itemVariants} className="flex flex-col gap-3 group">
                        <label className="text-[11px] font-black uppercase tracking-[0.25em] ml-1" style={{ color: PRIMARY_ORANGE }} htmlFor="username">Identity Tag</label>
                        <div className="relative">
                            <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-all" style={{ color: DARK_BROWN }} strokeWidth={2.5} />
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-[#fff1ea] border-b-2 border-[#d8c2b6] rounded-t-2xl font-bold focus:border-[#8d4e1c] outline-none transition-all"
                                style={{ color: DARK_BROWN }}
                                placeholder="USERNAME"
                                disabled={isLoading}
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex flex-col gap-3 group text-left">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: PRIMARY_ORANGE }} htmlFor="password">Pass-phrase</label>
                            <Link to="#" className="text-[10px] font-black uppercase tracking-widest hover:underline" style={{ color: PRIMARY_ORANGE }}>Forgot?</Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-all" style={{ color: DARK_BROWN }} strokeWidth={2.5} />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-[#fff1ea] border-b-2 border-[#d8c2b6] rounded-t-2xl font-bold focus:border-[#8d4e1c] outline-none transition-all"
                                style={{ color: DARK_BROWN }}
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>
                    </motion.div>
                </div>

                <motion.button
                    variants={itemVariants}
                    type="submit"
                    disabled={isLoading}
                    style={{ backgroundColor: PRIMARY_ORANGE }}
                    className="w-full group relative flex items-center justify-center gap-4 py-5 text-white rounded-2xl font-black text-lg transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden shadow-2xl shadow-[#8d4e1c]/20"
                >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : (
                    <>
                        <span className="relative z-10 uppercase tracking-widest">Authorize Session</span>
                        <ArrowRight className="w-6 h-6 relative z-10 transition-transform group-hover:translate-x-1" strokeWidth={3} />
                    </>
                    )}
                </motion.button>
            </form>
            
            <motion.div variants={itemVariants} className="pt-10 border-t border-[#d8c2b6] text-center">
                <p className="text-sm font-bold" style={{ color: DARK_BROWN }}>
                    New to the ecosystem?{' '}
                    <Link to="/register" className="font-black uppercase text-xs tracking-widest hover:underline ml-2" style={{ color: PRIMARY_ORANGE }}>
                        Create Archive
                    </Link>
                </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 opacity-60">
                <ShieldCheck className="w-4 h-4" style={{ color: PRIMARY_ORANGE }} strokeWidth={2.5} />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: DARK_BROWN }}>End-to-End Cryptographic Security Active</span>
            </motion.div>
        </motion.div>

        {/* Floating decoration */}
        <motion.div
            variants={floatVariants}
            animate="animate"
            className="fixed top-12 right-12 w-24 h-24 bg-[#8d4e1c]/5 rounded-full blur-3xl pointer-events-none"
        />
    </AuthLayout>
  );
};
