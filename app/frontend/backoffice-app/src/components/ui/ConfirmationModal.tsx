import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'CONFIRMER',
  cancelLabel = 'ANNULER',
  variant = 'danger'
}) => {
  const accentColor = variant === 'danger' ? 'text-error' : variant === 'warning' ? 'text-primary' : 'text-primary';
  const buttonBg = variant === 'danger' ? 'bg-error' : 'bg-primary';

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-surface-container border border-outline-variant rounded-2xl overflow-hidden"
          >
            <div className={`h-1.5 w-full ${variant === 'danger' ? 'bg-error' : 'bg-primary'}`} />
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${variant === 'danger' ? 'bg-error/10' : 'bg-primary/10'}`}>
                    <AlertTriangle className={`w-5 h-5 ${accentColor}`} />
                  </div>
                  <h2 className=" text-xl font-black text-on-surface uppercase  tracking-tight">{title}</h2>
                </div>
                <button onClick={onClose} aria-label="Fermer" className="p-1 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              
              <p className="font-sans text-sm font-bold text-on-surface-variant leading-relaxed uppercase tracking-tight opacity-80 mb-10">
                {message}
              </p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 h-14 border border-outline-variant rounded-xl font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-[1.5] h-14 ${buttonBg} text-on-primary rounded-xl font-sans text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] border ${variant === 'danger' ? 'border-error' : 'border-primary'}`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
