"use client";

import { useState, useEffect, useCallback } from "react";
import { offlineManager } from "@/services/offline-manager";
import { supabase } from "@/integrations/supabase/client";

interface UseOfflineSupportOptions {
  table: string;
  userId: string;
  autoCache?: boolean;
}

export function useOfflineSupport({ table, userId, autoCache = true }: UseOfflineSupportOptions) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return offlineManager.subscribe(setIsOnline);
  }, []);

  // Load data (from cache if offline, from server if online)
  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      if (isOnline) {
        // Fetch from Supabase
        const { data: serverData, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;

        setData(serverData || []);

        // Cache for offline use
        if (autoCache) {
          await offlineManager.cacheData(table, serverData || []);
        }
      } else {
        // Load from cache
        const cachedData = await offlineManager.getCachedData(table);
        setData(cachedData || []);
      }
    } catch (error) {
      console.error(`Failed to load ${table}:`, error);
      
      // Try cache as fallback
      const cachedData = await offlineManager.getCachedData(table);
      if (cachedData) {
        setData(cachedData);
      }
    } finally {
      setLoading(false);
    }
  }, [table, userId, isOnline, autoCache]);

  // Create item (queue if offline)
  const createItem = useCallback(async (item: any) => {
    if (isOnline) {
      const { data: newItem, error } = await supabase
        .from(table)
        .insert({ ...item, user_id: userId })
        .select()
        .single();

      if (error) throw error;

      setData(prev => [...prev, newItem]);
      return newItem;
    } else {
      // Queue for sync
      await offlineManager.queueOperation(table, 'insert', { ...item, user_id: userId });
      
      // Optimistically update local state
      const tempItem = { ...item, id: `temp-${Date.now()}`, user_id: userId };
      setData(prev => [...prev, tempItem]);
      return tempItem;
    }
  }, [table, userId, isOnline]);

  // Update item (queue if offline)
  const updateItem = useCallback(async (id: string, updates: any) => {
    if (isOnline) {
      const { data: updatedItem, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setData(prev => prev.map(item => item.id === id ? updatedItem : item));
      return updatedItem;
    } else {
      // Queue for sync
      await offlineManager.queueOperation(table, 'update', { id, ...updates });
      
      // Optimistically update local state
      setData(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      return { id, ...updates };
    }
  }, [table, isOnline]);

  // Delete item (queue if offline)
  const deleteItem = useCallback(async (id: string) => {
    if (isOnline) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setData(prev => prev.filter(item => item.id !== id));
    } else {
      // Queue for sync
      await offlineManager.queueOperation(table, 'delete', { id });
      
      // Optimistically update local state
      setData(prev => prev.filter(item => item.id !== id));
    }
  }, [table, isOnline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    isOnline,
    createItem,
    updateItem,
    deleteItem,
    refresh: loadData,
  };
}