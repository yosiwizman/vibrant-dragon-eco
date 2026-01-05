"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Responsive } from "react-grid-layout";
import WidgetRenderer from "./WidgetRenderer";
import { Button } from "@/components/ui/button";
import { X, GripVertical, Plus } from "lucide-react";
import { usePreferences } from "@/state/preferences";
import { showSuccess } from "@/utils/toast";
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDraggedWidgetRef = useRef<string | null>(null);

  // Initialize layouts from preferences or use defaults
  const [layouts, setLayouts] = useState<WidgetLayout[]>(() => {
    const savedLayout = preferences.widgetLayout;
    if (savedLayout && Array.isArray(savedLayout) && savedLayout.length > 0) {
      return savedLayout;
    }
    return [
      { i: "time-0", x: 0, y: 0, w: 2, h: 1, widgetId: "time" },
      { i: "weather-1", x: 2, y: 0, w: 2, h: 1, widgetId: "weather" },
      { i: "tasks-2", x: 0, y: 1, w: 3, h: 2, widgetId: "tasks" },
      { i: "upcoming-3", x: 3, y: 1, w: 3, h: 2, widgetId: "upcoming" },
    ];
  });

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);

  // Save layouts to preferences with debouncing
  const saveLayoutsToPreferences = useCallback((newLayouts: WidgetLayout[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      setPreferences({
        ...preferences,
        widgetLayout: newLayouts,
      });
    }, 1000);
  }, [preferences, setPreferences]);

  // Handle layout changes from grid
  const handleLayoutChange = useCallback((newLayout: any[], allLayouts: any) => {
    if (!newLayout || !Array.isArray(newLayout)) return;
    
    const updatedLayouts: WidgetLayout[] = newLayout.map((item: any) => {
      const existing = layouts.find((l) => l.i === item.i);
      return {
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        widgetId: existing?.widgetId || "",
      };
    });
    
    setLayouts(updatedLayouts);
    saveLayoutsToPreferences(updatedLayouts);
  }, [layouts, saveLayoutsToPreferences]);

  // Add widget to dashboard
  const addWidget = useCallback((widgetId: string, defaultSize: { w: number; h: number }) => {
    // Check if widget already exists
    const exists = layouts.some(l => l.widgetId === widgetId);
    if (exists) {
      showSuccess(`${widgetId} widget is already on your dashboard`);
      return;
    }

    // Find next available position
    const maxY = layouts.length > 0 ? Math.max(...layouts.map(l => l.y + l.h)) : 0;
    
    const newWidget: WidgetLayout = {
      i: `${widgetId}-${Date.now()}`,
      x: 0,
      y: maxY,
      w: defaultSize.w,
      h: defaultSize.h,
      widgetId: widgetId,
    };
    
    const newLayouts = [...layouts, newWidget];
    setLayouts(newLayouts);
    saveLayoutsToPreferences(newLayouts);
    showSuccess(`Added ${widgetId} widget`);
    
    if (onAddWidget) {
      onAddWidget(widgetId);
    }
  }, [layouts, saveLayoutsToPreferences, onAddWidget]);

  // Remove widget from dashboard
  const handleRemoveWidget = useCallback((id: string) => {
    const newLayouts = layouts.filter((l) => l.i !== id);
    setLayouts(newLayouts);
    setPreferences({
      ...preferences,
      widgetLayout: newLayouts,
    });
    showSuccess("Widget removed");
  }, [layouts, preferences, setPreferences]);

  // Watch for draggedWidget changes
  useEffect(() => {
    if (draggedWidget) {
      const widgetKey = `${draggedWidget.id}-${draggedWidget.defaultSize.w}-${draggedWidget.defaultSize.h}`;
      
      // Only add if it's a new drag (prevent duplicate adds)
      if (lastDraggedWidgetRef.current !== widgetKey) {
        lastDraggedWidgetRef.current = widgetKey;
        addWidget(draggedWidget.id, draggedWidget.defaultSize);
      }
    }
  }, [draggedWidget, addWidget]);

  // Reset last dragged widget when edit mode changes
  useEffect(() => {
    if (!isEditMode) {
      lastDraggedWidgetRef.current = null;
    }
  }, [isEditMode]);

  return (
    <div className="space-y-3">
      {/* Edit Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300 font-medium">
            {isEditMode ? "Edit Mode Active" : "Widget Dashboard"}
          </p>
          <p className="text-xs text-slate-500">
            {isEditMode ? "Click widgets in side panel to add • Drag to reposition" : `${layouts.length} widgets`}
          </p>
        </div>
        <Button
          size="sm"
          variant={isEditMode ? "default" : "outline"}
          onClick={() => setIsEditMode(!isEditMode)}
          className={isEditMode ? "bg-fuchsia-600 hover:bg-fuchsia-500 text-white" : "border-slate-600 text-slate-300"}
        >
          {isEditMode ? (
            <>Done</>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Edit
            </>
          )}
        </Button>
      </div>

      <div
        ref={containerRef}
        className={`relative min-h-[400px] rounded-xl border-2 transition-all ${
          isEditMode 
            ? "border-fuchsia-400/50 bg-fuchsia-500/5 border-dashed" 
            : "border-slate-700/30 bg-transparent border-solid"
        }`}
      >
        {layouts.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <GripVertical className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Click "Edit" to add widgets</p>
              <p className="text-xs text-slate-500 mt-1">Open side panel → Widgets tab</p>
            </div>
          </div>
        ) : (
          <Responsive
            className="layout"
            layouts={{
              lg: layouts,
              md: layouts,
              sm: layouts,
              xs: layouts,
              xxs: layouts
            }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 6, md: 4, sm: 2, xs: 1, xxs: 1 }}
            rowHeight={120}
            width={containerWidth}
            onLayoutChange={handleLayoutChange}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            margin={[12, 12]}
            containerPadding={[12, 12]}
          >
            {layouts.map((layout) => (
              <div
                key={layout.i}
                className={`relative ${isEditMode ? 'animate-wiggle' : ''}`}
                data-grid={layout}
              >
                {isEditMode && (
                  <>
                    <div className="absolute top-1 left-1 z-20 bg-slate-800/80 rounded p-1 backdrop-blur-sm">
                      <GripVertical className="h-3 w-3 text-slate-300" />
                    </div>
                    <div className="absolute top-1 right-1 z-20">
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-6 w-6 rounded-full shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveWidget(layout.i);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
                <div className={`h-full ${isEditMode ? 'pointer-events-none' : ''}`}>
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