'use client';

import { useEffect, useRef } from 'react';
import { usePlaybackStore } from '@/stores/playbackStore';
import { useDisplayPlayback } from '@/hooks/useDisplayPlayback';
import { PlaybackRuntime } from '@/runtime/playback/PlaybackRuntime';
import { useRoomStore } from '@/stores/roomStore';
import { useUiStore } from '@/stores/uiStore';
import { audioElementRef } from '@/runtime/playback/audioElementRef';

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const runtimeRef = useRef<PlaybackRuntime | null>(null);
  
  const { songId, status, mode, instrumentVolume, vocalVolume, currentSong, positionMs, changedAt } = usePlaybackStore();
  const roomId = useRoomStore(state => state.roomId) || undefined;
  const { updateDisplayPlayback, reportSongEnded } = useDisplayPlayback(roomId);

  // Initialize Runtime
  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
      // Expose audio element for high-res lyric clock (§6, §7)
      audioElementRef.current = audioEl;

      runtimeRef.current = new PlaybackRuntime(audioEl, videoRef.current || undefined);
      
      runtimeRef.current.onEnded = async () => {
        usePlaybackStore.getState().setProgress(0, 0);
        if (roomId) {
          await reportSongEnded();
        }
      };

      // timeupdate → only for seekbar/UI progress (coarse is fine there)
      const handleTimeUpdate = () => {
        usePlaybackStore.getState().setProgress(
          audioEl.currentTime,
          audioEl.duration || 0
        );
      };

      const handleDurationChange = () => {
        usePlaybackStore.getState().setProgress(
          audioEl.currentTime,
          audioEl.duration || 0
        );
      };

      audioEl.addEventListener('timeupdate', handleTimeUpdate);
      audioEl.addEventListener('durationchange', handleDurationChange);

      return () => {
        audioEl.removeEventListener('timeupdate', handleTimeUpdate);
        audioEl.removeEventListener('durationchange', handleDurationChange);
        audioElementRef.current = null;
        runtimeRef.current?.destroy();
        runtimeRef.current = null;
      };
    }
  }, [roomId]);

  // Handle Seek Target (from display local interactions)
  const seekTarget = usePlaybackStore(state => state.seekTarget);
  useEffect(() => {
    if (seekTarget !== null && runtimeRef.current) {
      const posMs = Math.round(seekTarget * 1000);
      runtimeRef.current.seek(posMs);
      if (roomId) {
        const state = usePlaybackStore.getState();
        updateDisplayPlayback({
          songId: state.songId,
          status: state.status,
          mode: state.mode,
          positionMs: posMs,
          changedAt: new Date().toISOString()
        });
      }
      usePlaybackStore.getState().consumeSeek();
    }
  }, [seekTarget, roomId, updateDisplayPlayback]);

  // Handle remote position synchronization
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || !songId || !audioRef.current) return;

    const currentAudioTimeMs = audioRef.current.currentTime * 1000;
    // If the remote state is updated and differs from local time by > 1.5 seconds, we sync
    if (Math.abs(currentAudioTimeMs - positionMs) > 1500) {
      runtime.seek(positionMs);
    }
  }, [positionMs, changedAt, songId]);

  const lastLoadedSongIdRef = useRef<string | null>(null);

  // 1. Song loading: only triggers when songId changes
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    if (songId) {
      if (lastLoadedSongIdRef.current !== songId) {
        lastLoadedSongIdRef.current = songId;
        runtime.unload();
        import('@/lib/api/library').then(({ libraryApi }) => {
          libraryApi.getById(songId).then((song) => {
            usePlaybackStore.getState().setCurrentSong(song);
            useUiStore.getState().showOsd('NEXT SONG', [song.artist, song.title], 'medium');
            runtime.loadSong(song).then(() => {
              if (usePlaybackStore.getState().status === 'playing') {
                runtime.play();
              }
            }).catch((err) => {
              console.error(err);
              useUiStore.getState().showOsd('PLAYBACK ERROR', 'Failed to load song', 'high');
            });
          }).catch(console.error);
        });
      }
    } else {
      lastLoadedSongIdRef.current = null;
      runtime.unload();
    }
  }, [songId]);

  // 2. Playback state (play / pause)
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    if (status === 'playing') {
      runtime.initAudioGraph();
      if ((runtime as any).currentSongId === songId) {
        runtime.play();
      }
    } else if (status === 'paused' || status === 'stopped') {
      runtime.pause();
    }
  }, [status, songId]);

  // 3. Audio mixer (mode & volume) without touching playback state
  const prevModeRef = useRef<string | null>(null);
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    if (prevModeRef.current !== null && prevModeRef.current !== mode) {
      useUiStore.getState().showOsd('PLAYBACK MODE', mode, 'low');
    }
    prevModeRef.current = mode;

    runtime.setMode(mode, vocalVolume, instrumentVolume);
  }, [mode, vocalVolume, instrumentVolume]);

  // High resolution tick for video sync (lyrics would go here too)
  useEffect(() => {
    let animationFrameId: number;
    
    const tick = () => {
      if (runtimeRef.current && status === 'playing') {
        runtimeRef.current.syncVideo();
      }
      animationFrameId = requestAnimationFrame(tick);
    };
    
    tick();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [status]);

  return (
    <>
      <audio ref={audioRef} crossOrigin="anonymous" className="hidden" />
      {/* Background Video Layer */}
      <video 
        ref={videoRef} 
        crossOrigin="anonymous" 
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-40 mix-blend-screen"
        playsInline
        muted
        loop
      />
    </>
  );
}
