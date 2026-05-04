import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@shared/auth/useAuthStore'

describe('shared auth refresh sync', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    })
  })

  it('updates the persisted user when a refresh resolves to a different role', () => {
    useAuthStore.getState().setAuth(
      { username: 'cuisinier_test', role: 'CUISINIER' },
      'old-access-token',
    )

    useAuthStore.getState().setAccessToken('new-access-token', {
      username: 'client_test',
      role: 'CLIENT',
    })

    expect(useAuthStore.getState().accessToken).toBe('new-access-token')
    expect(useAuthStore.getState().user).toEqual({
      username: 'client_test',
      role: 'CLIENT',
    })
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('keeps the current user when refresh only returns a new token', () => {
    useAuthStore.getState().setAuth(
      { username: 'gerant_test', role: 'GERANT' },
      'old-access-token',
    )

    useAuthStore.getState().setAccessToken('new-access-token')

    expect(useAuthStore.getState().user).toEqual({
      username: 'gerant_test',
      role: 'GERANT',
    })
    expect(useAuthStore.getState().accessToken).toBe('new-access-token')
  })
})
