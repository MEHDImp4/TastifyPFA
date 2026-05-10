import React, { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useKdsStore } from '../store/kdsStore';
import { useSocketStore } from '../store/socketStore';

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const accessToken = useAuthStore(state => state.accessToken);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  const addTicket = useKdsStore(state => state.addTicket);
  const updateTicket = useKdsStore(state => state.updateTicket);
  const updateLigneStatut = useKdsStore(state => state.updateLigneStatut);
  
  const setStatus = useSocketStore(state => state.setStatus);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!isAuthenticated || !accessToken) {
      console.log('WS: Skip connect (not authenticated)');
      return;
    }

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close existing socket if any (though useEffect cleanup should have handled it)
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
        return; // Already connecting or connected
      }
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/staff/?token=${accessToken}`;

    console.log('WS: Connecting to staff websocket...');
    setStatus('connecting');
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WS: Staff WebSocket connected');
      setStatus('connected');
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
        console.error('WS: Error parsing message:', err);
      }
    };

    ws.onclose = (e) => {
      socketRef.current = null;
      if (isAuthenticated && accessToken && e.code !== 1000) {
        console.warn(`WS: Staff WebSocket closed (Code: ${e.code}, Reason: ${e.reason || 'None'}). Reconnecting in 3s...`);
        setStatus('disconnected');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      } else {
        console.log(`WS: Staff WebSocket closed gracefully (Code: ${e.code})`);
        setStatus('disconnected');
      }
    };

    ws.onerror = (err) => {
      console.error('WS: Staff WebSocket error observed:', err);
      setStatus('error');
      // No need to call ws.close() here as onclose will be triggered anyway
    };
  }, [accessToken, isAuthenticated, addTicket, updateTicket, updateLigneStatut, setStatus]);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        console.log('WS: Cleaning up socket on unmount/dependency change');
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
