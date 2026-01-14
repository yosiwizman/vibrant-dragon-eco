SELECT 
  '🎯 FINAL DATABASE STATUS' as header,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE')::text || ' tables' as tables,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true)::text || ' with RLS' as rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public')::text || ' policies' as policies,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) >= 15
      AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 60
    THEN '✅ PRODUCTION READY'
    ELSE '⚠️ NEEDS ATTENTION'
  END as status;