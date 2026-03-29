import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api-client';
import type { UserSettings, SavedLocation } from '@shared/types';
import { fetchRoute, type RouteData, searchPlaces } from '@/lib/nav-utils';
import { haversineDistance } from '@/lib/drive-utils';
import { toast } from 'sonner';

export type GpsStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';
export type MapPerspective = 'driving' | 'top-down';

export interface TripRecord {
  startTime: number;
  endTime?: number;
  distanceKm: number;
}

interface OSState {
  settings: UserSettings;
  locations: SavedLocation[];
  recentLocations: SavedLocation[];
  searchHistory: SavedLocation[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  gpsStatus: GpsStatus;
  isMapOpen: boolean;
  isFollowing: boolean;
  activeDestination: SavedLocation | null;
  activeRoute: RouteData | null;
  currentPos: [number, number] | null;
  currentSpeed: number | null;
  currentHeading: number | null;
  totalDistanceKm: number;
  kmCoinBalance: number;
  mCoinBalance: number;
  unlockedThemeIds: string[];
  activeThemeId: string | null;
  trips: TripRecord[];
  trackingId: string | null;
  isSharingLive: boolean;
  searchResults: SavedLocation[];
  isSearching: boolean;
  selectedDiscoveredPlace: SavedLocation | null;
  isSearchOverlayOpen: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
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
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  setSearchOverlay: (open: boolean) => void;
  selectDiscoveredPlace: (place: SavedLocation | null) => void;
  fetchSearchHistory: () => Promise<void>;
  addSearchHistory: (loc: SavedLocation) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  purchaseTheme: (themeId: string, cost: number) => { success: boolean; reason?: string };
  setActiveTheme: (themeId: string | null) => void;
}

const defaultSettings: UserSettings = {
  id: 'default',
  units: 'mph',
  mapProvider: 'google',
  mapTheme: 'highway',
  theme: 'dark',
  autoTheme: true,
  mapPerspective: 'top-down',
  aiName: 'nova',
  aiVoiceControlEnabled: true,
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'llama3.2',
  aiVoiceEnabled: true,
  aiVoiceAutoSpeak: true,
  aiVoiceName: '',
  aiVoiceLang: 'en-US',
  aiVoiceRate: 1,
  aiVoicePitch: 1,
  aiVoiceVolume: 1,
};

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function normalizeSettings(raw: Partial<UserSettings> | null | undefined): UserSettings {
  const merged = { ...defaultSettings, ...(raw ?? {}) };
  const aiName = typeof merged.aiName === 'string' ? merged.aiName.trim() : '';
  const ollamaBaseUrl = typeof merged.ollamaBaseUrl === 'string' ? merged.ollamaBaseUrl.trim() : '';
  const ollamaModel = typeof merged.ollamaModel === 'string' ? merged.ollamaModel.trim() : '';
  const aiVoiceName = typeof merged.aiVoiceName === 'string' ? merged.aiVoiceName.trim() : '';
  const aiVoiceLang = typeof merged.aiVoiceLang === 'string' ? merged.aiVoiceLang.trim() : '';

  return {
    ...merged,
    id: 'default',
    aiName: aiName || defaultSettings.aiName,
    aiVoiceControlEnabled: Boolean(merged.aiVoiceControlEnabled),
    ollamaBaseUrl: ollamaBaseUrl || defaultSettings.ollamaBaseUrl,
    ollamaModel: ollamaModel || defaultSettings.ollamaModel,
    aiVoiceEnabled: Boolean(merged.aiVoiceEnabled),
    aiVoiceAutoSpeak: Boolean(merged.aiVoiceAutoSpeak),
    aiVoiceName,
    aiVoiceLang: aiVoiceLang || defaultSettings.aiVoiceLang,
    aiVoiceRate: clampNumber(Number(merged.aiVoiceRate), 0.5, 2, defaultSettings.aiVoiceRate),
    aiVoicePitch: clampNumber(Number(merged.aiVoicePitch), 0, 2, defaultSettings.aiVoicePitch),
    aiVoiceVolume: clampNumber(Number(merged.aiVoiceVolume), 0, 1, defaultSettings.aiVoiceVolume),
  };
}

export const useOSStore = create<OSState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      locations: [],
      recentLocations: [],
      searchHistory: [],
      isLoading: false,
      isInitialized: false,
      error: null,
      gpsStatus: 'prompt',
      isMapOpen: false,
      isFollowing: true,
      activeDestination: null,
      activeRoute: null,
      currentPos: null,
      currentSpeed: null,
      currentHeading: null,
      totalDistanceKm: 0,
      kmCoinBalance: 120,
      mCoinBalance: 120,
      unlockedThemeIds: ['theme-0001'],
      activeThemeId: 'theme-0001',
      trips: [],
      trackingId: null,
      isSharingLive: false,
      searchResults: [],
      isSearching: false,
      selectedDiscoveredPlace: null,
      isSearchOverlayOpen: false,

      fetchSettings: async () => {
        if (get().isInitialized) return;
        set({ isLoading: true });
        try {
          const data = await api<UserSettings>('/api/settings');
          set({ settings: normalizeSettings(data), isLoading: false, isInitialized: true });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      updateSettings: async (patch) => {
        const current = get().settings;
        const optimistic = normalizeSettings({ ...current, ...patch });
        set({ settings: optimistic });
        try {
          const data = await api<UserSettings>('/api/settings', {
            method: 'POST',
            body: JSON.stringify(patch),
          });
          set({ settings: normalizeSettings(data) });
        } catch (err: any) {
          set({ error: err.message, settings: current });
        }
      },

      toggleMapPerspective: () => {
        const current = get().settings.mapPerspective;
        get().updateSettings({ mapPerspective: current === 'driving' ? 'top-down' : 'driving' });
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
          setTimeout(() => window.location.reload(), 1000);
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      openMap: (dest) => {
        if (!dest) {
          get().updateSettings({ mapPerspective: 'top-down' });
        }
        set({
          isMapOpen: true,
          isFollowing: true,
          activeDestination: dest || null,
          selectedDiscoveredPlace: null,
        });
        if (dest) {
          get().calculateRoute();
          get().logRecentLocation(dest);
        }
      },

      closeMap: () => set({
        isMapOpen: false,
        activeDestination: null,
        activeRoute: null,
        selectedDiscoveredPlace: null,
      }),

      setFollowing: (isFollowing) => set({ isFollowing }),
      setGpsStatus: (status) => set({ gpsStatus: status }),

      setCurrentPos: (pos, speed, heading, error) => {
        if (error) {
          set({ gpsStatus: 'denied', currentSpeed: 0, currentPos: null, currentHeading: null });
          return;
        }

        set((state) => {
          const validHeading = typeof heading === 'number' && !isNaN(heading);
          const previousHeading = state.currentHeading ?? 0;
          const nextHeading = validHeading ? heading : previousHeading;
          const deltaHeading = Math.abs(nextHeading - previousHeading);
          const finalHeading = (deltaHeading > 2 || !validHeading) ? nextHeading : previousHeading;

          let nextTotalDistanceKm = state.totalDistanceKm;
          let nextKmCoinBalance = state.kmCoinBalance;
          let nextMCoinBalance = state.mCoinBalance;
          const nextTrips = [...state.trips];
          const speedMps = typeof speed === 'number' && !isNaN(speed) ? speed : 0;
          const isMoving = speedMps > 0.8;

          if (pos && state.currentPos) {
            const segmentMeters = haversineDistance(
              state.currentPos[0],
              state.currentPos[1],
              pos[0],
              pos[1]
            );

            // Filter small GPS jitter and outlier jumps before adding odometer distance.
            if (segmentMeters > 1 && segmentMeters < 250) {
              const segmentKm = segmentMeters / 1000;
              nextTotalDistanceKm = Number((nextTotalDistanceKm + segmentKm).toFixed(3));

              // Reward exactly 1 coin per 10 km regardless of preferred speed units.
              const coinReward = segmentKm / 10;
              if (state.settings.units === 'kph') {
                nextKmCoinBalance = Number((nextKmCoinBalance + coinReward).toFixed(3));
              } else {
                nextMCoinBalance = Number((nextMCoinBalance + coinReward).toFixed(3));
              }

              if (isMoving) {
                if (!nextTrips.length || nextTrips[nextTrips.length - 1].endTime) {
                  nextTrips.push({ startTime: Date.now(), distanceKm: 0 });
                }
                const activeTrip = nextTrips[nextTrips.length - 1];
                activeTrip.distanceKm = Number((activeTrip.distanceKm + segmentKm).toFixed(3));
              }
            }
          }

          if (!isMoving && nextTrips.length && !nextTrips[nextTrips.length - 1].endTime) {
            nextTrips[nextTrips.length - 1].endTime = Date.now();
          }

          return {
            currentPos: pos,
            currentSpeed: speed,
            currentHeading: finalHeading,
            totalDistanceKm: nextTotalDistanceKm,
            kmCoinBalance: nextKmCoinBalance,
            mCoinBalance: nextMCoinBalance,
            trips: nextTrips,
            gpsStatus: 'granted',
          };
        });
      },

      purchaseTheme: (themeId, cost) => {
        const state = get();
        if (state.unlockedThemeIds.includes(themeId)) {
          return { success: true };
        }

        const usesMetric = state.settings.units === 'kph';
        const balance = usesMetric ? state.kmCoinBalance : state.mCoinBalance;
        if (balance < cost) {
          return { success: false, reason: `Not enough ${usesMetric ? 'KMcoin' : 'Mcoin'}` };
        }

        set({
          unlockedThemeIds: [...state.unlockedThemeIds, themeId],
          kmCoinBalance: usesMetric ? Number((state.kmCoinBalance - cost).toFixed(3)) : state.kmCoinBalance,
          mCoinBalance: usesMetric ? state.mCoinBalance : Number((state.mCoinBalance - cost).toFixed(3)),
        });
        return { success: true };
      },

      setActiveTheme: (themeId) => {
        if (themeId && !get().unlockedThemeIds.includes(themeId)) return;
        set({ activeThemeId: themeId });
      },

      calculateRoute: async () => {
        const currentPos = get().currentPos;
        const target = get().activeDestination || get().selectedDiscoveredPlace;
        if (!currentPos || !target) return;
        try {
          const route = await fetchRoute(currentPos, [target.lat, target.lon]);
          if (!route) {
            toast.error('Routing service unreachable. Showing destination only.');
            set({ activeRoute: null });
            return;
          }
          set({ activeRoute: route });
        } catch {
          toast.error('Failed to compute path. GPS visual active.');
          set({ activeRoute: null });
        }
      },

      logRecentLocation: async (loc) => {
        try {
          const updatedLoc = { ...loc, lastUsedAt: Date.now() };
          await api('/api/locations/recent', {
            method: 'POST',
            body: JSON.stringify(updatedLoc),
          });
          set((s) => {
            const filtered = s.recentLocations.filter((l) => l.id !== loc.id);
            return { recentLocations: [updatedLoc, ...filtered].slice(0, 10) };
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
        toast.success('Live360 Tracking Active');
      },

      stopLiveShare: () => {
        set({ trackingId: null, isSharingLive: false });
        toast.info('Tracking session ended');
      },

      performSearch: async (query) => {
        if (!query || query.length < 3) {
          set({ searchResults: [] });
          return;
        }
        set({ isSearching: true });
        try {
          const results = await searchPlaces(query);
          set({ searchResults: results, isSearching: false });
        } catch {
          set({ isSearching: false });
          toast.error('Search temporarily unavailable');
        }
      },

      clearSearch: () => set({ searchResults: [], isSearching: false }),
      setSearchOverlay: (open) => set({ isSearchOverlayOpen: open }),

      selectDiscoveredPlace: (place) => {
        set({
          selectedDiscoveredPlace: place,
          isSearchOverlayOpen: false,
          isMapOpen: true,
          isFollowing: true,
          activeDestination: null,
        });
        if (place) {
          get().calculateRoute();
          get().addSearchHistory(place);
        }
      },

      fetchSearchHistory: async () => {
        try {
          const res = await api<{ items: SavedLocation[] }>('/api/search/history');
          set({ searchHistory: res.items });
        } catch (err) {
          console.error('Failed to fetch search history', err);
        }
      },

      addSearchHistory: async (loc) => {
        try {
          await api('/api/search/history', {
            method: 'POST',
            body: JSON.stringify(loc),
          });
          set((s) => {
            const filtered = s.searchHistory.filter((h) => h.id !== loc.id);
            return { searchHistory: [loc, ...filtered].slice(0, 20) };
          });
        } catch (err) {
          console.error('Failed to add search history', err);
        }
      },

      clearSearchHistory: async () => {
        try {
          await api('/api/search/history', { method: 'DELETE' });
          set({ searchHistory: [] });
          toast.success('Search history cleared');
        } catch (err) {
          console.error('Failed to clear search history', err);
        }
      },
    }),
    {
      name: 'velocity-os-storage',
      partialize: (state) => ({
        settings: state.settings,
        recentLocations: state.recentLocations,
        totalDistanceKm: state.totalDistanceKm,
        kmCoinBalance: state.kmCoinBalance,
        mCoinBalance: state.mCoinBalance,
        unlockedThemeIds: state.unlockedThemeIds,
        activeThemeId: state.activeThemeId,
        trips: state.trips,
      }),
      merge: (persistedState, currentState) => {
        const mergedState = {
          ...currentState,
          ...(persistedState as Partial<OSState>),
        } as OSState;

        return {
          ...mergedState,
          settings: normalizeSettings(mergedState.settings),
        };
      },
    }
  )
);
