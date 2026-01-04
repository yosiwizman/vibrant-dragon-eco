"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckSquare, Bell, FileText, Clock, Users, Send, Calendar,
  BookOpenText, Brain, EarOff, Wrench, Puzzle, Activity, History,
  Edit, Sparkles, X
} from "lucide-react";

// Layer 1: Most used items (closest)
const layer1Items = [
  { to: "/tasks", icon: CheckSquare, label: "Tasks", color: "bg-green-500" },
  { to: "/reminders", icon: Bell, label: "Reminders", color: "bg-yellow-500" },
  { to: "/notes", icon: FileText, label: "Notes", color: "bg-orange-500" },
  { to: "/calendar", icon: Clock, label: "Calendar", color: "bg-blue-500" },
  { to: "/contacts", icon: Users, label: "Contacts", color: "bg-cyan-500" },
];

// Layer 2: Secondary items (middle distance)
const layer2Items = [
  { to: "/messages", icon: Send, label: "Messages", color: "bg-emerald-500" },
  { to: "/appointments", icon: Calendar, label: "Appointments", color: "bg-teal-500" },
  { to: "/documents", icon: FileText, label: "Documents", color: "bg-indigo-500" },
  { to: "/knowledge", icon: BookOpenText, label: "Knowledge", color: "bg-purple-500" },
  { to: "/knowledge-base", icon: Brain, label: "RAG Docs", color: "bg-violet-500" },
  { to: "/listening-sessions", icon: EarOff, label: "Sessions", color: "bg-purple-500" },
];

// Layer 3: Tools & advanced (furthest)
const layer3Items = [
  { to: "/tools", icon: Wrench, label: "Tools", color: "bg-fuchsia-500" },
  { to: "/integrations", icon: Puzzle, label: "Integrations", color: "bg-pink-500" },
  { to: "/ai-logs", icon: Activity, label: "AI Logs", color: "bg-lime-500" },
  { to: "/history", icon: History, label: "History", color: "bg-amber-500" },
  { to: "/drafts", icon: Edit, label: "Drafts", color: "bg-rose-500" },
];

export default function FanMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Calculate fan positions for multi-layer layout
  const getItemPosition = (index: number, total: number, layer: number) => {
    // Layer-based radius: closer items are nearer, further items are farther
    const baseRadius = typeof window !== 'undefined' && window.innerWidth < 768 ? 80 : 100;
    const radius = baseRadius + (layer * (typeof window !== 'undefined' && window.innerWidth < 768 ? 50 : 70));
    
    const startAngle = 90; // Start from left (90 degrees)
    const angleSpread = 90; // Spread across 90 degrees (quarter circle)
    const angle = startAngle + (angleSpread / (total - 1)) * index;
    const radian = (angle * Math.PI) / 180;
    
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
      <div className="fixed bottom-16 md:bottom-20 right-3 md:right-4 z-50">
        {isOpen && (
          <div className="relative">
            {/* Layer 1 - Closest */}
            {layer1Items.map((item, index) => {
              const pos = getItemPosition(index, layer1Items.length, 0);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={toggleMenu}
                  className="absolute"
                  style={{
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                    transition: `all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${index * 0.04}s`,
                  }}
                >
                  <Button
                    size="icon"
                    className={`${item.color} hover:scale-110 transition-transform shadow-lg ${
                      isMobile ? 'w-10 h-10' : 'w-12 h-12'
                    } rounded-full`}
                    title={item.label}
                  >
                    <item.icon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-white`} />
                  </Button>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] text-white font-medium whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded pointer-events-none">
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* Layer 2 - Middle */}
            {layer2Items.map((item, index) => {
              const pos = getItemPosition(index, layer2Items.length, 1);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={toggleMenu}
                  className="absolute"
                  style={{
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                    transition: `all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${(layer1Items.length + index) * 0.04}s`,
                  }}
                >
                  <Button
                    size="icon"
                    className={`${item.color} hover:scale-110 transition-transform shadow-lg ${
                      isMobile ? 'w-9 h-9' : 'w-11 h-11'
                    } rounded-full`}
                    title={item.label}
                  >
                    <item.icon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-white`} />
                  </Button>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] text-white font-medium whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded pointer-events-none">
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* Layer 3 - Furthest */}
            {layer3Items.map((item, index) => {
              const pos = getItemPosition(index, layer3Items.length, 2);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={toggleMenu}
                  className="absolute"
                  style={{
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                    transition: `all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${(layer1Items.length + layer2Items.length + index) * 0.04}s`,
                  }}
                >
                  <Button
                    size="icon"
                    className={`${item.color} hover:scale-110 transition-transform shadow-lg ${
                      isMobile ? 'w-8 h-8' : 'w-10 h-10'
                    } rounded-full`}
                    title={item.label}
                  >
                    <item.icon className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-white`} />
                  </Button>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] text-white font-medium whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded pointer-events-none">
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
          className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} rounded-full shadow-2xl transition-all ${
            isOpen
              ? "bg-red-600 hover:bg-red-500 rotate-45"
              : "bg-gradient-to-br from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500"
          }`}
        >
          {isOpen ? (
            <X className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
          ) : (
            <Sparkles className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
          )}
        </Button>
      </div>
    </>
  );
}