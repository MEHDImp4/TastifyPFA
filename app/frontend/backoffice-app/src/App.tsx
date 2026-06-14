import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { useAuthStore } from './store/authStore';
import { AppShell } from './layouts/AppShell';
import { WebSocketProvider } from './contexts/WebSocketProvider';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import {
  AvisPage,
  CategoryPage,
  DashboardPage,
  HrPage,
  KdsPage,
  Login,
  MaintenancePage,
  OrderingPage,
  PlatPage,
  ReservationsPage,
  SallePage,
  SettingsPage,
  StockPage,
} from './routes/lazyPages';

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
  return lazyRoute(<DashboardPage />);
};

const routeTitles: Record<string, string> = {
  '/': 'Tastify Staff — Tableau de Bord',
  '/menu': 'Tastify Staff — La Carte',
  '/categories': 'Tastify Staff — Catégories',
  '/salle': 'Tastify Staff — Plan de Salle',
  '/reservations': 'Tastify Staff — Réservations',
  '/kds': 'Tastify Staff — Cuisine (KDS)',
  '/stock': 'Tastify Staff — Stock & Logistique',
  '/hr': 'Tastify Staff — Registre Personnel',
  '/avis': 'Tastify Staff — Avis & Sentiments',
  '/settings': 'Tastify Staff — Paramètres',
  '/maintenance': 'Tastify Staff — Maintenance',
  '/login': 'Tastify Staff — Connexion',
};

const RouteTitle = () => {
  const location = useLocation();
  useEffect(() => {
    const title = routeTitles[location.pathname];
    if (title) document.title = title;
  }, [location.pathname]);
  return null;
};

const RouteFallback = () => (
  <div role="status" aria-live="polite" className="flex min-h-[50dvh] items-center justify-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
    Chargement
  </div>
);

const lazyRoute = (children: React.ReactNode) => (
  <Suspense fallback={<RouteFallback />}>
    {children}
  </Suspense>
);

function App() {
  return (
    <ErrorBoundary>
    <AuthBootstrap>
      <WebSocketProvider>
        <MotionConfig reducedMotion="user">
        <div className="selection:bg-on-background/10 selection:text-on-background">
          <Toaster position="top-right" richColors />
          <BrowserRouter>
            <RouteTitle />
            <Routes>
              <Route path="/login" element={
                lazyRoute(<PublicRoute>
                  <Login />
                </PublicRoute>)
              } />
              
              <Route path="/ordering/:tableId" element={
                lazyRoute(<ProtectedRoute>
                  <RoleRoute allowedRoles={['GERANT', 'SERVEUR']}>
                    <OrderingPage />
                  </RoleRoute>
                </ProtectedRoute>)
              } />

              <Route path="/" element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }>
                <Route index element={<RoleIndex />} />
                <Route path="menu" element={
                  lazyRoute(<RoleRoute allowedRoles={['GERANT', 'CUISINIER']}>
                    <PlatPage />
                  </RoleRoute>)
                } />
                <Route path="categories" element={
                  lazyRoute(<RoleRoute allowedRoles={['GERANT']}>
                    <CategoryPage />
                  </RoleRoute>)
                } />
                <Route path="salle" element={
                  lazyRoute(<RoleRoute allowedRoles={['GERANT', 'SERVEUR']}>
                    <SallePage />
                  </RoleRoute>)
                } />
                <Route path="reservations" element={
                  lazyRoute(<RoleRoute allowedRoles={['GERANT', 'SERVEUR']}>
                    <ReservationsPage />
                  </RoleRoute>)
                } />
                <Route path="kds" element={
                  lazyRoute(<RoleRoute allowedRoles={['GERANT', 'CUISINIER']}>
                    <KdsPage />
                  </RoleRoute>)
                } />
                <Route path="stock" element={
                  lazyRoute(<RoleRoute allowedRoles={['GERANT']}>
                    <StockPage />
                  </RoleRoute>)
                } />
                <Route path="hr" element={
                  lazyRoute(<RoleRoute allowedRoles={['GERANT']}>
                    <HrPage />
                  </RoleRoute>)
                } />
                <Route path="avis" element={
                  lazyRoute(<RoleRoute allowedRoles={['GERANT']}>
                    <AvisPage />
                  </RoleRoute>)
                } />
                <Route path="settings" element={
                  lazyRoute(<RoleRoute allowedRoles={['GERANT']}>
                    <SettingsPage />
                  </RoleRoute>)
                } />
                <Route path="maintenance" element={
                  lazyRoute(<RoleRoute allowedRoles={['GERANT']}>
                    <MaintenancePage />
                  </RoleRoute>)
                } />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </div>
        </MotionConfig>
      </WebSocketProvider>
    </AuthBootstrap>
    </ErrorBoundary>
  );
}

export default App;
