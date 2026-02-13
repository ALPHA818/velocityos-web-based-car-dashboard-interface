import { create } from 'zustand';
export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
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
interface MediaState {
  isPlaying: boolean;
  isPlayerReady: boolean;
  currentTrackIndex: number;
  volume: number;
  progress: number;
  duration: number;
  // Actions
  togglePlay: () => void;
  setPlayerReady: (ready: boolean) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  setProgress: (prog: number) => void;
  setDuration: (dur: number) => void;
}
export const useMediaStore = create<MediaState>((set) => ({
  isPlaying: false,
  isPlayerReady: false,
  currentTrackIndex: 0,
  volume: 0.8,
  progress: 0,
  duration: 0,
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlayerReady: (ready) => set({ isPlayerReady: ready }),
  nextTrack: () => set((state) => ({
    currentTrackIndex: (state.currentTrackIndex + 1) % PLAYLIST.length,
    progress: 0,
    isPlayerReady: false // Reset on track change to wait for next instance
  })),
  prevTrack: () => set((state) => ({
    currentTrackIndex: (state.currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length,
    progress: 0,
    isPlayerReady: false
  })),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
}));
export const getTrack = (index: number) => PLAYLIST[index];
export const getCurrentTrack = (state: MediaState) => PLAYLIST[state.currentTrackIndex];