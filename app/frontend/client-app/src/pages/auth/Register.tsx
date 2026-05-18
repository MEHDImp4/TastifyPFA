import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ArrowRight, UserPlus, Mail, Lock, ShieldAlert, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    setError(null);
    setIsLoading(true);

    try {
      await api.post('/users/register/', { username, email, password, role: 'CLIENT' });
      const loginRes = await api.post('/users/login/', { username, password });
      const { access, role, username: resUsername } = loginRes.data;
      setAuth(access, role, resUsername);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l’inscription.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans flex flex-col items-center justify-center p-6 selection:bg-[#8d4e1c]/10 selection:text-[#8d4e1c]">
      <Link 
        to="/" 
        className="fixed top-12 left-12 group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#787774] hover:text-[#111111] transition-colors"
      >
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Retour
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm space-y-12"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif italic tracking-tight">Inscription.</h1>
          <p className="text-sm font-bold text-[#787774] uppercase tracking-widest">Rejoignez-nous en quelques secondes.</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3"
            >
              <ShieldAlert className="w-4 h-4 text-red-500" strokeWidth={2.5} />
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#787774] ml-1">Identifiant</label>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-[#F7F6F3] border border-transparent rounded-xl font-bold focus:bg-white focus:border-[#EAEAEA] outline-none transition-all"
                  placeholder="USERNAME"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#787774] ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-[#F7F6F3] border border-transparent rounded-xl font-bold focus:bg-white focus:border-[#EAEAEA] outline-none transition-all"
                  placeholder="EMAIL_ADDRESS"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#787774] ml-1">Mot de Passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-[#F7F6F3] border border-transparent rounded-xl font-bold focus:bg-white focus:border-[#EAEAEA] outline-none transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-[#111111] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#333333] transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <span>Créer mon Compte</span>
                <ArrowRight className="w-4 h-4" strokeWidth={3} />
              </>
            )}
          </button>
        </form>

        <div className="pt-8 border-t border-[#EAEAEA] text-center">
          <p className="text-xs font-bold text-[#787774] uppercase tracking-widest">
            Déjà membre ? {' '}
            <Link to="/login" className="text-[#111111] hover:underline ml-2">Se connecter</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
