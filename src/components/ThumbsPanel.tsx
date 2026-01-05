"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  CheckSquare,
  Bell,
  FileText,
  Clock,
  Users,
  Send,
  Calendar,
  BookOpenText,
  Brain,
  EarOff,
  Wrench,
  Puzzle,
  Activity,
  History,
  Edit,
  Menu,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const quickAccess: NavItem[] = [
  { to: "/tasks", label: "Tasks", icon: CheckSquare, color: "text-green-500" },
  { to: "/reminders", label: "Reminders", icon: Bell, color: "text-yellow-500" },
  { to: "/notes", label: "Notes", icon: FileText, color: "text-orange-500" },
  { to: "/calendar", label: "Calendar", icon: Clock, color: "text-blue-500" },
  { to: "/contacts", label: "Contacts", icon: Users, color: "text-cyan-500" },
  { to: "/messages", label: "Messages", icon: Send, color: "text-emerald-500" },
  { to: "/appointments", label: "Appointments", icon: Calendar, color: "text-teal-500" },
  { to: "/documents", label: "Documents", icon: FileText, color: "text-indigo-500" },
];

const tools: NavItem[] = [
  { to: "/knowledge", label: "Knowledge", icon: BookOpenText, color: "text-purple-500" },
  { to: "/knowledge-base", label: "RAG Docs", icon: Brain, color: "text-violet-500" },
  { to: "/listening-sessions", label: "Sessions", icon: EarOff, color: "text-purple-500" },
  { to: "/tools", label: "Tools", icon: Wrench, color: "text-fuchsia-500" },
  { to: "/integrations", label: "Integrations", icon: Puzzle, color: "text-pink-500" },
  { to: "/ai-logs", label: "AI Logs", icon: Activity, color: "text-lime-500" },
  { to: "/history", label: "History", icon: History, color: "text-amber-500" },
  { to: "/drafts", label: "Drafts", icon: Edit, color: "text-rose-500" },
];

export default function ThumbsPanel() {
  const [open, setOpen] = useState(false);

  const handleNav = () => setOpen(false);

  const Section = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="mb-5">
      <h3 className="text-xs font-semibold text-slate-600 mb-2">{title}</h3>
      <div className="grid gap-2 grid-cols-3 md:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              to={item.to}
              key={item.to}
              onClick={handleNav}
              className="group rounded-lg border border-slate-200/60 bg-white/80 hover:bg-slate-50/90 transition-colors p-3 flex flex-col items-center text-center shadow-sm backdrop-blur-sm"
            >
              <Icon className={`h-5 w-5 ${item.color}`} />
              <span className="mt-1 text-[11px] text-slate-700 leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Floating trigger button - minimal line design */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="h-20 w-4 rounded-l-md rounded-r-none shadow-sm bg-gradient-to-b from-purple-400/30 to-fuchsia-400/30 hover:from-purple-400/50 hover:to-fuchsia-400/50 border-l border-t border-b border-purple-300/40 backdrop-blur-sm"
            aria-label="Open quick access panel"
          >
            <Menu className="h-3 w-3 text-purple-500" />
          </Button>
        </SheetTrigger>
      </div>

      {/* Side panel content - lighter colors with transparency and scrolling */}
      <SheetContent
        side="right"
        className="w-[88vw] sm:w-[400px] border-l border-slate-200/30 bg-white/40 backdrop-blur-lg p-4 flex flex-col"
      >
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-slate-800">Quick Access</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 overflow-y-auto flex-1 pr-2">
          <Section title="Core" items={quickAccess} />
          <Section title="Tools & More" items={tools} />
        </div>
      </SheetContent>
    </Sheet>
  );
}