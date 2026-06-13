import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { 
  Loader2, 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  User
} from 'lucide-react';
import { toast } from 'sonner';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } },
};

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const errorId = 'staff-login-error';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalized = username.trim().toLowerCase();
    if (!normalized || !password) {
      setError('Identifiant et mot de passe requis.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/users/login/', { username: normalized, password });
      const { access, role, username: resUsername } = response.data;
      setAuth(access, role, resUsername);
      toast.success('Accès autorisé');
      const roleHome: Record<string, string> = { SERVEUR: '/salle', CUISINIER: '/kds' };
      navigate(roleHome[role] ?? '/', { replace: true });
    } catch (err: any) {
      setError(err.response?.status === 401 ? 'Identifiants incorrects.' : 'Connexion impossible pour le moment.');
      toast.error('Échec de l\'authentification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-background flex items-center justify-center p-6 overflow-hidden selection:bg-on-background/10 font-body">
      <motion.div
        variants={containerVariants} initial="hidden" animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-12">
            <div className="w-12 h-12 rounded-full border border-outline flex items-center justify-center mb-6">
               <User className="w-5 h-5 text-on-surface-variant" strokeWidth={1} />
            </div>
            <h1 aria-label="Tastify Staff OS" className="text-4xl   tracking-tight text-on-background m-0 lowercase">tastify staff.</h1>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.3em] mt-3">Espace Professionnel</p>
        </motion.div>

        {/* Login Card */}
        <div className="atelier-card p-10 md:p-12">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div id={errorId} role="alert" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-8 form-error flex items-center gap-3">
                 <ShieldAlert className="w-4 h-4 text-error" strokeWidth={1.5} />
                 <span className="text-sm font-bold text-error">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <div className="space-y-3">
              <label htmlFor="staff-login-username" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Opérateur</label>
              <input
                id="staff-login-username"
                data-testid="login-username"
                type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading}
                placeholder="Identifiant"
                required aria-required="true"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                autoComplete="username"
                className="field-control"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="staff-login-password" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Code secret</label>
              <div className="relative">
                <input
                  id="staff-login-password"
                  data-testid="login-password"
                  type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                  placeholder="••••••••"
                  required aria-required="true"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                  autoComplete="current-password"
                  className="field-control pr-12"
                />
                <button
                  data-testid="login-password-visibility"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="btn-icon absolute right-2 top-1/2 -translate-y-1/2 border-transparent bg-transparent"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <button
              data-testid="login-submit"
              type="submit" disabled={isLoading}
              className="btn-primary w-full h-14"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Connexion</span>}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <motion.div variants={itemVariants} className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 text-on-surface-variant/40 font-bold text-[9px] uppercase tracking-widest">
               <span>Accès Sécurisé</span>
               <div className="w-1 h-1 rounded-full bg-outline" />
               <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" strokeWidth={1.5} /> Connexion sécurisée</span>
            </div>
            <Link to="/" className="min-h-[44px] inline-flex items-center text-[10px] font-bold text-on-surface-variant hover:text-on-background transition-colors uppercase tracking-[0.2em]">Retour au portail</Link>
        </motion.div>
      </motion.div>
    </div>
  );
};


