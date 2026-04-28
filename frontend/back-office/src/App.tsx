import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import CategoriesPage from './pages/Categories';
import Login from '@shared/auth/Login';
import { useAuthStore } from '@shared/auth/useAuthStore';

const LoginRoute = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return <Login onSuccess={() => navigate('/')} />;
};

function App() {
  return (
    <BrowserRouter basename="/back-office">
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/categories" replace />} />
          <Route path="/categories" element={<CategoriesPage />} />
          {/* Add more authenticated routes here */}
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
