import React, { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useKdsStore } from '../store/kdsStore';
import { useSocketStore } from '../store/socketStore';
import { toast } from 'sonner';
import { buildStaffWebSocketUrl } from '../api/apiConfig';

const debugWebSocket = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.debug(...args);
  }
};

const playNotificationSound = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1); // C6

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const accessToken = useAuthStore(state => state.accessToken);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  const upsertTicket = useKdsStore(state => state.upsertTicket);
  const removeTicket = useKdsStore(state => state.removeTicket);
  const updateLigneStatut = useKdsStore(state => state.updateLigneStatut);
  
  const setStatus = useSocketStore(state => state.setStatus);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!isAuthenticated || !accessToken) {
      debugWebSocket('WS: Skip connect (not authenticated)');
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

    const wsUrl = buildStaffWebSocketUrl(accessToken);

    debugWebSocket('WS: Connecting to staff websocket...');
    setStatus('connecting');
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      if (socketRef.current !== ws) return;
      debugWebSocket('WS: Staff WebSocket connected');
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      if (socketRef.current !== ws) return;
      try {
        const data = JSON.parse(event.data);
        debugWebSocket('WS Message:', data);
        
        useSocketStore.getState().triggerUpdate();

        switch (data.type) {
          case 'order_created': {
            const order = data.payload?.order;
            if (!order) break;
            upsertTicket(order);
            useSocketStore.getState().addNotification(`Nouvelle commande #${order.id} reçue`, 'SUCCESS');
            playNotificationSound();
            toast.success(`Nouvelle Commande #${order.id}`, { description: 'Reçue et envoyée en préparation' });
            break;
          }
          case 'order_updated': {
            const order = data.payload?.order;
            if (!order) break;
            if (['PAYEE', 'ANNULEE'].includes(order.statut)) {
              removeTicket(order.id);
            } else {
              upsertTicket(order);
            }
            break;
          }
          case 'line_launched':
            updateLigneStatut(data.payload.ligne_id, 'EN_PREPARATION');
            break;
          case 'line_ready':
            updateLigneStatut(data.payload.ligne_id, 'PRET');
            playNotificationSound();
            toast.info('Plat prêt au service', { description: `Ligne #${data.payload.ligne_id} prête au passe` });
            break;
          case 'line_cancelled':
            updateLigneStatut(data.payload.ligne_id, 'ANNULE');
            break;
        }
      } catch (err) {
        console.error('WS: Error parsing message:', err);
      }
    };

    ws.onclose = (e) => {
      // Ignore stale close events from sockets superseded by a newer connection
      if (socketRef.current !== ws) return;
      socketRef.current = null;
      if (isAuthenticated && accessToken && e.code !== 1000) {
        console.warn(`WS: Staff WebSocket closed (Code: ${e.code}, Reason: ${e.reason || 'None'}). Reconnecting in 3s...`);
        setStatus('disconnected');
        // eslint-disable-next-line
        reconnectTimeoutRef.current = setTimeout(() => connect(), 3000);
      } else {
        debugWebSocket(`WS: Staff WebSocket closed gracefully (Code: ${e.code})`);
        setStatus('disconnected');
      }
    };

    ws.onerror = () => {
      if (socketRef.current !== ws) return;
      setStatus('error');
    };
  }, [accessToken, isAuthenticated, upsertTicket, removeTicket, updateLigneStatut, setStatus]);

  useEffect(() => {
    connect();

    return () => {
      // Detach from ref first so onclose/onerror handlers on this socket are ignored
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        if (socket.readyState === WebSocket.CONNECTING) {
          // Delay close until it opens to prevent browser warning in StrictMode
          socket.addEventListener('open', () => socket.close(1000));
        } else if (socket.readyState === WebSocket.OPEN) {
          socket.close(1000);
        }
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  return <>{children}</>;
};
