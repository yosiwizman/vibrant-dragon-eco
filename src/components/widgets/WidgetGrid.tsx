"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
const PADDING = 12;

// Default widgets with GUARANTEED non-overlapping positions
const DEFAULT_WIDGETS: Widget[] = [
  { id: 'default-1', type: 'time', x: 0, y: 0, w: 1, h: 1 },
  { id: 'default-2', type: 'weather', x: 1, y: 0, w: 2, h: 2 },
  { id: 'default-3', type: 'tasks', x: 3, y: 0, w: 1, h: 2 },
  { id: 'default-4', type: 'upcoming', x: 0, y: 1, w: 1, h: 1 },
  { id: 'default-5', type: 'calendar', x: 0, y: 2, w: 2, h: 2 },
  { id: 'default-6', type: 'notes', x: 2, y: 2, w: 2, h: 2 },
];

/**
 * BULLETPROOF layout function - places widgets one by one,
 * finding the first available position for each.
 * This GUARANTEES no overlaps.
 */
function layoutWidgets(inputWidgets: Widget[]): Widget[] {
  if (!inputWidgets || inputWidgets.length === 0) return [];
  
  // Track occupied cells: Set of "x,y" strings
  const occupied = new Set<string>();
  const result: Widget[] = [];
  
  // Sort by original position (top-left first)
  const sorted = [...inputWidgets].sort((a, b) => {
    const scoreA = (a.y || 0) * 1000 + (a.x || 0);
    const scoreB = (b.y || 0) * 1000 + (b.x || 0);
    return scoreA - scoreB;
  });
  
  for (const widget of sorted) {
    // Get valid dimensions
    const config = WIDGET_CONFIGS[widget.type];
    let w = Math.max(1, Math.min(GRID_COLS, widget.w || 1));
    let h = Math.max(1, widget.h || 1);
    
    if (config) {
      w = Math.max(config.minSize.w, Math.min(config.maxSize.w, w));
      h = Math.max(config.minSize.h, Math.min(config.maxSize.h, h));
    }
    
    // Find first available position
    let placed = false;
    let finalX = 0;
    let finalY = 0;
    
    // Search row by row, column by column
    for (let y = 0; y < 100 && !placed; y++) {
      for (let x = 0; x <= GRID_COLS - w && !placed; x++) {
        // Check if all cells are free
        let canPlace = true;
        for (let dy = 0; dy < h && canPlace; dy++) {
          for (let dx = 0; dx < w && canPlace; dx++) {
            if (occupied.has(`${x + dx},${y + dy}`)) {
              canPlace = false;
            }
          }
        }
        
        if (canPlace) {
          // Mark cells as occupied
          for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
              occupied.add(`${x + dx},${y + dy}`);
            }
          }
          finalX = x;
          finalY = y;
          placed = true;
        }
      }
    }
    
    result.push({
      id: widget.id,
      type: widget.type,
      x: finalX,
      y: finalY,
      w,
      h,
    });
  }
  
  return result;
}

/**
 * Find next available position for a new widget
 */
function findNextPosition(widgets: Widget[], w: number, h: number): { x: number; y: number } {
  const occupied = new Set<string>();
  
  for (const widget of widgets) {
    for (let dy = 0; dy < widget.h; dy++) {
      for (let dx = 0; dx < widget.w; dx++) {
        occupied.add(`${widget.x + dx},${widget.y + dy}`);
      }
    }
  }
  
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= GRID_COLS - w; x++) {
      let canPlace = true;
      for (let dy = 0; dy < h && canPlace; dy++) {
        for (let dx = 0; dx < w && canPlace; dx++) {
          if (occupied.has(`${x + dx},${y + dy}`)) {
            canPlace = false;
          }
        }
      }
      if (canPlace) {
        return { x, y };
      }
    }
  }
  
  return { x: 0, y: 0 };
}

export default function WidgetGrid() {
  const { preferences, setPreferences } = usePreferences();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate cell width based on container
  const cellWidth = useMemo(() => {
    if (containerWidth === 0) return 0;
    return (containerWidth - PADDING * 2 - GAP * (GRID_COLS - 1)) / GRID_COLS;
  }, [containerWidth]);

  // Initialize widgets on mount
  useEffect(() => {
    const saved = preferences.widgets;
    let initialWidgets: Widget[];
    
    if (saved && Array.isArray(saved) && saved.length > 0) {
      // ALWAYS run through layout to fix any issues
      initialWidgets = layoutWidgets(saved);
    } else {
      initialWidgets = layoutWidgets(DEFAULT_WIDGETS);
    }
    
    setWidgets(initialWidgets);
    
    // Save if changed
    if (JSON.stringify(saved) !== JSON.stringify(initialWidgets)) {
      setPreferences({ ...preferences, widgets: initialWidgets });
    }
  }, []);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (gridRef.current) {
        setContainerWidth(gridRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    const timer = setTimeout(updateWidth, 100);
    
    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(timer);
    };
  }, []);

  // Calculate grid height
  const gridHeight = useMemo(() => {
    if (widgets.length === 0) return 400;
    const maxY = Math.max(...widgets.map(w => w.y + w.h));
    return Math.max(400, PADDING * 2 + maxY * CELL_HEIGHT + (maxY - 1) * GAP + 20);
  }, [widgets]);

  // Save widgets
  const saveWidgets = useCallback((newWidgets: Widget[]) => {
    const fixed = layoutWidgets(newWidgets);
    setWidgets(fixed);
    setPreferences({ ...preferences, widgets: fixed });
  }, [preferences, setPreferences]);

  // Reset to defaults
  const resetLayout = useCallback(() => {
    const defaults = layoutWidgets(DEFAULT_WIDGETS);
    setWidgets(defaults);
    setPreferences({ ...preferences, widgets: defaults });
    showSuccess("Layout reset to defaults");
  }, [preferences, setPreferences]);

  // Add widget
  const addWidget = useCallback((type: string, size: { w: number; h: number }) => {
    if (widgets.some(w => w.type === type)) {
      showSuccess(`${type} already exists`);
      return;
    }

    const pos = findNextPosition(widgets, size.w, size.h);
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
    showSuccess("Widget removed");
  }, [widgets, saveWidgets]);

  // Expose addWidget globally
  useEffect(() => {
    (window as any).addWidgetToDashboard = addWidget;
    return () => { delete (window as any).addWidgetToDashboard; };
  }, [addWidget]);

  // Calculate pixel position for each widget
  const getWidgetStyle = useCallback((widget: Widget): React.CSSProperties => {
    if (cellWidth === 0) return { display: 'none' };
    
    return {
      position: 'absolute',
      left: PADDING + widget.x * (cellWidth + GAP),
      top: PADDING + widget.y * (CELL_HEIGHT + GAP),
      width: widget.w * cellWidth + (widget.w - 1) * GAP,
      height: widget.h * CELL_HEIGHT + (widget.h - 1) * GAP,
    };
  }, [cellWidth]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300 font-medium">
            {isEditMode ? "Edit Mode" : "Widgets"}
          </p>
          <p className="text-xs text-slate-500">
            {isEditMode ? "Click X to remove" : `${widgets.length} widgets`}
          </p>
        </div>
        <div className="flex gap-2">
          {isEditMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={resetLayout}
              className="border-slate-600 text-slate-300"
              title="Reset to default layout"
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

      {/* Grid Container - Using absolute positioning */}
      <div
        ref={gridRef}
        className={`relative rounded-xl border-2 transition-colors ${
          isEditMode 
            ? "border-fuchsia-400/50 bg-fuchsia-500/5 border-dashed" 
            : "border-slate-700/30 bg-transparent"
        }`}
        style={{ minHeight: gridHeight }}
      >
        {widgets.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <GripVertical className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No widgets</p>
              <p className="text-xs text-slate-500 mt-1">Click Edit to add</p>
            </div>
          </div>
        ) : (
          widgets.map((widget) => (
            <div
              key={widget.id}
              style={getWidgetStyle(widget)}
              className="transition-all duration-200"
            >
              <WidgetCell
                widget={widget}
                isEditMode={isEditMode}
                isDragging={false}
                onRemove={() => removeWidget(widget.id)}
                onDragStart={() => {}}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}