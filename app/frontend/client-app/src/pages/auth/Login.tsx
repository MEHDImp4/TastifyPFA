import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ArrowRight, User as UserIcon, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { BrandWordmark, getBrandName } from '../../components/branding/BrandWordmark';
import { useConfigStore } from '../../store/configStore';

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
          setError("Ce portail est réservé aux clients. Veuillez utiliser l'accès staff.");
          setIsLoading(false);
          return;
      }
      
      setAuth(access, role, resUsername);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Identifiants incorrects.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
      setIsLoading(false);
    }
  };

  const visualContent = (
    <>
        <div className="absolute inset-0 z-0">
            <motion.img 
                layoutId="auth-image-bg"
                initial={{ scale: 1.1, filter: 'grayscale(100%)' }}
                animate={{ scale: 1, filter: 'grayscale(100%)' }}
                transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                src="https://picsum.photos/seed/tastify_auth/1200/1600" 
                className="w-full h-full object-cover opacity-40 hover:grayscale-0 transition-all duration-2000" 
                alt="Atmosphere" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface via-on-surface/20 to-transparent" />
        </div>
        
        <div className="relative z-10 space-y-8 max-w-xl">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] border border-primary/20 backdrop-blur-md"
            >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Client Access</span>
            </motion.div>
            <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-7xl font-display-accent italic text-white leading-none tracking-tighter"
            >
                The Gateway <br/>
                <span className="text-primary opacity-80">to Taste.</span>
            </motion.h2>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-xl text-white/50 leading-relaxed font-sans font-medium"
            >
                Access your personalized culinary archive and secure your architectural placements at {brandName}.
            </motion.p>
        </div>
    </>
  );

  return (
    <AuthLayout visual={visualContent}>
        <div className="text-center lg:text-left space-y-4">
            <div className="hidden lg:flex items-center justify-center lg:justify-start gap-4 mb-8">
                <BrandWordmark className="font-sans text-4xl font-bold tracking-tight text-primary" />
            </div>
            <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-5xl font-display-accent italic text-on-surface leading-none tracking-tight"
            >
                Welcome Back.
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-on-surface-variant font-medium"
            >
                Authorize your session to continue your journey.
            </motion.p>
        </div>

        {error && (
            <div className="p-5 rounded-2xl bg-error-container/20 border border-error/20 text-error text-sm text-center font-bold animate-in shake duration-500">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                <div className="flex flex-col gap-3 group">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 ml-1 transition-opacity group-focus-within:opacity-100" htmlFor="username">Identity Tag</label>
                    <div className="relative">
                        <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-20 group-focus-within:text-primary group-focus-within:opacity-100 transition-all" />
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 bg-surface-container-low border border-surface-container-high rounded-2xl text-on-surface font-bold focus:bg-white focus:outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all"
                            placeholder="Username"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3 group text-left">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 transition-opacity group-focus-within:opacity-100" htmlFor="password">Pass-phrase</label>
                        <Link to="#" className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline">Forgot?</Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-20 group-focus-within:text-primary group-focus-within:opacity-100 transition-all" />
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 bg-surface-container-low border border-surface-container-high rounded-2xl text-on-surface font-bold focus:bg-white focus:outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all"
                            placeholder="••••••••"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative flex items-center justify-center gap-4 py-5 bg-primary text-white rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/30 active:scale-95 disabled:opacity-50 overflow-hidden shadow-xl shadow-primary/10"
            >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : (
                <>
                    <span className="relative z-10">Authorize Session</span>
                    <ArrowRight className="w-6 h-6 relative z-10 transition-transform group-hover:translate-x-1" />
                </>
                )}
            </button>
        </form>
        
        <div className="pt-10 border-t border-surface-container-high text-center">
            <p className="text-sm font-medium text-on-surface-variant">
                New to the ecosystem?{' '}
                <Link to="/register" className="font-black uppercase text-xs tracking-widest text-primary hover:underline ml-2">
                    Create Archive
                </Link>
            </p>
        </div>

        <div className="flex items-center justify-center gap-3 opacity-30">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em]">End-to-End Cryptographic Security Active</span>
        </div>
    </AuthLayout>
  );
};
