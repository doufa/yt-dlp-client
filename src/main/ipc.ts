import { dialog, ipcMain } from 'electron';
import { exec } from 'child_process';
import path from 'path';
import { execPaths } from './execPaths';

// Use the paths
const ffmpegPath = execPaths.ffmpeg;
const ytDlpPath = execPaths.ytDlp;

// Handler for selecting directory
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

// Handler for video download
ipcMain.handle('download-video', async (_event, url: string, saveDir: string) => {
  try {

    // Using ffmpegPath from main.ts instead of hardcoded path
    const command = `"${ytDlpPath}" --proxy http://127.0.0.1:7890 -f "worst[ext=mp4]" -o "${path.join(saveDir, 'test.mp4')}" --ffmpeg-location "${ffmpegPath}" "${url}"`;

    console.log(`Executing command: ${command}`);

    const downloadProcess = exec(command);

    downloadProcess.stdout?.on('data', (data) => {
      console.log(`stdout: ${data}`);
      // Parse progress from stdout if possible and send it to the renderer
      // Example: _event.sender.send('download-progress', parsedProgress);
    });

    downloadProcess.stderr?.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    downloadProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Download completed successfully');
      } else {
        console.error(`Download process exited with code ${code}`);
      }
    });

  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}); 