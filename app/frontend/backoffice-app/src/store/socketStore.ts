import { create } from 'zustand';

type SocketStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface SocketState {
  status: SocketStatus;
  lastUpdate: number;
  setStatus: (status: SocketStatus) => void;
  triggerUpdate: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  status: 'disconnected',
  lastUpdate: Date.now(),
  setStatus: (status) => set({ status }),
  triggerUpdate: () => set({ lastUpdate: Date.now() }),
}));
