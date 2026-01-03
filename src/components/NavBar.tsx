import { NavLink } from "react-router-dom";
import { Bot, MessageSquareText, Wrench, BookOpenText, History, Settings as Cog, Bug, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

const linkBase =
  "px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white transition";
const active =
  "bg-fuchsia-600/30 text-white";

export default function NavBar() {
  const links = [
    { to: "/voice", label: "Voice", icon: <Mic className="h-4 w-4" /> },
    { to: "/chat", label: "Chat", icon: <MessageSquareText className="h-4 w-4" /> },
    { to: "/tools", label: "Tools", icon: <Wrench className="h-4 w-4" /> },
    { to: "/knowledge", label: "Knowledge", icon: <BookOpenText className="h-4 w-4" /> },
    { to: "/history", label: "History", icon: <History className="h-4 w-4" /> },
    { to: "/settings", label: "Settings", icon: <Cog className="h-4 w-4" /> },
    { to: "/debug", label: "Debug", icon: <Bug className="h-4 w-4" /> },
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
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <NavLink to="/voice">
          <Button size="sm" className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
            <Mic className="mr-2 h-4 w-4" />
            Start Voice
          </Button>
        </NavLink>
      </div>
    </header>
  );
}