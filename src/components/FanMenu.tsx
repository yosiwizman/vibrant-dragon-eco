"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  "use client";
  
  import { useEffect, useMemo, useState } from "react";
  import { Link } from "react-router-dom";
  import { Button } from "@/components/ui/button";
  import {
    CheckSquare, Bell, FileText, Clock, Users, Send, Calendar,
    BookOpenText, Brain, EarOff, Wrench, Puzzle, Activity, History,
    Edit, Sparkles, X
  } from "lucide-react";
  
  // Layer 1: Most used (closest)
  const layer1Items = [
    { to: "/tasks", icon: CheckSquare, label: "Tasks", color: "bg-green-500" },
    { to: "/reminders", icon: Bell, label: "Reminders", color: "bg-yellow-500" },
    { to: "/notes", icon: FileText, label: "Notes", color: "bg-orange-500" },
    { to: "/calendar", icon: Clock, label: "Calendar", color: "bg-blue-500" },
    { to: "/contacts", icon: Users, label: "Contacts", color: "bg-cyan-500" },
  ];
  
  // Layer 2: Secondary (middle)
  const layer2Items = [
    { to: "/messages", icon: Send, label: "Messages", color: "bg-emerald-500" },
    { to: "/appointments", icon: Calendar, label: "Appointments", color: "bg-teal-500" },
    { to: "/documents", icon: FileText, label: "Documents", color: "bg-indigo-500" },
    { to: "/knowledge", icon: BookOpenText, label: "Knowledge", color: "bg-purple-500" },
    { to: "/knowledge-base", icon: Brain, label: "RAG Docs", color: "bg-violet-500" },
    { to: "/listening-sessions", icon: EarOff, label: "Sessions", color: "bg-purple-500" },
  ];
  
  // Layer 3: Advanced (furthest)
  const layer3Items = [
    { to: "/tools", icon: Wrench, label: "Tools", color: "bg-fuchsia-500" },
    { to: "/integrations", icon: Puzzle, label: "Integrations", color: "bg-pink-500" },
    { to: "/ai-logs", icon: Activity, label: "AI Logs", color: "bg-lime-500" },
    { to: "/history", icon: History, label: "History", color: "bg-amber-500" },
    { to: "/drafts", icon: Edit, label: "Drafts", color: "bg-rose-500" },
  ];
  
  export default function FanMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  
    const toggleMenu = () => setIsOpen((prev) => !prev);
    const closeMenu = () => setIsOpen(false);
  
    // Close on Escape for better UX
    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeMenu();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);
  
    // Calculate fan positions (multi-layer) expanding LEFT and UP
    const getItemPosition = (index: number, total: number, layer: number) => {
      const base = isMobile ? 72 : 88; // inner radius
      const step = isMobile ? 48 : 64; // layer increment
      const radius = base + layer * step;
  
      // Wider spread on outer layers for spacing
      const spread = layer === 0 ? 90 : layer === 1 ? 110 : 130;
      const start = 110; // start from slight up-left for better visibility
      const angle = start + (total === 1 ? 0 : (spread / (total - 1)) * index);
      const rad = (angle * Math.PI) / 180;
  
      return {
        x: Math.cos(rad) * radius,
        y: Math.sin(rad) * radius,
      };
    };
  
    // Stagger timing per layer for smooth fan open
    const baseDelay = 0.05;
  
    // Use safe-area inset for iOS and lift menu slightly higher
    const containerStyle = useMemo(() => {
      const safe = typeof window !== "undefined" ? (Number(getComputedStyle(document.documentElement).getPropertyValue("--sat")) || 0) : 0;
      // Fallback using env() dynamically
      return {
        bottom: `calc(env(safe-area-inset-bottom, 0px) + ${isMobile ? "84px" : "96px"})`,
      } as React.CSSProperties;
    }, [isMobile]);
  
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={closeMenu}
          />
        )}
  
        <div className="fixed right-3 md:right-4 z-50" style={containerStyle}>
          {isOpen && (
            <div className="relative">
              {/* Layer 1 */}
              {layer1Items.map((item, index) => {
                const pos = getItemPosition(index, layer1Items.length, 0);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    className="absolute group"
                    style={{
                      transform: `translate(${pos.x}px, ${pos.y}px)`,
                      transition: `transform 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${index * baseDelay}s`,
                    }}
                  >
                    <Button
                      size="icon"
                      className={`${item.color} shadow-lg rounded-full transition-transform hover:scale-110 focus:scale-110 ${
                        isMobile ? "w-10 h-10" : "w-12 h-12"
                      }`}
                      title={item.label}
                    >
                      <item.icon className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-white`} />
                    </Button>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] text-white font-medium whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
  
              {/* Layer 2 */}
              {layer2Items.map((item, index) => {
                const pos = getItemPosition(index, layer2Items.length, 1);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    className="absolute group"
                    style={{
                      transform: `translate(${pos.x}px, ${pos.y}px)`,
                      transition: `transform 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${(layer1Items.length + index) * baseDelay}s`,
                    }}
                  >
                    <Button
                      size="icon"
                      className={`${item.color} shadow-lg rounded-full transition-transform hover:scale-110 focus:scale-110 ${
                        isMobile ? "w-9 h-9" : "w-11 h-11"
                      }`}
                      title={item.label}
                    >
                      <item.icon className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-white`} />
                    </Button>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] text-white font-medium whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
  
              {/* Layer 3 */}
              {layer3Items.map((item, index) => {
                const pos = getItemPosition(index, layer3Items.length, 2);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    className="absolute group"
                    style={{
                      transform: `translate(${pos.x}px, ${pos.y}px)`,
                      transition: `transform 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${(layer1Items.length + layer2Items.length + index) * baseDelay}s`,
                    }}
                  >
                    <Button
                      size="icon"
                      className={`${item.color} shadow-lg rounded-full transition-transform hover:scale-110 focus:scale-110 ${
                        isMobile ? "w-8 h-8" : "w-10 h-10"
                      }`}
                      title={item.label}
                    >
                      <item.icon className={`${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} text-white`} />
                    </Button>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] text-white font-medium whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
  
          {/* Main FAB */}
          <Button
            size="icon"
            onClick={toggleMenu}
            className={`${isMobile ? "w-12 h-12" : "w-14 h-14"} rounded-full shadow-2xl transition-all ${
              isOpen
                ? "bg-red-600 hover:bg-red-500 rotate-45"
                : "bg-gradient-to-br from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500"
            }`}
            aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
          >
            {isOpen ? (
              <X className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} text-white`} />
            ) : (
              <Sparkles className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} text-white`} />
            )}
          </Button>
        </div>
      </>
    );
  }