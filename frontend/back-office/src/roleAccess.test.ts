import { describe, expect, it } from 'vitest'
import { CLIENT_ROLES, isRoleAllowed, STAFF_ROLES } from '@shared/auth/roleAccess'

describe('role app access gates', () => {
  it('allows only staff roles on the staff frontend', () => {
    expect(isRoleAllowed('GERANT', STAFF_ROLES)).toBe(true)
    expect(isRoleAllowed('SERVEUR', STAFF_ROLES)).toBe(true)
    expect(isRoleAllowed('CUISINIER', STAFF_ROLES)).toBe(true)
    expect(isRoleAllowed('CLIENT', STAFF_ROLES)).toBe(false)
  })

  it('allows only clients on the client frontend', () => {
    expect(isRoleAllowed('CLIENT', CLIENT_ROLES)).toBe(true)
    expect(isRoleAllowed('GERANT', CLIENT_ROLES)).toBe(false)
    expect(isRoleAllowed('SERVEUR', CLIENT_ROLES)).toBe(false)
    expect(isRoleAllowed('CUISINIER', CLIENT_ROLES)).toBe(false)
  })
})
