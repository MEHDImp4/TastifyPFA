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
    <div className="h-screen w-screen flex overflow-hidden bg-background text-on-background">
      <Sidebar
        isMobileOpen={isMobileOpen}
        setMobileOpen={setMobileOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar
          setMobileOpen={setMobileOpen}
        />
        
        <main
          className={`flex-1 flex flex-col min-h-0 overflow-hidden ${isTacticalPage ? 'p-0' : 'p-staff-gutter md:p-8'}`}
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
