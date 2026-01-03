import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import { searchWeb } from "../services/search";
import { getCurrentLocation } from "../services/location";
import { findNearbyPlaces } from "../services/search";
import { openAppleMaps } from "../services/maps";

export default function Tools() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ title: string; url: string; snippet?: string }>
  >([]);
  const [nearby, setNearby] = useState<
    Array<{ name: string; lat: number; lon: number; distanceMeters: number }>
  >([]);

  const doSearch = async () => {
    if (!query.trim()) return;
    try {
      const res = await searchWeb(query.trim());
      setSearchResults(res);
    } catch (e: any) {
      showError(e.message || "Search failed");
    }
  };

  const doNearby = async () => {
    if (!query.trim()) return;
    try {
      const loc = await getCurrentLocation();
      const places = await findNearbyPlaces(query.trim(), loc);
      setNearby(places);
    } catch (e: any) {
      showError(e.message || "Nearby search failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">Web Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                placeholder="Search the web..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button onClick={doSearch} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">Search</Button>
            </div>
            <div className="space-y-2">
              {searchResults.map((r) => (
                <div key={r.url} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                  <a
                    className="font-medium text-fuchsia-300 hover:underline"
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {r.title}
                  </a>
                  {r.snippet && (
                    <p className="text-sm text-slate-400 mt-1">{r.snippet}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">Nearby Places</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                placeholder='e.g., "pizza"'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button onClick={doNearby} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">Find Nearby</Button>
            </div>
            <div className="space-y-2">
              {nearby.map((p) => (
                <div key={`${p.lat},${p.lon}`} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                  <div className="font-medium text-white">{p.name}</div>
                  <div className="text-sm text-slate-400">
                    {(p.distanceMeters / 1000).toFixed(2)} km away
                  </div>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      className="bg-slate-700 text-white hover:bg-slate-600"
                      onClick={() => openAppleMaps(p.lat, p.lon, p.name)}
                    >
                      Open in Apple Maps
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}