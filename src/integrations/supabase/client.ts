import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pkwiahckdwxzdpusnsui.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrd2lhaGNrZHd4emRwdXNuc3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTQ1ODYsImV4cCI6MjA3ODM3MDU4Nn0.R76DpGmYas8IEB2AzC4M6sOhVZH0TREMyuOGJPYuEcU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);