import { describe, expect, it } from 'vitest'
import { normalizeMediaUrl } from '@shared/media/mediaUrl'

describe('normalizeMediaUrl', () => {
  it('converts Docker backend media URLs to browser-proxy paths', () => {
    expect(normalizeMediaUrl('http://backend:8000/media/plats/tajine.png')).toBe('/media/plats/tajine.png')
  })

  it('keeps already browser-safe URLs unchanged', () => {
    expect(normalizeMediaUrl('/media/plats/tajine.png')).toBe('/media/plats/tajine.png')
    expect(normalizeMediaUrl('http://localhost:8000/media/plats/tajine.png')).toBe('http://localhost:8000/media/plats/tajine.png')
    expect(normalizeMediaUrl('blob:http://localhost:3000/preview')).toBe('blob:http://localhost:3000/preview')
  })
})
