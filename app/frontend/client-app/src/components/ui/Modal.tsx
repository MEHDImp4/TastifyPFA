import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
      <div 
        className="absolute inset-0 bg-on-surface/80 backdrop-blur-2xl transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 double-bezel">
        <div className="flex items-center justify-between p-10 pb-6">
          <h3 className="text-3xl font-display-accent italic tracking-tight text-on-surface leading-none">{title}</h3>
          <button 
            onClick={onClose}
            className="p-3 bg-surface-container rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-10 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
};
