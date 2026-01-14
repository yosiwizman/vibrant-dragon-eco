SELECT 
  'DATABASE HEALTH CHECK' as report_section,
  '===================' as separator,
  '' as blank_line
UNION ALL
SELECT 
  '📊 TABLES',
  (SELECT COUNT(*)::text FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') || ' total',
  ''
UNION ALL
SELECT 
  '🔒 RLS ENABLED',
  (SELECT COUNT(*)::text FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) || ' tables',
  ''
UNION ALL
SELECT 
  '🛡️ POLICIES',
  (SELECT COUNT(*)::text FROM pg_policies WHERE schemaname = 'public') || ' total',
  ''
UNION ALL
SELECT 
  '⚙️ FUNCTIONS',
  (SELECT COUNT(*)::text FROM pg_proc WHERE pronamespace = 'public'::regnamespace) || ' total',
  ''
UNION ALL
SELECT 
  '🔔 TRIGGERS',
  (SELECT COUNT(*)::text FROM pg_trigger WHERE tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace)) || ' total',
  ''
UNION ALL
SELECT 
  '===================' as separator,
  'CRITICAL TABLES' as section,
  ''
UNION ALL
SELECT 
  '✅ user_widgets',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_widgets' AND table_schema = 'public') THEN 'EXISTS' ELSE 'MISSING' END,
  (SELECT COUNT(*)::text || ' policies' FROM pg_policies WHERE tablename = 'user_widgets')
UNION ALL
SELECT 
  '✅ profiles',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN 'EXISTS' ELSE 'MISSING' END,
  (SELECT COUNT(*)::text || ' policies' FROM pg_policies WHERE tablename = 'profiles')
UNION ALL
SELECT 
  '✅ tasks',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public') THEN 'EXISTS' ELSE 'MISSING' END,
  (SELECT COUNT(*)::text || ' policies' FROM pg_policies WHERE tablename = 'tasks')
UNION ALL
SELECT 
  '===================' as separator,
  'OVERALL STATUS' as section,
  ''
UNION ALL
SELECT 
  '🎯 PRODUCTION READY',
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) >= 15
      AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 60
      AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
    THEN '✅ YES'
    ELSE '❌ NO'
  END,
  '';