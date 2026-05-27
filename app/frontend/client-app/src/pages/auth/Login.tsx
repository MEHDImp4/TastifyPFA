import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { 
  Loader2, 
  ShieldAlert, 
  ChevronLeft,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const response = await api.post('/users/login/', { username, password });
      const { access, role, username: resUsername } = response.data;
      
      if (role !== 'CLIENT') {
          await api.post('/users/logout/');
          setError("Accès réservé aux clients");
          setIsLoading(false);
          return;
      }
      
      setAuth(access, role, resUsername);
      toast.success('Bienvenue chez Tastify');
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.status === 401 ? 'Identifiants incorrects' : 'Une erreur est survenue');
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.23, 1, 0.32, 1] as any,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] font-body selection:bg-[#C5A059]/20 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Luminous Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=2000')] opacity-5 mix-blend-multiply" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6]/60 to-transparent" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C5A059]/5 blur-[120px] rounded-full" />
      </div>

      <Link 
        to="/" 
        className="fixed top-12 left-10 z-20 group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-[#2D2424]/40 hover:text-[#D14D1A] transition-all"
      >
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-2" />
        Retour
      </Link>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-xl bg-white border border-[#2D2424]/5 rounded-[3.5rem] p-12 md:p-20 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] flex flex-col items-center gap-12"
      >
        <motion.div variants={itemVariants} className="text-center space-y-6">
          <div className="flex justify-center mb-8">
             <div className="w-16 h-16 bg-[#D14D1A]/5 rounded-full flex items-center justify-center text-[#D14D1A] border border-[#D14D1A]/10 relative">
                <Sparkles className="w-6 h-6" strokeWidth={1} />
                <div className="absolute inset-0 bg-[#D14D1A]/10 rounded-full animate-ping opacity-20" />
             </div>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-black text-[#2D2424] uppercase italic tracking-tighter m-0 leading-none">Bon retour.</h1>
          <p className="font-sans text-[10px] font-black text-[#2D2424]/40 uppercase tracking-[0.5em]">Identifiez-vous pour continuer</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error-msg"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full p-5 bg-[#B3261E]/5 border border-[#B3261E]/10 rounded-2xl flex items-center gap-4"
            >
              <ShieldAlert className="w-5 h-5 text-[#B3261E]" />
              <p className="font-sans text-[11px] font-bold text-[#B3261E] uppercase tracking-widest">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="w-full space-y-10">
          <div className="space-y-8">
            <motion.div variants={itemVariants} className="space-y-3">
              <label htmlFor="login-username" className="font-sans text-[10px] font-black text-[#2D2424]/30 uppercase tracking-[0.4em] ml-2">Identifiant</label>
              <div className="relative">
                <input
                  id="login-username"
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading}
                  className="w-full h-20 bg-[#FAF9F6] border border-[#2D2424]/5 rounded-3xl px-8 font-sans font-bold text-[#2D2424] focus:border-[#D14D1A]/30 focus:bg-white outline-none transition-all placeholder:text-[#2D2424]/10"
                  placeholder="NOM_UTILISATEUR"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex justify-between items-center px-2">
                 <label htmlFor="login-password" className="font-sans text-[10px] font-black text-[#2D2424]/30 uppercase tracking-[0.4em]">Mot de passe</label>
                 <Link to="/forgot-password" className="font-sans text-[9px] font-black text-[#C5A059] hover:text-[#D14D1A] transition-colors uppercase tracking-[0.2em]">Oublié ?</Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                  className="w-full h-20 bg-[#FAF9F6] border border-[#2D2424]/5 rounded-3xl px-8 font-sans font-bold text-[#2D2424] focus:border-[#D14D1A]/30 focus:bg-white outline-none transition-all placeholder:text-[#2D2424]/10"
                  placeholder="••••••••"
                />
              </div>
            </motion.div>
          </div>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" disabled={isLoading}
            className="w-full h-20 bg-[#2D2424] text-[#FAF9F6] rounded-3xl font-sans text-xs font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-[#D14D1A] transition-all flex items-center justify-center gap-4 group"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <span>Se Connecter</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </motion.button>
        </form>

        <motion.div variants={itemVariants} className="pt-8 border-t border-[#2D2424]/5 w-full text-center">
          <p className="font-sans text-[10px] font-black text-[#2D2424]/30 uppercase tracking-[0.4em]">
            Pas encore de compte ? {' '}
            <Link to="/register" className="text-[#D14D1A] hover:text-[#2D2424] ml-2 transition-colors border-b border-[#D14D1A]/20 pb-0.5">S'inscrire</Link>
          </p>
        </motion.div>
      </motion.div>
      
      {/* Decorative Branding Detail */}
      <div className="fixed bottom-12 right-12 opacity-10 hidden lg:block">
         <span className="font-serif text-[120px] font-black italic text-[#2D2424] leading-none select-none">T.</span>
      </div>
    </div>
  );
};
