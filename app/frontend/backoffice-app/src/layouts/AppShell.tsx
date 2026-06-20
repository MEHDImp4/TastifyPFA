import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet, useLocation } from 'react-router-dom';

export const AppShell: React.FC = () => {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Pages that should be edge-to-edge (no padding)
  const isTacticalPage = ['/kds', '/salle', '/ordering'].some(p => location.pathname.startsWith(p));

  return (
    <div className="h-dvh w-screen flex overflow-hidden bg-background text-on-background">
      <a href="#staff-main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-on-background focus:text-background focus:rounded-md focus:text-[11px] focus:font-bold focus:uppercase focus:tracking-widest focus:no-underline">
        Aller au contenu principal
      </a>
      <Sidebar
        isMobileOpen={isMobileOpen}
        setMobileOpen={setMobileOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar
          setMobileOpen={setMobileOpen}
          isMobileOpen={isMobileOpen}
        />
        
        <main
          id="staff-main-content"
          className={`flex-1 flex flex-col min-h-0 overflow-hidden ${isTacticalPage ? 'p-0' : 'p-staff-gutter md:p-6'}`}
        >
          <div
            className={`flex-1 flex flex-col min-h-0 w-full ${isTacticalPage ? '' : 'max-w-[1600px] mx-auto'}`}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
