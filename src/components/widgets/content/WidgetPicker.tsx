"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WIDGET_CONFIGS } from "@/types/widgets";
import {
  Clock,
  CloudSun,
  CheckSquare,
  Bell,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  Send,
  MapPin,
  Target,
  Brain,
  Zap,
  Activity,
  Newspaper,
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  Clock,
  CloudSun,
  CheckSquare,
  Bell,
  FileText,
  Calendar,
  TrendingUp, // Used for both "upcoming" and "stocks"
  Users,
  Send,
  MapPin,
  Target,
  Brain,
  Zap,
  Activity,
  Newspaper,
};

export default function WidgetPicker() {
  const handleWidgetClick = (type: string) => {
    const config = WIDGET_CONFIGS[type];
    if (config && (window as any).addWidgetToDashboard) {
      (window as any).addWidgetToDashboard(type, config.defaultSize);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Available Widgets</h3>
        <p className="text-xs text-slate-500">Click to add to dashboard</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.values(WIDGET_CONFIGS).map((config) => {
          const Icon = ICON_MAP[config.icon];
          return (
            <Card
              key={config.type}
              onClick={() => handleWidgetClick(config.type)}
              className="cursor-pointer border-slate-200/60 bg-white/90 hover:bg-gradient-to-br hover:from-purple-50/90 hover:to-fuchsia-50/90 transition-all hover:shadow-md backdrop-blur-sm active:scale-95"
            >
              <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                <div className="p-2 rounded-lg bg-slate-100">
                  {Icon && <Icon className="h-5 w-5 text-purple-500" />}
                </div>
                <span className="text-xs text-slate-700 font-medium">{config.name}</span>
                <span className="text-[10px] text-slate-500">
                  {config.defaultSize.w}×{config.defaultSize.h}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}