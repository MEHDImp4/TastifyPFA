export type StaffSocketEvent = {
  type: string
  payload: Record<string, unknown>
}

type LocationLike = Pick<Location, 'protocol' | 'host'>

export const buildStaffWebSocketUrl = (location: LocationLike, token: string) => {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = new URL(`${protocol}//${location.host}/ws/staff/`)
  url.searchParams.set('token', token)
  return url.toString()
}

export const parseStaffSocketMessage = (rawMessage: string): StaffSocketEvent | null => {
  try {
    const parsed = JSON.parse(rawMessage) as {
      type?: unknown
      payload?: unknown
    }

    if (
      typeof parsed.type !== 'string' ||
      typeof parsed.payload !== 'object' ||
      parsed.payload === null ||
      Array.isArray(parsed.payload)
    ) {
      return null
    }

    return {
      type: parsed.type,
      payload: parsed.payload as Record<string, unknown>,
    }
  } catch {
    return null
  }
}

export const getReconnectDelay = (
  attempt: number,
  baseDelayMs = 1000,
  maxDelayMs = 30000,
  random = Math.random,
) => {
  const exponentialDelay = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs)
  const jitterMultiplier = 0.8 + random() * 0.4
  return Math.min(Math.round(exponentialDelay * jitterMultiplier), maxDelayMs)
}
