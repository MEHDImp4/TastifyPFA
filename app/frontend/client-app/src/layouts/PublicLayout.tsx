import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { LogOut, ShoppingBag, Menu, X } from 'lucide-react';
import { BrandWordmark } from '../components/branding/BrandWordmark';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, username, logout } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (isMenuOpen) setIsMenuOpen(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white text-[#111111] selection:bg-[#8d4e1c]/10 selection:text-[#8d4e1c]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#EAEAEA]">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link 
              to="/" 
              onClick={handleLogoClick}
              className="flex items-center gap-2 group transition-transform active:scale-95 z-50"
            >
              <BrandWordmark className="text-xl font-bold tracking-tight uppercase" />
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {[
                { to: '/menu', label: 'Menu' },
                { to: '/reservations', label: 'Réservations' },
                { to: '#contact', label: 'Contact' },
              ].map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className="text-xs font-bold uppercase tracking-[0.2em] text-[#787774] hover:text-[#111111] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <Link 
                to="/checkout" 
                className="relative w-10 h-10 flex items-center justify-center hover:bg-[#F7F6F3] rounded-lg transition-all active:scale-90"
            >
                <ShoppingBag className="w-5 h-5" strokeWidth={2} />
                {items.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#111111] text-white text-[8px] font-black rounded-full flex items-center justify-center">
                        {items.length}
                    </span>
                )}
            </Link>
            
            <div className="hidden md:block">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <Link to="/account" className="flex flex-col items-end group">
                    <p className="text-[10px] font-black text-[#111111] uppercase tracking-wider">{username}</p>
                    <p className="text-[8px] text-[#787774] font-bold uppercase tracking-widest">Espace Client</p>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-[#787774] hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/reservations"
                  className="px-5 py-2 bg-[#111111] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-all active:scale-95 shadow-lg shadow-black/5"
                >
                  Réserver
                </Link>
              )}
            </div>

            <button 
              onClick={toggleMenu}
              className="md:hidden p-2 hover:bg-[#F7F6F3] rounded-lg transition-all"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-white z-40 md:hidden pt-24 px-6 space-y-12">
            <div className="space-y-6">
              <Link to="/menu" onClick={() => setIsMenuOpen(false)} className="block text-4xl font-serif italic">Notre Menu</Link>
              <Link to="/reservations" onClick={() => setIsMenuOpen(false)} className="block text-4xl font-serif italic">Réservations</Link>
            </div>
            <div className="pt-12 border-t border-[#EAEAEA] space-y-6">
              {isAuthenticated ? (
                <>
                  <Link to="/account" onClick={() => setIsMenuOpen(false)} className="block text-xl font-bold uppercase tracking-widest">Mon Espace Client</Link>
                  <button onClick={handleLogout} className="block text-xl font-bold uppercase tracking-widest text-red-600">Déconnexion</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block text-xl font-bold uppercase tracking-widest">Se Connecter</Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div key={location.pathname} className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
