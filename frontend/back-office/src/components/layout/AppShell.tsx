import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuthStore } from '@shared/auth/useAuthStore';
import { isRoleAllowed, STAFF_PORTAL_DENIED_MESSAGE, STAFF_ROLES } from '@shared/auth/roleAccess';
import { Sidebar } from './Sidebar';

const UnauthorizedStaffRedirect = ({ clearAuth }: { clearAuth: () => void }) => {
  useEffect(() => {
    clearAuth();
  }, [clearAuth]);

  return (
    <Navigate
      to="/login"
      replace
      state={{ authError: STAFF_PORTAL_DENIED_MESSAGE }}
    />
  );
};

export const AppShell = () => {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isAuthenticated && user?.role && !isRoleAllowed(user.role, STAFF_ROLES)) {
    return <UnauthorizedStaffRedirect clearAuth={clearAuth} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar - responsive */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-surface border-b border-white/5 flex items-center px-6 shrink-0 sticky top-0 z-30">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-foreground-muted hover:text-white"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 font-bold text-teal text-lg">Tastify</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
