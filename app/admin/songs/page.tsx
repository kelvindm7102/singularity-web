"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2, Image as ImageIcon, FileAudio, FileVideo, Mic2, FileText } from "lucide-react";
import { songsApi } from "@/lib/api/songs";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SongsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialQuery = searchParams.get("q") || "";
  const initialPage = parseInt(searchParams.get("page") || "0", 10);
  
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput);
      if (searchInput !== initialQuery) {
        setPage(0); // Reset page on new search
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, initialQuery]);

  // Update URL state
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (page > 0) params.set("page", page.toString());
    
    const newUrl = `/admin/songs${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(newUrl, { scroll: false });
  }, [debouncedQuery, page, router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["songs", { q: debouncedQuery, page }],
    queryFn: () => 
      debouncedQuery 
        ? songsApi.search(debouncedQuery, { page, size: 50 })
        : songsApi.list({ page, size: 50 }),
  });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full flex flex-col h-full">
      <header className="mb-8 flex items-end justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-display uppercase tracking-wider text-[#F2F7FF] mb-2 flex items-center gap-3">
            <div className="w-2 h-6 bg-[#18D8FF] shadow-[0_0_12px_rgba(24,216,255,0.4)]" />
            Song Library
          </h1>
          <p className="text-[#A9B7CC] font-mono text-sm">
            {data?.page?.totalElements !== undefined ? `${data.page.totalElements} SONGS` : data?.totalElements !== undefined ? `${data.totalElements} SONGS` : "LOADING..."}
          </p>
        </div>
        <Button onClick={() => router.push("/admin/imports")}>
          Import SPK
        </Button>
      </header>

      <div className="mb-6 flex gap-4 shrink-0">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] group-focus-within:text-[#18D8FF] transition-colors" />
          <Input 
            placeholder="SEARCH SONGS..." 
            className="pl-10 uppercase"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0 border border-[#82aadc33] bg-[#080E1C]/60">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-[#080E1C] z-10 border-b border-[#82aadc33] shadow-sm shadow-black/50">
              <TableRow>
                <TableHead className="w-16 text-center">Cover</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Album</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="w-32">Assets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-[#18D8FF] gap-4">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="font-mono text-sm tracking-widest uppercase">Fetching Library...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              
              {!isLoading && isError && (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-red-400 gap-2">
                      <span className="font-mono text-sm tracking-widest uppercase">Library Load Failed</span>
                      <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4 border-red-500/50 text-red-400 hover:bg-red-500/10">Retry</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && data?.content.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-[#A9B7CC] gap-4">
                      <span className="font-mono text-sm tracking-widest uppercase">No Songs Found</span>
                      <p className="text-xs text-[#64748B]">Try another search term or import a new package.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && data?.content.map((song) => (
                <TableRow 
                  key={song.id} 
                  className="cursor-pointer group"
                  onClick={() => router.push(`/admin/songs/${song.id}`)}
                >
                  <TableCell className="p-2 text-center">
                    <div className={`w-10 h-10 bg-[#0B1324] border border-[#82aadc33] mx-auto flex items-center justify-center ${song.hasCover ? 'border-[#18D8FF]/50' : ''}`}>
                      <ImageIcon className={`w-4 h-4 ${song.hasCover ? 'text-[#18D8FF]' : 'text-[#64748B]'}`} />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-[#F2F7FF] group-hover:text-[#18D8FF] transition-colors">{song.title}</TableCell>
                  <TableCell className="text-[#A9B7CC]">{song.artist || "-"}</TableCell>
                  <TableCell className="text-[#A9B7CC]">{song.album || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{formatDuration(song.duration)}</TableCell>
                  <TableCell className="font-mono text-xs text-[#64748B]">{song.year || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span title="Audio" className={song.hasAudio ? "text-[#18D8FF]" : "text-[#64748B]"}><FileAudio className="w-3.5 h-3.5" /></span>
                      <span title="Video" className={song.hasVideo ? "text-[#18D8FF]" : "text-[#64748B]"}><FileVideo className="w-3.5 h-3.5" /></span>
                      <span title="Stems" className={song.hasStem ? "text-[#18D8FF]" : "text-[#64748B]"}><Mic2 className="w-3.5 h-3.5" /></span>
                      <span title="Lyrics" className={song.hasLyric ? "text-[#18D8FF]" : "text-[#64748B]"}><FileText className="w-3.5 h-3.5" /></span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      {!isLoading && !isError && data && (data.page?.totalPages ?? data.totalPages ?? 0) > 1 && (
        <div className="mt-4 flex items-center justify-between shrink-0 border-t border-[#82aadc33] pt-4">
          <div className="text-xs font-mono text-[#64748B]">
            PAGE {(data.page?.number ?? data.number ?? 0) + 1} OF {data.page?.totalPages ?? data.totalPages ?? 1}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              PREV
            </Button>
            <Button 
              variant="secondary" 
              disabled={page >= ((data.page?.totalPages ?? data.totalPages ?? 1) - 1)}
              onClick={() => setPage(p => p + 1)}
            >
              NEXT
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SongsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center h-full text-[#18D8FF]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <SongsContent />
    </Suspense>
  );
}
