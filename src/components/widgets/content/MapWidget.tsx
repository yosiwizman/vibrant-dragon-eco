"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  MapPinned,
  Share2,
  Ruler,
  Coffee,
  ShoppingCart,
  Utensils,
  Fuel,
  Car,
  Edit
} from "lucide-react";

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: "home" | "work" | "favorite";
  notes?: string;
}

type NearbyCategory = "restaurant" | "cafe" | "gas_station" | "shopping" | "parking";

const NEARBY_CATEGORIES = [
  { value: "restaurant", label: "Restaurants", icon: Utensils },
  { value: "cafe", label: "Cafes", icon: Coffee },
  { value: "gas_station", label: "Gas Stations", icon: Fuel },
  { value: "shopping", label: "Shopping", icon: ShoppingCart },
  { value: "parking", label: "Parking", icon: Car },
];

export default function MapWidget() {
  const [location, setLocation] = useState<LocationContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPlace, setEditingPlace] = useState<SavedPlace | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "places" | "nearby">("map");
  
  // Form fields
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");
  const [newPlaceType, setNewPlaceType] = useState<"home" | "work" | "favorite">("favorite");
  const [newPlaceNotes, setNewPlaceNotes] = useState("");

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
      type: newPlaceType,
      notes: newPlaceNotes.trim() || undefined
    };

    setSavedPlaces([...savedPlaces, newPlace]);
    setIsDialogOpen(false);
    resetForm();
    showSuccess("Place saved!");
  };

  const startEditPlace = (place: SavedPlace) => {
    setEditingPlace(place);
    setNewPlaceName(place.name);
    setNewPlaceAddress(place.address);
    setNewPlaceType(place.type);
    setNewPlaceNotes(place.notes || "");
    setIsEditDialogOpen(true);
  };

  const updatePlace = () => {
    if (!editingPlace || !newPlaceName.trim()) {
      showError("Please enter a place name");
      return;
    }

    const updatedPlaces = savedPlaces.map(p => 
      p.id === editingPlace.id 
        ? { ...p, name: newPlaceName.trim(), address: newPlaceAddress.trim(), type: newPlaceType, notes: newPlaceNotes.trim() || undefined }
        : p
    );

    setSavedPlaces(updatedPlaces);
    setIsEditDialogOpen(false);
    setEditingPlace(null);
    resetForm();
    showSuccess("Place updated!");
  };

  const removePlace = (id: string) => {
    setSavedPlaces(savedPlaces.filter(p => p.id !== id));
    showSuccess("Place removed");
  };

  const resetForm = () => {
    setNewPlaceName("");
    setNewPlaceAddress("");
    setNewPlaceType("favorite");
    setNewPlaceNotes("");
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

  const searchNearby = (category: NearbyCategory) => {
    if (!location) {
      showError("Current location not available");
      return;
    }
    window.open(
      `https://www.google.com/maps/search/${category}/@${location.lat},${location.lng},15z`,
      "_blank"
    );
  };

  const shareLocation = async () => {
    if (!location) {
      showError("No location available");
      return;
    }

    const shareText = `My location: ${location.city || "Unknown"}\nhttps://www.google.com/maps?q=${location.lat},${location.lng}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Location",
          text: shareText,
        });
        showSuccess("Location shared!");
      } catch (e) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        showSuccess("Location copied to clipboard!");
      } catch (e) {
        showError("Could not share location");
      }
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
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
                onClick={() => setViewMode(viewMode === "map" ? "places" : viewMode === "places" ? "nearby" : "map")}
                className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
              >
                {viewMode === "map" ? "Places" : viewMode === "places" ? "Nearby" : "Map"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchLocation}
                disabled={loading}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <Navigation className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
              {viewMode === "places" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(true)}
                  className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-3">
          {viewMode === "nearby" ? (
            /* Nearby Places View */
            <div className="space-y-2">
              <p className="text-xs text-slate-400 mb-2">Find nearby places</p>
              {NEARBY_CATEGORIES.map(category => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.value}
                    variant="outline"
                    onClick={() => searchNearby(category.value as NearbyCategory)}
                    className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {category.label}
                  </Button>
                );
              })}
            </div>
          ) : viewMode === "places" ? (
            /* Saved Places View */
            <div className="space-y-2">
              {savedPlaces.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-4">
                  No saved places yet
                </p>
              ) : (
                savedPlaces.map(place => {
                  const distance = location ? calculateDistance(location.lat, location.lng, place.lat, place.lng) : null;
                  
                  return (
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
                            {distance && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Ruler className="h-2.5 w-2.5 text-slate-600" />
                                <span className="text-[9px] text-slate-600">{distance} away</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditPlace(place)}
                            className="h-5 w-5 p-0 text-slate-400 hover:text-blue-400"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePlace(place.id)}
                            className="h-5 w-5 p-0 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {place.notes && (
                        <p className="text-[10px] text-slate-600 mb-1 line-clamp-1">{place.notes}</p>
                      )}
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
                          <Navigation className="h-2.5 w-2.5 mr-1" />
                          Go
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Map View */
            <>
              {/* Current Location */}
              {location && (
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-green-400" />
                      <span className="text-xs font-medium text-white">Current Location</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={shareLocation}
                      className="h-5 w-5 p-0 text-slate-400 hover:text-green-400"
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">
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
                      Open in Maps
                    </Button>
                  </div>
                </div>
              )}

              {/* Map Preview */}
              {location && (
                <div className="relative rounded-lg overflow-hidden border border-slate-700/50 h-40">
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
            </>
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
              <label className="text-sm text-slate-400 mb-1 block">Address</label>
              <Input
                placeholder="Street address"
                className="bg-slate-800 border-slate-700 text-white"
                value={newPlaceAddress}
                onChange={(e) => setNewPlaceAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Notes</label>
              <Input
                placeholder="Additional notes..."
                className="bg-slate-800 border-slate-700 text-white"
                value={newPlaceNotes}
                onChange={(e) => setNewPlaceNotes(e.target.value)}
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
                  resetForm();
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

      {/* Edit Place Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Place</DialogTitle>
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
              <label className="text-sm text-slate-400 mb-1 block">Address</label>
              <Input
                placeholder="Street address"
                className="bg-slate-800 border-slate-700 text-white"
                value={newPlaceAddress}
                onChange={(e) => setNewPlaceAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Notes</label>
              <Input
                placeholder="Additional notes..."
                className="bg-slate-800 border-slate-700 text-white"
                value={newPlaceNotes}
                onChange={(e) => setNewPlaceNotes(e.target.value)}
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
                  setIsEditDialogOpen(false);
                  setEditingPlace(null);
                  resetForm();
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={updatePlace}
                className="bg-green-600 text-white hover:bg-green-500"
              >
                Update Place
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}