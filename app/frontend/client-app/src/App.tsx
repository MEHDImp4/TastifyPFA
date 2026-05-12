import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { PublicLayout } from './layouts/PublicLayout';
import { PortalHomePage } from './pages/Home/PortalHomePage';
import { MenuPage } from './pages/Menu/MenuPage';
import { ReservationWizard } from './pages/Reservations/ReservationWizard';
import { AccountPage } from './pages/Account/AccountPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { CheckoutPage } from './pages/Checkout/CheckoutPage';
import { PaymentPortal } from './pages/Payment/PaymentPortal';
import { useAuthStore } from './store/authStore';
import { AnimatePresence } from 'framer-motion';

import { Toaster } from 'sonner';

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

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="popLayout">
      <Routes location={location} key={location.pathname}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<PortalHomePage />} />
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

          <Route path="/register" element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          } />

          <Route path="/pay/:token" element={<PaymentPortal />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthBootstrap>
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthBootstrap>
  );
}

export default App;
