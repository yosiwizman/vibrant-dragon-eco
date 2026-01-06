"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
const CELL_GAP = 8;
const GRID_PADDING = 12;

// Simple grid-based layout calculator
// This function GUARANTEES no overlaps by placing widgets one by one
function calculateLayout(widgets: Widget[]): Widget[] {
  if (widgets.length === 0) return [];

  // Create a 2D grid to track occupied cells
  // grid[y][x] = widgetId or null
  const maxRows = 50; // Support up to 50 rows
  const grid: (string | null)[][] = [];
  for (let y = 0; y < maxRows; y++) {
    grid[y] = new Array(GRID_COLS).fill(null);
  }

  const result: Widget[] = [];

  // Sort widgets by their original position (top-left first)
  const sortedWidgets = [...widgets].sort((a, b) => {
    const aScore = a.y * 1000 + a.x;
    const bScore = b.y * 1000 + b.x;
    return aScore - bScore;
  });

  for (const widget of sortedWidgets) {
    // Validate widget size
    const config = WIDGET_CONFIGS[widget.type];
    let w = Math.max(1, Math.min(GRID_COLS, widget.w));
    let h = Math.max(1, widget.h);
    
    if (config) {
      w = Math.max(config.minSize.w, Math.min(config.maxSize.w, w));
      h = Math.max(config.minSize.h, Math.min(config.maxSize.h, h));
    }

    // Find the first available position for this widget
    let placed = false;
    let finalX = 0;
    let finalY = 0;

    for (let y = 0; y < maxRows && !placed; y++) {
      for (let x = 0; x <= GRID_COLS - w && !placed; x++) {
        // Check if all cells for this widget are free
        let canPlace = true;
        for (let dy = 0; dy < h && canPlace; dy++) {
          for (let dx = 0; dx < w && canPlace; dx++) {
            if (y + dy >= maxRows || grid[y + dy][x + dx] !== null) {
              canPlace = false;
            }
          }
        }

        if (canPlace) {
          // Mark cells as occupied
          for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
              grid[y + dy][x + dx] = widget.id;
            }
          }
          finalX = x;
          finalY = y;
          placed = true;
        }
      }
    }

    result.push({
      ...widget,
      x: finalX,
      y: finalY,
      w,
      h,
    });
  }

  return result;
}

// Check if a position is valid (no overlaps)
function canPlaceWidget(
  widgets: Widget[],
  x: number,
  y: number,
  w: number,
  h: number,
  excludeId?: string
): boolean {
  if (x < 0 || y < 0 || x + w > GRID_COLS) return false;

  for (const widget of widgets) {
    if (widget.id === excludeId) continue;

    // Check for overlap
    const overlapX = x < widget.x + widget.w && x + w > widget.x;
    const overlapY = y < widget.y + widget.h && y + h > widget.y;

    if (overlapX && overlapY) {
      return false;
    }
  }

  return true;
}

// Find next available position
function findNextPosition(widgets: Widget[], w: number, h: number): { x: number; y: number } {
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= GRID_COLS - w; x++) {
      if (canPlaceWidget(widgets, x, y, w, h)) {
        return { x, y };
      }
    }
  }
  return { x: 0, y: 0 };
}

// Default widgets for new users
const DEFAULT_WIDGETS: Widget[] = [
  { id: 'default-time', type: 'time', x: 0, y: 0, w: 1, h: 1 },
  { id: 'default-weather', type: 'weather', x: 1, y: 0, w: 2, h: 2 },
  { id: 'default-tasks', type: 'tasks', x: 3, y: 0, w: 1, h: 2 },
  { id: 'default-upcoming', type: 'upcoming', x: 0, y: 2, w: 2, h: 2 },
  { id: 'default-calendar', type: 'calendar', x: 2, y: 2, w: 2, h: 2 },
];

export default function WidgetGrid() {
  const { preferences, setPreferences } = usePreferences();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dragState, setDragState] = useState<{
    widgetId: string;
    startX: number;
    startY: number;
    originalWidget: Widget;
  } | null>(null);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(0);

  // Calculate cell width based on grid width
  const cellWidth = gridWidth > 0 
    ? (gridWidth - GRID_PADDING * 2 - CELL_GAP * (GRID_COLS - 1)) / GRID_COLS 
    : 0;

  // Load and fix widgets on mount
  useEffect(() => {
    const saved = preferences.widgets;
    
    let loadedWidgets: Widget[];
    if (saved && Array.isArray(saved) && saved.length > 0) {
      // ALWAYS recalculate layout to fix any overlaps
      loadedWidgets = calculateLayout(saved);
    } else {
      loadedWidgets = calculateLayout(DEFAULT_WIDGETS);
    }

    setWidgets(loadedWidgets);
    
    // Save the fixed layout
    setPreferences({ ...preferences, widgets: loadedWidgets });
  }, []);

  // Update grid width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (gridRef.current) {
        setGridWidth(gridRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    // Delayed update for initial render
    const timer = setTimeout(updateWidth, 50);

    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(timer);
    };
  }, []);

  // Calculate grid height based on widgets
  const gridHeight = React.useMemo(() => {
    if (widgets.length === 0) return 400;
    const maxY = Math.max(...widgets.map(w => w.y + w.h));
    return Math.max(400, maxY * CELL_HEIGHT + (maxY - 1) * CELL_GAP + GRID_PADDING * 2 + 20);
  }, [widgets]);

  // Save widgets to preferences
  const saveWidgets = useCallback((newWidgets: Widget[]) => {
    const fixed = calculateLayout(newWidgets);
    setWidgets(fixed);
    setPreferences({ ...preferences, widgets: fixed });
  }, [preferences, setPreferences]);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    const defaultLayout = calculateLayout(DEFAULT_WIDGETS);
    setWidgets(defaultLayout);
    setPreferences({ ...preferences, widgets: defaultLayout });
    showSuccess("Reset to default layout");
  }, [preferences, setPreferences]);

  // Add a new widget
  const addWidget = useCallback((type: string, size: { w: number; h: number }) => {
    if (widgets.some(w => w.type === type)) {
      showSuccess(`${type} widget already exists`);
      return;
    }

    const w = Math.min(size.w, GRID_COLS);
    const h = size.h;
    const pos = findNextPosition(widgets, w, h);

    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      x: pos.x,
      y: pos.y,
      w,
      h,
    };

    saveWidgets([...widgets, newWidget]);
    showSuccess(`Added ${type} widget`);
  }, [widgets, saveWidgets]);

  // Remove a widget
  const removeWidget = useCallback((id: string) => {
    saveWidgets(widgets.filter(w => w.id !== id));
    showSuccess("Widget removed");
  }, [widgets, saveWidgets]);

  // Start dragging
  const startDrag = useCallback((widget: Widget, clientX: number, clientY: number) => {
    if (!isEditMode) return;
    setDragState({
      widgetId: widget.id,
      startX: clientX,
      startY: clientY,
      originalWidget: { ...widget },
    });
  }, [isEditMode]);

  // Handle drag move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState || cellWidth === 0) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    const cellDeltaX = Math.round(deltaX / (cellWidth + CELL_GAP));
    const cellDeltaY = Math.round(deltaY / (CELL_HEIGHT + CELL_GAP));

    let newX = dragState.originalWidget.x + cellDeltaX;
    let newY = dragState.originalWidget.y + cellDeltaY;

    // Clamp to grid bounds
    newX = Math.max(0, Math.min(GRID_COLS - dragState.originalWidget.w, newX));
    newY = Math.max(0, newY);

    // Only update if position is valid
    const otherWidgets = widgets.filter(w => w.id !== dragState.widgetId);
    if (canPlaceWidget(otherWidgets, newX, newY, dragState.originalWidget.w, dragState.originalWidget.h)) {
      setWidgets(prev => prev.map(w =>
        w.id === dragState.widgetId ? { ...w, x: newX, y: newY } : w
      ));
    }
  }, [dragState, cellWidth, widgets]);

  // End drag
  const endDrag = useCallback(() => {
    if (dragState) {
      saveWidgets(widgets);
      setDragState(null);
    }
  }, [dragState, widgets, saveWidgets]);

  // Expose addWidget globally for the widget picker
  useEffect(() => {
    (window as any).addWidgetToDashboard = addWidget;
    return () => {
      delete (window as any).addWidgetToDashboard;
    };
  }, [addWidget]);

  // Calculate pixel position for a widget
  const getWidgetStyle = useCallback((widget: Widget): React.CSSProperties => {
    if (cellWidth === 0) {
      return { display: 'none' };
    }

    return {
      position: 'absolute',
      left: GRID_PADDING + widget.x * (cellWidth + CELL_GAP),
      top: GRID_PADDING + widget.y * (CELL_HEIGHT + CELL_GAP),
      width: widget.w * cellWidth + (widget.w - 1) * CELL_GAP,
      height: widget.h * CELL_HEIGHT + (widget.h - 1) * CELL_GAP,
      transition: dragState?.widgetId === widget.id ? 'none' : 'all 0.2s ease',
    };
  }, [cellWidth, dragState]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300 font-medium">
            {isEditMode ? "Edit Mode" : "Widgets"}
          </p>
          <p className="text-xs text-slate-500">
            {isEditMode ? "Drag widgets to reposition" : `${widgets.length} widgets`}
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

      {/* Widget Grid */}
      <div
        ref={gridRef}
        className={`relative rounded-xl border-2 transition-colors ${
          isEditMode 
            ? "border-fuchsia-400/50 bg-fuchsia-500/5 border-dashed" 
            : "border-slate-700/30 bg-transparent"
        }`}
        style={{ minHeight: gridHeight }}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        {widgets.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <GripVertical className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No widgets</p>
              <p className="text-xs text-slate-500 mt-1">Click Edit to add widgets</p>
            </div>
          </div>
        ) : (
          widgets.map((widget) => (
            <div
              key={widget.id}
              style={getWidgetStyle(widget)}
              className={dragState?.widgetId === widget.id ? 'z-50' : 'z-10'}
            >
              <WidgetCell
                widget={widget}
                isEditMode={isEditMode}
                isDragging={dragState?.widgetId === widget.id}
                onRemove={() => removeWidget(widget.id)}
                onDragStart={(x, y) => startDrag(widget, x, y)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}