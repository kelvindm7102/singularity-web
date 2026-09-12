'use client';

import { useState, useEffect } from 'react';
import { useRoomStore } from '@/stores/roomStore';
import { libraryApi, Song } from '@/lib/api/library';
import { roomsApi } from '@/lib/api/rooms';
import { getCoverUrl } from '@/lib/api/client';
import { Search, Plus, Check, Loader2 } from 'lucide-react';

export default function ControlLibraryPage() {
  const { roomId } = useRoomStore();
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const fetchSongs = async (searchQuery: string = '') => {
    setLoading(true);
    try {
      if (searchQuery.trim()) {
        const res = await libraryApi.search(searchQuery);
        setSongs(res.content);
      } else {
        const res = await libraryApi.getAll();
        setSongs(res.content);
      }
    } catch (error) {
      console.error('Failed to fetch songs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) {
      fetchSongs('');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSongs(query);
  };

  const handleAddToQueue = async (song: Song) => {
    if (!roomId) return;
    try {
      await roomsApi.addQueueItem(roomId, {
        songId: song.id,
        title: song.title,
        artist: song.artist,
      });
      setAddedIds(prev => ({ ...prev, [song.id]: true }));
      setTimeout(() => {
        setAddedIds(prev => ({ ...prev, [song.id]: false }));
      }, 1500);
    } catch (e) {
      console.error('Failed to add to queue', e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050914] text-[#F2F7FF]">
      {/* Sticky Header with Search */}
      <div className="sticky top-0 z-20 bg-[#050914]/90 backdrop-blur-md p-4 md:p-6 border-b border-[#18D8FF]/20">
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder="Search songs, artists..."
            className="w-full bg-[#82aadc11] border border-[#82aadc33] rounded-xl py-3 pl-12 pr-4 text-[#F2F7FF] placeholder-[#A9B7CC] focus:outline-none focus:border-[#18D8FF]/50 focus:shadow-[0_0_15px_rgba(24,216,255,0.1)] transition-all font-body text-lg"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A9B7CC] w-5 h-5" />
          <button type="submit" className="hidden" />
        </form>
      </div>

      {/* Song List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-2 pb-24 md:pb-8">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#18D8FF]" />
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center p-12 text-[#A9B7CC] font-body">
              No songs found.
            </div>
          ) : (
            songs.map((song) => (
              <div 
                key={song.id} 
                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-[#82aadc11] transition-colors border border-transparent hover:border-[#82aadc33]"
              >
                {/* Artwork */}
                <div className="w-14 h-14 bg-black/40 rounded-lg overflow-hidden shrink-0 border border-[#82aadc33]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={getCoverUrl(song.id, song.hasCover)} 
                    alt={song.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-display tracking-wide truncate text-[#F2F7FF]">
                    {song.title}
                  </h3>
                  <p className="text-sm font-body text-[#A9B7CC] truncate">
                    {song.artist}
                  </p>
                </div>
                
                {/* Add Button */}
                <button
                  onClick={() => handleAddToQueue(song)}
                  className={`shrink-0 p-3 rounded-full transition-all opacity-90 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 ${
                    addedIds[song.id] 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 md:opacity-100' 
                      : 'text-[#18D8FF] bg-[#18D8FF]/10 hover:bg-[#18D8FF]/20'
                  }`}
                  aria-label="Add to Queue"
                >
                  {addedIds[song.id] ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
