import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { useAuthStore } from './store/authStore';
import { Login } from './pages/auth/Login';
import { AppShell } from './layouts/AppShell';
import { CategoryPage } from './pages/Categories/CategoryPage';
import { PlatPage } from './pages/Menu/PlatPage';
import { SallePage } from './pages/Staff/SallePage';
import { OrderingPage } from './pages/Staff/OrderingPage';
import { KdsPage } from './pages/Staff/KdsPage';
import { ReservationsPage } from './pages/Staff/ReservationsPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { StockPage } from './pages/Inventory/StockPage';
import { HrPage } from './pages/HR/HrPage';
import { AvisPage } from './pages/Avis/AvisPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { MaintenancePage } from './pages/System/MaintenancePage';
import { DeliveryHubPage } from './pages/Staff/DeliveryHubPage';
import { WebSocketProvider } from './contexts/WebSocketProvider';

import { Toaster } from 'sonner';

type StaffRole = 'GERANT' | 'SERVEUR' | 'CUISINIER';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const ROLE_HOME: Record<string, string> = { SERVEUR: '/salle', CUISINIER: '/kds' };

const RoleRoute = ({
  allowedRoles,
  children,
}: {
  allowedRoles: StaffRole[];
  children: React.ReactNode;
}) => {
  const role = useAuthStore(state => state.role) as StaffRole | null;

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_HOME[role ?? ''] ?? '/'} replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const role = useAuthStore(state => state.role);
  if (isAuthenticated) return <Navigate to={ROLE_HOME[role ?? ''] ?? '/'} replace />;
  return <>{children}</>;
};

const RoleIndex = () => {
  const role = useAuthStore(state => state.role);
  const home = ROLE_HOME[role ?? ''];
  if (home) return <Navigate to={home} replace />;
  return <DashboardPage />;
};

function App() {
  return (
    <AuthBootstrap>
      <WebSocketProvider>
        <div className="selection:bg-primary/20 selection:text-primary">
          <Toaster position="top-right" richColors theme="dark" />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              
              <Route path="/ordering/:tableId" element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['GERANT', 'SERVEUR']}>
                    <div className="min-h-[100dvh] bg-background text-on-background p-6 md:p-8">
                      <OrderingPage />
                    </div>
                  </RoleRoute>
                </ProtectedRoute>
              } />

              <Route path="/" element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }>
                <Route index element={<RoleIndex />} />
                <Route path="menu" element={
                  <RoleRoute allowedRoles={['GERANT', 'CUISINIER']}>
                    <PlatPage />
                  </RoleRoute>
                } />
                <Route path="categories" element={
                  <RoleRoute allowedRoles={['GERANT']}>
                    <CategoryPage />
                  </RoleRoute>
                } />
                <Route path="salle" element={
                  <RoleRoute allowedRoles={['GERANT', 'SERVEUR']}>
                    <SallePage />
                  </RoleRoute>
                } />
                <Route path="reservations" element={
                  <RoleRoute allowedRoles={['GERANT', 'SERVEUR']}>
                    <ReservationsPage />
                  </RoleRoute>
                } />
                <Route path="kds" element={
                  <RoleRoute allowedRoles={['GERANT', 'CUISINIER']}>
                    <KdsPage />
                  </RoleRoute>
                } />
                <Route path="stock" element={
                  <RoleRoute allowedRoles={['GERANT']}>
                    <StockPage />
                  </RoleRoute>
                } />
                <Route path="hr" element={
                  <RoleRoute allowedRoles={['GERANT']}>
                    <HrPage />
                  </RoleRoute>
                } />
                <Route path="avis" element={
                  <RoleRoute allowedRoles={['GERANT']}>
                    <AvisPage />
                  </RoleRoute>
                } />
                <Route path="settings" element={
                  <RoleRoute allowedRoles={['GERANT']}>
                    <SettingsPage />
                  </RoleRoute>
                } />
                <Route path="maintenance" element={
                  <RoleRoute allowedRoles={['GERANT']}>
                    <MaintenancePage />
                  </RoleRoute>
                } />
                <Route path="delivery" element={
                  <RoleRoute allowedRoles={['GERANT', 'SERVEUR']}>
                    <DeliveryHubPage />
                  </RoleRoute>
                } />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </div>
      </WebSocketProvider>
    </AuthBootstrap>
  );
}

export default App;
