SELECT 
  'user_widgets' as critical_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_widgets' AND table_schema = 'public')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as table_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_widgets' AND schemaname = 'public' AND rowsecurity = true)
    THEN '✅ RLS ON'
    ELSE '❌ RLS OFF'
  END as rls_status,
  (SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'user_widgets' AND schemaname = 'public') || ' policies' as policy_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_widgets' AND schemaname = 'public') = 4
    THEN '✅ COMPLETE'
    ELSE '⚠️ INCOMPLETE'
  END as policy_status;