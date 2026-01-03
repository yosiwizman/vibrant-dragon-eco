-- Add recurrence columns to reminders table
ALTER TABLE public.reminders 
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS parent_reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMP WITH TIME ZONE;

-- Add recurrence columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Create action_history table for undo functionality
CREATE TABLE IF NOT EXISTS public.action_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  previous_state JSONB,
  new_state JSONB,
  can_undo BOOLEAN DEFAULT true,
  undone BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on action_history
ALTER TABLE public.action_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for action_history
CREATE POLICY "action_history_select_policy" ON public.action_history 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "action_history_insert_policy" ON public.action_history 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "action_history_update_policy" ON public.action_history 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "action_history_delete_policy" ON public.action_history 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create rag_documents table for storing document knowledge
CREATE TABLE IF NOT EXISTS public.rag_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_url TEXT,
  file_path TEXT,
  chunks JSONB,
  embeddings_generated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rag_documents
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rag_documents
CREATE POLICY "rag_documents_select_policy" ON public.rag_documents 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "rag_documents_insert_policy" ON public.rag_documents 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rag_documents_update_policy" ON public.rag_documents 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "rag_documents_delete_policy" ON public.rag_documents 
FOR DELETE TO authenticated USING (auth.uid() = user_id);