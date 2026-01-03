import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { getLocationContext, LocationContext } from "@/services/context";
import { showError, showSuccess } from "@/utils/toast";

export default function LocationDisplay() {
  const [location, setLocation] = useState<LocationContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e: any) {
      setError(e.message || "Location access denied");
      showError("Location access denied");
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Try to get location on mount (silently)
    getLocationContext().then(loc => {
      if (loc) setLocation(loc);
    }).catch(() => {
      // Silently fail
    });
  }, []);

  return (
    <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${location ? "bg-green-500/20" : "bg-slate-700"}`}>
              <MapPin className={`h-5 w-5 ${location ? "text-green-400" : "text-slate-400"}`} />
            </div>
            <div>
              {location ? (
                <>
                  <p className="font-medium text-white">{location.city || "Location Available"}</p>
                  <p className="text-xs text-slate-400">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-slate-400">Location Not Set</p>
                  <p className="text-xs text-slate-500">
                    {error || "Enable for weather & nearby places"}
                  </p>
                </>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLocation}
            disabled={loading}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}