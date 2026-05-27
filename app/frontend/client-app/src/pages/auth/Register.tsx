import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ArrowRight, ShieldAlert, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await api.post('/users/register/', { username, email, password, role: 'CLIENT' });
      const loginRes = await api.post('/users/login/', { username, password });
      const { access, role, username: resUsername } = loginRes.data;
      setAuth(access, role, resUsername);
      toast.success('Compte créé avec succès');
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] font-body selection:bg-[#C5A059]/20 flex flex-col items-center justify-center p-6">
      <Link 
        to="/" 
        className="fixed top-8 left-8 group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#2D2424]/40 hover:text-[#D14D1A] transition-all"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Retour
      </Link>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md space-y-12"
      >
        <motion.div variants={fadeIn} className="text-center space-y-2">
          <h1 className="font-serif text-5xl font-medium text-[#2D2424] italic tracking-tight m-0">Inscription.</h1>
          <p className="font-sans text-[10px] font-black text-[#2D2424]/30 uppercase tracking-[0.4em]">Créez votre compte pour commencer</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 bg-[#B3261E]/5 border border-[#B3261E]/10 rounded-xl flex items-center gap-3"
            >
              <ShieldAlert className="w-4 h-4 text-[#B3261E]" />
              <p className="font-sans text-[10px] font-bold text-[#B3261E] uppercase tracking-widest">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div variants={fadeIn} className="space-y-1.5">
            <label htmlFor="username" className="font-sans text-[9px] font-black text-[#2D2424]/40 uppercase tracking-[0.3em] ml-1">Utilisateur</label>
            <input
              id="username"
              type="text" required value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading}
              className="w-full h-14 bg-white border border-[#2D2424]/10 rounded-2xl px-5 font-sans font-bold text-[#2D2424] focus:border-[#D14D1A] outline-none transition-all placeholder:text-[#2D2424]/10"
              placeholder="PSEUDONYME"
            />
          </motion.div>

          <motion.div variants={fadeIn} className="space-y-1.5">
            <label htmlFor="email" className="font-sans text-[9px] font-black text-[#2D2424]/40 uppercase tracking-[0.3em] ml-1">Email</label>
            <input
              id="email"
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
              className="w-full h-14 bg-white border border-[#2D2424]/10 rounded-2xl px-5 font-sans font-bold text-[#2D2424] focus:border-[#D14D1A] outline-none transition-all placeholder:text-[#2D2424]/10"
              placeholder="VOTRE@EMAIL.COM"
            />
          </motion.div>

          <motion.div variants={fadeIn} className="space-y-1.5">
            <label htmlFor="password" className="font-sans text-[9px] font-black text-[#2D2424]/40 uppercase tracking-[0.3em] ml-1">Mot de passe</label>
            <input
              id="password"
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
              className="w-full h-14 bg-white border border-[#2D2424]/10 rounded-2xl px-5 font-sans font-bold text-[#2D2424] focus:border-[#D14D1A] outline-none transition-all placeholder:text-[#2D2424]/10"
              placeholder="••••••••"
            />
          </motion.div>

          <motion.button
            variants={fadeIn}
            whileTap={{ scale: 0.98 }}
            type="submit" disabled={isLoading}
            className="w-full h-16 bg-[#2D2424] text-[#FAF9F6] rounded-2xl font-sans text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:bg-[#D14D1A] flex items-center justify-center gap-3 group mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <span>Créer mon profil</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </motion.button>
        </form>

        <motion.div variants={fadeIn} className="pt-8 border-t border-[#2D2424]/5 text-center">
          <p className="font-sans text-[10px] font-black text-[#2D2424]/30 uppercase tracking-[0.4em]">
            Déjà membre ? {' '}
            <Link to="/login" className="text-[#D14D1A] hover:text-[#2D2424] ml-1 transition-colors border-b border-[#D14D1A]/10 pb-0.5">Se connecter</Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
