import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/state/preferences';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook that syncs the user's profile from Supabase to local preferences on app startup.
 * This ensures the voice greeting uses the user's preferred name immediately.
 */
export function useProfileSync() {
  const { user } = useAuth();
  const { preferences, setPreferences } = usePreferences();
  const hasSynced = useRef(false);

  useEffect(() => {
    // Only sync once per user session
    if (!user || hasSynced.current) return;

    const syncProfile = async () => {
      try {
        console.log('[ProfileSync] Loading profile for user:', user.id);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('preferred_name, first_name, last_name')
          .eq('id', user.id)
          .single();

        if (error) {
          // Profile might not exist yet, that's OK
          if (error.code === 'PGRST116') {
            console.log('[ProfileSync] No profile found yet');
          } else {
            console.error('[ProfileSync] Error loading profile:', error);
          }
          return;
        }

        if (profile) {
          // Determine the name to use (preferred_name takes priority)
          const nameToUse = profile.preferred_name || profile.first_name || '';
          
          // Only update if different from current preferences
          if (nameToUse && nameToUse !== preferences.preferredName) {
            console.log('[ProfileSync] Syncing preferred name:', nameToUse);
            setPreferences(prev => ({ ...prev, preferredName: nameToUse }));
          }
          
          hasSynced.current = true;
        }
      } catch (err) {
        console.error('[ProfileSync] Exception:', err);
      }
    };

    syncProfile();
  }, [user, preferences.preferredName, setPreferences]);

  // Reset sync flag when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      hasSynced.current = false;
    }
  }, [user]);
}