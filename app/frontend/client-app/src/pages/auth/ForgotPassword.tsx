import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Loader2, Mail, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../../api/axios';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Indiquez votre email.');
      return;
    }
    setIsLoading(true);

    try {
      await api.post('/users/request-reset/', { email });
      setSubmitted(true);
      toast.success('Demande de réinitialisation acceptée');
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Nous ne pouvons pas envoyer le lien pour le moment.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
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
              <Mail className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-on-background tracking-tight m-0 uppercase font-heading">
                Mot de passe.
              </h1>
              <p className="text-[10px] font-bold text-accent uppercase tracking-[0.4em] leading-relaxed">
                Réinitialisation par email
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                id="forgot-password-error"
                role="alert"
                key="forgot-password-error"
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

          {submitted ? (
            <div className="w-full rounded-xl border border-accent/25 bg-accent/5 p-6 text-center space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                Instructions envoyées si l'adresse est enregistrée.
              </p>
              <p className="text-xs font-semibold leading-relaxed text-on-surface-muted">
                Vérifiez votre boîte de réception pour le lien de réinitialisation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="w-full space-y-6">
              <div className="space-y-2">
                <label htmlFor="forgot-password-email-input" className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em] ml-2 block">
                  Email du compte
                </label>
                <div className="relative">
                  <input
                    id="forgot-password-email-input"
                    aria-label="Email du compte"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'forgot-password-error' : undefined}
                    className="field-control pr-12"
                    placeholder="votre@email.com"
                  />
                  <Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-subtle" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full min-h-14 tracking-[0.18em] cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-on-primary" /> : <span>Envoyer le lien</span>}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
