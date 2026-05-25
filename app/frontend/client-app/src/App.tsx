import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { PublicLayout } from './layouts/PublicLayout';
import { PortalHomePage } from './pages/Home/PortalHomePage';
import { MenuPage } from './pages/Menu/MenuPage';
import { ReservationWizard } from './pages/Reservations/ReservationWizard';
import { ContactPage } from './pages/Contact/ContactPage';
import { AccountPage } from './pages/Account/AccountPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { CheckoutPage } from './pages/Checkout/CheckoutPage';
import { PaymentPortal } from './pages/Payment/PaymentPortal';
import { LoyaltyPage } from './pages/Loyalty/LoyaltyPage';
import { NotFoundPage } from './pages/System/NotFoundPage';
import { OfflineModePage } from './pages/System/OfflineModePage';
import { useAuthStore } from './store/authStore';

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
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<PortalHomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/reservations" element={<ReservationWizard />} />
        <Route path="/loyalty" element={<LoyaltyPage />} />
        <Route path="/contact" element={<ContactPage />} />
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

        <Route path="/forgot-password" element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        } />

        <Route path="/reset-password" element={
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        } />

        <Route path="/pay/:token" element={<PaymentPortal />} />
        <Route path="/offline" element={<OfflineModePage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};


function App() {
  return (
    <AuthBootstrap>
      <div className="selection:bg-primary/20 selection:text-primary">
        <Toaster position="top-center" richColors theme="dark" />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </div>
    </AuthBootstrap>
  );
}

export default App;
