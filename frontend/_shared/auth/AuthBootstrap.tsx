import axios from 'axios'
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

export const refreshPersistedSession = async ({
  accessToken,
  isAuthenticated,
  setAccessToken,
  clearAuth,
  client = axios,
}: BootstrapSessionOptions) => {
  if (!isAuthenticated || !accessToken) {
    return false
  }

  try {
    const { data } = await client.post<RefreshResponse>(
      '/api/users/refresh/',
      {},
      {
        withCredentials: true,
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
  } catch {
    clearAuth()
  }

  return true
}

export const AuthBootstrap = ({ children }: PropsWithChildren) => {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const hasBootstrappedRef = useRef(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!hasHydrated || hasBootstrappedRef.current) {
      return
    }

    hasBootstrappedRef.current = true

    if (!isAuthenticated || !accessToken) {
      setIsReady(true)
      return
    }

    let isActive = true

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
    })
      .finally(() => {
        if (isActive) {
          setIsReady(true)
        }
      })

    return () => {
      isActive = false
    }
  }, [accessToken, clearAuth, hasHydrated, isAuthenticated, setAccessToken])

  if (!hasHydrated || !isReady) {
    return null
  }

  return children
}
