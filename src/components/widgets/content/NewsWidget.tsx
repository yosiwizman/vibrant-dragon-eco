"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw, Newspaper } from "lucide-react";

export default function NewsWidget() {
  const [url, setUrl] = useState('https://news.google.com/topstories');
  const [inputUrl, setInputUrl] = useState(url);
  const [isEditing, setIsEditing] = useState(false);
  const [key, setKey] = useState(0);

  const handleUrlChange = () => {
    setUrl(inputUrl);
    setIsEditing(false);
    setKey((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const popularSources = [
    { name: 'Google', url: 'https://news.google.com/topstories' },
    { name: 'BBC', url: 'https://www.bbc.com/news' },
    { name: 'CNN', url: 'https://www.cnn.com' },
    { name: 'Reuters', url: 'https://www.reuters.com' },
    { name: 'Tech', url: 'https://techcrunch.com' },
  ];

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
      <CardHeader className="p-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-blue-400" />
            News
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              title="Change Source"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 flex-1 min-h-0 flex flex-col gap-2">
        {isEditing && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Enter news URL..."
                className="h-7 text-xs bg-slate-900/50 border-slate-700 text-white"
              />
              <Button
                size="sm"
                onClick={handleUrlChange}
                className="h-7 bg-blue-600 text-white hover:bg-blue-500"
              >
                Load
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {popularSources.map((source) => (
                <Badge
                  key={source.name}
                  variant="outline"
                  className="cursor-pointer text-[10px] border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => {
                    setInputUrl(source.url);
                    setUrl(source.url);
                    setIsEditing(false);
                    setKey((prev) => prev + 1);
                  }}
                >
                  {source.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 relative bg-slate-900 rounded-lg overflow-hidden min-h-0">
          <iframe
            key={key}
            src={url}
            className="absolute inset-0 w-full h-full border-0"
            title="News Feed"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            loading="lazy"
          />
        </div>

        <p className="text-[9px] text-slate-600 text-center">
          {new URL(url).hostname}
        </p>
      </CardContent>
    </Card>
  );
}