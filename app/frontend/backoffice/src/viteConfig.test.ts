import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('back-office vite websocket proxy', () => {
  it('proxies staff websocket upgrades to the backend ASGI server', () => {
    const configSource = readFileSync(resolve(import.meta.dirname, '../vite.config.ts'), 'utf8')

    expect(configSource).toContain("'/ws'")
    expect(configSource).toContain("target: 'ws://backend:8000'")
    expect(configSource).toContain('ws: true')
  })
})
