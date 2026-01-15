import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { initializeErrorTracking } from "./services/error-tracking";
import { initializePostHog } from "./services/posthog-analytics";
import { initializePerformanceOptimizations } from "./services/performance-optimizer";
import { selfHealing } from "./services/self-healing";
import { advancedAnalytics } from "./services/advanced-analytics";

// Initialize error tracking
initializeErrorTracking();

// Initialize analytics
initializePostHog();

// Initialize performance optimizations
initializePerformanceOptimizations();

// Initialize self-healing (auto-starts in production)
if (import.meta.env.PROD) {
  selfHealing.startMonitoring(30000); // Check every 30 seconds
}

// Track app start
advancedAnalytics.track('app_start', 'system', {
  timestamp: Date.now(),
  userAgent: navigator.userAgent,
  online: navigator.onLine,
});

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

createRoot(document.getElementById("root")!).render(<App />);
