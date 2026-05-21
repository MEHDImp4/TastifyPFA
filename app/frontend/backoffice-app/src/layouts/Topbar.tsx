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
    <header className="h-16 bg-surface-container-high border-b-2 border-on-surface flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <button 
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center border-2 border-on-surface text-on-surface transition-colors hover:bg-surface-container-highest md:hidden rounded-lg"
        >
          <Menu strokeWidth={2.5} className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={toggleDesktopSidebar}
          className="hidden h-10 items-center gap-3 rounded-lg border-2 border-on-surface bg-background px-4 text-xs font-black text-on-surface transition-all duration-150 ease-out-expo hover:bg-surface-container-highest active:scale-[0.97] md:inline-flex"
          aria-label={isDesktopCollapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}
        >
          <DesktopToggleIcon strokeWidth={2.5} className="h-4 w-4" />
          <span className="text-ui-label-bold text-[10px]">{isDesktopCollapsed ? 'Expand' : 'Collapse'}</span>
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 border-r-2 border-outline-variant pr-6">
          <SocketIndicator />
          <NotificationCenter />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block leading-tight">
            <p className="text-[13px] font-black text-on-surface uppercase tracking-tight font-sans">{username}</p>
            <p className="text-ui-label-bold text-[9px] text-primary tracking-[0.2em] mt-0.5">{role}</p>
          </div>
          <div className="w-10 h-10 border-2 border-on-surface bg-primary-container flex items-center justify-center font-black text-on-primary-container text-sm shadow-[4px_4px_0px_#301400]">
            {username?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
