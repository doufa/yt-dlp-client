import React, { useState, useEffect } from 'react';
import { DownloadProgress } from '../../shared/types/download';
import DownloadProgressBar from './DownloadProgressBar';

const initialProgress: DownloadProgress = { progress: 0, size: '', speed: null, eta: null };

const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [saveDir, setSaveDir] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress>(initialProgress);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.electron.getDownloadProgress((newProgress: DownloadProgress) => {
      setProgress(newProgress);
      
      console.log('progress', newProgress);
      if (newProgress.progress === 100) {
        setDownloading(false);
        setProgress(initialProgress);
      }
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
    });

    // todo set url to https://www.youtube.com/watch?v=JzPfMbG1vrE&ab_channel=ExplainerVideoCafe, saveDir to C:\Users\doufa\Downloads for test
    setUrl('https://www.youtube.com/watch?v=JzPfMbG1vrE&ab_channel=ExplainerVideoCafe');
    setSaveDir('C:\\Users\\doufa\\Downloads\\youtube');
  }, []);

  const handleSelectDirectory = async () => {
    const dir = await window.electron.selectDirectory();
    if (dir) {
      setSaveDir(dir);
    }
  };

  const handleDownload = () => {
    if (!url || !saveDir) return;

    setDownloading(true);
    setError(null);
    try {
      window.electron.downloadVideo(url, saveDir);
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
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter video URL"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={downloading}
        />
        
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
          disabled={downloading || !url || !saveDir}
          className={`w-full py-2 px-4 rounded-lg text-white font-medium
            ${downloading || !url || !saveDir
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

        {downloading && <DownloadProgressBar progress={progress} />}
      </div>
    </div>
  );
};

export default VideoDownloader; 