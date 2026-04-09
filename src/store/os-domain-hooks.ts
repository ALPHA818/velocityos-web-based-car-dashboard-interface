import { useShallow } from 'zustand/react/shallow';
import { useOSStore } from '@/store/use-os-store';

export function useNavigationStatusState() {
  return useOSStore(useShallow((state) => ({
    gpsStatus: state.gpsStatus,
    currentPos: state.currentPos,
    currentSpeed: state.currentSpeed,
    currentHeading: state.currentHeading,
    activeDestination: state.activeDestination,
    activeRoute: state.activeRoute,
    routeState: state.routeState,
    routeFailureKind: state.routeFailureKind,
    routeFailureMessage: state.routeFailureMessage,
    lastGpsFixAt: state.lastGpsFixAt,
  })));
}

export function useNavigationMapShellState() {
  return useOSStore(useShallow((state) => ({
    isMapOpen: state.isMapOpen,
    isFollowing: state.isFollowing,
    activeDestination: state.activeDestination,
    activeRoute: state.activeRoute,
    currentPos: state.currentPos,
    currentHeading: state.currentHeading,
    routeState: state.routeState,
    routeFailureKind: state.routeFailureKind,
    routeFailureMessage: state.routeFailureMessage,
    lastGpsFixAt: state.lastGpsFixAt,
    openMap: state.openMap,
    closeMap: state.closeMap,
    setFollowing: state.setFollowing,
    setSearchOverlay: state.setSearchOverlay,
  })));
}

export function useNavigationCollectionsState() {
  return useOSStore(useShallow((state) => ({
    locations: state.locations,
    recentLocations: state.recentLocations,
    fetchLocations: state.fetchLocations,
    fetchRecentLocations: state.fetchRecentLocations,
    addLocation: state.addLocation,
    saveLocationBookmark: state.saveLocationBookmark,
    saveCurrentLocation: state.saveCurrentLocation,
    promoteRecentLocation: state.promoteRecentLocation,
    clearHistory: state.clearHistory,
    openMap: state.openMap,
    setSearchOverlay: state.setSearchOverlay,
  })));
}

export function useNavigationSearchState() {
  return useOSStore(useShallow((state) => ({
    isSearchOverlayOpen: state.isSearchOverlayOpen,
    isSearching: state.isSearching,
    searchResults: state.searchResults,
    searchHistory: state.searchHistory,
    selectedDiscoveredPlace: state.selectedDiscoveredPlace,
    setSearchOverlay: state.setSearchOverlay,
    performSearch: state.performSearch,
    selectDiscoveredPlace: state.selectDiscoveredPlace,
    fetchSearchHistory: state.fetchSearchHistory,
    clearSearchHistory: state.clearSearchHistory,
    addLocation: state.addLocation,
    saveLocationBookmark: state.saveLocationBookmark,
    saveSelectedPlace: state.saveSelectedPlace,
    locations: state.locations,
  })));
}

export function useLiveTrackingState() {
  return useOSStore(useShallow((state) => ({
    isSharingLive: state.isSharingLive,
    trackingId: state.trackingId,
    startLiveShare: state.startLiveShare,
    stopLiveShare: state.stopLiveShare,
  })));
}

export function useDriveSessionState() {
  return useOSStore(useShallow((state) => ({
    trips: state.trips,
    currentSpeed: state.currentSpeed,
    units: state.settings.units,
    activeDestination: state.activeDestination,
    selectedDiscoveredPlace: state.selectedDiscoveredPlace,
  })));
}

export function useParkedDemoState() {
  return useOSStore(useShallow((state) => ({
    parkedDemoStatus: state.parkedDemoStatus,
    isParkedDemoOpen: state.isParkedDemoOpen,
    openParkedDemo: state.openParkedDemo,
    dismissParkedDemo: state.dismissParkedDemo,
    completeParkedDemo: state.completeParkedDemo,
  })));
}