import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet } from 'react-router-dom';

export const AppShell: React.FC = () => {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isDesktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    const savedState = window.localStorage.getItem('backoffice.sidebar.collapsed');
    setDesktopCollapsed(savedState === 'true');
  }, []);

  const toggleDesktopSidebar = () => {
    setDesktopCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem('backoffice.sidebar.collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background text-on-background selection:bg-primary/10">
      <Sidebar
        isDesktopCollapsed={isDesktopCollapsed}
        isMobileOpen={isMobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar
          isDesktopCollapsed={isDesktopCollapsed}
          setMobileOpen={setMobileOpen}
          toggleDesktopSidebar={toggleDesktopSidebar}
        />
        <main
          className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-background"
          tabIndex={0}
          aria-label="Workspace content"
        >
          <div
            className="max-w-[1700px] mx-auto"
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
