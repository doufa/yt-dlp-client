import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { promisify } from 'util';
import { bootstrap } from 'global-agent';

// Bootstrap global-agent
bootstrap();

const mkdir = promisify(fs.mkdir);
const chmod = promisify(fs.chmod);

// Helper function to get proxy from system
function getSystemProxy(): string | undefined {
  return process.env.HTTPS_PROXY || 
         process.env.https_proxy || 
         process.env.HTTP_PROXY || 
         process.env.http_proxy;
}

// Configure proxy
const proxy = getSystemProxy();
if (proxy) {
  console.log(`Using proxy: ${proxy}`);
  global.GLOBAL_AGENT.HTTP_PROXY = proxy;
}

interface BinaryInfo {
  name: string;
  getUrl: (platform: string) => string;
  filename: (platform: string) => string;
}

const BINARIES: BinaryInfo[] = [
  {
    name: 'yt-dlp',
    getUrl: (platform: string) => {
      const base = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/';
      switch (platform) {
        case 'win32':
          return `${base}yt-dlp.exe`;
        case 'darwin':
          return `${base}yt-dlp_macos`;
        default:
          return `${base}yt-dlp`;
      }
    },
    filename: (platform: string) => platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
  },
  {
    name: 'ffmpeg',
    getUrl: (platform: string) => {
      const version = '6.1.1';
      switch (platform) {
        case 'win32':
          return `https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip`;
        case 'darwin':
          return `https://evermeet.cx/ffmpeg/ffmpeg-${version}.zip`;
        default:
          return `https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz`;
      }
    },
    filename: (platform: string) => platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
  }
];

async function downloadFile(url: string, destPath: string): Promise<void> {
  console.log(`Downloading from ${url} to ${destPath}`);
  
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      // Add headers to help with GitHub rate limiting
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (!redirectUrl) {
          reject(new Error('Redirect location not found'));
          return;
        }
        console.log(`Following redirect to: ${redirectUrl}`);
        downloadFile(redirectUrl, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }

      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);

      let downloaded = 0;
      const total = parseInt(response.headers['content-length'] || '0', 10);

      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (total) {
          const percent = (downloaded / total * 100).toFixed(2);
          process.stdout.write(`Progress: ${percent}%\r`);
        }
      });

      fileStream.on('finish', () => {
        process.stdout.write('\n');
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => reject(err));
      });
    });

    request.on('error', (err) => {
      fs.unlink(destPath, () => reject(err));
    });

    // Set a timeout
    request.setTimeout(30000, () => {
      request.destroy();
      fs.unlink(destPath, () => reject(new Error('Download timeout')));
    });
  });
}

async function extractFFmpeg(platform: string, downloadPath: string, destPath: string): Promise<void> {
  console.log('Extracting FFmpeg...');
  
  if (platform === 'win32') {
    const extract = require('extract-zip');
    await extract(downloadPath, { dir: path.dirname(destPath) });
    // Move ffmpeg.exe from the extracted directory to the destination
    const extractedDir = path.join(path.dirname(destPath), 'ffmpeg-master-latest-win64-gpl', 'bin');
    fs.renameSync(path.join(extractedDir, 'ffmpeg.exe'), destPath);
    // Clean up
    fs.rmSync(path.dirname(extractedDir), { recursive: true });
  } else if (platform === 'darwin') {
    const { execSync } = require('child_process');
    execSync(`unzip -o "${downloadPath}" -d "${path.dirname(destPath)}"`);
  } else {
    const { execSync } = require('child_process');
    execSync(`tar xf "${downloadPath}" -C "${path.dirname(destPath)}" --strip-components=1`);
  }
  
  // Clean up downloaded archive
  fs.unlinkSync(downloadPath);
}

async function main() {
  const platform = process.platform;
  console.log(`Detected platform: ${platform}`);

  // Create lib directory structure
  const libPath = path.join(__dirname, '..', 'lib', platform);
  await mkdir(libPath, { recursive: true });

  for (const binary of BINARIES) {
    const url = binary.getUrl(platform);
    const filename = binary.filename(platform);
    const destPath = path.join(libPath, filename);
    
    try {
      if (binary.name === 'ffmpeg') {
        // For FFmpeg, we need to handle archive extraction
        const downloadPath = path.join(libPath, `ffmpeg-temp.${platform === 'win32' ? 'zip' : platform === 'darwin' ? 'zip' : 'tar.xz'}`);
        await downloadFile(url, downloadPath);
        await extractFFmpeg(platform, downloadPath, destPath);
      } else {
        // Direct download for yt-dlp
        await downloadFile(url, destPath);
      }
      
      // Make the binary executable on Unix-like systems
      if (platform !== 'win32') {
        await chmod(destPath, 0o755);
      }
      
      console.log(`Successfully downloaded ${binary.name}`);
    } catch (error) {
      console.error(`Failed to download ${binary.name}:`, error);
      process.exit(1);
    }
  }
}

main().catch(console.error); 