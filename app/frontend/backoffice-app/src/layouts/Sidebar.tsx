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
  PanelLeftClose,
  PanelLeftOpen
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
      links.push({ to: '/menu', icon: UtensilsCrossed, label: 'Plats' });
      links.push({ to: '/categories', icon: Package, label: 'Catégories' });
      links.push({ to: '/stock', icon: Package, label: 'Stock' });
      links.push({ to: '/hr', icon: Users, label: 'Personnel' });
      links.push({ to: '/avis', icon: Star, label: 'Avis Clients' });
    }
    
    if (role === 'GERANT' || role === 'SERVEUR') {
      links.push({ to: '/salle', icon: MapIcon, label: 'Plan de Salle' });
      links.push({ to: '/reservations', icon: CalendarDays, label: 'Réservations' });
    }

    if (role === 'GERANT' || role === 'CUISINIER') {
      links.push({ to: '/kds', icon: ChefHat, label: 'KDS Cuisine' });
    }

    return links;
  };

  const navClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center gap-3 rounded-2xl transition-all duration-200
    ${isActive 
      ? 'bg-dark-elevated text-teal shadow-lg shadow-teal/5' 
      : 'text-gray-400 hover:text-white hover:bg-white/5'
    }
    ${isDesktopCollapsed 
      ? 'md:justify-center md:p-3 md:aspect-square md:mx-auto md:w-12' 
      : 'px-4 py-3 border-l-2'
    }
    ${!isDesktopCollapsed && isActive ? 'border-teal' : 'border-transparent'}
  `;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-dark-surface border-r border-white/5
        transform transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
        md:relative md:flex md:flex-col md:translate-x-0 md:transition-[width]
        ${isDesktopCollapsed ? 'md:w-20' : 'md:w-72'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className={`relative flex items-center border-b border-white/5 p-4 justify-center h-20`}>
          {isDesktopCollapsed ? (
            <div className="flex items-center justify-center w-10 h-10 bg-dark-elevated rounded-xl border border-white/10 text-teal font-black text-xl shadow-lg shadow-teal/5 animate-in fade-in zoom-in duration-300">
              T
            </div>
          ) : (
            <div
              className={`overflow-hidden transition-all duration-300 max-w-48 opacity-100 animate-in fade-in slide-in-from-left-2`}
            >
              <img src={logoStaff} alt="Tastify Staff" className="h-12 w-auto" />
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-hide">
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
                <Icon className="h-5 w-5 shrink-0" />
                {!isDesktopCollapsed && (
                  <span className="font-medium">{link.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className={`p-4 border-t border-white/5 ${isDesktopCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => logout()}
            className={`flex items-center gap-3 rounded-xl transition-all duration-200 text-terracotta hover:bg-terracotta/10 active:scale-[0.97] ${
              isDesktopCollapsed ? 'justify-center p-3 w-12 h-12' : 'px-4 py-3 w-full text-left'
            }`}
            title={isDesktopCollapsed ? 'Déconnexion' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isDesktopCollapsed && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
