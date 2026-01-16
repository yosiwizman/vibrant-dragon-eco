// Domain configuration for the application
// Update PRODUCTION_DOMAIN when you have your custom domain

export const DOMAINS = {
  // Your Supabase project URL (don't change this)
  SUPABASE_URL: 'https://fjhvhjlicrujksplxzyh.supabase.co',
  
  // Update this to your custom domain when ready
  // Example: 'https://yourdomain.com'
  PRODUCTION_DOMAIN: import.meta.env.VITE_SITE_URL || window.location.origin,
  
  // Development domain
  DEVELOPMENT_DOMAIN: 'http://localhost:5173',
} as const;

// Get the current site URL based on environment
export function getSiteUrl(): string {
  if (import.meta.env.DEV) {
    return DOMAINS.DEVELOPMENT_DOMAIN;
  }
  return DOMAINS.PRODUCTION_DOMAIN;
}

// Get auth redirect URL
export function getAuthRedirectUrl(): string {
  return `${getSiteUrl()}/`;
}

// Check if we're on a valid domain
export function isValidDomain(): boolean {
  const currentOrigin = window.location.origin;
  return (
    currentOrigin === DOMAINS.PRODUCTION_DOMAIN ||
    currentOrigin === DOMAINS.DEVELOPMENT_DOMAIN ||
    currentOrigin.includes('localhost') ||
    currentOrigin.includes('vercel.app')
  );
}