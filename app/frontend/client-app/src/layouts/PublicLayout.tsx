import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UtensilsCrossed, User, LogOut } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, username, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f9fafb] text-[#18181B] font-sans selection:bg-teal selection:text-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-dark rounded-xl flex items-center justify-center text-white transform transition-transform duration-200 group-hover:scale-95 group-active:scale-90">
              <UtensilsCrossed className="w-5 h-5 text-teal" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Tastify<span className="text-teal">.</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/menu" className="font-medium text-gray-500 hover:text-[#18181B] transition-colors">Notre Menu</Link>
            <Link to="/reservations" className="font-medium text-gray-500 hover:text-[#18181B] transition-colors">Réserver</Link>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium capitalize">{username}</p>
                  <p className="text-xs text-teal font-mono">Client</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2.5 text-gray-400 hover:text-terracotta hover:bg-terracotta/10 rounded-xl transition-colors"
                  aria-label="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="flex items-center gap-2 px-5 py-2.5 bg-dark text-white rounded-xl font-medium transition-transform duration-200 hover:bg-[#325a6a] active:scale-[0.98] shadow-sm"
              >
                <User className="w-4 h-4" />
                <span>Connexion</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-dark-surface text-white py-16 mt-auto border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="col-span-1 md:col-span-2">
            <span className="text-2xl font-bold tracking-tight mb-4 block">Tastify<span className="text-teal">.</span></span>
            <p className="text-gray-400 max-w-[40ch] leading-relaxed">
              L'expérience culinaire marocaine réinventée. Frais, local et servi avec passion.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-6">Liens Rapides</h4>
            <ul className="space-y-3 text-gray-400">
              <li><Link to="/menu" className="hover:text-white transition-colors">Menu</Link></li>
              <li><Link to="/reservations" className="hover:text-white transition-colors">Réservations</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-6">Contact</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-teal">📍</span>
                <span>123 Avenue Hassan II,<br/>Casablanca, Maroc</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-teal">📞</span>
                <span>+212 5 22 00 00 00</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Tastify. Tous droits réservés.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
