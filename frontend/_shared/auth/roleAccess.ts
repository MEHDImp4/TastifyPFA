export const STAFF_ROLES = ['GERANT', 'SERVEUR', 'CUISINIER'] as const
export const CLIENT_ROLES = ['CLIENT'] as const
export const GERANT_ROLES = ['GERANT'] as const
export const SALLE_ROLES = ['GERANT', 'SERVEUR'] as const
export const KDS_ROLES = ['GERANT', 'CUISINIER'] as const

export const STAFF_PORTAL_DENIED_MESSAGE =
  "Ce compte est reserve au portail client. Veuillez utiliser un compte staff pour acceder a cet espace."

export const STAFF_HOME_BY_ROLE: Record<string, string> = {
  GERANT: '/categories',
  SERVEUR: '/salle',
  CUISINIER: '/kds',
}

export const isRoleAllowed = (role: string | null | undefined, allowedRoles: readonly string[]) => {
  if (!role) return false

  return allowedRoles.includes(role.toUpperCase())
}

export const getStaffHomePath = (role: string | null | undefined) => {
  if (!role) return '/login'

  return STAFF_HOME_BY_ROLE[role.toUpperCase()] ?? '/login'
}
