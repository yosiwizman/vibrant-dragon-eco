import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

export interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  preferred_name?: string;
  avatar_url?: string;
  name?: string;
  company?: string;
  updated_at?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load profile from Supabase
  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Profile might not exist yet, that's OK
        if (error.code === 'PGRST116') {
          console.log('[Profile] No profile found, will create on first save');
          setProfile({ id: user.id });
        } else {
          console.error('[Profile] Error loading profile:', error);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('[Profile] Exception loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save profile to Supabase
  const saveProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) {
      showError('Please log in to save your profile');
      return false;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[Profile] Error saving profile:', error);
        showError('Failed to save profile');
        return false;
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : { id: user.id, ...updates });
      showSuccess('Profile saved!');
      return true;
    } catch (err) {
      console.error('[Profile] Exception saving profile:', err);
      showError('Failed to save profile');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user]);

  // Update preferred name specifically
  const updatePreferredName = useCallback(async (name: string) => {
    return saveProfile({ preferred_name: name });
  }, [saveProfile]);

  // Load profile on mount and when user changes
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    saving,
    saveProfile,
    updatePreferredName,
    reloadProfile: loadProfile,
  };
}