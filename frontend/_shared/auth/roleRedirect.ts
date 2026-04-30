const ROLE_PORTS: Record<string, number> = {
  GERANT: 3000,
  SERVEUR: 3000,
  CUISINIER: 3000,
  CLIENT: 3003,
}

export const getRoleAppUrl = (role: string, location: Location = window.location) => {
  const port = ROLE_PORTS[role.toUpperCase()]
  if (!port) return null

  return `${location.protocol}//${location.hostname || 'localhost'}:${port}/`
}

export const shouldRedirectToRoleApp = (role: string, location: Location = window.location) => {
  const targetUrl = getRoleAppUrl(role, location)
  if (!targetUrl) return false

  const target = new URL(targetUrl)
  return location.protocol !== target.protocol || location.hostname !== target.hostname || location.port !== target.port
}

export const redirectToRoleApp = (role: string, location: Location = window.location) => {
  const targetUrl = getRoleAppUrl(role, location)
  if (!targetUrl || !shouldRedirectToRoleApp(role, location)) return false

  location.replace(targetUrl)
  return true
}
