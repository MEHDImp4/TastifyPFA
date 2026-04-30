import { describe, expect, it } from 'vitest'
import { getRoleAppUrl, shouldRedirectToRoleApp } from '@shared/auth/roleRedirect'

const locationFor = (port: string) => ({
  protocol: 'http:',
  hostname: 'localhost',
  port,
} as Location)

describe('role app redirects', () => {
  it('routes gerant to the back-office port', () => {
    expect(getRoleAppUrl('GERANT', locationFor('3001'))).toBe('http://localhost:3000/')
  })

  it('redirects when the current port does not match the role app', () => {
    expect(shouldRedirectToRoleApp('GERANT', locationFor('3001'))).toBe(true)
  })

  it('stays on the current app when the port matches the role', () => {
    expect(shouldRedirectToRoleApp('SERVEUR', locationFor('3001'))).toBe(false)
  })
})
