import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/95 transition-opacity"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-xl bg-surface-container border border-outline-variant rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-8 md:p-12 pb-6 border-b border-outline-variant/10">
              <h3 className="font-serif text-2xl md:text-3xl font-black italic tracking-tighter text-primary leading-none m-0 uppercase">{title}</h3>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 md:p-12 pt-10 overflow-y-auto max-h-[75vh] custom-scrollbar">
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

