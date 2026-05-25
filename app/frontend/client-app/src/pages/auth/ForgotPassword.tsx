import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Loader2, Mail, ShieldAlert, Sparkles } from 'lucide-react';
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
    setIsLoading(true);

    try {
      await api.post('/users/request-reset/', { email });
      setSubmitted(true);
      toast.success('RESET_REQUEST_ACCEPTED');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'RESET_REQUEST_FAILURE');
      toast.error('RESET_REQUEST_FAILURE');
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
        aria-label="Back to login"
        className="fixed top-12 left-10 z-20 group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant hover:text-primary transition-all"
      >
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-2" />
        Return
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
          <h1 className="font-serif text-4xl md:text-5xl font-black text-on-surface uppercase italic tracking-tighter m-0">
            Reset Access.
          </h1>
          <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.4em] leading-relaxed">
            Secure account recovery
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="forgot-password-error"
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

        {submitted ? (
          <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <p className="font-sans text-xs font-black uppercase tracking-[0.3em] text-on-surface">
              Reset instructions sent if the address is registered.
            </p>
            <p className="mt-4 font-sans text-sm text-on-surface-variant">
              Check your inbox for a secure recovery link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-10">
            <div className="space-y-2">
              <label htmlFor="forgot-password-email-input" className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">
                Registry Email
              </label>
              <div className="relative group">
                <input
                  id="forgot-password-email-input"
                  aria-label="Registry Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-16 bg-surface-container-lowest border border-outline-variant rounded-2xl px-6 pr-14 font-sans font-bold text-on-surface focus:border-primary outline-none transition-all tracking-tight"
                  placeholder="GUEST@DOMAIN.COM"
                />
                <Mail className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-20 bg-primary-container text-on-background rounded-2xl font-sans text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 border border-primary-container relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Send Recovery Link</span>}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
