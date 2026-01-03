import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getWeather, WeatherData } from "@/services/search";
import { getLocationContext } from "@/services/context";
import { CloudSun, Thermometer, Droplets, Wind, RefreshCw, MapPin } from "lucide-react";

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("Your Location");

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const location = await getLocationContext();
      if (!location) {
        setError("Location not available");
        setLoading(false);
        return;
      }
      
      const weatherData = await getWeather(location.lat, location.lng);
      setWeather(weatherData);
      setLocationName(location.city || "Your Location");
    } catch (e: any) {
      setError(e.message || "Failed to get weather");
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Try to fetch weather on mount (silently)
    fetchWeather();
  }, []);

  if (error) {
    return (
      <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <CloudSun className="h-5 w-5" />
              <span className="text-sm">Weather</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchWeather}
              disabled={loading}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <CloudSun className="h-5 w-5" />
              <span className="text-sm">Weather</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchWeather}
              disabled={loading}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {loading ? "Loading..." : "Click refresh to get weather"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-fuchsia-500/20 bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">{locationName}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchWeather}
            disabled={loading}
            className="text-slate-400 hover:text-white h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-white">{weather.temperature}°C</p>
            <p className="text-sm text-slate-400">{weather.description}</p>
          </div>
          <CloudSun className="h-12 w-12 text-yellow-400" />
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Thermometer className="h-3 w-3 text-orange-400" />
            <span>Feels {weather.feelsLike}°</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Droplets className="h-3 w-3 text-blue-400" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Wind className="h-3 w-3 text-cyan-400" />
            <span>{weather.windSpeed} km/h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}