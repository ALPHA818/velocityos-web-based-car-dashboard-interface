import { create } from 'zustand';
import type { IntegratedMusicSourceId } from '@/lib/app-integrations';

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

export type MediaSourceId = 'library' | IntegratedMusicSourceId;

export interface MediaDisplayItem {
  kind: 'library' | 'integration';
  sourceId: MediaSourceId;
  title: string;
  artist: string;
  cover: string;
}

export interface MediaSourceOption {
  id: MediaSourceId;
  label: string;
  detail: string;
}

function createSourceArtwork(title: string, subtitle: string, startColor: string, endColor: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" fill="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="320" y2="320" gradientUnits="userSpaceOnUse">
          <stop stop-color="${startColor}" />
          <stop offset="1" stop-color="${endColor}" />
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="56" fill="url(#g)" />
      <circle cx="160" cy="152" r="82" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" stroke-width="6" />
      <path d="M118 176c18-14 66-14 84-5" stroke="white" stroke-opacity=".85" stroke-width="10" stroke-linecap="round" />
      <path d="M126 143c23-9 49-10 72-4" stroke="white" stroke-opacity=".65" stroke-width="10" stroke-linecap="round" />
      <text x="160" y="246" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="700" text-anchor="middle">${title}</text>
      <text x="160" y="274" fill="rgba(255,255,255,0.78)" font-family="Arial, sans-serif" font-size="16" text-anchor="middle">${subtitle}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const PLAYLIST: Track[] = [
  {
    id: '1',
    title: 'Midnight Drive',
    artist: 'Lofi Girl',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Neon City Lights',
    artist: 'Synthwave Dreams',
    url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Rainy Highway',
    artist: 'Chill Beats',
    url: 'https://www.youtube.com/watch?v=5yx6BWlEVcY',
    cover: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1000&auto=format&fit=crop',
  }
];

const SOURCE_LIBRARY: MediaSourceOption = {
  id: 'library',
  label: 'Dashboard Mix',
  detail: 'Built-in playlist with full transport controls',
};

const SOURCE_SPOTIFY: MediaDisplayItem = {
  kind: 'integration',
  sourceId: 'spotify',
  title: 'Spotify',
  artist: 'Integrated music source',
  cover: createSourceArtwork('Spotify', 'Integrated source', '#1db954', '#0f172a'),
};

const SOURCE_YOUTUBE_MUSIC: MediaDisplayItem = {
  kind: 'integration',
  sourceId: 'youtubeMusic',
  title: 'YouTube Music',
  artist: 'Integrated music source',
  cover: createSourceArtwork('YT Music', 'Integrated source', '#ef4444', '#111827'),
};

export const MEDIA_SOURCE_OPTIONS: MediaSourceOption[] = [
  SOURCE_LIBRARY,
  {
    id: 'spotify',
    label: 'Spotify',
    detail: 'Use Spotify in a preview window inside VelocityOS or launch the native app',
  },
  {
    id: 'youtubeMusic',
    label: 'YouTube Music',
    detail: 'Use YouTube Music in a preview window inside VelocityOS or launch the native app',
  },
];

const INTEGRATED_SOURCE_ITEMS: Record<IntegratedMusicSourceId, MediaDisplayItem> = {
  spotify: SOURCE_SPOTIFY,
  youtubeMusic: SOURCE_YOUTUBE_MUSIC,
};

interface MediaState {
  activeSource: MediaSourceId;
  isPlaying: boolean;
  isPlayerReady: boolean;
  currentTrackIndex: number;
  volume: number;
  progress: number;
  duration: number;
  // Actions
  setActiveSource: (source: MediaSourceId) => void;
  togglePlay: () => void;
  setPlayerReady: (ready: boolean) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  setProgress: (prog: number) => void;
  setDuration: (dur: number) => void;
}
export function isLibraryMediaSource(source: MediaSourceId): boolean {
  return source === 'library';
}

export function getMediaDisplay(source: MediaSourceId, index: number): MediaDisplayItem {
  if (source === 'library') {
    const track = PLAYLIST[index];
    return {
      kind: 'library',
      sourceId: 'library',
      title: track.title,
      artist: track.artist,
      cover: track.cover,
    };
  }

  return INTEGRATED_SOURCE_ITEMS[source];
}

export const useMediaStore = create<MediaState>((set, get) => ({
  activeSource: 'library',
  isPlaying: false,
  isPlayerReady: false,
  currentTrackIndex: 0,
  volume: 0.8,
  progress: 0,
  duration: 0,
  setActiveSource: (source) => set((state) => {
    if (state.activeSource === source) {
      return state;
    }

    return {
      activeSource: source,
      isPlaying: false,
      isPlayerReady: false,
      progress: 0,
      duration: 0,
    };
  }),
  togglePlay: () => {
    if (!isLibraryMediaSource(get().activeSource)) return;
    set((state) => ({ isPlaying: !state.isPlaying }));
  },
  setPlayerReady: (ready) => set({ isPlayerReady: ready }),
  nextTrack: () => {
    if (!isLibraryMediaSource(get().activeSource)) return;
    set((state) => ({
      currentTrackIndex: (state.currentTrackIndex + 1) % PLAYLIST.length,
      progress: 0,
      isPlayerReady: false,
    }));
  },
  prevTrack: () => {
    if (!isLibraryMediaSource(get().activeSource)) return;
    set((state) => ({
      currentTrackIndex: (state.currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length,
      progress: 0,
      isPlayerReady: false,
    }));
  },
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
}));
export const getTrack = (index: number) => PLAYLIST[index];
export const getCurrentTrack = (state: MediaState) => PLAYLIST[state.currentTrackIndex];
