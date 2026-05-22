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
  Activity,
  Terminal,
  Truck
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
      links.push({ to: '/', icon: LayoutDashboard, label: 'DASHBOARD', exact: true, testId: 'nav-dashboard' });
    }

    if (role === 'GERANT' || role === 'SERVEUR') {
      links.push({ to: '/salle', icon: MapIcon, label: 'FLOOR PLAN', testId: 'nav-salle' });
      links.push({ to: '/reservations', icon: CalendarDays, label: 'RESERVATIONS', testId: 'nav-reservations' });
      links.push({ to: '/delivery', icon: Truck, label: 'DELIVERY HUB', testId: 'nav-delivery' });
    }

    if (role === 'GERANT' || role === 'CUISINIER') {
      links.push({ to: '/menu', icon: UtensilsCrossed, label: 'MENU OPS', testId: 'nav-menu' });
    }
    
    if (role === 'GERANT') {
      links.push({ to: '/categories', icon: Package, label: 'CATEGORIES', testId: 'nav-categories' });
      links.push({ to: '/stock', icon: Activity, label: 'INVENTORY', testId: 'nav-stock' });
      links.push({ to: '/hr', icon: Users, label: 'STAFF MGMT', testId: 'nav-hr' });
      links.push({ to: '/avis', icon: Star, label: 'REVIEWS', testId: 'nav-avis' });
      links.push({ to: '/settings', icon: Settings, label: 'SETTINGS', testId: 'nav-settings' });
    }

    if (role === 'GERANT' || role === 'CUISINIER') {
      links.push({ to: '/kds', icon: ChefHat, label: 'KITCHEN (KDS)', testId: 'nav-kds' });
    }

    return links;
  };

  const navClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center gap-3 rounded-md transition-all duration-150 group border-l-4
    ${isActive 
      ? 'border-primary bg-surface-container-high text-on-surface font-black shadow-lg shadow-black/20' 
      : 'border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
    }
    ${isDesktopCollapsed 
      ? 'md:justify-center md:py-3 md:w-full' 
      : 'px-4 py-3'
    }
  `;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-surface-container-lowest border-r border-outline-variant
        transform transition-all duration-300 ease-out-expo
        md:relative md:flex md:flex-col md:translate-x-0
        ${isDesktopCollapsed ? 'md:w-20' : 'md:w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className={`flex flex-col p-6 mb-4 ${isDesktopCollapsed ? 'items-center' : 'items-start'}`}>
          {!isDesktopCollapsed ? (
            <div className="space-y-1">
              <h1 className="font-serif text-2xl text-primary leading-none font-black tracking-tighter">Tastify OS</h1>
              <p className="font-sans text-[10px] font-black text-on-surface-variant tracking-[0.3em] uppercase">Command Center</p>
            </div>
          ) : (
             <Terminal className="text-primary w-6 h-6" strokeWidth={2.5} />
          )}
        </div>

        <nav className="flex-1 px-0 space-y-1 overflow-y-auto scrollbar-hide">
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
                data-testid={link.testId}
              >
                {({ isActive }) => (
                  <>
                    <Icon strokeWidth={isActive ? 3 : 2} className={`h-4.5 w-4.5 shrink-0 transition-transform duration-150 group-active:scale-90`} />
                    {!isDesktopCollapsed && (
                      <span className="font-sans text-[11px] font-bold tracking-[0.1em]">{link.label}</span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-outline-variant bg-surface-container-low/50 space-y-4">
          {!isDesktopCollapsed && (
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                <span className="font-sans text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant">System Online</span>
              </div>
              <span className="font-mono text-[9px] text-on-surface-variant/40">v1.4.2</span>
            </div>
          )}
          <button
            onClick={() => logout()}
            data-testid="logout-button"
            className={`flex items-center gap-3 border border-outline-variant/30 transition-all duration-150 text-on-surface-variant hover:text-error hover:border-error/50 hover:bg-error/5 active:scale-[0.97] group ${
              isDesktopCollapsed ? 'justify-center p-2 w-10 h-10 mx-auto rounded' : 'px-4 py-2.5 w-full text-left rounded-md'
            }`}
          >
            <LogOut strokeWidth={2.5} className="h-4 w-4 shrink-0" />
            {!isDesktopCollapsed && <span className="font-sans text-[11px] font-bold tracking-[0.1em]">CLOCK OUT</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

