import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// Safe initialization wrapper
function safeInit(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.catch(err => console.warn(`[Init] ${name} failed:`, err));
    }
  } catch (err) {
    console.warn(`[Init] ${name} failed:`, err);
  }
}

// Initialize services safely (don't block app render)
safeInit('ErrorTracking', async () => {
  const { initializeErrorTracking } = await import("./services/error-tracking");
  initializeErrorTracking();
});

safeInit('PostHog', async () => {
  const { initializePostHog } = await import("./services/posthog-analytics");
  initializePostHog();
});

safeInit('PerformanceOptimizations', async () => {
  const { initializePerformanceOptimizations } = await import("./services/performance-optimizer");
  initializePerformanceOptimizations();
});

// Initialize self-healing (auto-starts in production) - delayed
if (import.meta.env.PROD) {
  setTimeout(() => {
    safeInit('SelfHealing', async () => {
      const { selfHealing } = await import("./services/self-healing");
      selfHealing.startMonitoring(30000);
    });
  }, 5000); // Delay 5 seconds to let app load first
}

// Track app start - delayed
setTimeout(() => {
  safeInit('Analytics', async () => {
    const { advancedAnalytics } = await import("./services/advanced-analytics");
    advancedAnalytics.track('app_start', 'system', {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      online: navigator.onLine,
    });
  });
}, 1000);

// Register service worker for offline support (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        console.log('[Service Worker] Registered successfully:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.error('[Service Worker] Registration failed:', error);
      });
  });
}

// Show loading indicator immediately
const root = document.getElementById("root");
if (root) {
  // Render app
  createRoot(root).render(<App />);
} else {
  console.error('[Main] Root element not found');
}
