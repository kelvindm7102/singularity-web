import { fetchApi } from './client';

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre: string;
  year: number;
  hasAudio: boolean;
  hasVideo: boolean;
  hasStem: boolean;
  hasCover: boolean;
  hasLyric: boolean;
}

export const libraryApi = {
  search: (query: string) => 
    fetchApi<PageResponse<Song>>(`/api/songs/search?q=${encodeURIComponent(query)}`),
  
  getAll: () =>
    fetchApi<PageResponse<Song>>(`/api/songs`),
    
  getById: (id: string) =>
    fetchApi<Song>(`/api/songs/${id}`),
};
