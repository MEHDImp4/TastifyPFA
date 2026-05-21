import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="min-h-[100dvh] flex flex-col bg-background text-on-background selection:bg-primary/10 selection:text-primary overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-on-surface/5">
        <div className="max-w-[1400px] mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <Link 
              to="/" 
              onClick={handleLogoClick}
              className="flex items-center gap-2 group transition-transform active:scale-95 z-50"
            >
              <BrandWordmark className="text-2xl font-serif italic font-bold tracking-tight text-primary" />
            </Link>

            <nav className="hidden lg:flex items-center gap-10">
              {[
                { to: '/menu', label: 'Culinaries' },
                { to: '/reservations', label: 'Bookings' },
                { to: '/contact', label: 'Concierge' },
              ].map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className="text-ui-label-bold text-[10px] text-on-surface-variant hover:text-primary transition-all duration-300 relative group/link"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover/link:w-full" />
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-8">
            <Link 
                to="/checkout" 
                className="relative group p-2 transition-all active:scale-90"
            >
                <ShoppingBag className="w-5 h-5 text-on-surface group-hover:text-primary transition-colors" strokeWidth={1.5} />
                {items.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-on-primary text-[8px] font-black rounded-full flex items-center justify-center cinematic-shadow">
                        {items.length}
                    </span>
                )}
            </Link>
            
            <div className="hidden md:block">
              {isAuthenticated ? (
                <div className="flex items-center gap-6 pl-6 border-l border-on-surface/10">
                  <Link to="/account" className="flex flex-col items-end group">
                    <p className="text-[11px] font-black text-on-surface uppercase tracking-wider group-hover:text-primary transition-colors">{username}</p>
                    <p className="text-ui-label-bold text-[8px] text-on-surface-variant/60 tracking-[0.2em]">Guest Profile</p>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-on-surface-variant/40 hover:text-error transition-colors"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/reservations"
                  className="px-8 py-3 bg-on-surface text-background text-[10px] font-black uppercase tracking-[0.25em] transition-all hover:bg-primary active:scale-95 cinematic-shadow"
                >
                  Reserve Now
                </Link>
              )}
            </div>

            <button 
              onClick={toggleMenu}
              className="lg:hidden p-3 bg-surface-container-high rounded-full hover:bg-surface-container-highest transition-all"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5 text-on-surface" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 bg-background z-40 lg:hidden pt-32 px-8 flex flex-col justify-between pb-12"
            >
              <div className="space-y-12">
                <div className="flex flex-col gap-8">
                  <Link to="/menu" onClick={() => setIsMenuOpen(false)} className="text-display-lg text-5xl italic text-on-surface hover:text-primary transition-colors">Our Menu</Link>
                  <Link to="/reservations" onClick={() => setIsMenuOpen(false)} className="text-display-lg text-5xl italic text-on-surface hover:text-primary transition-colors">Bookings</Link>
                  <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="text-display-lg text-5xl italic text-on-surface hover:text-primary transition-colors">Concierge</Link>
                </div>
              </div>
              <div className="pt-12 border-t border-on-surface/5 space-y-8">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-6">
                    <Link to="/account" onClick={() => setIsMenuOpen(false)} className="text-ui-label-bold text-xl text-on-surface">Guest Profile</Link>
                    <button onClick={handleLogout} className="text-ui-label-bold text-xl text-error text-left">Terminate Session</button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="inline-block w-full py-5 bg-on-surface text-background text-center text-ui-label-bold text-base cinematic-shadow">Identify Yourself</Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div key={location.pathname} className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
