"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  WifiOff, 
  Wifi,
  Cloud,
  CloudOff
} from "lucide-react";
import { offlineManager } from "@/services/offline-manager";
import { showSuccess, showError } from "@/utils/toast";

export default function OfflineModeToggle() {
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

  return (
    <div className="fixed top-20 right-4 z-40">
      <Button
        variant="ghost"
        size="sm"
        className={`gap-2 ${
          isOnline 
            ? "bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600" 
            : "bg-orange-900/80 hover:bg-orange-800/80 border border-orange-500/50"
        } backdrop-blur-lg shadow-lg`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-3.5 w-3.5 text-green-400" />
            <span className="text-xs text-slate-300">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs text-orange-300">Offline</span>
          </>
        )}
        
        {syncStatus.queueLength > 0 && (
          <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 text-[10px] px-1.5 py-0">
            {syncStatus.queueLength}
          </Badge>
        )}
      </Button>
    </div>
  );
}