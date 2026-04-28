import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@shared/auth/useAuthStore';
import { Sidebar } from './Sidebar';

export const AppShell = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="ml-56 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};
