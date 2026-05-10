import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ArrowRight, UserPlus } from 'lucide-react';

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
      // Auto login after register
      const loginRes = await api.post('/users/login/', { username, password });
      const { access, role, username: resUsername } = loginRes.data;
      setAuth(access, role, resUsername);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l’inscription. Le pseudo ou l’email est peut-être déjà utilisé.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-md p-10 bg-white rounded-[3rem] shadow-sm border border-gray-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-teal/10 rounded-2xl flex items-center justify-center text-teal mx-auto mb-4">
              <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-dark mb-2">Créer un compte</h1>
          <p className="text-gray-500">Rejoignez Tastify pour gérer vos réservations.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-terracotta/10 border border-terracotta/20 text-terracotta text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Nom d'utilisateur</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 transition-all"
              placeholder="votre_pseudo"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 transition-all"
              placeholder="contact@exemple.com"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 transition-all"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4.5 bg-teal text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-teal/10 mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <span>S'inscrire</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link to="/login" className="font-bold text-teal hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
