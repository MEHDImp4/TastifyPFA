import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useConfigStore } from '../../store/configStore';
import { api } from '../../api/axios';

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
      // Create a promise that resolves after 600ms
      const minDelay = new Promise(resolve => setTimeout(resolve, 600));
      
      // Fetch public configuration in parallel
      const configPromise = fetchConfig();
      const persistedAuth = useAuthStore.getState();
      const hasPersistedToken =
        Boolean(persistedAuth.accessToken) &&
        Boolean(persistedAuth.role) &&
        Boolean(persistedAuth.username);
      const hasSession = persistedAuth.hasSession;
      
      if (!isAuthenticated) {
        if (hasSession && hasPersistedToken && persistedAuth.accessToken && persistedAuth.role && persistedAuth.username) {
          setAuth(persistedAuth.accessToken, persistedAuth.role, persistedAuth.username);
        } else if (hasSession) {
          const data = await attemptRefresh();
          if (!active) return;
          if (data) {
            setAuth(data.access, data.role, data.username);
          } else {
            logoutLocally();
          }
        }
      }
      
      // Wait for both config and the 2s delay
      await Promise.all([configPromise, minDelay]);
      
      if (active) setIsBootstrapping(false);
    })();

    return () => { active = false; };
  }, [fetchConfig, isAuthenticated, logoutLocally, setAuth]);

  if (isBootstrapping) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-6 font-body overflow-hidden">
        <div className="relative">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-col items-center relative z-10"
            >
                <h1 className="text-6xl md:text-7xl font-black text-on-background tracking-tight mb-10 leading-none">
                    Tastify.
                </h1>
                <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                            <motion.div 
                                key={i}
                                animate={{ 
                                    scale: [1, 1.5, 1],
                                    opacity: [0.3, 1, 0.3]
                                }}
                                transition={{ 
                                    repeat: Infinity, 
                                    duration: 1.5, 
                                    delay: i * 0.2,
                                    ease: "easeInOut"
                                }}
                                className="w-1.5 h-1.5 rounded-full bg-on-background"
                            />
                        ))}
                    </div>
                    <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">L'Excellence se prépare</span>
                </div>
            </motion.div>
            
            {/* Soft Luminous Glow */}
            <div className="absolute inset-0 bg-on-background/5 blur-[100px] -z-0 rounded-full" />
        </div>
        
        {/* Fine texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")' }} />
      </div>
    );
  }

  return <>{children}</>;
};
