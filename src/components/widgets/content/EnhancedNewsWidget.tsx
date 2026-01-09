"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ExternalLink, 
  RefreshCw, 
  Newspaper,
  Loader2,
  Bookmark,
  BookmarkCheck,
  Globe,
  TrendingUp,
  Briefcase,
  Cpu,
  Heart
} from "lucide-react";

interface NewsSource {
  name: string;
  url: string;
  category: string;
  icon: React.ReactNode;
}

const NEWS_SOURCES: NewsSource[] = [
  { name: 'Google News', url: 'https://news.google.com/topstories', category: 'general', icon: <Globe className="h-3 w-3" /> },
  { name: 'BBC News', url: 'https://www.bbc.com/news', category: 'general', icon: <Globe className="h-3 w-3" /> },
  { name: 'CNN', url: 'https://www.cnn.com', category: 'general', icon: <Globe className="h-3 w-3" /> },
  { name: 'Reuters', url: 'https://www.reuters.com', category: 'general', icon: <Globe className="h-3 w-3" /> },
  { name: 'TechCrunch', url: 'https://techcrunch.com', category: 'tech', icon: <Cpu className="h-3 w-3" /> },
  { name: 'The Verge', url: 'https://www.theverge.com', category: 'tech', icon: <Cpu className="h-3 w-3" /> },
  { name: 'Bloomberg', url: 'https://www.bloomberg.com', category: 'business', icon: <Briefcase className="h-3 w-3" /> },
  { name: 'CNBC', url: 'https://www.cnbc.com', category: 'business', icon: <Briefcase className="h-3 w-3" /> },
  { name: 'ESPN', url: 'https://www.espn.com', category: 'sports', icon: <TrendingUp className="h-3 w-3" /> },
  { name: 'WebMD', url: 'https://www.webmd.com', category: 'health', icon: <Heart className="h-3 w-3" /> },
];

export default function EnhancedNewsWidget() {
  const [url, setUrl] = useState('https://news.google.com/topstories');
  const [inputUrl, setInputUrl] = useState(url);
  const [isEditing, setIsEditing] = useState(false);
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("general");
  const [currentSource, setCurrentSource] = useState<NewsSource>(NEWS_SOURCES[0]);

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('echo:news-bookmarks');
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load bookmarks:', e);
      }
    }
  }, []);

  // Save bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem('echo:news-bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const handleUrlChange = () => {
    setUrl(inputUrl);
    setIsEditing(false);
    setIsLoading(true);
    setKey((prev) => prev + 1);
    
    // Find matching source
    const source = NEWS_SOURCES.find(s => s.url === inputUrl);
    if (source) {
      setCurrentSource(source);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setKey((prev) => prev + 1);
  };

  const selectSource = (source: NewsSource) => {
    setInputUrl(source.url);
    setUrl(source.url);
    setCurrentSource(source);
    setIsEditing(false);
    setIsLoading(true);
    setKey((prev) => prev + 1);
  };

  const toggleBookmark = () => {
    if (bookmarks.includes(url)) {
      setBookmarks(bookmarks.filter(b => b !== url));
    } else {
      setBookmarks([...bookmarks, url]);
    }
  };

  const categories = Array.from(new Set(NEWS_SOURCES.map(s => s.category)));
  const filteredSources = NEWS_SOURCES.filter(s => s.category === activeCategory);

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
              onClick={toggleBookmark}
              className="h-6 w-6 p-0 text-slate-400 hover:text-yellow-400"
              title={bookmarks.includes(url) ? "Remove bookmark" : "Bookmark"}
            >
              {bookmarks.includes(url) ? (
                <BookmarkCheck className="h-3.5 w-3.5 text-yellow-400" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
            </Button>
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
            {/* Custom URL */}
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
            
            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
              <TabsList className="grid w-full grid-cols-5 h-6 bg-slate-900/50">
                {categories.map(cat => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat} 
                    className="text-[9px] capitalize data-[state=active]:bg-slate-700"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Source Buttons */}
            <div className="flex flex-wrap gap-1">
              {filteredSources.map((source) => (
                <Button
                  key={source.name}
                  size="sm"
                  variant="outline"
                  onClick={() => selectSource(source)}
                  className="h-6 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-700 flex items-center gap-1"
                >
                  {source.icon}
                  {source.name}
                </Button>
              ))}
            </div>

            {/* Bookmarks */}
            {bookmarks.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500">Bookmarks:</p>
                <div className="flex flex-wrap gap-1">
                  {bookmarks.map((bookmark, idx) => {
                    const source = NEWS_SOURCES.find(s => s.url === bookmark);
                    return (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="cursor-pointer text-[9px] border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                        onClick={() => {
                          setInputUrl(bookmark);
                          setUrl(bookmark);
                          if (source) setCurrentSource(source);
                          setIsEditing(false);
                          setIsLoading(true);
                          setKey((prev) => prev + 1);
                        }}
                      >
                        <Star className="h-2.5 w-2.5 mr-1 fill-yellow-400" />
                        {source?.name || new URL(bookmark).hostname}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* News Iframe */}
        <div className="flex-1 relative bg-slate-900 rounded-lg overflow-hidden min-h-0">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
              <Loader2 className="h-6 w-6 animate-spin text-fuchsia-400" />
            </div>
          )}
          <iframe
            key={key}
            src={url}
            className="absolute inset-0 w-full h-full border-0"
            title="News Feed"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            loading="lazy"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              console.error('Failed to load iframe:', url);
              setIsLoading(false);
            }}
          />
        </div>

        {/* Footer */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] text-slate-600">
            <div className="flex items-center gap-1">
              {currentSource.icon}
              <span>{currentSource.name}</span>
            </div>
            <Badge variant="outline" className="text-[8px] px-1 py-0 border-slate-600 text-slate-500 capitalize">
              {currentSource.category}
            </Badge>
          </div>
          <p className="text-[8px] text-slate-700 text-center">
            Some sites may block embedding. Try different sources if content doesn't load.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}