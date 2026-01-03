import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MapPin, Navigation, Loader2, Map, ExternalLink } from "lucide-react";
import { getLocationContext, LocationContext } from "@/services/context";
import { showError, showSuccess } from "@/utils/toast";

export default function LocationDisplay() {
  const [location, setLocation] = useState<LocationContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const loc = await getLocationContext();
      if (loc) {
        setLocation(loc);
        showSuccess("Location updated");
      } else {
        setError("Could not get location");
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Location access denied";
      setError(errorMessage);
      showError("Location access denied");
    }
    
    setLoading(false);
  };

  useEffect(() => {
    getLocationContext().then(loc => {
      if (loc) setLocation(loc);
    }).catch(() => {
      // Silently fail
    });
  }, []);

  const openInMaps = () => {
    if (location) {
      window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, "_blank");
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className={`h-4 w-4 ${location ? "text-green-400" : "text-slate-400"}`} />
            <span className="text-sm font-medium text-white">
              {location ? location.city || "Location" : "Location"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {location && (
              <div className="flex items-center gap-1.5">
                <Map className="h-3.5 w-3.5 text-slate-500" />
                <Switch
                  checked={showMap}
                  onCheckedChange={setShowMap}
                  className="scale-75"
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchLocation}
              disabled={loading}
              className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Navigation className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {location ? (
          <>
            {/* Coordinates */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-400">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={openInMaps}
                className="h-6 px-2 text-xs text-fuchsia-400 hover:text-fuchsia-300 hover:bg-slate-700"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open Maps
              </Button>
            </div>

            {/* Map View */}
            {showMap && (
              <div className="relative rounded-lg overflow-hidden border border-slate-700">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.01},${location.lat - 0.01},${location.lng + 0.01},${location.lat + 0.01}&layer=mapnik&marker=${location.lat},${location.lng}`}
                  className="w-full h-32"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Location Map"
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/50 to-transparent" />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <MapPin className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 mb-1">Location not set</p>
            <p className="text-xs text-slate-500 mb-3">
              {error || "Enable for weather & nearby places"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLocation}
              disabled={loading}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Enable Location
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}