import { create } from 'zustand';

type SocketStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface SocketState {
  status: SocketStatus;
  setStatus: (status: SocketStatus) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  status: 'disconnected',
  setStatus: (status) => set({ status }),
}));
