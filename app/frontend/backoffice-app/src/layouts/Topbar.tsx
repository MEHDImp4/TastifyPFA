import React from 'react';
import { Menu, ShieldCheck, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { NotificationCenter } from '../components/ui/NotificationCenter';
import { SocketIndicator } from '../components/ui/SocketIndicator';

interface TopbarProps {
  setMobileOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  setMobileOpen,
}) => {
  const { username, role } = useAuthStore();

  return (
    <header className="h-20 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-10 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <button 
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="flex h-12 w-12 items-center justify-center border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-primary/5 md:hidden rounded-lg transition-all"
        >
          <Menu strokeWidth={2.5} className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-10">
        <div className="flex items-center gap-6 border-r border-outline-variant pr-10 h-10">
          <SocketIndicator />
          <NotificationCenter />
          <div className="text-on-surface-variant hover:text-success transition-all cursor-help hover:scale-110">
            <ShieldCheck className="w-6 h-6" strokeWidth={2} />
          </div>
        </div>
        
        <div className="flex items-center gap-5 group cursor-pointer pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-[13px] font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors">{username}</p>
            <p className="text-[9px] font-bold text-on-surface-variant tracking-[0.25em] mt-1 uppercase opacity-60">{role}</p>
          </div>
          <div className="w-12 h-12 border border-outline-variant bg-surface-container-low flex items-center justify-center rounded-xl transition-all group-hover:border-primary group-hover:bg-primary/5 shadow-sm group-hover:shadow-lg group-hover:shadow-primary/10">
            <User strokeWidth={2} className="w-6 h-6 text-on-surface-variant group-hover:text-primary" />
          </div>
        </div>
      </div>
    </header>
  );
};
