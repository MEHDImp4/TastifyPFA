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
  Settings,
  Activity
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
    flex items-center gap-4 px-8 py-3.5 transition-all duration-200 group relative border-l-2
    ${isActive 
      ? 'text-on-background bg-surface-container-high font-bold border-on-background border-primary' 
      : 'text-on-surface-variant hover:text-on-background hover:bg-surface-container-low border-transparent'
    }
  `;

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 z-40 md:hidden backdrop-blur-md"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-surface border-r border-outline
        transform transition-all duration-300
        md:relative md:flex md:flex-col md:translate-x-0 md:w-64
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 pb-10">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tighter text-on-background uppercase">Tastify.</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar">
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
                {({ isActive }) => (
                  <>
                    <Icon strokeWidth={isActive ? 2 : 1.5} className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-on-background' : 'text-on-surface-variant group-hover:text-on-background'}`} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{link.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-8 border-t border-outline space-y-4 bg-surface">
          <div className="flex items-center justify-between opacity-30">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
              <span className="text-[9px] font-bold uppercase tracking-widest">Active</span>
            </div>
            <span className="font-mono text-[8px]">V4.2</span>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center gap-3 w-full py-3 border border-outline hover:border-error text-on-surface-variant hover:text-error transition-all duration-200 rounded-md group"
          >
            <LogOut strokeWidth={1.5} className="h-4 w-4 ml-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Fermer Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
