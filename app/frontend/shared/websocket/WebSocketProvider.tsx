import { PropsWithChildren, useEffect, useRef } from 'react'

import { STAFF_ROLES, isRoleAllowed } from '@shared/auth/roleAccess'
import { useAuthStore } from '@shared/auth/useAuthStore'

import {
  buildStaffWebSocketUrl,
  getReconnectDelay,
  parseStaffSocketMessage,
} from './staffSocket'
import { useStaffSocketStore } from './useStaffSocketStore'

const TERMINAL_CLOSE_CODES = new Set([4401, 4403])

export const WebSocketProvider = ({ children }: PropsWithChildren) => {
  const { accessToken, isAuthenticated, user } = useAuthStore()
  const role = typeof user?.role === 'string' ? user.role : null
  const setConnectionStatus = useStaffSocketStore((state) => state.setConnectionStatus)
  const pushEvent = useStaffSocketStore((state) => state.pushEvent)
  const resetSocketState = useStaffSocketStore((state) => state.resetSocketState)

  const socketRef = useRef<WebSocket | null>(null)
  const connectTimerRef = useRef<number | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const heartbeatTimerRef = useRef<number | null>(null)
  const reconnectAttemptRef = useRef(0)
  const intentionalCloseRef = useRef(false)

  useEffect(() => {
    const clearConnectTimer = () => {
      if (connectTimerRef.current !== null) {
        window.clearTimeout(connectTimerRef.current)
        connectTimerRef.current = null
      }
    }

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }

    const clearHeartbeatTimer = () => {
      if (heartbeatTimerRef.current !== null) {
        window.clearInterval(heartbeatTimerRef.current)
        heartbeatTimerRef.current = null
      }
    }

    const cleanupSocket = () => {
      clearHeartbeatTimer()
      if (socketRef.current) {
        const currentSocket = socketRef.current
        socketRef.current = null
        if (
          currentSocket.readyState === WebSocket.CONNECTING ||
          currentSocket.readyState === WebSocket.OPEN
        ) {
          currentSocket.close()
        }
      }
    }

    const canConnect = Boolean(accessToken) && isAuthenticated && isRoleAllowed(role, STAFF_ROLES)

    if (!canConnect) {
      intentionalCloseRef.current = true
      clearConnectTimer()
      clearReconnectTimer()
      cleanupSocket()
      reconnectAttemptRef.current = 0
      resetSocketState()
      return () => {
        clearConnectTimer()
        clearReconnectTimer()
      }
    }

    const connect = () => {
      if (socketRef.current) {
        return
      }

      intentionalCloseRef.current = false
      setConnectionStatus('connecting')

      const socket = new WebSocket(buildStaffWebSocketUrl(window.location, accessToken!))
      socketRef.current = socket
      connectTimerRef.current = null

      socket.onopen = () => {
        reconnectAttemptRef.current = 0
        setConnectionStatus('open')
        
        // Start heartbeat to prevent timeout (Daphne/Proxy defaults)
        clearHeartbeatTimer()
        heartbeatTimerRef.current = window.setInterval(() => {
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'ping', payload: {} }))
          }
        }, 30000)
      }

      socket.onmessage = (event) => {
        const parsedEvent = parseStaffSocketMessage(event.data)
        if (parsedEvent) {
          pushEvent(parsedEvent)
        }
      }

      socket.onerror = () => {
        setConnectionStatus('error')
      }

      socket.onclose = (event) => {
        socketRef.current = null
        setConnectionStatus('closed')
        clearHeartbeatTimer()

        if (intentionalCloseRef.current || TERMINAL_CLOSE_CODES.has(event.code)) {
          return
        }

        const delay = getReconnectDelay(reconnectAttemptRef.current)
        reconnectAttemptRef.current += 1
        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null
          const authState = useAuthStore.getState()
          if (
            !authState.accessToken ||
            !authState.isAuthenticated ||
            !isRoleAllowed(authState.user?.role, STAFF_ROLES)
          ) {
            return
          }
          connect()
        }, delay)
      }
    }

    connectTimerRef.current = window.setTimeout(() => {
      connect()
    }, 0)

    return () => {
      intentionalCloseRef.current = true
      clearConnectTimer()
      clearReconnectTimer()
      cleanupSocket()
      reconnectAttemptRef.current = 0
      resetSocketState()
    }
  }, [
    accessToken,
    isAuthenticated,
    pushEvent,
    resetSocketState,
    role,
    setConnectionStatus,
  ])

  return children
}

export const useStaffWebSocket = () => {
  const connectionStatus = useStaffSocketStore((state) => state.connectionStatus)
  const lastEvent = useStaffSocketStore((state) => state.lastEvent)

  return { connectionStatus, lastEvent }
}
