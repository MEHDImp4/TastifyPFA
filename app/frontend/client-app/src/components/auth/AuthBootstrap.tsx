import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/axios';

import logoPublic from '../../assets/logo-public.svg';

// One promise shared across all effect invocations (StrictMode, re-renders, etc.)
// so the network request fires exactly once per page load.
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isBootstrapping) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-dark text-white p-6">
        <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
            <img src={logoPublic} alt="Tastify" className="h-12 w-auto mb-8 animate-pulse" />
            <div className="text-teal font-medium tracking-widest text-[10px] uppercase">Chargement</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
