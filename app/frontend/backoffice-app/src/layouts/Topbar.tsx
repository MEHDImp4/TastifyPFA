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
    <header className="h-16 bg-surface border-b border-outline flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu de navigation"
          aria-expanded={isMobileOpen}
          className="flex h-11 w-11 items-center justify-center border border-outline text-on-surface-variant hover:text-on-background hover:bg-background md:hidden rounded transition-all"
        >
          <Menu strokeWidth={2} className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-6 border-r border-outline pr-8 h-8">
          <SocketIndicator />
          <NotificationCenter />
          <div className="text-on-surface-variant hover:text-success transition-all cursor-help opacity-40 hover:opacity-100">
            <ShieldCheck className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>
        
        <div className="flex items-center gap-4 group pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-bold text-on-background uppercase tracking-wider">{username}</p>
            <p className="text-[8px] font-bold text-on-surface-variant tracking-widest mt-1 uppercase opacity-40">{role}</p>
          </div>
          <div className="w-10 h-10 border border-outline bg-background flex items-center justify-center rounded transition-all group-hover:border-on-background">
            <User strokeWidth={1.5} className="w-5 h-5 text-on-surface-variant group-hover:text-on-background" aria-hidden="true" />
          </div>
        </div>
      </div>
    </header>
  );
};

