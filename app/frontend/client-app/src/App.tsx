import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { PublicLayout } from './layouts/PublicLayout';
import { PortalHomePage } from './pages/Home/PortalHomePage';
import { MenuPage } from './pages/Menu/MenuPage';
import { ReservationWizard } from './pages/Reservations/ReservationWizard';
import { AccountPage } from './pages/Account/AccountPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { useAuthStore } from './store/authStore';

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthBootstrap>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PortalHomePage />} />
            import { CheckoutPage } from './pages/Checkout/CheckoutPage';
            ...
                        <Route path="/menu" element={<MenuPage />} />
                        <Route path="/reservations" element={<ReservationWizard />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/account" element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            } />

            <Route path="/login" element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            } />

import { PaymentPortal } from './pages/Payment/PaymentPortal';
...
            <Route path="/register" element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            } />

            <Route path="/pay/:token" element={<PaymentPortal />} />

            {/* Fallback */}
...
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthBootstrap>
  );
}

export default App;