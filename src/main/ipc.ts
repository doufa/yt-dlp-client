import { app, dialog, ipcMain } from 'electron';
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
ipcMain.handle('download-video', async (_event, url: string, saveDir: string, formatId: string, proxy: string) => {
  try {
    console.log(`download-video: ${url}, ${saveDir}, ${formatId}, ${proxy}`);

    // First, get the video title and extension
    // if proxy is empty, don't use proxy
    const proxyCommand = proxy ? `--proxy ${proxy}` : '';
    const titleCommand = `"${ytDlpPath}" ${proxyCommand} --get-title --get-filename -f ${formatId} "${url}"`;
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
    const command = `"${ytDlpPath}" ${proxyCommand} -f "${formatId}+bestaudio" --merge-output-format ${ext} -o "${path.join(saveDir, `${sanitizedTitle}.${ext}`)}" --ffmpeg-location "${ffmpegPath}" "${url}"`;

    console.log(`Executing command: ${command}`);

    const downloadProcess = exec(command);

    downloadProcess.stdout?.on('data', (data) => {
      console.log(`stdout: ${data}`);
      
      const dataStr = data.toString();
      const progressMatch = dataStr.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?\s*(\d+\.?\d*)(GiB|MiB|KiB|B)(?:\s+at\s+(\d+\.?\d*)(GiB|MiB|KiB|B)\/s)?(?:\s+ETA\s+(\d+:\d+))?(?:\s+\(frag\s+\d+\/\d+\))?/);
      
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
        _event.sender.send('download-complete');
      } else {
        console.error(`Download process exited with code ${code}`);
        _event.sender.send('download-error', `Download process exited with code ${code}`);
      }
    });

  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}); 

// Add these IPC handlers
ipcMain.handle('fetch-video-formats', (event, url, proxy) => {
  let ytdl: any;
  
  try {
    const proxyCommand = proxy ? `--proxy ${proxy}` : '';
    const command = `"${ytDlpPath}" ${proxyCommand} -F "${url}"`;
    
    ytdl = exec(command, { maxBuffer: 1024 * 1024 * 10 });
    let output = '';

    ytdl.stdout?.on('data', (data: any) => {
      output += data;
    });

    ytdl.stderr?.on('data', (data: any) => {
      console.error(`stderr: ${data}`);
      handleError(event, data.toString(), ytdl);
    });

    ytdl.on('error', (error: any) => {
      console.error('Process error:', error);
      handleError(event, error.message, ytdl);
    });

    ytdl.on('close', (code: any) => {
      if (code === 0) {
        try {
          if (!output.includes('Available formats for')) {
            throw new Error('No format information found');
          }
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
            const filesize = parts.find(p => p.includes('MiB') || p.includes('KiB') || p.includes('GiB')) || 'N/A';
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
        } catch (error) {
          console.error('Format parsing error:', error);
          handleError(event, error, ytdl);
        }
      }
    });
  } catch (error: any) {
    console.error('Initial setup error:', error);
    handleError(event, error, ytdl);
  }
});

ipcMain.handle('get-downloads-path', () => {
  return path.join(app.getPath('downloads'), 'youtube');
});

// Add helper function for error handling
function handleError(event: Electron.IpcMainInvokeEvent, error: any, process?: any) {
  event.sender.send('fetch-video-formats-error', error);
  if (process?.pid) {
    require('tree-kill')(process.pid);
  }
}