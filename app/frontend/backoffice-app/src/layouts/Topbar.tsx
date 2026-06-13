import React from 'react';
import { Menu, ShieldCheck, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { NotificationCenter } from '../components/ui/NotificationCenter';
import { SocketIndicator } from '../components/ui/SocketIndicator';

interface TopbarProps {
  setMobileOpen: (open: boolean) => void;
  isMobileOpen: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  setMobileOpen,
  isMobileOpen,
}) => {
  const { username, role } = useAuthStore();

  return (
    <header className="min-h-16 bg-surface border-b border-outline flex items-center justify-between gap-3 px-3 py-2 md:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-3 md:gap-6">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu de navigation"
          aria-expanded={isMobileOpen}
          className="btn-icon md:hidden"
        >
          <Menu strokeWidth={2} className="w-5 h-5" />
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-3 md:gap-8">
        <div className="flex items-center gap-2 border-r border-outline pr-3 md:gap-6 md:pr-8">
          <SocketIndicator />
          <NotificationCenter />
          <div className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded border border-transparent text-on-surface-variant transition-all hover:border-outline hover:text-success sm:flex">
            <ShieldCheck className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>
        
        <div className="flex min-w-0 items-center gap-3 group md:gap-4 md:pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-bold text-on-background uppercase tracking-wider">{username}</p>
            <p className="text-[8px] font-bold text-on-surface-variant tracking-widest mt-1 uppercase">{role}</p>
          </div>
          <div className="min-h-[44px] min-w-[44px] border border-outline bg-background flex items-center justify-center rounded transition-all group-hover:border-on-background">
            <User strokeWidth={1.5} className="w-5 h-5 text-on-surface-variant group-hover:text-on-background" aria-hidden="true" />
          </div>
        </div>
      </div>
    </header>
  );
};

