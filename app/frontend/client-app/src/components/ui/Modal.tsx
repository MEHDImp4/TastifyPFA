import React, { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(isOpen);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    // Focus trap: cycle Tab within modal
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the modal container on open for screen readers
      requestAnimationFrame(() => modalRef.current?.focus());
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/95 transition-opacity"
            onClick={onClose}
          />
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-xl max-h-[calc(100dvh-2rem)] bg-surface-container border border-outline-variant rounded-lg shadow-2xl overflow-hidden flex flex-col outline-none"
          >
            <div className="flex items-center justify-between gap-4 p-5 md:p-8 border-b border-outline">
              <h3 className="text-xl md:text-2xl font-bold text-primary leading-tight m-0">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Fermer la fenêtre"
                className="btn-icon rounded-full"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <div className="p-5 md:p-8 overflow-y-auto custom-scrollbar">
              {children}
            </div>
            
            {/* Structural rim lighting */}
            <div className="absolute inset-0 border border-white/5 rounded-[inherit] pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

