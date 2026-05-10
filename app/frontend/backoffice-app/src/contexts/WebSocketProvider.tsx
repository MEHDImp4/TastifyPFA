import React, { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useKdsStore } from '../store/kdsStore';

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { addTicket, updateTicket, updateLigneStatut } = useKdsStore();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!isAuthenticated || !accessToken) return;

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/staff/?token=${accessToken}`;

    console.log('Connecting to staff websocket...');
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('Staff WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WS Message:', data);

        switch (data.type) {
          case 'NEW_ORDER':
            addTicket(data.payload);
            break;
          case 'ORDER_UPDATED':
            updateTicket(data.payload);
            break;
          case 'ITEM_STATUS_CHANGED':
            updateLigneStatut(data.payload.ligne_id, data.payload.statut);
            break;
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onclose = (e) => {
      socketRef.current = null;
      if (isAuthenticated && accessToken && e.code !== 1000) {
        console.log('Staff WebSocket closed. Reconnecting in 3s...', e.reason);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      } else {
        console.log('Staff WebSocket closed gracefully or unauthenticated');
      }
    };

    ws.onerror = (err) => {
      console.error('Staff WebSocket error:', err);
      ws.close();
    };
  }, [accessToken, isAuthenticated, addTicket, updateTicket, updateLigneStatut]);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        // Use 1000 to indicate normal closure
        socketRef.current.close(1000);
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  return <>{children}</>;
};
