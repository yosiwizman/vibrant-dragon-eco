SELECT 
  t.table_name,
  CASE WHEN pt.rowsecurity THEN '✅' ELSE '❌' END as rls,
  COALESCE(policy_count.count, 0) as policies
FROM information_schema.tables t
LEFT JOIN pg_tables pt ON pt.tablename = t.table_name AND pt.schemaname = 'public'
LEFT JOIN (
  SELECT tablename, COUNT(*) as count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) policy_count ON policy_count.tablename = t.table_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;