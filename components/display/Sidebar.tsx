'use client';

import { useUiStore } from '@/stores/uiStore';
import { useQueueStore } from '@/stores/queueStore';
import { useRoomStore } from '@/stores/roomStore';
import { usePlaybackStore } from '@/stores/playbackStore';
import { Search, ChevronRight, Plus, X, Trash2, Volume2, Mic2, Music2, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { libraryApi, Song } from '@/lib/api/library';
import { getCoverUrl } from '@/lib/api/client';

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const { items, fetchQueue } = useQueueStore();
  const { roomId } = useRoomStore();
  const { 
    currentSong, 
    status, 
    mode, 
    songId, 
    instrumentVolume, 
    vocalVolume, 
    setInstrumentVolume, 
    setVocalVolume 
  } = usePlaybackStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'library'>('queue');

  useEffect(() => {
    if (activeTab !== 'library') return;

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (searchQuery.trim().length > 0) {
          const res = await libraryApi.search(searchQuery);
          setSearchResults(res.content);
        } else {
          const res = await libraryApi.getAll();
          setSearchResults(res.content);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab]);

  const handleAddTrack = async (song: Song) => {
    if (!roomId) return;
    try {
      const { roomsApi } = await import('@/lib/api/rooms');
      await roomsApi.addQueueItem(roomId, { 
        songId: song.id,
        title: song.title,
        artist: song.artist
      });
      await fetchQueue(roomId);
      setSearchQuery(''); // clear search after adding
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveTrack = async (queueItemId: string) => {
    if (!roomId) return;
    try {
      const { roomsApi } = await import('@/lib/api/rooms');
      await roomsApi.deleteQueueItem(roomId, queueItemId);
      await fetchQueue(roomId);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlayQueueItem = async (item: any) => {
    if (!roomId) return;
    try {
      const { roomsApi } = await import('@/lib/api/rooms');
      const now = new Date().toISOString();

      if (songId === item.songId) {
        usePlaybackStore.getState().requestSeek(0);
      } else {
        usePlaybackStore.getState().setProgress(0, 0);
        usePlaybackStore.getState().setPlaybackState({
          songId: item.songId,
          status: 'playing',
          positionMs: 0,
          changedAt: now
        });
      }

      await roomsApi.playQueueItem(roomId, item.queueItemId);
      await fetchQueue(roomId);
    } catch (e) {
      console.error('Failed to play queue item', e);
    }
  };

  if (!sidebarOpen) {
    return (
      <div className="absolute top-1/2 -right-2 -translate-y-1/2 z-40">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="bg-cyan-950/20 hover:bg-cyan-900/40 backdrop-blur-md border border-cyan-500/30 p-2 py-8 rounded-l-none text-cyan-500/50 hover:text-cyan-400 transition-all pr-4 cursor-pointer"
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)' }}
          title="Open Queue"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      {sidebarOpen && (
        <div 
          className="absolute inset-0 z-30 bg-[#050510]/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`absolute top-0 right-0 h-full w-96 bg-cyan-950/20 border-l border-cyan-500/30 backdrop-blur-xl z-40 transform transition-transform duration-300 ease-out flex flex-col font-mono ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Decorative corner lines */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 opacity-50"></div>

        {/* Header Tabs */}
        <div className="flex items-center justify-between p-0 border-b border-cyan-500/20">
          <div className="flex">
            <button 
              onClick={() => setActiveTab('queue')}
              className={`p-4 text-sm font-bold tracking-[0.2em] uppercase transition-colors ${activeTab === 'queue' ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)] border-b-2 border-cyan-400' : 'text-cyan-500/50 hover:text-cyan-400/80'}`}
            >
              [ QUEUE ]
            </button>
            <button 
              onClick={() => setActiveTab('library')}
              className={`p-4 text-sm font-bold tracking-[0.2em] uppercase transition-colors ${activeTab === 'library' ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)] border-b-2 border-cyan-400' : 'text-cyan-500/50 hover:text-cyan-400/80'}`}
            >
              [ LIBRARY ]
            </button>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-4 text-cyan-500/70 hover:text-cyan-400 transition-colors cursor-pointer"
            title="Close"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
          {activeTab === 'library' ? (
            <div className="space-y-3">
              <div className="text-xs text-cyan-500/70 font-bold uppercase tracking-widest">
                {searchQuery ? 'RESULTS' : 'LIBRARY'}
              </div>
              {isSearching ? (
                <div className="text-sm text-cyan-100/30 italic px-2">Loading...</div>
              ) : searchResults.length === 0 ? (
                <div className="text-sm text-cyan-100/30 italic px-2">No tracks found</div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map(song => (
                    <div 
                      key={song.id} 
                      className="group relative flex items-center justify-between gap-3 p-2 bg-cyan-950/10 border border-cyan-500/10 hover:border-cyan-500/30 transition-colors"
                      style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
                    >
                      <img 
                        src={getCoverUrl(song.id, song.hasCover)} 
                        alt="cover" 
                        className="w-10 h-10 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate text-white group-hover:text-cyan-200 transition-colors">
                          {song.title}
                        </div>
                        {song.artist && (
                          <div className="text-xs text-cyan-100/50 truncate">
                            {song.artist}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => handleAddTrack(song)}
                        className="p-2 mr-1 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-200 hover:text-white transition-colors cursor-pointer"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%)' }}
                        title="Add to queue"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* CURRENT SECTION */}
              <div>
                <div className="text-xs font-bold tracking-widest text-cyan-500/70 mb-3">CURRENT</div>
                <div className="bg-cyan-950/10 p-4 border border-cyan-500/20 relative"
                     style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/50"></div>
                  {status !== 'stopped' && (currentSong || songId) ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            {songId && (
                              <img 
                                src={getCoverUrl(songId, true)} 
                                alt="cover" 
                                className="w-10 h-10 object-cover"
                                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%)' }}
                                onError={(e) => { e.currentTarget.src = '/default-cover.jpg'; }}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-cyan-300 truncate drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]">
                                {currentSong?.title || "Loading track..."}
                              </div>
                              <div className="text-xs text-cyan-100/60 truncate mt-1">
                                {currentSong?.artist || "Singularity"}
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border shrink-0 ${
                          status === 'playing' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400/70">
                          MODE: {mode}
                        </span>
                      </div>

                      {/* Volume Sliders */}
                      <div className="pt-2 border-t border-cyan-500/20 space-y-3">
                        {mode === 'karaoke' ? (
                          <>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-cyan-100/50">
                                <span className="flex items-center gap-1">
                                  <Music2 className="w-3 h-3 text-cyan-400" />
                                  INST
                                </span>
                                <span className="text-cyan-400/70">{Math.round(instrumentVolume * 100)}%</span>
                              </div>
                              <input 
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={instrumentVolume}
                                onChange={(e) => setInstrumentVolume(parseFloat(e.target.value))}
                                className="w-full h-1 bg-cyan-950/50 appearance-none cursor-pointer accent-cyan-400"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-cyan-100/50">
                                <span className="flex items-center gap-1">
                                  <Mic2 className="w-3 h-3 text-purple-400" />
                                  VOCAL
                                </span>
                                <span className="text-purple-400/70">{Math.round(vocalVolume * 100)}%</span>
                              </div>
                              <input 
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={vocalVolume}
                                onChange={(e) => setVocalVolume(parseFloat(e.target.value))}
                                className="w-full h-1 bg-cyan-950/50 appearance-none cursor-pointer accent-purple-400"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-cyan-100/50">
                              <span className="flex items-center gap-1">
                                <Volume2 className="w-3 h-3 text-cyan-400" />
                                VOL
                              </span>
                              <span className="text-cyan-400/70">{Math.round(instrumentVolume * 100)}%</span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={instrumentVolume}
                              onChange={(e) => setInstrumentVolume(parseFloat(e.target.value))}
                              className="w-full h-1 bg-cyan-950/50 appearance-none cursor-pointer accent-cyan-400"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-cyan-100/30">NO TRACK LOADED</div>
                  )}
                </div>
              </div>

              {/* UP NEXT SECTION */}
              <div>
                <div className="text-xs font-bold tracking-widest text-cyan-500/70 mb-3">UP NEXT</div>
                {items.length === 0 ? (
                  <div className="text-sm text-cyan-100/30 italic px-2">Queue empty</div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div 
                        key={item.queueItemId} 
                        onClick={() => handlePlayQueueItem(item)}
                        className="group relative flex items-center justify-between gap-3 p-3 bg-cyan-950/10 border border-cyan-500/10 hover:border-cyan-400/40 transition-colors cursor-pointer"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
                        title="Play now"
                      >
                        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                          <span className="text-xs text-cyan-500/50 font-bold group-hover:hidden">{idx + 1}</span>
                          <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 hidden group-hover:block ml-0.5" />
                        </div>
                        <img 
                          src={getCoverUrl(item.songId, true)} 
                          alt="cover" 
                          className="w-8 h-8 object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                          style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%)' }}
                          onError={(e) => { e.currentTarget.src = '/default-cover.jpg'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-white group-hover:text-cyan-200 transition-colors">
                            {item.title || item.songId}
                          </div>
                          {item.artist && (
                            <div className="text-xs text-cyan-100/50 truncate">
                              {item.artist}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTrack(item.queueItemId);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-cyan-500/40 hover:text-red-400 hover:bg-red-900/20 transition-all cursor-pointer"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Search Input Bar (only shown in Library tab) */}
      {activeTab === 'library' && (
        <div className="p-4 border-t border-cyan-500/20 bg-cyan-950/30 backdrop-blur-md relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/50"></div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
            <input 
              type="text" 
              placeholder="SEARCH LIBRARY..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-cyan-950/20 border border-cyan-500/30 py-3 pl-10 pr-4 text-sm text-cyan-100 focus:outline-none focus:border-cyan-400 focus:bg-cyan-900/40 transition-all placeholder:text-cyan-500/40 font-mono"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
            />
          </div>
        </div>
      )}
    </div>
    </>
  );
}
