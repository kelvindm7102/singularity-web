import { useEffect } from 'react';
import { roomsApi } from '@/lib/api/rooms';
import { usePlaybackStore } from '@/stores/playbackStore';
import { wsService } from '@/lib/api/websocket';
import { PlaybackState } from '@/types/room';

export function useDisplayPlayback(roomId: string | undefined) {
  const playbackState = usePlaybackStore();

  useEffect(() => {
    if (!roomId) return;

    // 1. Fetch initial playback state
    roomsApi.getPlayback(roomId).then((pb) => {
      usePlaybackStore.getState().setPlaybackState(pb);
    }).catch(console.error);

    // 2. Listen to websocket for incoming playback commands from remotes
    const unsubscribe = wsService.subscribeToRoomEvents((event) => {
      if (event.type === 'PLAYBACK_UPDATED') {
        usePlaybackStore.getState().setPlaybackState(event.payload);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // 3. Set up the 1-second interval to broadcast position
  useEffect(() => {
    if (!roomId || playbackState.status !== 'playing') return;

    const interval = setInterval(() => {
      const currentPosMs = usePlaybackStore.getState().currentTime * 1000;
      wsService.publish(`/app/room/${roomId}/sync.position`, {
        positionMs: currentPosMs
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [roomId, playbackState.status]);

  const updateDisplayPlayback = async (newState: Partial<PlaybackState>) => {
    if (!roomId) return;
    try {
      const currentState = {
        songId: playbackState.songId,
        status: playbackState.status,
        mode: playbackState.mode,
        positionMs: playbackState.positionMs,
        changedAt: playbackState.changedAt,
        ...newState,
      };
      await roomsApi.updatePlayback(roomId, currentState as PlaybackState);
      usePlaybackStore.getState().setPlaybackState(currentState);
    } catch (err) {
      console.error('Failed to update display playback state', err);
    }
  };

  const reportSongEnded = async () => {
    if (!roomId) return;
    try {
      await roomsApi.reportPlaybackEnded(roomId);
    } catch (err) {
      console.error('Failed to report song ended', err);
    }
  };

  return {
    updateDisplayPlayback,
    reportSongEnded,
  };
}
