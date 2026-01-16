import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fjhvhjlicrujksplxzyh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqaHZoamxpY3J1amtzcGx4enloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MjY5NzksImV4cCI6MjA4NDAwMjk3OX0.-ft0zynRBzXAMdFeLaaNJtCcKPIwzugGPDZLWX2zFgc';

// Get the site URL for auth redirects
const getSiteUrl = () => {
  // Check for environment variable first (set in Vercel/deployment)
  if (import.meta.env.VITE_SITE_URL) {
    return import.meta.env.VITE_SITE_URL;
  }
  
  // In browser, use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for SSR or build time
  return 'http://localhost:5173';
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // This ensures auth redirects work with your custom domain
    redirectTo: getSiteUrl(),
  },
});

// Export for use in other parts of the app
export { getSiteUrl };