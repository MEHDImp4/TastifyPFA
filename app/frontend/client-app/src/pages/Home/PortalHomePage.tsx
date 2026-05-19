import { motion } from 'framer-motion';
import { ArrowRight, Utensils, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PortalHomePage = () => {
  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans selection:bg-[#8d4e1c]/10 selection:text-[#8d4e1c]">
      
      {/* Hero Section */}
      <main className="pt-40 pb-24 px-6 max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-8"
        >
          <h1 className="text-6xl md:text-8xl font-serif italic leading-tight tracking-tighter">
            L'Art de Bien Recevoir.
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-[#787774] leading-relaxed">
            Une expérience culinaire simplifiée, de la réservation à l'addition. 
            Découvrez l'excellence marocaine en quelques clics.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <Link 
              to="/reservations" 
              className="w-full sm:w-auto px-10 py-5 bg-[#111111] text-white rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#333333] transition-all active:scale-95 shadow-lg shadow-black/5"
            >
              Réserver une table <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/menu" 
              className="w-full sm:w-auto px-10 py-5 bg-white border border-[#EAEAEA] text-[#111111] rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#F7F6F3] transition-all active:scale-95"
            >
              Explorer le Menu
            </Link>
          </div>
        </motion.div>

        {/* Simple Features */}
        <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-16 border-t border-[#EAEAEA] pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="w-12 h-12 bg-[#F7F6F3] rounded-lg flex items-center justify-center text-[#8d4e1c]">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Réservation Immédiate</h3>
            <p className="text-[#787774] leading-relaxed text-sm">Réservez votre place en temps réel. Simple, rapide et sans attente.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="w-12 h-12 bg-[#F7F6F3] rounded-lg flex items-center justify-center text-[#8d4e1c]">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Menu Interactif</h3>
            <p className="text-[#787774] leading-relaxed text-sm">Visualisez nos plats signatures et composez votre commande en toute simplicité.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="w-12 h-12 bg-[#F7F6F3] rounded-lg flex items-center justify-center text-[#8d4e1c]">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Paiement Invisible</h3>
            <p className="text-[#787774] leading-relaxed text-sm">Réglez votre note directement depuis votre smartphone en fin de service.</p>
          </motion.div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="mt-40 py-12 border-t border-[#EAEAEA]">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-xs font-bold text-[#787774] uppercase tracking-widest">© 2026 TASTIFY — L'élégance du strict minimum.</p>
          <div className="flex gap-8">
            <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-[#787774] hover:text-[#111111]">Connexion</Link>
            <Link to="/register" className="text-xs font-bold uppercase tracking-widest text-[#787774] hover:text-[#111111]">Inscription</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
