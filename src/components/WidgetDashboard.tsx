"use client";

import React, { useState, useEffect } from "react";
import { Responsive } from "react-grid-layout";
import WidgetRenderer from "./WidgetRenderer";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";
import { usePreferences } from "@/state/preferences";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

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

export default function WidgetDashboard({ onAddWidget, draggedWidget = null }: WidgetDashboardProps) {
  const { preferences, setPreferences } = usePreferences();
  const [layouts, setLayouts] = useState<WidgetLayout[]>([
    { i: "time-0", x: 0, y: 0, w: 2, h: 1, widgetId: "time" },
    { i: "weather-1", x: 2, y: 0, w: 2, h: 1, widgetId: "weather" },
    { i: "tasks-2", x: 0, y: 1, w: 3, h: 2, widgetId: "tasks" },
    { i: "upcoming-3", x: 3, y: 1, w: 3, h: 2, widgetId: "upcoming" },
  ]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      const savedLayout = preferences.widgetLayout;
      if (savedLayout && Array.isArray(savedLayout) && savedLayout.length > 0) {
        setLayouts(savedLayout);
      }
      setIsInitialized(true);
    }
  }, []);

  const handleLayoutChange = (newLayout: any[]) => {
    if (!newLayout || !Array.isArray(newLayout) || !isInitialized) return;
    
    const updatedLayouts = newLayout.map((item: any) => {
      const existing = layouts.find((l) => l.i === item.i);
      return {
        ...item,
        widgetId: existing?.widgetId || "",
      } as WidgetLayout;
    });
    
    // Only update if layouts actually changed
    const hasChanged = JSON.stringify(updatedLayouts) !== JSON.stringify(layouts);
    if (hasChanged) {
      setLayouts(updatedLayouts);
      
      // Debounce saving to preferences
      setTimeout(() => {
        setPreferences({
          ...preferences,
          widgetLayout: updatedLayouts,
        });
      }, 500);
    }
  };

  const handleRemoveWidget = (id: string) => {
    const newLayouts = layouts.filter((l) => l.i !== id);
    setLayouts(newLayouts);
    setPreferences({
      ...preferences,
      widgetLayout: newLayouts,
    });
  };

  const handleDrop = (layout: any[], layoutItem: any, _event: any) => {
    if (draggedWidget) {
      const newWidget: WidgetLayout = {
        i: `${draggedWidget.id}-${Date.now()}`,
        x: layoutItem.x || 0,
        y: layoutItem.y || Infinity,
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

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('text/plain')) {
        setIsDraggingOver(true);
      }
    };

    const handleDragEnd = () => {
      setIsDraggingOver(false);
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragend', handleDragEnd);
    
    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      setIsEditMode(true);
    }, 800); // 800ms hold to enter edit mode
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setIsEditMode(true);
    }, 800);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const addWidget = (widgetId: string, defaultSize: { w: number; h: number }) => {
    const newWidget: WidgetLayout = {
      i: `${widgetId}-${Date.now()}`,
      x: 0,
      y: Infinity, // Add to bottom
      w: defaultSize.w,
      h: defaultSize.h,
      widgetId: widgetId,
    };
    
    const newLayouts = [...layouts, newWidget];
    setLayouts(newLayouts);
    setPreferences({
      ...preferences,
      widgetLayout: newLayouts,
    });
  };

  // Watch for draggedWidget changes and add widget when set
  useEffect(() => {
    if (draggedWidget && isEditMode) {
      addWidget(draggedWidget.id, draggedWidget.defaultSize);
      if (onAddWidget) {
        onAddWidget(draggedWidget.id);
      }
    }
  }, [draggedWidget]);

  return (
    <div className="space-y-3">
      {/* Edit Mode Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {isEditMode ? "Click widgets in the side panel to add them" : "Hold to enter edit mode"}
        </p>
        <Button
          size="sm"
          variant={isEditMode ? "default" : "outline"}
          onClick={() => setIsEditMode(!isEditMode)}
          className={isEditMode ? "bg-fuchsia-600 hover:bg-fuchsia-500" : ""}
        >
          {isEditMode ? "Done" : "Edit Widgets"}
        </Button>
      </div>

      <div
        ref={containerRef}
        className={`relative min-h-[400px] rounded-xl border-2 border-dashed transition-colors ${
          isEditMode ? "border-fuchsia-400 bg-fuchsia-500/5" : "border-slate-700/50 bg-transparent"
        }`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
      {layouts.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <GripVertical className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Drag widgets here to get started</p>
          </div>
        </div>
      ) : (
        <Responsive
          className="layout"
          layouts={{
            lg: layouts || [],
            md: layouts || [],
            sm: layouts || [],
            xs: layouts || [],
            xxs: layouts || []
          }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 6, md: 4, sm: 2, xs: 1, xxs: 1 }}
          rowHeight={120}
          width={containerWidth}
          onLayoutChange={handleLayoutChange}
          onDrop={handleDrop}
          droppingItem={{ i: "drop", x: 0, y: 0, w: 2, h: 2 }}
        >
          {(layouts || []).map((layout) => (
            <div
              key={layout.i}
              className={`relative group ${isEditMode ? 'animate-wiggle' : ''}`}
            >
              {isEditMode && (
                <>
                  <div className="absolute top-2 left-2 z-10 transition-opacity drag-handle cursor-move">
                    <GripVertical className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="absolute top-2 right-2 z-10 transition-opacity">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-6 w-6 rounded-full"
                      onClick={() => handleRemoveWidget(layout.i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
              <div className="h-full">
                <WidgetRenderer widgetId={layout.widgetId} />
              </div>
            </div>
          ))}
        </Responsive>
      )}
      </div>
    </div>
  );
}