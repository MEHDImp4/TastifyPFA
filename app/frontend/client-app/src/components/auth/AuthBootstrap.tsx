import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/axios';

export const AuthBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const { isAuthenticated, setAuth, logoutLocally } = useAuthStore();

  useEffect(() => {
    const controller = new AbortController();

    const bootstrap = async () => {
      if (!isAuthenticated) {
        try {
          const response = await api.post('/users/refresh/', {}, { signal: controller.signal });
          const { access, role, username } = response.data;
          if (!controller.signal.aborted) setAuth(access, role, username);
        } catch {
          if (!controller.signal.aborted) logoutLocally();
        }
      }
      if (!controller.signal.aborted) setIsBootstrapping(false);
    };

    bootstrap();
    return () => controller.abort();
  }, [isAuthenticated, setAuth, logoutLocally]);

  if (isBootstrapping) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#f9fafb] text-[#18181B]">
        <div className="animate-pulse">Chargement de Tastify...</div>
      </div>
    );
  }

  return <>{children}</>;
};
