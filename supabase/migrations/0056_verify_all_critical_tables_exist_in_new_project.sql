SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'tasks', 'reminders', 'notes', 'user_widgets', 'contacts', 'appointments', 'knowledge', 'notifications')
    THEN '✅ CRITICAL'
    ELSE '✅ Optional'
  END as importance
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY 
  CASE WHEN table_name IN ('profiles', 'user_widgets') THEN 0 ELSE 1 END,
  table_name;