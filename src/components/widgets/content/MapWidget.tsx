"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getLocationContext, LocationContext } from "@/services/context";
import { showSuccess, showError } from "@/utils/toast";
import { 
  MapPin, 
  Navigation, 
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Star,
  Home,
  Briefcase,
  MapPinned
} from "lucide-react";

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: "home" | "work" | "favorite";
}

export default function MapWidget() {
  const [location, setLocation] = useState<LocationContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form fields
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");
  const [newPlaceType, setNewPlaceType] = useState<"home" | "work" | "favorite">("favorite");

  useEffect(() => {
    const saved = localStorage.getItem("savedPlaces");
    if (saved) {
      try {
        setSavedPlaces(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved places");
      }
    }
    fetchLocation();
  }, []);

  useEffect(() => {
    if (savedPlaces.length > 0) {
      localStorage.setItem("savedPlaces", JSON.stringify(savedPlaces));
    }
  }, [savedPlaces]);

  const fetchLocation = async () => {
    setLoading(true);
    
    try {
      const loc = await getLocationContext();
      if (loc) {
        setLocation(loc);
      } else {
        showError("Could not get location");
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Location access denied";
      showError(errorMessage);
    }
    
    setLoading(false);
  };

  const saveCurrentLocation = () => {
    if (!location) {
      showError("No location available");
      return;
    }

    if (!newPlaceName.trim()) {
      showError("Please enter a place name");
      return;
    }

    const newPlace: SavedPlace = {
      id: Date.now().toString(),
      name: newPlaceName.trim(),
      address: newPlaceAddress.trim() || location.city || "Unknown",
      lat: location.lat,
      lng: location.lng,
      type: newPlaceType
    };

    setSavedPlaces([...savedPlaces, newPlace]);
    setIsDialogOpen(false);
    setNewPlaceName("");
    setNewPlaceAddress("");
    setNewPlaceType("favorite");
    showSuccess("Place saved!");
  };

  const removePlace = (id: string) => {
    setSavedPlaces(savedPlaces.filter(p => p.id !== id));
    showSuccess("Place removed");
  };

  const openInMaps = (lat?: number, lng?: number) => {
    const targetLat = lat || location?.lat;
    const targetLng = lng || location?.lng;
    if (targetLat && targetLng) {
      window.open(`https://www.google.com/maps?q=${targetLat},${targetLng}`, "_blank");
    }
  };

  const getDirections = (toLat: number, toLng: number) => {
    if (!location) {
      showError("Current location not available");
      return;
    }
    window.open(
      `https://www.google.com/maps/dir/${location.lat},${location.lng}/${toLat},${toLng}`,
      "_blank"
    );
  };

  const searchPlace = () => {
    if (!searchQuery.trim()) {
      showError("Please enter a search query");
      return;
    }
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`,
      "_blank"
    );
  };

  const getPlaceIcon = (type: string) => {
    switch (type) {
      case "home": return <Home className="h-3 w-3 text-blue-400" />;
      case "work": return <Briefcase className="h-3 w-3 text-purple-400" />;
      case "favorite": return <Star className="h-3 w-3 text-yellow-400" />;
      default: return <MapPin className="h-3 w-3 text-slate-400" />;
    }
  };

  return (
    <>
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-green-400" />
              Map
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchLocation}
                disabled={loading}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <Navigation className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDialogOpen(true)}
                className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-3">
          {/* Current Location */}
          {location && (
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-3 w-3 text-green-400" />
                <span className="text-xs font-medium text-white">Current Location</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                {location.city || "Unknown City"}
              </p>
              <p className="text-[10px] text-slate-500 mb-2">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openInMaps()}
                  className="h-6 text-[10px] border-slate-600 text-slate-300"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </Button>
              </div>
            </div>
          )}

          {/* Map Preview */}
          {location && (
            <div className="relative rounded-lg overflow-hidden border border-slate-700/50 h-32">
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.01},${location.lat - 0.01},${location.lng + 0.01},${location.lat + 0.01}&layer=mapnik&marker=${location.lat},${location.lng}`}
                className="w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                title="Location Map"
              />
            </div>
          )}

          {/* Search */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Search className="h-3 w-3" />
              <span>Search Places</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search for places..."
                className="h-7 text-xs bg-slate-900/50 border-slate-700 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchPlace()}
              />
              <Button
                size="sm"
                onClick={searchPlace}
                className="h-7 bg-green-600 text-white hover:bg-green-500"
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Saved Places */}
          {savedPlaces.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Star className="h-3 w-3" />
                <span>Saved Places</span>
              </div>
              {savedPlaces.map(place => (
                <div
                  key={place.id}
                  className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {getPlaceIcon(place.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate">{place.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{place.address}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlace(place.id)}
                      className="h-5 w-5 p-0 text-slate-400 hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openInMaps(place.lat, place.lng)}
                      className="h-5 text-[9px] border-slate-600 text-slate-300"
                    >
                      <MapPin className="h-2.5 w-2.5 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => getDirections(place.lat, place.lng)}
                      className="h-5 text-[9px] border-slate-600 text-slate-300"
                    >
                      <Directions className="h-2.5 w-2.5 mr-1" />
                      Directions
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!location && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MapPin className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 mb-1">Location not available</p>
              <p className="text-[10px] text-slate-500 mb-3">
                Enable location to use map features
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLocation}
                disabled={loading}
                className="border-slate-600 text-slate-300"
              >
                <Navigation className="h-3 w-3 mr-2" />
                Enable Location
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Place Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Save Current Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Place Name *</label>
              <Input
                placeholder="e.g., Home, Office, Gym"
                className="bg-slate-800 border-slate-700 text-white"
                value={newPlaceName}
                onChange={(e) => setNewPlaceName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Address (optional)</label>
              <Input
                placeholder="Street address"
                className="bg-slate-800 border-slate-700 text-white"
                value={newPlaceAddress}
                onChange={(e) => setNewPlaceAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Type</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={newPlaceType === "home" ? "default" : "outline"}
                  onClick={() => setNewPlaceType("home")}
                  className={newPlaceType === "home" 
                    ? "bg-blue-600 text-white hover:bg-blue-500" 
                    : "border-slate-600 text-slate-300"
                  }
                >
                  <Home className="h-3 w-3 mr-1" />
                  Home
                </Button>
                <Button
                  size="sm"
                  variant={newPlaceType === "work" ? "default" : "outline"}
                  onClick={() => setNewPlaceType("work")}
                  className={newPlaceType === "work" 
                    ? "bg-purple-600 text-white hover:bg-purple-500" 
                    : "border-slate-600 text-slate-300"
                  }
                >
                  <Briefcase className="h-3 w-3 mr-1" />
                  Work
                </Button>
                <Button
                  size="sm"
                  variant={newPlaceType === "favorite" ? "default" : "outline"}
                  onClick={() => setNewPlaceType("favorite")}
                  className={newPlaceType === "favorite" 
                    ? "bg-yellow-600 text-white hover:bg-yellow-500" 
                    : "border-slate-600 text-slate-300"
                  }
                >
                  <Star className="h-3 w-3 mr-1" />
                  Favorite
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewPlaceName("");
                  setNewPlaceAddress("");
                  setNewPlaceType("favorite");
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={saveCurrentLocation}
                className="bg-green-600 text-white hover:bg-green-500"
              >
                Save Place
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}