export interface Song {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration: number; // in seconds
  genre?: string;
  year?: number;
  hasAudio: boolean;
  hasVideo: boolean;
  hasStem: boolean;
  hasCover: boolean;
  hasLyric: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemStats {
  activeImportJobs: number;
  totalSongs: number;
  totalStorageBytes: number;
  health: string;
}

export interface LyricManifest {
  id: string;
  provider: string;
  format: string;
  recommended: boolean;
  priority: number;
  url: string;
}

export interface LyricLine {
  startTimeMs?: number;
  durationMs?: number;
  words?: string;
  romanization?: string;
  isInstrumental?: boolean;
}

export interface LyricData {
  version?: string;
  language?: string;
  lyrics?: LyricLine[];
  content?: string;
  source?: string;
  sourceHref?: string;
  raw?: boolean;
}

export interface ImportJobStatus {
  jobId: string;
  songId?: string;
  status: 'PENDING' | 'IMPORTING' | 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}
