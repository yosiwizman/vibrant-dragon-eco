import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(async () => {
  const plugins: PluginOption[] = [react()];

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
      // Increase chunk size warning limit for large libraries like web-llm
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          // Manual chunks for better code splitting
          manualChunks: {
            // Vendor chunks - split large dependencies
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-radix': [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-collapsible',
              '@radix-ui/react-context-menu',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-hover-card',
              '@radix-ui/react-label',
              '@radix-ui/react-menubar',
              '@radix-ui/react-navigation-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-progress',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slider',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group',
              '@radix-ui/react-tooltip',
            ],
            'vendor-supabase': ['@supabase/supabase-js', '@supabase/auth-ui-react', '@supabase/auth-ui-shared'],
            'vendor-charts': ['recharts'],
            'vendor-utils': ['date-fns', 'zod', 'clsx', 'tailwind-merge', 'class-variance-authority'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-sentry': ['@sentry/react'],
            'vendor-posthog': ['posthog-js'],
            // Web-LLM is huge - keep it separate and lazy-loaded
            'vendor-webllm': ['@mlc-ai/web-llm'],
            // VAD for voice activity detection
            'vendor-vad': ['@ricky0123/vad-react', '@ricky0123/vad-web'],
          },
        },
      },
      // Enable source maps for production debugging (optional)
      sourcemap: false,
      // Minification settings
      minify: 'esbuild',
      // Target modern browsers for smaller bundles
      target: 'es2020',
    },
    publicDir: 'public',
    optimizeDeps: {
      exclude: ['lucide-react'],
      // Include heavy dependencies for faster dev startup
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        'date-fns',
      ],
    },
  };
});