import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, UtensilsCrossed } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center bg-background font-body selection:bg-primary/20 p-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, var(--color-primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center gap-10"
      >
        <h1 className="text-display-lg text-6xl md:text-[120px] text-primary-container leading-none m-0  font-black opacity-20">404</h1>
        
        <div className="w-16 h-px bg-outline-variant/30" />
        
        <div className="space-y-6">
           <h2 className=" text-3xl md:text-5xl font-black text-on-surface tracking-tighter m-0">Page introuvable</h2>
           <p className="font-body text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-md mx-auto opacity-80">
              La page demandée n'existe pas ou n'est plus disponible.
           </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
            <button 
              onClick={() => navigate('/')}
              className="btn-primary min-h-14 px-10 gap-3"
            >
              <Home className="w-4 h-4" /> Retour à l'accueil
            </button>
            <button 
              onClick={() => navigate('/menu')}
              className="btn-secondary min-h-14 px-10 gap-3"
            >
              <UtensilsCrossed className="w-4 h-4" /> Voir le menu
            </button>
        </div>
      </motion.div>
    </div>
  );
};
