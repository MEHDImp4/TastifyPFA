import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

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

interface PersistedAuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
}

const AUTH_STORAGE_NAME = 'tastify-auth-storage'
const AUTH_STORAGE_VERSION = 1

const isUser = (value: unknown): value is User => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return typeof candidate.username === 'string' && typeof candidate.role === 'string'
}

export const sanitizePersistedAuthState = (value: unknown): PersistedAuthState => {
  if (!value || typeof value !== 'object') {
    return {
      user: null,
      accessToken: null,
      isAuthenticated: false,
    }
  }

  const candidate = value as Record<string, unknown>
  const persistedState =
    candidate.state && typeof candidate.state === 'object'
      ? (candidate.state as Record<string, unknown>)
      : candidate
  const accessToken =
    typeof persistedState.accessToken === 'string' && persistedState.accessToken.trim().length > 0
      ? persistedState.accessToken
      : null
  const user = isUser(persistedState.user) ? persistedState.user : null

  return {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken),
  }
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
      name: AUTH_STORAGE_NAME,
      version: AUTH_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizePersistedAuthState(persistedState),
      }),
      migrate: (persistedState) => sanitizePersistedAuthState(persistedState),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          localStorage.removeItem(AUTH_STORAGE_NAME)
          state?.clearAuth()
        }

        state?.setHasHydrated(true)
      },
    }
  )
)
