import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useConfigStore } from '../store/configStore';
import { LogOut, Menu, X, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, username, logout } = useAuthStore();
  const { items } = useCartStore();
  const cartCount = items.length;
  const { config } = useConfigStore();
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

  const navLinks = [
    { to: '/menu', label: 'CARTE' },
    { to: '/reservations', label: 'RESERVER' },
  ];

  if (isAuthenticated) {
    navLinks.splice(2, 0, { to: '/loyalty', label: 'ECHO' });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background overflow-x-hidden font-body selection:bg-on-background selection:text-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-outline shrink-0">
        <div className="max-w-[1200px] mx-auto px-client-margin h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link 
              to="/" 
              onClick={handleLogoClick}
              className="flex items-center group transition-all active:scale-95 z-50"
            >
              <span className="text-2xl font-serif italic text-on-background tracking-tighter group-hover:opacity-70 transition-opacity">
                  {config?.nom || "tastify."}
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className={`text-ui-label text-[10px] transition-all hover:text-on-background ${location.pathname === link.to ? 'text-on-background' : 'text-on-surface-variant'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {cartCount > 0 && (
              <Link
                to="/checkout"
                className="flex items-center gap-2 px-4 py-2 bg-on-background text-background rounded-md text-[10px] font-bold uppercase tracking-wider"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {cartCount}
              </Link>
            )}
            
            <div className="hidden md:flex items-center gap-6">
              {isAuthenticated ? (
                <div className="flex items-center gap-6 pl-6 border-l border-outline">
                  <Link to="/account" className="flex flex-col items-end group leading-none">
                    <p className="text-[11px] font-bold uppercase tracking-wider">{username}</p>
                    <p className="text-[8px] font-bold text-on-surface-variant tracking-widest uppercase mt-1">Membre</p>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-on-surface-variant hover:text-error transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="text-ui-label text-[10px] text-on-surface-variant hover:text-on-background transition-colors"
                >
                  S'identifier
                </Link>
              )}
            </div>

            <button
              onClick={toggleMenu}
              className="lg:hidden p-2 text-on-background"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed inset-0 bg-background z-40 lg:hidden pt-32 px-10 flex flex-col"
            >
              <div className="flex flex-col gap-10">
                {navLinks.map((link, i) => (
                  <motion.div 
                      key={link.to}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                  >
                      <Link 
                          to={link.to} 
                          onClick={() => setIsMenuOpen(false)} 
                          className="text-5xl font-serif italic text-on-background"
                      >
                          {link.label}
                      </Link>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-auto py-12 border-t border-outline flex flex-col gap-6">
                {isAuthenticated ? (
                  <button onClick={handleLogout} className="text-ui-label text-error text-left">Se Déconnecter</button>
                ) : (
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn-primary w-full">
                    Connexion
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 flex flex-col relative">
        <Outlet />
      </main>
    </div>
  );
};

