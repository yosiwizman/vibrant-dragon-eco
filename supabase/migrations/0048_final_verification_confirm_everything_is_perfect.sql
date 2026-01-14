SELECT 
  '🎯 FINAL DATABASE STATUS' as header,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE')::text || ' total tables' as tables,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true)::text || ' with RLS' as rls_enabled,
  (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public')::text || ' tables with policies' as policies,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables t
      JOIN pg_tables pt ON t.table_name = pt.tablename AND pt.schemaname = 'public'
      WHERE t.table_schema = 'public' 
        AND t.table_name = 'user_widgets'
        AND pt.rowsecurity = true
        AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_widgets' AND schemaname = 'public') = 4
    )
    THEN '✅ PRODUCTION READY'
    ELSE '❌ NEEDS ATTENTION'
  END as overall_status;