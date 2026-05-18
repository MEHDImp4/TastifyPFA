import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { 
  Loader2, 
  ArrowRight, 
  User as UserIcon, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  ShieldAlert,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import type { Variants } from 'framer-motion';

// Bento Animation Variants
const bentoContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const bentoItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 80,
      damping: 20,
    },
  },
};

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const contentScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/users/login/', { username, password });
      const { access, role, username: resUsername } = response.data;
      
      if (role !== 'CLIENT') {
          await api.post('/users/logout/');
          setError("Accès réservé aux clients.");
          setIsLoading(false);
          return;
      }
      
      setAuth(access, role, resUsername);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Identifiants incorrects.');
      } else {
        setError('Erreur système. Veuillez réessayer.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FDF8F4] text-[#1C140E] overflow-x-hidden font-['Bodoni_Moda'] pt-12 pb-24 px-6 md:px-12">
      <motion.div 
        style={{ scale: contentScale }}
        className="max-w-[1440px] mx-auto"
      >
        {/* Navigation & Context */}
        <div className="flex justify-between items-center mb-16">
          <Link 
            to="/" 
            className="group flex items-center gap-3 font-['Bricolage_Grotesque'] font-black text-[10px] uppercase tracking-[0.3em] text-[#D1854E] hover:text-[#1C140E] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            RETOUR À L'ACCUEIL
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D1854E] animate-pulse" />
            <span className="font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-widest text-[#1C140E]/40">
              Système d'Accès Sécurisé
            </span>
          </div>
        </div>

        {/* --- AUTH BENTO GRID --- */}
        <motion.div 
          variants={bentoContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[minmax(200px,auto)]"
        >
          {/* Main Login Form Card */}
          <motion.div 
            variants={bentoItemVariants}
            className="md:col-span-7 lg:col-span-8 bg-white rounded-[3rem] border border-[#1C140E]/5 p-8 md:p-16 flex flex-col justify-center relative overflow-hidden"
          >
            <div className="max-w-md w-full mx-auto relative z-10">
              <span className="font-['Bricolage_Grotesque'] font-black uppercase tracking-[0.3em] text-[10px] text-[#D1854E] mb-6 block">
                Identification Client
              </span>
              <h1 className="font-['Libre_Caslon_Text'] text-5xl md:text-7xl leading-[0.9] tracking-tighter mb-12">
                Bienvenue <br/><span className="italic text-[#D1854E]">chez vous.</span>
              </h1>

              <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="p-6 rounded-2xl bg-[#D1854E]/10 border border-[#D1854E]/20 flex items-center gap-4 mb-10"
                    >
                        <ShieldAlert className="w-6 h-6 text-[#D1854E]" strokeWidth={2.5} />
                        <p className="text-sm font-['Bricolage_Grotesque'] font-bold uppercase tracking-wider text-[#D1854E]">{error}</p>
                    </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-8">
                  <div className="group relative">
                    <label className="font-['Bricolage_Grotesque'] text-[10px] font-black uppercase tracking-[0.25em] text-[#D1854E] ml-4 mb-2 block">Identifiant</label>
                    <div className="relative">
                      <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1C140E]/30 group-focus-within:text-[#D1854E] transition-colors" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-16 pr-8 py-6 bg-[#FDF8F4] border border-[#1C140E]/5 rounded-[2rem] font-['Bodoni_Moda'] font-bold text-lg focus:border-[#D1854E] focus:bg-white outline-none transition-all shadow-sm group-hover:shadow-md"
                        placeholder="USERNAME"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="group relative">
                    <div className="flex justify-between items-center ml-4 mb-2">
                      <label className="font-['Bricolage_Grotesque'] text-[10px] font-black uppercase tracking-[0.25em] text-[#D1854E] block">Mot de Passe</label>
                      <Link to="#" className="font-['Bricolage_Grotesque'] text-[9px] font-bold uppercase tracking-widest text-[#1C140E]/40 hover:text-[#D1854E] transition-colors">Oublié ?</Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1C140E]/30 group-focus-within:text-[#D1854E] transition-colors" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-16 pr-8 py-6 bg-[#FDF8F4] border border-[#1C140E]/5 rounded-[2rem] font-['Bodoni_Moda'] font-bold text-lg focus:border-[#D1854E] focus:bg-white outline-none transition-all shadow-sm group-hover:shadow-md"
                        placeholder="••••••••"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-7 bg-[#1C140E] text-white rounded-[2rem] font-['Bricolage_Grotesque'] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-[#D1854E] transition-all duration-300 shadow-xl disabled:opacity-50 relative overflow-hidden group/btn"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <span>AUTORISER LA SESSION</span>
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" strokeWidth={3} />
                    </>
                  )}
                  {/* Subtle sweep effect */}
                  <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out" />
                </motion.button>
              </form>

              <div className="mt-16 pt-10 border-t border-[#1C140E]/5 text-center md:text-left">
                <p className="text-sm font-bold text-[#1C140E]/60">
                  Nouveau dans l'écosystème ? {' '}
                  <Link to="/register" className="font-['Bricolage_Grotesque'] font-black uppercase text-xs tracking-widest text-[#D1854E] hover:underline ml-2">
                    Créer mon Archive
                  </Link>
                </p>
              </div>
            </div>

            {/* Tactical background detail */}
            <div className="absolute bottom-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <ShieldCheck className="w-96 h-96" />
            </div>
          </motion.div>

          {/* Cinematic Side Block */}
          <motion.div 
            variants={bentoItemVariants}
            className="md:col-span-5 lg:col-span-4 space-y-8"
          >
            {/* Image Card */}
            <div className="h-[400px] rounded-[3rem] overflow-hidden relative group border-4 border-white shadow-2xl">
              <div className="absolute inset-0 bg-[#1C140E]/40 group-hover:bg-[#1C140E]/20 transition-colors z-10" />
              <img 
                src="https://images.unsplash.com/photo-1550966841-3ee5ad0110d3?auto=format&fit=crop&q=80&w=800" 
                alt="Ambiance" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
              />
              <div className="absolute bottom-8 left-8 z-20">
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[9px] font-black uppercase tracking-[0.3em]">
                  <Sparkles className="w-3 h-3 text-[#D1854E]" />
                  <span>Accès Vérifié</span>
                </div>
              </div>
            </div>

            {/* Tactical Info Card */}
            <div className="bg-[#1C140E] text-[#FDF8F4] p-10 rounded-[3rem] relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="font-['Libre_Caslon_Text'] text-3xl mb-4 italic">Le Privilège.</h3>
                <p className="text-sm text-[#FDF8F4]/60 font-medium leading-relaxed mb-8">
                  Votre compte Tastify est la clé d'un service sur-mesure et d'une gestion intelligente de vos réservations.
                </p>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#D1854E]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D1854E]" />
                        Cryptage de Bout en Bout
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#D1854E]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D1854E]" />
                        Authentification Biométrique
                    </div>
                </div>
              </div>
              {/* Glow Effect */}
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#D1854E]/10 blur-[80px] rounded-full group-hover:scale-125 transition-transform duration-700" />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};
