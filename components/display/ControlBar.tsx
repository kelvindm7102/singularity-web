'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { usePlaybackStore } from '@/stores/playbackStore';
import { useRoomStore } from '@/stores/roomStore';
import { useQueueStore } from '@/stores/queueStore';
import { roomsApi } from '@/lib/api/rooms';
import { getCoverUrl } from '@/lib/api/client';
import { QrCode, Play, Pause, SkipForward, Mic2, Music2, Volume2, VolumeX, FileText, ChevronDown } from 'lucide-react';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function ControlBar() {
  const { controlsVisible, setConnectOverlayOpen } = useUiStore();
  const { 
    status, 
    mode, 
    songId, 
    currentSong, 
    currentTime, 
    duration, 
    requestSeek,
    instrumentVolume,
    vocalVolume,
    setInstrumentVolume,
    setVocalVolume,
    availableLyrics,
    activeLyricId,
    setActiveLyric,
  } = usePlaybackStore();
  
  const roomId = useRoomStore(state => state.roomId);
  const fetchQueue = useQueueStore(state => state.fetchQueue);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [isLyricOpen, setIsLyricOpen] = useState(false);
  const prevInstrumentVolRef = useRef<number>(instrumentVolume || 0.8);
  const lyricPopoverRef = useRef<HTMLDivElement>(null);

  // Close volume popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsVolumeOpen(false);
      }
    };
    if (isVolumeOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVolumeOpen]);

  // Close lyric dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (lyricPopoverRef.current && !lyricPopoverRef.current.contains(e.target as Node)) {
        setIsLyricOpen(false);
      }
    };
    if (isLyricOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLyricOpen]);

  if (!controlsVisible) return null;

  const togglePlay = async () => {
    if (!roomId || !songId) return;
    const newState = {
      songId,
      status: status === 'playing' ? 'paused' : 'playing',
      mode,
      positionMs: Math.round(currentTime * 1000),
      changedAt: new Date().toISOString()
    } as any;
    await roomsApi.updatePlayback(roomId, newState);
    usePlaybackStore.getState().setPlaybackState(newState);
  };

  const toggleMode = () => {
    if (!roomId) return;
    const newState = {
      songId,
      status,
      mode: mode === 'karaoke' ? 'original' : 'karaoke',
      positionMs: Math.round(currentTime * 1000),
      changedAt: new Date().toISOString()
    } as any;
    roomsApi.updatePlayback(roomId, newState);
    usePlaybackStore.getState().setPlaybackState(newState);
  };

  const handleSkip = async () => {
    if (!roomId) return;
    try {
      await roomsApi.reportPlaybackEnded(roomId);
      // Let websocket sync handle the rest
    } catch (e) {
      console.error('Failed to skip track', e);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || duration <= 0 || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = percentage * duration;
    requestSeek(targetSeconds);
  };

  const toggleMute = () => {
    if (instrumentVolume > 0) {
      prevInstrumentVolRef.current = instrumentVolume;
      setInstrumentVolume(0);
    } else {
      setInstrumentVolume(prevInstrumentVolRef.current || 0.8);
    }
  };

  const progressPercent = duration > 0 
    ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) 
    : 0;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-40 w-full max-w-4xl px-8 animate-in slide-in-from-bottom-8 fade-in duration-300 font-mono">
      {/* Progress Bar */}
      <div 
        ref={progressBarRef}
        onClick={handleSeek}
        className="w-full h-2 bg-cyan-950/40 border border-cyan-500/20 cursor-pointer relative group"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 2px), calc(100% - 2px) 100%, 0 100%)' }}
      >
        <div className="absolute left-0 top-0 bottom-0 bg-cyan-900/50" style={{ width: `${progressPercent}%` }} />
        <div 
          className="absolute left-0 top-0 bottom-0 bg-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all ease-linear" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>

      <div className="w-full flex justify-between text-[10px] uppercase font-bold tracking-widest text-cyan-500/70 px-1 -mt-2">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Main Controls Panel */}
      <div className="w-full p-4 flex items-center justify-between relative">
        {/* Background Layer with clip-path */}
        <div 
          className="absolute inset-0 bg-cyan-950/20 backdrop-blur-md border border-cyan-500/30 -z-10"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
        ></div>
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400/50"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400/50"></div>

        {/* Left: Room & Status */}
        <div className="flex flex-col gap-2 w-1/4">
          <button 
            onClick={() => setConnectOverlayOpen(true)}
            className="flex items-center justify-center w-fit gap-2 p-2 px-3 bg-cyan-900/20 hover:bg-cyan-800/40 text-cyan-400 border border-cyan-500/30 transition-all group"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
            title="Show Room Code"
          >
            <QrCode className="w-4 h-4" />
            <span className="font-bold tracking-widest text-xs uppercase">{roomId}</span>
          </button>
          
          <div className="flex items-center gap-3">
            {songId && (
              <img 
                src={getCoverUrl(songId, true)} 
                alt="cover" 
                className="w-12 h-12 object-cover border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
                onError={(e) => { e.currentTarget.src = '/default-cover.jpg'; }}
              />
            )}
            <div className="min-w-0">
              <div className="text-lg font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] truncate max-w-[200px]">
                {currentSong?.title || "Singularity"}
              </div>
              <div className="text-sm font-medium text-cyan-100/60 uppercase tracking-widest truncate max-w-[200px]">
                {currentSong?.artist || "No track loaded"}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Playback */}
        <div className="flex items-center justify-center gap-6 w-2/4">
          <button 
            onClick={toggleMode}
            className={`p-2 border transition-all cursor-pointer ${
              mode === 'karaoke' 
                ? 'bg-purple-900/20 border-purple-500/50 text-purple-400' 
                : 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400/70 hover:text-cyan-400'
            }`}
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
            title={`Mode: ${mode === 'karaoke' ? 'Karaoke' : 'Original'}`}
          >
            {mode === 'karaoke' ? <Mic2 className="w-5 h-5" /> : <Music2 className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={togglePlay}
            disabled={!songId}
            className="w-14 h-14 flex items-center justify-center bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/50 text-cyan-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
          >
            {status === 'playing' ? <Pause className="w-6 h-6 fill-cyan-400" /> : <Play className="w-6 h-6 fill-cyan-400 ml-1" />}
          </button>

          <button 
            onClick={handleSkip}
            disabled={!songId}
            className="p-2 bg-transparent hover:bg-cyan-900/20 border border-transparent hover:border-cyan-500/30 text-cyan-500/70 hover:text-cyan-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
            title="Skip Track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-3 w-1/4 relative" ref={popoverRef}>
          {/* Lyric Dropdown */}
          <div className="relative" ref={lyricPopoverRef}>
            <button 
              onClick={() => {
                setIsLyricOpen(!isLyricOpen);
                if (!isLyricOpen) setIsVolumeOpen(false);
              }}
              className={`p-2 flex items-center gap-1 border transition-all cursor-pointer ${
                isLyricOpen || availableLyrics.length > 0
                  ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400' 
                  : 'bg-transparent border-transparent text-cyan-500/30'
              }`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
              title="Select Lyrics"
              disabled={availableLyrics.length === 0}
            >
              <FileText className="w-5 h-5" />
              {availableLyrics.length > 0 && <ChevronDown className="w-3 h-3" />}
            </button>

            {isLyricOpen && availableLyrics.length > 0 && (
              <div 
                className="absolute bottom-full right-0 mb-4 w-64 bg-[#050510]/95 border border-cyan-500/30 backdrop-blur-xl p-2 z-50 flex flex-col gap-1"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
              >
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/50"></div>
                <div className="px-3 py-2 text-xs font-bold tracking-widest text-cyan-500/50 uppercase border-b border-cyan-500/10 mb-1">
                  LYRIC SOURCE
                </div>
                {availableLyrics.map(lyric => (
                  <button
                    key={lyric.id}
                    onClick={() => {
                      setActiveLyric(lyric.id);
                      setIsLyricOpen(false);
                    }}
                    className={`text-left px-3 py-2 transition-colors flex items-center justify-between ${
                      activeLyricId === lyric.id
                        ? 'bg-cyan-400/20 text-cyan-400 border-l-2 border-cyan-400'
                        : 'text-cyan-100/70 hover:bg-cyan-900/30 hover:text-cyan-100'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm truncate font-bold">{lyric.provider}</span>
                      <span className="text-[10px] uppercase text-cyan-500/50">{lyric.format}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume Dropdown */}
          <button 
            onClick={() => {
              setIsVolumeOpen(!isVolumeOpen);
              if (!isVolumeOpen) setIsLyricOpen(false);
            }}
            className={`p-2 border transition-all ${
              isVolumeOpen || instrumentVolume === 0 
                ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400' 
                : 'bg-transparent border-transparent text-cyan-500/70 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-900/20'
            }`}
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
            title="Volume"
          >
            {instrumentVolume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {isVolumeOpen && (
            <div 
              className="absolute bottom-full right-0 mb-4 w-64 bg-[#050510]/95 border border-cyan-500/30 backdrop-blur-xl p-4 z-50 flex flex-col gap-4"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
            >
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/50"></div>
              {mode === 'karaoke' ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold tracking-widest text-cyan-100/70 uppercase">
                      <span className="flex items-center gap-2">
                        <Music2 className="w-3.5 h-3.5 text-cyan-400" />
                        INST
                      </span>
                      <span className="text-cyan-400">{Math.round(instrumentVolume * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.01"
                      value={instrumentVolume}
                      onChange={(e) => setInstrumentVolume(parseFloat(e.target.value))}
                      className="w-full h-1 bg-cyan-950/50 appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold tracking-widest text-cyan-100/70 uppercase">
                      <span className="flex items-center gap-2">
                        <Mic2 className="w-3.5 h-3.5 text-purple-400" />
                        VOCAL
                      </span>
                      <span className="text-purple-400">{Math.round(vocalVolume * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.01"
                      value={vocalVolume}
                      onChange={(e) => setVocalVolume(parseFloat(e.target.value))}
                      className="w-full h-1 bg-purple-950/50 appearance-none cursor-pointer accent-purple-400"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold tracking-widest text-cyan-100/70 uppercase">
                    <span className="flex items-center gap-2">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      VOL
                    </span>
                    <span className="text-cyan-400">{Math.round(instrumentVolume * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01"
                    value={instrumentVolume}
                    onChange={(e) => setInstrumentVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-cyan-950/50 appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
