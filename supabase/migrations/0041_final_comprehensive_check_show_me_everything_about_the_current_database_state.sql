SELECT 
  'TABLES' as category,
  COUNT(*)::text as count,
  string_agg(table_name, ', ' ORDER BY table_name) as details
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
  'TABLES WITH RLS',
  COUNT(*)::text,
  string_agg(tablename, ', ' ORDER BY tablename)
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT 
  'RLS POLICIES',
  COUNT(*)::text,
  COUNT(DISTINCT tablename)::text || ' tables covered'
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'FUNCTIONS',
  COUNT(*)::text,
  string_agg(routine_name, ', ' ORDER BY routine_name)
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
UNION ALL
SELECT 
  'TRIGGERS',
  COUNT(*)::text,
  string_agg(trigger_name, ', ' ORDER BY trigger_name)
FROM information_schema.triggers
WHERE trigger_schema = 'public';