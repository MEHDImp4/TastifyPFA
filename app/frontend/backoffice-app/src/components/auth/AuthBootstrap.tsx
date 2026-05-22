import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/axios';

let _refreshAttempt: Promise<{ access: string; role: string; username: string } | null> | null = null;
const attemptRefresh = () => {
  if (!_refreshAttempt) {
    _refreshAttempt = api
      .post('/users/refresh/')
      .then(r => r.data as { access: string; role: string; username: string })
      .catch(() => null);
  }
  return _refreshAttempt;
};

export const AuthBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const { isAuthenticated, setAuth, logoutLocally } = useAuthStore();

  useEffect(() => {
    let active = true;

    (async () => {
      const hasSession = useAuthStore.getState().hasSession;
      
      if (!isAuthenticated && hasSession) {
        const data = await attemptRefresh();
        if (!active) return;
        if (data) {
          setAuth(data.access, data.role, data.username);
        } else {
          logoutLocally();
        }
      }
      if (active) setIsBootstrapping(false);
    })();

    return () => { active = false; };
  }, [isAuthenticated, logoutLocally, setAuth]);

  if (isBootstrapping) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-dark-surface text-white">
        <div className="animate-pulse">Authentification sécurisée...</div>
      </div>
    );
  }

  return <>{children}</>;
};
