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
    <div className="min-h-[100dvh] bg-background font-body selection:bg-primary/20 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
      </div>

      <Link
        to="/login"
        aria-label="Retour à la connexion"
        className="fixed top-6 left-4 sm:top-12 sm:left-10 z-20 group flex items-center gap-3 text-[10px] font-black tracking-[0.2em] text-on-surface-variant hover:text-primary transition-all min-h-[44px] min-w-[44px] justify-center"
      >
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-2" />
        Retour
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-xl bg-surface-container border border-outline-variant rounded-lg p-8 md:p-12 shadow-sm flex flex-col items-center gap-10"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
              <LockKeyhole className="w-6 h-6" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className=" text-4xl md:text-5xl font-black text-on-surface tracking-tighter m-0">
            Nouveau mot de passe
          </h1>
          <p className="font-sans text-[11px] font-black text-on-surface-variant tracking-[0.2em] leading-relaxed">
            Choisissez un mot de passe pour votre compte
          </p>
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
              <ShieldAlert className="w-4 h-4 text-error" />
              <p className="font-sans text-sm font-bold text-error">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {tokenStatus === 'checking' ? (
          <div className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            <p className="mt-4 font-sans text-xs font-black uppercase tracking-[0.3em] text-on-surface">
              Vérification du lien
            </p>
          </div>
        ) : tokenStatus === 'invalid' ? (
          <div className="w-full rounded-2xl border border-error/20 bg-error/5 p-8 text-center">
            <p className="font-sans text-xs font-black uppercase tracking-[0.3em] text-error">
              Ce lien de réinitialisation est invalide ou expiré.
            </p>
            <Link to="/forgot-password" className="mt-6 min-h-11 inline-flex items-center text-sm font-black uppercase tracking-[0.2em] text-primary hover:text-on-surface">
              Demander un nouveau lien
            </Link>
          </div>
        ) : isComplete ? (
          <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <p className="font-sans text-xs font-black uppercase tracking-[0.3em] text-on-surface">
              Votre mot de passe a été mis à jour.
            </p>
            <Link to="/login" className="mt-6 min-h-11 inline-flex items-center text-sm font-black uppercase tracking-[0.2em] text-primary hover:text-on-surface">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="w-full space-y-8">
            <div className="space-y-2">
              <label htmlFor="reset-password-input" className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">
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
                className="field-control min-h-16 rounded-lg px-6"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="reset-password-confirm-input" className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">
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
                className="field-control min-h-16 rounded-lg px-6"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full min-h-14 gap-4 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Mettre à jour</span>}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
