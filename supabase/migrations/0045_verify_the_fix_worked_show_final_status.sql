SELECT 
  'user_widgets' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_widgets' AND table_schema = 'public')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as exists,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_widgets' AND schemaname = 'public' AND rowsecurity = true)
    THEN '✅ RLS ON'
    ELSE '❌ RLS OFF'
  END as rls,
  (SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'user_widgets' AND schemaname = 'public') || '/4 policies' as policies,
  (SELECT COUNT(*)::text FROM pg_trigger WHERE tgrelid = 'public.user_widgets'::regclass) || ' triggers' as triggers;