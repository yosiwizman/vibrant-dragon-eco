-- Complete Echo AI Assistant Database Schema
-- Run this in your NEW Supabase project

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- PROFILES TABLE
-- ============================================
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

CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE,
  recurrence_rule TEXT,
  recurrence_end_date TIMESTAMP WITH TIME ZONE,
  parent_task_id UUID REFERENCES public.tasks(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_policy" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_policy" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_policy" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete_policy" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- REMINDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  due_time TIMESTAMP WITH TIME ZONE NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  recurrence_rule TEXT,
  recurrence_end_date TIMESTAMP WITH TIME ZONE,
  parent_reminder_id UUID REFERENCES public.reminders(id),
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminders_select_policy" ON public.reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reminders_insert_policy" ON public.reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_update_policy" ON public.reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reminders_delete_policy" ON public.reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_select_policy" ON public.notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notes_insert_policy" ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_update_policy" ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notes_delete_policy" ON public.notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select_policy" ON public.contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "contacts_insert_policy" ON public.contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_update_policy" ON public.contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "contacts_delete_policy" ON public.contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- CALENDAR EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  attendees JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_events_select_policy" ON public.calendar_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "calendar_events_insert_policy" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calendar_events_update_policy" ON public.calendar_events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "calendar_events_delete_policy" ON public.calendar_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_name TEXT,
  contact_phone TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  source TEXT DEFAULT 'user_request',
  status TEXT NOT NULL DEFAULT 'scheduled',
  follow_up_state TEXT DEFAULT 'pending',
  follow_up_last_attempt_at TIMESTAMP WITH TIME ZONE,
  follow_up_channel TEXT DEFAULT 'sms',
  reminder_plan JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select_policy" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "appointments_insert_policy" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appointments_update_policy" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "appointments_delete_policy" ON public.appointments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- KNOWLEDGE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_select_policy" ON public.knowledge FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "knowledge_insert_policy" ON public.knowledge FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "knowledge_update_policy" ON public.knowledge FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "knowledge_delete_policy" ON public.knowledge FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_policy" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_policy" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update_policy" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete_policy" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- USER WIDGETS TABLE (CRITICAL FOR PERSISTENCE)
-- ============================================
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

CREATE POLICY "user_widgets_select_policy" ON public.user_widgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_widgets_insert_policy" ON public.user_widgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_widgets_update_policy" ON public.user_widgets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_widgets_delete_policy" ON public.user_widgets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- API PROVIDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.api_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  api_key TEXT,
  api_secret TEXT,
  endpoint_url TEXT,
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.api_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_providers_select_policy" ON public.api_providers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "api_providers_insert_policy" ON public.api_providers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "api_providers_update_policy" ON public.api_providers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "api_providers_delete_policy" ON public.api_providers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_select_policy" ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_insert_policy" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_messages_update_policy" ON public.chat_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_delete_policy" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- EMAIL LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  status TEXT NOT NULL,
  from_email TEXT,
  to_email TEXT,
  subject TEXT,
  body TEXT,
  html_body TEXT,
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_logs_select_policy" ON public.email_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "email_logs_insert_policy" ON public.email_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "email_logs_update_policy" ON public.email_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "email_logs_delete_policy" ON public.email_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- SMS LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  status TEXT NOT NULL,
  from_number TEXT,
  to_number TEXT,
  text TEXT,
  vapi_message_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_logs_select_policy" ON public.sms_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sms_logs_insert_policy" ON public.sms_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sms_logs_update_policy" ON public.sms_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sms_logs_delete_policy" ON public.sms_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- ACTION HISTORY TABLE (FOR UNDO)
-- ============================================
CREATE TABLE IF NOT EXISTS public.action_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  previous_state JSONB,
  new_state JSONB,
  can_undo BOOLEAN DEFAULT true,
  undone BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.action_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "action_history_select_policy" ON public.action_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "action_history_insert_policy" ON public.action_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "action_history_update_policy" ON public.action_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "action_history_delete_policy" ON public.action_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- WEB LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.web_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_summary TEXT,
  sources JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.web_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "web_logs_select_policy" ON public.web_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "web_logs_insert_policy" ON public.web_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "web_logs_update_policy" ON public.web_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "web_logs_delete_policy" ON public.web_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- AI LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  ref_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_logs_select_policy" ON public.ai_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai_logs_insert_policy" ON public.ai_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_logs_update_policy" ON public.ai_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai_logs_delete_policy" ON public.ai_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- MEMORY EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.memory_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN DEFAULT false,
  hidden_from_ai BOOLEAN DEFAULT false,
  ref_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.memory_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memory_events_select_policy" ON public.memory_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "memory_events_insert_policy" ON public.memory_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memory_events_update_policy" ON public.memory_events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "memory_events_delete_policy" ON public.memory_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_name TEXT,
  from_phone TEXT,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_policy" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "messages_insert_policy" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "messages_update_policy" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "messages_delete_policy" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
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

-- Apply updated_at trigger to relevant tables
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