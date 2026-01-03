import { NavLink } from "react-router-dom";
import { Bot, MessageSquareText, Wrench, BookOpenText, History, Settings as Cog, Bug, Mic, Puzzle, Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import VoiceTutorial from "./VoiceTutorial";

const linkBase =
  "px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white transition";
const active =
  "bg-fuchsia-600/30 text-white";

export default function NavBar() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      
      // Subscribe to notifications changes
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    setUnreadCount(count || 0);
  };

  const links = [
    { to: "/voice", label: "Voice", icon: <Mic className="h-4 w-4" /> },
    { to: "/chat", label: "Chat", icon: <MessageSquareText className="h-4 w-4" /> },
    { to: "/messages", label: "Messages", icon: <MessageSquareText className="h-4 w-4" /> },
    { to: "/integrations", label: "Apps", icon: <Puzzle className="h-4 w-4" /> },
    { to: "/tools", label: "Tools", icon: <Wrench className="h-4 w-4" /> },
    { to: "/settings", label: "Settings", icon: <Cog className="h-4 w-4" /> },
  ];

  return (
    <header className="w-full border-b border-fuchsia-500/20 bg-slate-950/90 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-fuchsia-600/30 flex items-center justify-center ring-1 ring-fuchsia-400/40">
            <Bot className="h-4 w-4 text-fuchsia-300" />
          </div>
          <span className="font-semibold tracking-wide text-white">Echo</span>
        </NavLink>

        {user && (
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `${linkBase} flex items-center gap-2 ${isActive ? active : "hover:bg-slate-800"}`
                }
              >
                {l.icon}
                <span className="hidden md:inline">{l.label}</span>
              </NavLink>
            ))}
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `${linkBase} flex items-center gap-2 relative ${isActive ? active : "hover:bg-slate-800"}`
              }
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-fuchsia-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
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
      </div>
    </header>
  );
}