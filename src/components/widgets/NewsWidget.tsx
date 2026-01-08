import React, { useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface NewsWidgetProps {
  config?: {
    url?: string;
    title?: string;
  };
}

export const NewsWidget: React.FC<NewsWidgetProps> = ({ config }) => {
  const [url, setUrl] = useState(
    config?.url || 'https://news.google.com/topstories'
  );
  const [inputUrl, setInputUrl] = useState(url);
  const [isEditing, setIsEditing] = useState(false);
  const [key, setKey] = useState(0);

  const handleUrlChange = () => {
    setUrl(inputUrl);
    setIsEditing(false);
    setKey((prev) => prev + 1); // Force iframe reload
  };

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const popularSources = [
    { name: 'Google News', url: 'https://news.google.com/topstories' },
    { name: 'BBC News', url: 'https://www.bbc.com/news' },
    { name: 'CNN', url: 'https://www.cnn.com' },
    { name: 'Reuters', url: 'https://www.reuters.com' },
    { name: 'TechCrunch', url: 'https://techcrunch.com' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h3 className="text-lg font-semibold">
          {config?.title || 'News'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Change Source"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mb-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter news URL..."
              className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
            <button
              onClick={handleUrlChange}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Load
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {popularSources.map((source) => (
              <button
                key={source.name}
                onClick={() => {
                  setInputUrl(source.url);
                  setUrl(source.url);
                  setIsEditing(false);
                  setKey((prev) => prev + 1);
                }}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {source.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
        <iframe
          key={key}
          src={url}
          className="absolute inset-0 w-full h-full border-0"
          title="News Feed"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          loading="lazy"
        />
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        Viewing: {new URL(url).hostname}
      </div>
    </div>
  );
};