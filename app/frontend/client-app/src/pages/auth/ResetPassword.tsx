import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Loader2, ShieldAlert, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../../api/axios';

type TokenStatus = 'checking' | 'valid' | 'invalid';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('checking');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const uid = searchParams.get('uid') ?? '';
  const token = searchParams.get('token') ?? '';

  useEffect(() => {
    let active = true;

    const validateToken = async () => {
      if (!uid || !token) {
        if (active) {
          setTokenStatus('invalid');
          setError('Ce lien de réinitialisation est invalide ou expiré.');
        }
        return;
      }

      try {
        await api.post('/users/validate-reset-token/', { uid, token });
        if (active) {
          setTokenStatus('valid');
        }
      } catch (err: any) {
        if (active) {
          setTokenStatus('invalid');
          setError(err.response?.data?.token?.[0] || 'Ce lien de réinitialisation est invalide ou expiré.');
        }
      }
    };

    void validateToken();
    return () => {
      active = false;
    };
  }, [token, uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setIsSubmitting(true);

    try {
      await api.post('/users/confirm-reset/', {
        uid,
        token,
        password,
        password_confirm: passwordConfirm,
      });
      setIsComplete(true);
      toast.success('Mot de passe mis à jour');
    } catch (err: any) {
      const responseData = err.response?.data;
      const nextError =
        responseData?.password?.[0] ||
        responseData?.password_confirm?.[0] ||
        responseData?.token?.[0] ||
        responseData?.detail ||
        'La réinitialisation a échoué. Réessayez.';
      setError(nextError);
      if (responseData?.token) {
        setTokenStatus('invalid');
      }
      toast.error(nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background font-body selection:bg-on-background/10 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute inset-0 bg-on-background/5 blur-[120px] rounded-full pointer-events-none" />

      <Link
        to="/login"
        aria-label="Retour à la connexion"
        className="fixed top-6 left-4 sm:top-8 sm:left-8 group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant hover:text-on-background transition-all min-h-[44px] min-w-[44px] justify-center z-20"
      >
        <ChevronLeft className="w-3.5 h-3.5 animate-none" />
        Retour
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-surface border border-outline rounded-2xl p-6 sm:p-10 shadow-premium relative overflow-hidden z-10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />

        <div className="space-y-8 relative z-10">
          <div className="text-center space-y-4 flex flex-col items-center">
            <div className="w-12 h-12 bg-surface-container-high border border-outline rounded-xl flex items-center justify-center text-accent shadow-premium">
              <LockKeyhole className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-on-background tracking-tight m-0 uppercase font-heading">
                Sécurité.
              </h1>
              <p className="text-[10px] font-bold text-accent uppercase tracking-[0.4em] leading-relaxed">
                Nouveau mot de passe
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                id="reset-password-error"
                role="alert"
                key="reset-password-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full form-error flex items-center gap-3"
              >
                <ShieldAlert className="w-4 h-4 text-error shrink-0" />
                <p className="font-sans text-sm font-semibold text-error">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {tokenStatus === 'checking' ? (
            <div className="w-full rounded-xl border border-outline bg-surface-container-high p-6 text-center space-y-3">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-accent" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                Vérification du lien
              </p>
            </div>
          ) : tokenStatus === 'invalid' ? (
            <div className="w-full rounded-xl border border-error/25 bg-error/5 p-6 text-center space-y-4">
              <p className="text-xs font-semibold leading-relaxed text-error">
                Ce lien de réinitialisation est invalide ou expiré.
              </p>
              <Link to="/forgot-password" className="btn-secondary w-full min-h-12 text-[10px] font-bold uppercase tracking-[0.2em]">
                Demander un lien
              </Link>
            </div>
          ) : isComplete ? (
            <div className="w-full rounded-xl border border-accent/25 bg-accent/5 p-6 text-center space-y-4">
              <p className="text-xs font-semibold leading-relaxed text-accent">
                Votre mot de passe a été mis à jour.
              </p>
              <Link to="/login" className="btn-primary w-full min-h-12 text-[10px] font-bold uppercase tracking-[0.2em]">
                Se connecter
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="w-full space-y-5">
              <div className="space-y-2">
                <label htmlFor="reset-password-input" className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em] ml-2 block">
                  Nouveau mot de passe
                </label>
                <input
                  id="reset-password-input"
                  aria-label="Nouveau mot de passe"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'reset-password-error' : undefined}
                  className="field-control"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="reset-password-confirm-input" className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em] ml-2 block">
                  Confirmer le mot de passe
                </label>
                <input
                  id="reset-password-confirm-input"
                  aria-label="Confirmer le mot de passe"
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'reset-password-error' : undefined}
                  className="field-control"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full min-h-14 tracking-[0.18em] cursor-pointer mt-4"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-on-primary" /> : <span>Mettre à jour</span>}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
