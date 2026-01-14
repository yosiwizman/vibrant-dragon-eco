WITH table_check AS (
  SELECT 
    unnest(ARRAY[
      'profiles', 'tasks', 'reminders', 'notes', 'contacts',
      'calendar_events', 'appointments', 'knowledge', 'notifications',
      'user_widgets', 'api_providers', 'chat_messages', 'email_logs',
      'sms_logs', 'action_history', 'web_logs', 'ai_logs', 'memory_events', 'messages'
    ]) AS expected_table
),
actual_tables AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
),
rls_status AS (
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
),
policy_counts AS (
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT 
  tc.expected_table as table_name,
  CASE 
    WHEN at.table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as exists,
  CASE 
    WHEN rs.rowsecurity THEN '✅ ON'
    ELSE '❌ OFF'
  END as rls,
  COALESCE(pc.policy_count, 0)::text || '/4' as policies,
  CASE 
    WHEN at.table_name IS NULL THEN '❌ CREATE TABLE'
    WHEN NOT COALESCE(rs.rowsecurity, false) THEN '❌ ENABLE RLS'
    WHEN COALESCE(pc.policy_count, 0) < 4 THEN '⚠️ ADD POLICIES'
    ELSE '✅ READY'
  END as action_needed
FROM table_check tc
LEFT JOIN actual_tables at ON tc.expected_table = at.table_name
LEFT JOIN rls_status rs ON tc.expected_table = rs.tablename
LEFT JOIN policy_counts pc ON tc.expected_table = pc.tablename
ORDER BY 
  CASE 
    WHEN tc.expected_table = 'user_widgets' THEN 0
    WHEN tc.expected_table = 'profiles' THEN 1
    ELSE 2
  END,
  tc.expected_table;