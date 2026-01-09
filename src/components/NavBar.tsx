"use client";

import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useVoice } from "@/contexts/VoiceContext";
import UserMenu from "./UserMenu";
import LiveVoiceIndicator from "./LiveVoiceIndicator";
import OfflineModeToggle from "./OfflineModeToggle";
import OfflineIndicator from "./OfflineIndicator";
import {
  Home,
  MessageSquare,
  Bell,
  Mic,
  Settings,
  Command,
  HelpCircle,
  EarOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function NavBar() {
  const location = useLocation();
  const { user } = useAuth();
  const { stopListening, stopSpeaking } = useVoice();
  const [showShortcutsHint, setShowShortcutsHint] = useState(false);

  // Show keyboard shortcuts hint on first visit
  useEffect(() => {
    const hasSeenHint = localStorage.getItem("echo:seen-shortcuts-hint");
    if (!hasSeenHint && user) {
      setShowShortcutsHint(true);
      setTimeout(() => {
        setShowShortcutsHint(false);
        localStorage.setItem("echo:seen-shortcuts-hint", "true");
      }, 5000);
    }
  }, [user]);

  const navItems = [
    { to: "/", icon: Home, label: "Echo" },
    { to: "/chat", icon: MessageSquare, label: "Chat" },
    { to: "/notifications", icon: Bell, label: "Alerts" },
    { to: "/listening-sessions", icon: EarOff, label: "Sessions" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleVoiceClick = () => {
    // Stop any ongoing voice activity when navigating to voice page
    stopListening();
    stopSpeaking();
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-fuchsia-500/20 bg-black/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Left: Navigation */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-2 text-slate-400 hover:text-white hover:bg-fuchsia-500/10",
                  isActive(item.to) && "text-fuchsia-400 bg-fuchsia-500/10"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>

        {/* Center: Live Voice Indicator */}
        <div className="flex items-center gap-2">
          <LiveVoiceIndicator />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Offline Indicator */}
          <OfflineIndicator />

          {/* Keyboard Shortcuts Hint */}
          {showShortcutsHint && (
            <div className="hidden md:flex items-center gap-1 text-xs text-slate-400 animate-pulse">
              <Command className="h-3 w-3" />
              <span>Press ⌘K for commands</span>
            </div>
          )}

          {/* Offline Mode Toggle */}
          <OfflineModeToggle />

          {/* Help Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-white"
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
            title="Keyboard shortcuts (⌘K)"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          <UserMenu />
        </div>
      </div>
    </nav>
  );
}