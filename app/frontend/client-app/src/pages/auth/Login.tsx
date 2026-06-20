import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { 
  Loader2, 
  ShieldAlert, 
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore(state => state.setAuth);
  const errorId = 'login-error-message';
  const redirectTo = searchParams.get('redirect');
  const safeRedirectTo = redirectTo?.startsWith('/') ? redirectTo : '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const response = await api.post('/users/login/', { username, password });
      const { access, role, username: resUsername } = response.data;
      if (role !== 'CLIENT') {
          await api.post('/users/logout/');
          setError("Accès réservé aux clients");
          setIsLoading(false);
          return;
      }
      setAuth(access, role, resUsername);
      toast.success('Heureux de vous revoir');
      navigate(safeRedirectTo, { replace: true });
    } catch (err: any) {
      setError(err.response?.status === 401 ? 'Identifiants invalides' : 'Une erreur est survenue');
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
            <h1 className="text-4xl sm:text-5xl font-bold text-on-background tracking-tight m-0 uppercase font-heading">Connexion.</h1>
            <p className="text-[10px] font-bold text-accent uppercase tracking-[0.4em]">Identifiez-vous pour continuer</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                id={errorId}
                data-testid="login-error"
                role="alert"
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="form-error flex items-center gap-3"
              >
                <ShieldAlert className="w-4 h-4 text-error shrink-0" />
                <p className="font-sans text-sm font-semibold text-error">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <motion.div variants={fadeIn} className="space-y-2">
              <label htmlFor="username" className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em] ml-1 block">Utilisateur</label>
              <input
                id="username"
                data-testid="login-username"
                type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading}
                required aria-required="true"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                autoComplete="username"
                className="field-control"
                placeholder="Nom d'utilisateur"
              />
            </motion.div>

            <motion.div variants={fadeIn} className="space-y-2">
              <div className="flex justify-between items-center px-1">
                 <label htmlFor="password" className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em]">Mot de passe</label>
                 <Link to="/forgot-password" title="Mot de passe oublié" className="inline-flex min-h-11 items-center px-1 text-[9px] font-bold text-accent hover:text-primary transition-colors uppercase tracking-[0.1em]">Oublié ?</Link>
              </div>
              <input
                id="password"
                data-testid="login-password"
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                required aria-required="true"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                autoComplete="current-password"
                className="field-control"
                placeholder="••••••••"
              />
            </motion.div>

            <motion.button
              variants={fadeIn}
              whileTap={{ scale: 0.98 }}
              data-testid="login-submit"
              type="submit" disabled={isLoading}
              className="btn-primary w-full min-h-14 tracking-[0.18em] group cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-on-primary" /> : (
                <>
                  <span>Accéder au compte</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-on-primary/60" />
                </>
              )}
            </motion.button>
          </form>

          <motion.div variants={fadeIn} className="pt-6 border-t border-outline text-center">
            <p className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em]">
              Pas de compte ? {' '}
              <Link to="/register" className="inline-flex min-h-11 items-center text-accent hover:text-primary ml-1 transition-colors border-b border-outline pb-0.5 align-middle">S'inscrire</Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
