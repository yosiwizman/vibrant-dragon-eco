SELECT 
  'Function: handle_new_user' as item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
    THEN '✅ Exists' 
    ELSE '❌ Missing' 
  END as status
UNION ALL
SELECT 
  'Trigger: on_auth_user_created',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
    THEN '✅ Exists' 
    ELSE '❌ Missing' 
  END;