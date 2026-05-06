export const AUTH_PORTALS = ['staff', 'client'] as const

export type AuthPortal = (typeof AUTH_PORTALS)[number]

const DEFAULT_AUTH_PORTAL: AuthPortal = 'staff'

const isAuthPortal = (value: unknown): value is AuthPortal =>
  typeof value === 'string' && AUTH_PORTALS.includes(value as AuthPortal)

export const getAuthPortal = (): AuthPortal => {
  const portal = import.meta.env.VITE_AUTH_PORTAL

  if (isAuthPortal(portal)) {
    return portal
  }

  return DEFAULT_AUTH_PORTAL
}

export const getAuthStorageName = () => `tastify-auth-storage:${getAuthPortal()}`

export const getAuthPortalHeader = (portal = getAuthPortal()) => ({
  'X-Tastify-Portal': portal,
})

export const getPortalFromRole = (role: string | null | undefined): AuthPortal =>
  role === 'CLIENT' ? 'client' : 'staff'
