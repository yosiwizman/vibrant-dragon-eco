SELECT 
  COUNT(*) as total_policies,
  COUNT(DISTINCT tablename) as tables_with_policies,
  CASE 
    WHEN COUNT(*) >= 60 THEN '✅ All policies present'
    ELSE '⚠️ Some policies missing'
  END as status
FROM pg_policies
WHERE schemaname = 'public';