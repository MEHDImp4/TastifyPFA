import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { LayoutPanelLeft } from 'lucide-react';
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

  if (!isAuthenticated || !user?.role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-teal/30">
      {/* Sidebar - responsive */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 bg-surface/80 backdrop-blur-lg border-b border-white/5 flex items-center justify-between px-4 shrink-0 sticky top-0 z-50">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-foreground-muted hover:text-white transition-all active:scale-90"
            aria-label="Open sidebar"
          >
            <LayoutPanelLeft size={20} />
          </button>
          
          <div className="flex flex-col items-center">
             <span className="font-black text-white text-base tracking-tighter leading-none">Tastify</span>
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-teal mt-1">Staff</span>
          </div>

          <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center border border-teal/20">
             <span className="text-xs font-black text-teal">{user.username.substring(0, 2).toUpperCase()}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

