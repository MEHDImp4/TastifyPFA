export const normalizeMediaUrl = (url: string | null | undefined) => {
  if (!url) return undefined

  if (url.startsWith('/media/')) return url

  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'backend' && parsed.pathname.startsWith('/media/')) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
  } catch {
    return url
  }

  return url
}
