'use client';

import { useEffect } from 'react';
import DisplayLayout from '@/components/display/DisplayLayout';
import IdleScreen from '@/components/display/IdleScreen';
import Player from '@/components/display/Player';
import { useRoomStore } from '@/stores/roomStore';
import { useUiStore } from '@/stores/uiStore';
import { usePlaybackStore } from '@/stores/playbackStore';
import { useQueueStore } from '@/stores/queueStore';
import { wsService } from '@/lib/api/websocket';

export default function DisplayPage() {
  const { initializeRoom, connectionStatus, lastError } = useRoomStore();
  const { showOsd } = useUiStore();

  useEffect(() => {
    initializeRoom();
  }, [initializeRoom]);

  useEffect(() => {
    if (connectionStatus === 'connected') {
      showOsd('ROOM CONNECTED', 'Ready for playback', 'low', 3000);
    } else if (connectionStatus === 'error') {
      showOsd('CONNECTION ERROR', lastError || 'Unknown error', 'high', 0);
    } else if (connectionStatus === 'connecting') {
      showOsd('CONNECTING', 'Establishing connection...', 'low', 0);
    }
  }, [connectionStatus, lastError, showOsd]);

  // Show IdleScreen if no song is playing
  // Show IdleScreen if no song is playing
  const { status, songId, fetchPlayback, setPlaybackState } = usePlaybackStore();
  const showIdle = connectionStatus === 'connected' && (!songId || status === 'stopped');

  // Fetch playback and queue initially when connected
  const { roomId } = useRoomStore();
  const { fetchQueue } = useQueueStore();
  
  useEffect(() => {
    if (connectionStatus === 'connected' && roomId) {
      // Initial fetch to sync state
      fetchPlayback(roomId);
      fetchQueue(roomId);

      // Listen for WebSocket room events
      const unsubscribe = wsService.subscribeToRoomEvents((event) => {
        if (event.type === 'PLAYBACK_UPDATED') {
          // Payload is PlaybackState
          setPlaybackState(event.payload);
        } else if (event.type === 'QUEUE_UPDATED') {
          if (Array.isArray(event.payload)) {
            useQueueStore.getState().setQueue(event.payload);
          } else {
            fetchQueue(roomId);
          }
        }
      });

      return () => unsubscribe();
    }
  }, [connectionStatus, roomId, fetchPlayback, fetchQueue, setPlaybackState]);

  return (
    <DisplayLayout>
      {connectionStatus !== 'connected' && (
        <div className="text-center space-y-4 opacity-50">
          <h1 className="text-4xl font-bold tracking-widest uppercase">Singularity Display</h1>
          <p className="text-xl tracking-widest">{connectionStatus.toUpperCase()}</p>
        </div>
      )}
      
      {connectionStatus === 'connected' && <Player />}
      {showIdle && <IdleScreen />}
    </DisplayLayout>
  );
}
