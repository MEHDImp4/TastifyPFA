import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, ShieldCheck } from 'lucide-react';

const CONSENT_KEY = 'tastify_cookie_consent';

export const ConsentBanner: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      const timer = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, date: Date.now() }));
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, date: Date.now() }));
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-label="Préférences de consentement"
          aria-modal="false"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[60] p-4 sm:p-6"
        >
          <div className="max-w-[1200px] mx-auto bg-surface border border-outline rounded-lg p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <Cookie className="w-6 h-6 text-on-surface-variant shrink-0 mt-0.5" />
              <div className="space-y-1.5 min-w-0">
                <p className="text-sm font-bold text-on-background leading-snug">
                  Ce site utilise des témoins essentiels pour le fonctionnement.
                </p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Aucune collecte publicitaire ni revente. Vos préférences sont conservées localement.
                  <button
                    onClick={accept}
                    className="ml-1.5 underline hover:text-on-background transition-colors font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring rounded"
                  >
                    Accepter tout
                  </button>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <button
                onClick={decline}
                className="btn-secondary flex-1 sm:flex-none min-h-[44px] px-6"
              >
                Refuser
              </button>
              <button
                onClick={accept}
                className="btn-primary flex-1 sm:flex-none gap-2 min-h-[48px] px-6"
              >
                <ShieldCheck className="w-4 h-4" />
                Accepter
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
