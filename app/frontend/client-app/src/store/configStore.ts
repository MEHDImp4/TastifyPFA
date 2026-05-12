import { create } from 'zustand';
import { configurationApi, RestaurantConfiguration } from '../api/configuration';

interface ConfigState {
  config: RestaurantConfiguration | null;
  isLoading: boolean;
  fetchConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  isLoading: false,
  fetchConfig: async () => {
    set({ isLoading: true });
    try {
      const res = await configurationApi.getPublicSettings();
      set({ config: res.data, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch public config', err);
      set({ isLoading: false });
    }
  },
}));
