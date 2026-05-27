import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useConfigStore } from '../store/configStore';
import { LogOut, Menu, X, Sparkles } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, username, logout } = useAuthStore();
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

  // Base links visible to everyone
  const navLinks = [
    { to: '/menu', label: 'LA CARTE' },
    { to: '/reservations', label: 'RESERVER' },
  ];

  // Add Loyalty link only if authenticated
  if (isAuthenticated) {
    navLinks.splice(2, 0, { to: '/loyalty', label: 'ECHO' });
  }

  // Mobile navigation links
  const mobileLinks = [
    { to: '/menu', label: 'La Carte' },
    { to: '/reservations', label: 'Réservations' },
  ];
  if (isAuthenticated) {
    mobileLinks.push({ to: '/loyalty', label: 'Privilèges' });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#2D2424] selection:bg-[#C5A059]/20 selection:text-[#2D2424] overflow-x-hidden font-body">
      <header className="sticky top-0 z-50 bg-[#FAF9F6]/80 backdrop-blur-xl border-b border-[#2D2424]/5 shrink-0">
        <div className="max-w-[1400px] mx-auto px-client-margin h-20 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <Link 
              to="/" 
              onClick={handleLogoClick}
              className="flex items-center gap-3 group transition-all active:scale-95 z-50"
            >
              {config?.logo ? (
                <img src={config.logo} alt={config.nom} className="h-10 w-auto object-contain" />
              ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col min-w-[120px]"
                >
                    <span className="text-3xl font-serif italic font-black tracking-tight text-[#2D2424] leading-none group-hover:text-[#D14D1A] transition-colors whitespace-nowrap">
                        {config?.nom || "Tastify"}
                    </span>
                    <span className="text-[8px] font-sans font-black uppercase tracking-[0.4em] text-[#C5A059] mt-1">Établissement</span>
                </motion.div>
              )}
            </Link>

            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className="text-ui-label-bold text-[9px] font-black text-[#2D2424]/60 hover:text-[#2D2424] transition-all duration-300 relative group/link uppercase tracking-[0.4em]"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#D14D1A] transition-all duration-300 group-hover/link:w-full" />
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            {!isAuthenticated && (
              <div className="flex items-center gap-4 hidden md:flex">
                <Link
                  to="/login"
                  className="font-sans text-[10px] font-black uppercase tracking-[0.3em] text-[#2D2424]/60 hover:text-[#D14D1A] transition-colors"
                >
                  Accès Membre
                </Link>
              </div>
            )}
            
            <div className="hidden md:block">
              {isAuthenticated ? (
                <div className="flex items-center gap-6 pl-8 border-l border-[#2D2424]/10">
                  <Link to="/account" className="flex flex-col items-end group leading-none">
                    <p className="font-sans text-[11px] font-black text-[#2D2424] uppercase tracking-wider group-hover:text-[#D14D1A] transition-colors">{username}</p>
                    <p className="font-sans text-[8px] font-bold text-[#C5A059] tracking-[0.2em] uppercase mt-1">Privilège</p>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-[#2D2424]/30 hover:text-error transition-colors active:scale-75"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="px-8 py-3 bg-[#2D2424] text-[#FAF9F6] rounded-full font-sans text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:bg-[#D14D1A] active:scale-95 shadow-xl shadow-[#2D2424]/10"
                >
                  S'identifier
                </Link>
              )}
            </div>

            <button 
              onClick={toggleMenu}
              className="lg:hidden p-3 bg-white border border-[#2D2424]/5 rounded-full shadow-sm hover:shadow-md transition-all"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-[#D14D1A]" /> : <Menu className="w-5 h-5 text-[#2D2424]" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="fixed inset-0 bg-[#FAF9F6] z-40 lg:hidden pt-32 px-10 flex flex-col justify-between pb-12"
            >
              <div className="space-y-16">
                <div className="flex flex-col gap-8">
                  {mobileLinks.map((link, i) => (
                    <motion.div 
                        key={link.to}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Link 
                            to={link.to} 
                            onClick={() => setIsMenuOpen(false)} 
                            className="font-serif text-5xl font-black italic text-[#2D2424] hover:text-[#D14D1A] transition-colors tracking-tight"
                        >
                            {link.label}
                        </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="pt-10 border-t border-[#2D2424]/10">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-6">
                    <Link to="/account" onClick={() => setIsMenuOpen(false)} className="font-sans text-xl font-black text-[#2D2424] uppercase tracking-widest flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-[#C5A059]" />
                        Espace Membre
                    </Link>
                    <button onClick={handleLogout} className="font-sans text-lg font-black text-error text-left uppercase tracking-widest opacity-50">Se Déconnecter</button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="inline-block w-full py-6 bg-[#2D2424] text-[#FAF9F6] text-center font-sans text-xs font-black uppercase tracking-[0.4em] rounded-full shadow-2xl">
                    Connexion Membre
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 min-h-0 flex flex-col relative">
        <div key={location.pathname} className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
