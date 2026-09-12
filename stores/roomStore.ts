import { create } from 'zustand';
import { roomsApi } from '@/lib/api/rooms';
import { wsService } from '@/lib/api/websocket';
import { RoomState } from '@/types/room';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface RoomStoreState {
  roomId: string | null;
  displaySessionId: string | null;
  roomStatus: RoomState | null;
  connectionStatus: ConnectionStatus;
  lastError: string | null;

  // Actions
  initializeRoom: () => Promise<void>;
  joinControlRoom: (targetRoomId?: string) => Promise<boolean>;
  leaveControlRoom: () => void;
  stopHeartbeat: () => void;
}

let heartbeatInterval: NodeJS.Timeout | null = null;

// Helper to generate a UUID safely even in non-secure contexts (e.g. HTTP on LAN)
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, (c: any) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper to get or generate session ID
const getOrCreateSessionId = () => {
  if (typeof window === 'undefined') return 'server-session';
  let sid = localStorage.getItem('singularity_display_session');
  if (!sid) {
    sid = generateUUID();
    localStorage.setItem('singularity_display_session', sid);
  }
  return sid;
};

export const useRoomStore = create<RoomStoreState>((set, get) => ({
  roomId: typeof window !== 'undefined' ? localStorage.getItem('singularity_room_id') : null,
  displaySessionId: getOrCreateSessionId(),
  roomStatus: null,
  connectionStatus: 'disconnected',
  lastError: null,

  stopHeartbeat: () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  },

  // Used exclusively by the Display client to claim exclusive display ownership and send heartbeats
  initializeRoom: async () => {
    let { roomId, displaySessionId, stopHeartbeat } = get();
    stopHeartbeat();
    set({ connectionStatus: 'connecting', lastError: null });

    if (!displaySessionId || displaySessionId === 'server-session') {
      displaySessionId = getOrCreateSessionId();
      set({ displaySessionId });
    }
    if (!roomId && typeof window !== 'undefined') {
      roomId = localStorage.getItem('singularity_room_id');
      if (roomId) set({ roomId });
    }

    let activeRoomId = roomId;

    try {
      if (!activeRoomId) {
        // Create new room
        const res = await roomsApi.create();
        activeRoomId = res.roomId;
        if (typeof window !== 'undefined') {
          localStorage.setItem('singularity_room_id', activeRoomId);
        }
      } else {
        // Verify existing room
        try {
          await roomsApi.get(activeRoomId);
        } catch (err: any) {
          // If room doesn't exist or is expired, create a new one
          if (err.status === 404 || err.status === 410) {
            const res = await roomsApi.create();
            activeRoomId = res.roomId;
            if (typeof window !== 'undefined') {
              localStorage.setItem('singularity_room_id', activeRoomId);
            }
          } else {
            throw err;
          }
        }
      }

      // Claim display
      await roomsApi.claimDisplay(activeRoomId, displaySessionId!);
      set({ roomId: activeRoomId, connectionStatus: 'connected' });
      
      // Connect to WebSocket
      wsService.connect(activeRoomId);

      // Start heartbeat
      heartbeatInterval = setInterval(async () => {
        try {
          await roomsApi.heartbeat(activeRoomId!, displaySessionId!);
        } catch (err: any) {
          console.error('Display heartbeat failed:', err);
        }
      }, 5000);

    } catch (err: any) {
      console.error('Failed to initialize display room:', err);
      set({ connectionStatus: 'error', lastError: err.message || 'Failed to connect' });
    }
  },

  // Used by the Control client to join an existing room without claiming display ownership
  joinControlRoom: async (targetRoomId?: string) => {
    let activeRoomId = targetRoomId;
    if (!activeRoomId && typeof window !== 'undefined') {
      activeRoomId = localStorage.getItem('singularity_room_id') || undefined;
    }

    if (!activeRoomId) {
      set({ connectionStatus: 'disconnected', roomId: null, lastError: null });
      return false;
    }

    activeRoomId = activeRoomId.trim().toUpperCase();
    set({ connectionStatus: 'connecting', lastError: null });

    try {
      const roomState = await roomsApi.get(activeRoomId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('singularity_room_id', activeRoomId);
      }
      set({ 
        roomId: activeRoomId, 
        roomStatus: roomState, 
        connectionStatus: 'connected', 
        lastError: null 
      });

      // Connect to WebSocket STOMP
      wsService.connect(activeRoomId);
      return true;
    } catch (err: any) {
      console.error('Failed to join room as control:', err);
      const msg = err.status === 404 
        ? 'Room not found. Please verify the 6-character code.' 
        : (err.message || 'Failed to connect to room');
      set({ connectionStatus: 'error', lastError: msg });
      return false;
    }
  },

  leaveControlRoom: () => {
    get().stopHeartbeat();
    wsService.disconnect();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('singularity_room_id');
    }
    set({ roomId: null, connectionStatus: 'disconnected', lastError: null, roomStatus: null });
  }
}));
