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
  toggleDesktopSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isDesktopCollapsed,
  isMobileOpen,
  setMobileOpen,
  toggleDesktopSidebar,
}) => {
  const { role, logout } = useAuthStore();
  const DesktopToggleIcon = isDesktopCollapsed ? PanelLeftOpen : PanelLeftClose;

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
    flex items-center gap-3 rounded-xl border-l-2 px-4 py-3 transition-[background-color,color,border-color,padding] duration-200
    ${isActive 
      ? 'bg-dark-elevated text-teal border-teal' 
      : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
    }
    ${isDesktopCollapsed ? 'md:justify-center md:px-3' : ''}
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
        ${isDesktopCollapsed ? 'md:w-24' : 'md:w-72'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className={`flex items-center border-b border-white/5 p-4 ${isDesktopCollapsed ? 'justify-center md:px-3' : 'justify-between md:px-5'}`}>
          <div
            className={`overflow-hidden transition-[max-width,opacity] duration-200 ${
              isDesktopCollapsed ? 'max-w-48 opacity-100 md:max-w-0 md:opacity-0' : 'max-w-48 opacity-100'
            }`}
          >
            <img src={logoStaff} alt="Tastify Staff" className="h-12 w-auto" />
          </div>
          <button
            type="button"
            onClick={toggleDesktopSidebar}
            className="hidden h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-gray-300 transition-[transform,background-color,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/5 hover:text-white active:scale-[0.97] md:flex"
            aria-label={isDesktopCollapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}
            title={isDesktopCollapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}
          >
            <DesktopToggleIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
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
                <span
                  className={`font-medium transition-[width,opacity] duration-200 ${
                    isDesktopCollapsed ? 'md:w-0 md:overflow-hidden md:opacity-0' : 'md:w-auto md:opacity-100'
                  }`}
                >
                  {link.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => logout()}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-terracotta transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-terracotta/10 active:scale-[0.97] ${isDesktopCollapsed ? 'md:justify-center md:px-3' : ''}`}
            title={isDesktopCollapsed ? 'Déconnexion' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span
              className={`font-medium transition-[width,opacity] duration-200 ${
                isDesktopCollapsed ? 'md:w-0 md:overflow-hidden md:opacity-0' : 'md:w-auto md:opacity-100'
              }`}
            >
              Déconnexion
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
