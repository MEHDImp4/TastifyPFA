import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { PublicLayout } from './layouts/PublicLayout';
import { PortalHomePage } from './pages/Home/PortalHomePage';
import { MenuPage } from './pages/Menu/MenuPage';
import { ReservationWizard } from './pages/Reservations/ReservationWizard';
import { Login } from './pages/auth/Login';
import { useAuthStore } from './store/authStore';

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthBootstrap>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PortalHomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/reservations" element={<ReservationWizard />} />
            <Route path="/login" element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            } />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthBootstrap>
  );
}

export default App;