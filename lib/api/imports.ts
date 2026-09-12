import { fetchApi } from './client';
import { ImportJobStatus } from '@/types/song';

export const importsApi = {
  uploadSpk: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Bypass Next.js rewrites proxy for large file uploads as it buffers and crashes on large files
    const backendUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:8080`
      : 'http://localhost:8080';
    
    const url = (process.env.NEXT_PUBLIC_SINGULARITY_API_URL || backendUrl) + '/api/admin/import';

    return fetch(url, {
      method: 'POST',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        let err;
        try { err = text ? JSON.parse(text) : {}; } catch { err = { error: text }; }
        throw new Error(err.error || err.message || 'Failed to upload SPK package');
      }
      return res.json();
    });
  },

  checkStatus: (jobId: string) => {
    return fetchApi<ImportJobStatus>(`/api/admin/import/${jobId}`);
  }
};
