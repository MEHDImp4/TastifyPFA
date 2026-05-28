import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet } from 'react-router-dom';

export const AppShell: React.FC = () => {
  const [isMobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-background text-on-background selection:bg-primary/10">
      <Sidebar
        isMobileOpen={isMobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar
          setMobileOpen={setMobileOpen}
        />
        <main
          className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden"
          tabIndex={0}
          aria-label="Workspace content"
        >
          <div
            className="flex-1 flex flex-col min-h-0 w-full"
            tabIndex={0}
            aria-label="Workspace page content"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
