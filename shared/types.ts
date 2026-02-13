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
  id: string; // usually 'default' or userId
  units: 'mph' | 'kph';
  mapProvider: 'google' | 'waze';
  theme: 'dark' | 'light';
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
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}