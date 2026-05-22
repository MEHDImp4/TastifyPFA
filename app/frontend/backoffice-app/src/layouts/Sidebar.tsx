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
    flex items-center gap-3 rounded-lg transition-all duration-150 group border-2
    ${isActive 
      ? 'border-on-surface bg-secondary-container text-on-secondary-container font-black' 
      : 'border-transparent text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
    }
    ${isDesktopCollapsed 
      ? 'md:justify-center md:p-2 md:aspect-square md:mx-auto md:w-10' 
      : 'px-4 py-3'
    }
  `;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-[#301400]/40 z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-surface-container border-r-2 border-on-surface
        transform transition-all duration-300 ease-out-expo
        md:relative md:flex md:flex-col md:translate-x-0
        ${isDesktopCollapsed ? 'md:w-20' : 'md:w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className={`flex flex-col p-4 mb-6 ${isDesktopCollapsed ? 'items-center' : 'items-start'}`}>
          {isDesktopCollapsed ? (
            <div className="flex items-center justify-center w-10 h-10 border-2 border-on-surface bg-primary text-on-primary font-serif italic text-xl">
              T
            </div>
          ) : (
            <div className="space-y-1">
              <h1 className="font-serif text-2xl text-primary leading-none italic font-bold">Staff OS</h1>
              <p className="text-ui-label-bold text-[10px] text-on-surface-variant tracking-[0.25em]">Command Center</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-2 overflow-y-auto scrollbar-hide">
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
                <Icon strokeWidth={2.5} className={`h-4.5 w-4.5 shrink-0 transition-transform duration-150 group-active:scale-90`} />
                {!isDesktopCollapsed && (
                  <span className="text-ui-label-bold text-[11px]">{link.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t-2 border-outline-variant space-y-4">
          {!isDesktopCollapsed && (
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                <span className="text-ui-data-dense text-[10px] uppercase tracking-widest text-on-surface-variant">System Sync</span>
              </div>
            </div>
          )}
          <button
            onClick={() => logout()}
            data-testid="logout-button"
            className={`flex items-center gap-3 border-2 border-transparent transition-all duration-150 text-error hover:border-error/20 hover:bg-error-container/10 active:scale-[0.97] group ${
              isDesktopCollapsed ? 'justify-center p-2 w-10 h-10 mx-auto' : 'px-4 py-2 w-full text-left rounded-lg'
            }`}
            title={isDesktopCollapsed ? 'Déconnexion' : undefined}
          >
            <LogOut strokeWidth={2.5} className="h-4.5 w-4.5 shrink-0 transition-transform duration-150 group-hover:-translate-x-1" />
            {!isDesktopCollapsed && <span className="text-ui-label-bold text-[11px]">Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
