import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import logoPublic from '../../assets/logo-public.svg';

interface AuthLayoutProps {
  children: React.ReactNode;
  visual: React.ReactNode;
  isReverse?: boolean;
}

const containerVariants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 }
};

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, visual, isReverse = false }) => {
  const navigate = useNavigate();

  return (
    <motion.div 
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`flex-1 flex flex-col ${isReverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} min-h-[calc(100dvh-6rem)] bg-background overflow-hidden relative`}
    >
      {/* Visual Identity Section - Desktop Only */}
      <motion.div 
        layoutId="auth-visual-container"
        layout
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 30,
          mass: 1
        }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-on-surface p-20 items-end z-0"
      >
        {visual}
      </motion.div>

      {/* Form Section */}
      <motion.div 
        layoutId="auth-form-container"
        layout
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 30,
          mass: 1
        }}
        className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 relative overflow-hidden bg-background z-10"
      >
        {/* Mobile Logo & Return */}
        <div className={`absolute top-10 left-10 lg:left-auto ${isReverse ? 'lg:right-20' : 'lg:left-20'} right-10 flex items-center justify-between ${isReverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} z-20 w-full lg:w-auto px-10 md:px-0`}>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group">
                <motion.div layoutId="auth-back-icon">
                    <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                </motion.div>
                <motion.span layoutId="auth-back-text" className="text-[10px] font-black uppercase tracking-widest">Back</motion.span>
            </button>
            <img src={logoPublic} alt="Tastify" className="h-8 w-auto lg:hidden" />
        </div>

        <div className="w-full max-w-md space-y-12 relative z-10">
            {children}
        </div>
      </motion.div>
    </motion.div>
  );
};
