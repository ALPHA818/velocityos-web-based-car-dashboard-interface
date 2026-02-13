export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface User {
  id: string;
  name: string;
}
export interface UserSettings {
  id: string;
  units: 'mph' | 'kph';
  mapProvider: 'google' | 'waze';
  mapTheme: 'light' | 'dark' | 'vibrant' | 'highway';
  theme: 'dark' | 'light';
  autoTheme: boolean;
  mapPerspective: 'driving' | 'top-down';
}
export type LocationCategory = 'home' | 'work' | 'favorite' | 'recent';
export interface SavedLocation {
  id: string;
  label: string;
  address: string;
  lat: number;
  lon: number;
  category: LocationCategory;
  lastUsedAt?: number;
}
export interface TrackingState {
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  lastUpdate: number;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
}