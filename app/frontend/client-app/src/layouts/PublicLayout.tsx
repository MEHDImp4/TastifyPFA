import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { User, LogOut, ShoppingBag, MapPin, Phone, Menu, X } from 'lucide-react';

import logoPublic from '../assets/logo-public.svg';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, username, logout } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-on-background font-sans selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-surface-container-high">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-20 md:h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group transition-transform active:scale-95 z-50">
            <img src={logoPublic} alt="Tastify" className="h-8 md:h-10 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            <Link to="/menu" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">Notre Menu</Link>
            <Link to="/reservations" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">Réserver</Link>
          </nav>

          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/checkout" className="relative p-2 md:p-3 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-all active:scale-90">
                <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                {items.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-4 h-4 md:w-5 md:h-5 bg-primary text-white text-[9px] md:text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in duration-300 shadow-lg shadow-primary/20">
                        {items.length}
                    </span>
                )}
            </Link>
            
            <div className="hidden md:block">
              {isAuthenticated ? (
                <div className="flex items-center gap-6">
                  <Link to="/account" className="flex flex-col items-end group">
                    <p className="text-sm font-bold text-on-surface capitalize transition-colors group-hover:text-primary">{username}</p>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Client Fidélité</p>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-3 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-xl transition-colors active:scale-90"
                    aria-label="Déconnexion"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="flex items-center gap-2.5 px-6 py-3 bg-on-surface text-white rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:bg-primary active:scale-95 shadow-lg shadow-on-surface/10"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Connexion</span>
                </Link>
              )}
            </div>

            <button 
              onClick={toggleMenu}
              className="md:hidden p-2 text-on-surface-variant hover:text-primary bg-surface-container-low rounded-xl transition-all active:scale-90 z-50"
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 bg-background z-40 transition-transform duration-500 ease-out-expo ${isMenuOpen ? 'translate-y-0' : '-translate-y-full'} md:hidden pt-24`}>
          <div className="flex flex-col h-full px-5 py-8 gap-8 overflow-y-auto">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">Navigation Principale</p>
              <Link to="/menu" onClick={() => setIsMenuOpen(false)} className="block text-4xl font-display-accent italic text-on-surface hover:text-primary transition-colors">Notre Menu</Link>
              <Link to="/reservations" onClick={() => setIsMenuOpen(false)} className="block text-4xl font-display-accent italic text-on-surface hover:text-primary transition-colors">Réserver une table</Link>
            </div>

            <div className="space-y-4 mt-auto">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">Votre Compte</p>
              {isAuthenticated ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                      {username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-on-surface capitalize">{username}</p>
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest">Client Fidélité</p>
                    </div>
                  </div>
                  <Link to="/account" onClick={() => setIsMenuOpen(false)} className="block w-full py-4 text-center font-bold text-on-surface border border-surface-container-high rounded-xl">Mon Espace Client</Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full py-4 bg-error-container/20 text-error font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Se Déconnecter</span>
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-3 w-full py-5 bg-on-surface text-white rounded-2xl font-bold text-lg"
                >
                  <User className="w-5 h-5" />
                  <span>Se Connecter</span>
                </Link>
              )}
            </div>

            <div className="pt-8 border-t border-surface-container-high space-y-4">
               <div className="flex items-center gap-3 text-on-surface-variant font-medium">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-sm">Casablanca, Maroc</span>
               </div>
               <div className="flex items-center gap-3 text-on-surface-variant font-medium">
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="text-sm">+212 5 22 00 00 00</span>
               </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-surface-container-lowest text-on-surface py-16 md:py-24 mt-auto border-t border-surface-container-high">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-8">
                <img src={logoPublic} alt="Tastify" className="h-8 md:h-10 w-auto" />
            </Link>
            <p className="text-on-surface-variant max-w-[40ch] leading-relaxed font-medium text-sm md:text-base">
              L'expérience culinaire marocaine réinventée par l'intelligence numérique. Frais, local et servi avec une précision chirurgicale.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-primary mb-6 md:mb-8">Navigation</h4>
            <ul className="space-y-3 md:space-y-4 font-sans font-semibold text-sm">
              <li><Link to="/menu" className="text-on-surface-variant hover:text-primary transition-colors">Menu & Carte</Link></li>
              <li><Link to="/reservations" className="text-on-surface-variant hover:text-primary transition-colors">Réservations</Link></li>
              <li><Link to="/account" className="text-on-surface-variant hover:text-primary transition-colors">Mon Espace</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-primary mb-6 md:mb-8">Contact</h4>
            <ul className="space-y-3 md:space-y-4 font-sans font-semibold text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-on-surface-variant">123 Avenue Hassan II,<br/>Casablanca, Maroc</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="text-on-surface-variant">+212 5 22 00 00 00</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-5 md:px-8 mt-16 md:mt-24 pt-8 md:pt-10 border-t border-surface-container-high flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
          <p className="text-center md:text-left">© {new Date().getFullYear()} Tastify - Intelligent Restaurant OS. Tous droits réservés.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-primary transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
