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
    <header className="h-24 bg-surface border-b border-outline flex items-center justify-between px-5 md:px-8 sticky top-0 z-30 shadow-[0_2px_0px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-6">
        <button 
          onClick={() => setMobileOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-none border border-outline text-on-surface-variant transition-colors hover:bg-surface-container md:hidden bg-surface"
        >
          <Menu strokeWidth={1.5} className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={toggleDesktopSidebar}
          className="hidden h-11 items-center gap-2 rounded-none border border-outline bg-surface-container-low px-4 text-sm font-semibold text-on-surface-variant transition-all duration-300 ease-out-expo hover:bg-surface-container hover:text-on-surface active:scale-[0.97] md:inline-flex"
          aria-label={isDesktopCollapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}
        >
          <DesktopToggleIcon strokeWidth={1.5} className="h-4 w-4" />
          <span className="font-mono font-bold tracking-widest uppercase text-[10px]">{isDesktopCollapsed ? 'Déployer' : 'Réduire'}</span>
        </button>
      </div>

      <div className="flex items-center gap-6">
        <SocketIndicator />
        <NotificationCenter />
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-on-surface capitalize font-sans">{username}</p>
          <p className="text-[10px] text-primary font-bold uppercase tracking-[0.24em] font-mono">{role}</p>
        </div>
        <div className="w-12 h-12 rounded-none tonal-spot flex items-center justify-center font-bold text-lg border border-outline transition-transform hover:scale-105 shadow-[2px_2px_0px_rgba(15,23,42,0.1)]">
          {username?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};
