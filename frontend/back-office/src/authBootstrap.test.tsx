import { render, screen } from '@testing-library/react'
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
    ).resolves.toBe(false)

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
    ).resolves.toBe(true)

    expect(post).toHaveBeenCalledWith(
      '/api/users/refresh/',
      {},
      expect.objectContaining({
        withCredentials: true,
      }),
    )
    expect(setAccessToken).toHaveBeenCalledWith('fresh-access-token', {
      username: 'cuisinier_test',
      role: 'CUISINIER',
    })
    expect(clearAuth).not.toHaveBeenCalled()
  })

  it('clears persisted auth when bootstrap refresh fails', async () => {
    const setAccessToken = vi.fn()
    const clearAuth = vi.fn()
    const post = vi.fn().mockRejectedValue(new Error('refresh failed'))

    await expect(
      refreshPersistedSession({
        accessToken: 'expired-access-token',
        isAuthenticated: true,
        setAccessToken,
        clearAuth,
        client: { post },
      }),
    ).resolves.toBe(true)

    expect(post).toHaveBeenCalledTimes(1)
    expect(setAccessToken).not.toHaveBeenCalled()
    expect(clearAuth).toHaveBeenCalledTimes(1)
  })
})
