import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCcw, CloudOff, ShieldCheck, Database } from 'lucide-react';

export const OfflineModePage: React.FC = () => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => setIsRetrying(false), 3000);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background font-body selection:bg-primary/20 p-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
         <WifiOff className="w-[400px] h-[400px] text-on-surface-variant stroke-[0.5]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center gap-12"
      >
        <div className="relative">
           <div className="w-32 h-32 rounded-full border-2 border-outline-variant/30 flex items-center justify-center bg-surface-container-low shadow-2xl relative z-10">
              <CloudOff className="w-12 h-12 text-on-surface-variant stroke-[1]" />
           </div>
           <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20" />
        </div>

        <div className="space-y-6">
           <h1 className=" text-3xl md:text-5xl font-black text-on-surface uppercase  tracking-tighter m-0">Mode Hors Ligne</h1>
           <p className="font-body text-lg md:text-xl text-on-surface-variant uppercase tracking-widest leading-relaxed max-w-md mx-auto opacity-60">
              Connexion interrompue. Votre menu et vos préférences de profil sont sécurisés en cache. La synchronisation en direct est temporairement suspendue.
           </p>
        </div>

        <div className="flex flex-col items-center gap-8">
           <button 
             onClick={handleRetry}
             disabled={isRetrying}
             className="px-12 py-5 bg-primary text-on-primary rounded-full font-sans text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/20 flex items-center justify-center gap-4 group"
           >
             <RefreshCcw className={`w-4 h-4 transition-transform duration-700 ${isRetrying ? 'animate-spin' : 'group-hover:rotate-180'}`} />
             <span>Réessayer la Connexion</span>
           </button>

           <div className={`flex items-center gap-3 transition-opacity duration-500 ${isRetrying ? 'opacity-100' : 'opacity-0'}`}>
              <RefreshCcw className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Tentative de reconnexion...</span>
           </div>
        </div>

        <div className="pt-12 border-t border-outline-variant/10 w-full max-w-sm flex items-center justify-center gap-8 opacity-20">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              <span className="font-sans text-[8px] font-black uppercase tracking-widest">Bouclier Local Actif</span>
           </div>
           <div className="flex items-center gap-2">
              <Database className="w-3 h-3" />
              <span className="font-sans text-[8px] font-black uppercase tracking-widest">Cache Validé</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
};
