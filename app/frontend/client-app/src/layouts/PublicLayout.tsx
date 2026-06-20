import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useConfigStore } from '../store/configStore';
import { LogOut, Menu, X, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { publicPagePreloads } from '../routes/lazyPages';

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
  const preloadRoute = (to: string) => {
    void publicPagePreloads[to]?.();
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const navLinks = [
    { to: '/menu', label: 'La carte' },
    { to: '/reservations', label: 'Réservations' },
  ];

  if (isAuthenticated) {
    navLinks.splice(2, 0, { to: '/loyalty', label: 'Fidélité' });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background overflow-x-hidden font-body selection:bg-on-background selection:text-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-on-background focus:text-background focus:rounded-md focus:text-[11px] focus:font-bold focus:uppercase focus:tracking-widest focus:no-underline">
        Aller au contenu principal
      </a>
      <header className="sticky top-0 z-50 glass-navbar shrink-0">
        <div className="max-w-[1200px] mx-auto px-client-margin h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-8 min-w-0">
            <Link 
              to="/" 
              onClick={handleLogoClick}
              onFocus={() => preloadRoute('/')}
              onPointerEnter={() => preloadRoute('/')}
              className="flex min-h-11 items-center group transition-all active:scale-95 z-50 min-w-0"
            >
              <span className="text-xl font-bold font-heading tracking-widest text-primary uppercase truncate max-w-[42vw] sm:max-w-none transition-all duration-300 group-hover:text-accent">
                  {config?.nom || "tastify."}
              </span>
            </Link>
 
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  onFocus={() => preloadRoute(link.to)}
                  onPointerEnter={() => preloadRoute(link.to)}
                  className={`relative inline-flex min-h-11 items-center px-1 text-[11px] font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:text-primary after:absolute after:bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:bg-accent after:transition-transform hover:after:origin-left hover:after:scale-x-100 ${
                    location.pathname === link.to ? 'text-primary after:scale-x-100 after:bg-primary' : 'text-on-surface-subtle'
                  }`}
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
                onFocus={() => preloadRoute('/checkout')}
                onPointerEnter={() => preloadRoute('/checkout')}
                className="btn-primary min-w-11 px-4 py-2 flex items-center gap-2 shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="font-mono text-xs">{cartCount}</span>
              </Link>
            )}
 
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-4 pl-4 border-l border-outline">
                  <Link
                    to="/account"
                    onFocus={() => preloadRoute('/account')}
                    onPointerEnter={() => preloadRoute('/account')}
                    className="flex min-h-11 flex-col items-end justify-center group leading-none"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface transition-colors group-hover:text-primary">{username}</p>
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
                  onFocus={() => preloadRoute('/login')}
                  onPointerEnter={() => preloadRoute('/login')}
                  className="btn-secondary min-h-11 px-5 py-2.5 flex items-center justify-center"
                >
                  S'identifier
                </Link>
              )}
            </div>
 
            <button
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Fermer la navigation" : "Ouvrir la navigation"}
              aria-expanded={isMenuOpen}
              className="relative z-50 lg:hidden p-2 text-on-background min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
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
            className="fixed inset-0 bg-background/98 z-40 lg:hidden pt-28 px-client-margin flex flex-col h-dvh overflow-y-auto custom-scrollbar"
            style={{ overscrollBehavior: 'contain' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(180,83,9,0.04),transparent_50%)] pointer-events-none" />
            <span className="sr-only">Navigation invitée</span>
            <div className="flex flex-col gap-6 relative z-10">
              {navLinks.map((link) => (
                <Link
                    key={link.to}
                    to={link.to}
                    onFocus={() => preloadRoute(link.to)}
                    onPointerEnter={() => preloadRoute(link.to)}
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-4xl font-bold font-heading tracking-wider break-words transition-all duration-300 uppercase ${
                      location.pathname === link.to
                        ? 'text-primary pl-2 border-l-2 border-primary'
                        : 'text-on-surface-subtle hover:text-primary hover:pl-2'
                    }`}
                >
                    {link.label}
                </Link>
              ))}
            </div>
 
            <div className="mt-auto py-12 border-t border-outline/60 flex flex-col gap-6 relative z-10">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-semibold text-on-background py-2"
                  >
                    Mon compte ({username})
                  </Link>
                  <button onClick={handleLogout} className="btn-secondary justify-center text-error hover:border-error">Fermer la session</button>
                </>
              ) : (
                <Link
                  to="/login"
                  onFocus={() => preloadRoute('/login')}
                  onPointerEnter={() => preloadRoute('/login')}
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-primary w-full h-14 flex items-center justify-center"
                >
                  Se connecter
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
