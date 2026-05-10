import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useKdsStore } from '../store/kdsStore';

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { addTicket, updateTicket, updateLigneStatut } = useKdsStore();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // In dev with proxy, we might need direct access if proxy doesn't support WS well, 
    // but typically /ws is proxied in vite.config.ts
    const wsUrl = `${protocol}//${host}/ws/staff/?token=${accessToken}`;

    const connect = () => {
      console.log('Connecting to staff websocket...');
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('Staff WebSocket connected');
      };

      ws.onmessage = (event) => {
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
      };

      ws.onclose = (e) => {
        console.log('Staff WebSocket closed. Reconnecting...', e.reason);
        setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('Staff WebSocket error:', err);
        ws.close();
      };
    };

    connect();

    return () => {
      socketRef.current?.close();
    };
  }, [accessToken, isAuthenticated, addTicket, updateTicket, updateLigneStatut]);

  return <>{children}</>;
};
