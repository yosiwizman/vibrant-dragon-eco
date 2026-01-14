SELECT 
  t.tablename,
  COUNT(p.policyname) as policy_count,
  CASE 
    WHEN COUNT(p.policyname) >= 4 THEN '✅ Complete'
    WHEN COUNT(p.policyname) > 0 THEN '⚠️ Partial'
    ELSE '❌ Missing'
  END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename
ORDER BY t.tablename;