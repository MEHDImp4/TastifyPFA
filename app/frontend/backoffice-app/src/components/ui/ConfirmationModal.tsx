import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const accentColor = variant === 'danger' ? 'text-error' : variant === 'warning' ? 'text-primary' : 'text-primary';
  const buttonBg = variant === 'danger' ? 'bg-error' : 'bg-primary';

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => modalRef.current?.focus());
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isOpen, handleKeyDown]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-xl border border-outline-variant bg-surface-container shadow-2xl outline-none"
          >
            <div className={`h-1.5 w-full ${variant === 'danger' ? 'bg-error' : 'bg-primary'}`} />
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${variant === 'danger' ? 'bg-error/10' : 'bg-primary/10'}`}>
                    <AlertTriangle className={`w-5 h-5 ${accentColor}`} />
                  </div>
                  <h2 className=" text-xl font-black text-on-surface tracking-tight">{title}</h2>
                </div>
                <button onClick={onClose} aria-label="Fermer" className="btn-icon border-transparent bg-transparent">
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              
              <p className="font-sans text-sm font-bold text-on-surface-variant leading-relaxed tracking-tight mb-10">
                {message}
              </p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="btn-secondary flex-1 h-14 rounded-lg tracking-wide"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-[1.5] min-h-14 ${buttonBg} text-on-primary rounded-lg font-sans text-[12px] font-black tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] border ${variant === 'danger' ? 'border-error' : 'border-primary'}`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
