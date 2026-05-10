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
  LogOut
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setMobileOpen }) => {
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
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
    ${isActive 
      ? 'bg-dark-elevated text-teal border-l-2 border-teal' 
      : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
    }
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
        md:relative md:translate-x-0 flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold font-sans tracking-tight text-white">Tastify<span className="text-teal">.</span></h2>
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
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl text-terracotta hover:bg-terracotta/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};