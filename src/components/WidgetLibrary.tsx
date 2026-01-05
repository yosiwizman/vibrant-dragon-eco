"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckSquare,
  Bell,
  FileText,
  Clock,
  Users,
  Send,
  Calendar,
  CloudSun,
  MapPin,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Brain,
} from "lucide-react";

export interface WidgetType {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
}

export const AVAILABLE_WIDGETS: WidgetType[] = [
  {
    id: "tasks",
    name: "Tasks",
    icon: CheckSquare,
    color: "text-green-500",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
  },
  {
    id: "reminders",
    name: "Reminders",
    icon: Bell,
    color: "text-yellow-500",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
  },
  {
    id: "notes",
    name: "Notes",
    icon: FileText,
    color: "text-orange-500",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
  },
  {
    id: "calendar",
    name: "Calendar",
    icon: Calendar,
    color: "text-blue-500",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  {
    id: "time",
    name: "Time",
    icon: Clock,
    color: "text-purple-500",
    defaultSize: { w: 1, h: 1 },
    minSize: { w: 1, h: 1 },
  },
  {
    id: "weather",
    name: "Weather",
    icon: CloudSun,
    color: "text-cyan-500",
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 1, h: 1 },
  },
  {
    id: "location",
    name: "Location",
    icon: MapPin,
    color: "text-pink-500",
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 1, h: 1 },
  },
  {
    id: "upcoming",
    name: "Coming Up",
    icon: TrendingUp,
    color: "text-fuchsia-500",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  {
    id: "contacts",
    name: "Contacts",
    icon: Users,
    color: "text-indigo-500",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
  },
  {
    id: "messages",
    name: "Messages",
    icon: Send,
    color: "text-emerald-500",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
  },
  {
    id: "productivity",
    name: "Productivity",
    icon: Target,
    color: "text-amber-500",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  {
    id: "ai-usage",
    name: "AI Usage",
    icon: Brain,
    color: "text-violet-500",
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 2, h: 1 },
  },
  {
    id: "quick-actions",
    name: "Quick Actions",
    icon: Zap,
    color: "text-yellow-500",
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 2, h: 1 },
  },
  {
    id: "recent-activity",
    name: "Recent Activity",
    icon: Activity,
    color: "text-blue-500",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
  },
];

interface WidgetLibraryProps {
  onWidgetDragStart: (widget: WidgetType) => void;
}

export default function WidgetLibrary({ onWidgetDragStart }: WidgetLibraryProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Available Widgets</h3>
      <div className="grid grid-cols-2 gap-2">
        {AVAILABLE_WIDGETS.map((widget) => {
          const Icon = widget.icon;
          return (
            <Card
              key={widget.id}
              draggable
              onDragStart={() => onWidgetDragStart(widget)}
              className="cursor-move border-slate-200/60 bg-white/90 hover:bg-slate-50/90 transition-all hover:shadow-md backdrop-blur-sm"
            >
              <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                <div className={`p-2 rounded-lg bg-slate-100`}>
                  <Icon className={`h-5 w-5 ${widget.color}`} />
                </div>
                <span className="text-xs text-slate-700 font-medium">{widget.name}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}