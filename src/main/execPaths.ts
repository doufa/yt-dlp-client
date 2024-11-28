import * as path from 'path';

const isDev = process.env.NODE_ENV === 'development';

type ExecutableType = 'ffmpeg' | 'yt-dlp';

function getExecutableName(type: ExecutableType): string {
    const isWindows = process.platform === 'win32';
    const executableNames = {
        'ffmpeg': isWindows ? 'ffmpeg.exe' : 'ffmpeg',
        'yt-dlp': isWindows ? 'yt-dlp.exe' : 'yt-dlp'
    };
    return executableNames[type];
}

function getExecutablePath(type: ExecutableType): string {
    const platform = process.platform;
    const executableName = getExecutableName(type);
    
    if (isDev) {
        // In development, we need to go up from .webpack to the project root
        return path.join(__dirname, '..', '..', 'lib', platform, executableName);
    } else {
        // In production, use the path relative to the app resources
        return path.join(process.resourcesPath, 'lib', platform, executableName);
    }
}

export const execPaths = {
    ffmpeg: getExecutablePath('ffmpeg'),
    ytDlp: getExecutablePath('yt-dlp')
}; 