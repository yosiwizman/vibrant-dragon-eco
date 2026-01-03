import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

const linkClass =
  "px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800";

export default function NavBar() {
  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/chat", label: "Chat" },
    { to: "/tools", label: "Tools" },
    { to: "/history", label: "History" },
    { to: "/settings", label: "Settings" },
    { to: "/debug", label: "Debug" },
  ];

  return (
    <header className="w-full border-b bg-white/80 backdrop-blur dark:bg-black/30">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <NavLink to="/" className="font-semibold">Echo</NavLink>
        <nav className="flex items-center gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `${linkClass} ${isActive ? "bg-gray-200 dark:bg-gray-700" : ""}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/chat">
            <Button size="sm">Open Chat</Button>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}