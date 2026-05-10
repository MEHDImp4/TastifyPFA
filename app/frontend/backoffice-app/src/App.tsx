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
import { WebSocketProvider } from './contexts/WebSocketProvider';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthBootstrap>
      <WebSocketProvider>
        <div className="dark text-white selection:bg-teal selection:text-white">
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              
              <Route path="/ordering/:tableId" element={
                <ProtectedRoute>
                  <div className="min-h-[100dvh] bg-dark text-white p-6 md:p-8">
                    <OrderingPage />
                  </div>
                </ProtectedRoute>
              } />

              import { DashboardPage } from './pages/Dashboard/DashboardPage';
              ...
                          <Route path="/" element={
                            <ProtectedRoute>
                              <AppShell />
                            </ProtectedRoute>
                          }>
                            <Route index element={<DashboardPage />} />
                            import { StockPage } from './pages/Inventory/StockPage';
                            import { HrPage } from './pages/HR/HrPage';
                            ...
                                            import { AvisPage } from './pages/Avis/AvisPage';
                                            ...
                                                            <Route path="menu" element={<PlatPage />} />
                                                            <Route path="categories" element={<CategoryPage />} />
                                                            <Route path="salle" element={<SallePage />} />
                                                            <Route path="kds" element={<KdsPage />} />
                                                            <Route path="stock" element={<StockPage />} />
                                                            <Route path="hr" element={<HrPage />} />
                                                            <Route path="avis" element={<AvisPage />} />
                                                          </Route>
                                            ...                            ...
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </div>
      </WebSocketProvider>
    </AuthBootstrap>
  );
}

export default App;