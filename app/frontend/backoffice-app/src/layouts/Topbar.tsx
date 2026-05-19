import React from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { NotificationCenter } from '../components/ui/NotificationCenter';

import { SocketIndicator } from '../components/ui/SocketIndicator';

interface TopbarProps {
  isDesktopCollapsed: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleDesktopSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  isDesktopCollapsed,
  setMobileOpen,
  toggleDesktopSidebar,
}) => {
  const { username, role } = useAuthStore();
  const DesktopToggleIcon = isDesktopCollapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <header className="h-14 bg-surface border-b border-outline flex items-center justify-between px-4 md:px-5 sticky top-0 z-30 shadow-[0_2px_0px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setMobileOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-none border border-outline text-on-surface-variant transition-colors hover:bg-surface-container md:hidden bg-surface"
        >
          <Menu strokeWidth={1.5} className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={toggleDesktopSidebar}
          className="hidden h-8 items-center gap-2 rounded-none border border-outline bg-surface-container-low px-3 text-xs font-semibold text-on-surface-variant transition-all duration-300 ease-out-expo hover:bg-surface-container hover:text-on-surface active:scale-[0.97] md:inline-flex"
          aria-label={isDesktopCollapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}
        >
          <DesktopToggleIcon strokeWidth={1.5} className="h-3.5 w-3.5" />
          <span className="font-mono font-bold tracking-widest uppercase text-[9px]">{isDesktopCollapsed ? 'Déployer' : 'Réduire'}</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <SocketIndicator />
        <NotificationCenter />
        <div className="text-right hidden sm:block leading-none">
          <p className="text-xs font-bold text-on-surface capitalize font-sans">{username}</p>
          <p className="text-[9px] text-primary font-bold uppercase tracking-[0.2em] font-mono mt-0.5">{role}</p>
        </div>
        <div className="w-8 h-8 rounded-none tonal-spot flex items-center justify-center font-bold text-sm border border-outline transition-transform hover:scale-105 shadow-[2px_2px_0px_rgba(15,23,42,0.1)]">
          {username?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};
