import axios, { AxiosError } from 'axios'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'

import { getAuthPortalHeader, getAuthStorageName, getPortalFromRole } from './portalContext'
import { sanitizePersistedAuthState, useAuthStore } from './useAuthStore'

export interface RefreshResponse {
  access: string
  role?: string
  username?: string
}

interface BootstrapSessionOptions {
  accessToken: string | null
  isAuthenticated: boolean
  role?: string | null
  setAccessToken: (token: string, user?: { role: string; username: string }) => void
  clearAuth: () => void
  client?: Pick<typeof axios, 'post'>
}

export type RefreshPersistedSessionResult =
  | 'skipped'
  | 'refreshed'
  | 'deferred'
  | 'cleared'

const BOOTSTRAP_REQUEST_TIMEOUT_MS = 5000
const BOOTSTRAP_RENDER_DEADLINE_MS = 6000
const BOOTSTRAP_HYDRATION_DEADLINE_MS = 2500
const ACCESS_TOKEN_REFRESH_THRESHOLD_MS = 30_000
const REFRESH_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000 - 5 * 60 * 1000 // 24h - 5m clock skew buffer
const TRANSIENT_BOOTSTRAP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])
const TRANSIENT_BOOTSTRAP_CODES = new Set(['ECONNABORTED', 'ERR_NETWORK'])

const isTransientBootstrapError = (error: unknown) => {
  const axiosError = error as AxiosError | undefined
  const status = axiosError?.response?.status

  if (typeof status === 'number') {
    return TRANSIENT_BOOTSTRAP_STATUSES.has(status)
  }

  if (typeof axiosError?.code === 'string') {
    return TRANSIENT_BOOTSTRAP_CODES.has(axiosError.code)
  }

  return !axiosError?.response
}

const withRenderDeadline = async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

const decodeJwtPayload = (token: unknown) => {
  if (typeof token !== 'string' || token.trim().length === 0) {
    return null
  }

  const segments = token.split('.')

  if (segments.length < 2) {
    return null
  }

  try {
    const normalized = segments[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

export const accessTokenNeedsBootstrapRefresh = (
  accessToken: unknown,
  now = Date.now(),
  thresholdMs = ACCESS_TOKEN_REFRESH_THRESHOLD_MS,
) => {
  const payload = decodeJwtPayload(accessToken)
  const exp = payload?.exp

  if (typeof exp !== 'number') {
    return true
  }

  return exp * 1000 <= now + thresholdMs
}

export const accessTokenOutlivesRefreshWindow = (
  accessToken: unknown,
  now = Date.now(),
  refreshLifetimeMs = REFRESH_TOKEN_LIFETIME_MS,
) => {
  const payload = decodeJwtPayload(accessToken)
  const issuedAt = payload?.iat

  if (typeof issuedAt !== 'number') {
    return false
  }

  return issuedAt * 1000 + refreshLifetimeMs <= now
}

export const refreshPersistedSession = async ({
  accessToken,
  isAuthenticated,
  role,
  setAccessToken,
  clearAuth,
  client = axios,
}: BootstrapSessionOptions) => {
  if (!isAuthenticated || !accessToken) {
    return 'skipped' as const
  }

  if (!accessTokenNeedsBootstrapRefresh(accessToken)) {
    return 'skipped' as const
  }

  if (accessTokenOutlivesRefreshWindow(accessToken)) {
    clearAuth()
    return 'cleared' as const
  }

  try {
    const portal = role ? getPortalFromRole(role) : undefined
    const { data } = await client.post<RefreshResponse>(
      '/api/users/refresh/',
      {},
      {
        withCredentials: true,
        timeout: BOOTSTRAP_REQUEST_TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthPortalHeader(portal),
        },
      },
    )

    setAccessToken(
      data.access,
      data.role && data.username
        ? { role: data.role, username: data.username }
        : undefined,
    )
    return 'refreshed' as const
  } catch (error) {
    if (isTransientBootstrapError(error)) {
      return 'deferred' as const
    }

    // Multi-tab resilience: if the refresh failed with 401, check if another tab 
    // has already updated the access token in localStorage before clearing.
    const axiosError = error as AxiosError
    if (axiosError.response?.status === 401) {
      const storageName = getAuthStorageName()
      const raw = localStorage.getItem(storageName)
      if (raw) {
        try {
          const state = sanitizePersistedAuthState(JSON.parse(raw))
          if (state.accessToken && state.accessToken !== accessToken) {
            // Another tab refreshed successfully. Hydrate and skip clearing.
            setAccessToken(state.accessToken, state.user ?? undefined)
            return 'refreshed' as const
          }
        } catch {
          // Fall through to clearAuth if storage is corrupted
        }
      }
    }

    clearAuth()
    return 'cleared' as const
  }
}

export const AuthBootstrap = ({ children }: PropsWithChildren) => {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)
  const role = useAuthStore((state) => state.user?.role)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const hasBootstrappedRef = useRef(false)
  const [hasHydrationTimedOut, setHasHydrationTimedOut] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (hasHydrated) {
      return
    }

    const timeoutId = setTimeout(() => {
      setHasHydrationTimedOut(true)
    }, BOOTSTRAP_HYDRATION_DEADLINE_MS)

    return () => clearTimeout(timeoutId)
  }, [hasHydrated])

  useEffect(() => {
    if ((!hasHydrated && !hasHydrationTimedOut) || hasBootstrappedRef.current) {
      return
    }

    hasBootstrappedRef.current = true

    if (!isAuthenticated || !accessToken) {
      setIsReady(true)
      return
    }

    let isActive = true

    withRenderDeadline(
        refreshPersistedSession({
          accessToken,
          isAuthenticated,
          role,
          setAccessToken: (token, user) => {
            if (isActive) {
              setAccessToken(token, user)
          }
        },
        clearAuth: () => {
          if (isActive) {
            clearAuth()
          }
        },
      }),
      BOOTSTRAP_RENDER_DEADLINE_MS,
      'deferred',
    )
      .finally(() => {
        setIsReady(true)
      })

    return () => {
      isActive = false
    }
  }, [accessToken, clearAuth, hasHydrated, hasHydrationTimedOut, isAuthenticated, role, setAccessToken])

  if ((!hasHydrated && !hasHydrationTimedOut) || !isReady) {
    return null
  }

  return children
}
