import React, { useState, useEffect } from 'react';
import { DownloadProgress } from '../../shared/types/download';
import { VideoFormat } from '../../shared/types/video';
import DownloadProgressBar from './DownloadProgressBar';

const initialProgress: DownloadProgress = { progress: 0, size: '', speed: null, eta: null };

const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [saveDir, setSaveDir] = useState('');
  const [useProxy, setUseProxy] = useState(false);
  const [proxy, setProxy] = useState('http://127.0.0.1:7890');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress>(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const [formats, setFormats] = useState<VideoFormat[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    window.electron.getDownloadProgress((newProgress: DownloadProgress) => {
      setProgress(newProgress);
      setError(null);
      
      console.log('progress', newProgress);
    });

    window.electron.downloadComplete(() => {
      setDownloading(false);
      setProgress(initialProgress);
      setStatusMessage('Download completed successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
    });

    window.electron.downloadError((errorMessage: string) => {
      console.error('Download error:', errorMessage);
      setError(errorMessage);
      setDownloading(false);
      setProgress(initialProgress);
    });

    window.electron.downloadStop(() => {
      setDownloading(false);
      setProgress(initialProgress);
      setStatusMessage('Download stopped');
      setTimeout(() => setStatusMessage(null), 3000);
    });

    window.electron.getVideoFormats((videoFormats: VideoFormat[]) => {
      console.log('videoFormats in renderer', videoFormats);
      setFormats(videoFormats);
      setLoading(false);
      setError(null);
    });

    window.electron.fetchVideoFormatsError((error: string) => {
      console.error('Fetch video formats error:', error);
      setError(error);
      setLoading(false);
    });

    window.electron.getDownloadsPath().then((path: string) => {
      setSaveDir(path);
    });
    
    // setUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  }, []);

  const handleSelectDirectory = async () => {
    const dir = await window.electron.selectDirectory();
    if (dir) {
      setSaveDir(dir);
    }
  };

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setFormats([]);
    setSelectedFormat('');
    
    if (newUrl) {
      setLoading(true);
      window.electron.fetchVideoFormats(newUrl, useProxy ? proxy : '');
    }
  };

  const handleDownload = () => {
    if (!url || !saveDir || !selectedFormat) return;

    setDownloading(true);
    setError(null);
    try {
      window.electron.downloadVideo(url, saveDir, selectedFormat, useProxy ? proxy : '');
    } catch (error) {
      console.error('Download failed:', error);
      setError(error instanceof Error ? error.message : 'Download failed');
      setDownloading(false);
      setProgress(initialProgress);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="space-y-4">
        <input
          type="text"
          value={url}
          onChange={handleUrlChange}
          placeholder="Enter video URL like https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={downloading}
        />
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useProxy"
            checked={useProxy}
            onChange={(e) => setUseProxy(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={downloading}
          />
          <label htmlFor="useProxy" className="text-sm text-gray-600">
            Use Proxy
          </label>
        </div>

        {useProxy && (
          <input
            type="text"
            value={proxy}
            onChange={(e) => setProxy(e.target.value)}
            placeholder="Proxy address (e.g., http://127.0.0.1:7890)"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={downloading}
          />
        )}

        {loading && (
          <div className="text-center text-gray-600">
            Loading available formats...
          </div>
        )}

        {formats.length > 0 && (
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={downloading}
          >
            <option value="">Select video quality</option>
            {formats.map((format) => (
              <option key={format.formatId} value={format.formatId}>
                {format.resolution} - {format.ext} 
                {format.fps ? ` ${format.fps}fps` : ''} 
                {format.filesize ? ` (${format.filesize})` : ''}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={saveDir}
            placeholder="Select save directory"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly
          />
          <button
            onClick={handleSelectDirectory}
            disabled={downloading}
            className={`px-4 py-2 rounded-lg text-white font-medium
              ${downloading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            Browse
          </button>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading || !url || !saveDir || !selectedFormat}
          className={`w-full py-2 px-4 rounded-lg text-white font-medium
            ${downloading || !url || !saveDir || !selectedFormat
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {downloading ? 'Downloading...' : 'Download'}
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 font-medium mb-1">Download Error</div>
            <pre className="text-sm text-red-600 whitespace-pre-wrap break-words font-mono">
              {error}
            </pre>
          </div>
        )}

        {statusMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-800">{statusMessage}</div>
          </div>
        )}

        {downloading && <DownloadProgressBar progress={progress} />}
      </div>
    </div>
  );
};

export default VideoDownloader; 