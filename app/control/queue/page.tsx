'use client';

import { useEffect } from 'react';
import { useRoomStore } from '@/stores/roomStore';
import { useQueueStore } from '@/stores/queueStore';
import { usePlaybackStore } from '@/stores/playbackStore';
import { getCoverUrl } from '@/lib/api/client';
import { Play, Loader2, Music, Trash2 } from 'lucide-react';
import { roomsApi } from '@/lib/api/rooms';

export default function ControlQueuePage() {
  const { roomId } = useRoomStore();
  const { items: queueItems, fetchQueue } = useQueueStore();
  const { currentSong } = usePlaybackStore();

  useEffect(() => {
    if (roomId) {
      fetchQueue(roomId);
    }
  }, [roomId, fetchQueue]);

  const handlePlayNow = async (queueItemId: string) => {
    if (!roomId) return;
    try {
      await roomsApi.playQueueItem(roomId, queueItemId);
    } catch (e) {
      console.error('Failed to play queue item', e);
    }
  };

  const handleRemove = async (e: React.MouseEvent, queueItemId: string) => {
    e.stopPropagation();
    if (!roomId) return;
    try {
      await roomsApi.deleteQueueItem(roomId, queueItemId);
    } catch (e) {
      console.error('Failed to remove queue item', e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050914] text-[#F2F7FF]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#050914]/90 backdrop-blur-md p-4 md:p-6 border-b border-[#18D8FF]/20">
        <h1 className="text-xl font-display uppercase tracking-widest text-center text-[#F2F7FF]">
          Queue
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto pb-24 md:pb-8">
          
          {/* Now Playing Section */}
          <div className="mb-8">
            <h2 className="text-xs font-mono tracking-widest text-[#18D8FF] uppercase mb-4 pl-2">Now Playing</h2>
            {currentSong ? (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[#18D8FF]/5 border border-[#18D8FF]/30 shadow-[inset_0_0_15px_rgba(24,216,255,0.05)]">
                <div className="w-14 h-14 bg-black/40 rounded-lg overflow-hidden shrink-0 border border-[#18D8FF]/50 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={getCoverUrl(currentSong.id, currentSong.hasCover)} 
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#18D8FF]/20 flex items-center justify-center backdrop-blur-[2px]">
                     <div className="flex gap-1">
                        <div className="w-1 h-3 bg-[#18D8FF] animate-[pulse_1s_ease-in-out_infinite]" />
                        <div className="w-1 h-4 bg-[#18D8FF] animate-[pulse_1.2s_ease-in-out_infinite]" />
                        <div className="w-1 h-2 bg-[#18D8FF] animate-[pulse_0.8s_ease-in-out_infinite]" />
                     </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-display tracking-wide truncate text-[#18D8FF] drop-shadow-[0_0_5px_rgba(24,216,255,0.5)]">
                    {currentSong.title}
                  </h3>
                  <p className="text-sm font-body text-[#A9B7CC] truncate">
                    {currentSong.artist}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#82aadc33] bg-[#82aadc11] text-[#A9B7CC] font-body text-center text-sm">
                No song currently playing.
              </div>
            )}
          </div>

          {/* Up Next Section */}
          <div>
            <h2 className="text-xs font-mono tracking-widest text-[#A9B7CC] uppercase mb-4 pl-2">Up Next</h2>
            
            {!queueItems ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#18D8FF]" />
              </div>
            ) : queueItems.length === 0 ? (
              <div className="text-center p-12 text-[#A9B7CC] border border-dashed border-[#82aadc33] rounded-xl flex flex-col items-center justify-center gap-4">
                <Music className="w-8 h-8 opacity-50" />
                <span className="font-body">The queue is empty.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {queueItems.map((item, index) => (
                  <div 
                    key={item.queueItemId} 
                    onClick={() => handlePlayNow(item.queueItemId)}
                    className="group flex items-center gap-3 md:gap-4 p-2.5 md:p-3 rounded-xl hover:bg-[#82aadc11] transition-colors border border-transparent hover:border-[#82aadc33] cursor-pointer"
                  >
                    <div className="w-6 text-center text-[#A9B7CC] font-mono text-xs opacity-50 shrink-0">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>

                    {/* Artwork (§28) */}
                    <div className="w-12 h-12 bg-black/40 rounded-lg overflow-hidden shrink-0 border border-[#82aadc33]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={getCoverUrl(item.songId, true)} 
                        alt={item.title || 'Track'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm md:text-base font-display tracking-wide truncate text-[#F2F7FF] group-hover:text-[#18D8FF] transition-colors">
                        {item.title || item.songId}
                      </h3>
                      <p className="text-xs md:text-sm font-body text-[#A9B7CC] truncate">
                        {item.artist || 'Unknown Artist'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayNow(item.queueItemId);
                        }}
                        className="shrink-0 p-2.5 text-[#18D8FF] bg-[#18D8FF]/10 rounded-full hover:bg-[#18D8FF]/20 transition-colors"
                        title="Play Now"
                        aria-label="Play Now"
                      >
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      </button>

                      <button
                        onClick={(e) => handleRemove(e, item.queueItemId)}
                        className="shrink-0 p-2.5 text-[#A9B7CC] hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors opacity-70 group-hover:opacity-100"
                        title="Remove from queue"
                        aria-label="Remove from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
