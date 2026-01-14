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