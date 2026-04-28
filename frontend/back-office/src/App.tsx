import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import CategoriesPage from './pages/Categories';
import Login from '@shared/auth/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onSuccess={() => {}} />} />
        
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
