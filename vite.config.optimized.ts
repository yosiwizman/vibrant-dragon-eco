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
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Optimize build output
      target: "esnext",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.logs in production
          drop_debugger: true,
        },
      },
      // Code splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
            'supabase': ['@supabase/supabase-js', '@supabase/auth-ui-react'],
            'utils': ['date-fns', 'lucide-react'],
            // Widget chunks
            'widgets-core': [
              './src/components/widgets/grid/WidgetGrid.tsx',
              './src/components/widgets/grid/WidgetCell.tsx',
              './src/components/widgets/system/layout.ts',
            ],
            'widgets-content': [
              './src/components/widgets/content/CalendarWidget.tsx',
              './src/components/widgets/content/TasksWidget.tsx',
              './src/components/widgets/content/RemindersWidget.tsx',
              './src/components/widgets/content/NotesWidget.tsx',
            ],
          },
        },
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
      ],
    },
  };
});