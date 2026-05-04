import { describe, expect, it } from 'vitest'

import { sanitizePersistedAuthState } from '@shared/auth/useAuthStore'

describe('shared auth persistence', () => {
  it('drops incompatible persisted auth payloads', () => {
    expect(
      sanitizePersistedAuthState({
        user: { username: 'chef' },
        accessToken: 123,
        isAuthenticated: true,
      }),
    ).toEqual({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    })
  })

  it('keeps persisted auth payloads when the token and user are valid', () => {
    expect(
      sanitizePersistedAuthState({
        user: { username: 'chef', role: 'CUISINIER' },
        accessToken: 'fresh-access-token',
        isAuthenticated: false,
      }),
    ).toEqual({
      user: { username: 'chef', role: 'CUISINIER' },
      accessToken: 'fresh-access-token',
      isAuthenticated: true,
    })
  })

  it('restores persisted auth payloads from the zustand storage envelope', () => {
    expect(
      sanitizePersistedAuthState({
        state: {
          user: { username: 'chef', role: 'CUISINIER' },
          accessToken: 'fresh-access-token',
          isAuthenticated: true,
        },
        version: 1,
      }),
    ).toEqual({
      user: { username: 'chef', role: 'CUISINIER' },
      accessToken: 'fresh-access-token',
      isAuthenticated: true,
    })
  })
})
