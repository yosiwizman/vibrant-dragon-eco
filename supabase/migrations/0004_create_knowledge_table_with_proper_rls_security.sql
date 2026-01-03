-- Create knowledge table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.knowledge ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'knowledge_select_policy' AND tablename = 'knowledge') THEN
    CREATE POLICY "knowledge_select_policy" ON public.knowledge 
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'knowledge_insert_policy' AND tablename = 'knowledge') THEN
    CREATE POLICY "knowledge_insert_policy" ON public.knowledge 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'knowledge_update_policy' AND tablename = 'knowledge') THEN
    CREATE POLICY "knowledge_update_policy" ON public.knowledge 
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'knowledge_delete_policy' AND tablename = 'knowledge') THEN
    CREATE POLICY "knowledge_delete_policy" ON public.knowledge 
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;