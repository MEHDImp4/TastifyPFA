import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2 } from 'lucide-react';

import logoStaff from '../../assets/logo-staff.svg';

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
      setAuth(access, role, resUsername);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Identifiants incorrects.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-dark-surface text-white p-4">
      <div className="w-full max-w-md p-8 bg-dark rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="text-center mb-8">
          <img src={logoStaff} alt="Tastify Staff" className="mx-auto h-20 w-auto mb-4" />
          <p className="text-gray-400">Connectez-vous pour accéder au back-office.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-terracotta/20 border border-terracotta/50 text-terracotta text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300" htmlFor="username">Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1a323b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal transition-colors"
              placeholder="admin"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a323b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal transition-colors"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3.5 mt-2 bg-teal text-white rounded-xl font-medium transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Connexion'}
          </button>
        </form>
      </div>
    </div>
  );
};
