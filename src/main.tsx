import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { initializeErrorTracking } from "./services/error-tracking";

// Initialize error tracking
initializeErrorTracking();

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
