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
    <div className="h-screen flex flex-col bg-background text-on-background selection:bg-primary/20 selection:text-primary overflow-hidden font-body">
      <header className="sticky top-0 z-50 bg-surface-main border-b border-outline-variant shrink-0 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-client-margin h-16 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link 
              to="/" 
              onClick={handleLogoClick}
              className="flex items-center gap-2 group transition-transform active:scale-95 z-50"
            >
              <BrandWordmark className="text-2xl font-serif italic font-black tracking-tight text-primary leading-none" />
            </Link>

            <nav className="hidden lg:flex items-center gap-10">
              {[
                { to: '/menu', label: 'THE CATALOG' },
                { to: '/reservations', label: 'BOOKINGS' },
                { to: '/loyalty', label: 'ECHELON' },
                { to: '/contact', label: 'CONCIERGE' },
              ].map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className="text-ui-label-bold text-[10px] font-black text-on-surface-variant hover:text-primary transition-all duration-300 relative group/link uppercase tracking-[0.3em]"
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
                    <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-on-primary text-[8px] font-black rounded-full flex items-center justify-center shadow-lg">
                        {items.length}
                    </span>
                )}
            </Link>
            
            <div className="hidden md:block">
              {isAuthenticated ? (
                <div className="flex items-center gap-5 pl-8 border-l border-outline-variant/30">
                  <Link to="/account" className="flex flex-col items-end group leading-none">
                    <p className="font-sans text-[11px] font-black text-on-surface uppercase tracking-wider group-hover:text-primary transition-colors">{username}</p>
                    <p className="font-sans text-[8px] font-bold text-on-surface-variant/40 tracking-[0.2em] uppercase mt-1">Echelon Pass</p>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-on-surface-variant/40 hover:text-error transition-colors active:scale-75"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="px-8 py-2.5 bg-primary text-on-primary rounded-xl font-sans text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20 border border-primary"
                >
                  Authenticate
                </Link>
              )}
            </div>

            <button 
              onClick={toggleMenu}
              className="lg:hidden p-3 bg-surface-container-high border border-outline-variant rounded-xl hover:bg-surface-container-highest transition-all"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5 text-on-surface" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed inset-0 bg-background z-40 lg:hidden pt-32 px-client-margin flex flex-col justify-between pb-12 overflow-hidden"
            >
              {/* Background structural detail */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none blueprint-grid" />
              
              <div className="space-y-12 relative z-10">
                <div className="flex flex-col gap-8">
                  <Link to="/menu" onClick={() => setIsMenuOpen(false)} className="font-serif text-5xl font-black italic text-on-surface hover:text-primary transition-colors uppercase tracking-tighter">The Catalog</Link>
                  <Link to="/reservations" onClick={() => setIsMenuOpen(false)} className="font-serif text-5xl font-black italic text-on-surface hover:text-primary transition-colors uppercase tracking-tighter">Bookings</Link>
                  <Link to="/loyalty" onClick={() => setIsMenuOpen(false)} className="font-serif text-5xl font-black italic text-on-surface hover:text-primary transition-colors uppercase tracking-tighter">The Echelon</Link>
                  <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="font-serif text-5xl font-black italic text-on-surface hover:text-primary transition-colors uppercase tracking-tighter">Concierge</Link>
                </div>
              </div>
              <div className="pt-12 border-t border-outline-variant/30 space-y-8 relative z-10">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-6">
                    <Link to="/account" onClick={() => setIsMenuOpen(false)} className="font-sans text-xl font-black text-on-surface uppercase tracking-widest">Guest Profile</Link>
                    <button onClick={handleLogout} className="font-sans text-xl font-black text-error text-left uppercase tracking-widest">Terminate Session</button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="inline-block w-full py-6 bg-primary text-on-primary text-center font-sans text-xs font-black uppercase tracking-[0.4em] rounded-2xl shadow-2xl">Authenticate</Link>
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
