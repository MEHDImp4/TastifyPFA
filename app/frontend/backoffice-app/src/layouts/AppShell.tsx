import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet } from 'react-router-dom';

export const AppShell: React.FC = () => {
  const [isMobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-dark text-white">
      <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar setMobileOpen={setMobileOpen} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};