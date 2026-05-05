import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import CategoriesPage from './pages/Categories';
import PlatsPage from './pages/Plats';
import TablesPage from './pages/Tables';
import { MapView } from './pages/Staff/Map/MapView';
import { OrderingPage } from './pages/Staff/Ordering/OrderingPage';
import { KdsPage } from './pages/Kds/KdsPage';
import Login from '@shared/auth/Login';
import { AuthBootstrap } from '@shared/auth/AuthBootstrap';
import { useAuthStore } from '@shared/auth/useAuthStore';
import { WebSocketProvider } from '@shared/websocket/WebSocketProvider';
import { StaffNotificationManager } from '@shared/websocket/StaffNotificationManager';
import { AppErrorBoundary } from '@shared/ui/AppErrorBoundary';
import {
  GERANT_ROLES,
  KDS_ROLES,
  SALLE_ROLES,
  STAFF_ROLES,
  STAFF_PORTAL_DENIED_MESSAGE,
  getStaffHomePath,
  isRoleAllowed,
} from '@shared/auth/roleAccess';

const StaffEntryRedirect = () => {
  const { user } = useAuthStore();

  return <Navigate to={getStaffHomePath(user?.role)} replace />;
};

const RoleRoute = ({ allowedRoles, children }: { allowedRoles: readonly string[]; children: JSX.Element }) => {
  const { user } = useAuthStore();

  if (!isRoleAllowed(user?.role, allowedRoles)) {
    return <Navigate to={getStaffHomePath(user?.role)} replace />;
  }

  return children;
};

const LoginRoute = () => {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { authError?: string } | null;
  const [kickMessage, setKickMessage] = useState<string | undefined>(routeState?.authError);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role && !isRoleAllowed(user.role, STAFF_ROLES)) {
        clearAuth();
        setKickMessage(STAFF_PORTAL_DENIED_MESSAGE);
        return;
      }
      navigate('/', { replace: true });
    }
  }, [clearAuth, isAuthenticated, navigate, user?.role]);

  return (
    <Login
      onSuccess={(role: any) => {
        if (!isRoleAllowed(role, STAFF_ROLES)) {
          clearAuth();
          setKickMessage(STAFF_PORTAL_DENIED_MESSAGE);
          navigate('/login', { replace: true });
          return;
        }

        navigate('/');
      }}
      allowedRoles={STAFF_ROLES}
      appLabel="Espace Staff"
      appDescription="Acces gerant, salle et cuisine"
      deniedMessage={STAFF_PORTAL_DENIED_MESSAGE}
      variant="staff"
      initialError={kickMessage}
    />
  );
};

function App() {
  return (
    <AppErrorBoundary appLabel="Le back-office">
      <AuthBootstrap>
        <BrowserRouter 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            
            <Route element={<WebSocketProvider><StaffNotificationManager /><AppShell /></WebSocketProvider>}>
              <Route index element={<StaffEntryRedirect />} />
              <Route path="/categories" element={<RoleRoute allowedRoles={GERANT_ROLES}><CategoriesPage /></RoleRoute>} />
              <Route path="/plats" element={<RoleRoute allowedRoles={GERANT_ROLES}><PlatsPage /></RoleRoute>} />
              <Route path="/tables" element={<RoleRoute allowedRoles={GERANT_ROLES}><TablesPage /></RoleRoute>} />
              <Route path="/salle" element={<RoleRoute allowedRoles={SALLE_ROLES}><MapView /></RoleRoute>} />
              <Route path="/tables/:id/order" element={<RoleRoute allowedRoles={SALLE_ROLES}><OrderingPage /></RoleRoute>} />
              <Route path="/kds" element={<RoleRoute allowedRoles={KDS_ROLES}><KdsPage /></RoleRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthBootstrap>
    </AppErrorBoundary>
  );
}

export default App;
