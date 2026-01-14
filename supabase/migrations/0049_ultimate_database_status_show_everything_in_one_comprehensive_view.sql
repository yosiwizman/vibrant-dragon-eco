WITH 
  expected_tables AS (
    SELECT unnest(ARRAY[
      'profiles', 'tasks', 'reminders', 'notes', 'contacts',
      'calendar_events', 'appointments', 'knowledge', 'notifications',
      'user_widgets', 'api_providers', 'chat_messages', 'email_logs',
      'sms_logs', 'action_history', 'web_logs', 'ai_logs', 'memory_events', 'messages'
    ]) AS table_name
  ),
  table_status AS (
    SELECT 
      et.table_name,
      CASE WHEN t.table_name IS NOT NULL THEN true ELSE false END as exists,
      COALESCE(pt.rowsecurity, false) as has_rls,
      COALESCE(pc.policy_count, 0) as policy_count
    FROM expected_tables et
    LEFT JOIN information_schema.tables t ON et.table_name = t.table_name AND t.table_schema = 'public'
    LEFT JOIN pg_tables pt ON et.table_name = pt.tablename AND pt.schemaname = 'public'
    LEFT JOIN (
      SELECT tablename, COUNT(*) as policy_count
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY tablename
    ) pc ON et.table_name = pc.tablename
  )
SELECT 
  table_name,
  CASE WHEN exists THEN '✅' ELSE '❌' END as exists,
  CASE WHEN has_rls THEN '✅' ELSE '❌' END as rls,
  policy_count::text || '/4' as policies,
  CASE 
    WHEN NOT exists THEN '🔴 MISSING TABLE'
    WHEN NOT has_rls THEN '🟡 ENABLE RLS'
    WHEN policy_count < 4 THEN '🟡 ADD POLICIES (' || (4 - policy_count)::text || ' needed)'
    ELSE '🟢 READY'
  END as status
FROM table_status
ORDER BY 
  CASE 
    WHEN table_name = 'user_widgets' THEN 0
    WHEN table_name = 'profiles' THEN 1
    ELSE 2
  END,
  table_name;