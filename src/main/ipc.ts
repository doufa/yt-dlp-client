import { dialog, ipcMain } from 'electron';
import { exec, spawn } from 'child_process';
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
ipcMain.handle('download-video', async (_event, url: string, saveDir: string, formatId: string) => {
  try {
    console.log(`download-video: ${url}, ${saveDir}, ${formatId}`);

    // First, get the video title and extension
    const titleCommand = `"${ytDlpPath}" --proxy http://127.0.0.1:7890 --get-title --get-filename -f ${formatId} "${url}"`;
    const { title, ext } = await new Promise<{ title: string, ext: string }>((resolve, reject) => {
      exec(titleCommand, (error, stdout, stderr) => {
        if (error) reject(error);
        console.log(`titleCommand stdout: ${stdout}`);
        const [videoTitle, filename] = stdout.trim().split('\n');
        const extension = filename.split('.').pop() || 'mp4'; // fallback to mp4 if extension not found
        resolve({ title: videoTitle, ext: extension });
      });
    });

    // Sanitize the filename to remove invalid characters
    const sanitizedTitle = title.replace(/[<>:"/\\|?*]/g, '').trim();
    
    // Now use the title and correct extension in the download command
    const command = `"${ytDlpPath}" --proxy http://127.0.0.1:7890 -f "${formatId}+bestaudio" --merge-output-format ${ext} -o "${path.join(saveDir, `${sanitizedTitle}.${ext}`)}" --ffmpeg-location "${ffmpegPath}" "${url}"`;

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

// Add these IPC handlers
ipcMain.handle('fetch-video-formats', async (event, url) => {
  return new Promise((resolve, reject) => {
    const command = `"${ytDlpPath}" -F --proxy http://127.0.0.1:7890 "${url}"`;
    
    const ytdl = exec(command, { maxBuffer: 1024 * 1024 * 10 });
    let output = '';

    ytdl.stdout?.on('data', (data) => {
      output += data;
    });

    ytdl.stderr?.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    ytdl.on('close', (code) => {
      if (code === 0) {
        try {
          // Check if the output contains format information
          if (!output.includes('Available formats for')) {
            throw new Error('No format information found');
          }

          // Split the output into lines and filter out header lines
          const lines = output.split('\n')
            .filter(line => {
              const trimmed = line.trim();
              return trimmed && 
                     !trimmed.startsWith('[') && 
                     !trimmed.startsWith('ID') && 
                     !trimmed.startsWith('--');
            });

          // Parse each line into a format object
          const formats = lines.map(line => {
            const parts = line.trim().split(/\s+/);
            const formatId = parts[0];
            const ext = parts[1];
            const resolution = parts[2] === 'audio' ? 'audio only' : parts[2];
            const fps = parts[3] === 'only' ? 'N/A' : parts[3];
            const filesize = parts.find(p => p.includes('MiB') || p.includes('KiB')) || 'N/A';
            const vcodec = parts.find(p => p.includes('avc1') || p.includes('vp09') || p.includes('av01')) || 'N/A';
            
            return {
              formatId,
              ext,
              resolution,
              filesize,
              fps,
              vcodec,
              description: line.trim() // Keep the full line for reference
            };
          });
          
          event.sender.send('video-formats', formats);
          resolve(formats);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Failed to fetch video formats'));
      }
    });
  });
});