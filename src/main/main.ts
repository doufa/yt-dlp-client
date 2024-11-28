import { app, BrowserWindow } from 'electron';
import './ipc';
import * as path from 'path';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const isDev = process.env.NODE_ENV === 'development';

function getFfmpegPath(): string {
    const platform = process.platform;
    const ffmpegExecutable = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    
    if (isDev) {
        // In development, we need to go up from .webpack to the project root
        return path.join(__dirname, '..', '..', 'lib', platform, ffmpegExecutable);
    } else {
        // In production, use the path relative to the app resources
        return path.join(process.resourcesPath, 'lib', platform, ffmpegExecutable);
    }
}

// You can export it if needed in other files
export const ffmpegPath = getFfmpegPath();

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools in development mode.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 