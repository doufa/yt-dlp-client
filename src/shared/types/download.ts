export interface DownloadProgress {
  progress: number;
  size: string;
  speed: string | null;
  eta: string | null;
} 