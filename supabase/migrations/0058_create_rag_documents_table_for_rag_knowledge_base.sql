-- Create rag_documents table for RAG knowledge base
CREATE TABLE IF NOT EXISTS public.rag_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "rag_documents_select_policy" ON public.rag_documents 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "rag_documents_insert_policy" ON public.rag_documents 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rag_documents_update_policy" ON public.rag_documents 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "rag_documents_delete_policy" ON public.rag_documents 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS rag_documents_user_id_idx ON public.rag_documents(user_id);
CREATE INDEX IF NOT EXISTS rag_documents_title_idx ON public.rag_documents(user_id, title);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_rag_documents_updated_at ON public.rag_documents;
CREATE TRIGGER update_rag_documents_updated_at
  BEFORE UPDATE ON public.rag_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();