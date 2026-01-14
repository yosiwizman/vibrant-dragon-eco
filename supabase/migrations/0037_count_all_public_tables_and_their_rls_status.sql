SELECT 
  COUNT(*) FILTER (WHERE table_type = 'BASE TABLE') as total_tables,
  COUNT(*) FILTER (WHERE table_type = 'BASE TABLE' AND EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = t.table_name 
      AND rowsecurity = true
  )) as tables_with_rls
FROM information_schema.tables t
WHERE table_schema = 'public';