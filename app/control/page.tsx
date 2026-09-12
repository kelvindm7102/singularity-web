'use client';

import { useEffect, useState } from 'react';
import { useRoomStore } from '@/stores/roomStore';
import { usePlaybackStore } from '@/stores/playbackStore';
import { getCoverUrl } from '@/lib/api/client';
import { Play, Pause, SkipForward, SkipBack, Loader2 } from 'lucide-react';
import { roomsApi } from '@/lib/api/rooms';
import clsx from 'clsx';

export default function ControlNowPlayingPage() {
  const { initializeRoom, connectionStatus, roomId } = useRoomStore();
  const { status, currentSong, positionMs, duration, mode } = usePlaybackStore();
  const [localSeek, setLocalSeek] = useState<number | null>(null);

  useEffect(() => {
    initializeRoom();
  }, [initializeRoom]);

  if (connectionStatus !== 'connected') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 text-[#A9B7CC]">
          <Loader2 className="w-8 h-8 animate-spin text-[#18D8FF]" />
          <p className="font-mono text-sm tracking-widest uppercase">Connecting to Room...</p>
        </div>
      </div>
    );
  }

  if (!currentSong || status === 'stopped') {
    return (
      <div className="flex items-center justify-center h-full p-6 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#18D8FF]/10 flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 bg-[#18D8FF]/20 rounded-full animate-ping" />
          </div>
          <h2 className="text-2xl font-display text-[#F2F7FF] tracking-wider">NO SONG PLAYING</h2>
          <p className="text-[#A9B7CC] font-body">Choose a song from Library to add it to the queue.</p>
        </div>
      </div>
    );
  }

  const handlePlayPause = () => {
    if (!roomId) return;
    const newStatus = status === 'playing' ? 'paused' : 'playing';
    // Optimistic update locally
    usePlaybackStore.getState().setPlaybackState({ status: newStatus });
    // Send to backend
    roomsApi.updatePlayback(roomId, {
      songId: currentSong.id,
      status: newStatus,
      mode: mode,
      positionMs: localSeek ?? positionMs,
      changedAt: new Date().toISOString()
    });
  };

  const handleNext = () => {
    if (!roomId) return;
    roomsApi.reportPlaybackEnded(roomId);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setLocalSeek(val);
  };

  const commitSeek = () => {
    if (!roomId || localSeek === null) return;
    roomsApi.updatePlayback(roomId, {
      songId: currentSong.id,
      status,
      mode,
      positionMs: localSeek,
      changedAt: new Date().toISOString()
    });
    setLocalSeek(null);
  };

  const handleModeToggle = () => {
    if (!roomId) return;
    const newMode = mode === 'karaoke' ? 'original' : 'karaoke';
    usePlaybackStore.getState().setPlaybackState({ mode: newMode });
    roomsApi.updatePlayback(roomId, {
      songId: currentSong.id,
      status,
      mode: newMode,
      positionMs: localSeek ?? positionMs,
      changedAt: new Date().toISOString()
    });
  };

  const displayPosition = localSeek !== null ? localSeek : positionMs;
  const progressPercent = duration > 0 ? (displayPosition / duration) * 100 : 0;

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-6 overflow-y-auto">
      {/* Artwork */}
      <div className="w-full aspect-square max-h-[40vh] md:max-h-[50vh] bg-black/40 rounded-xl overflow-hidden mb-8 border border-[#82aadc33] shadow-[0_0_30px_rgba(0,0,0,0.5)] flex-shrink-0 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={getCoverUrl(currentSong.id, currentSong.hasCover)} 
          alt={currentSong.title}
          className="w-full h-full object-cover opacity-90"
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050914] via-transparent to-transparent opacity-80" />
      </div>

      {/* Metadata */}
      <div className="text-center mb-8 shrink-0">
        <h1 className="text-3xl font-display text-[#F2F7FF] tracking-wider mb-2 truncate px-4 drop-shadow-[0_0_12px_rgba(24,216,255,0.2)]">
          {currentSong.title}
        </h1>
        <p className="text-[#A9B7CC] font-body text-lg truncate px-4">
          {currentSong.artist}
        </p>
      </div>

      {/* Seek Bar */}
      <div className="w-full mb-10 shrink-0 px-2 md:px-0">
        <div className="flex items-center justify-between text-[#A9B7CC] font-mono text-xs mb-3">
          <span>{formatTime(displayPosition)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="relative w-full h-2 group cursor-pointer">
          <div className="absolute inset-0 bg-[#82aadc33] rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-[#18D8FF] shadow-[0_0_10px_rgba(24,216,255,0.8)] transition-all duration-100 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input 
            type="range" 
            min={0} 
            max={duration || 100}
            value={displayPosition}
            onChange={handleSeek}
            onMouseUp={commitSeek}
            onTouchEnd={commitSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-8 mb-12 shrink-0">
        {/* Previous is not strictly supported by the simple queue, but we keep the button disabled for layout consistency if needed, or omit it. Omitting it per simplistic design is fine, but we'll add a disabled prev button to anchor the layout. */}
        <button disabled className="p-4 text-[#A9B7CC]/50 cursor-not-allowed">
          <SkipBack className="w-8 h-8" />
        </button>

        <button 
          onClick={handlePlayPause}
          className="w-20 h-20 rounded-full bg-[#18D8FF]/10 border border-[#18D8FF]/50 text-[#18D8FF] flex items-center justify-center hover:bg-[#18D8FF]/20 hover:shadow-[0_0_20px_rgba(24,216,255,0.4)] transition-all active:scale-95 shadow-[inset_0_0_20px_rgba(24,216,255,0.1)]"
        >
          {status === 'playing' ? (
            <Pause className="w-10 h-10 fill-current" />
          ) : (
            <Play className="w-10 h-10 fill-current translate-x-1" />
          )}
        </button>

        <button 
          onClick={handleNext}
          className="p-4 text-[#A9B7CC] hover:text-[#F2F7FF] hover:drop-shadow-[0_0_8px_rgba(24,216,255,0.5)] transition-all active:scale-95"
        >
          <SkipForward className="w-8 h-8" />
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-10 shrink-0">
        <div className="flex items-center bg-[#82aadc11] rounded-full p-1 border border-[#82aadc33]">
          <button
            onClick={() => mode !== 'karaoke' && handleModeToggle()}
            className={clsx(
              "px-6 py-2 rounded-full font-mono text-xs tracking-widest transition-all",
              mode === 'karaoke' 
                ? "bg-[#18D8FF]/20 text-[#18D8FF] shadow-[0_0_10px_rgba(24,216,255,0.2)]" 
                : "text-[#A9B7CC] hover:text-[#F2F7FF]"
            )}
          >
            KARAOKE
          </button>
          <button
            onClick={() => mode !== 'original' && handleModeToggle()}
            className={clsx(
              "px-6 py-2 rounded-full font-mono text-xs tracking-widest transition-all",
              mode === 'original' 
                ? "bg-[#18D8FF]/20 text-[#18D8FF] shadow-[0_0_10px_rgba(24,216,255,0.2)]" 
                : "text-[#A9B7CC] hover:text-[#F2F7FF]"
            )}
          >
            ORIGINAL
          </button>
        </div>
      </div>
      
      {/* Volume / Stems could go here if we expand the design later. */}
      {/* For now, this satisfies the core remote requirements. */}

    </div>
  );
}
