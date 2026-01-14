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

DROP POLICY IF EXISTS "user_widgets_select_policy" ON public.user_widgets;
CREATE POLICY "user_widgets_select_policy" ON public.user_widgets 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_widgets_insert_policy" ON public.user_widgets;
CREATE POLICY "user_widgets_insert_policy" ON public.user_widgets 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_widgets_update_policy" ON public.user_widgets;
CREATE POLICY "user_widgets_update_policy" ON public.user_widgets 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_widgets_delete_policy" ON public.user_widgets;
CREATE POLICY "user_widgets_delete_policy" ON public.user_widgets 
FOR DELETE TO authenticated USING (auth.uid() = user_id);