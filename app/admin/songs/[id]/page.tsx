"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Trash2, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Mic2, 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Maximize2,
  ChevronUp,
  ChevronDown,
  Star
} from "lucide-react";

import { songsApi } from "@/lib/api/songs";
import { resolveApiBase } from "@/lib/api/client";
import { LyricManifest, LyricData } from "@/types/song";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";

const songSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().optional(),
  album: z.string().optional(),
  genre: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional().transform(v => v === "" || v === undefined ? undefined : Number(v)),
});

type SongFormInput = z.input<typeof songSchema>;
type SongFormOutput = z.infer<typeof songSchema>;

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimeMs(ms: number) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor(ms % 1000);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
}

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const songId = params.id as string;

  const [assetVersion, setAssetVersion] = useState(Date.now());
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dialog states
  const [isSongDeleteDialogOpen, setIsSongDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<{ type: 'cover' | 'video' | 'audio' | 'stem'; label: string } | null>(null);
  const [lyricToDelete, setLyricToDelete] = useState<LyricManifest | null>(null);
  const [selectedLyricId, setSelectedLyricId] = useState<string | null>(null);
  const [isCoverLightboxOpen, setIsCoverLightboxOpen] = useState(false);

  // Active preview tab
  const [activeMediaTab, setActiveMediaTab] = useState<'audio' | 'stem' | 'video' | 'cover'>('audio');

  // Hidden file input refs
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const stemInputRef = useRef<HTMLInputElement>(null);
  const lyricInputRef = useRef<HTMLInputElement>(null);

  const apiBase = resolveApiBase();

  // Queries
  const { data: song, isLoading, isError } = useQuery({
    queryKey: ["song", songId],
    queryFn: () => songsApi.get(songId),
  });

  const { data: lyrics } = useQuery({
    queryKey: ["song", songId, "lyrics"],
    queryFn: () => songsApi.getLyrics(songId),
    enabled: !!song,
  });

  const { data: lyricContent, isLoading: isLoadingLyricContent } = useQuery<LyricData>({
    queryKey: ["lyric", selectedLyricId],
    queryFn: () => songsApi.getLyricContent(selectedLyricId!),
    enabled: !!selectedLyricId,
  });

  // Form setup
  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<SongFormInput>({
    resolver: zodResolver(songSchema),
    values: {
      title: song?.title || "",
      artist: song?.artist || "",
      album: song?.album || "",
      genre: song?.genre || "",
      year: song?.year || "",
    },
  });

  // Mutations
  const updateMetadataMutation = useMutation({
    mutationFn: (data: FormData) => songsApi.update(songId, data),
    onSuccess: (updatedSong) => {
      queryClient.invalidateQueries({ queryKey: ["song", songId] });
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      reset({
        title: updatedSong.title,
        artist: updatedSong.artist || "",
        album: updatedSong.album || "",
        genre: updatedSong.genre || "",
        year: updatedSong.year || "",
      });
      setNotification({ type: 'success', message: 'Song metadata updated successfully.' });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (error: any) => {
      setNotification({ type: 'error', message: error.message || 'Failed to update metadata.' });
    }
  });

  const uploadAssetMutation = useMutation({
    mutationFn: async ({ type, file }: { type: 'cover' | 'video' | 'audio' | 'stem' | 'lyric'; file: File }) => {
      return songsApi.uploadAsset(songId, type, file);
    },
    onSuccess: (_res, variables) => {
      setAssetVersion(Date.now());
      queryClient.invalidateQueries({ queryKey: ["song", songId] });
      queryClient.invalidateQueries({ queryKey: ["song", songId, "lyrics"] });
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      setNotification({ 
        type: 'success', 
        message: `${variables.type.toUpperCase()} file uploaded and updated successfully.` 
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (error: any) => {
      setNotification({ type: 'error', message: error.message || 'Failed to upload file.' });
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (type: 'cover' | 'video' | 'audio' | 'stem') => {
      return songsApi.deleteAsset(songId, type);
    },
    onSuccess: (_res, type) => {
      setAssetVersion(Date.now());
      setAssetToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["song", songId] });
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      setNotification({ 
        type: 'success', 
        message: `${type.toUpperCase()} asset deleted successfully.` 
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (error: any) => {
      setAssetToDelete(null);
      setNotification({ type: 'error', message: error.message || 'Failed to delete asset.' });
    }
  });

  const deleteLyricMutation = useMutation({
    mutationFn: async (lyricId: string) => {
      return songsApi.deleteLyric(lyricId);
    },
    onSuccess: () => {
      setLyricToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["song", songId, "lyrics"] });
      queryClient.invalidateQueries({ queryKey: ["song", songId] });
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      setNotification({ 
        type: 'success', 
        message: 'Lyric file removed successfully.' 
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (error: any) => {
      setLyricToDelete(null);
      setNotification({ type: 'error', message: error.message || 'Failed to delete lyric file.' });
    }
  });

  const deleteSongMutation = useMutation({
    mutationFn: () => songsApi.delete(songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      router.push("/admin/songs");
    },
  });

  const reorderLyricsMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      return songsApi.reorderLyrics(songId, orderedIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["song", songId, "lyrics"] });
      queryClient.invalidateQueries({ queryKey: ["song", songId] });
      setNotification({ 
        type: 'success', 
        message: 'Lyric priority reordered successfully.' 
      });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ["song", songId, "lyrics"] });
      setNotification({ 
        type: 'error', 
        message: error.message || 'Failed to update lyric priority.' 
      });
    }
  });

  const handleMoveLyric = (index: number, direction: 'up' | 'down') => {
    if (!lyrics || lyrics.length < 2) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lyrics.length) return;

    const newLyrics = [...lyrics];
    const temp = newLyrics[index];
    newLyrics[index] = newLyrics[targetIndex];
    newLyrics[targetIndex] = temp;

    // Optimistically update query cache
    queryClient.setQueryData(["song", songId, "lyrics"], newLyrics);

    const orderedIds = newLyrics.map(l => l.id);
    reorderLyricsMutation.mutate(orderedIds);
  };

  const handleMakeTopLyric = (index: number) => {
    if (!lyrics || index === 0) return;
    const newLyrics = [...lyrics];
    const [selected] = newLyrics.splice(index, 1);
    newLyrics.unshift(selected);

    // Optimistically update query cache
    queryClient.setQueryData(["song", songId, "lyrics"], newLyrics);

    const orderedIds = newLyrics.map(l => l.id);
    reorderLyricsMutation.mutate(orderedIds);
  };

  const onSubmit = (values: any) => {
    const parsedValues = values as SongFormOutput;
    const formData = new FormData();
    formData.append("title", parsedValues.title);
    if (parsedValues.artist) formData.append("artist", parsedValues.artist);
    if (parsedValues.album) formData.append("album", parsedValues.album);
    if (parsedValues.genre) formData.append("genre", parsedValues.genre);
    if (parsedValues.year) formData.append("year", parsedValues.year.toString());
    
    updateMetadataMutation.mutate(formData);
  };

  const handleFileChange = (type: 'cover' | 'video' | 'audio' | 'stem' | 'lyric', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAssetMutation.mutate({ type, file });
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full text-[#18D8FF]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isError || !song) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="border border-[#82aadc33] bg-[#080E1C]/60 p-8 text-center text-red-400">
          <h2 className="text-xl font-display mb-4">Song Not Found</h2>
          <p className="font-mono text-sm mb-6">This song may have been deleted or is no longer available.</p>
          <Button variant="secondary" onClick={() => router.push("/admin/songs")}>Back to Library</Button>
        </div>
      </div>
    );
  }

  const coverUrl = `${apiBase}/api/assets/cover/${songId}?v=${assetVersion}`;
  const audioUrl = `${apiBase}/api/assets/audio/${songId}?v=${assetVersion}`;
  const videoUrl = `${apiBase}/api/assets/video/${songId}?v=${assetVersion}`;
  const stemUrl = `${apiBase}/api/assets/stem/${songId}?v=${assetVersion}`;

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Hidden File Inputs for CRUD Operations */}
      <input 
        type="file" 
        ref={coverInputRef} 
        onChange={(e) => handleFileChange('cover', e)} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={audioInputRef} 
        onChange={(e) => handleFileChange('audio', e)} 
        accept="audio/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={videoInputRef} 
        onChange={(e) => handleFileChange('video', e)} 
        accept="video/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={stemInputRef} 
        onChange={(e) => handleFileChange('stem', e)} 
        accept="audio/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={lyricInputRef} 
        onChange={(e) => handleFileChange('lyric', e)} 
        accept=".lrc,.json,.txt" 
        className="hidden" 
      />

      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/admin/songs")}
          className="pl-0 hover:bg-transparent text-[#A9B7CC] hover:text-[#18D8FF]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Button>

        {uploadAssetMutation.isPending && (
          <div className="flex items-center gap-2 text-xs font-mono text-[#18D8FF] bg-[#18D8FF]/10 px-3 py-1.5 border border-[#18D8FF]/30 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            UPLOADING ASSET...
          </div>
        )}
      </div>

      {/* Toast / Notification Banner */}
      {notification && (
        <div className={`p-4 border flex items-center justify-between text-sm font-mono ${
          notification.type === 'success' 
            ? 'bg-[#18D8FF]/10 border-[#18D8FF]/40 text-[#18D8FF]' 
            : 'bg-red-500/10 border-red-500/40 text-red-400'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-current opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Hero Section */}
      <div className="border border-[#82aadc33] bg-[#080E1C]/80 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center relative">
        <div className="absolute top-0 left-0 w-8 h-[1px] bg-[#18D8FF]" />
        <div className="absolute top-0 left-0 w-[1px] h-8 bg-[#18D8FF]" />
        
        {/* Cover Art Box with Instant Actions */}
        <div className="relative group w-32 h-32 bg-[#0B1324] border border-[#82aadc33] shrink-0 flex items-center justify-center overflow-hidden">
          {song.hasCover ? (
            <img 
              src={coverUrl}
              alt={song.title}
              key={coverUrl}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <ImageIcon className="w-10 h-10 text-[#64748B]" />
          )}

          {/* Hover overlay with action buttons */}
          <div className="absolute inset-0 bg-[#050914]/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="w-full text-[11px] font-mono uppercase bg-[#18D8FF]/20 text-[#18D8FF] hover:bg-[#18D8FF]/30 py-1 border border-[#18D8FF]/30 flex items-center justify-center gap-1"
              title="Replace Cover"
            >
              <Upload className="w-3 h-3" />
              {song.hasCover ? "Replace" : "Upload"}
            </button>
            {song.hasCover && (
              <div className="flex gap-1 w-full">
                <button
                  type="button"
                  onClick={() => setIsCoverLightboxOpen(true)}
                  className="flex-1 text-[10px] font-mono bg-[#82aadc20] text-[#A9B7CC] hover:text-[#F2F7FF] py-1 border border-[#82aadc33] flex items-center justify-center gap-1"
                  title="View Fullsize"
                >
                  <Maximize2 className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAssetToDelete({ type: 'cover', label: 'Cover Art' })}
                  className="flex-1 text-[10px] font-mono bg-red-500/20 text-red-400 hover:bg-red-500/30 py-1 border border-red-500/30 flex items-center justify-center gap-1"
                  title="Delete Cover"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Title & Metadata Summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-display uppercase tracking-wider text-[#F2F7FF] truncate">
              {song.title}
            </h1>
          </div>
          <p className="text-base text-[#A9B7CC]">{song.artist || "Unknown Artist"}</p>
          <div className="flex flex-wrap items-center gap-4 text-[#64748B] font-mono text-xs mt-3">
            <span>ALBUM: <span className="text-[#A9B7CC]">{song.album || "Unknown"}</span></span>
            <span>DURATION: <span className="text-[#A9B7CC]">{formatDuration(song.duration)}</span></span>
            {song.genre && <span>GENRE: <span className="text-[#A9B7CC]">{song.genre}</span></span>}
            {song.year && <span>YEAR: <span className="text-[#A9B7CC]">{song.year}</span></span>}
          </div>
        </div>
        
        {/* Main Song Action */}
        <div className="flex flex-col gap-2 shrink-0 self-end md:self-center">
          <Button variant="destructive" onClick={() => setIsSongDeleteDialogOpen(true)}>
            <Trash2 className="w-4 h-4" />
            Delete Song
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Metadata & Lyric Management */}
        <div className="lg:col-span-7 space-y-8">
          {/* 1. Metadata Form */}
          <div className="border border-[#82aadc33] bg-[#080E1C]/60 p-6 relative">
            <h2 className="text-sm font-mono tracking-widest text-[#A9B7CC] mb-6 uppercase border-b border-[#82aadc33] pb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#18D8FF]" />
              Metadata Configuration
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" {...register("title")} />
                  {errors.title && <p className="text-red-400 text-xs">{errors.title.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="artist">Artist</Label>
                  <Input id="artist" {...register("artist")} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="album">Album</Label>
                  <Input id="album" {...register("album")} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input id="genre" {...register("genre")} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" {...register("year")} />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!isDirty || updateMetadataMutation.isPending}
                >
                  {updateMetadataMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Metadata Changes
                </Button>
              </div>
            </form>
          </div>

          {/* 2. Lyrics Management (Full CRUD) */}
          <div className="border border-[#82aadc33] bg-[#080E1C]/60 p-6 relative">
            <div className="flex items-center justify-between border-b border-[#82aadc33] pb-2 mb-6">
              <h2 className="text-sm font-mono tracking-widest text-[#A9B7CC] uppercase flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#18D8FF]" />
                Lyrics Files ({lyrics?.length || 0})
              </h2>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => lyricInputRef.current?.click()}
                disabled={uploadAssetMutation.isPending}
                className="text-xs font-mono"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Lyric (.lrc/.json)
              </Button>
            </div>
            
            {lyrics && lyrics.length > 0 ? (
              <div className="space-y-3">
                {lyrics.map((lrc, index) => {
                  const isTop = index === 0;
                  const isBottom = index === lyrics.length - 1;
                  return (
                    <div 
                      key={lrc.id} 
                      className={`flex items-center justify-between p-3.5 border transition-all ${
                        isTop 
                          ? 'border-[#18D8FF]/40 bg-[#0B1324] shadow-[0_0_15px_rgba(24,216,255,0.05)]' 
                          : 'border-[#82aadc1a] bg-[#0B1324] hover:border-[#82aadc40]'
                      }`}
                    >
                      {/* Priority Controls & Rank Badge */}
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveLyric(index, 'up')}
                            disabled={isTop || reorderLyricsMutation.isPending}
                            className="p-1 text-[#64748B] hover:text-[#18D8FF] hover:bg-[#18D8FF]/10 disabled:opacity-20 disabled:hover:text-[#64748B] disabled:hover:bg-transparent transition-colors"
                            title="Move Priority Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveLyric(index, 'down')}
                            disabled={isBottom || reorderLyricsMutation.isPending}
                            className="p-1 text-[#64748B] hover:text-[#18D8FF] hover:bg-[#18D8FF]/10 disabled:opacity-20 disabled:hover:text-[#64748B] disabled:hover:bg-transparent transition-colors"
                            title="Move Priority Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Rank Pill */}
                        <div className={`w-7 h-7 shrink-0 flex items-center justify-center font-mono text-xs font-bold border ${
                          isTop 
                            ? 'bg-[#18D8FF]/20 text-[#18D8FF] border-[#18D8FF]/50 shadow-[0_0_8px_rgba(24,216,255,0.3)]' 
                            : 'bg-[#82aadc10] text-[#A9B7CC] border-[#82aadc22]'
                        }`}>
                          #{index + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="text-[#F2F7FF] text-sm flex items-center gap-2 flex-wrap">
                            <FileText className="w-3.5 h-3.5 text-[#18D8FF] shrink-0" />
                            <span className="font-semibold">{lrc.provider}</span>
                            {isTop ? (
                              <span className="text-[10px] px-1.5 py-0.5 bg-[#18D8FF]/20 text-[#18D8FF] border border-[#18D8FF]/40 font-mono flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                TOP PRIORITY (RECOMMENDED)
                              </span>
                            ) : lrc.recommended ? (
                              <span className="text-[10px] px-1.5 py-0.5 bg-[#1557C0]/30 text-[#18D8FF] border border-[#18D8FF]/30 font-mono">
                                RECOMMENDED
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-[#64748B] font-mono mt-1 flex gap-3">
                            <span>FORMAT: <span className="text-[#A9B7CC]">{lrc.format.toUpperCase()}</span></span>
                            <span>PRIORITY: <span className="text-[#A9B7CC]">{lrc.priority ?? index}</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isTop && (
                          <button
                            type="button"
                            onClick={() => handleMakeTopLyric(index)}
                            disabled={reorderLyricsMutation.isPending}
                            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono bg-[#18D8FF]/10 hover:bg-[#18D8FF]/20 text-[#18D8FF] border border-[#18D8FF]/30 transition-colors"
                            title="Set as Top Priority (#1)"
                          >
                            <Star className="w-3 h-3" />
                            Make Top
                          </button>
                        )}

                        {/* Read / View */}
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setSelectedLyricId(lrc.id)}
                          title="View Lyric Content"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>

                        {/* Download */}
                        <a 
                          href={`${apiBase}/api/lyrics/${lrc.id}`}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="inline-flex items-center justify-center p-2 text-[#A9B7CC] hover:text-[#18D8FF] bg-[#82aadc1a] hover:bg-[#82aadc33] border border-[#82aadc33] transition-colors"
                          title="Download Raw File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {/* Delete */}
                        <button 
                          type="button"
                          onClick={() => setLyricToDelete(lrc)}
                          className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                          title="Delete Lyric File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 border border-dashed border-[#82aadc20] text-center">
                <FileText className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
                <p className="text-sm text-[#A9B7CC] font-mono">No lyric files attached yet.</p>
                <p className="text-xs text-[#64748B] font-mono mt-1 mb-4">Support .lrc, .json, and plain text formats.</p>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => lyricInputRef.current?.click()}
                  disabled={uploadAssetMutation.isPending}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload First Lyric File
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Media Preview & Asset Center CRUD */}
        <div className="lg:col-span-5 space-y-8">
          {/* 1. Media Center / Preview with Tabs */}
          <div className="border border-[#82aadc33] bg-[#080E1C]/60 p-6 relative">
            <div className="flex items-center justify-between border-b border-[#82aadc33] pb-2 mb-6">
              <h2 className="text-sm font-mono tracking-widest text-[#A9B7CC] uppercase flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#18D8FF]" />
                Media Preview
              </h2>
              {/* Tab Selector */}
              <div className="flex gap-1 bg-[#050914] p-0.5 border border-[#82aadc22]">
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('audio')}
                  className={`px-2.5 py-1 text-xs font-mono transition-colors ${
                    activeMediaTab === 'audio' 
                      ? 'bg-[#18D8FF]/20 text-[#18D8FF] border border-[#18D8FF]/40' 
                      : 'text-[#64748B] hover:text-[#A9B7CC]'
                  }`}
                >
                  Audio
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('stem')}
                  className={`px-2.5 py-1 text-xs font-mono transition-colors ${
                    activeMediaTab === 'stem' 
                      ? 'bg-[#18D8FF]/20 text-[#18D8FF] border border-[#18D8FF]/40' 
                      : 'text-[#64748B] hover:text-[#A9B7CC]'
                  }`}
                >
                  Stem
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('video')}
                  className={`px-2.5 py-1 text-xs font-mono transition-colors ${
                    activeMediaTab === 'video' 
                      ? 'bg-[#18D8FF]/20 text-[#18D8FF] border border-[#18D8FF]/40' 
                      : 'text-[#64748B] hover:text-[#A9B7CC]'
                  }`}
                >
                  Video
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('cover')}
                  className={`px-2.5 py-1 text-xs font-mono transition-colors ${
                    activeMediaTab === 'cover' 
                      ? 'bg-[#18D8FF]/20 text-[#18D8FF] border border-[#18D8FF]/40' 
                      : 'text-[#64748B] hover:text-[#A9B7CC]'
                  }`}
                >
                  Cover
                </button>
              </div>
            </div>
            
            <div className="min-h-[160px] flex flex-col justify-center">
              {/* Primary Audio Player */}
              {activeMediaTab === 'audio' && (
                song.hasAudio ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-[#A9B7CC]">
                      <span className="flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-[#18D8FF]" /> Primary Audio Stream
                      </span>
                      <a 
                        href={audioUrl} 
                        download 
                        className="text-[#18D8FF] hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download
                      </a>
                    </div>
                    <audio 
                      key={audioUrl}
                      controls 
                      className="w-full h-10 accent-[#18D8FF]"
                      src={audioUrl}
                    />
                  </div>
                ) : (
                  <div className="text-center p-6 border border-dashed border-[#82aadc20]">
                    <Music className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-40" />
                    <p className="text-xs text-[#64748B] font-mono mb-3">No primary audio file uploaded</p>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => audioInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Audio
                    </Button>
                  </div>
                )
              )}

              {/* Stem Player */}
              {activeMediaTab === 'stem' && (
                song.hasStem ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-[#A9B7CC]">
                      <span className="flex items-center gap-1.5">
                        <Mic2 className="w-3.5 h-3.5 text-[#18D8FF]" /> Instrumental Stem Track
                      </span>
                      <a 
                        href={stemUrl} 
                        download 
                        className="text-[#18D8FF] hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download
                      </a>
                    </div>
                    <audio 
                      key={stemUrl}
                      controls 
                      className="w-full h-10 accent-[#18D8FF]"
                      src={stemUrl}
                    />
                  </div>
                ) : (
                  <div className="text-center p-6 border border-dashed border-[#82aadc20]">
                    <Mic2 className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-40" />
                    <p className="text-xs text-[#64748B] font-mono mb-3">No stem/instrumental file uploaded</p>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => stemInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Stem
                    </Button>
                  </div>
                )
              )}

              {/* Video Player */}
              {activeMediaTab === 'video' && (
                song.hasVideo ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-[#A9B7CC]">
                      <span className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-[#18D8FF]" /> Background Video
                      </span>
                      <a 
                        href={videoUrl} 
                        download 
                        className="text-[#18D8FF] hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download
                      </a>
                    </div>
                    <video 
                      key={videoUrl}
                      controls 
                      className="w-full aspect-video bg-black border border-[#82aadc33] max-h-[260px] object-contain"
                      src={videoUrl}
                    />
                  </div>
                ) : (
                  <div className="text-center p-6 border border-dashed border-[#82aadc20]">
                    <Video className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-40" />
                    <p className="text-xs text-[#64748B] font-mono mb-3">No background video uploaded</p>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Video
                    </Button>
                  </div>
                )
              )}

              {/* Cover Art View */}
              {activeMediaTab === 'cover' && (
                song.hasCover ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-[#A9B7CC]">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-[#18D8FF]" /> High-Res Cover Art
                      </span>
                      <a 
                        href={coverUrl} 
                        download 
                        className="text-[#18D8FF] hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download
                      </a>
                    </div>
                    <div className="relative aspect-square max-h-[260px] mx-auto border border-[#82aadc33] overflow-hidden bg-black/40 flex items-center justify-center">
                      <img 
                        src={coverUrl} 
                        alt="Cover" 
                        key={coverUrl}
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setIsCoverLightboxOpen(true)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 border border-dashed border-[#82aadc20]">
                    <ImageIcon className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-40" />
                    <p className="text-xs text-[#64748B] font-mono mb-3">No cover art uploaded</p>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => coverInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Cover Art
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* 2. Asset Operations & Status (Full CRUD Grid) */}
          <div className="border border-[#82aadc33] bg-[#080E1C]/60 p-6 relative">
            <h2 className="text-sm font-mono tracking-widest text-[#A9B7CC] mb-6 uppercase border-b border-[#82aadc33] pb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#18D8FF]" />
              Asset Inventory & Actions
            </h2>
            
            <div className="space-y-4">
              {/* Cover Art Row */}
              <div className="p-3.5 bg-[#0B1324] border border-[#82aadc22] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#82aadc1a] border border-[#82aadc33]">
                    <ImageIcon className="w-4 h-4 text-[#18D8FF]" />
                  </div>
                  <div>
                    <div className="text-sm font-display uppercase tracking-wider text-[#F2F7FF]">Cover / Art</div>
                    <div className="text-[11px] font-mono flex items-center gap-1.5 mt-0.5">
                      <span className={song.hasCover ? "text-[#18D8FF]" : "text-[#64748B]"}>
                        {song.hasCover ? "● AVAILABLE" : "○ MISSING"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="p-1.5 text-xs font-mono bg-[#82aadc1a] hover:bg-[#82aadc33] border border-[#82aadc33] text-[#F2F7FF] flex items-center gap-1 transition-colors"
                    title={song.hasCover ? "Replace Cover Art" : "Upload Cover Art"}
                  >
                    <Upload className="w-3.5 h-3.5 text-[#18D8FF]" />
                    <span className="hidden sm:inline">{song.hasCover ? "Replace" : "Upload"}</span>
                  </button>

                  {song.hasCover && (
                    <>
                      <a 
                        href={coverUrl} 
                        download
                        className="p-1.5 text-xs font-mono bg-[#82aadc1a] hover:bg-[#82aadc33] border border-[#82aadc33] text-[#A9B7CC] hover:text-[#18D8FF] transition-colors"
                        title="Download Cover Art"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setAssetToDelete({ type: 'cover', label: 'Cover Art' })}
                        className="p-1.5 text-xs font-mono bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors"
                        title="Delete Cover Art"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Audio Row */}
              <div className="p-3.5 bg-[#0B1324] border border-[#82aadc22] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#82aadc1a] border border-[#82aadc33]">
                    <Music className="w-4 h-4 text-[#18D8FF]" />
                  </div>
                  <div>
                    <div className="text-sm font-display uppercase tracking-wider text-[#F2F7FF]">Primary Audio</div>
                    <div className="text-[11px] font-mono flex items-center gap-1.5 mt-0.5">
                      <span className={song.hasAudio ? "text-[#18D8FF]" : "text-[#64748B]"}>
                        {song.hasAudio ? "● AVAILABLE" : "○ MISSING"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="p-1.5 text-xs font-mono bg-[#82aadc1a] hover:bg-[#82aadc33] border border-[#82aadc33] text-[#F2F7FF] flex items-center gap-1 transition-colors"
                    title={song.hasAudio ? "Replace Audio Track" : "Upload Audio Track"}
                  >
                    <Upload className="w-3.5 h-3.5 text-[#18D8FF]" />
                    <span className="hidden sm:inline">{song.hasAudio ? "Replace" : "Upload"}</span>
                  </button>

                  {song.hasAudio && (
                    <>
                      <a 
                        href={audioUrl} 
                        download
                        className="p-1.5 text-xs font-mono bg-[#82aadc1a] hover:bg-[#82aadc33] border border-[#82aadc33] text-[#A9B7CC] hover:text-[#18D8FF] transition-colors"
                        title="Download Audio Track"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setAssetToDelete({ type: 'audio', label: 'Primary Audio' })}
                        className="p-1.5 text-xs font-mono bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors"
                        title="Delete Audio Track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Video Row */}
              <div className="p-3.5 bg-[#0B1324] border border-[#82aadc22] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#82aadc1a] border border-[#82aadc33]">
                    <Video className="w-4 h-4 text-[#18D8FF]" />
                  </div>
                  <div>
                    <div className="text-sm font-display uppercase tracking-wider text-[#F2F7FF]">Background Video</div>
                    <div className="text-[11px] font-mono flex items-center gap-1.5 mt-0.5">
                      <span className={song.hasVideo ? "text-[#18D8FF]" : "text-[#64748B]"}>
                        {song.hasVideo ? "● AVAILABLE" : "○ MISSING"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="p-1.5 text-xs font-mono bg-[#82aadc1a] hover:bg-[#82aadc33] border border-[#82aadc33] text-[#F2F7FF] flex items-center gap-1 transition-colors"
                    title={song.hasVideo ? "Replace Video Track" : "Upload Video Track"}
                  >
                    <Upload className="w-3.5 h-3.5 text-[#18D8FF]" />
                    <span className="hidden sm:inline">{song.hasVideo ? "Replace" : "Upload"}</span>
                  </button>

                  {song.hasVideo && (
                    <>
                      <a 
                        href={videoUrl} 
                        download
                        className="p-1.5 text-xs font-mono bg-[#82aadc1a] hover:bg-[#82aadc33] border border-[#82aadc33] text-[#A9B7CC] hover:text-[#18D8FF] transition-colors"
                        title="Download Video Track"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setAssetToDelete({ type: 'video', label: 'Background Video' })}
                        className="p-1.5 text-xs font-mono bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors"
                        title="Delete Video Track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stem Row */}
              <div className="p-3.5 bg-[#0B1324] border border-[#82aadc22] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#82aadc1a] border border-[#82aadc33]">
                    <Mic2 className="w-4 h-4 text-[#18D8FF]" />
                  </div>
                  <div>
                    <div className="text-sm font-display uppercase tracking-wider text-[#F2F7FF]">Instrumental Stem</div>
                    <div className="text-[11px] font-mono flex items-center gap-1.5 mt-0.5">
                      <span className={song.hasStem ? "text-[#18D8FF]" : "text-[#64748B]"}>
                        {song.hasStem ? "● AVAILABLE" : "○ MISSING"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => stemInputRef.current?.click()}
                    className="p-1.5 text-xs font-mono bg-[#82aadc1a] hover:bg-[#82aadc33] border border-[#82aadc33] text-[#F2F7FF] flex items-center gap-1 transition-colors"
                    title={song.hasStem ? "Replace Instrumental Stem" : "Upload Instrumental Stem"}
                  >
                    <Upload className="w-3.5 h-3.5 text-[#18D8FF]" />
                    <span className="hidden sm:inline">{song.hasStem ? "Replace" : "Upload"}</span>
                  </button>

                  {song.hasStem && (
                    <>
                      <a 
                        href={stemUrl} 
                        download
                        className="p-1.5 text-xs font-mono bg-[#82aadc1a] hover:bg-[#82aadc33] border border-[#82aadc33] text-[#A9B7CC] hover:text-[#18D8FF] transition-colors"
                        title="Download Stem Track"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setAssetToDelete({ type: 'stem', label: 'Instrumental Stem' })}
                        className="p-1.5 text-xs font-mono bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors"
                        title="Delete Stem Track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Confirm Delete Entire Song */}
      <Dialog open={isSongDeleteDialogOpen} onOpenChange={setIsSongDeleteDialogOpen}>
        <DialogTitle>Confirm Song Deletion</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete <span className="text-[#F2F7FF]">"{song.title}"</span>? This will permanently remove the song database record and all associated media files from physical disk storage.
        </DialogDescription>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsSongDeleteDialogOpen(false)} disabled={deleteSongMutation.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => deleteSongMutation.mutate()} disabled={deleteSongMutation.isPending}>
            {deleteSongMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Confirm Delete
          </Button>
        </DialogFooter>
      </Dialog>

      {/* MODAL 2: Confirm Delete Individual Asset */}
      <Dialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <DialogTitle>Remove {assetToDelete?.label}</DialogTitle>
        <DialogDescription>
          Are you sure you want to remove the <span className="text-[#F2F7FF]">{assetToDelete?.label}</span> asset for this song? The file will be removed from disk storage.
        </DialogDescription>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setAssetToDelete(null)} disabled={deleteAssetMutation.isPending}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => assetToDelete && deleteAssetMutation.mutate(assetToDelete.type)} 
            disabled={deleteAssetMutation.isPending}
          >
            {deleteAssetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete Asset
          </Button>
        </DialogFooter>
      </Dialog>

      {/* MODAL 3: Confirm Delete Lyric */}
      <Dialog open={!!lyricToDelete} onOpenChange={(open) => !open && setLyricToDelete(null)}>
        <DialogTitle>Delete Lyric File</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this <span className="text-[#F2F7FF]">{lyricToDelete?.provider} ({lyricToDelete?.format})</span> lyric file?
        </DialogDescription>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setLyricToDelete(null)} disabled={deleteLyricMutation.isPending}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => lyricToDelete && deleteLyricMutation.mutate(lyricToDelete.id)} 
            disabled={deleteLyricMutation.isPending}
          >
            {deleteLyricMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete Lyric
          </Button>
        </DialogFooter>
      </Dialog>

      {/* MODAL 4: Lyric Content Viewer */}
      <Dialog 
        open={!!selectedLyricId} 
        onOpenChange={(open) => !open && setSelectedLyricId(null)}
        className="max-w-3xl"
      >
        <DialogTitle>
          <div className="flex items-center justify-between pr-6">
            <span>Lyric Viewer</span>
            {selectedLyricId && (
              <a 
                href={`${apiBase}/api/lyrics/${selectedLyricId}`}
                download
                className="text-xs font-mono text-[#18D8FF] hover:underline flex items-center gap-1 font-normal"
              >
                <Download className="w-3 h-3" /> Download File
              </a>
            )}
          </div>
        </DialogTitle>
        <DialogDescription>
          Inspect parsed synchronized timing and lyrics payload.
        </DialogDescription>

        <div className="max-h-[60vh] overflow-y-auto border border-[#82aadc22] bg-[#050914] p-4 font-mono text-xs">
          {isLoadingLyricContent ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#18D8FF] gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>FETCHING LYRIC PAYLOAD...</span>
            </div>
          ) : lyricContent ? (
            lyricContent.lyrics && Array.isArray(lyricContent.lyrics) ? (
              <div className="space-y-2">
                <div className="text-[#64748B] text-[11px] pb-2 border-b border-[#82aadc22] flex justify-between">
                  <span>TIMECODE</span>
                  <span>CONTENT ({lyricContent.lyrics.length} LINES)</span>
                </div>
                {lyricContent.lyrics.map((line, idx) => (
                  <div 
                    key={idx} 
                    className="flex gap-4 py-1.5 px-2 hover:bg-[#82aadc11] transition-colors border-b border-[#82aadc0f] items-baseline"
                  >
                    <span className="text-[#18D8FF] font-mono shrink-0 select-none text-[11px]">
                      [{formatTimeMs(line.startTimeMs || 0)}]
                    </span>
                    <div className="flex-1">
                      <div className="text-[#F2F7FF]">
                        {line.words ? line.words : <span className="text-[#64748B] italic">(Instrumental)</span>}
                      </div>
                      {line.romanization && (
                        <div className="text-[10px] text-[#64748B] mt-0.5">{line.romanization}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : lyricContent.content ? (
              <pre className="text-[#A9B7CC] whitespace-pre-wrap font-mono leading-relaxed">
                {lyricContent.content}
              </pre>
            ) : (
              <pre className="text-[#A9B7CC] whitespace-pre-wrap font-mono leading-relaxed">
                {JSON.stringify(lyricContent, null, 2)}
              </pre>
            )
          ) : (
            <p className="text-red-400">Failed to load lyric contents.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setSelectedLyricId(null)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      {/* MODAL 5: Full Resolution Cover Lightbox */}
      <Dialog 
        open={isCoverLightboxOpen} 
        onOpenChange={setIsCoverLightboxOpen}
        className="max-w-2xl"
      >
        <DialogTitle>Cover Artwork</DialogTitle>
        <DialogDescription>
          Full resolution album art preview.
        </DialogDescription>
        <div className="bg-black/60 border border-[#82aadc22] p-2 flex items-center justify-center overflow-hidden">
          <img 
            src={coverUrl} 
            alt={song.title} 
            className="max-h-[60vh] max-w-full object-contain"
          />
        </div>
        <DialogFooter>
          <a 
            href={coverUrl} 
            download
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#82aadc33] bg-[#82aadc1a] hover:bg-[#82aadc33] text-xs font-mono text-[#F2F7FF] transition-colors uppercase tracking-wider"
          >
            <Download className="w-4 h-4 text-[#18D8FF]" /> Download Image
          </a>
          <Button variant="secondary" onClick={() => setIsCoverLightboxOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
