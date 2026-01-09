"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  DollarSign, 
  Plus,
  X,
  Star,
  StarOff,
  BarChart3,
  Settings as SettingsIcon
} from "lucide-react";
import WidgetSkeleton from "../WidgetSkeleton";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: string;
  high?: number;
  low?: number;
}

interface StockConfig {
  symbols: string[];
  refreshInterval: number;
  showChart: boolean;
  showDetails: boolean;
}

export default function EnhancedStocksWidget() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<StockConfig>({
    symbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'],
    refreshInterval: 60,
    showChart: false,
    showDetails: true,
  });
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"portfolio" | "watchlist">("portfolio");

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, config.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [config.symbols, config.refreshInterval]);

  // Load watchlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('echo:stocks-watchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load watchlist:', e);
      }
    }
  }, []);

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem('echo:stocks-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const fetchStocks = async () => {
    setLoading(true);
    setError(null);

    try {
      // Mock data with realistic prices
      const stockData = config.symbols.map((symbol) => {
        const basePrice = {
          'AAPL': 180,
          'GOOGL': 140,
          'MSFT': 380,
          'AMZN': 150,
          'TSLA': 240,
          'NVDA': 500,
          'META': 350,
          'NFLX': 450,
        }[symbol] || 100;

        const change = (Math.random() - 0.5) * 10;
        const changePercent = (change / basePrice) * 100;
        const price = basePrice + change;

        return {
          symbol,
          name: symbol,
          price,
          change,
          changePercent,
          volume: Math.floor(Math.random() * 100000000),
          marketCap: `${(Math.random() * 2000 + 500).toFixed(0)}B`,
          high: price + Math.random() * 5,
          low: price - Math.random() * 5,
        };
      });

      setStocks(stockData);
    } catch (err) {
      setError('Failed to fetch stock data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter(s => s !== symbol));
  };

  const addStock = () => {
    const symbol = newSymbol.trim().toUpperCase();
    if (symbol && !config.symbols.includes(symbol)) {
      setConfig({
        ...config,
        symbols: [...config.symbols, symbol],
      });
      setNewSymbol("");
      setIsAddingStock(false);
    }
  };

  const removeStock = (symbol: string) => {
    setConfig({
      ...config,
      symbols: config.symbols.filter(s => s !== symbol),
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  if (loading && stocks.length === 0) {
    return <WidgetSkeleton />;
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
      <CardHeader className="p-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            Stocks
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsAddingStock(!isAddingStock)}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              title="Add stock"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchStocks}
              disabled={loading}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 flex-1 min-h-0 flex flex-col gap-2">
        {/* Add Stock Input */}
        {isAddingStock && (
          <div className="flex gap-2">
            <Input
              placeholder="Symbol (e.g., AAPL)"
              className="h-7 text-xs bg-slate-900/50 border-slate-700 text-white uppercase"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStock()}
              maxLength={5}
            />
            <Button
              size="sm"
              onClick={addStock}
              className="h-7 bg-green-600 text-white hover:bg-green-500"
            >
              Add
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 h-7 bg-slate-900/50">
            <TabsTrigger value="portfolio" className="text-[10px] data-[state=active]:bg-slate-700">
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="text-[10px] data-[state=active]:bg-slate-700">
              Watchlist ({watchlist.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-2 mt-2">
            {error ? (
              <div className="text-center py-4">
                <p className="text-xs text-red-400 mb-2">{error}</p>
                <Button
                  size="sm"
                  onClick={fetchStocks}
                  className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                >
                  Retry
                </Button>
              </div>
            ) : (
              stocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{stock.symbol}</span>
                      <button
                        onClick={() => 
                          watchlist.includes(stock.symbol) 
                            ? removeFromWatchlist(stock.symbol)
                            : addToWatchlist(stock.symbol)
                        }
                        className="text-slate-400 hover:text-yellow-400"
                      >
                        {watchlist.includes(stock.symbol) ? (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        ${stock.price.toFixed(2)}
                      </span>
                      {config.symbols.length > 1 && (
                        <button
                          onClick={() => removeStock(stock.symbol)}
                          className="text-slate-400 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{stock.name}</span>
                    <div
                      className={`flex items-center gap-1 text-xs ${
                        stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {stock.change >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {stock.change >= 0 ? '+' : ''}
                        {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {config.showDetails && (
                    <div className="flex items-center gap-3 text-[9px] text-slate-600">
                      <span>Vol: {formatNumber(stock.volume || 0)}</span>
                      <span>Cap: {stock.marketCap}</span>
                      <span>H: ${stock.high?.toFixed(2)}</span>
                      <span>L: ${stock.low?.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="watchlist" className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-2 mt-2">
            {watchlist.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-4">
                No stocks in watchlist. Star stocks to add them here.
              </p>
            ) : (
              watchlist.map((symbol) => {
                const stock = stocks.find(s => s.symbol === symbol);
                if (!stock) {
                  return (
                    <div key={symbol} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{symbol}</span>
                        <button
                          onClick={() => removeFromWatchlist(symbol)}
                          className="text-slate-400 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-600">Not in portfolio</p>
                    </div>
                  );
                }

                return (
                  <div
                    key={symbol}
                    className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{stock.symbol}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          ${stock.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromWatchlist(symbol)}
                          className="text-yellow-400 hover:text-slate-400"
                        >
                          <Star className="h-3 w-3 fill-yellow-400" />
                        </button>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs ${
                        stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {stock.change >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {stock.change >= 0 ? '+' : ''}
                        {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <div className="pt-2 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-[9px] text-slate-600">
            <span>Auto-refresh: {config.refreshInterval}s</span>
            <Badge variant="outline" className="text-[8px] px-1 py-0 border-blue-500/30 text-blue-400">
              Demo Data
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}