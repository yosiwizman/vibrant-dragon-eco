import type { LocationSnapshot } from "@/types/models";
import { haversineDistanceMeters } from "./location";

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  source: "wikipedia";
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  // Wikipedia search API, no key required
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srsearch=${encodeURIComponent(
    query
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  const items = (data?.query?.search ?? []) as Array<{
    title: string;
    snippet: string;
    pageid: number;
  }>;
  return items.slice(0, 5).map((it) => ({
    title: it.title,
    url: `https://en.wikipedia.org/?curid=${it.pageid}`,
    snippet: it.snippet?.replace(/<[^>]+>/g, ""),
    source: "wikipedia",
  }));
}

export interface NearbyPlace {
  name: string;
  lat: number;
  lon: number;
  distanceMeters: number;
  url?: string;
}

export async function findNearbyPlaces(
  query: string,
  loc: LocationSnapshot,
  limit = 5
): Promise<NearbyPlace[]> {
  // Nominatim search near coordinates, simple heuristic
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
  }>;
  return items.map((it) => {
    const lat = parseFloat(it.lat);
    const lon = parseFloat(it.lon);
    return {
      name: it.display_name,
      lat,
      lon,
      distanceMeters: haversineDistanceMeters(loc.lat, loc.lng, lat, lon),
    };
  });
}