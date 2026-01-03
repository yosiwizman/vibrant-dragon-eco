import type { LocationSnapshot } from "@/types/models";
import { haversineDistanceMeters } from "./location";

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  source: string;
}

// Enhanced web search using DuckDuckGo and Wikipedia
export async function searchWeb(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Try DuckDuckGo first for instant answers
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgUrl);
    
    if (ddgRes.ok) {
      const ddgData = await ddgRes.json();
      
      // Add abstract if available
      if (ddgData.Abstract) {
        results.push({
          title: ddgData.Heading || query,
          url: ddgData.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: ddgData.Abstract,
          source: ddgData.AbstractSource || "DuckDuckGo",
        });
      }
      
      // Add related topics
      if (ddgData.RelatedTopics) {
        for (const topic of ddgData.RelatedTopics.slice(0, 3)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(" - ")[0] || topic.Text.substring(0, 50),
              url: topic.FirstURL,
              snippet: topic.Text,
              source: "DuckDuckGo",
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("DuckDuckGo search failed:", error);
  }

  // Also search Wikipedia for more results
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srsearch=${encodeURIComponent(query)}&srlimit=5`;
    const wikiRes = await fetch(wikiUrl);
    
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const items = (wikiData?.query?.search ?? []) as Array<{
        title: string;
        snippet: string;
        pageid: number;
      }>;
      
      for (const item of items) {
        // Avoid duplicates
        if (!results.some(r => r.title.toLowerCase() === item.title.toLowerCase())) {
          results.push({
            title: item.title,
            url: `https://en.wikipedia.org/?curid=${item.pageid}`,
            snippet: item.snippet?.replace(/<[^>]+>/g, ""),
            source: "Wikipedia",
          });
        }
      }
    }
  } catch (error) {
    console.error("Wikipedia search failed:", error);
  }

  return results.slice(0, 8);
}

// Get weather information (using Open-Meteo, no key required)
export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  windSpeed: number;
  location: string;
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  
  const data = await res.json();
  const current = data.current;
  
  // Weather code to description mapping
  const weatherCodes: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  
  return {
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    description: weatherCodes[current.weather_code] || "Unknown",
    windSpeed: Math.round(current.wind_speed_10m),
    location: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
  };
}

export interface NearbyPlace {
  name: string;
  lat: number;
  lon: number;
  distanceMeters: number;
  url?: string;
  type?: string;
}

export async function findNearbyPlaces(
  query: string,
  loc: LocationSnapshot,
  limit = 5
): Promise<NearbyPlace[]> {
  // Nominatim search near coordinates
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=${limit}&q=${encodeURIComponent(
    query
  )}&addressdetails=1&lat=${loc.lat}&lon=${loc.lng}`;
  
  const res = await fetch(url, {
    headers: { "User-Agent": "echo-personal-assistant" },
  });
  
  if (!res.ok) throw new Error("Nearby search failed");
  
  const items = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    type?: string;
    class?: string;
  }>;
  
  return items.map((it) => {
    const lat = parseFloat(it.lat);
    const lon = parseFloat(it.lon);
    return {
      name: it.display_name,
      lat,
      lon,
      distanceMeters: haversineDistanceMeters(loc.lat, loc.lng, lat, lon),
      type: it.type || it.class,
    };
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);
}

// Geocode an address to coordinates
export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  
  const res = await fetch(url, {
    headers: { "User-Agent": "echo-personal-assistant" },
  });
  
  if (!res.ok) return null;
  
  const items = await res.json();
  if (items.length === 0) return null;
  
  return {
    lat: parseFloat(items[0].lat),
    lon: parseFloat(items[0].lon),
    displayName: items[0].display_name,
  };
}

// Reverse geocode coordinates to address
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  
  const res = await fetch(url, {
    headers: { "User-Agent": "echo-personal-assistant" },
  });
  
  if (!res.ok) return null;
  
  const data = await res.json();
  return data.display_name || null;
}