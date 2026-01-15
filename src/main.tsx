import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { initializeErrorTracking } from "./services/error-tracking";
import { initializePostHog } from "./services/posthog-analytics";
import { initializePerformanceOptimizations } from "./services/performance-optimizer";

// Initialize error tracking
initializeErrorTracking();

// Initialize analytics
initializePostHog();

// Initialize performance optimizations
initializePerformanceOptimizations();

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
