import { describe, expect, it } from 'vitest'
import { getRoleAppUrl, shouldRedirectToRoleApp } from '@shared/auth/roleRedirect'

const locationFor = (port: string) => ({
  protocol: 'http:',
  hostname: 'localhost',
  port,
} as Location)

describe('staff role app redirects', () => {
  it('keeps staff roles on the unified staff frontend', () => {
    expect(getRoleAppUrl('GERANT', locationFor('3000'))).toBe('http://localhost:3000/')
    expect(getRoleAppUrl('SERVEUR', locationFor('3000'))).toBe('http://localhost:3000/')
    expect(getRoleAppUrl('CUISINIER', locationFor('3000'))).toBe('http://localhost:3000/')
  })

  it('routes clients to the client frontend', () => {
    expect(getRoleAppUrl('CLIENT', locationFor('3000'))).toBe('http://localhost:3003/')
  })

  it('redirects old Salle and KDS ports back to the staff frontend', () => {
    expect(shouldRedirectToRoleApp('SERVEUR', locationFor('3001'))).toBe(true)
    expect(shouldRedirectToRoleApp('CUISINIER', locationFor('3002'))).toBe(true)
  })
})
