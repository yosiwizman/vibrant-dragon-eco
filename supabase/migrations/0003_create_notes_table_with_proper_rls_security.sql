-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "notes_select_policy" ON public.notes 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "notes_insert_policy" ON public.notes 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notes_update_policy" ON public.notes 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "notes_delete_policy" ON public.notes 
FOR DELETE TO authenticated USING (auth.uid() = user_id);