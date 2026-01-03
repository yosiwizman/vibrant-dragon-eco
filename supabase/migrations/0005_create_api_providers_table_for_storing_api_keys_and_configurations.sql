-- Create api_providers table for storing various API configurations
CREATE TABLE IF NOT EXISTS public.api_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  api_key TEXT,
  api_secret TEXT,
  endpoint_url TEXT,
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider_name)
);

-- Enable RLS
ALTER TABLE public.api_providers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "api_providers_select_policy" ON public.api_providers 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "api_providers_insert_policy" ON public.api_providers 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_providers_update_policy" ON public.api_providers 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "api_providers_delete_policy" ON public.api_providers 
FOR DELETE TO authenticated USING (auth.uid() = user_id);