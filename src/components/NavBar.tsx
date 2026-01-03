import { NavLink } from "react-router-dom";
import { Bot, MessageSquareText, Wrench, BookOpenText, History, Settings as Cog, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

const linkBase =
  "px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white transition";
const active =
  "bg-white/10 text-white shadow-inner";

export default function NavBar() {
  const links = [
    { to: "/chat", label: "Chat", icon: <MessageSquareText className="h-4 w-4" /> },
    { to: "/tools", label: "Tools", icon: <Wrench className="h-4 w-4" /> },
    { to: "/knowledge", label: "Knowledge", icon: <BookOpenText className="h-4 w-4" /> },
    { to: "/history", label: "History", icon: <History className="h-4 w-4" /> },
    { to: "/settings", label: "Settings", icon: <Cog className="h-4 w-4" /> },
    { to: "/debug", label: "Debug", icon: <Bug className="h-4 w-4" /> },
  ];

  return (
    <header className="w-full border-b border-white/10 bg-gradient-to-b from-black/40 to-black/10 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center ring-1 ring-white/15">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-wide text-white">Echo</span>
        </NavLink>

        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `${linkBase} flex items-center gap-2 ${isActive ? active : "hover:bg-white/10"}`
              }
            >
              {l.icon}
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <NavLink to="/chat">
          <Button size="sm" className="bg-white text-black hover:bg-white/90">Open Chat</Button>
        </NavLink>
      </div>
    </header>
  );
}