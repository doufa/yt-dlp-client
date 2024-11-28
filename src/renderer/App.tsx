import React from 'react';
import VideoDownloader from './components/VideoDownloader';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Video Downloader
        </h1>
        <VideoDownloader />
      </div>
    </div>
  );
};

export default App; 