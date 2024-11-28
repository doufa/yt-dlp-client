export interface VideoFormat {
  formatId: string;
  ext: string;
  resolution: string;
  filesize: string;
  fps?: number;
  vcodec?: string;
  acodec?: string;
} 