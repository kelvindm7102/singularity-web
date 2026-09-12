import { create } from 'zustand';
import { roomsApi } from '@/lib/api/rooms';

export interface QueueItem {
  queueItemId: string;
  songId: string;
  title?: string;
  artist?: string;
  position: number;
  addedAt: string;
  hasCover: boolean;
}

interface QueueStoreState {
  items: QueueItem[];
  currentQueueItemId: string | null;

  // Actions
  setQueue: (items: QueueItem[]) => void;
  fetchQueue: (roomId: string) => Promise<void>;
  setCurrentItem: (queueItemId: string | null) => void;
}

export const useQueueStore = create<QueueStoreState>((set) => ({
  items: [],
  currentQueueItemId: null,

  setQueue: (items) => {
    const sorted = Array.isArray(items) ? [...items].sort((a, b) => a.position - b.position) : [];
    set({ items: sorted });
  },
  
  fetchQueue: async (roomId: string) => {
    try {
      const items = await roomsApi.getQueue(roomId);
      const sorted = Array.isArray(items) ? [...items].sort((a, b) => a.position - b.position) : [];
      set({ items: sorted });
    } catch (err) {
      console.error('Failed to fetch queue', err);
    }
  },

  setCurrentItem: (queueItemId) => set({ currentQueueItemId: queueItemId })
}));
