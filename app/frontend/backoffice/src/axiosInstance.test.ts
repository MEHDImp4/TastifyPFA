import { describe, expect, it } from 'vitest'

import { getAuthPortalHeader, getPortalFromRole } from '@shared/auth/portalContext'
import { isRetriableProxyError } from '@shared/auth/axiosInstance'

describe('shared auth axios proxy resilience', () => {
  it('retries startup proxy gateway errors', () => {
    expect(
      isRetriableProxyError({
        response: { status: 502 },
      }),
    ).toBe(true)

    expect(
      isRetriableProxyError({
        response: { status: 504 },
      }),
    ).toBe(true)
  })

  it('retries transient transport failures but not application errors', () => {
    expect(
      isRetriableProxyError({
        code: 'ECONNABORTED',
      }),
    ).toBe(true)

    expect(
      isRetriableProxyError({
        response: { status: 400 },
      }),
    ).toBe(false)
  })

  it('resolves portal-specific auth headers from user roles', () => {
    expect(getPortalFromRole('CLIENT')).toBe('client')
    expect(getPortalFromRole('GERANT')).toBe('staff')
    expect(getAuthPortalHeader(getPortalFromRole('CLIENT'))).toEqual({
      'X-Tastify-Portal': 'client',
    })
  })
})
