import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api-client';
import type { UserSettings, SavedLocation } from '@shared/types';
import { fetchRoute, RouteData } from '@/lib/nav-utils';
import { toast } from 'sonner';
export type GpsStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';
export type MapPerspective = 'driving' | 'top-down';
interface OSState {
  settings: UserSettings & { mapPerspective?: MapPerspective };
  locations: SavedLocation[];
  recentLocations: SavedLocation[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  gpsStatus: GpsStatus;
  isMapOpen: boolean;
  isFollowing: boolean;
  mapPerspective: MapPerspective;
  activeDestination: SavedLocation | null;
  activeRoute: RouteData | null;
  currentPos: [number, number] | null;
  currentSpeed: number | null;
  currentHeading: number | null;
  trackingId: string | null;
  isSharingLive: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (patch: Partial<UserSettings & { mapPerspective?: MapPerspective }>) => Promise<void>;
  toggleMapPerspective: () => void;
  fetchLocations: () => Promise<void>;
  addLocation: (loc: Omit<SavedLocation, 'id'>) => Promise<void>;
  removeLocation: (id: string) => Promise<void>;
  resetSystem: () => Promise<void>;
  openMap: (dest?: SavedLocation) => void;
  closeMap: () => void;
  setFollowing: (following: boolean) => void;
  setGpsStatus: (status: GpsStatus) => void;
  setCurrentPos: (pos: [number, number] | null, speed: number | null, heading?: number | null, error?: boolean) => void;
  calculateRoute: () => Promise<void>;
  logRecentLocation: (loc: SavedLocation) => Promise<void>;
  startLiveShare: () => void;
  stopLiveShare: () => void;
  fetchRecentLocations: () => Promise<void>;
  clearHistory: () => Promise<void>;
}
export const useOSStore = create<OSState>()(
  persist(
    (set, get) => ({
      settings: {
        id: 'default',
        units: 'mph',
        mapProvider: 'google',
        mapTheme: 'highway',
        theme: 'dark',
        autoTheme: true,
      },
      locations: [],
      recentLocations: [],
      isLoading: false,
      isInitialized: false,
      error: null,
      gpsStatus: 'prompt',
      isMapOpen: false,
      isFollowing: true,
      mapPerspective: 'driving',
      activeDestination: null,
      activeRoute: null,
      currentPos: null,
      currentSpeed: null,
      currentHeading: null,
      trackingId: null,
      isSharingLive: false,
      fetchSettings: async () => {
        if (get().isInitialized) return;
        set({ isLoading: true });
        try {
          const data = await api<UserSettings>('/api/settings');
          set({ settings: data, isLoading: false, isInitialized: true });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },
      updateSettings: async (patch) => {
        const current = get().settings;
        const optimistic = { ...current, ...patch };
        if (patch.theme && patch.theme !== current.theme) {
          toast.info(`Switching to ${patch.theme} mode`, { position: 'bottom-center' });
        }
        set({ settings: optimistic });
        try {
          const data = await api<UserSettings>('/api/settings', {
            method: 'POST',
            body: JSON.stringify(patch),
          });
          set({ settings: { ...data, mapPerspective: optimistic.mapPerspective } });
        } catch (err: any) {
          set({ error: err.message, settings: current });
        }
      },
      toggleMapPerspective: () => {
        set((s) => ({ mapPerspective: s.mapPerspective === 'driving' ? 'top-down' : 'driving' }));
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
      resetSystem: async () => {
        set({ isLoading: true });
        try {
          await api('/api/system/reset', { method: 'POST' });
          localStorage.removeItem('velocity-os-storage');
          toast.success('System reset complete. Reloading...', { position: 'top-center' });
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },
      openMap: (dest) => {
        set({ isMapOpen: true, isFollowing: true, activeDestination: dest || null });
        if (dest) {
          get().calculateRoute();
          get().logRecentLocation(dest);
        }
      },
      closeMap: () => set({ isMapOpen: false, activeDestination: null, activeRoute: null }),
      setFollowing: (isFollowing) => set({ isFollowing }),
      setGpsStatus: (status) => set({ gpsStatus: status }),
      setCurrentPos: (pos, speed, heading, error) => {
        if (error) {
          set({ gpsStatus: 'denied', currentSpeed: 0 });
        } else {
          set({ currentPos: pos, currentSpeed: speed, currentHeading: heading ?? null, gpsStatus: 'granted' });
        }
      },
      calculateRoute: async () => {
        const currentPos = get().currentPos;
        const activeDestination = get().activeDestination;
        if (!currentPos || !activeDestination) return;
        const route = await fetchRoute(currentPos, [activeDestination.lat, activeDestination.lon]);
        set({ activeRoute: route });
      },
      logRecentLocation: async (loc) => {
        try {
          const updatedLoc = { ...loc, lastUsedAt: Date.now() };
          await api('/api/locations/recent', {
            method: 'POST',
            body: JSON.stringify(updatedLoc),
          });
          set((s) => {
            const filtered = s.recentLocations.filter(l => l.id !== loc.id);
            const newList = [updatedLoc, ...filtered].slice(0, 10);
            return { recentLocations: newList };
          });
        } catch (err) {
          console.error('Failed to log recent location', err);
        }
      },
      fetchRecentLocations: async () => {
        try {
          const res = await api<{ items: SavedLocation[] }>('/api/locations/recent');
          set({ recentLocations: res.items });
        } catch (err: any) {
          set({ error: err.message });
        }
      },
      clearHistory: async () => {
        try {
          await api('/api/locations/recent', { method: 'DELETE' });
          set({ recentLocations: [] });
        } catch (err: any) {
          set({ error: err.message });
        }
      },
      startLiveShare: () => {
        const id = crypto.randomUUID();
        set({ trackingId: id, isSharingLive: true });
      },
      stopLiveShare: () => {
        set({ trackingId: null, isSharingLive: false });
      }
    }),
    {
      name: 'velocity-os-storage',
      partialize: (state) => ({
        settings: state.settings,
        recentLocations: state.recentLocations,
        mapPerspective: state.mapPerspective
      }),
    }
  )
);