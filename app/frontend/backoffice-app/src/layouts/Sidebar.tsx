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
    }

    if (role === 'GERANT' || role === 'CUISINIER') {
      links.push({ to: '/kds', icon: ChefHat, label: 'KDS Cuisine' });
    }

    return links;
  };

  const navClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center gap-3 rounded-xl transition-all duration-200 group
    ${isActive 
      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
    }
    ${isDesktopCollapsed 
      ? 'md:justify-center md:p-3 md:aspect-square md:mx-auto md:w-12' 
      : 'px-4 py-3'
    }
  `;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-surface-container-lowest border-r border-surface-container-high
        transform transition-transform duration-500 ease-out-expo
        md:relative md:flex md:flex-col md:translate-x-0 md:transition-[width]
        ${isDesktopCollapsed ? 'md:w-24' : 'md:w-72'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className={`relative flex items-center p-6 justify-center h-24`}>
          {isDesktopCollapsed ? (
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold text-2xl shadow-lg shadow-primary/20">
              T
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full px-2">
              <img src={logoStaff} alt="Tastify Staff" className="h-12 w-auto" />
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-hide">
          {getLinks().map((link) => {
            const Icon = link.icon;
            return (
              <NavLink 
                key={link.to} 
                to={link.to} 
                end={link.exact}
                className={navClass}
                onClick={() => setMobileOpen(false)}
                title={isDesktopCollapsed ? link.label : undefined}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-active:scale-90`} />
                {!isDesktopCollapsed && (
                  <span className="font-sans font-semibold text-sm tracking-tight">{link.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 space-y-2">
          {!isDesktopCollapsed && (
            <div className="px-4 py-2">
               <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Compte</span>
            </div>
          )}
          <button
            onClick={() => logout()}
            className={`flex items-center gap-3 rounded-xl transition-all duration-200 text-error hover:bg-error-container/30 active:scale-[0.97] group ${
              isDesktopCollapsed ? 'justify-center p-3 w-12 h-12 mx-auto' : 'px-4 py-3 w-full text-left'
            }`}
            title={isDesktopCollapsed ? 'Déconnexion' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:-translate-x-1" />
            {!isDesktopCollapsed && <span className="font-sans font-semibold text-sm tracking-tight">Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
