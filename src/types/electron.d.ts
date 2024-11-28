export interface IElectronAPI {
  exec: (command: string, callback: (error: Error | null, stdout: string, stderr: string) => void) => void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
} 