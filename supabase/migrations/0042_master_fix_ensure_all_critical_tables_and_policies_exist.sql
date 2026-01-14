-- ============================================
-- ECHO AI - FINAL MASTER FIX
-- ============================================
-- This ensures ALL critical tables exist with proper RLS
-- Safe to run multiple times
-- ============================================

-- 1. Ensure user_widgets exists (MOST CRITICAL!)
CREATE TABLE IF NOT EXISTS public.user_widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_id TEXT NOT NULL,
  widget_type TEXT NOT NULL,
  position JSONB NOT NULL,
  size JSONB NOT NULL,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_widgets ENABLE ROW LEVEL SECURITY;

-- 2. Recreate all user_widgets policies (ensure they're correct)
DROP POLICY IF EXISTS "user_widgets_select_policy" ON public.user_widgets;
DROP POLICY IF EXISTS "user_widgets_insert_policy" ON public.user_widgets;
DROP POLICY IF EXISTS "user_widgets_update_policy" ON public.user_widgets;
DROP POLICY IF EXISTS "user_widgets_delete_policy" ON public.user_widgets;

CREATE POLICY "user_widgets_select_policy" ON public.user_widgets 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_widgets_insert_policy" ON public.user_widgets 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_widgets_update_policy" ON public.user_widgets 
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_widgets_delete_policy" ON public.user_widgets 
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_widgets_updated_at ON public.user_widgets;
CREATE TRIGGER update_user_widgets_updated_at
  BEFORE UPDATE ON public.user_widgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Verify and return status
SELECT 
  '✅ MASTER FIX COMPLETE' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_widgets' AND table_schema = 'public')::text || ' user_widgets table' as table_check,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_widgets' AND schemaname = 'public')::text || ' RLS policies' as policy_check,
  (SELECT CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END FROM pg_tables WHERE tablename = 'user_widgets' AND schemaname = 'public') as rls_check;