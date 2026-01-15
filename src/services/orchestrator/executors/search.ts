import { supabase } from "@/integrations/supabase/client";
import { ActionResult } from '../types';
import { searchWeb, getWeather, findNearbyPlaces, geocodeAddress } from "@/services/search";
import { getCurrentLocation } from "@/services/location";

export async function executeWebSearch(query: string, userId: string): Promise<ActionResult> {
  try {
    const results = await searchWeb(query);
    
    // Log the search
    await supabase.from("web_logs").insert({
      user_id: userId,
      query,
      results_summary: results.map(r => r.title).join(", "),
      sources: results,
    });

    const voiceText = results.length > 0
      ? `I found ${results.length} results for "${query}". ${results[0].title}: ${results[0].snippet?.substring(0, 100)}...`
      : `I couldn't find any results for "${query}".`;

    return {
      tool: "web_search",
      success: true,
      data: {
        results,
        voiceText,
      },
    };
  } catch (error: any) {
    return {
      tool: "web_search",
      success: false,
      error: error.message,
    };
  }
}

export async function executeGetWeather(location?: string): Promise<ActionResult> {
  try {
    let lat: number, lon: number;
    let locationName = "your location";
    
    if (location) {
      const geocoded = await geocodeAddress(location);
      if (!geocoded) {
        return {
          tool: "get_weather",
          success: false,
          error: `Could not find location: ${location}`,
        };
      }
      lat = geocoded.lat;
      lon = geocoded.lon;
      locationName = location;
    } else {
      const currentLoc = await getCurrentLocation();
      lat = currentLoc.lat;
      lon = currentLoc.lng;
    }
    
    const weather = await getWeather(lat, lon);
    
    return {
      tool: "get_weather",
      success: true,
      data: {
        ...weather,
        location: locationName,
        summary: `${weather.description}, ${weather.temperature}°C (feels like ${weather.feelsLike}°C), humidity ${weather.humidity}%, wind ${weather.windSpeed} km/h`,
        voiceText: `The weather in ${locationName} is ${weather.description} with a temperature of ${weather.temperature} degrees Celsius, feeling like ${weather.feelsLike} degrees.`,
      },
    };
  } catch (error: any) {
    return {
      tool: "get_weather",
      success: false,
      error: error.message,
    };
  }
}

export async function executeFindNearby(query: string): Promise<ActionResult> {
  try {
    const currentLoc = await getCurrentLocation();
    const places = await findNearbyPlaces(query, currentLoc, 5);
    
    const formattedPlaces = places.map(p => ({
      name: p.name.split(",")[0],
      distance: `${(p.distanceMeters / 1000).toFixed(1)} km`,
      fullAddress: p.name,
      type: p.type,
    }));

    const voiceText = places.length > 0
      ? `I found ${places.length} ${query} nearby. The closest is ${formattedPlaces[0].name}, ${formattedPlaces[0].distance} away.`
      : `I couldn't find any ${query} nearby.`;

    return {
      tool: "find_nearby",
      success: true,
      data: {
        places: formattedPlaces,
        voiceText,
      },
    };
  } catch (error: any) {
    return {
      tool: "find_nearby",
      success: false,
      error: error.message,
    };
  }
}