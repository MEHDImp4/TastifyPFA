import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

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
          // If a staff member tries to log in from the client portal, we should ideally block or warn them,
          // but for now, we just set auth. The layout guards logic can handle it or we enforce it here.
          // Enforcing here:
          await api.post('/users/logout/');
          setError("Ce portail est réservé aux clients. Veuillez utiliser l'accès staff.");
          setIsLoading(false);
          return;
      }
      
      setAuth(access, role, resUsername);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Identifiants incorrects.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-sans tracking-tight text-dark mb-2">Bienvenue</h1>
          <p className="text-gray-500">Connectez-vous à votre espace client Tastify.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-terracotta/10 border border-terracotta/20 text-terracotta text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700" htmlFor="username">Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dark focus:bg-white focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
              placeholder="votre_pseudo"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dark focus:bg-white focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 bg-teal text-white rounded-xl font-medium transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-sm shadow-teal/20"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Nouveau chez Tastify ?{' '}
            <Link to="/register" className="font-semibold text-teal hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
