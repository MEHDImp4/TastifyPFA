import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { useAuthStore } from './store/authStore';
import { Login } from './pages/auth/Login';
import { AppShell } from './layouts/AppShell';

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
      <div className="dark">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }>
              <Route index element={
                <div className="max-w-7xl mx-auto">
                  <h1 className="text-3xl font-bold tracking-tight mb-8">Dashboard</h1>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 bg-[#325a6a] rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white/10">
                      <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Revenus du jour</p>
                      <p className="text-4xl font-sans font-bold text-white font-mono">0 DH</p>
                    </div>
                  </div>
                </div>
              } />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthBootstrap>
  );
}

export default App;