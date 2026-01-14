-- ============================================
-- ECHO AI - FIX ALL DATABASE ISSUES
-- ============================================
-- This script will fix any missing tables, RLS, or policies
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- FIX 1: Ensure all tables exist with RLS
-- ============================================

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  preferred_name TEXT,
  name TEXT,
  company TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER_WIDGETS TABLE (CRITICAL!)
CREATE TABLE IF NOT EXISTS public.user_widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_id TEXT NOT NULL,
  widget_type TEXT NOT NULL,
  position JSONB NOT NULL,
  size JSONB NOT NULL,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.user_widgets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FIX 2: Create all RLS policies
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles 
FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles 
FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy" ON public.profiles 
FOR DELETE TO authenticated USING (auth.uid() = id);

-- User widgets policies
DROP POLICY IF EXISTS "user_widgets_select_policy" ON public.user_widgets;
CREATE POLICY "user_widgets_select_policy" ON public.user_widgets 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_widgets_insert_policy" ON public.user_widgets;
CREATE POLICY "user_widgets_insert_policy" ON public.user_widgets 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_widgets_update_policy" ON public.user_widgets;
CREATE POLICY "user_widgets_update_policy" ON public.user_widgets 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_widgets_delete_policy" ON public.user_widgets;
CREATE POLICY "user_widgets_delete_policy" ON public.user_widgets 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Tasks policies
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
CREATE POLICY "tasks_select_policy" ON public.tasks 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;
CREATE POLICY "tasks_insert_policy" ON public.tasks 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;
CREATE POLICY "tasks_update_policy" ON public.tasks 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_delete_policy" ON public.tasks;
CREATE POLICY "tasks_delete_policy" ON public.tasks 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reminders policies
DROP POLICY IF EXISTS "reminders_select_policy" ON public.reminders;
CREATE POLICY "reminders_select_policy" ON public.reminders 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reminders_insert_policy" ON public.reminders;
CREATE POLICY "reminders_insert_policy" ON public.reminders 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reminders_update_policy" ON public.reminders;
CREATE POLICY "reminders_update_policy" ON public.reminders 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reminders_delete_policy" ON public.reminders;
CREATE POLICY "reminders_delete_policy" ON public.reminders 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notes policies
DROP POLICY IF EXISTS "notes_select_policy" ON public.notes;
CREATE POLICY "notes_select_policy" ON public.notes 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notes_insert_policy" ON public.notes;
CREATE POLICY "notes_insert_policy" ON public.notes 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notes_update_policy" ON public.notes;
CREATE POLICY "notes_update_policy" ON public.notes 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notes_delete_policy" ON public.notes;
CREATE POLICY "notes_delete_policy" ON public.notes 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Contacts policies
DROP POLICY IF EXISTS "contacts_select_policy" ON public.contacts;
CREATE POLICY "contacts_select_policy" ON public.contacts 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "contacts_insert_policy" ON public.contacts;
CREATE POLICY "contacts_insert_policy" ON public.contacts 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contacts_update_policy" ON public.contacts;
CREATE POLICY "contacts_update_policy" ON public.contacts 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "contacts_delete_policy" ON public.contacts;
CREATE POLICY "contacts_delete_policy" ON public.contacts 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Calendar events policies
DROP POLICY IF EXISTS "calendar_events_select_policy" ON public.calendar_events;
CREATE POLICY "calendar_events_select_policy" ON public.calendar_events 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "calendar_events_insert_policy" ON public.calendar_events;
CREATE POLICY "calendar_events_insert_policy" ON public.calendar_events 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "calendar_events_update_policy" ON public.calendar_events;
CREATE POLICY "calendar_events_update_policy" ON public.calendar_events 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "calendar_events_delete_policy" ON public.calendar_events;
CREATE POLICY "calendar_events_delete_policy" ON public.calendar_events 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Appointments policies
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
CREATE POLICY "appointments_select_policy" ON public.appointments 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;
CREATE POLICY "appointments_insert_policy" ON public.appointments 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "appointments_update_policy" ON public.appointments;
CREATE POLICY "appointments_update_policy" ON public.appointments 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "appointments_delete_policy" ON public.appointments;
CREATE POLICY "appointments_delete_policy" ON public.appointments 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Knowledge policies
DROP POLICY IF EXISTS "knowledge_select_policy" ON public.knowledge;
CREATE POLICY "knowledge_select_policy" ON public.knowledge 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "knowledge_insert_policy" ON public.knowledge;
CREATE POLICY "knowledge_insert_policy" ON public.knowledge 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "knowledge_update_policy" ON public.knowledge;
CREATE POLICY "knowledge_update_policy" ON public.knowledge 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "knowledge_delete_policy" ON public.knowledge;
CREATE POLICY "knowledge_delete_policy" ON public.knowledge 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy" ON public.notifications 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy" ON public.notifications 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
CREATE POLICY "notifications_delete_policy" ON public.notifications 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- API providers policies
DROP POLICY IF EXISTS "api_providers_select_policy" ON public.api_providers;
CREATE POLICY "api_providers_select_policy" ON public.api_providers 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "api_providers_insert_policy" ON public.api_providers;
CREATE POLICY "api_providers_insert_policy" ON public.api_providers 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "api_providers_update_policy" ON public.api_providers;
CREATE POLICY "api_providers_update_policy" ON public.api_providers 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "api_providers_delete_policy" ON public.api_providers;
CREATE POLICY "api_providers_delete_policy" ON public.api_providers 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Chat messages policies
DROP POLICY IF EXISTS "chat_messages_select_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_select_policy" ON public.chat_messages 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_messages_insert_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_policy" ON public.chat_messages 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_messages_update_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_update_policy" ON public.chat_messages 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_messages_delete_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_delete_policy" ON public.chat_messages 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Email logs policies
DROP POLICY IF EXISTS "email_logs_select_policy" ON public.email_logs;
CREATE POLICY "email_logs_select_policy" ON public.email_logs 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "email_logs_insert_policy" ON public.email_logs;
CREATE POLICY "email_logs_insert_policy" ON public.email_logs 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "email_logs_update_policy" ON public.email_logs;
CREATE POLICY "email_logs_update_policy" ON public.email_logs 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "email_logs_delete_policy" ON public.email_logs;
CREATE POLICY "email_logs_delete_policy" ON public.email_logs 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SMS logs policies
DROP POLICY IF EXISTS "sms_logs_select_policy" ON public.sms_logs;
CREATE POLICY "sms_logs_select_policy" ON public.sms_logs 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sms_logs_insert_policy" ON public.sms_logs;
CREATE POLICY "sms_logs_insert_policy" ON public.sms_logs 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sms_logs_update_policy" ON public.sms_logs;
CREATE POLICY "sms_logs_update_policy" ON public.sms_logs 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sms_logs_delete_policy" ON public.sms_logs;
CREATE POLICY "sms_logs_delete_policy" ON public.sms_logs 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Action history policies
DROP POLICY IF EXISTS "action_history_select_policy" ON public.action_history;
CREATE POLICY "action_history_select_policy" ON public.action_history 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "action_history_insert_policy" ON public.action_history;
CREATE POLICY "action_history_insert_policy" ON public.action_history 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "action_history_update_policy" ON public.action_history;
CREATE POLICY "action_history_update_policy" ON public.action_history 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "action_history_delete_policy" ON public.action_history;
CREATE POLICY "action_history_delete_policy" ON public.action_history 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Web logs policies
DROP POLICY IF EXISTS "web_logs_select_policy" ON public.web_logs;
CREATE POLICY "web_logs_select_policy" ON public.web_logs 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "web_logs_insert_policy" ON public.web_logs;
CREATE POLICY "web_logs_insert_policy" ON public.web_logs 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "web_logs_update_policy" ON public.web_logs;
CREATE POLICY "web_logs_update_policy" ON public.web_logs 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "web_logs_delete_policy" ON public.web_logs;
CREATE POLICY "web_logs_delete_policy" ON public.web_logs 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI logs policies
DROP POLICY IF EXISTS "ai_logs_select_policy" ON public.ai_logs;
CREATE POLICY "ai_logs_select_policy" ON public.ai_logs 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_logs_insert_policy" ON public.ai_logs;
CREATE POLICY "ai_logs_insert_policy" ON public.ai_logs 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_logs_update_policy" ON public.ai_logs;
CREATE POLICY "ai_logs_update_policy" ON public.ai_logs 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_logs_delete_policy" ON public.ai_logs;
CREATE POLICY "ai_logs_delete_policy" ON public.ai_logs 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Memory events policies
DROP POLICY IF EXISTS "memory_events_select_policy" ON public.memory_events;
CREATE POLICY "memory_events_select_policy" ON public.memory_events 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "memory_events_insert_policy" ON public.memory_events;
CREATE POLICY "memory_events_insert_policy" ON public.memory_events 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "memory_events_update_policy" ON public.memory_events;
CREATE POLICY "memory_events_update_policy" ON public.memory_events 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "memory_events_delete_policy" ON public.memory_events;
CREATE POLICY "memory_events_delete_policy" ON public.memory_events 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Messages policies
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
CREATE POLICY "messages_insert_policy" ON public.messages 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
CREATE POLICY "messages_update_policy" ON public.messages 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;
CREATE POLICY "messages_delete_policy" ON public.messages 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- FIX 3: Ensure handle_new_user function exists
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- ============================================
-- FIX 4: Ensure trigger exists
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FIX 5: Ensure updated_at triggers exist
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_widgets_updated_at ON public.user_widgets;
CREATE TRIGGER update_user_widgets_updated_at
  BEFORE UPDATE ON public.user_widgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_providers_updated_at ON public.api_providers;
CREATE TRIGGER update_api_providers_updated_at
  BEFORE UPDATE ON public.api_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================
SELECT '✅ All fixes applied successfully!' as status;