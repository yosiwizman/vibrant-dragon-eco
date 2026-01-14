SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_widgets' AND table_schema = 'public')
    THEN '✅ Table exists'
    ELSE '❌ Table missing'
  END as table_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_widgets' AND schemaname = 'public' AND rowsecurity = true)
    THEN '✅ RLS enabled'
    ELSE '❌ RLS disabled'
  END as rls_status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_widgets' AND schemaname = 'public') as policy_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_widgets' AND schemaname = 'public') >= 4
    THEN '✅ All policies present'
    ELSE '❌ Missing policies'
  END as policy_status;