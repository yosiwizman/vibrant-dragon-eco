"use client";

import React, { useState, useEffect } from "react";
import { Responsive } from "react-grid-layout";
import WidgetRenderer from "./WidgetRenderer";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";
import { usePreferences } from "@/state/preferences";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// @ts-ignore - WidthProvider is a default export
import WidthProvider from "react-grid-layout";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  widgetId: string;
}

interface WidgetDashboardProps {
  onAddWidget?: (widgetId: string) => void;
  draggedWidget?: { id: string; defaultSize: { w: number; h: number } } | null;
}

export default function WidgetDashboard({ onAddWidget, draggedWidget }: WidgetDashboardProps) {
  const { preferences, setPreferences } = usePreferences();
  const [layouts, setLayouts] = useState<WidgetLayout[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    // Load saved layout from preferences
    const savedLayout = preferences.widgetLayout;
    if (savedLayout && Array.isArray(savedLayout)) {
      setLayouts(savedLayout);
    } else {
      // Default layout
      setLayouts([
        { i: "time-0", x: 0, y: 0, w: 1, h: 1, widgetId: "time" },
        { i: "weather-1", x: 1, y: 0, w: 2, h: 1, widgetId: "weather" },
        { i: "tasks-2", x: 0, y: 1, w: 2, h: 2, widgetId: "tasks" },
        { i: "upcoming-3", x: 2, y: 1, w: 2, h: 2, widgetId: "upcoming" },
      ]);
    }
  }, []);

  const handleLayoutChange = (newLayout: any[]) => {
    const updatedLayouts = newLayout.map((item: any) => {
      const existing = layouts.find((l) => l.i === item.i);
      return {
        ...item,
        widgetId: existing?.widgetId || "",
      } as WidgetLayout;
    });
    setLayouts(updatedLayouts);
    
    // Save to preferences
    setPreferences({
      ...preferences,
      widgetLayout: updatedLayouts,
    });
  };

  const handleRemoveWidget = (id: string) => {
    const newLayouts = layouts.filter((l) => l.i !== id);
    setLayouts(newLayouts);
    setPreferences({
      ...preferences,
      widgetLayout: newLayouts,
    });
  };

  const handleDrop = (layout: any[], layoutItem: any, _event: Event) => {
    if (draggedWidget) {
      const newWidget: WidgetLayout = {
        i: `${draggedWidget.id}-${Date.now()}`,
        x: layoutItem.x,
        y: layoutItem.y,
        w: draggedWidget.defaultSize.w,
        h: draggedWidget.defaultSize.h,
        widgetId: draggedWidget.id,
      };
      
      const newLayouts = [...layouts, newWidget];
      setLayouts(newLayouts);
      setPreferences({
        ...preferences,
        widgetLayout: newLayouts,
      });
      
      if (onAddWidget) {
        onAddWidget(draggedWidget.id);
      }
    }
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  return (
    <div
      className={`relative min-h-[400px] rounded-xl border-2 border-dashed transition-colors ${
        isDraggingOver ? "border-fuchsia-400 bg-fuchsia-500/5" : "border-slate-700/50 bg-transparent"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {layouts.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <GripVertical className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Drag widgets here to get started</p>
          </div>
        </div>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layouts }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
          rowHeight={150}
          onLayoutChange={handleLayoutChange}
          isDraggable={true}
          isResizable={true}
          compactType="vertical"
          preventCollision={false}
          isDroppable={true}
          onDrop={handleDrop}
          droppingItem={{ i: "drop", w: 2, h: 2 }}
        >
          {layouts.map((layout) => (
            <div key={layout.i} className="relative group">
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-6 w-6 rounded-full"
                  onClick={() => handleRemoveWidget(layout.i)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="h-full">
                <WidgetRenderer widgetId={layout.widgetId} />
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}