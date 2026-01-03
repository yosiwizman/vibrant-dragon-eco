import { NavLink } from "react-router-dom";
import { Bot, MessageSquareText, Wrench, BookOpenText, History, Settings as Cog, Bug, Mic, Puzzle, Bell, HelpCircle, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import VoiceTutorial from "./VoiceTutorial";
import { useCommandPalette } from "./VoiceCommandPalette";

export default function NavBar() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const { open: openCommandPalette } = useCommandPalette();

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel("notifications-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-lg">
      <div className="flex items-center gap-1 overflow-x-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-fuchsia-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">Echo</span>
        </NavLink>

        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-fuchsia-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <MessageSquareText className="h-4 w-4" />
          <span className="hidden sm:inline">Chat</span>
        </NavLink>

        <NavLink
          to="/tools"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-fuchsia-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <Wrench className="h-4 w-4" />
          <span className="hidden sm:inline">Tools</span>
        </NavLink>

        <NavLink
          to="/knowledge"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-fuchsia-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <BookOpenText className="h-4 w-4" />
          <span className="hidden sm:inline">Knowledge</span>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-fuchsia-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">History</span>
        </NavLink>

        <NavLink
          to="/integrations"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-fuchsia-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <Puzzle className="h-4 w-4" />
          <span className="hidden sm:inline">Integrations</span>
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-fuchsia-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-fuchsia-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <Cog className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </NavLink>

        <NavLink
          to="/debug"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-fuchsia-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <Bug className="h-4 w-4" />
          <span className="hidden sm:inline">Debug</span>
        </NavLink>
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={openCommandPalette}
              className="text-slate-400 hover:text-white h-8 px-2 gap-1.5 hidden sm:flex"
              title="Command Palette (⌘K)"
            >
              <Command className="h-3.5 w-3.5" />
              <kbd className="text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-500">⌘K</kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTutorial(true)}
              className="text-slate-400 hover:text-white h-8 w-8"
              title="Voice Commands Help"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <NavLink to="/voice">
              <Button size="sm" className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                <Mic className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Start Voice</span>
              </Button>
            </NavLink>
            <UserMenu />
          </>
        ) : (
          <NavLink to="/login">
            <Button size="sm" className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
              Sign In
            </Button>
          </NavLink>
        )}
      </div>
      
      <VoiceTutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
    </nav>
  );
}