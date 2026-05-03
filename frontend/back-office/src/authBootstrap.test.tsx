import axios from 'axios'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AuthBootstrap,
  refreshPersistedSession,
} from '@shared/auth/AuthBootstrap'
import { useAuthStore } from '@shared/auth/useAuthStore'

vi.mock('axios')

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
        accessToken: 'expired-access-token',
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
        accessToken: 'expired-access-token',
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
        accessToken: 'expired-access-token',
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
})
