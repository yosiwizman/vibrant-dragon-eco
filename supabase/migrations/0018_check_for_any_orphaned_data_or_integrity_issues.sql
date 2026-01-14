SELECT 
  'tasks' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT user_id) as unique_users
FROM tasks
UNION ALL
SELECT 
  'reminders',
  COUNT(*),
  COUNT(DISTINCT user_id)
FROM reminders
UNION ALL
SELECT 
  'notes',
  COUNT(*),
  COUNT(DISTINCT user_id)
FROM notes
UNION ALL
SELECT 
  'user_widgets',
  COUNT(*),
  COUNT(DISTINCT user_id)
FROM user_widgets
UNION ALL
SELECT 
  'contacts',
  COUNT(*),
  COUNT(DISTINCT user_id)
FROM contacts;