import { create } from 'zustand';

type SocketStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface AppNotification {
  id: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
  timestamp: Date;
}

interface SocketState {
  status: SocketStatus;
  lastUpdate: number;
  notifications: AppNotification[];
  setStatus: (status: SocketStatus) => void;
  triggerUpdate: () => void;
  addNotification: (message: string, type?: 'INFO' | 'WARNING' | 'SUCCESS') => void;
  clearNotification: (id: string) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  status: 'disconnected',
  lastUpdate: Date.now(),
  notifications: [],
  setStatus: (status) => set({ status }),
  triggerUpdate: () => set({ lastUpdate: Date.now() }),
  addNotification: (message, type = 'INFO') => set((state) => ({
    notifications: [
      { id: Math.random().toString(36).substr(2, 9), message, type, timestamp: new Date() },
      ...state.notifications
    ].slice(0, 50) // Keep last 50
  })),
  clearNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  }))
}));
