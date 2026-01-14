SELECT 
  'handle_new_user function' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'on_auth_user_created trigger',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END
UNION ALL
SELECT 
  'update_updated_at_column function',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END;