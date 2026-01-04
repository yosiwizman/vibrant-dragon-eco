"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckSquare, Bell, FileText, Clock, Users, Send, Calendar,
  BookOpenText, Brain, EarOff, Wrench, Puzzle, Activity, History,
  Edit, Sparkles, X
} from "lucide-react";

const quickAccessItems = [
  { to: "/tasks", icon: CheckSquare, label: "Tasks", color: "bg-green-500" },
  { to: "/reminders", icon: Bell, label: "Reminders", color: "bg-yellow-500" },
  { to: "/notes", icon: FileText, label: "Notes", color: "bg-orange-500" },
  { to: "/calendar", icon: Clock, label: "Calendar", color: "bg-blue-500" },
  { to: "/contacts", icon: Users, label: "Contacts", color: "bg-cyan-500" },
  { to: "/messages", icon: Send, label: "Messages", color: "bg-emerald-500" },
  { to: "/appointments", icon: Calendar, label: "Appointments", color: "bg-teal-500" },
  { to: "/documents", icon: FileText, label: "Documents", color: "bg-indigo-500" },
];

const toolsItems = [
  { to: "/knowledge", icon: BookOpenText, label: "Knowledge", color: "bg-purple-500" },
  { to: "/knowledge-base", icon: Brain, label: "RAG Docs", color: "bg-violet-500" },
  { to: "/listening-sessions", icon: EarOff, label: "Sessions", color: "bg-purple-500" },
  { to: "/tools", icon: Wrench, label: "Tools", color: "bg-fuchsia-500" },
  { to: "/integrations", icon: Puzzle, label: "Integrations", color: "bg-pink-500" },
  { to: "/ai-logs", icon: Activity, label: "AI Logs", color: "bg-lime-500" },
  { to: "/history", icon: History, label: "History", color: "bg-amber-500" },
  { to: "/drafts", icon: Edit, label: "Drafts", color: "bg-rose-500" },
];

const allItems = [...quickAccessItems, ...toolsItems];

export default function FanMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Calculate fan positions (radial layout)
  const getItemPosition = (index: number, total: number) => {
    const radius = 140; // Distance from center
    const startAngle = -90; // Start from top
    const angleSpread = 180; // Spread across 180 degrees (half circle)
    const angle = startAngle + (angleSpread / (total - 1)) * index;
    const radian = (angle * Math.PI) / 180;
    
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={toggleMenu}
        />
      )}

      {/* Fan Menu Items */}
      <div className="fixed bottom-20 right-4 z-50">
        {isOpen && (
          <div className="relative">
            {allItems.map((item, index) => {
              const pos = getItemPosition(index, allItems.length);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={toggleMenu}
                  className="absolute"
                  style={{
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                    transition: `all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${index * 0.03}s`,
                  }}
                >
                  <Button
                    size="icon"
                    className={`${item.color} hover:scale-110 transition-transform shadow-lg w-12 h-12 rounded-full`}
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5 text-white" />
                  </Button>
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white font-medium whitespace-nowrap bg-black/70 px-2 py-0.5 rounded">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Main FAB Button */}
        <Button
          size="icon"
          onClick={toggleMenu}
          className={`w-14 h-14 rounded-full shadow-2xl transition-all ${
            isOpen
              ? "bg-red-600 hover:bg-red-500 rotate-45"
              : "bg-gradient-to-br from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500"
          }`}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Sparkles className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>
    </>
  );
}