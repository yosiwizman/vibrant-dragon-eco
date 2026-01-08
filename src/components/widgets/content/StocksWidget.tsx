"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, RefreshCw, DollarSign } from "lucide-react";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function StocksWidget() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];

  const fetchStocks = async () => {
    setLoading(true);
    setError(null);

    try {
      // Using mock data for demo (replace with real API)
      const stockData = defaultSymbols.map((symbol) => ({
        symbol,
        name: symbol,
        price: Math.random() * 500 + 100,
        change: (Math.random() - 0.5) * 20,
        changePercent: (Math.random() - 0.5) * 5,
      }));

      setStocks(stockData);
    } catch (err) {
      setError('Failed to fetch stock data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (loading && stocks.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            Stocks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex-1 min-h-0 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-fuchsia-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
      <CardHeader className="p-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            Stocks
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchStocks}
            disabled={loading}
            className="h-6 w-6 p-0 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-2">
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
              className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white">{stock.symbol}</span>
                <span className="text-sm font-bold text-white">
                  ${stock.price.toFixed(2)}
                </span>
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
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}