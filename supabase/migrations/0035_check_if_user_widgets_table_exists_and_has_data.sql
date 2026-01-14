SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_widgets' AND table_schema = 'public')
    THEN '✅ user_widgets table exists'
    ELSE '❌ user_widgets table MISSING - CRITICAL!'
  END as table_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_widgets' AND table_schema = 'public')
    THEN (SELECT COUNT(*)::text || ' widgets' FROM user_widgets)
    ELSE 'N/A'
  END as widget_count;