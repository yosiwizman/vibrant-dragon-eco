SELECT 
  routine_name,
  routine_type,
  CASE WHEN routine_name = 'handle_new_user' THEN '✅ Exists' ELSE '❌ Missing' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';