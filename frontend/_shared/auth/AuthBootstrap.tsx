import axios, { AxiosError } from 'axios'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'

import { useAuthStore } from './useAuthStore'

export interface RefreshResponse {
  access: string
  role?: string
  username?: string
}

interface BootstrapSessionOptions {
  accessToken: string | null
  isAuthenticated: boolean
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

const decodeJwtPayload = (token: string) => {
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
  accessToken: string,
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

export const refreshPersistedSession = async ({
  accessToken,
  isAuthenticated,
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

  try {
    const { data } = await client.post<RefreshResponse>(
      '/api/users/refresh/',
      {},
      {
        withCredentials: true,
        timeout: BOOTSTRAP_REQUEST_TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
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

    clearAuth()
    return 'cleared' as const
  }
}

export const AuthBootstrap = ({ children }: PropsWithChildren) => {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)
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
        if (isActive) {
          setIsReady(true)
        }
      })

    return () => {
      isActive = false
    }
  }, [accessToken, clearAuth, hasHydrated, hasHydrationTimedOut, isAuthenticated, setAccessToken])

  if ((!hasHydrated && !hasHydrationTimedOut) || !isReady) {
    return null
  }

  return children
}
