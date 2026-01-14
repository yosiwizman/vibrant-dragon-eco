import { createClient } from '@supabase/supabase-js';

// ============================================
// NEW SUPABASE PROJECT CONFIGURATION
// ============================================
// After creating your new Supabase project:
// 1. Replace YOUR_NEW_PROJECT_ID with your actual project ID
// 2. Replace YOUR_NEW_ANON_KEY with your actual anon key
// 3. Rename this file to client.ts (backup the old one first)
// ============================================

const supabaseUrl = 'https://YOUR_NEW_PROJECT_ID.supabase.co';
const supabaseAnonKey = 'YOUR_NEW_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// HOW TO GET THESE VALUES:
// ============================================
// 1. Go to your Supabase project dashboard
// 2. Click "Project Settings" (gear icon)
// 3. Go to "API" section
// 4. Copy:
//    - Project URL → supabaseUrl
//    - anon/public key → supabaseAnonKey
// ============================================