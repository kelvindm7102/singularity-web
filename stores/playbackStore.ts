import { create } from 'zustand';
import { roomsApi } from '@/lib/api/rooms';
import { libraryApi, Song } from '@/lib/api/library';
import { PlaybackState } from '@/types/room';
import { LyricManifest, LyricData } from '@/types/song';

interface PlaybackStoreState {
  songId?: string;
  status: 'stopped' | 'playing' | 'paused';
  mode: 'karaoke' | 'original';
  positionMs: number;
  changedAt: string;

  // Metadata & Media clock
  currentSong: Song | null;
  currentTime: number;
  duration: number;
  seekTarget: number | null;

  // Volume Levels
  instrumentVolume: number;
  vocalVolume: number;

  // Lyrics
  availableLyrics: LyricManifest[];
  activeLyricId: string | null;
  activeLyricData: LyricData | null;

  // Actions
  setInstrumentVolume: (vol: number) => void;
  setVocalVolume: (vol: number) => void;
  setCurrentSong: (song: Song | null) => void;
  setProgress: (currentTime: number, duration: number) => void;
  requestSeek: (timeSec: number) => void;
  consumeSeek: () => void;
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  fetchPlayback: (roomId: string) => Promise<void>;
  updatePlayback: (roomId: string, state: PlaybackState) => Promise<void>;
  fetchLyrics: (songId: string) => Promise<void>;
  setActiveLyric: (lyricId: string) => Promise<void>;
}

const getInitialVolumes = () => {
  if (typeof window === 'undefined') return { instrumentVolume: 0.8, vocalVolume: 0 };
  try {
    const saved = localStorage.getItem('singularity.volumePreferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        instrumentVolume: typeof parsed.instrumental === 'number' ? parsed.instrumental : 0.8,
        vocalVolume: typeof parsed.vocal === 'number' ? parsed.vocal : 0
      };
    }
  } catch (e) {}
  return { instrumentVolume: 0.8, vocalVolume: 0 };
};

const initialVolumes = getInitialVolumes();

export const usePlaybackStore = create<PlaybackStoreState>((set, get) => ({
  status: 'stopped',
  mode: 'karaoke',
  positionMs: 0,
  changedAt: new Date().toISOString(),
  currentSong: null,
  currentTime: 0,
  duration: 0,
  seekTarget: null,
  instrumentVolume: initialVolumes.instrumentVolume,
  vocalVolume: initialVolumes.vocalVolume,
  availableLyrics: [],
  activeLyricId: null,
  activeLyricData: null,

  setInstrumentVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    set({ instrumentVolume: clamped });
    try {
      const vocal = get().vocalVolume;
      localStorage.setItem('singularity.volumePreferences', JSON.stringify({
        instrumental: clamped,
        vocal
      }));
    } catch (e) {}
  },

  setVocalVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    set({ vocalVolume: clamped });
    try {
      const instrumental = get().instrumentVolume;
      localStorage.setItem('singularity.volumePreferences', JSON.stringify({
        instrumental,
        vocal: clamped
      }));
    } catch (e) {}
  },

  setCurrentSong: (song) => set({ currentSong: song }),
  
  setProgress: (currentTime, duration) => set({ currentTime, duration }),
  
  requestSeek: (timeSec) => set({ seekTarget: timeSec, currentTime: timeSec }),
  
  consumeSeek: () => set({ seekTarget: null }),

  setPlaybackState: (newState) => {
    const prevSongId = get().songId;
    set((state) => ({ ...state, ...newState }));
    
    // When song changes or currentSong is missing, fetch song details
    if (newState.songId && (newState.songId !== prevSongId || !get().currentSong)) {
      libraryApi.getById(newState.songId).then((song) => {
        set({ currentSong: song });
      }).catch(console.error);
      get().fetchLyrics(newState.songId);
    } else if (!newState.songId || newState.status === 'stopped') {
      set({ currentSong: null, availableLyrics: [], activeLyricId: null, activeLyricData: null });
    }
  },

  fetchLyrics: async (songId: string) => {
    // Reset lyric state before loading
    set({ availableLyrics: [], activeLyricId: null, activeLyricData: null });
    try {
      const { songsApi } = await import('@/lib/api/songs');
      const manifests = await songsApi.getLyrics(songId);
      if (!manifests || manifests.length === 0) return;

      // Sort by priority (lower = higher priority) then pick recommended first
      const sorted = [...manifests].sort((a, b) => {
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return a.priority - b.priority;
      });
      set({ availableLyrics: sorted });
      // Auto-select best lyric
      await get().setActiveLyric(sorted[0].id);
    } catch (e) {
      console.error('Failed to fetch lyrics', e);
    }
  },

  setActiveLyric: async (lyricId: string) => {
    set({ activeLyricId: lyricId, activeLyricData: null });
    try {
      const { songsApi } = await import('@/lib/api/songs');
      const data = await songsApi.getLyricContent(lyricId);
      set({ activeLyricData: data });
    } catch (e) {
      console.error('Failed to load lyric content', e);
    }
  },
  
  fetchPlayback: async (roomId: string) => {
    try {
      const state = await roomsApi.getPlayback(roomId);
      if (state) {
        get().setPlaybackState(state);
      }
    } catch (err) {
      console.error('Failed to fetch playback', err);
    }
  },

  updatePlayback: async (roomId: string, state: PlaybackState) => {
    try {
      const prevSongId = get().songId;
      await roomsApi.updatePlayback(roomId, state);
      set({
        songId: state.songId,
        status: state.status,
        mode: state.mode,
        positionMs: state.positionMs,
        changedAt: state.changedAt
      });
      if (state.songId && (!get().currentSong || get().currentSong?.id !== state.songId)) {
        try {
          const song = await libraryApi.getById(state.songId);
          set({ currentSong: song });
        } catch (e) {
          console.error('Failed to load song info', e);
        }
        // Auto-fetch lyrics for new song
        if (prevSongId !== state.songId) {
          get().fetchLyrics(state.songId);
        }
      } else if (!state.songId || state.status === 'stopped') {
        set({ currentSong: null, currentTime: 0, duration: 0, availableLyrics: [], activeLyricId: null, activeLyricData: null });
      }
    } catch (err) {
      console.error('Failed to update playback state', err);
    }
  }
}));
