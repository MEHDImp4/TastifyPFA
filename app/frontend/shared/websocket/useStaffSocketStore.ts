import { create } from 'zustand'

import type { StaffSocketEvent } from './staffSocket'

export type StaffSocketStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

type StaffSocketState = {
  connectionStatus: StaffSocketStatus
  lastEvent: StaffSocketEvent | null
  setConnectionStatus: (status: StaffSocketStatus) => void
  pushEvent: (event: StaffSocketEvent) => void
  resetSocketState: () => void
}

export const useStaffSocketStore = create<StaffSocketState>((set) => ({
  connectionStatus: 'idle',
  lastEvent: null,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  pushEvent: (lastEvent) => set({ lastEvent }),
  resetSocketState: () => set({ connectionStatus: 'idle', lastEvent: null }),
}))
