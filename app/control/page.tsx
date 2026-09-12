'use client';

import React, {useState} from 'react';
import {useRoomStore} from '@/stores/roomStore';
import {usePlaybackStore} from '@/stores/playbackStore';
import {getCoverUrl} from '@/lib/api/client';
import {Loader2, Mic2, Music2, Pause, Play, SkipForward} from 'lucide-react';
import {roomsApi} from '@/lib/api/rooms';
import {updateRemotePlayback} from '@/hooks/useControlPlayback';
import {useQueueStore} from "@/stores/queueStore";

export default function ControlNowPlayingPage() {
  const {connectionStatus, roomId } = useRoomStore();
  const q = useQueueStore()
  const { status, currentSong, currentTime, duration, mode, instrumentVolume, vocalVolume } = usePlaybackStore();
  const [localSeek, setLocalSeek] = useState<number | null>(null);

  if (connectionStatus !== 'connected') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <p className="font-mono text-sm tracking-widest uppercase">Connecting to Room...</p>
        </div>
      </div>
    );
  }

  const handlePlayPause = () => {
    if (!roomId || !currentSong) return;
    const newStatus = status === 'playing' ? 'paused' : 'playing';
    updateRemotePlayback(roomId, { status: newStatus });
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
    if (!roomId || localSeek === null || !currentSong) return;
    updateRemotePlayback(roomId, { positionMs: localSeek }).finally(()=>setTimeout(()=>setLocalSeek(null), 1000));
  };

  const commitVol = () => {

  }

  const handleModeToggle = () => {
    if (!roomId || !currentSong) return;
    const newMode = mode === 'karaoke' ? 'original' : 'karaoke';
    updateRemotePlayback(roomId, { mode: newMode, positionMs: currentTime*1000 });
  };

  const displayPosition = localSeek !== null ? localSeek : (currentTime*1000);
  const songDuration = duration > 0 ? duration : (currentSong?.duration || 0) * 1000;

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full px-12 mx-auto p-6 overflow-y-auto">
      {/* Artwork */}
    <div className={'max-h-[40vh] md:max-h-[50vh] mb-8 flex flex-col items-center justify-center'}>
      <div className="aspect-square max-h-[40vh] md:max-h-[50vh] bg-black/40 rounded-xl overflow-hidden border border-[#82aadc33] shadow-[0_0_30px_rgba(0,0,0,0.5)] shrink-0 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={getCoverUrl(currentSong?.id, currentSong?.hasCover || false)}
          alt={currentSong?.title}
          className="w-full h-full object-cover opacity-90"
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-space-950 via-transparent to-transparent opacity-80" />
      </div>
    </div>

      {/* Metadata */}
      <div className="text-center mb-8 shrink-0">
        <h1 className="text-3xl font-display text-text-primary tracking-wider mb-2 truncate px-4 drop-shadow-[0_0_12px_rgba(24,216,255,0.2)]">
          {currentSong?.title || "No track selected"}
        </h1>
        <p className="text-text-secondary font-body text-lg truncate px-4">
          {(currentSong?.artist || "Unknown Artist")+ (currentSong?.album ? `  -  ${currentSong.album}` : '')}
        </p>
      </div>

      {/* Seek Bar */}
      <div className="w-full mb-10 shrink-0 px-2 md:px-0">
        <div className="flex items-center justify-between text-text-secondary font-mono text-xs mb-3">
          <span>{formatTime(displayPosition)}</span>
          <span>{formatTime(songDuration)}</span>
        </div>
        <div className="relative w-full h-2 group cursor-pointer">
          <div className="absolute inset-0 bg-[#82aadc33] rounded-full overflow-hidden">
          </div>
          <input 
            type="range" 
            min={0} 
            max={songDuration}
            value={displayPosition}
            onChange={handleSeek}
            onMouseUp={commitSeek}
            onTouchEnd={commitSeek}
            onMouseLeave={commitSeek}
            className="absolute inset-0 w-full h-full cursor-pointer z-10"
          />
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-8 mb-12 shrink-0">
        {/* Previous is not strictly supported by the simple queue, but we keep the button disabled for layout consistency if needed, or omit it. Omitting it per simplistic design is fine, but we'll add a disabled prev button to anchor the layout. */}
        <button className="p-4 text-text-secondary" onClick={handleModeToggle}>
          {/*<SkipBack className="w-8 h-8" />*/}
          {mode === 'karaoke' ? <Mic2 className="w-8 h-8" /> : <Music2 className="w-8 h-8" />}
        </button>

        <button 
          onClick={handlePlayPause}
          className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/50 text-cyan-500 flex items-center justify-center hover:bg-cyan-500/20 hover:shadow-glow-active transition-all active:scale-95 shadow-[inset_0_0_20px_rgba(24,216,255,0.1)]"
        >
          {status === 'playing' ? (
            <Pause className="w-10 h-10 fill-current" />
          ) : (
            <Play className="w-10 h-10 fill-current translate-x-1" />
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={!q.items}
          className="p-4 text-text-secondary hover:text-text-primary hover:drop-shadow-[0_0_8px_rgba(24,216,255,0.5)] transition-all active:scale-95"
        >
          <SkipForward className="w-8 h-8" />
        </button>
      </div>

      {/* Volume / Stems */}
      <div className="w-full shrink-0 px-2 md:px-0 pb-10">
        <div className={`space-y-4 flex flex-col md:flex-row md:gap-8 w-full`}>
          {mode === 'karaoke' && currentSong?.hasStem ? (
            <>
              <div className={`space-y-2 md:w-[50%]`}>
                <div className="flex justify-between items-center text-xs uppercase font-bold tracking-widest text-cyan-100/50">
                  <span className="flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-cyan-400" />
                    Instrumental
                  </span>
                </div>
                <div className="relative w-full h-2 group cursor-pointer">
                  <div className="absolute inset-0 bg-[#82aadc33] rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                      style={{ width: `${Math.round(instrumentVolume * 100)}%` }}
                    />
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={instrumentVolume}
                    onChange={(e) => updateRemotePlayback(roomId!, { instrumentVolume: parseFloat(e.target.value), positionMs: currentTime*1000 })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                </div>
              </div>

              <div className="space-y-2 w-full md:w-[50%]">
                <div className="flex justify-between items-center text-xs uppercase font-bold tracking-widest text-cyan-100/50">
                  <span className="flex items-center gap-2"><Mic2 className="w-4 h-4 text-purple-400" />Vocal</span>
                </div>
                <div className="relative w-full h-2 group cursor-pointer">
                  <div className="absolute inset-0 bg-[#82aadc33] rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)]" style={{ width: `${Math.round(vocalVolume * 100)}%` }}/>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.01" value={vocalVolume} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => updateRemotePlayback(roomId!, { vocalVolume: parseFloat(e.target.value), positionMs: currentTime*1000 })}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2 w-full">
              <div className="flex justify-between items-center text-xs uppercase font-bold tracking-widest text-cyan-100/50">
                <span className="flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-cyan-400" />
                  Original Volume
                </span>
              </div>
              <div className="relative w-full h-2 group cursor-pointer">
                <div className="absolute inset-0 bg-[#82aadc33] rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                    style={{ width: `${Math.round(instrumentVolume * 100)}%` }}
                  />
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={instrumentVolume}
                  onChange={(e) => updateRemotePlayback(roomId!, { instrumentVolume: parseFloat(e.target.value), positionMs: currentTime*1000 })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
