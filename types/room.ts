export interface DisplaySession {
  sessionId: string;
  lastHeartbeatAt?: string;
}

export type PlaybackStatus = 'stopped' | 'playing' | 'paused';
export type PlaybackMode = 'karaoke' | 'original';

export interface PlaybackState {
  songId?: string;
  status: PlaybackStatus;
  mode: PlaybackMode;
  positionMs: number;
  changedAt: string;
}

export interface RoomState {
  roomId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  display?: DisplaySession;
  queue: any[]; // Will be typed properly when queue is implemented
  playback: PlaybackState;
}

export interface CreateRoomResponse {
  roomId: string;
}
