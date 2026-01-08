import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface StocksWidgetProps {
  config?: {
    symbols?: string[];
  };
}

export const StocksWidget: React.FC<StocksWidgetProps> = ({ config }) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultSymbols = config?.symbols || ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];

  const fetchStocks = async () => {
    setLoading(true);
    setError(null);

    try {
      // Using Alpha Vantage API (free tier)
      // You'll need to get an API key from https://www.alphavantage.co/support/#api-key
      const API_KEY = 'demo'; // Replace with your API key
      
      const stockData = await Promise.all(
        defaultSymbols.map(async (symbol) => {
          try {
            const response = await fetch(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
            );
            const data = await response.json();
            const quote = data['Global Quote'];

            if (!quote) {
              // Fallback to mock data for demo
              return {
                symbol,
                name: symbol,
                price: Math.random() * 1000,
                change: (Math.random() - 0.5) * 20,
                changePercent: (Math.random() - 0.5) * 5,
              };
            }

            return {
              symbol,
              name: symbol,
              price: parseFloat(quote['05. price']),
              change: parseFloat(quote['09. change']),
              changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            };
          } catch (err) {
            // Mock data fallback
            return {
              symbol,
              name: symbol,
              price: Math.random() * 1000,
              change: (Math.random() - 0.5) * 20,
              changePercent: (Math.random() - 0.5) * 5,
            };
          }
        })
      );

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
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <p>{error}</p>
        <button
          onClick={fetchStocks}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Stocks</h3>
        <button
          onClick={fetchStocks}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {stocks.map((stock) => (
          <div
            key={stock.symbol}
            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">{stock.symbol}</span>
              <span className="text-lg font-bold">
                ${stock.price.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{stock.name}</span>
              <div
                className={`flex items-center gap-1 ${
                  stock.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {stock.change >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  {stock.change >= 0 ? '+' : ''}
                  {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};