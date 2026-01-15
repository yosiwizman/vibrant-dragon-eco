/**
 * Performance Optimizer Service
 * Provides utilities for optimizing app performance
 */

// Lazy load heavy modules
export async function preloadCriticalModules(): Promise<void> {
  // Preload orchestrator tools in background
  const preloadPromises = [
    import('@/services/orchestrator/tools'),
    import('@/services/orchestrator/executor'),
  ];
  
  await Promise.all(preloadPromises);
}

// Memory cleanup utility
export function cleanupMemory(): void {
  // Clear any cached data that's no longer needed
  if ('gc' in window && typeof (window as any).gc === 'function') {
    (window as any).gc();
  }
}

// Debounce utility with proper typing
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Request idle callback polyfill
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout: number }
): number {
  if ('requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, options);
  }
  
  // Fallback for browsers without requestIdleCallback
  return setTimeout(callback, options?.timeout || 1) as unknown as number;
}

// Cancel idle callback polyfill
export function cancelIdleCallback(id: number): void {
  if ('cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

// Measure performance
export function measurePerformance(name: string): () => number {
  const start = performance.now();
  
  return () => {
    const duration = performance.now() - start;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  };
}

// Check if device is low-end
export function isLowEndDevice(): boolean {
  // Check for low memory
  if ('deviceMemory' in navigator) {
    const memory = (navigator as any).deviceMemory;
    if (memory && memory < 4) return true;
  }
  
  // Check for slow CPU
  if ('hardwareConcurrency' in navigator) {
    if (navigator.hardwareConcurrency < 4) return true;
  }
  
  return false;
}

// Optimize images for device
export function getOptimalImageSize(): 'small' | 'medium' | 'large' {
  const width = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  const effectiveWidth = width * dpr;
  
  if (effectiveWidth < 640) return 'small';
  if (effectiveWidth < 1280) return 'medium';
  return 'large';
}

// Preconnect to critical origins
export function preconnectOrigins(): void {
  const origins = [
    'https://api.openai.com',
    'https://fjhvhjlicrujksplxzyh.supabase.co',
  ];
  
  origins.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Initialize performance optimizations
export function initializePerformanceOptimizations(): void {
  // Preconnect to critical origins
  preconnectOrigins();
  
  // Preload critical modules when idle
  requestIdleCallback(() => {
    preloadCriticalModules();
  }, { timeout: 5000 });
  
  // Log device capabilities
  if (process.env.NODE_ENV === 'development') {
    console.log('[Performance] Low-end device:', isLowEndDevice());
    console.log('[Performance] Optimal image size:', getOptimalImageSize());
  }
}