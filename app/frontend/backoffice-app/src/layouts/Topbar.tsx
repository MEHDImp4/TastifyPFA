import React from 'react';
import { Menu, ShieldCheck } from 'lucide-react';
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
    <header className="h-16 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/50 flex items-center justify-between px-6 sticky top-0 z-30 shadow-2xl">
      <div className="flex items-center gap-6">
        <button 
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex h-10 w-10 items-center justify-center border border-outline-variant text-on-surface transition-colors hover:bg-surface-container-high md:hidden rounded-lg"
        >
          <Menu strokeWidth={2.5} className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-5 border-r border-outline-variant/20 pr-8">
          <SocketIndicator />
          <NotificationCenter />
          <button
            type="button"
            aria-label="Statut sécurité"
            title="Statut sécurité"
            className="text-on-surface-variant hover:text-primary p-2 rounded-lg hover:bg-surface-container-high transition-all group"
          >
            <ShieldCheck className="w-5 h-5 transition-transform group-hover:scale-110" strokeWidth={1.5} />
          </button>
        </div>
        
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="text-right hidden sm:block leading-tight">
            <p className="font-sans text-[13px] font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors">{username}</p>
            <p className="font-sans text-[9px] font-black text-primary tracking-[0.25em] mt-1 uppercase opacity-60 italic">{role}</p>
          </div>
          <div className="w-11 h-11 border-2 border-outline-variant bg-surface-container-highest flex items-center justify-center overflow-hidden rounded-xl shadow-xl transition-all group-hover:border-primary group-hover:scale-105">
            <span className="font-serif italic font-black text-primary text-lg">{username?.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
