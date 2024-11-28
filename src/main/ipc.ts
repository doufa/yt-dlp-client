import { dialog, ipcMain } from 'electron';
import { exec } from 'child_process';
import path from 'path';
import { execPaths } from './execPaths';
import { DownloadProgress } from 'shared/types/download';

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
      
      const dataStr = data.toString();
      const progressMatch = dataStr.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?(\d+\.?\d*)(MiB|KiB|B)(?:\s+at\s+(\d+\.?\d*)(MiB|KiB|B)\/s)?(?:\s+ETA\s+(\d+:\d+))?/);
      
      if (progressMatch) {
        const progressInfo: DownloadProgress = {
          progress: parseFloat(progressMatch[1]),
          size: `${progressMatch[2]}${progressMatch[3]}`,
          speed: progressMatch[4] ? `${progressMatch[4]}${progressMatch[5]}/s` : null,
          eta: progressMatch[6] || null
        };
        _event.sender.send('download-progress', progressInfo);
      }
    });

    downloadProcess.stderr?.on('data', (data) => {
      console.error(`stderr: ${data}`);
      _event.sender.send('download-error', data);

      // For Windows
      require('tree-kill')(downloadProcess.pid);
    });

    downloadProcess.on('error', (error) => {
      console.error('Process error:', error);
      _event.sender.send('download-error', error.message);
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
