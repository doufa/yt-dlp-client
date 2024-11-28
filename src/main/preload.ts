import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  downloadVideo: (url: string, saveDir: string) => ipcRenderer.invoke('download-video', url, saveDir),
  getDownloadProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress));
  },
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
});

// Type declarations for the exposed API
declare global {
  interface Window {
    electron: {
      downloadVideo: (url: string, saveDir: string) => Promise<void>;
      getDownloadProgress: (callback: (progress: number) => void) => void;
      selectDirectory: () => Promise<string | null>;
    };
  }
} 