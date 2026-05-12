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
    <header className="h-20 bg-dark border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setMobileOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-white md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={toggleDesktopSidebar}
          className="hidden h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-medium text-gray-300 transition-[transform,background-color,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/5 hover:text-white active:scale-[0.97] md:inline-flex"
          aria-label={isDesktopCollapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}
        >
          <DesktopToggleIcon className="h-4 w-4" />
          <span>{isDesktopCollapsed ? 'Déployer' : 'Réduire'}</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <SocketIndicator />
        <NotificationCenter />
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white capitalize">{username}</p>
          <p className="text-xs text-teal font-mono">{role}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-dark-elevated flex items-center justify-center text-teal font-bold border border-white/10">
          {username?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};
