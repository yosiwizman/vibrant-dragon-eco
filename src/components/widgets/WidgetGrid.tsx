"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, RotateCcw } from "lucide-react";
import { Widget } from "@/types/widgets";
import { WIDGET_CONFIGS } from "@/types/widgets";
import { usePreferences } from "@/state/preferences";
import { showSuccess } from "@/utils/toast";
import WidgetCell from "./WidgetCell";

// Grid configuration
const GRID_COLS = 4;
const CELL_HEIGHT = 100;
const GAP = 8;

// Default widgets - these are guaranteed to not overlap
const DEFAULT_WIDGETS: Widget[] = [
  { id: 'w1', type: 'time', x: 0, y: 0, w: 1, h: 1 },
  { id: 'w2', type: 'weather', x: 1, y: 0, w: 2, h: 2 },
  { id: 'w3', type: 'tasks', x: 3, y: 0, w: 1, h: 2 },
  { id: 'w4', type: 'upcoming', x: 0, y: 1, w: 1, h: 1 },
  { id: 'w5', type: 'calendar', x: 0, y: 2, w: 2, h: 2 },
  { id: 'w6', type: 'notes', x: 2, y: 2, w: 2, h: 2 },
];

// Build a grid map to track which cells are occupied
function buildGridMap(widgets: Widget[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const widget of widgets) {
    for (let dy = 0; dy < widget.h; dy++) {
      for (let dx = 0; dx < widget.w; dx++) {
        map.set(`${widget.x + dx},${widget.y + dy}`, widget.id);
      }
    }
  }
  return map;
}

// Check if a widget can be placed at a position
function canPlace(gridMap: Map<string, string>, x: number, y: number, w: number, h: number, excludeId?: string): boolean {
  if (x < 0 || y < 0 || x + w > GRID_COLS) return false;
  
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const key = `${x + dx},${y + dy}`;
      const occupant = gridMap.get(key);
      if (occupant && occupant !== excludeId) {
        return false;
      }
    }
  }
  return true;
}

// Find the first available position for a widget
function findPosition(gridMap: Map<string, string>, w: number, h: number): { x: number; y: number } {
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x <= GRID_COLS - w; x++) {
      if (canPlace(gridMap, x, y, w, h)) {
        return { x, y };
      }
    }
  }
  return { x: 0, y: 0 };
}

// Validate and fix widget layout - GUARANTEES no overlaps
function validateAndFixLayout(widgets: Widget[]): Widget[] {
  if (!widgets || widgets.length === 0) return [];
  
  const result: Widget[] = [];
  const gridMap = new Map<string, string>();
  
  // Sort by position (top-left first)
  const sorted = [...widgets].sort((a, b) => (a.y * 100 + a.x) - (b.y * 100 + b.x));
  
  for (const widget of sorted) {
    // Validate dimensions
    const config = WIDGET_CONFIGS[widget.type];
    let w = Math.max(1, Math.min(GRID_COLS, widget.w || 1));
    let h = Math.max(1, widget.h || 1);
    
    if (config) {
      w = Math.max(config.minSize.w, Math.min(config.maxSize.w, w));
      h = Math.max(config.minSize.h, Math.min(config.maxSize.h, h));
    }
    
    // Try current position first
    let x = Math.max(0, Math.min(GRID_COLS - w, widget.x || 0));
    let y = Math.max(0, widget.y || 0);
    
    // If position is occupied, find a new one
    if (!canPlace(gridMap, x, y, w, h)) {
      const newPos = findPosition(gridMap, w, h);
      x = newPos.x;
      y = newPos.y;
    }
    
    // Mark cells as occupied
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        gridMap.set(`${x + dx},${y + dy}`, widget.id);
      }
    }
    
    result.push({ ...widget, x, y, w, h });
  }
  
  return result;
}

export default function WidgetGrid() {
  const { preferences, setPreferences } = usePreferences();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dragWidget, setDragWidget] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Initialize widgets
  useEffect(() => {
    let initialWidgets: Widget[];
    
    if (preferences.widgets && Array.isArray(preferences.widgets) && preferences.widgets.length > 0) {
      // Validate and fix any issues
      initialWidgets = validateAndFixLayout(preferences.widgets);
    } else {
      // Use defaults
      initialWidgets = validateAndFixLayout(DEFAULT_WIDGETS);
    }
    
    setWidgets(initialWidgets);
    
    // Save fixed layout
    const currentStr = JSON.stringify(preferences.widgets);
    const fixedStr = JSON.stringify(initialWidgets);
    if (currentStr !== fixedStr) {
      setPreferences({ ...preferences, widgets: initialWidgets });
    }
  }, []);

  // Calculate grid height
  const gridHeight = React.useMemo(() => {
    if (widgets.length === 0) return 400;
    const maxY = Math.max(...widgets.map(w => w.y + w.h));
    return Math.max(400, maxY * CELL_HEIGHT + (maxY - 1) * GAP + 24);
  }, [widgets]);

  // Save widgets
  const saveWidgets = useCallback((newWidgets: Widget[]) => {
    const fixed = validateAndFixLayout(newWidgets);
    setWidgets(fixed);
    setPreferences({ ...preferences, widgets: fixed });
  }, [preferences, setPreferences]);

  // Reset layout
  const resetLayout = useCallback(() => {
    const defaultLayout = validateAndFixLayout(DEFAULT_WIDGETS);
    setWidgets(defaultLayout);
    setPreferences({ ...preferences, widgets: defaultLayout });
    showSuccess("Layout reset");
  }, [preferences, setPreferences]);

  // Add widget
  const addWidget = useCallback((type: string, size: { w: number; h: number }) => {
    if (widgets.some(w => w.type === type)) {
      showSuccess(`${type} already exists`);
      return;
    }

    const gridMap = buildGridMap(widgets);
    const pos = findPosition(gridMap, size.w, size.h);
    
    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      x: pos.x,
      y: pos.y,
      w: size.w,
      h: size.h,
    };

    saveWidgets([...widgets, newWidget]);
    showSuccess(`Added ${type}`);
  }, [widgets, saveWidgets]);

  // Remove widget
  const removeWidget = useCallback((id: string) => {
    saveWidgets(widgets.filter(w => w.id !== id));
    showSuccess("Removed");
  }, [widgets, saveWidgets]);

  // Expose addWidget globally
  useEffect(() => {
    (window as any).addWidgetToDashboard = addWidget;
    return () => { delete (window as any).addWidgetToDashboard; };
  }, [addWidget]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300 font-medium">
            {isEditMode ? "Edit Mode" : "Widgets"}
          </p>
          <p className="text-xs text-slate-500">
            {isEditMode ? "Click X to remove widgets" : `${widgets.length} widgets`}
          </p>
        </div>
        <div className="flex gap-2">
          {isEditMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={resetLayout}
              className="border-slate-600 text-slate-300"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant={isEditMode ? "default" : "outline"}
            onClick={() => setIsEditMode(!isEditMode)}
            className={isEditMode ? "bg-fuchsia-600 hover:bg-fuchsia-500" : "border-slate-600 text-slate-300"}
          >
            {isEditMode ? "Done" : <><Plus className="h-4 w-4 mr-1" />Edit</>}
          </Button>
        </div>
      </div>

      {/* Grid Container */}
      <div
        ref={gridRef}
        className={`relative rounded-xl border-2 p-3 transition-colors ${
          isEditMode 
            ? "border-fuchsia-400/50 bg-fuchsia-500/5 border-dashed" 
            : "border-slate-700/30 bg-transparent"
        }`}
        style={{ minHeight: gridHeight }}
      >
        {widgets.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center text-slate-400">
              <GripVertical className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No widgets</p>
              <p className="text-xs text-slate-500 mt-1">Click Edit to add widgets</p>
            </div>
          </div>
        ) : (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gridAutoRows: `${CELL_HEIGHT}px`,
            }}
          >
            {widgets.map((widget) => (
              <div
                key={widget.id}
                style={{
                  gridColumn: `${widget.x + 1} / span ${widget.w}`,
                  gridRow: `${widget.y + 1} / span ${widget.h}`,
                }}
              >
                <WidgetCell
                  widget={widget}
                  isEditMode={isEditMode}
                  isDragging={dragWidget === widget.id}
                  onRemove={() => removeWidget(widget.id)}
                  onDragStart={() => setDragWidget(widget.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}