import axios from 'axios'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AuthBootstrap,
  accessTokenOutlivesRefreshWindow,
  accessTokenNeedsBootstrapRefresh,
  refreshPersistedSession,
} from '@shared/auth/AuthBootstrap'
import { getAuthStorageName } from '@shared/auth/portalContext'
import { useAuthStore } from '@shared/auth/useAuthStore'

vi.mock('axios')

const createJwt = (expiresAtSecondsFromNow: number, issuedAtSecondsFromNow = 0) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + expiresAtSecondsFromNow,
      iat: Math.floor(Date.now() / 1000) + issuedAtSecondsFromNow,
    }),
  )

  return `${header}.${payload}.signature`
}

describe('AuthBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: true,
    })
  })

  it('renders immediately when no persisted session exists', () => {
    render(
      <AuthBootstrap>
        <div>ready</div>
      </AuthBootstrap>,
    )

    expect(screen.getByText('ready')).toBeInTheDocument()
  })

  it('falls back to rendering when hydration never completes', async () => {
    vi.useFakeTimers()
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: false,
    })

    render(
      <AuthBootstrap>
        <div>ready</div>
      </AuthBootstrap>,
    )

    expect(screen.queryByText('ready')).not.toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500)
      await Promise.resolve()
    })

    expect(screen.getByText('ready')).toBeInTheDocument()
  })

  it('unblocks rendering when the bootstrap refresh never settles', async () => {
    vi.useFakeTimers()
    vi.mocked(axios.post).mockImplementation(() => new Promise(() => undefined))

    useAuthStore.setState({
      user: { username: 'chef', role: 'CUISINIER' },
      accessToken: 'stale-access-token',
      isAuthenticated: true,
      hasHydrated: true,
    })

    render(
      <AuthBootstrap>
        <div>ready</div>
      </AuthBootstrap>,
    )

    expect(screen.queryByText('ready')).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(6000)
      await Promise.resolve()
    })

    expect(screen.getByText('ready')).toBeInTheDocument()
  })
})

describe('refreshPersistedSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('skips bootstrap refresh when the persisted access token is still valid', async () => {
    const setAccessToken = vi.fn()
    const clearAuth = vi.fn()
    const post = vi.fn()

    await expect(
      refreshPersistedSession({
        accessToken: createJwt(300),
        isAuthenticated: true,
        setAccessToken,
        clearAuth,
        client: { post },
      }),
    ).resolves.toBe('skipped')

    expect(post).not.toHaveBeenCalled()
    expect(setAccessToken).not.toHaveBeenCalled()
    expect(clearAuth).not.toHaveBeenCalled()
  })

  it('skips refresh when there is no persisted authenticated session', async () => {
    const setAccessToken = vi.fn()
    const clearAuth = vi.fn()
    const post = vi.fn()

    await expect(
      refreshPersistedSession({
        accessToken: null,
        isAuthenticated: false,
        setAccessToken,
        clearAuth,
        client: { post },
      }),
    ).resolves.toBe('skipped')

    expect(post).not.toHaveBeenCalled()
    expect(setAccessToken).not.toHaveBeenCalled()
    expect(clearAuth).not.toHaveBeenCalled()
  })

  it('refreshes a persisted session before continuing', async () => {
    const setAccessToken = vi.fn()
    const clearAuth = vi.fn()
    const post = vi.fn().mockResolvedValue({
      data: {
        access: 'fresh-access-token',
        username: 'cuisinier_test',
        role: 'CUISINIER',
      },
    })

    await expect(
      refreshPersistedSession({
        accessToken: createJwt(-60),
        isAuthenticated: true,
        setAccessToken,
        clearAuth,
        client: { post },
      }),
    ).resolves.toBe('refreshed')

    expect(post).toHaveBeenCalledWith(
      '/api/users/refresh/',
      {},
      expect.objectContaining({
        timeout: 5000,
        withCredentials: true,
      }),
    )
    expect(setAccessToken).toHaveBeenCalledWith('fresh-access-token', {
      username: 'cuisinier_test',
      role: 'CUISINIER',
    })
    expect(clearAuth).not.toHaveBeenCalled()
  })

  it('defers bootstrap when the backend is temporarily unavailable', async () => {
    const setAccessToken = vi.fn()
    const clearAuth = vi.fn()
    const post = vi.fn().mockRejectedValue({
      code: 'ERR_NETWORK',
    })

    await expect(
      refreshPersistedSession({
        accessToken: createJwt(-60),
        isAuthenticated: true,
        setAccessToken,
        clearAuth,
        client: { post },
      }),
    ).resolves.toBe('deferred')

    expect(post).toHaveBeenCalledTimes(1)
    expect(setAccessToken).not.toHaveBeenCalled()
    expect(clearAuth).not.toHaveBeenCalled()
  })

  it('clears persisted auth when the refresh token is rejected', async () => {
    const setAccessToken = vi.fn()
    const clearAuth = vi.fn()
    const post = vi.fn().mockRejectedValue({
      response: { status: 401 },
    })

    await expect(
      refreshPersistedSession({
        accessToken: createJwt(-60),
        isAuthenticated: true,
        setAccessToken,
        clearAuth,
        client: { post },
      }),
    ).resolves.toBe('cleared')

    expect(post).toHaveBeenCalledTimes(1)
    expect(setAccessToken).not.toHaveBeenCalled()
    expect(clearAuth).toHaveBeenCalledTimes(1)
  })

  it('rehydrates from localStorage when another tab already refreshed after a 401', async () => {
    const setAccessToken = vi.fn()
    const clearAuth = vi.fn()
    const post = vi.fn().mockRejectedValue({
      response: { status: 401 },
    })
    const refreshedToken = createJwt(300)

    localStorage.setItem(
      getAuthStorageName(),
      JSON.stringify({
        state: {
          accessToken: refreshedToken,
          isAuthenticated: true,
          user: {
            username: 'chef',
            role: 'CUISINIER',
          },
        },
      }),
    )

    await expect(
      refreshPersistedSession({
        accessToken: createJwt(-60),
        isAuthenticated: true,
        setAccessToken,
        clearAuth,
        client: { post },
      }),
    ).resolves.toBe('refreshed')

    expect(post).toHaveBeenCalledTimes(1)
    expect(setAccessToken).toHaveBeenCalledWith(refreshedToken, {
      username: 'chef',
      role: 'CUISINIER',
    })
    expect(clearAuth).not.toHaveBeenCalled()
  })

  it('clears persisted auth without probing refresh when the session is older than the refresh lifetime', async () => {
    const setAccessToken = vi.fn()
    const clearAuth = vi.fn()
    const post = vi.fn()

    await expect(
      refreshPersistedSession({
        accessToken: createJwt(-60, -(24 * 60 * 60 + 60)),
        isAuthenticated: true,
        setAccessToken,
        clearAuth,
        client: { post },
      }),
    ).resolves.toBe('cleared')

    expect(post).not.toHaveBeenCalled()
    expect(setAccessToken).not.toHaveBeenCalled()
    expect(clearAuth).toHaveBeenCalledTimes(1)
  })
})

describe('accessTokenNeedsBootstrapRefresh', () => {
  it('returns false for tokens that remain valid beyond the refresh threshold', () => {
    expect(accessTokenNeedsBootstrapRefresh(createJwt(120))).toBe(false)
  })

  it('returns true for expired tokens', () => {
    expect(accessTokenNeedsBootstrapRefresh(createJwt(-1))).toBe(true)
  })

  it('returns true for malformed tokens', () => {
    expect(accessTokenNeedsBootstrapRefresh('not-a-jwt')).toBe(true)
  })
})

describe('accessTokenOutlivesRefreshWindow', () => {
  it('returns false when the token was issued inside the refresh lifetime window', () => {
    expect(accessTokenOutlivesRefreshWindow(createJwt(-60, -(23 * 60 * 60)))).toBe(false)
  })

  it('returns true when the token was issued before the refresh lifetime window', () => {
    expect(accessTokenOutlivesRefreshWindow(createJwt(-60, -(24 * 60 * 60 + 60)))).toBe(true)
  })
})
