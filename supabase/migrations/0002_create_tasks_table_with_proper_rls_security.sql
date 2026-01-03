-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "tasks_select_policy" ON public.tasks 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_policy" ON public.tasks 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_policy" ON public.tasks 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "tasks_delete_policy" ON public.tasks 
FOR DELETE TO authenticated USING (auth.uid() = user_id);