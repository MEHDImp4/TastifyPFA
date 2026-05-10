import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api/axios';

interface AuthState {
  accessToken: string | null;
  role: string | null;
  username: string | null;
  isAuthenticated: boolean;
  hasSession: boolean;
  setAuth: (access: string, role: string, username: string) => void;
  logout: () => Promise<void>;
  logoutLocally: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      role: null,
      username: null,
      isAuthenticated: false,
      hasSession: false,
      setAuth: (access, role, username) => set({
        accessToken: access,
        role: role,
        username: username,
        isAuthenticated: true,
        hasSession: true,
      }),
      logoutLocally: () => {
        set({ accessToken: null, role: null, username: null, isAuthenticated: false, hasSession: false });
      },
      logout: async () => {
        try {
            await api.post('/users/logout/');
        } catch (error) {
            console.error('Logout API failed', error);
        } finally {
            set({ accessToken: null, role: null, username: null, isAuthenticated: false, hasSession: false });
        }
      }
    }),
    {
      name: 'backoffice-auth-storage',
    }
  )
);
