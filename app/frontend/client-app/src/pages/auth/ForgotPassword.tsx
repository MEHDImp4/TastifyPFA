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
              <Mail className="w-6 h-6" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className=" text-4xl md:text-5xl font-black text-on-surface tracking-tighter m-0">
            Mot de passe oublié
          </h1>
          <p className="font-sans text-[11px] font-black text-on-surface-variant tracking-[0.2em] leading-relaxed">
            Recevez un lien de réinitialisation par email
          </p>
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
              <ShieldAlert className="w-4 h-4 text-error" />
              <p className="font-sans text-sm font-bold text-error">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {submitted ? (
          <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <p className="font-sans text-xs font-black uppercase tracking-[0.3em] text-on-surface">
              Instructions envoyées si l'adresse est enregistrée.
            </p>
            <p className="mt-4 font-sans text-sm text-on-surface-variant">
              Vérifiez votre boîte de réception pour le lien de réinitialisation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="w-full space-y-10">
            <div className="space-y-2">
              <label htmlFor="forgot-password-email-input" className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">
                Email du compte
              </label>
              <div className="relative group">
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
                  className="field-control min-h-16 rounded-lg px-6 pr-14 tracking-tight"
                  placeholder="votre@email.com"
                />
                <Mail className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full min-h-14 gap-4 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Envoyer le lien</span>}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
