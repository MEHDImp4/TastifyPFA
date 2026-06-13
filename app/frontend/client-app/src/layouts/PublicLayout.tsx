import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useConfigStore } from '../store/configStore';
import { LogOut, Menu, X, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, username, logout } = useAuthStore();
  const { items } = useCartStore();
  const cartCount = items.length;
  const { config } = useConfigStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useBodyScrollLock(isMenuOpen);

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

  const navLinks = [
    { to: '/menu', label: 'LA CARTE' },
    { to: '/reservations', label: 'Réservations' },
  ];

  if (isAuthenticated) {
    navLinks.splice(2, 0, { to: '/loyalty', label: 'Privilèges' });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background overflow-x-hidden font-body selection:bg-on-background selection:text-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-on-background focus:text-background focus:rounded-md focus:text-[11px] focus:font-bold focus:uppercase focus:tracking-widest focus:no-underline">
        Aller au contenu principal
      </a>
      <header className="sticky top-0 z-50 bg-background border-b border-outline shrink-0">
        <div className="max-w-[1200px] mx-auto px-client-margin h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-6 min-w-0">
            <Link 
              to="/" 
              onClick={handleLogoClick}
              className="flex items-center group transition-all active:scale-95 z-50 min-w-0"
            >
              <span className="text-xl font-bold tracking-tighter text-on-background uppercase truncate max-w-[42vw] sm:max-w-none">
                  {config?.nom || "tastify."}
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className={`text-[10px] font-bold tracking-widest transition-all hover:text-on-background ${location.pathname === link.to ? 'text-on-background' : 'text-on-surface-variant'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {cartCount > 0 && (
              <Link
                to="/checkout"
                aria-label="Voir le panier"
                className="btn-primary min-w-11 px-3 sm:px-4"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {cartCount}
              </Link>
            )}

            {!isAuthenticated && (
              <Link
                to="/login"
                className="md:hidden min-h-11 inline-flex items-center px-2 text-[10px] font-bold uppercase tracking-widest text-on-background hover:text-on-surface-variant transition-colors"
              >
                Log in
              </Link>
            )}

            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-4 pl-4 border-l border-outline">
                  <Link to="/account" className="flex flex-col items-end group leading-none">
                    <p className="text-[10px] font-bold uppercase tracking-wider">{username}</p>
                  </Link>
                  <button
                    onClick={handleLogout}
                    aria-label="Se déconnecter"
                    className="btn-icon border-transparent bg-transparent hover:text-error hover:border-error/30"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="min-h-11 inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-on-background hover:text-on-surface-variant transition-colors"
                >
                  S'identifier
                </Link>
              )}
            </div>

            <button
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Fermer la navigation" : "Ouvrir la navigation"}
              aria-expanded={isMenuOpen}
              className="relative z-50 lg:hidden p-2 text-on-background min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div
            id="mobile-navigation"
            role="navigation"
            aria-label="Navigation principale"
            className="fixed inset-0 bg-background z-40 lg:hidden pt-24 px-client-margin flex flex-col h-dvh overflow-y-auto custom-scrollbar"
            style={{ overscrollBehavior: 'contain' }}
          >
            <span className="sr-only">Navigation invitée</span>
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-3xl sm:text-4xl font-bold tracking-tight text-on-background break-words"
                >
                    {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-auto py-10 border-t border-outline flex flex-col gap-6">
              {isAuthenticated ? (
                <button onClick={handleLogout} className="btn-secondary justify-start text-error hover:border-error">Fermer la session</button>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn-primary w-full h-14">
                  Connexion Membre
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1 flex flex-col relative min-w-0">
        <Outlet />
      </main>
    </div>
  );
};
