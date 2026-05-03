import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  username: string
  role: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  hasHydrated: boolean
  setAuth: (user: User, accessToken: string) => void
  clearAuth: () => void
  setAccessToken: (token: string, user?: User) => void
  setHasHydrated: (hasHydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set: any) => ({
      user: null as User | null,
      accessToken: null as string | null,
      isAuthenticated: false as boolean,
      hasHydrated: false as boolean,
      setAuth: (user, accessToken) => set({ 
        user, 
        accessToken, 
        isAuthenticated: true 
      }),
      clearAuth: () => set({ 
        user: null, 
        accessToken: null, 
        isAuthenticated: false 
      }),
      setAccessToken: (accessToken, user) => set((state: AuthState) => ({
        user: user ?? state.user,
        accessToken,
        isAuthenticated: !!accessToken,
      })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'tastify-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
