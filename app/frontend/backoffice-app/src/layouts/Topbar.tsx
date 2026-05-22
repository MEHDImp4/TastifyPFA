import React from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-react';
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
    <header className="h-16 bg-surface-container border-b border-outline-variant flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-6">
        <button 
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center border border-outline-variant text-on-surface transition-colors hover:bg-surface-container-high md:hidden rounded"
        >
          <Menu strokeWidth={2.5} className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={toggleDesktopSidebar}
          className="hidden h-10 items-center gap-3 rounded border border-outline-variant bg-surface-container-low px-4 text-xs font-black text-on-surface transition-all duration-150 ease-out-expo hover:bg-surface-container-high active:scale-[0.97] md:inline-flex"
        >
          <DesktopToggleIcon strokeWidth={2.5} className="h-4 w-4" />
          <span className="font-sans text-[10px] font-black uppercase tracking-[0.1em]">{isDesktopCollapsed ? 'EXPAND' : 'COLLAPSE'}</span>
        </button>
        
        <div className="hidden lg:flex items-center gap-2 px-4 border-l border-outline-variant/30 ml-2">
            <span className="font-sans text-[11px] font-black text-on-surface tracking-[0.2em] uppercase">COMMAND CENTER</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 border-r border-outline-variant/30 pr-6">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/5 border border-success/20">
             <SocketIndicator />
          </div>
          <NotificationCenter />
          <button className="text-on-surface-variant hover:text-on-surface p-2 rounded hover:bg-surface-container-high transition-all">
            <ShieldCheck className="w-4.5 h-4.5" />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block leading-none">
            <p className="font-sans text-[12px] font-black text-on-surface uppercase tracking-tight">{username}</p>
            <p className="font-sans text-[9px] font-bold text-primary tracking-[0.2em] mt-1.5 uppercase opacity-80">{role}</p>
          </div>
          <div className="w-10 h-10 border border-outline-variant bg-surface-container-highest flex items-center justify-center overflow-hidden rounded shadow-inner">
            <span className="font-sans font-black text-primary text-sm">{username?.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

