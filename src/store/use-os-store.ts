import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api-client';
import type { LocationCategory, UserSettings, SavedLocation } from '@shared/types';
import { fetchRoute, type RouteData, searchPlaces } from '@/lib/nav-utils';
import { haversineDistance } from '@/lib/drive-utils';
import { closeEmbeddedWebView } from '@/lib/embedded-web-view';
import type { BundleRewardDescriptor } from '@/lib/cosmetic-market';
import { getGpsSignalState, type NavigationFailureKind, type NavigationRouteState } from '@/lib/navigation-status';
import { recordTelemetryEvent } from '@/lib/telemetry';
import { toast } from 'sonner';

export type GpsStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';
export type MapPerspective = 'driving' | 'top-down';
export type BookmarkCategory = Exclude<LocationCategory, 'recent'>;
export type ParkedDemoStatus = 'pending' | 'dismissed' | 'completed';
export type TripMode = 'guided' | 'live-drive';
export type TripBreadcrumb = [lat: number, lon: number, timestamp: number];

interface BookmarkInput {
  label: string;
  address: string;
  lat: number;
  lon: number;
}

export interface TripRecord {
  startTime: number;
  endTime?: number;
  distanceKm: number;
  destinationLabel?: string | null;
  averageSpeedKph?: number;
  maxSpeedKph?: number;
  motionSampleCount?: number;
  driveMode?: TripMode;
  path?: TripBreadcrumb[];
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
  routeState: NavigationRouteState;
  routeFailureKind: NavigationFailureKind | null;
  routeFailureMessage: string | null;
  lastGpsFixAt: number | null;
  currentPos: [number, number] | null;
  currentSpeed: number | null;
  currentHeading: number | null;
  totalDistanceKm: number;
  kmCoinBalance: number;
  mCoinBalance: number;
  unlockedThemeIds: string[];
  activeThemeId: string | null;
  unlockedMapIconIds: string[];
  activeMapIconId: string | null;
  unlockedTripCosmeticIds: string[];
  activeTripCosmeticId: string | null;
  unlockedScenePackIds: string[];
  activeScenePackId: string | null;
  unlockedAmbientEffectIds: string[];
  activeAmbientEffectId: string | null;
  unlockedWidgetSkinIds: string[];
  activeWidgetSkinId: string | null;
  unlockedBundleIds: string[];
  trips: TripRecord[];
  trackingId: string | null;
  isSharingLive: boolean;
  searchResults: SavedLocation[];
  isSearching: boolean;
  selectedDiscoveredPlace: SavedLocation | null;
  isSearchOverlayOpen: boolean;
  parkedDemoStatus: ParkedDemoStatus;
  isParkedDemoOpen: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  setMapPerspective: (perspective: MapPerspective) => void;
  toggleMapPerspective: () => void;
  fetchLocations: () => Promise<void>;
  addLocation: (loc: Omit<SavedLocation, 'id'>) => Promise<void>;
  saveLocationBookmark: (loc: BookmarkInput, category?: BookmarkCategory, labelOverride?: string) => Promise<SavedLocation>;
  saveCurrentLocation: (category?: BookmarkCategory, labelOverride?: string) => Promise<SavedLocation>;
  saveSelectedPlace: (category?: BookmarkCategory, labelOverride?: string) => Promise<SavedLocation>;
  promoteRecentLocation: (loc: SavedLocation, category: BookmarkCategory, labelOverride?: string) => Promise<SavedLocation>;
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
  openParkedDemo: () => void;
  dismissParkedDemo: () => void;
  completeParkedDemo: () => void;
  purchaseTheme: (themeId: string, cost: number) => { success: boolean; reason?: string };
  purchaseMapIcon: (iconId: string, cost: number) => { success: boolean; reason?: string };
  purchaseTripCosmetic: (itemId: string, cost: number) => { success: boolean; reason?: string };
  purchaseScenePack: (itemId: string, cost: number) => { success: boolean; reason?: string };
  purchaseAmbientEffect: (itemId: string, cost: number) => { success: boolean; reason?: string };
  purchaseWidgetSkin: (itemId: string, cost: number) => { success: boolean; reason?: string };
  purchaseBundle: (bundleId: string, cost: number, rewards: BundleRewardDescriptor[]) => { success: boolean; reason?: string };
  setActiveTheme: (themeId: string | null) => void;
  setActiveMapIcon: (iconId: string | null) => void;
  setActiveTripCosmetic: (itemId: string | null) => void;
  setActiveScenePack: (itemId: string | null) => void;
  setActiveAmbientEffect: (itemId: string | null) => void;
  setActiveWidgetSkin: (itemId: string | null) => void;
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

function mergeUnlockedIds(existingIds: string[], incomingIds: string[]) {
  return Array.from(new Set([...existingIds, ...incomingIds]));
}

function spendCurrency(state: Pick<OSState, 'settings' | 'kmCoinBalance' | 'mCoinBalance'>, cost: number) {
  const usesMetric = state.settings.units === 'kph';
  const balance = usesMetric ? state.kmCoinBalance : state.mCoinBalance;

  if (balance < cost) {
    return {
      success: false as const,
      reason: `Not enough ${usesMetric ? 'KMcoin' : 'Mcoin'}`,
    };
  }

  return {
    success: true as const,
    kmCoinBalance: usesMetric ? Number((state.kmCoinBalance - cost).toFixed(3)) : state.kmCoinBalance,
    mCoinBalance: usesMetric ? state.mCoinBalance : Number((state.mCoinBalance - cost).toFixed(3)),
  };
}

const LOCATION_MATCH_PRECISION = 5;

function normalizeLocationText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function hasMatchingCoordinates(left: Pick<SavedLocation, 'lat' | 'lon'>, right: Pick<SavedLocation, 'lat' | 'lon'>) {
  return left.lat.toFixed(LOCATION_MATCH_PRECISION) === right.lat.toFixed(LOCATION_MATCH_PRECISION)
    && left.lon.toFixed(LOCATION_MATCH_PRECISION) === right.lon.toFixed(LOCATION_MATCH_PRECISION);
}

function getBookmarkLabel(category: BookmarkCategory, fallbackLabel: string) {
  if (category === 'home') return 'Home';
  if (category === 'work') return 'Work';
  return fallbackLabel.trim() || 'Saved place';
}

function createBookmarkPayload(loc: BookmarkInput, category: BookmarkCategory, labelOverride?: string): Omit<SavedLocation, 'id'> {
  const fallbackLabel = loc.label.trim() || loc.address.trim() || 'Saved place';
  const label = labelOverride?.trim() || getBookmarkLabel(category, fallbackLabel);
  const address = loc.address.trim() || fallbackLabel;

  return {
    label,
    address,
    category,
    lat: loc.lat,
    lon: loc.lon,
    lastUsedAt: Date.now(),
  };
}

function shouldReplaceBookmark(existing: SavedLocation, payload: Omit<SavedLocation, 'id'>, category: BookmarkCategory) {
  if (category === 'favorite') {
    return existing.category === 'favorite' && hasMatchingCoordinates(existing, payload);
  }

  return existing.category === category;
}

function recordPermissionTelemetry(status: GpsStatus, reason: 'status-change' | 'geolocation-error') {
  recordTelemetryEvent({
    type: 'permission-denied',
    level: 'warning',
    message: status === 'unsupported' ? 'GPS hardware unavailable.' : 'Location permission denied.',
    metadata: { status, reason },
  });
}

function recordRouteFailureTelemetry(kind: NavigationFailureKind, message: string, destination: SavedLocation | null) {
  recordTelemetryEvent({
    type: 'route-failure',
    level: kind === 'route-fetch' ? 'error' : 'warning',
    message,
    metadata: {
      kind,
      destinationLabel: destination?.label ?? null,
      destinationCategory: destination?.category ?? null,
    },
  });
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
      routeState: 'idle',
      routeFailureKind: null,
      routeFailureMessage: null,
      lastGpsFixAt: null,
      currentPos: null,
      currentSpeed: null,
      currentHeading: null,
      totalDistanceKm: 0,
      kmCoinBalance: 120,
      mCoinBalance: 120,
      unlockedThemeIds: ['theme-0001'],
      activeThemeId: 'theme-0001',
      unlockedMapIconIds: ['car-icon-0001'],
      activeMapIconId: 'car-icon-0001',
      unlockedTripCosmeticIds: ['trip-core-navigator'],
      activeTripCosmeticId: 'trip-core-navigator',
      unlockedScenePackIds: ['scene-garage-grid'],
      activeScenePackId: 'scene-garage-grid',
      unlockedAmbientEffectIds: ['effect-clear-air'],
      activeAmbientEffectId: 'effect-clear-air',
      unlockedWidgetSkinIds: ['widget-core-digital'],
      activeWidgetSkinId: 'widget-core-digital',
      unlockedBundleIds: [],
      trips: [],
      trackingId: null,
      isSharingLive: false,
      searchResults: [],
      isSearching: false,
      selectedDiscoveredPlace: null,
      isSearchOverlayOpen: false,
      parkedDemoStatus: 'pending',
      isParkedDemoOpen: false,

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

      setMapPerspective: (perspective) => {
        if (get().settings.mapPerspective === perspective) return;
        void get().updateSettings({ mapPerspective: perspective });
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

      saveLocationBookmark: async (loc, category = 'favorite', labelOverride) => {
        const payload = createBookmarkPayload(loc, category, labelOverride);
        const existingLocations = get().locations;
        const staleEntries = existingLocations.filter((entry) => shouldReplaceBookmark(entry, payload, category));

        try {
          const savedLocation = await api<SavedLocation>('/api/locations', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

          const cleanupResults = await Promise.allSettled(
            staleEntries.map((entry) => api(`/api/locations/${entry.id}`, { method: 'DELETE' }))
          );

          if (cleanupResults.some((result) => result.status === 'rejected')) {
            recordTelemetryEvent({
              type: 'diagnostic',
              level: 'warning',
              message: 'Saved bookmark but failed to clean up an older bookmark entry.',
              metadata: {
                category,
                savedLocationId: savedLocation.id,
                staleEntryIds: staleEntries.map((entry) => entry.id),
              },
            });
          }

          set((state) => ({
            locations: [
              savedLocation,
              ...state.locations.filter((entry) => !staleEntries.some((stale) => stale.id === entry.id)),
            ],
          }));

          recordTelemetryEvent({
            type: 'bookmark-save',
            level: 'info',
            message: `Saved ${payload.label} bookmark.`,
            metadata: {
              category,
              lat: payload.lat,
              lon: payload.lon,
            },
          });

          return savedLocation;
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      saveCurrentLocation: async (category = 'favorite', labelOverride) => {
        const currentPos = get().currentPos;
        if (!currentPos) {
          throw new Error('Current location is unavailable.');
        }

        return get().saveLocationBookmark({
          label: category === 'favorite' ? 'Current location' : '',
          address: 'Current GPS position',
          lat: currentPos[0],
          lon: currentPos[1],
        }, category, labelOverride);
      },

      saveSelectedPlace: async (category = 'favorite', labelOverride) => {
        const selectedPlace = get().selectedDiscoveredPlace ?? get().activeDestination;
        if (!selectedPlace) {
          throw new Error('No place is selected.');
        }

        return get().saveLocationBookmark({
          label: selectedPlace.label,
          address: selectedPlace.address,
          lat: selectedPlace.lat,
          lon: selectedPlace.lon,
        }, category, labelOverride);
      },

      promoteRecentLocation: async (loc, category, labelOverride) => {
        const savedLocation = await get().saveLocationBookmark({
          label: loc.label,
          address: loc.address,
          lat: loc.lat,
          lon: loc.lon,
        }, category, labelOverride);

        recordTelemetryEvent({
          type: 'bookmark-promote',
          level: 'info',
          message: `Promoted ${loc.label} to ${category}.`,
          metadata: {
            sourceId: loc.id,
            category,
            savedLocationId: savedLocation.id,
          },
        });

        return savedLocation;
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
          routeState: dest ? 'loading' : 'idle',
          routeFailureKind: null,
          routeFailureMessage: null,
        });
        if (dest) {
          get().calculateRoute();
          get().logRecentLocation(dest);
        }
      },

      closeMap: () => {
        void closeEmbeddedWebView();
        set({
          isMapOpen: false,
          activeDestination: null,
          activeRoute: null,
          routeState: 'idle',
          routeFailureKind: null,
          routeFailureMessage: null,
          selectedDiscoveredPlace: null,
        });
      },

      setFollowing: (isFollowing) => set({ isFollowing }),
      setGpsStatus: (status) => set((state) => {
        const hasTarget = Boolean(state.activeDestination || state.selectedDiscoveredPlace);

        if ((status === 'denied' || status === 'unsupported') && state.gpsStatus !== status) {
          recordPermissionTelemetry(status, 'status-change');
        }

        if (status === 'denied' || status === 'unsupported') {
          return {
            gpsStatus: status,
            activeRoute: null,
            routeState: hasTarget ? 'fallback' : 'idle',
            routeFailureKind: 'gps-permission',
            routeFailureMessage: status === 'unsupported'
              ? 'This device cannot provide GPS data. Destination-only fallback is active.'
              : 'Location permission is off. VelocityOS is holding on the destination pin until GPS access returns.',
          };
        }

        return { gpsStatus: status };
      }),

      setCurrentPos: (pos, speed, heading, error) => {
        if (error) {
          const hasTarget = Boolean(get().activeDestination || get().selectedDiscoveredPlace);
          if (get().gpsStatus !== 'denied') {
            recordPermissionTelemetry('denied', 'geolocation-error');
          }
          set({
            gpsStatus: 'denied',
            currentSpeed: 0,
            currentPos: null,
            currentHeading: null,
            activeRoute: null,
            routeState: hasTarget ? 'fallback' : 'idle',
            routeFailureKind: 'gps-permission',
            routeFailureMessage: 'Location permission is blocked. Turn GPS back on to restore route guidance.',
            lastGpsFixAt: null,
          });
          return;
        }

        set((state) => {
            const now = Date.now();
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
          const speedKph = speedMps * 3.6;
          const isMoving = speedMps > 0.8;
          const activeTarget = state.activeDestination || state.selectedDiscoveredPlace;

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
                  const seededPath: TripBreadcrumb[] = [
                    [state.currentPos[0], state.currentPos[1], state.lastGpsFixAt ?? now],
                    [pos[0], pos[1], now],
                  ];

                  nextTrips.push({
                    startTime: now,
                    distanceKm: 0,
                    destinationLabel: activeTarget?.label ?? null,
                    averageSpeedKph: speedKph,
                    maxSpeedKph: speedKph,
                    motionSampleCount: 1,
                    driveMode: activeTarget ? 'guided' : 'live-drive',
                    path: seededPath,
                  });
                }
                const activeTrip = nextTrips[nextTrips.length - 1];
                activeTrip.distanceKm = Number((activeTrip.distanceKm + segmentKm).toFixed(3));
                activeTrip.destinationLabel = activeTrip.destinationLabel ?? activeTarget?.label ?? null;
                activeTrip.maxSpeedKph = Math.max(activeTrip.maxSpeedKph ?? 0, speedKph);
                const nextSampleCount = (activeTrip.motionSampleCount ?? 0) + 1;
                const currentAverage = activeTrip.averageSpeedKph ?? speedKph;
                activeTrip.averageSpeedKph = Number((((currentAverage * (nextSampleCount - 1)) + speedKph) / nextSampleCount).toFixed(1));
                activeTrip.motionSampleCount = nextSampleCount;

                const currentPath = activeTrip.path ?? [];
                const lastPoint = currentPath[currentPath.length - 1];
                if (!lastPoint || lastPoint[0] !== pos[0] || lastPoint[1] !== pos[1]) {
                  activeTrip.path = [...currentPath, [pos[0], pos[1], now]];
                }
              }
            }
          }

          if (!isMoving && nextTrips.length && !nextTrips[nextTrips.length - 1].endTime) {
            nextTrips[nextTrips.length - 1].endTime = now;
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
            lastGpsFixAt: pos ? now : state.lastGpsFixAt,
            routeFailureKind: state.routeFailureKind === 'gps-permission' ? null : state.routeFailureKind,
            routeFailureMessage: state.routeFailureKind === 'gps-permission' ? null : state.routeFailureMessage,
            routeState: state.activeRoute ? 'ready' : activeTarget ? state.routeState : 'idle',
          };
        });
      },

      purchaseTheme: (themeId, cost) => {
        const state = get();
        if (state.unlockedThemeIds.includes(themeId)) {
          return { success: true };
        }

        const spendResult = spendCurrency(state, cost);
        if (!spendResult.success) {
          return { success: false, reason: spendResult.reason };
        }

        set({
          unlockedThemeIds: [...state.unlockedThemeIds, themeId],
          kmCoinBalance: spendResult.kmCoinBalance,
          mCoinBalance: spendResult.mCoinBalance,
        });
        return { success: true };
      },

      setActiveTheme: (themeId) => {
        if (themeId && !get().unlockedThemeIds.includes(themeId)) return;
        set({ activeThemeId: themeId });
      },

      purchaseMapIcon: (iconId, cost) => {
        const state = get();
        if (state.unlockedMapIconIds.includes(iconId)) {
          return { success: true };
        }

        const spendResult = spendCurrency(state, cost);
        if (!spendResult.success) {
          return { success: false, reason: spendResult.reason };
        }

        set({
          unlockedMapIconIds: [...state.unlockedMapIconIds, iconId],
          kmCoinBalance: spendResult.kmCoinBalance,
          mCoinBalance: spendResult.mCoinBalance,
        });
        return { success: true };
      },

      setActiveMapIcon: (iconId) => {
        if (iconId && !get().unlockedMapIconIds.includes(iconId)) return;
        set({ activeMapIconId: iconId });
      },

      purchaseTripCosmetic: (itemId, cost) => {
        const state = get();
        if (state.unlockedTripCosmeticIds.includes(itemId)) {
          return { success: true };
        }

        const spendResult = spendCurrency(state, cost);
        if (!spendResult.success) {
          return { success: false, reason: spendResult.reason };
        }

        set({
          unlockedTripCosmeticIds: [...state.unlockedTripCosmeticIds, itemId],
          kmCoinBalance: spendResult.kmCoinBalance,
          mCoinBalance: spendResult.mCoinBalance,
        });
        return { success: true };
      },

      setActiveTripCosmetic: (itemId) => {
        if (itemId && !get().unlockedTripCosmeticIds.includes(itemId)) return;
        set({ activeTripCosmeticId: itemId });
      },

      purchaseScenePack: (itemId, cost) => {
        const state = get();
        if (state.unlockedScenePackIds.includes(itemId)) {
          return { success: true };
        }

        const spendResult = spendCurrency(state, cost);
        if (!spendResult.success) {
          return { success: false, reason: spendResult.reason };
        }

        set({
          unlockedScenePackIds: [...state.unlockedScenePackIds, itemId],
          kmCoinBalance: spendResult.kmCoinBalance,
          mCoinBalance: spendResult.mCoinBalance,
        });
        return { success: true };
      },

      setActiveScenePack: (itemId) => {
        if (itemId && !get().unlockedScenePackIds.includes(itemId)) return;
        set({ activeScenePackId: itemId });
      },

      purchaseAmbientEffect: (itemId, cost) => {
        const state = get();
        if (state.unlockedAmbientEffectIds.includes(itemId)) {
          return { success: true };
        }

        const spendResult = spendCurrency(state, cost);
        if (!spendResult.success) {
          return { success: false, reason: spendResult.reason };
        }

        set({
          unlockedAmbientEffectIds: [...state.unlockedAmbientEffectIds, itemId],
          kmCoinBalance: spendResult.kmCoinBalance,
          mCoinBalance: spendResult.mCoinBalance,
        });
        return { success: true };
      },

      setActiveAmbientEffect: (itemId) => {
        if (itemId && !get().unlockedAmbientEffectIds.includes(itemId)) return;
        set({ activeAmbientEffectId: itemId });
      },

      purchaseWidgetSkin: (itemId, cost) => {
        const state = get();
        if (state.unlockedWidgetSkinIds.includes(itemId)) {
          return { success: true };
        }

        const spendResult = spendCurrency(state, cost);
        if (!spendResult.success) {
          return { success: false, reason: spendResult.reason };
        }

        set({
          unlockedWidgetSkinIds: [...state.unlockedWidgetSkinIds, itemId],
          kmCoinBalance: spendResult.kmCoinBalance,
          mCoinBalance: spendResult.mCoinBalance,
        });
        return { success: true };
      },

      setActiveWidgetSkin: (itemId) => {
        if (itemId && !get().unlockedWidgetSkinIds.includes(itemId)) return;
        set({ activeWidgetSkinId: itemId });
      },

      purchaseBundle: (bundleId, cost, rewards) => {
        const state = get();
        if (state.unlockedBundleIds.includes(bundleId)) {
          return { success: true };
        }

        const spendResult = spendCurrency(state, cost);
        if (!spendResult.success) {
          return { success: false, reason: spendResult.reason };
        }

        const rewardMap = {
          themes: [] as string[],
          'map-icons': [] as string[],
          'trip-cosmetics': [] as string[],
          'startup-scenes': [] as string[],
          'ambient-effects': [] as string[],
          'widget-skins': [] as string[],
        };

        rewards.forEach((reward) => {
          rewardMap[reward.category].push(reward.itemId);
        });

        set({
          unlockedBundleIds: [...state.unlockedBundleIds, bundleId],
          unlockedThemeIds: mergeUnlockedIds(state.unlockedThemeIds, rewardMap.themes),
          unlockedMapIconIds: mergeUnlockedIds(state.unlockedMapIconIds, rewardMap['map-icons']),
          unlockedTripCosmeticIds: mergeUnlockedIds(state.unlockedTripCosmeticIds, rewardMap['trip-cosmetics']),
          unlockedScenePackIds: mergeUnlockedIds(state.unlockedScenePackIds, rewardMap['startup-scenes']),
          unlockedAmbientEffectIds: mergeUnlockedIds(state.unlockedAmbientEffectIds, rewardMap['ambient-effects']),
          unlockedWidgetSkinIds: mergeUnlockedIds(state.unlockedWidgetSkinIds, rewardMap['widget-skins']),
          kmCoinBalance: spendResult.kmCoinBalance,
          mCoinBalance: spendResult.mCoinBalance,
        });

        return { success: true };
      },

      calculateRoute: async () => {
        const currentPos = get().currentPos;
        const target = get().activeDestination || get().selectedDiscoveredPlace;
        if (!target) {
          set({ activeRoute: null, routeState: 'idle', routeFailureKind: null, routeFailureMessage: null });
          return;
        }

        const state = get();
        const gpsSignalState = getGpsSignalState(state.gpsStatus, state.lastGpsFixAt);

        if (state.gpsStatus === 'denied' || state.gpsStatus === 'unsupported') {
          recordRouteFailureTelemetry('gps-permission', 'Location access is unavailable for route guidance.', target);
          set({
            activeRoute: null,
            routeState: 'fallback',
            routeFailureKind: 'gps-permission',
            routeFailureMessage: 'Enable location access to restore live route guidance. Destination-only fallback is active.',
          });
          return;
        }

        if (!currentPos) {
          recordRouteFailureTelemetry(
            gpsSignalState === 'weak' ? 'weak-signal' : 'gps-permission',
            gpsSignalState === 'weak' ? 'Waiting for a stronger GPS fix before recalculating the route.' : 'Waiting for the current GPS position before starting route guidance.',
            target,
          );
          set({
            activeRoute: null,
            routeState: 'fallback',
            routeFailureKind: gpsSignalState === 'weak' ? 'weak-signal' : 'gps-permission',
            routeFailureMessage: gpsSignalState === 'weak'
              ? 'Waiting for a stronger GPS fix before recalculating the route.'
              : 'Waiting for your current location before starting route guidance.',
          });
          return;
        }

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          recordRouteFailureTelemetry('offline', 'Routing is offline and destination-only fallback is active.', target);
          set({
            activeRoute: null,
            routeState: 'fallback',
            routeFailureKind: 'offline',
            routeFailureMessage: 'Offline fallback active. The destination pin stays visible until the network returns.',
          });
          return;
        }

        set({ routeState: 'loading', routeFailureKind: null, routeFailureMessage: null });

        try {
          const route = await fetchRoute(currentPos, [target.lat, target.lon]);
          if (!route) {
            recordRouteFailureTelemetry('route-fetch', 'Routing service unreachable. Showing destination only.', target);
            toast.error('Routing service unreachable. Showing destination only.');
            set({
              activeRoute: null,
              routeState: 'fallback',
              routeFailureKind: 'route-fetch',
              routeFailureMessage: 'The routing service did not respond. Destination-only fallback is active.',
            });
            return;
          }
          recordTelemetryEvent({
            type: 'route-change',
            level: 'info',
            message: `Route ready for ${target.label}.`,
            metadata: {
              destinationId: target.id,
              destinationCategory: target.category,
            },
          });
          set({ activeRoute: route, routeState: 'ready', routeFailureKind: null, routeFailureMessage: null });
        } catch {
          recordRouteFailureTelemetry('route-fetch', 'Route computation failed and fallback mode is active.', target);
          toast.error('Failed to compute path. GPS visual active.');
          set({
            activeRoute: null,
            routeState: 'fallback',
            routeFailureKind: 'route-fetch',
            routeFailureMessage: 'Route computation failed. VelocityOS is keeping the destination marker visible.',
          });
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
          set({ searchResults: [], isSearching: false });
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
          routeState: place ? 'loading' : 'idle',
          routeFailureKind: null,
          routeFailureMessage: null,
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

      openParkedDemo: () => set({ isParkedDemoOpen: true }),

      dismissParkedDemo: () => set((state) => ({
        isParkedDemoOpen: false,
        parkedDemoStatus: state.parkedDemoStatus === 'pending' ? 'dismissed' : state.parkedDemoStatus,
      })),

      completeParkedDemo: () => set({ isParkedDemoOpen: false, parkedDemoStatus: 'completed' }),
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
        unlockedMapIconIds: state.unlockedMapIconIds,
        activeMapIconId: state.activeMapIconId,
        unlockedTripCosmeticIds: state.unlockedTripCosmeticIds,
        activeTripCosmeticId: state.activeTripCosmeticId,
        unlockedScenePackIds: state.unlockedScenePackIds,
        activeScenePackId: state.activeScenePackId,
        unlockedAmbientEffectIds: state.unlockedAmbientEffectIds,
        activeAmbientEffectId: state.activeAmbientEffectId,
        unlockedWidgetSkinIds: state.unlockedWidgetSkinIds,
        activeWidgetSkinId: state.activeWidgetSkinId,
        unlockedBundleIds: state.unlockedBundleIds,
        trips: state.trips,
        parkedDemoStatus: state.parkedDemoStatus,
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
