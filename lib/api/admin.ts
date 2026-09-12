import { fetchApi } from './client';
import { SystemStats, ImportJobStatus } from '@/types/song';

export const adminApi = {
  getStats: () => {
    return fetchApi<SystemStats>('/api/admin/stats');
  },
  
  getImportHistory: () => {
    return fetchApi<ImportJobStatus[]>('/api/admin/import/history');
  }
};
