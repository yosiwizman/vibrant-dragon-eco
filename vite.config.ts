import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(async () => {
  const plugins: PluginOption[] = [react()];
  
  // Try to load the dyad component tagger, but don't fail if it's not available
  try {
    const { default: dyadComponentTagger } = await import("@dyad-sh/react-vite-component-tagger");
    plugins.unshift(dyadComponentTagger() as PluginOption);
  } catch {
    // Component tagger not available, continue without it
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: true,
        protocol: 'ws',
        host: 'localhost',
        port: 8080,
        timeout: 30000,
      },
      watch: {
        // Ignore node_modules and specific files that cause infinite reloads
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
        usePolling: false,
      },
      fs: {
        strict: false,
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
      },
    },
    // Ensure service worker is copied to dist
    publicDir: 'public',
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});