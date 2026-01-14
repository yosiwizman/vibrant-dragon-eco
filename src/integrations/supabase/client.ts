import { createClient } from '@supabase/supabase-js';

// NEW Echo AI Supabase Project
const SUPABASE_URL = "https://fjhvhjlicrujksplxzyh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqaHZoamxpY3J1amtzcGx4enloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MjY5NzksImV4cCI6MjA4NDAwMjk3OX0.-ft0zynRBzXAMdFeLaaNJtCcKPIwzugGPDZLWX2zFgc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);