import { Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { PublicLayout } from './layouts/PublicLayout';
import { useAuthStore } from './store/authStore';
import { useConfigStore } from './store/configStore';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ConsentBanner } from './components/consent/ConsentBanner';
import {
  AccountPage,
  CheckoutPage,
  ContactPage,
  ForgotPassword,
  Login,
  LoyaltyPage,
  MenuPage,
  NotFoundPage,
  OfflineModePage,
  PaymentPortal,
  PortalHomePage,
  Register,
  ReservationWizard,
  ResetPassword,
} from './routes/lazyPages';

import { Toaster } from 'sonner';

const GuestRoute = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const routeTitles: Record<string, string> = {
  '/': 'Tastify — Accueil',
  '/menu': 'Tastify — La Carte',
  '/reservations': 'Tastify — Réservations',
  '/account': 'Tastify — Mon Compte',
  '/login': 'Tastify — Connexion',
  '/register': 'Tastify — Inscription',
  '/forgot-password': 'Tastify — Mot de passe oublié',
  '/reset-password': 'Tastify — Réinitialisation',
  '/checkout': 'Tastify — Panier',
  '/contact': 'Tastify — Contact',
  '/loyalty': 'Tastify — Privilèges',
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
  <div role="status" aria-live="polite" className="flex min-h-[50dvh] items-center justify-center px-client-margin text-ui-label text-on-surface-variant">
    Chargement
  </div>
);

const lazyRoute = (children: ReactNode) => (
  <Suspense fallback={<RouteFallback />}>
    {children}
  </Suspense>
);

const AnimatedRoutes = () => {
  return (
    <>
    <RouteTitle />
    <Routes>
      <Route element={<PublicLayout />}>
        {/* Public Showcase Pages */}
        <Route path="/" element={lazyRoute(<PortalHomePage />)} />
        <Route path="/menu" element={lazyRoute(<MenuPage />)} />
        <Route path="/reservations" element={lazyRoute(<ReservationWizard />)} />

        {/* Member-only Action Pages */}
        <Route path="/loyalty" element={
          lazyRoute(<ProtectedRoute>
            <LoyaltyPage />
          </ProtectedRoute>)
        } />

        <Route path="/account" element={
          lazyRoute(<ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>)
        } />

        {/* Guest-only Auth Pages */}
        <Route path="/login" element={
          lazyRoute(<GuestRoute>
            <Login />
          </GuestRoute>)
        } />

        <Route path="/register" element={
          lazyRoute(<GuestRoute>
            <Register />
          </GuestRoute>)
        } />

        <Route path="/forgot-password" element={
          lazyRoute(<GuestRoute>
            <ForgotPassword />
          </GuestRoute>)
        } />

        <Route path="/reset-password" element={
          lazyRoute(<GuestRoute>
            <ResetPassword />
          </GuestRoute>)
        } />

        {/* Global Helpers */}
        <Route path="/checkout" element={lazyRoute(<CheckoutPage />)} />
        <Route path="/contact" element={lazyRoute(<ContactPage />)} />
        <Route path="/pay/:token" element={lazyRoute(<PaymentPortal />)} />
        <Route path="/offline" element={lazyRoute(<OfflineModePage />)} />
        <Route path="*" element={lazyRoute(<NotFoundPage />)} />
      </Route>
    </Routes>
    </>
  );
};


function App() {
  const { fetchConfig } = useConfigStore();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <ErrorBoundary>
    <MotionConfig reducedMotion="user">
      <AuthBootstrap>
        <div className="selection:bg-primary/20 selection:text-primary">
          <Toaster position="top-center" richColors closeButton />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
          <ConsentBanner />
        </div>
      </AuthBootstrap>
    </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
