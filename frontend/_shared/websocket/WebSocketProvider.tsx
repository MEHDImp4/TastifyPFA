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
  const accessToken = useAuthStore((state) => state.accessToken)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const role = useAuthStore((state) => state.user?.role)
  const setConnectionStatus = useStaffSocketStore((state) => state.setConnectionStatus)
  const pushEvent = useStaffSocketStore((state) => state.pushEvent)
  const resetSocketState = useStaffSocketStore((state) => state.resetSocketState)

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const reconnectAttemptRef = useRef(0)
  const intentionalCloseRef = useRef(false)

  useEffect(() => {
    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }

    const cleanupSocket = () => {
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
      clearReconnectTimer()
      cleanupSocket()
      reconnectAttemptRef.current = 0
      resetSocketState()
      return () => {
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

      socket.onopen = () => {
        reconnectAttemptRef.current = 0
        setConnectionStatus('open')
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

    connect()

    return () => {
      intentionalCloseRef.current = true
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
