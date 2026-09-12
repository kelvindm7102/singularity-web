'use client';

import { useEffect, useState } from 'react';
import { useRoomStore } from '@/stores/roomStore';
import { usePlaybackStore } from '@/stores/playbackStore';
import { useQueueStore } from '@/stores/queueStore';
import { wsService } from '@/lib/api/websocket';
import { roomsApi } from '@/lib/api/rooms';
import { KeyRound, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export function ControlRoomManager() {
  const { joinControlRoom, roomId, connectionStatus, lastError } = useRoomStore();
  const [inputCode, setInputCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Join room on mount via URL param ?room=... or saved localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    joinControlRoom(roomParam || undefined);
  }, [joinControlRoom]);

  // 2. Synchronize initial state and WebSocket events when connected
  useEffect(() => {
    if (connectionStatus === 'connected' && roomId) {
      // REST: Fetch initial playback & queue (§3, §10)
      roomsApi.getPlayback(roomId).then((pb) => {
        usePlaybackStore.getState().setPlaybackState(pb);
      }).catch(console.error);

      useQueueStore.getState().fetchQueue(roomId);

      // WebSocket: Listen for real-time room events (§4, §9)
      return wsService.subscribeToRoomEvents((event) => {
        if (event.type === 'PLAYBACK_UPDATED') {
          usePlaybackStore.getState().setPlaybackState(event.payload);
        } else if (event.type === 'QUEUE_UPDATED') {
          if (Array.isArray(event.payload)) {
            useQueueStore.getState().setQueue(event.payload);
          } else {
            useQueueStore.getState().fetchQueue(roomId);
          }
        }
      });
    }
  }, [connectionStatus, roomId]);

  const handleManualJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setSubmitting(true);
    await joinControlRoom(inputCode.trim());
    setSubmitting(false);
  };

  // If disconnected or error, prompt user with sleek glassmorphism join modal
  if (connectionStatus === 'disconnected' || (connectionStatus === 'error' && !roomId)) {
    return (
      <div className="fixed inset-0 z-50 bg-[#050914]/95 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#080E1C] border border-[#18D8FF]/30 shadow-[0_0_50px_rgba(24,216,255,0.15)] text-[#F2F7FF]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#18D8FF]/10 rounded-xl border border-[#18D8FF]/30 text-[#18D8FF]">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display uppercase tracking-widest text-[#F2F7FF]">
                Link Control Unit
              </h2>
              <p className="text-xs text-[#A9B7CC] font-mono tracking-wider">
                Enter 6-character room access code
              </p>
            </div>
          </div>

          <form onSubmit={handleManualJoin} className="space-y-4">
            <div>
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="e.g. 1923E5"
                autoFocus
                className="w-full bg-[#18D8FF]/5 border border-[#18D8FF]/30 rounded-xl py-4 px-4 text-center font-mono text-2xl tracking-[0.3em] uppercase text-[#F2F7FF] placeholder-[#A9B7CC]/40 focus:outline-none focus:border-[#18D8FF] focus:shadow-[0_0_20px_rgba(24,216,255,0.3)] transition-all"
              />
            </div>

            {lastError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-body">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lastError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || inputCode.length < 3}
              className="w-full py-4 rounded-xl bg-[#18D8FF] text-[#050914] font-display uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-[#18D8FF]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(24,216,255,0.4)]"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Connect to Display</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
