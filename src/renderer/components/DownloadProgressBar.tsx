import React from 'react';
import { DownloadProgress as DownloadProgressType } from '../../shared/types/download';

interface Props {
  progress: DownloadProgressType;
}

const DownloadProgressBar: React.FC<Props> = ({ progress }) => {
  return (
    <div className="space-y-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress.progress}%` }}
        ></div>
      </div>
      
      <div className="text-sm text-gray-600 flex justify-between">
        <span>{progress.progress.toFixed(1)}%</span>
        <span>{progress.size}</span>
      </div>
      
      {(progress.speed || progress.eta) && (
        <div className="text-sm text-gray-600 flex justify-between">
          {progress.speed && <span>Speed: {progress.speed}</span>}
          {progress.eta && <span>ETA: {progress.eta}</span>}
        </div>
      )}
      
      <div className="mt-4 max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3">
        <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
          Downloading... Check console for detailed progress.
        </pre>
      </div>
    </div>
  );
};

export default DownloadProgressBar; 