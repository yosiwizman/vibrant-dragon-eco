"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  WifiOff,
  Wifi
} from "lucide-react";
import { offlineManager } from "@/services/offline-manager";

interface OfflineModeToggleProps {
  showOnLoginPage?: boolean;
}

export default function OfflineModeToggle({ showOnLoginPage = false }: OfflineModeToggleProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({ queueLength: 0, syncInProgress: false });

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setIsOnline);
    loadSyncStatus();
    
    const interval = setInterval(loadSyncStatus, 5000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadSyncStatus = async () => {
    const status = await offlineManager.getSyncStatus();
    setSyncStatus({
      queueLength: status.queueLength,
      syncInProgress: status.syncInProgress,
    });
  };

  // Don't show on login page
  if (showOnLoginPage) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 relative"
        title={isOnline ? "Online" : "Offline"}
      >
        {isOnline ? (
          <Wifi className="h-5 w-5 text-purple-400" />
        ) : (
          <WifiOff className="h-5 w-5 text-slate-600" />
        )}
        
        {syncStatus.queueLength > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-fuchsia-500 text-white border-0 text-[9px]">
            {syncStatus.queueLength}
          </Badge>
        )}
      </Button>
    </div>
  );
}