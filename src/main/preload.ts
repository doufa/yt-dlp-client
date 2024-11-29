import { contextBridge, ipcRenderer } from 'electron';
import { DownloadProgress } from 'shared/types/download';

contextBridge.exposeInMainWorld('electron', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  downloadVideo: (url: string, saveDir: string, formatId: string) => ipcRenderer.invoke('download-video', url, saveDir, formatId),
  // add callback to stop the download process  
  downloadStop: (callback: () => void) => ipcRenderer.on('download-stop', callback),
  getDownloadProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress));
  },
  downloadError: (callback: (error: string) => void) => {
    ipcRenderer.on('download-error', (_event, error) => callback(error));
  },
  downloadComplete: (callback: () => void) => {
    ipcRenderer.on('download-complete', () => callback());
  },

  fetchVideoFormats: (url: string) => ipcRenderer.invoke('fetch-video-formats', url),
  getVideoFormats: (callback: (formats: any[]) => void) => 
    ipcRenderer.on('video-formats', (_event, formats) => callback(formats)),
});

// Type declarations for the exposed API
declare global {
  interface Window {
    electron: {
      selectDirectory: () => Promise<string | null>;
      downloadVideo: (url: string, saveDir: string, formatId: string) => Promise<void>;
      downloadStop: (callback: () => void) => void;
      getDownloadProgress: (callback: (progress: DownloadProgress) => void) => void;
      downloadError: (callback: (error: string) => void) => void;
      downloadComplete: (callback: () => void) => void;
      fetchVideoFormats: (url: string) => Promise<any[]>;
      getVideoFormats: (callback: (formats: any[]) => void) => void;
    };
  }
} 