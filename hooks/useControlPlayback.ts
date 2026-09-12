import { useEffect } from 'react';
import { roomsApi } from '@/lib/api/rooms';
import { usePlaybackStore } from '@/stores/playbackStore';
import { wsService } from '@/lib/api/websocket';
import { PlaybackState } from '@/types/room';

export const updateRemotePlayback = async (roomId: string, newState: Partial<PlaybackState>) => {
  try {
    const playbackState = usePlaybackStore.getState();
    const currentState = {
      songId: playbackState.songId,
      status: playbackState.status,
      mode: playbackState.mode,
      positionMs: playbackState.positionMs,
      instrumentVolume: playbackState.instrumentVolume,
      vocalVolume: playbackState.vocalVolume,
      changedAt: playbackState.changedAt,
      ...newState,
    };
    await roomsApi.updatePlayback(roomId, currentState as PlaybackState);
    
    // Optimistically apply state
    usePlaybackStore.getState().setPlaybackState(currentState);
  } catch (err) {
    console.error('Failed to update remote playback state', err);
  }
};

export function useControlPlayback(roomId: string | undefined) {
  useEffect(() => {
    if (!roomId) return;

    // Fetch initial state
    roomsApi.getPlayback(roomId).then((pb) => {
      usePlaybackStore.getState().setPlaybackState(pb);
    }).catch(console.error);

    // Listen for WebSocket sync events from Display (Position Sync) and generic Playback updates
    const unsubscribe = wsService.subscribeToRoomEvents((event) => {
      if (event.type === 'PLAYBACK_SYNC') {
        const { positionMs } = event.payload;
        // Smoothly update remote scrubber without jumping status
        usePlaybackStore.getState().setProgress(positionMs / 1000, usePlaybackStore.getState().duration);
      } else if (event.type === 'PLAYBACK_UPDATED') {
        usePlaybackStore.getState().setPlaybackState(event.payload);
      }
    });

    return () => unsubscribe();
  }, [roomId]);
}
