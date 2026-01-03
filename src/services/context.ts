import { getCurrentLocation } from "./location";

export interface UserContext {
  time: TimeContext;
  location?: LocationContext;
}

export interface TimeContext {
  iso: string;
  local: string;
  date: string;
  time: string;
  timezone: string;
  dayOfWeek: string;
  hour: number;
  minute: number;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  isWeekend: boolean;
  isBusinessHours: boolean;
}

export interface LocationContext {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  accuracy?: number;
}

export function getTimeContext(): TimeContext {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  const getTimeOfDay = (): "morning" | "afternoon" | "evening" | "night" => {
    if (hour < 6) return "night";
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    if (hour < 21) return "evening";
    return "night";
  };

  return {
    iso: now.toISOString(),
    local: now.toLocaleString(),
    date: now.toLocaleDateString("en-US", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    }),
    time: now.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit", 
      hour12: true 
    }),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dayOfWeek: now.toLocaleDateString("en-US", { weekday: "long" }),
    hour,
    minute: now.getMinutes(),
    timeOfDay: getTimeOfDay(),
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    isBusinessHours: hour >= 9 && hour < 17 && dayOfWeek > 0 && dayOfWeek < 6,
  };
}

export async function getLocationContext(): Promise<LocationContext | null> {
  try {
    const loc = await getCurrentLocation();
    
    // Try to get city name via reverse geocoding
    let city: string | undefined;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json`,
        { headers: { "User-Agent": "EchoAssistant/1.0" } }
      );
      if (response.ok) {
        const data = await response.json();
        city = data.address?.city || data.address?.town || data.address?.village;
      }
    } catch {
      // Ignore reverse geocoding errors
    }

    return {
      lat: loc.lat,
      lng: loc.lng,
      city,
    };
  } catch {
    return null;
  }
}

export async function getUserContext(): Promise<UserContext> {
  const time = getTimeContext();
  let location: LocationContext | null = null;
  
  try {
    location = await getLocationContext();
  } catch {
    // Location not available
  }

  return {
    time,
    location: location || undefined,
  };
}

// Parse relative time expressions into ISO datetime
export function parseRelativeTime(expression: string): string | null {
  const now = new Date();
  const lower = expression.toLowerCase().trim();
  
  // Handle "in X minutes/hours/days"
  const inMatch = lower.match(/in\s+(\d+)\s+(minute|hour|day|week)s?/);
  if (inMatch) {
    const amount = parseInt(inMatch[1]);
    const unit = inMatch[2];
    const result = new Date(now);
    
    switch (unit) {
      case "minute":
        result.setMinutes(result.getMinutes() + amount);
        break;
      case "hour":
        result.setHours(result.getHours() + amount);
        break;
      case "day":
        result.setDate(result.getDate() + amount);
        break;
      case "week":
        result.setDate(result.getDate() + amount * 7);
        break;
    }
    return result.toISOString();
  }

  // Handle "tomorrow at X"
  const tomorrowMatch = lower.match(/tomorrow\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (tomorrowMatch) {
    const result = new Date(now);
    result.setDate(result.getDate() + 1);
    let hour = parseInt(tomorrowMatch[1]);
    const minute = tomorrowMatch[2] ? parseInt(tomorrowMatch[2]) : 0;
    const ampm = tomorrowMatch[3];
    
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    
    result.setHours(hour, minute, 0, 0);
    return result.toISOString();
  }

  // Handle "today at X"
  const todayMatch = lower.match(/today\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (todayMatch) {
    const result = new Date(now);
    let hour = parseInt(todayMatch[1]);
    const minute = todayMatch[2] ? parseInt(todayMatch[2]) : 0;
    const ampm = todayMatch[3];
    
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    
    result.setHours(hour, minute, 0, 0);
    return result.toISOString();
  }

  // Handle "next Monday/Tuesday/etc"
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const nextDayMatch = lower.match(/next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/);
  if (nextDayMatch) {
    const targetDay = dayNames.indexOf(nextDayMatch[1]);
    const result = new Date(now);
    const currentDay = result.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    result.setDate(result.getDate() + daysToAdd);
    result.setHours(9, 0, 0, 0); // Default to 9 AM
    return result.toISOString();
  }

  return null;
}

// Format a greeting based on time of day
export function getGreeting(timeContext: TimeContext): string {
  switch (timeContext.timeOfDay) {
    case "morning":
      return "Good morning";
    case "afternoon":
      return "Good afternoon";
    case "evening":
      return "Good evening";
    case "night":
      return "Hello";
  }
}