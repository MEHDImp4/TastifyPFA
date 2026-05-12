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
    <div className="flex h-[100dvh] overflow-hidden bg-dark text-white">
      <Sidebar
        isDesktopCollapsed={isDesktopCollapsed}
        isMobileOpen={isMobileOpen}
        setMobileOpen={setMobileOpen}
        toggleDesktopSidebar={toggleDesktopSidebar}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          isDesktopCollapsed={isDesktopCollapsed}
          setMobileOpen={setMobileOpen}
          toggleDesktopSidebar={toggleDesktopSidebar}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
