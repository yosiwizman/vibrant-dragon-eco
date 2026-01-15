import type { LocationSnapshot } from "@/types/models";

/**
 * Get user-friendly error message for geolocation errors
 */
function getLocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission denied. Please enable location access in your browser settings.";
    case error.POSITION_UNAVAILABLE:
      return "Location unavailable. Please check that location services are enabled on your device.";
    case error.TIMEOUT:
      return "Location request timed out. Please try again or check your connection.";
    default:
      return error.message || "Unable to get your location. Please try again.";
  }
}

export async function getCurrentLocation(): Promise<LocationSnapshot> {
  return new Promise<LocationSnapshot>((resolve, reject) => {
    // Check if geolocation is supported
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by your browser. Please use a modern browser with location support."));
      return;
    }

    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      reject(new Error("Location access requires a secure connection (HTTPS). Please access this site via HTTPS."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        const friendlyMessage = getLocationErrorMessage(err);
        console.warn("[Location] Error getting position:", err.code, err.message);
        reject(new Error(friendlyMessage));
      },
      { 
        enableHighAccuracy: false, // Start with low accuracy for faster response
        timeout: 15000, // Increased timeout for slower connections
        maximumAge: 60000 // Allow cached position up to 1 minute old
      }
    );
  });
}

/**
 * Check if location permission has been granted
 */
export async function checkLocationPermission(): Promise<PermissionState | null> {
  try {
    if (!("permissions" in navigator)) {
      return null; // Permissions API not supported
    }
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state;
  } catch {
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}