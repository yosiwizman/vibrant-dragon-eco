"use client";

import { logger } from "@/utils/logger";
import { habitTracker } from "./habit-tracker";
import { smartNotifications } from "./smart-notifications";

interface TravelTime {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  duration: number;
  traffic: 'light' | 'moderate' | 'heavy';
  departureTime: number;
}

interface ProactiveReminder {
  id: string;
  type: 'departure' | 'errand' | 'preparation';
  message: string;
  triggerTime: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Intelligent Scheduler Service
 * Learns routines and provides proactive assistance
 */
class IntelligentSchedulerService {
  private routines = new Map<string, any>();
  private errands: Array<{ task: string; location?: string; addedAt: number }> = [];

  /**
   * Analyze and create proactive reminders
   */
  async analyzeDay(userId: string): Promise<ProactiveReminder[]> {
    const reminders: ProactiveReminder[] = [];

    // Get today's calendar
    const { data: events } = await (await import('@/integrations/supabase/client')).supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', new Date().setHours(0, 0, 0, 0))
      .lte('start_time', new Date().setHours(23, 59, 59, 999));

    if (!events) return reminders;

    // Analyze each event
    for (const event of events) {
      const eventTime = new Date(event.start_time).getTime();
      const now = Date.now();

      // Skip past events
      if (eventTime < now) continue;

      // Check if travel needed
      if (event.location) {
        const travelReminder = await this.createTravelReminder(event, userId);
        if (travelReminder) {
          reminders.push(travelReminder);
        }
      }

      // Check for preparation time
      const prepReminder = this.createPreparationReminder(event);
      if (prepReminder) {
        reminders.push(prepReminder);
      }
    }

    // Check for errands on the way
    const errandReminders = await this.createErrandReminders(userId);
    reminders.push(...errandReminders);

    return reminders;
  }

  /**
   * Create travel reminder with traffic awareness
   */
  private async createTravelReminder(event: any, userId: string): Promise<ProactiveReminder | null> {
    const eventTime = new Date(event.start_time).getTime();
    const now = Date.now();

    // Get current location (from habit tracker)
    const currentLocation = await this.getCurrentLocation();
    if (!currentLocation) return null;

    // Get destination
    const destination = await this.geocodeLocation(event.location);
    if (!destination) return null;

    // Calculate travel time with traffic
    const travelTime = await this.calculateTravelTime(
      currentLocation,
      destination,
      eventTime
    );

    // Add buffer time (15 minutes)
    const bufferTime = 15 * 60 * 1000;
    const departureTime = eventTime - travelTime.duration - bufferTime;

    // Create reminder 10 minutes before departure
    const reminderTime = departureTime - 10 * 60 * 1000;

    if (reminderTime < now) return null;

    const trafficMessage = travelTime.traffic === 'heavy' 
      ? ' Traffic is heavy!' 
      : travelTime.traffic === 'moderate'
      ? ' Moderate traffic.'
      : '';

    return {
      id: `travel-${event.id}`,
      type: 'departure',
      message: `Time to leave for "${event.title}" at ${event.location}. ${Math.round(travelTime.duration / 60000)} minute drive.${trafficMessage}`,
      triggerTime: reminderTime,
      priority: travelTime.traffic === 'heavy' ? 'high' : 'medium',
    };
  }

  /**
   * Calculate travel time with traffic
   */
  private async calculateTravelTime(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    arrivalTime: number
  ): Promise<TravelTime> {
    // Use Google Maps API or similar
    // For now, estimate based on distance
    const distance = this.calculateDistance(origin, destination);
    
    // Estimate: 30 mph average in city
    const baseTime = (distance / 30) * 60 * 60 * 1000; // ms

    // Traffic multiplier based on time of day
    const hour = new Date(arrivalTime).getHours();
    let trafficMultiplier = 1.0;
    let traffic: 'light' | 'moderate' | 'heavy' = 'light';

    // Rush hour (7-9am, 4-7pm)
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19)) {
      trafficMultiplier = 1.5;
      traffic = 'heavy';
    } else if (hour >= 12 && hour <= 14) {
      trafficMultiplier = 1.2;
      traffic = 'moderate';
    }

    return {
      origin,
      destination,
      duration: baseTime * trafficMultiplier,
      traffic,
      departureTime: arrivalTime - (baseTime * trafficMultiplier),
    };
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
      Math.cos(this.toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Create preparation reminder
   */
  private createPreparationReminder(event: any): ProactiveReminder | null {
    const eventTime = new Date(event.start_time).getTime();
    const now = Date.now();

    // Remind 30 minutes before
    const reminderTime = eventTime - 30 * 60 * 1000;

    if (reminderTime < now) return null;

    return {
      id: `prep-${event.id}`,
      type: 'preparation',
      message: `"${event.title}" starts in 30 minutes. Time to prepare.`,
      triggerTime: reminderTime,
      priority: 'medium',
    };
  }

  /**
   * Create errand reminders based on route
   */
  private async createErrandReminders(userId: string): Promise<ProactiveReminder[]> {
    const reminders: ProactiveReminder[] = [];

    // Get pending errands (tasks with location)
    const { data: tasks } = await (await import('@/integrations/supabase/client')).supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .not('description', 'is', null);

    if (!tasks) return reminders;

    // Check for errands mentioned in descriptions
    tasks.forEach(task => {
      const lower = task.description?.toLowerCase() || '';
      
      // Detect shopping/errand keywords
      if (lower.includes('stop by') || lower.includes('pick up') || lower.includes('get')) {
        // Extract location if mentioned
        const locationMatch = lower.match(/(?:at|from)\s+([a-z\s]+)/i);
        const location = locationMatch ? locationMatch[1].trim() : null;

        this.errands.push({
          task: task.title,
          location,
          addedAt: new Date(task.created_at).getTime(),
        });
      }
    });

    return reminders;
  }

  /**
   * Check if user is on route to errand location
   */
  async checkErrandsOnRoute(
    currentLocation: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<string[]> {
    const errandsOnRoute: string[] = [];

    for (const errand of this.errands) {
      if (!errand.location) continue;

      const errandLocation = await this.geocodeLocation(errand.location);
      if (!errandLocation) continue;

      // Check if errand is on the way (within 0.5 miles of route)
      const isOnRoute = this.isLocationOnRoute(
        currentLocation,
        destination,
        errandLocation
      );

      if (isOnRoute) {
        errandsOnRoute.push(errand.task);
      }
    }

    return errandsOnRoute;
  }

  /**
   * Check if location is on route
   */
  private isLocationOnRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    point: { lat: number; lng: number }
  ): boolean {
    // Simple check: is point within 0.5 miles of straight line between origin and destination
    const distanceToRoute = this.distanceToLine(origin, destination, point);
    return distanceToRoute < 0.5; // 0.5 miles
  }

  /**
   * Calculate distance from point to line
   */
  private distanceToLine(
    lineStart: { lat: number; lng: number },
    lineEnd: { lat: number; lng: number },
    point: { lat: number; lng: number }
  ): number {
    // Simplified calculation
    const d1 = this.calculateDistance(lineStart, point);
    const d2 = this.calculateDistance(lineEnd, point);
    const lineLength = this.calculateDistance(lineStart, lineEnd);

    return Math.min(d1, d2, lineLength);
  }

  /**
   * Get current location
   */
  private async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Geocode location string
   */
  private async geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
    // Use geocoding API
    // For now, return null
    return null;
  }
}

export const intelligentScheduler = new IntelligentSchedulerService();