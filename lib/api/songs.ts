import { fetchApi } from './client';
import { Page } from '@/types/api';
import { Song, LyricManifest } from '@/types/song';

export const songsApi = {
  list: (params?: { page?: number; size?: number; sort?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.set('page', params.page.toString());
    if (params?.size !== undefined) searchParams.set('size', params.size.toString());
    if (params?.sort) searchParams.set('sort', params.sort);
    
    const queryString = searchParams.toString();
    return fetchApi<Page<Song>>(`/api/songs${queryString ? `?${queryString}` : ''}`);
  },

  search: (q: string, params?: { page?: number; size?: number; sort?: string }) => {
    const searchParams = new URLSearchParams();
    searchParams.set('q', q);
    if (params?.page !== undefined) searchParams.set('page', params.page.toString());
    if (params?.size !== undefined) searchParams.set('size', params.size.toString());
    if (params?.sort) searchParams.set('sort', params.sort);
    
    return fetchApi<Page<Song>>(`/api/songs/search?${searchParams.toString()}`);
  },

  get: (id: string) => {
    return fetchApi<Song>(`/api/songs/${id}`);
  },

  getLyrics: (songId: string) => {
    return fetchApi<LyricManifest[]>(`/api/songs/${songId}/lyrics`);
  },

  getLyricContent: (lyricId: string) => {
    return fetchApi<any>(`/api/lyrics/${lyricId}`);
  },

  update: (id: string, data: FormData) => {
    return fetchApi<Song>(`/api/admin/songs/${id}`, {
      method: 'PATCH',
      body: data,
    });
  },

  uploadAsset: (songId: string, type: 'cover' | 'video' | 'audio' | 'stem' | 'lyric', file: File) => {
    const formData = new FormData();
    formData.append(type, file);
    return fetchApi<Song>(`/api/admin/songs/${songId}`, {
      method: 'PATCH',
      body: formData,
    });
  },

  deleteAsset: (songId: string, type: 'cover' | 'video' | 'audio' | 'stem') => {
    return fetchApi<{ success: boolean }>(`/api/admin/songs/${songId}/assets/${type}`, {
      method: 'DELETE',
    });
  },

  deleteLyric: (lyricId: string) => {
    return fetchApi<{ success: boolean }>(`/api/admin/lyrics/${lyricId}`, {
      method: 'DELETE',
    });
  },

  reorderLyrics: (songId: string, lyricIds: string[]) => {
    return fetchApi<any>(`/api/admin/songs/${songId}/lyrics/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lyricIds),
    });
  },

  delete: (id: string) => {
    return fetchApi<{ success: boolean }>(`/api/admin/songs/${id}`, {
      method: 'DELETE',
    });
  }
};
