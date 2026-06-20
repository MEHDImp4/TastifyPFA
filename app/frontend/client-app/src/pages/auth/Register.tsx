import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ArrowRight, ShieldAlert, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore(state => state.setAuth);
  const errorId = 'register-error-message';
  const redirectTo = searchParams.get('redirect');
  const safeRedirectTo = redirectTo?.startsWith('/') ? redirectTo : '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await api.post('/users/register/', { username, email, password, role: 'CLIENT' });
      const loginRes = await api.post('/users/login/', { username, password });
      const { access, role, username: resUsername } = loginRes.data;
      setAuth(access, role, resUsername);
      toast.success('Compte créé avec succès');
      navigate(safeRedirectTo, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.05 }
    }
  };

  const fadeIn = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-[100dvh] bg-background font-body selection:bg-on-background/10 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute inset-0 bg-on-background/5 blur-[120px] rounded-full pointer-events-none" />

      <Link 
        to="/" 
        aria-label="Retour à l'accueil"
        className="fixed top-6 left-4 sm:top-8 sm:left-8 group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant hover:text-on-background transition-all min-h-[44px] min-w-[44px] justify-center z-20"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Retour
      </Link>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md bg-surface border border-outline rounded-2xl p-6 sm:p-10 shadow-premium relative overflow-hidden z-10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        
        <div className="space-y-8 relative z-10">
          <motion.div variants={fadeIn} className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-on-background tracking-tight m-0 uppercase font-heading">Inscription.</h1>
            <p className="text-[10px] font-bold text-accent uppercase tracking-[0.4em]">Créez votre accès membre</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                id={errorId}
                role="alert"
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="form-error flex items-center gap-3"
              >
                <ShieldAlert className="w-4 h-4 text-error shrink-0" />
                <p className="font-sans text-sm font-semibold text-error">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={fadeIn} className="space-y-2">
              <label htmlFor="username" className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em] ml-1 block">Utilisateur</label>
              <input
                id="username"
                data-testid="register-username"
                type="text" required value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                autoComplete="username"
                className="field-control"
                placeholder="Nom d'utilisateur"
              />
            </motion.div>

            <motion.div variants={fadeIn} className="space-y-2">
              <label htmlFor="email" className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em] ml-1 block">Email</label>
              <input
                id="email"
                data-testid="register-email"
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                autoComplete="email"
                className="field-control"
                placeholder="votre@email.com"
              />
            </motion.div>

            <motion.div variants={fadeIn} className="space-y-2">
              <label htmlFor="password" className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em] ml-1 block">Mot de passe</label>
              <input
                id="password"
                data-testid="register-password"
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                autoComplete="new-password"
                className="field-control"
                placeholder="••••••••"
              />
            </motion.div>

            <motion.button
              variants={fadeIn}
              whileTap={{ scale: 0.98 }}
              type="submit" disabled={isLoading}
              className="btn-primary w-full min-h-14 tracking-[0.18em] group mt-4 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-on-primary" /> : (
                <>
                  <span>Créer mon profil</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-on-primary/60" />
                </>
              )}
            </motion.button>
          </form>

          <motion.div variants={fadeIn} className="pt-6 border-t border-outline text-center">
            <p className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em]">
              Déjà membre ? {' '}
              <Link to="/login" className="inline-flex min-h-11 items-center text-accent hover:text-primary ml-1 transition-colors border-b border-outline pb-0.5">Se connecter</Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
