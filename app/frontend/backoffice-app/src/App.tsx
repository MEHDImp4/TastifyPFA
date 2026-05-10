import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthBootstrap>
      <div className="dark">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={
              <div className="min-h-[100dvh] flex items-center justify-center bg-[#1a323b] text-white">
                <div className="p-8 bg-[#264653] rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border border-white/10">
                  <h1 className="text-3xl font-bold font-sans tracking-tight mb-6 text-center">Tastify Staff</h1>
                  <button className="w-full py-3 bg-[#2A9D8F] text-white rounded-lg font-medium transition-transform hover:brightness-110 active:scale-95">
                    Connexion
                  </button>
                </div>
              </div>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <div className="p-8"><h1 className="text-4xl text-white">Dashboard</h1></div>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthBootstrap>
  );
}

export default App;