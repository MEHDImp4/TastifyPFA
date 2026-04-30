import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import CategoriesPage from './pages/Categories';
import PlatsPage from './pages/Plats';
import TablesPage from './pages/Tables';
import { MapView } from './pages/Staff/Map/MapView';
import { OrderingPage } from './pages/Staff/Ordering/OrderingPage';
import { KdsPage } from './pages/Staff/KdsPage';
import Login from '@shared/auth/Login';
import { useAuthStore } from '@shared/auth/useAuthStore';
import { isRoleAllowed, STAFF_ROLES } from '@shared/auth/roleAccess';

const StaffEntryRedirect = () => {
  const { user } = useAuthStore();
  const role = user?.role?.toUpperCase();

  if (role === 'SERVEUR') return <Navigate to="/salle" replace />;
  if (role === 'CUISINIER') return <Navigate to="/kds" replace />;

  return <Navigate to="/categories" replace />;
};

const LoginRoute = () => {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role && !isRoleAllowed(user.role, STAFF_ROLES)) {
        clearAuth();
        return;
      }
      navigate('/', { replace: true });
    }
  }, [clearAuth, isAuthenticated, navigate, user?.role]);

  return (
    <Login
      onSuccess={() => navigate('/')}
      allowedRoles={STAFF_ROLES}
      appLabel="Espace Staff"
      appDescription="Acces gerant, salle et cuisine"
      deniedMessage="Ce compte est reserve au portail client."
      variant="staff"
    />
  );
};

function App() {
  return (
    <BrowserRouter 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        
        <Route element={<AppShell />}>
          <Route index element={<StaffEntryRedirect />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/plats" element={<PlatsPage />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/salle" element={<MapView />} />
          <Route path="/tables/:id/order" element={<OrderingPage />} />
          <Route path="/kds" element={<KdsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
