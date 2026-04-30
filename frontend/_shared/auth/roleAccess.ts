export const STAFF_ROLES = ['GERANT', 'SERVEUR', 'CUISINIER'] as const
export const CLIENT_ROLES = ['CLIENT'] as const

export const isRoleAllowed = (role: string | null | undefined, allowedRoles: readonly string[]) => {
  if (!role) return false

  return allowedRoles.includes(role.toUpperCase())
}
