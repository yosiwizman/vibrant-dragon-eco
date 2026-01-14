SELECT 
  '📊 DATABASE SUMMARY' as header,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE')::text as total_tables,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true)::text as tables_with_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public')::text as total_policies,
  (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public')::text as tables_with_policies,
  (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace)::text as functions,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace))::text as triggers;