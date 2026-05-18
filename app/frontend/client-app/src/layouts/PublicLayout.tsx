import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { User, LogOut, ShoppingBag, MapPin, Phone, Menu, X } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import { BrandWordmark, getBrandName } from '../components/branding/BrandWordmark';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, username, logout } = useAuthStore();
  const { items } = useCartStore();
  const { config } = useConfigStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const brandName = getBrandName(config?.nom);

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
    <div className="min-h-[100dvh] flex flex-col bg-background text-on-background selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <Link 
              to="/" 
              onClick={handleLogoClick}
              className="flex flex-col group transition-transform active:scale-95 z-50"
            >
              <BrandWordmark className="font-serif text-2xl md:text-3xl font-bold tracking-tighter text-on-surface group-hover:text-primary transition-colors italic" />
              <div className="flex items-center gap-2 -mt-1 ml-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[8px] uppercase tracking-[0.4em] font-black text-primary/60">Operational Portal</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-10">
              {[
                { to: '/menu', label: 'Collection' },
                { to: '/reservations', label: 'Placements' },
              ].map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className="relative text-[10px] font-black text-on-surface/60 hover:text-primary transition-all uppercase tracking-[0.3em] group/nav"
                >
                  {link.label}
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-1 bg-primary transition-all group-hover/nav:w-1 group-hover/nav:h-1 rounded-full" />
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <Link 
                to="/checkout" 
                className="relative w-12 h-12 flex items-center justify-center text-on-surface hover:text-primary bg-on-surface/5 hover:bg-primary/5 rounded-full transition-all active:scale-90"
            >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                {items.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center animate-in zoom-in duration-300 shadow-xl border-2 border-white">
                        {items.length}
                    </span>
                )}
            </Link>
            
            <div className="hidden md:block">
              {isAuthenticated ? (
                <div className="flex items-center gap-5">
                  <Link to="/account" className="flex flex-col items-end group">
                    <p className="text-xs font-black text-on-surface capitalize transition-colors group-hover:text-primary">{username}</p>
                    <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em]">Archive Client</p>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-2.5 text-on-surface/40 hover:text-error hover:bg-error/5 rounded-full transition-colors active:scale-90"
                    aria-label="Déconnexion"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="flex items-center gap-3 px-6 py-2.5 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-full font-black transition-all duration-300 active:scale-95 text-xs uppercase tracking-widest"
                >
                  <User className="w-3.5 h-3.5" strokeWidth={3} />
                  <span>Connexion</span>
                </Link>
              )}
            </div>

            <button 
              onClick={toggleMenu}
              className="lg:hidden p-2.5 text-on-surface hover:text-primary bg-primary/5 rounded-full transition-all active:scale-90 z-50"
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {isMenuOpen ? <X className="w-5 h-5" strokeWidth={2.5} /> : <Menu className="w-5 h-5" strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 bg-background z-40 transition-transform duration-500 ease-out-expo ${isMenuOpen ? 'translate-y-0' : '-translate-y-full'} md:hidden pt-24`}>
          <div className="flex flex-col h-full px-5 py-8 gap-8 overflow-y-auto">
            <div className="space-y-4">
              <p className="editorial-kicker mb-6">Navigation Principale</p>
              <Link to="/menu" onClick={() => setIsMenuOpen(false)} className="block text-4xl font-display-accent text-on-surface hover:text-primary transition-colors">Notre Menu</Link>
              <Link to="/reservations" onClick={() => setIsMenuOpen(false)} className="block text-4xl font-display-accent text-on-surface hover:text-primary transition-colors">Réserver une table</Link>
            </div>

            <div className="space-y-4 mt-auto">
              <p className="editorial-kicker mb-6">Votre Compte</p>
              {isAuthenticated ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-xl">
                      {username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-on-surface capitalize">{username}</p>
                      <p className="text-[10px] text-primary font-semibold uppercase tracking-[0.24em]">Client Fidélité</p>
                    </div>
                  </div>
                  <Link to="/account" onClick={() => setIsMenuOpen(false)} className="block w-full py-4 text-center font-semibold text-on-surface border border-outline-variant/70 rounded-xl bg-surface-container-lowest">Mon Espace Client</Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full py-4 bg-error-container/20 text-error font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Se Déconnecter</span>
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-3 w-full py-5 bg-primary text-white rounded-2xl font-semibold text-lg"
                >
                  <User className="w-5 h-5" />
                  <span>Se Connecter</span>
                </Link>
              )}
            </div>

            <div className="pt-8 border-t border-outline-variant/70 space-y-4">
               <div className="flex items-center gap-3 text-on-surface-variant font-medium">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-sm">{config?.adresse || 'Casablanca, Maroc'}</span>
               </div>
               <div className="flex items-center gap-3 text-on-surface-variant font-medium">
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="text-sm">{config?.telephone || '+212 5 22 00 00 00'}</span>
               </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div key={location.pathname} className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>

      <footer className="bg-surface-container-lowest text-on-surface py-16 md:py-24 mt-auto border-t border-outline-variant/70">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link 
              to="/" 
              onClick={handleLogoClick}
              className="flex flex-col group mb-8"
            >
                <BrandWordmark className="font-serif text-2xl md:text-3xl font-bold tracking-tighter text-on-surface group-hover:text-primary transition-colors italic" />
                <span className="text-[9px] uppercase tracking-[0.4em] font-black text-primary/40 -mt-1 ml-0.5">Est. 2026</span>
            </Link>
            <p className="text-on-surface-variant max-w-[40ch] leading-relaxed font-medium text-sm md:text-base">
              {brandName} — Une hospitalité éditoriale pensée pour marier chaleur artisanale, service attentif et orchestration numérique discrète.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-[0.2em] text-primary mb-6 md:mb-8">Navigation</h4>
            <ul className="space-y-3 md:space-y-4 font-sans font-semibold text-sm">
              <li><Link to="/menu" className="text-on-surface-variant hover:text-primary transition-colors">Menu & Carte</Link></li>
              <li><Link to="/reservations" className="text-on-surface-variant hover:text-primary transition-colors">Réservations</Link></li>
              <li><Link to="/account" className="text-on-surface-variant hover:text-primary transition-colors">Mon Espace</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-[0.2em] text-primary mb-6 md:mb-8">Contact</h4>
            <ul className="space-y-3 md:space-y-4 font-sans font-semibold text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-on-surface-variant">{config?.adresse || '123 Avenue Hassan II, Casablanca, Maroc'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="text-on-surface-variant">{config?.telephone || '+212 5 22 00 00 00'}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-5 md:px-8 mt-16 md:mt-24 pt-8 md:pt-10 border-t border-outline-variant/70 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant opacity-70">
          <p className="text-center md:text-left">© {new Date().getFullYear()} {brandName} - Organic Sophistication. Tous droits réservés.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-primary transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
