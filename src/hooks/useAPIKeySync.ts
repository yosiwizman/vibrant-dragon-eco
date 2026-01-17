import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/state/preferences';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook that syncs the OpenAI API key from preferences (General tab) 
 * to the API providers table and auto-enables the provider.
 */
export function useAPIKeySync() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const lastSyncedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !preferences.openaiApiKey) return;
    
    // Don't sync if we already synced this key
    if (lastSyncedKey.current === preferences.openaiApiKey) return;

    const syncOpenAIKey = async () => {
      try {
        console.log('[APIKeySync] Syncing OpenAI key to providers...');
        
        // Check if OpenAI provider exists
        const { data: existing, error: fetchError } = await supabase
          .from('api_providers')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider_name', 'openai')
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('[APIKeySync] Error fetching provider:', fetchError);
          return;
        }

        const providerData = {
          user_id: user.id,
          provider_name: 'openai',
          api_key: preferences.openaiApiKey,
          is_enabled: true, // Auto-enable when key is set
          config: {
            category: 'ai',
            model: preferences.openaiVoice ? undefined : 'gpt-4o',
            voice: preferences.openaiVoice || 'nova',
            synced_from_general: true,
          },
        };

        if (existing) {
          // Update existing provider
          const { error: updateError } = await supabase
            .from('api_providers')
            .update({
              api_key: preferences.openaiApiKey,
              is_enabled: true,
              config: {
                ...existing.config,
                synced_from_general: true,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error('[APIKeySync] Error updating provider:', updateError);
            return;
          }
          console.log('[APIKeySync] Updated OpenAI provider');
        } else {
          // Create new provider
          const { error: insertError } = await supabase
            .from('api_providers')
            .insert(providerData);

          if (insertError) {
            console.error('[APIKeySync] Error creating provider:', insertError);
            return;
          }
          console.log('[APIKeySync] Created OpenAI provider');
        }

        lastSyncedKey.current = preferences.openaiApiKey;
      } catch (err) {
        console.error('[APIKeySync] Exception:', err);
      }
    };

    syncOpenAIKey();
  }, [user, preferences.openaiApiKey, preferences.openaiVoice]);

  // Reset when user changes
  useEffect(() => {
    if (!user) {
      lastSyncedKey.current = null;
    }
  }, [user]);
}