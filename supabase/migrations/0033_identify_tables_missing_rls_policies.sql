SELECT 
  t.tablename,
  CASE 
    WHEN NOT t.rowsecurity THEN '❌ RLS Disabled'
    WHEN COUNT(p.policyname) = 0 THEN '❌ No Policies'
    WHEN COUNT(p.policyname) < 4 THEN '⚠️ Incomplete (' || COUNT(p.policyname) || '/4)'
    ELSE '✅ Complete'
  END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
HAVING NOT t.rowsecurity OR COUNT(p.policyname) < 4
ORDER BY t.tablename;