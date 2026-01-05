"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Sparkles,
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
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const quickAccess: NavItem[] = [
  { to: "/tasks", label: "Tasks", icon: CheckSquare, color: "text-green-400" },
  { to: "/reminders", label: "Reminders", icon: Bell, color: "text-yellow-400" },
  { to: "/notes", label: "Notes", icon: FileText, color: "text-orange-400" },
  { to: "/calendar", label: "Calendar", icon: Clock, color: "text-blue-400" },
  { to: "/contacts", label: "Contacts", icon: Users, color: "text-cyan-400" },
  { to: "/messages", label: "Messages", icon: Send, color: "text-emerald-400" },
  { to: "/appointments", label: "Appointments", icon: Calendar, color: "text-teal-400" },
  { to: "/documents", label: "Documents", icon: FileText, color: "text-indigo-400" },
];

const tools: NavItem[] = [
  { to: "/knowledge", label: "Knowledge", icon: BookOpenText, color: "text-purple-400" },
  { to: "/knowledge-base", label: "RAG Docs", icon: Brain, color: "text-violet-400" },
  { to: "/listening-sessions", label: "Sessions", icon: EarOff, color: "text-purple-400" },
  { to: "/tools", label: "Tools", icon: Wrench, color: "text-fuchsia-400" },
  { to: "/integrations", label: "Integrations", icon: Puzzle, color: "text-pink-400" },
  { to: "/ai-logs", label: "AI Logs", icon: Activity, color: "text-lime-400" },
  { to: "/history", label: "History", icon: History, color: "text-amber-400" },
  { to: "/drafts", label: "Drafts", icon: Edit, color: "text-rose-400" },
];

export default function QuickAccessPanel() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleNav = () => setOpen(false);

  const Section = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="mb-5">
      <h3 className="text-xs font-semibold text-slate-400 mb-2">{title}</h3>
      <div className="grid gap-2 grid-cols-3 md:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              to={item.to}
              key={item.to}
              onClick={handleNav}
              className="group rounded-lg border border-slate-700/60 bg-slate-900/40 hover:bg-slate-900 transition-colors p-3 flex flex-col items-center text-center"
            >
              <Icon className={`h-5 w-5 ${item.color}`} />
              <span className="mt-1 text-[11px] text-slate-200 leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Floating trigger button */}
      <div
        className="fixed right-3 md:right-5 z-50"
        style={{
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${isMobile ? "80px" : "96px"})`,
        }}
      >
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="hidden md:flex rounded-full w-14 h-14 shadow-lg bg-gradient-to-br from-purple-400 to-indigo-400 hover:from-purple-300 hover:to-indigo-300"
            aria-label="Open quick access"
          >
            <Sparkles className="h-6 w-6 text-white" />
          </Button>
        </SheetTrigger>
      </div>

      {/* Side panel content */}
      <SheetContent
        side="right"
        className="w-[88vw] sm:w-[400px] border-l border-slate-700 bg-slate-900/95 backdrop-blur-md p-4"
      >
        <SheetHeader>
          <SheetTitle className="text-white">Quick Access</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <Section title="Core" items={quickAccess} />
          <Section title="Tools & More" items={tools} />
        </div>
      </SheetContent>
    </Sheet>
  );
}