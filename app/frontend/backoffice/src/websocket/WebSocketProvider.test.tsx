import { StrictMode } from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@shared/auth/useAuthStore'
import {
  WebSocketProvider,
  useStaffWebSocket,
} from '@shared/websocket/WebSocketProvider'
import {
  buildStaffWebSocketUrl,
  getReconnectDelay,
  parseStaffSocketMessage,
} from '@shared/websocket/staffSocket'
import { useStaffSocketStore } from '@shared/websocket/useStaffSocketStore'

class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  static instances: MockWebSocket[] = []

  url: string
  readyState = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
  }

  triggerOpen() {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.(new Event('open'))
  }

  triggerMessage(data: string) {
    this.onmessage?.({ data } as MessageEvent)
  }

  triggerClose(code = 1006) {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(new CloseEvent('close', { code }))
  }
}

const Probe = () => {
  const { connectionStatus, lastEvent } = useStaffWebSocket()

  return (
    <>
      <div data-testid="status">{connectionStatus}</div>
      <div data-testid="event-type">{lastEvent?.type ?? 'none'}</div>
    </>
  )
}

describe('WebSocketProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket)
    MockWebSocket.instances = []
    localStorage.clear()
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    })
    useStaffSocketStore.getState().resetSocketState()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('builds a ws url with an encoded token for http origins', () => {
    expect(
      buildStaffWebSocketUrl(
        { protocol: 'http:', host: 'localhost:3000' } as Pick<Location, 'protocol' | 'host'>,
        'a+b c',
      ),
    ).toBe('ws://localhost:3000/ws/staff/?token=a%2Bb+c')
  })

  it('builds a wss url for https origins', () => {
    expect(
      buildStaffWebSocketUrl(
        { protocol: 'https:', host: 'tastify.test' } as Pick<Location, 'protocol' | 'host'>,
        'token',
      ),
    ).toBe('wss://tastify.test/ws/staff/?token=token')
  })

  it('parses valid frames and ignores invalid ones', () => {
    expect(parseStaffSocketMessage('{"type":"table_updated","payload":{"id":1}}')).toEqual({
      type: 'table_updated',
      payload: { id: 1 },
    })
    expect(parseStaffSocketMessage('{"type":1,"payload":{"id":1}}')).toBeNull()
    expect(parseStaffSocketMessage('not-json')).toBeNull()
  })

  it('calculates capped reconnect delays with bounded jitter', () => {
    expect(getReconnectDelay(0, 1000, 30000, () => 0.5)).toBe(1000)
    expect(getReconnectDelay(3, 1000, 30000, () => 0)).toBe(6400)
    expect(getReconnectDelay(10, 1000, 30000, () => 1)).toBe(30000)
  })

  it('does not connect when the session is unauthenticated', () => {
    render(
      <WebSocketProvider>
        <Probe />
      </WebSocketProvider>,
    )

    expect(MockWebSocket.instances).toHaveLength(0)
    expect(screen.getByTestId('status')).toHaveTextContent('idle')
  })

  it('opens one socket for an authenticated staff session and dispatches parsed events into the shared store', () => {
    act(() => {
      useAuthStore.getState().setAuth(
        { username: 'serveur_test', role: 'SERVEUR' },
        'access-token',
      )
    })

    render(
      <WebSocketProvider>
        <Probe />
      </WebSocketProvider>,
    )

    act(() => {
      vi.runAllTimers()
    })

    expect(MockWebSocket.instances).toHaveLength(1)
    expect(MockWebSocket.instances[0].url).toContain('/ws/staff/?token=access-token')
    expect(screen.getByTestId('status')).toHaveTextContent('connecting')

    act(() => {
      MockWebSocket.instances[0].triggerOpen()
    })

    expect(screen.getByTestId('status')).toHaveTextContent('open')

    act(() => {
      MockWebSocket.instances[0].triggerMessage('{"type":"infrastructure_test","payload":{"source":"phase_13"}}')
    })

    expect(screen.getByTestId('event-type')).toHaveTextContent('infrastructure_test')
    expect(useStaffSocketStore.getState().lastEvent).toEqual({
      type: 'infrastructure_test',
      payload: { source: 'phase_13' },
    })
  })

  it('reconnects after an unexpected close with capped backoff', () => {
    act(() => {
      useAuthStore.getState().setAuth(
        { username: 'gerant_test', role: 'GERANT' },
        'access-token',
      )
    })

    render(
      <WebSocketProvider>
        <Probe />
      </WebSocketProvider>,
    )

    act(() => {
      vi.runAllTimers()
      MockWebSocket.instances[0].triggerOpen()
      MockWebSocket.instances[0].triggerClose(1006)
    })

    expect(screen.getByTestId('status')).toHaveTextContent('closed')
    expect(MockWebSocket.instances).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(MockWebSocket.instances).toHaveLength(2)
    expect(screen.getByTestId('status')).toHaveTextContent('connecting')
  })

  it('closes the socket and cancels reconnects on auth clear', () => {
    act(() => {
      useAuthStore.getState().setAuth(
        { username: 'cuisinier_test', role: 'CUISINIER' },
        'access-token',
      )
    })

    render(
      <WebSocketProvider>
        <Probe />
      </WebSocketProvider>,
    )

    act(() => {
      vi.runAllTimers()
      MockWebSocket.instances[0].triggerOpen()
      MockWebSocket.instances[0].triggerClose(1006)
      useAuthStore.getState().clearAuth()
      vi.runAllTimers()
    })

    expect(MockWebSocket.instances).toHaveLength(1)
    expect(screen.getByTestId('status')).toHaveTextContent('idle')
    expect(screen.getByTestId('event-type')).toHaveTextContent('none')
  })

  it('avoids opening and immediately closing a connecting socket during StrictMode remounts', () => {
    act(() => {
      useAuthStore.getState().setAuth(
        { username: 'gerant_test', role: 'GERANT' },
        'access-token',
      )
    })

    render(
      <StrictMode>
        <WebSocketProvider>
          <Probe />
        </WebSocketProvider>
      </StrictMode>,
    )

    expect(MockWebSocket.instances).toHaveLength(0)

    act(() => {
      vi.runAllTimers()
    })

    expect(MockWebSocket.instances).toHaveLength(1)
    expect(MockWebSocket.instances[0].readyState).toBe(MockWebSocket.CONNECTING)
  })
})
