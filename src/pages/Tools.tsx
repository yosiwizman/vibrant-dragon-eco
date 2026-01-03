import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { showError, showSuccess } from "@/utils/toast";
import { searchWeb, getWeather, findNearbyPlaces, geocodeAddress } from "../services/search";
import { getCurrentLocation } from "../services/location";
import { openAppleMaps } from "../services/maps";
import { 
  Search, 
  MapPin, 
  Cloud, 
  Calculator, 
  Clock, 
  Globe,
  Thermometer,
  Wind,
  Droplets,
  Navigation,
  ExternalLink
} from "lucide-react";

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  windSpeed: number;
  location: string;
}

export default function Tools() {
  const [activeTab, setActiveTab] = useState("search");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ title: string; url: string; snippet?: string; source: string }>
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Nearby state
  const [nearbyQuery, setNearbyQuery] = useState("");
  const [nearby, setNearby] = useState<
    Array<{ name: string; lat: number; lon: number; distanceMeters: number; type?: string }>
  >([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  
  // Weather state
  const [weatherLocation, setWeatherLocation] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  
  // Calculator state
  const [calcExpression, setCalcExpression] = useState("");
  const [calcResult, setCalcResult] = useState<string | null>(null);
  
  // Timezone state
  const [timezones] = useState([
    { name: "New York", tz: "America/New_York" },
    { name: "Los Angeles", tz: "America/Los_Angeles" },
    { name: "London", tz: "Europe/London" },
    { name: "Paris", tz: "Europe/Paris" },
    { name: "Tokyo", tz: "Asia/Tokyo" },
    { name: "Sydney", tz: "Australia/Sydney" },
    { name: "Dubai", tz: "Asia/Dubai" },
    { name: "Singapore", tz: "Asia/Singapore" },
  ]);

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await searchWeb(searchQuery.trim());
      setSearchResults(res);
    } catch (e: any) {
      showError(e.message || "Search failed");
    }
    setSearchLoading(false);
  };

  const doNearby = async () => {
    if (!nearbyQuery.trim()) return;
    setNearbyLoading(true);
    try {
      const loc = await getCurrentLocation();
      const places = await findNearbyPlaces(nearbyQuery.trim(), loc);
      setNearby(places);
    } catch (e: any) {
      showError(e.message || "Nearby search failed");
    }
    setNearbyLoading(false);
  };

  const doWeather = async () => {
    setWeatherLoading(true);
    try {
      let lat: number, lon: number;
      let locationName = "Your Location";
      
      if (weatherLocation.trim()) {
        const geocoded = await geocodeAddress(weatherLocation.trim());
        if (!geocoded) {
          showError("Could not find that location");
          setWeatherLoading(false);
          return;
        }
        lat = geocoded.lat;
        lon = geocoded.lon;
        locationName = weatherLocation.trim();
      } else {
        const loc = await getCurrentLocation();
        lat = loc.lat;
        lon = loc.lng;
      }
      
      const weatherData = await getWeather(lat, lon);
      setWeather({ ...weatherData, location: locationName });
    } catch (e: any) {
      showError(e.message || "Weather fetch failed");
    }
    setWeatherLoading(false);
  };

  const doCalculate = () => {
    try {
      // Safe evaluation using Function constructor
      const sanitized = calcExpression.replace(/[^0-9+\-*/().%\s]/g, "");
      if (!sanitized) {
        setCalcResult("Invalid expression");
        return;
      }
      const result = new Function(`return ${sanitized}`)();
      setCalcResult(String(result));
    } catch {
      setCalcResult("Error");
    }
  };

  const getTimeInZone = (tz: string) => {
    try {
      return new Date().toLocaleTimeString("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "N/A";
    }
  };

  const getDateInZone = (tz: string) => {
    try {
      return new Date().toLocaleDateString("en-US", {
        timeZone: tz,
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Globe className="h-8 w-8 text-fuchsia-400" />
            Tools
          </h1>
          <p className="text-slate-400 mt-1">Useful utilities at your fingertips</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="search" className="data-[state=active]:bg-fuchsia-600">
              <Search className="h-4 w-4 mr-2" /> Search
            </TabsTrigger>
            <TabsTrigger value="weather" className="data-[state=active]:bg-fuchsia-600">
              <Cloud className="h-4 w-4 mr-2" /> Weather
            </TabsTrigger>
            <TabsTrigger value="nearby" className="data-[state=active]:bg-fuchsia-600">
              <MapPin className="h-4 w-4 mr-2" /> Nearby
            </TabsTrigger>
            <TabsTrigger value="calculator" className="data-[state=active]:bg-fuchsia-600">
              <Calculator className="h-4 w-4 mr-2" /> Calculator
            </TabsTrigger>
            <TabsTrigger value="time" className="data-[state=active]:bg-fuchsia-600">
              <Clock className="h-4 w-4 mr-2" /> World Clock
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="mt-4">
            <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Search className="h-5 w-5 text-fuchsia-400" />
                  Web Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    placeholder="Search the web..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doSearch()}
                  />
                  <Button 
                    onClick={doSearch} 
                    className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                    disabled={searchLoading}
                  >
                    {searchLoading ? "..." : "Search"}
                  </Button>
                </div>
                <div className="space-y-2">
                  {searchResults.map((r, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                      <div className="flex items-start justify-between">
                        <a
                          className="font-medium text-fuchsia-300 hover:underline"
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {r.title}
                        </a>
                        <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs ml-2">
                          {r.source}
                        </Badge>
                      </div>
                      {r.snippet && (
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{r.snippet}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weather Tab */}
          <TabsContent value="weather" className="mt-4">
            <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-fuchsia-400" />
                  Weather
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    placeholder="Enter city name (or leave empty for current location)"
                    value={weatherLocation}
                    onChange={(e) => setWeatherLocation(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doWeather()}
                  />
                  <Button 
                    onClick={doWeather} 
                    className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                    disabled={weatherLoading}
                  >
                    {weatherLoading ? "..." : "Get Weather"}
                  </Button>
                </div>
                
                {weather && (
                  <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white">{weather.location}</h3>
                        <p className="text-slate-400">{weather.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-5xl font-bold text-white">{weather.temperature}°C</p>
                        <p className="text-sm text-slate-400">Feels like {weather.feelsLike}°C</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Thermometer className="h-5 w-5 text-orange-400" />
                        <div>
                          <p className="text-xs text-slate-500">Feels Like</p>
                          <p className="font-medium">{weather.feelsLike}°C</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Droplets className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="text-xs text-slate-500">Humidity</p>
                          <p className="font-medium">{weather.humidity}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Wind className="h-5 w-5 text-cyan-400" />
                        <div>
                          <p className="text-xs text-slate-500">Wind</p>
                          <p className="font-medium">{weather.windSpeed} km/h</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nearby Tab */}
          <TabsContent value="nearby" className="mt-4">
            <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-fuchsia-400" />
                  Nearby Places
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    placeholder='Search nearby (e.g., "coffee", "gas station", "pharmacy")'
                    value={nearbyQuery}
                    onChange={(e) => setNearbyQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doNearby()}
                  />
                  <Button 
                    onClick={doNearby} 
                    className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                    disabled={nearbyLoading}
                  >
                    {nearbyLoading ? "..." : "Find"}
                  </Button>
                </div>
                <div className="space-y-2">
                  {nearby.map((p, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white">{p.name.split(",")[0]}</div>
                          <div className="text-sm text-slate-400 mt-1">
                            {(p.distanceMeters / 1000).toFixed(1)} km away
                            {p.type && <span className="ml-2 text-slate-500">• {p.type}</span>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          onClick={() => openAppleMaps(p.lat, p.lon, p.name)}
                        >
                          <Navigation className="h-4 w-4 mr-1" /> Navigate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="mt-4">
            <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-fuchsia-400" />
                  Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 font-mono text-lg"
                    placeholder="Enter expression (e.g., 2 + 2 * 3)"
                    value={calcExpression}
                    onChange={(e) => setCalcExpression(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doCalculate()}
                  />
                  <Button 
                    onClick={doCalculate} 
                    className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                  >
                    =
                  </Button>
                </div>
                {calcResult !== null && (
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <p className="text-sm text-slate-400">Result:</p>
                    <p className="text-3xl font-bold text-white font-mono">{calcResult}</p>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "(", "+", ")", "%", "C", "="].map((btn) => (
                    <Button
                      key={btn}
                      variant="outline"
                      className="border-slate-600 text-white hover:bg-slate-700 h-12 text-lg font-mono"
                      onClick={() => {
                        if (btn === "C") {
                          setCalcExpression("");
                          setCalcResult(null);
                        } else if (btn === "=") {
                          doCalculate();
                        } else {
                          setCalcExpression(prev => prev + btn);
                        }
                      }}
                    >
                      {btn}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* World Clock Tab */}
          <TabsContent value="time" className="mt-4">
            <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-fuchsia-400" />
                  World Clock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {timezones.map((tz) => (
                    <div
                      key={tz.tz}
                      className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center"
                    >
                      <p className="text-sm text-slate-400">{tz.name}</p>
                      <p className="text-2xl font-bold text-white mt-1">{getTimeInZone(tz.tz)}</p>
                      <p className="text-xs text-slate-500 mt-1">{getDateInZone(tz.tz)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}