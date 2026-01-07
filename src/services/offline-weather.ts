"use client";

interface WeatherCache {
  location: {
    lat: number;
    lng: number;
    city?: string;
  };
  data: any;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY = 'weather-cache';

class OfflineWeather {
  /**
   * Get weather with 24-hour caching
   */
  async getWeather(lat: number, lng: number, fetchFn: () => Promise<any>): Promise<{
    data: any;
    cached: boolean;
    stale: boolean;
    lastUpdated: number;
  }> {
    const cached = await this.getCached(lat, lng);
    const now = Date.now();

    // Return fresh cache if available and not expired
    if (cached && now < cached.expiresAt) {
      console.log('[Offline Weather] Using fresh cache');
      return {
        data: cached.data,
        cached: true,
        stale: false,
        lastUpdated: cached.timestamp,
      };
    }

    // Try to fetch fresh data if online
    if (navigator.onLine) {
      try {
        const freshData = await fetchFn();
        await this.cache(lat, lng, freshData);
        
        console.log('[Offline Weather] Fetched fresh data');
        return {
          data: freshData,
          cached: false,
          stale: false,
          lastUpdated: now,
        };
      } catch (error) {
        console.error('[Offline Weather] Fetch failed, using stale cache');
        // Fall through to stale cache
      }
    }

    // Return stale cache if available (offline or fetch failed)
    if (cached) {
      console.log('[Offline Weather] Using stale cache');
      return {
        data: cached.data,
        cached: true,
        stale: true,
        lastUpdated: cached.timestamp,
      };
    }

    throw new Error('No weather data available');
  }

  /**
   * Cache weather data
   */
  private async cache(lat: number, lng: number, data: any, city?: string) {
    try {
      const cacheData: WeatherCache = {
        location: { lat, lng, city },
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      };

      const allCaches = await this.getAllCaches();
      const key = this.getCacheKey(lat, lng);
      allCaches[key] = cacheData;

      // Limit to 50 locations
      const keys = Object.keys(allCaches);
      if (keys.length > 50) {
        // Remove oldest
        const oldest = keys.sort((a, b) => 
          allCaches[a].timestamp - allCaches[b].timestamp
        )[0];
        delete allCaches[oldest];
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(allCaches));
    } catch (error) {
      console.error('[Offline Weather] Cache failed:', error);
    }
  }

  /**
   * Get cached weather for location
   */
  private async getCached(lat: number, lng: number): Promise<WeatherCache | null> {
    try {
      const allCaches = await this.getAllCaches();
      const key = this.getCacheKey(lat, lng);
      return allCaches[key] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all cached weather data
   */
  private async getAllCaches(): Promise<Record<string, WeatherCache>> {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Generate cache key from coordinates
   */
  private getCacheKey(lat: number, lng: number): string {
    // Round to 2 decimal places for cache key
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
  }

  /**
   * Clear all weather caches
   */
  async clearCache() {
    localStorage.removeItem(CACHE_KEY);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalLocations: number;
    freshCount: number;
    staleCount: number;
  }> {
    const allCaches = await this.getAllCaches();
    const now = Date.now();
    
    let freshCount = 0;
    let staleCount = 0;

    Object.values(allCaches).forEach(cache => {
      if (now < cache.expiresAt) {
        freshCount++;
      } else {
        staleCount++;
      }
    });

    return {
      totalLocations: Object.keys(allCaches).length,
      freshCount,
      staleCount,
    };
  }
}

export const offlineWeather = new OfflineWeather();