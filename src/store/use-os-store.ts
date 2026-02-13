import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api-client';
import type { UserSettings, SavedLocation } from '@shared/types';
interface OSState {
  settings: UserSettings;
  locations: SavedLocation[];
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  fetchLocations: () => Promise<void>;
  addLocation: (loc: Omit<SavedLocation, 'id'>) => Promise<void>;
  removeLocation: (id: string) => Promise<void>;
}
export const useOSStore = create<OSState>()(
  persist(
    (set, get) => ({
      settings: {
        id: 'default',
        units: 'mph',
        mapProvider: 'google',
        theme: 'dark',
      },
      locations: [],
      isLoading: false,
      error: null,
      fetchSettings: async () => {
        set({ isLoading: true });
        try {
          const data = await api<UserSettings>('/api/settings');
          set({ settings: data, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },
      updateSettings: async (patch) => {
        const current = get().settings;
        const optimistic = { ...current, ...patch };
        set({ settings: optimistic });
        try {
          const data = await api<UserSettings>('/api/settings', {
            method: 'POST',
            body: JSON.stringify(patch),
          });
          set({ settings: data });
        } catch (err: any) {
          set({ error: err.message, settings: current });
        }
      },
      fetchLocations: async () => {
        try {
          const res = await api<{ items: SavedLocation[] }>('/api/locations');
          set({ locations: res.items });
        } catch (err: any) {
          set({ error: err.message });
        }
      },
      addLocation: async (loc) => {
        try {
          const newLoc = await api<SavedLocation>('/api/locations', {
            method: 'POST',
            body: JSON.stringify(loc),
          });
          set((s) => ({ locations: [...s.locations, newLoc] }));
        } catch (err: any) {
          set({ error: err.message });
        }
      },
      removeLocation: async (id) => {
        try {
          await api(`/api/locations/${id}`, { method: 'DELETE' });
          set((s) => ({ locations: s.locations.filter((l) => l.id !== id) }));
        } catch (err: any) {
          set({ error: err.message });
        }
      },
    }),
    {
      name: 'velocity-os-storage',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);