import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  value, 
  onChange, 
  options, 
  icon, 
  placeholder, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative w-full flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 pl-11 pr-4 py-3 text-sm text-white outline-none transition-all focus:border-teal/50 focus:bg-white/10 active:scale-[0.99]"
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus:text-teal transition-colors">
          {icon}
        </div>
        <span className={selectedOption ? 'text-white' : 'text-white/20'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={`absolute right-4 top-1/2 -translate-y-1/2 text-white/20 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          size={14} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Transparent click-away overlay for mobile/touch better handling */}
            <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-surface-elevated shadow-2xl backdrop-blur-xl"
              style={{ transformOrigin: 'top' }}
            >
              <div className="p-1 max-h-60 overflow-y-auto custom-scrollbar">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all ${
                      value === option.value 
                        ? 'bg-teal/10 text-teal font-bold' 
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
