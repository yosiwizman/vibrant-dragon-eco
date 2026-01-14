SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;