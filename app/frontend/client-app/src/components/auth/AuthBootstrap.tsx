import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useConfigStore } from '../../store/configStore';
import { api } from '../../api/axios';
import { BrandWordmark } from '../branding/BrandWordmark';

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
  const fetchConfig = useConfigStore(state => state.fetchConfig);

  useEffect(() => {
    let active = true;

    (async () => {
      // Create a promise that resolves after 2 seconds
      const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch public configuration in parallel
      const configPromise = fetchConfig();
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
      
      // Wait for both config and the 2s delay
      await Promise.all([configPromise, minDelay]);
      
      if (active) setIsBootstrapping(false);
    })();

    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isBootstrapping) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#fff8f5] p-6">
        <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
            <BrandWordmark className="mb-8 font-sans text-5xl font-bold tracking-tighter" style={{ color: '#8d4e1c' }} />
            <div className="font-black tracking-[0.3em] text-[11px] uppercase" style={{ color: '#301400' }}>Initializing Gateway</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
