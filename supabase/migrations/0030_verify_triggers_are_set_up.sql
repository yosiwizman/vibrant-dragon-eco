SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation,
  '✅' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;