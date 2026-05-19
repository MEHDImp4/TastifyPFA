import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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
  Settings
} from 'lucide-react';

import logoStaff from '../assets/logo-staff.svg';

interface SidebarProps {
  isDesktopCollapsed: boolean;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isDesktopCollapsed,
  isMobileOpen,
  setMobileOpen,
}) => {
  const { role, logout } = useAuthStore();

  const getLinks = () => {
    const links = [];
    
    if (role === 'GERANT') {
      links.push({ to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true });
    }

    if (role === 'GERANT' || role === 'SERVEUR') {
      links.push({ to: '/salle', icon: MapIcon, label: 'Plan de Salle' });
      links.push({ to: '/reservations', icon: CalendarDays, label: 'Réservations' });
    }

    if (role === 'GERANT' || role === 'CUISINIER') {
      links.push({ to: '/menu', icon: UtensilsCrossed, label: 'Menu & Plats' });
    }
    
    if (role === 'GERANT') {
      links.push({ to: '/categories', icon: Package, label: 'Catégories' });
      links.push({ to: '/stock', icon: Package, label: 'Stock / Inventaire' });
      links.push({ to: '/hr', icon: Users, label: 'Personnel (RH)' });
      links.push({ to: '/avis', icon: Star, label: 'Avis Clients' });
      links.push({ to: '/settings', icon: Settings, label: 'Paramètres' });
    }

    if (role === 'GERANT' || role === 'CUISINIER') {
      links.push({ to: '/kds', icon: ChefHat, label: 'KDS Cuisine' });
    }

    return links;
  };

  const navClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center gap-3 rounded-xl transition-all duration-200 group border
    ${isActive 
      ? 'border-primary/20 bg-primary-container/20 text-on-primary-container shadow-sm' 
      : 'border-transparent text-on-surface-variant hover:border-outline-variant/60 hover:text-on-surface hover:bg-surface-container'
    }
    ${isDesktopCollapsed 
      ? 'md:justify-center md:p-2 md:aspect-square md:mx-auto md:w-10' 
      : 'px-3 py-2'
    }
  `;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-[#301400]/15 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-surface-container-lowest/95 border-r border-outline-variant/70 backdrop-blur-xl
        transform transition-transform duration-500 ease-out-expo
        md:relative md:flex md:flex-col md:translate-x-0 md:transition-[width]
        ${isDesktopCollapsed ? 'md:w-16' : 'md:w-56'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className={`relative flex items-center p-3 justify-center h-14`}>
          {isDesktopCollapsed ? (
            <div className="flex items-center justify-center w-8 h-8 rounded-xl tonal-spot font-serif italic text-base shadow-sm">
              T
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full px-1">
              <img src={logoStaff} alt="Tastify Staff" className="h-8 w-auto" />
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {getLinks().map((link) => {
            const Icon = link.icon;
            return (
              <NavLink 
                key={link.to} 
                to={link.to} 
                end={link.exact}
                data-testid={`nav-${link.to === '/' ? 'dashboard' : link.to.slice(1).replace('/', '-')}`}
                className={navClass}
                onClick={() => setMobileOpen(false)}
                title={isDesktopCollapsed ? link.label : undefined}
              >
                <Icon strokeWidth={2} className={`h-4 w-4 shrink-0 transition-transform duration-200 group-active:scale-90`} />
                {!isDesktopCollapsed && (
                  <span className="font-sans font-semibold text-xs tracking-wide">{link.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 space-y-1">
          {!isDesktopCollapsed && (
            <div className="px-3 py-1">
               <span className="editorial-kicker text-[9px]">Compte</span>
            </div>
          )}
          <button
            onClick={() => logout()}
            data-testid="logout-button"
            className={`flex items-center gap-3 rounded-xl border border-transparent transition-all duration-200 text-error hover:border-error/10 hover:bg-error-container/30 active:scale-[0.97] group ${
              isDesktopCollapsed ? 'justify-center p-2 w-10 h-10 mx-auto' : 'px-3 py-2 w-full text-left'
            }`}
            title={isDesktopCollapsed ? 'Déconnexion' : undefined}
          >
            <LogOut strokeWidth={2} className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-1" />
            {!isDesktopCollapsed && <span className="font-sans font-semibold text-xs tracking-wide">Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
