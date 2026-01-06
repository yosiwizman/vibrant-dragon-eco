import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getWeather, WeatherData } from "@/services/search";
import { getLocationContext } from "@/services/context";
import { CloudSun, Thermometer, Droplets, Wind, RefreshCw, MapPin, Sun, Cloud, CloudRain, Snowflake } from "lucide-react";

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("Your Location");
  const [useCelsius, setUseCelsius] = useState(true);

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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to get weather";
      setError(errorMessage);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const convertTemp = (celsius: number) => {
    if (useCelsius) return Math.round(celsius);
    return Math.round((celsius * 9/5) + 32);
  };

  const tempUnit = useCelsius ? "°C" : "°F";

  const getWeatherIcon = () => {
    if (!weather) return <CloudSun className="h-10 w-10 text-yellow-400" />;
    const desc = weather.description.toLowerCase();
    if (desc.includes("rain")) return <CloudRain className="h-10 w-10 text-blue-400" />;
    if (desc.includes("snow")) return <Snowflake className="h-10 w-10 text-cyan-300" />;
    if (desc.includes("cloud")) return <Cloud className="h-10 w-10 text-slate-300" />;
    if (desc.includes("clear") || desc.includes("sun")) return <Sun className="h-10 w-10 text-yellow-400" />;
    return <CloudSun className="h-10 w-10 text-yellow-400" />;
  };

  if (error) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <CloudSun className="h-5 w-5" />
              <span className="text-sm font-medium">Weather</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchWeather}
              disabled={loading}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-xs text-slate-500 mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWeather}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <CloudSun className="h-5 w-5" />
              <span className="text-sm font-medium">Weather</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchWeather}
              disabled={loading}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-slate-500">
              {loading ? "Loading weather..." : "Click refresh to get weather"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full">
      <CardContent className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-fuchsia-400" />
            <span className="text-sm font-medium text-white">{locationName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseCelsius(!useCelsius)}
              className="h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700"
            >
              {useCelsius ? "°C" : "°F"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchWeather}
              disabled={loading}
              className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        
        {/* Main Weather Display */}
        <div className="flex items-center justify-between flex-1">
          <div>
            <p className="text-3xl font-bold text-white">
              {convertTemp(weather.temperature)}{tempUnit}
            </p>
            <p className="text-sm text-slate-300 capitalize">{weather.description}</p>
          </div>
          {getWeatherIcon()}
        </div>
        
        {/* Weather Details */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700">
          <div className="flex items-center gap-1.5">
            <Thermometer className="h-4 w-4 text-orange-400" />
            <div>
              <p className="text-xs text-slate-500">Feels</p>
              <p className="text-sm font-medium text-white">{convertTemp(weather.feelsLike)}{tempUnit}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Droplets className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs text-slate-500">Humidity</p>
              <p className="text-sm font-medium text-white">{weather.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="h-4 w-4 text-cyan-400" />
            <div>
              <p className="text-xs text-slate-500">Wind</p>
              <p className="text-sm font-medium text-white">{weather.windSpeed} km/h</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}