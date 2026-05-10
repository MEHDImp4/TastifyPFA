import React from 'react';
import { Menu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface TopbarProps {
  setMobileOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setMobileOpen }) => {
  const { username, role } = useAuthStore();

  return (
    <header className="h-20 bg-dark border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

import { NotificationCenter } from '../components/ui/NotificationCenter';
...
      <div className="flex items-center gap-4">
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