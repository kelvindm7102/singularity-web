import { fetchApi } from './client';
import { RoomState, CreateRoomResponse, PlaybackState } from '@/types/room';

export const roomsApi = {
  create: () =>
    fetchApi<CreateRoomResponse>('/api/rooms', { method: 'POST' }),

  get: (roomId: string) =>
    fetchApi<RoomState>(`/api/rooms/${roomId}`),

  claimDisplay: (roomId: string, sessionId: string) =>
    fetchApi<void>(`/api/rooms/${roomId}/display`, {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    }),

  heartbeat: (roomId: string, sessionId: string) =>
    fetchApi<void>(`/api/rooms/${roomId}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    }),

  releaseDisplay: (roomId: string) =>
    fetchApi<void>(`/api/rooms/${roomId}/display`, {
      method: 'DELETE'
    }),

  // Playback
  getPlayback: (roomId: string) =>
    fetchApi<any>(`/api/rooms/${roomId}/playback`),
    
  updatePlayback: (roomId: string, state: PlaybackState) =>
    fetchApi<void>(`/api/rooms/${roomId}/playback`, {
      method: 'PUT',
      body: JSON.stringify(state)
    }),

  reportPlaybackEnded: (roomId: string) =>
    fetchApi<void>(`/api/rooms/${roomId}/playback/ended`, {
      method: 'POST'
    }),

  // Queue
  getQueue: (roomId: string) =>
    fetchApi<any[]>(`/api/rooms/${roomId}/queue`),
    
  addQueueItem: (roomId: string, item: any) =>
    fetchApi<void>(`/api/rooms/${roomId}/queue`, {
      method: 'POST',
      body: JSON.stringify(item)
    }),
    
  updateQueueItem: (roomId: string, queueItemId: string, item: any) =>
    fetchApi<void>(`/api/rooms/${roomId}/queue/${queueItemId}`, {
      method: 'PATCH',
      body: JSON.stringify(item)
    }),
    
  deleteQueueItem: (roomId: string, queueItemId: string) =>
    fetchApi<void>(`/api/rooms/${roomId}/queue/${queueItemId}`, {
      method: 'DELETE'
    }),

  playQueueItem: (roomId: string, queueItemId: string) =>
    fetchApi<void>(`/api/rooms/${roomId}/queue/${queueItemId}/play`, {
      method: 'POST'
    })
};
