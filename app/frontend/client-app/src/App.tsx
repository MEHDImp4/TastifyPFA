import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthBootstrap } from './components/auth/AuthBootstrap';

function App() {
  return (
    <AuthBootstrap>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8">
              <h1 className="text-4xl md:text-6xl tracking-tighter leading-none font-bold font-sans text-[#18181B] mb-4">
                Tastify Client Portal
              </h1>
              <p className="text-gray-600 max-w-[65ch] text-center">
                Bienvenue sur l'interface publique.
              </p>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthBootstrap>
  );
}

export default App;