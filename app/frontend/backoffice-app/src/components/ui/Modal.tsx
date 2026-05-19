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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-surface rounded-[2rem] border border-outline-variant/30 shadow-lg shadow-primary/10 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/20 bg-surface-container-low">
          <h3 className="text-xl font-bold tracking-tight" style={{ color: '#301400' }}>{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 transition-colors hover:bg-surface-container rounded-xl"
            style={{ color: '#53443a' }}
          >
            <X className="w-5 h-5"  strokeWidth={2}/>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
