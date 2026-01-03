import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { APIProvider } from "@/types/providers";

export function useProviders() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<APIProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProviders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("api_providers")
      .select("*")
      .eq("user_id", user.id);

    if (!error && data) {
      setProviders(data as APIProvider[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const getProvider = useCallback((name: string): APIProvider | undefined => {
    return providers.find(p => p.provider_name === name);
  }, [providers]);

  const saveProvider = useCallback(async (
    providerName: string,
    data: Partial<APIProvider>
  ): Promise<boolean> => {
    if (!user) return false;

    const existing = providers.find(p => p.provider_name === providerName);
    
    if (existing) {
      const { error } = await supabase
        .from("api_providers")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        console.error("Failed to update provider:", error);
        return false;
      }
    } else {
      const { error } = await supabase
        .from("api_providers")
        .insert({
          user_id: user.id,
          provider_name: providerName,
          ...data,
        });

      if (error) {
        console.error("Failed to create provider:", error);
        return false;
      }
    }

    await loadProviders();
    return true;
  }, [user, providers, loadProviders]);

  const toggleProvider = useCallback(async (
    providerName: string,
    enabled: boolean
  ): Promise<boolean> => {
    return saveProvider(providerName, { is_enabled: enabled });
  }, [saveProvider]);

  const deleteProvider = useCallback(async (providerName: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from("api_providers")
      .delete()
      .eq("user_id", user.id)
      .eq("provider_name", providerName);

    if (error) {
      console.error("Failed to delete provider:", error);
      return false;
    }

    await loadProviders();
    return true;
  }, [user, loadProviders]);

  const getEnabledProvider = useCallback((category: string): APIProvider | undefined => {
    return providers.find(p => {
      const config = p.config as any;
      return config?.category === category && p.is_enabled;
    });
  }, [providers]);

  return {
    providers,
    loading,
    getProvider,
    saveProvider,
    toggleProvider,
    deleteProvider,
    getEnabledProvider,
    refresh: loadProviders,
  };
}