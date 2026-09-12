'use client';

import { useState, useEffect } from 'react';
import { usePlaybackStore } from '@/stores/playbackStore';
import { useRoomStore } from '@/stores/roomStore';
import { roomsApi } from '@/lib/api/rooms';
import { getCoverUrl } from '@/lib/api/client';
import { Play, Pause } from 'lucide-react';
import Link from 'next/link';

export function MiniPlayer() {
  const { roomId } = useRoomStore();
  const { currentSong, status, mode, positionMs, duration, changedAt } = usePlaybackStore();
  const [localProgress, setLocalProgress] = useState(0);

  // Local progress tick for UI
  useEffect(() => {
    if (status !== 'playing') {
      setLocalProgress(positionMs);
      return;
    }

    const startSysTime = changedAt ? new Date(changedAt).getTime() : Date.now();
    let frameId: number;
    const tick = () => {
      const now = Date.now();
      const elapsed = now - startSysTime;
      setLocalProgress(positionMs + elapsed);
      frameId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(frameId);
  }, [status, positionMs, changedAt]);

  if (!currentSong) return null;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation
    if (!roomId) return;
    const newStatus = status === 'playing' ? 'paused' : 'playing';
    usePlaybackStore.getState().setPlaybackState({ status: newStatus });
    roomsApi.updatePlayback(roomId, {
      songId: currentSong.id,
      status: newStatus,
      mode: mode,
      positionMs: positionMs,
      changedAt: new Date().toISOString()
    });
  };

  const songDuration = duration > 0 ? duration : (currentSong?.duration || 0) * 1000;
  const progressPercent = songDuration > 0 ? Math.min(100, (localProgress / songDuration) * 100) : 0;

  return (
    <Link 
      href="/control"
      className="absolute bottom-16 md:bottom-0 left-0 md:left-64 right-0 bg-[#080E1C]/95 backdrop-blur-md border-t border-[#18D8FF]/30 flex items-center p-2 gap-3 z-40 transition-transform shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
    >
      {/* Artwork */}
      <div className="w-10 h-10 bg-black/40 rounded overflow-hidden shrink-0 border border-[#82aadc33]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={getCoverUrl(currentSong.id, currentSong.hasCover)} 
          alt={currentSong.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-display tracking-wide truncate text-[#F2F7FF]">
          {currentSong.title}
        </h4>
        <p className="text-xs font-body text-[#A9B7CC] truncate">
          {currentSong.artist}
        </p>
      </div>

      {/* Controls */}
      <button 
        onClick={handlePlayPause}
        className="shrink-0 w-10 h-10 flex items-center justify-center text-[#18D8FF] hover:bg-[#18D8FF]/10 rounded-full transition-colors active:scale-95"
      >
        {status === 'playing' ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current translate-x-0.5" />
        )}
      </button>

      {/* Progress Bar (absolute top edge) */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#82aadc33]">
        <div 
          className="h-full bg-[#18D8FF] shadow-[0_0_5px_rgba(24,216,255,0.8)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </Link>
  );
}
