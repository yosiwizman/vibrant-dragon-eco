-- ============================================
-- ECHO AI - COMPLETE SQL AUDIT & FIX
-- ============================================
-- Run this to verify and fix all database issues
-- Date: January 14, 2026
-- ============================================

-- Step 1: Verify all tables exist
DO $$
DECLARE
  missing_tables TEXT[];
BEGIN
  -- Check for missing tables
  SELECT ARRAY_AGG(table_name)
  INTO missing_tables
  FROM (
    SELECT unnest(ARRAY[
      'profiles', 'tasks', 'reminders', 'notes', 'contacts',
      'calendar_events', 'appointments', 'knowledge', 'notifications',
      'user_widgets', 'api_providers', 'chat_messages', 'email_logs',
      'sms_logs', 'action_history', 'web_logs', 'ai_logs', 'memory_events', 'messages'
    ]) AS table_name
  ) expected
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = expected.table_name
  );

  IF missing_tables IS NOT NULL THEN
    RAISE NOTICE 'Missing tables: %', missing_tables;
  ELSE
    RAISE NOTICE '✅ All tables exist';
  END IF;
END $$;

-- Step 2: Verify RLS is enabled on all tables
DO $$
DECLARE
  tables_without_rls TEXT[];
BEGIN
  SELECT ARRAY_AGG(tablename)
  INTO tables_without_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND NOT rowsecurity;

  IF tables_without_rls IS NOT NULL THEN
    RAISE NOTICE '❌ Tables without RLS: %', tables_without_rls;
  ELSE
    RAISE NOTICE '✅ RLS enabled on all tables';
  END IF;
END $$;

-- Step 3: Count policies per table
SELECT 
  t.tablename,
  COUNT(p.policyname) as policy_count,
  CASE 
    WHEN COUNT(p.policyname) >= 4 THEN '✅ Complete (4 policies)'
    WHEN COUNT(p.policyname) > 0 THEN '⚠️ Partial (' || COUNT(p.policyname) || ' policies)'
    ELSE '❌ No policies'
  END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename
ORDER BY policy_count ASC, t.tablename;

-- Step 4: Verify handle_new_user function exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'handle_new_user'
    ) THEN '✅ handle_new_user function exists'
    ELSE '❌ handle_new_user function MISSING'
  END as function_status;

-- Step 5: Verify trigger exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_schema = 'auth' AND trigger_name = 'on_auth_user_created'
    ) THEN '✅ on_auth_user_created trigger exists'
    ELSE '❌ on_auth_user_created trigger MISSING'
  END as trigger_status;

-- Step 6: Check for any data
SELECT 
  'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'reminders', COUNT(*) FROM reminders
UNION ALL
SELECT 'notes', COUNT(*) FROM notes
UNION ALL
SELECT 'user_widgets', COUNT(*) FROM user_widgets
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'knowledge', COUNT(*) FROM knowledge
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY table_name;

-- ============================================
-- AUDIT COMPLETE
-- ============================================
-- Review the results above
-- Any ❌ indicates an issue that needs fixing
-- ============================================