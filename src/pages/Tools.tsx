import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import { searchWeb } from "@/services/search";
import { getCurrentLocation } from "@/services/location";
import { findNearbyPlaces } from "@/services/search";
import { openAppleMaps } from "@/services/maps";

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
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Web Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Search the web..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button onClick={doSearch}>Search</Button>
          </div>
          <div className="space-y-2">
            {searchResults.map((r) => (
              <div key={r.url} className="rounded border p-2">
                <a
                  className="font-medium text-blue-600 hover:underline"
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {r.title}
                </a>
                {r.snippet && (
                  <p className="text-sm text-muted-foreground">{r.snippet}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nearby Places</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder='e.g., "pizza"'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button onClick={doNearby}>Find Nearby</Button>
          </div>
          <div className="space-y-2">
            {nearby.map((p) => (
              <div key={`${p.lat},${p.lon}`} className="rounded border p-2">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-muted-foreground">
                  {(p.distanceMeters / 1000).toFixed(2)} km away
                </div>
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="secondary"
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
  );
}