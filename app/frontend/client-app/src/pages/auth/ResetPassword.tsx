import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Loader2, ShieldAlert, Sparkles } from 'lucide-react';
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
          setError('JETON_DE_RÉINITIALISATION_INVALIDE');
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
          setError(err.response?.data?.token?.[0] || 'JETON_DE_RÉINITIALISATION_INVALIDE');
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
    setIsSubmitting(true);

    try {
      await api.post('/users/confirm-reset/', {
        uid,
        token,
        password,
        password_confirm: passwordConfirm,
      });
      setIsComplete(true);
      toast.success('MOT_DE_PASSE_MIS_À_JOUR');
    } catch (err: any) {
      const responseData = err.response?.data;
      const nextError =
        responseData?.password?.[0] ||
        responseData?.password_confirm?.[0] ||
        responseData?.token?.[0] ||
        responseData?.detail ||
        'ÉCHEC_RÉINITIALISATION';
      setError(nextError);
      if (responseData?.token) {
        setTokenStatus('invalid');
      }
      toast.error('ÉCHEC_RÉINITIALISATION');
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
        className="fixed top-12 left-10 z-20 group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant hover:text-primary transition-all"
      >
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-2" />
        Retour
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-xl bg-surface-container border border-outline-variant rounded-[3rem] p-12 md:p-16 shadow-2xl flex flex-col items-center gap-12"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
              <Sparkles className="w-6 h-6" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-on-surface uppercase  tracking-tighter m-0">
            Réédition du Code.
          </h1>
          <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.4em] leading-relaxed">
            Réinitialisation sécurisée par jeton
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="reset-password-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full p-4 bg-error/5 border border-error/20 rounded-xl flex items-center gap-3"
            >
              <ShieldAlert className="w-4 h-4 text-error" />
              <p className="font-sans text-[10px] font-black text-error uppercase tracking-widest">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {tokenStatus === 'checking' ? (
          <div className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            <p className="mt-4 font-sans text-xs font-black uppercase tracking-[0.3em] text-on-surface">
              Validation du jeton sécurisé
            </p>
          </div>
        ) : tokenStatus === 'invalid' ? (
          <div className="w-full rounded-2xl border border-error/20 bg-error/5 p-8 text-center">
            <p className="font-sans text-xs font-black uppercase tracking-[0.3em] text-error">
              Ce lien de réinitialisation est invalide ou expiré.
            </p>
            <Link to="/forgot-password" university-link="true" className="mt-6 inline-flex text-sm font-black uppercase tracking-[0.2em] text-primary hover:text-on-surface">
              Demander un nouveau lien
            </Link>
          </div>
        ) : isComplete ? (
          <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <p className="font-sans text-xs font-black uppercase tracking-[0.3em] text-on-surface">
              Votre mot de passe a été mis à jour.
            </p>
            <Link to="/login" className="mt-6 inline-flex text-sm font-black uppercase tracking-[0.2em] text-primary hover:text-on-surface">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-8">
            <div className="space-y-2">
              <label htmlFor="reset-password-input" className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">
                Nouveau Code d'accès
              </label>
              <input
                id="reset-password-input"
                aria-label="Nouveau Code d'accès"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-16 bg-surface-container-lowest border border-outline-variant rounded-2xl px-6 font-sans font-bold text-on-surface focus:border-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="reset-password-confirm-input" className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">
                Confirmer le Code
              </label>
              <input
                id="reset-password-confirm-input"
                aria-label="Confirmer le Code"
                type="password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-16 bg-surface-container-lowest border border-outline-variant rounded-2xl px-6 font-sans font-bold text-on-surface focus:border-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-20 bg-primary-container text-on-background rounded-2xl font-sans text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 border border-primary-container relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Mettre à jour le Code</span>}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
