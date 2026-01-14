-- ============================================
-- ECHO AI - CLEAN DATABASE SETUP
-- Drops existing policies first, then recreates
-- ============================================

-- Drop all existing policies first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Now create all policies fresh
-- PROFILES
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- TASKS
CREATE POLICY "tasks_select_policy" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_policy" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_policy" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete_policy" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- REMINDERS
CREATE POLICY "reminders_select_policy" ON public.reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reminders_insert_policy" ON public.reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_update_policy" ON public.reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reminders_delete_policy" ON public.reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- NOTES
CREATE POLICY "notes_select_policy" ON public.notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notes_insert_policy" ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_update_policy" ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notes_delete_policy" ON public.notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- CONTACTS
CREATE POLICY "contacts_select_policy" ON public.contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "contacts_insert_policy" ON public.contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_update_policy" ON public.contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "contacts_delete_policy" ON public.contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- CALENDAR_EVENTS
CREATE POLICY "calendar_events_select_policy" ON public.calendar_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "calendar_events_insert_policy" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calendar_events_update_policy" ON public.calendar_events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "calendar_events_delete_policy" ON public.calendar_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- APPOINTMENTS
CREATE POLICY "appointments_select_policy" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "appointments_insert_policy" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appointments_update_policy" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "appointments_delete_policy" ON public.appointments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- KNOWLEDGE
CREATE POLICY "knowledge_select_policy" ON public.knowledge FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "knowledge_insert_policy" ON public.knowledge FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "knowledge_update_policy" ON public.knowledge FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "knowledge_delete_policy" ON public.knowledge FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "notifications_select_policy" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_policy" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update_policy" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete_policy" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- USER_WIDGETS
CREATE POLICY "user_widgets_select_policy" ON public.user_widgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_widgets_insert_policy" ON public.user_widgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_widgets_update_policy" ON public.user_widgets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_widgets_delete_policy" ON public.user_widgets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- API_PROVIDERS
CREATE POLICY "api_providers_select_policy" ON public.api_providers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "api_providers_insert_policy" ON public.api_providers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "api_providers_update_policy" ON public.api_providers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "api_providers_delete_policy" ON public.api_providers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- CHAT_MESSAGES
CREATE POLICY "chat_messages_select_policy" ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_insert_policy" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_messages_update_policy" ON public.chat_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_delete_policy" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- EMAIL_LOGS
CREATE POLICY "email_logs_select_policy" ON public.email_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "email_logs_insert_policy" ON public.email_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "email_logs_update_policy" ON public.email_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "email_logs_delete_policy" ON public.email_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SMS_LOGS
CREATE POLICY "sms_logs_select_policy" ON public.sms_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sms_logs_insert_policy" ON public.sms_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sms_logs_update_policy" ON public.sms_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sms_logs_delete_policy" ON public.sms_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ACTION_HISTORY
CREATE POLICY "action_history_select_policy" ON public.action_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "action_history_insert_policy" ON public.action_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "action_history_update_policy" ON public.action_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "action_history_delete_policy" ON public.action_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WEB_LOGS
CREATE POLICY "web_logs_select_policy" ON public.web_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "web_logs_insert_policy" ON public.web_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "web_logs_update_policy" ON public.web_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "web_logs_delete_policy" ON public.web_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI_LOGS
CREATE POLICY "ai_logs_select_policy" ON public.ai_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai_logs_insert_policy" ON public.ai_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_logs_update_policy" ON public.ai_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai_logs_delete_policy" ON public.ai_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- MEMORY_EVENTS
CREATE POLICY "memory_events_select_policy" ON public.memory_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "memory_events_insert_policy" ON public.memory_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memory_events_update_policy" ON public.memory_events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "memory_events_delete_policy" ON public.memory_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- MESSAGES
CREATE POLICY "messages_select_policy" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "messages_insert_policy" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "messages_update_policy" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "messages_delete_policy" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

SELECT '✅ ALL POLICIES RECREATED SUCCESSFULLY!' as status;