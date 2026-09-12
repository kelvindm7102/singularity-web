'use client';

import {usePlaybackStore} from '@/stores/playbackStore';
import {useRoomStore} from '@/stores/roomStore';
import {getCoverUrl} from '@/lib/api/client';
import {Pause, Play} from 'lucide-react';
import {updateRemotePlayback} from '@/hooks/useControlPlayback';
import Link from 'next/link';
import {usePathname} from "next/navigation";

export function MiniPlayer() {
  const url = usePathname();
  const isNowPlaying = url == "/control"
  const { roomId, connectionStatus } = useRoomStore();
  const { currentSong, status, currentTime, duration } = usePlaybackStore();

  // If not connected, don't show the mini-player
  if (connectionStatus !== 'connected' || !roomId) return null;
  if (!currentSong) return null;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentSong) return;
    const newStatus = status === 'playing' ? 'paused' : 'playing';
    updateRemotePlayback(roomId, { status: newStatus });
  };

  const songDuration = duration > 0 ? duration : (currentSong?.duration || 0) * 1000;
  const progressPercent = songDuration > 0 ? Math.min(100, (currentTime*1000 / songDuration) * 100) : 0;

  return (
    <Link 
      href="/control"
      className={`absolute bottom-0 left-0 right-0 w-full bg-space-900/95 backdrop-blur-md border-t border-cyan-500/30 flex items-center p-2 gap-3 z-40 transition-transform shadow-[0_-10px_30px_rgba(0,0,0,0.5)] 
      ${isNowPlaying ? "translate-y-[200%]":""}`}
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
        <h4 className="text-sm font-display tracking-wide truncate text-text-primary">
          {currentSong.title}
        </h4>
        <p className="text-xs font-body text-text-secondary truncate">
          {currentSong.artist}
        </p>
      </div>

      {/* Controls */}
      <button onClick={handlePlayPause} className="shrink-0 w-10 h-10 flex items-center justify-center text-cyan-500 hover:bg-cyan-500/10 rounded-full transition-colors active:scale-95"
      >
        {status === 'playing' ? (<Pause className="w-5 h-5 fill-current" />) : (<Play className="w-5 h-5 fill-current translate-x-0.5" />
        )}
      </button>

      {/* Progress Bar (absolute top edge) */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#82aadc33]">
        <div 
          className="h-full bg-cyan-500 transition-all duration-1000 shadow-[0_0_5px_rgba(24,216,255,0.8)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </Link>
  );
}
