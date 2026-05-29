import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ChefHat, 
  Users, 
  Package, 
  CalendarDays,
  Map as MapIcon,
  Star,
  LogOut,
  Settings,
  Activity,
  Box
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  setMobileOpen,
}) => {
  const { role, logout } = useAuthStore();

  const getLinks = () => {
    const links = [];
    
    if (role === 'GERANT') {
      links.push({ to: '/', icon: LayoutDashboard, label: 'Tableau de Bord', exact: true });
    }

    if (role === 'GERANT' || role === 'SERVEUR') {
      links.push({ to: '/salle', icon: MapIcon, label: 'Plan de Salle' });
      links.push({ to: '/reservations', icon: CalendarDays, label: 'Réservations' });
    }

    if (role === 'GERANT' || role === 'CUISINIER') {
      links.push({ to: '/menu', icon: UtensilsCrossed, label: 'La Carte' });
    }
    
    if (role === 'GERANT') {
      links.push({ to: '/categories', icon: Package, label: 'Catégories' });
      links.push({ to: '/stock', icon: Activity, label: 'Stock & Logistique' });
      links.push({ to: '/hr', icon: Users, label: 'Registre Personnel' });
      links.push({ to: '/avis', icon: Star, label: 'Avis & Sentiments' });
      links.push({ to: '/settings', icon: Settings, label: 'Paramètres' });
    }

    if (role === 'GERANT' || role === 'CUISINIER') {
      links.push({ to: '/kds', icon: ChefHat, label: 'Cuisine (KDS)' });
    }

    return links;
  };

  const navClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center gap-4 px-8 py-4 transition-all duration-200 group relative border-l-4
    ${isActive 
      ? 'text-primary bg-primary-container/10 font-bold border-primary' 
      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low border-transparent'
    }
  `;

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-surface-container-lowest border-r border-outline-variant
        transform transition-all duration-500 ease-out-expo
        md:relative md:flex md:flex-col md:translate-x-0 md:w-72
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 pb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <Box className="w-6 h-6 text-on-primary" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-on-surface uppercase italic leading-none">Tastify OS</h1>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-50 ml-1">Intelligent Restaurant OS</p>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar">
          {getLinks().map((link) => {
            const Icon = link.icon;
            const testIds: Record<string, string> = {
              '/': 'nav-dashboard',
              '/salle': 'nav-salle',
              '/reservations': 'nav-reservations',
              '/menu': 'nav-menu',
              '/categories': 'nav-categories',
              '/stock': 'nav-stock',
              '/hr': 'nav-hr',
              '/avis': 'nav-avis',
              '/settings': 'nav-settings',
              '/kds': 'nav-kds',
            };
            return (
              <NavLink 
                key={link.to} 
                to={link.to} 
                end={link.exact}
                data-testid={testIds[link.to]}
                className={navClass}
                onClick={() => setMobileOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                        <motion.div 
                            layoutId="active-nav"
                            className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                        />
                    )}
                    <Icon strokeWidth={isActive ? 2.5 : 1.5} className={`h-5 w-5 shrink-0 transition-all duration-300 ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`} />
                    <span className="text-[12px] font-bold uppercase tracking-widest">{link.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-8 border-t border-outline-variant space-y-6 bg-surface-container-lowest">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">System Ready</span>
            </div>
            <span className="font-mono text-[9px] text-on-surface-variant/40">V1.4.2</span>
          </div>

          <button
            onClick={() => logout()}
            data-testid="logout-button"
            className="flex items-center gap-3 w-full py-4 border border-outline-variant hover:border-error/40 hover:bg-error/5 text-on-surface-variant hover:text-error transition-all duration-300 rounded-xl group active:scale-95 shadow-sm"
          >
            <LogOut strokeWidth={2} className="h-4 w-4 ml-5 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest">Fermer Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
