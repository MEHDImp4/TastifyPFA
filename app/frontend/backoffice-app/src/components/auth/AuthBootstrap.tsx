import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/axios';

export const AuthBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const { isAuthenticated, setAuth, logoutLocally } = useAuthStore();

  useEffect(() => {
    const bootstrap = async () => {
      if (!isAuthenticated) {
        try {
          const response = await api.post('/users/refresh/');
          const { access, role, username } = response.data;
          setAuth(access, role, username);
        } catch (error) {
          logoutLocally();
        }
      }
      setIsBootstrapping(false);
    };

    bootstrap();
  }, [isAuthenticated, setAuth, logoutLocally]);

  if (isBootstrapping) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-dark-surface text-white">
        <div className="animate-pulse">Authentification sécurisée...</div>
      </div>
    );
  }

  return <>{children}</>;
};
