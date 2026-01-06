"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getWeather, WeatherData } from "@/services/search";
import { getLocationContext } from "@/services/context";
import { showSuccess, showError } from "@/utils/toast";
import { 
  CloudSun, 
  Thermometer, 
  Droplets, 
  Wind, 
  RefreshCw, 
  MapPin, 
  Sun, 
  Cloud, 
  CloudRain, 
  Snowflake,
  Plus,
  Trash2,
  Eye,
  Gauge,
  Sunrise as SunriseIcon,
  Sunset as SunsetIcon
} from "lucide-react";

interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface ExtendedWeatherData extends WeatherData {
  visibility?: number;
  pressure?: number;
  sunrise?: number;
  sunset?: number;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<ExtendedWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("Your Location");
  const [useCelsius, setUseCelsius] = useState(true);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("weatherLocations");
    if (saved) {
      try {
        setSavedLocations(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved locations");
      }
    }
    fetchWeather();
  }, []);

  useEffect(() => {
    if (savedLocations.length > 0) {
      localStorage.setItem("weatherLocations", JSON.stringify(savedLocations));
    }
  }, [savedLocations]);

  const fetchWeather = async (lat?: number, lng?: number, name?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let targetLat = lat;
      let targetLng = lng;
      let targetName = name;

      if (!targetLat || !targetLng) {
        const location = await getLocationContext();
        if (!location) {
          setError("Location not available");
          setLoading(false);
          return;
        }
        targetLat = location.lat;
        targetLng = location.lng;
        targetName = location.city || "Your Location";
        setCurrentLocation({ lat: targetLat, lng: targetLng });
      }
      
      const weatherData = await getWeather(targetLat, targetLng);
      setWeather(weatherData as ExtendedWeatherData);
      setLocationName(targetName || "Location");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to get weather";
      setError(errorMessage);
      showError(errorMessage);
    }
    
    setLoading(false);
  };

  const addLocation = async () => {
    if (!newLocationName.trim()) {
      showError("Please enter a location name");
      return;
    }

    if (!currentLocation) {
      showError("Current location not available");
      return;
    }

    const newLocation: SavedLocation = {
      id: Date.now().toString(),
      name: newLocationName.trim(),
      lat: currentLocation.lat,
      lng: currentLocation.lng
    };

    setSavedLocations([...savedLocations, newLocation]);
    setIsDialogOpen(false);
    setNewLocationName("");
    showSuccess("Location saved!");
  };

  const removeLocation = (id: string) => {
    setSavedLocations(savedLocations.filter(loc => loc.id !== id));
    showSuccess("Location removed");
  };

  const convertTemp = (celsius: number) => {
    if (useCelsius) return Math.round(celsius);
    return Math.round((celsius * 9/5) + 32);
  };

  const tempUnit = useCelsius ? "°C" : "°F";

  const getWeatherIcon = (description?: string) => {
    if (!description) return <CloudSun className="h-8 w-8 text-yellow-400" />;
    const desc = description.toLowerCase();
    if (desc.includes("rain")) return <CloudRain className="h-8 w-8 text-blue-400" />;
    if (desc.includes("snow")) return <Snowflake className="h-8 w-8 text-cyan-300" />;
    if (desc.includes("cloud")) return <Cloud className="h-8 w-8 text-slate-300" />;
    if (desc.includes("clear") || desc.includes("sun")) return <Sun className="h-8 w-8 text-yellow-400" />;
    return <CloudSun className="h-8 w-8 text-yellow-400" />;
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "--:--";
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  if (error && !weather) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <CloudSun className="h-4 w-4 text-blue-400" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex-1 min-h-0 flex flex-col items-center justify-center">
          <p className="text-xs text-slate-500 mb-2">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchWeather()}
            className="border-slate-600 text-slate-300"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <CloudSun className="h-4 w-4 text-blue-400" />
              Weather
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setUseCelsius(!useCelsius)}
                className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
              >
                {useCelsius ? "°C" : "°F"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fetchWeather()}
                disabled={loading}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDialogOpen(true)}
                className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-3">
          {!weather ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs text-slate-500">
                {loading ? "Loading weather..." : "Click refresh to get weather"}
              </p>
            </div>
          ) : (
            <>
              {/* Current Weather */}
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-3 w-3 text-blue-400" />
                  <span className="text-xs font-medium text-white">{locationName}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">
                      {convertTemp(weather.temperature)}{tempUnit}
                    </p>
                    <p className="text-xs text-slate-300 capitalize">{weather.description}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Feels like {convertTemp(weather.feelsLike)}{tempUnit}
                    </p>
                  </div>
                  {getWeatherIcon(weather.description)}
                </div>
              </div>

              {/* Weather Details Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="h-3 w-3 text-blue-400" />
                    <span className="text-[10px] text-slate-500">Humidity</span>
                  </div>
                  <p className="text-sm font-medium text-white mt-1">{weather.humidity}%</p>
                </div>

                <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="flex items-center gap-1.5">
                    <Wind className="h-3 w-3 text-cyan-400" />
                    <span className="text-[10px] text-slate-500">Wind</span>
                  </div>
                  <p className="text-sm font-medium text-white mt-1">{weather.windSpeed} km/h</p>
                </div>

                {weather.visibility && (
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3 w-3 text-purple-400" />
                      <span className="text-[10px] text-slate-500">Visibility</span>
                    </div>
                    <p className="text-sm font-medium text-white mt-1">{Math.round(weather.visibility / 1000)} km</p>
                  </div>
                )}

                {weather.pressure && (
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="flex items-center gap-1.5">
                      <Gauge className="h-3 w-3 text-orange-400" />
                      <span className="text-[10px] text-slate-500">Pressure</span>
                    </div>
                    <p className="text-sm font-medium text-white mt-1">{weather.pressure} hPa</p>
                  </div>
                )}
              </div>

              {/* Sunrise/Sunset */}
              {(weather.sunrise || weather.sunset) && (
                <div className="grid grid-cols-2 gap-2">
                  {weather.sunrise && (
                    <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                      <div className="flex items-center gap-1.5">
                        <SunriseIcon className="h-3 w-3 text-orange-400" />
                        <span className="text-[10px] text-slate-500">Sunrise</span>
                      </div>
                      <p className="text-sm font-medium text-white mt-1">{formatTime(weather.sunrise)}</p>
                    </div>
                  )}

                  {weather.sunset && (
                    <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                      <div className="flex items-center gap-1.5">
                        <SunsetIcon className="h-3 w-3 text-purple-400" />
                        <span className="text-[10px] text-slate-500">Sunset</span>
                      </div>
                      <p className="text-sm font-medium text-white mt-1">{formatTime(weather.sunset)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Saved Locations */}
              {savedLocations.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3 w-3" />
                    <span>Saved Locations</span>
                  </div>
                  {savedLocations.map(location => (
                    <div
                      key={location.id}
                      className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 flex items-center justify-between"
                    >
                      <button
                        onClick={() => fetchWeather(location.lat, location.lng, location.name)}
                        className="flex-1 text-left"
                      >
                        <p className="text-xs text-white font-medium">{location.name}</p>
                        <p className="text-[10px] text-slate-500">Click to view weather</p>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLocation(location.id)}
                        className="h-5 w-5 p-0 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Location Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Save Current Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Location Name</label>
              <Input
                placeholder="e.g., Home, Office, Vacation Spot"
                className="bg-slate-800 border-slate-700 text-white"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-500">
              This will save the current location's weather for quick access.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewLocationName("");
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={addLocation}
                className="bg-blue-600 text-white hover:bg-blue-500"
              >
                Save Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}