import React, { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useKdsStore } from '../store/kdsStore';
import { useSocketStore } from '../store/socketStore';
import { toast } from 'sonner';
import { buildStaffWebSocketUrl } from '../api/apiConfig';

const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10000, 30000];
const AUTH_CLOSE_CODES = new Set([4401, 4403]);

const debugWebSocket = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.debug(...args);
  }
};

const getReconnectDelay = (attempt: number) => (
  RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)]
);

const closeSocket = (socket: WebSocket | null) => {
  if (!socket) return;

  socket.onopen = null;
  socket.onmessage = null;
  socket.onclose = null;
  socket.onerror = null;

  if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
    socket.close(1000, 'client_shutdown');
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
        debugWebSocket('WS: Audio playback failed', e);
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
  const reconnectAttemptRef = useRef(0);
  const manualCloseRef = useRef(false);
  const connectRef = useRef<() => void>(() => undefined);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!isAuthenticated || !accessToken) {
      debugWebSocket('WS: Skip connect (not authenticated)');
      return;
    }

    clearReconnectTimer();

    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
        debugWebSocket('WS: Skip connect (already active)');
        return;
      }
      closeSocket(socketRef.current);
      socketRef.current = null;
    }

    const wsUrl = buildStaffWebSocketUrl(accessToken);

    debugWebSocket('WS: Connecting to staff websocket...');
    setStatus('connecting');
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      if (socketRef.current !== ws) return;
      debugWebSocket('WS: Staff WebSocket connected');
      reconnectAttemptRef.current = 0;
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      if (socketRef.current !== ws) return;
      try {
        const data = JSON.parse(event.data);
        debugWebSocket('WS: Message received', data?.type);

        switch (data.type) {
          case 'heartbeat':
            break;
          case 'order_created': {
            useSocketStore.getState().triggerUpdate();
            const order = data.payload?.order;
            if (!order) break;
            upsertTicket(order);
            useSocketStore.getState().addNotification(`Nouvelle commande #${order.id} reçue`, 'SUCCESS');
            playNotificationSound();
            toast.success(`Nouvelle Commande #${order.id}`, { description: 'Reçue et envoyée en préparation' });
            break;
          }
          case 'order_updated': {
            useSocketStore.getState().triggerUpdate();
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
            useSocketStore.getState().triggerUpdate();
            updateLigneStatut(data.payload.ligne_id, 'EN_PREPARATION');
            break;
          case 'line_ready':
            useSocketStore.getState().triggerUpdate();
            updateLigneStatut(data.payload.ligne_id, 'PRET');
            playNotificationSound();
            toast.info('Plat prêt au service', { description: `Ligne #${data.payload.ligne_id} prête au passe` });
            break;
          case 'line_cancelled':
            useSocketStore.getState().triggerUpdate();
            updateLigneStatut(data.payload.ligne_id, 'ANNULE');
            break;
        }
      } catch (err) {
        debugWebSocket('WS: Error parsing message', err);
      }
    };

    ws.onclose = (e) => {
      if (socketRef.current !== ws) return;
      socketRef.current = null;

      const canReconnect = (
        !manualCloseRef.current &&
        e.code !== 1000 &&
        !AUTH_CLOSE_CODES.has(e.code) &&
        useAuthStore.getState().isAuthenticated &&
        Boolean(useAuthStore.getState().accessToken)
      );

      if (!canReconnect) {
        debugWebSocket(`WS: Staff WebSocket closed gracefully (Code: ${e.code})`);
        setStatus('disconnected');
        return;
      }

      const delay = getReconnectDelay(reconnectAttemptRef.current);
      reconnectAttemptRef.current += 1;
      debugWebSocket(`WS: Staff WebSocket closed (Code: ${e.code}). Reconnecting in ${delay}ms...`);
      setStatus('disconnected');
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connectRef.current();
      }, delay);
    };

    ws.onerror = () => {
      if (socketRef.current !== ws) return;
      debugWebSocket('WS: Socket error');
      setStatus('error');
    };
  }, [
    accessToken,
    clearReconnectTimer,
    isAuthenticated,
    removeTicket,
    setStatus,
    updateLigneStatut,
    upsertTicket,
  ]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    manualCloseRef.current = false;
    connect();

    return () => {
      manualCloseRef.current = true;
      clearReconnectTimer();
      const socket = socketRef.current;
      socketRef.current = null;
      closeSocket(socket);
    };
  }, [clearReconnectTimer, connect]);

  useEffect(() => {
    const handleOnline = () => {
      reconnectAttemptRef.current = 0;
      manualCloseRef.current = false;
      connect();
    };
    const handleOffline = () => {
      clearReconnectTimer();
      setStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [clearReconnectTimer, connect, setStatus]);

  return <>{children}</>;
};
