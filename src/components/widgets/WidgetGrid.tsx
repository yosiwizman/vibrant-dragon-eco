"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, RefreshCw } from "lucide-react";
import { Widget } from "@/types/widgets";
import { WIDGET_CONFIGS } from "@/types/widgets";
import { usePreferences } from "@/state/preferences";
import { showSuccess } from "@/utils/toast";
import WidgetCell from "./WidgetCell";

const COLS = 4;
const ROW_HEIGHT = 100;
const GAP = 8;
const PADDING = 12;

// Create a 2D grid to track occupied cells
class OccupancyGrid {
  private grid: Map<string, string> = new Map(); // cell -> widgetId

  clear() {
    this.grid.clear();
  }

  isOccupied(x: number, y: number): boolean {
    return this.grid.has(`${x},${y}`);
  }

  getOccupant(x: number, y: number): string | undefined {
    return this.grid.get(`${x},${y}`);
  }

  canPlace(x: number, y: number, w: number, h: number, excludeId?: string): boolean {
    if (x < 0 || y < 0 || x + w > COLS) return false;
    
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const key = `${x + dx},${y + dy}`;
        const occupant = this.grid.get(key);
        if (occupant && occupant !== excludeId) {
          return false;
        }
      }
    }
    return true;
  }

  place(x: number, y: number, w: number, h: number, widgetId: string) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.grid.set(`${x + dx},${y + dy}`, widgetId);
      }
    }
  }

  remove(widgetId: string) {
    for (const [key, id] of this.grid.entries()) {
      if (id === widgetId) {
        this.grid.delete(key);
      }
    }
  }

  findNextAvailable(w: number, h: number, excludeId?: string): { x: number; y: number } {
    // Search row by row, column by column
    for (let y = 0; y < 100; y++) { // Allow up to 100 rows
      for (let x = 0; x <= COLS - w; x++) {
        if (this.canPlace(x, y, w, h, excludeId)) {
          return { x, y };
        }
      }
    }
    // Fallback - should never reach here
    return { x: 0, y: 0 };
  }
}

// Force arrange all widgets to prevent any overlaps
const forceArrangeWidgets = (widgetsToArrange: Widget[]): Widget[] => {
  if (widgetsToArrange.length === 0) return [];

  const grid = new OccupancyGrid();
  const arranged: Widget[] = [];

  // Sort by y position first, then x position (top-left to bottom-right)
  const sorted = [...widgetsToArrange].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  for (const widget of sorted) {
    // Validate widget dimensions
    const config = WIDGET_CONFIGS[widget.type];
    let w = widget.w;
    let h = widget.h;
    
    if (config) {
      w = Math.max(config.minSize.w, Math.min(config.maxSize.w, w));
      h = Math.max(config.minSize.h, Math.min(config.maxSize.h, h));
    }
    
    // Ensure width doesn't exceed grid
    w = Math.min(w, COLS);

    // Try to place at current position first
    if (grid.canPlace(widget.x, widget.y, w, h)) {
      grid.place(widget.x, widget.y, w, h, widget.id);
      arranged.push({ ...widget, w, h });
    } else {
      // Find next available position
      const pos = grid.findNextAvailable(w, h);
      grid.place(pos.x, pos.y, w, h, widget.id);
      arranged.push({ ...widget, x: pos.x, y: pos.y, w, h });
    }
  }

  return arranged;
};

// Compact widgets to remove gaps (move everything up)
const compactWidgets = (widgets: Widget[]): Widget[] => {
  if (widgets.length === 0) return [];
  
  const grid = new OccupancyGrid();
  const compacted: Widget[] = [];

  // Sort by y position first, then x position
  const sorted = [...widgets].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  for (const widget of sorted) {
    // Try to move widget up as much as possible
    let bestY = 0;
    
    // Find the highest y position where this widget can fit
    for (let y = 0; y <= widget.y; y++) {
      if (grid.canPlace(widget.x, y, widget.w, widget.h)) {
        bestY = y;
        break;
      }
      bestY = y + 1;
    }

    // If we can't place at the preferred x, find any available position at bestY or higher
    if (!grid.canPlace(widget.x, bestY, widget.w, widget.h)) {
      const pos = grid.findNextAvailable(widget.w, widget.h);
      bestY = pos.y;
      grid.place(pos.x, bestY, widget.w, widget.h, widget.id);
      compacted.push({ ...widget, x: pos.x, y: bestY });
    } else {
      grid.place(widget.x, bestY, widget.w, widget.h, widget.id);
      compacted.push({ ...widget, y: bestY });
    }
  }

  return compacted;
};

export default function WidgetGrid() {
  const { preferences, setPreferences } = usePreferences();
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [gridWidth, setGridWidth] = useState(0);
  const [activeAction, setActiveAction] = useState<{
    type: 'drag' | 'resize';
    widgetId: string;
    direction?: string;
    startX: number;
    startY: number;
    originalWidget: Widget;
  } | null>(null);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const occupancyGrid = useRef(new OccupancyGrid());

  // Rebuild occupancy grid whenever widgets change
  useEffect(() => {
    occupancyGrid.current.clear();
    for (const widget of widgets) {
      occupancyGrid.current.place(widget.x, widget.y, widget.w, widget.h, widget.id);
    }
  }, [widgets]);

  // Check if position is occupied (using the occupancy grid)
  const isPositionOccupied = useCallback((x: number, y: number, w: number, h: number, excludeId?: string): boolean => {
    return !occupancyGrid.current.canPlace(x, y, w, h, excludeId);
  }, []);

  // Find next available position
  const findAvailablePosition = useCallback((w: number, h: number, excludeId?: string): { x: number; y: number } => {
    return occupancyGrid.current.findNextAvailable(w, h, excludeId);
  }, []);

  // Load widgets from preferences and force arrange
  useEffect(() => {
    const saved = preferences.widgets;
    let initialWidgets: Widget[];
    
    if (saved && Array.isArray(saved) && saved.length > 0) {
      // ALWAYS force arrange to fix any overlaps
      initialWidgets = forceArrangeWidgets(saved);
      // Then compact to remove gaps
      initialWidgets = compactWidgets(initialWidgets);
    } else {
      // Default widgets - pre-arranged
      initialWidgets = [
        { id: '1', type: 'time', x: 0, y: 0, w: 1, h: 1 },
        { id: '2', type: 'weather', x: 1, y: 0, w: 2, h: 2 },
        { id: '3', type: 'tasks', x: 3, y: 0, w: 1, h: 2 },
        { id: '4', type: 'upcoming', x: 0, y: 2, w: 2, h: 2 },
        { id: '5', type: 'calendar', x: 2, y: 2, w: 2, h: 2 },
      ];
    }
    
    setWidgets(initialWidgets);
    
    // Save if changed
    const savedStr = JSON.stringify(saved);
    const arrangedStr = JSON.stringify(initialWidgets);
    if (savedStr !== arrangedStr) {
      setPreferences({ ...preferences, widgets: initialWidgets });
    }
  }, []);

  // Calculate grid height dynamically
  const gridHeight = useMemo(() => {
    if (widgets.length === 0) return 400;
    
    const maxY = Math.max(...widgets.map(w => w.y + w.h));
    const totalHeight = (maxY * ROW_HEIGHT) + ((maxY > 0 ? maxY - 1 : 0) * GAP) + (PADDING * 2) + 24;
    
    return Math.max(400, totalHeight);
  }, [widgets]);

  // Calculate cell width based on grid width
  const cellWidth = useMemo(() => {
    if (gridWidth === 0) return 0;
    return (gridWidth - (PADDING * 2) - (GAP * (COLS - 1))) / COLS;
  }, [gridWidth]);

  // Update grid width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (gridRef.current) {
        setGridWidth(gridRef.current.clientWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    // Also update after a short delay to handle initial render
    const timer = setTimeout(updateWidth, 100);
    
    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(timer);
    };
  }, []);

  // Save widgets
  const saveWidgets = useCallback((newWidgets: Widget[]) => {
    // Always force arrange before saving
    const arranged = forceArrangeWidgets(newWidgets);
    const compacted = compactWidgets(arranged);
    setWidgets(compacted);
    setPreferences({ ...preferences, widgets: compacted });
  }, [preferences, setPreferences]);

  // Force re-arrange all widgets (manual trigger)
  const forceReArrange = useCallback(() => {
    const arranged = forceArrangeWidgets(widgets);
    const compacted = compactWidgets(arranged);
    setWidgets(compacted);
    setPreferences({ ...preferences, widgets: compacted });
    showSuccess("Widgets re-arranged");
  }, [widgets, preferences, setPreferences]);

  // Long press to enter edit mode
  const handleGridMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!isEditMode && (target.classList.contains('widget-grid-bg') || target.closest('.widget-grid-bg'))) {
      longPressTimer.current = setTimeout(() => setIsEditMode(true), 800);
    }
  };

  const handleGridMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Add widget
  const addWidget = useCallback((type: string, size: { w: number; h: number }) => {
    if (widgets.some(w => w.type === type)) {
      showSuccess(`${type} already added`);
      return;
    }

    const w = Math.min(size.w, COLS);
    const h = size.h;
    const position = findAvailablePosition(w, h);
    
    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      x: position.x,
      y: position.y,
      w,
      h,
    };

    saveWidgets([...widgets, newWidget]);
    showSuccess(`Added ${type}`);
  }, [widgets, findAvailablePosition, saveWidgets]);

  // Remove widget
  const removeWidget = useCallback((id: string) => {
    const newWidgets = widgets.filter(w => w.id !== id);
    saveWidgets(newWidgets);
    showSuccess("Removed");
  }, [widgets, saveWidgets]);

  // Start drag
  const startDrag = useCallback((widget: Widget, clientX: number, clientY: number) => {
    if (!isEditMode || !gridRef.current) return;
    
    setActiveAction({
      type: 'drag',
      widgetId: widget.id,
      startX: clientX,
      startY: clientY,
      originalWidget: { ...widget },
    });
  }, [isEditMode]);

  // Start resize
  const startResize = useCallback((widget: Widget, direction: string, clientX: number, clientY: number) => {
    if (!isEditMode) return;
    
    setActiveAction({
      type: 'resize',
      widgetId: widget.id,
      direction,
      startX: clientX,
      startY: clientY,
      originalWidget: { ...widget },
    });
  }, [isEditMode]);

  // Handle mouse/touch move
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!activeAction || cellWidth === 0) return;

    const cellWithGap = cellWidth + GAP;
    const rowWithGap = ROW_HEIGHT + GAP;

    if (activeAction.type === 'drag') {
      const deltaX = clientX - activeAction.startX;
      const deltaY = clientY - activeAction.startY;
      const cellDeltaX = Math.round(deltaX / cellWithGap);
      const cellDeltaY = Math.round(deltaY / rowWithGap);

      let newX = activeAction.originalWidget.x + cellDeltaX;
      let newY = activeAction.originalWidget.y + cellDeltaY;

      // Constrain to grid bounds
      newX = Math.max(0, Math.min(COLS - activeAction.originalWidget.w, newX));
      newY = Math.max(0, newY);

      // Only move if position is not occupied
      if (!isPositionOccupied(newX, newY, activeAction.originalWidget.w, activeAction.originalWidget.h, activeAction.widgetId)) {
        setWidgets(prev => prev.map(w =>
          w.id === activeAction.widgetId ? { ...w, x: newX, y: newY } : w
        ));
      }
    } else if (activeAction.type === 'resize') {
      const config = WIDGET_CONFIGS[activeAction.originalWidget.type];
      if (!config) return;
      
      const deltaX = clientX - activeAction.startX;
      const deltaY = clientY - activeAction.startY;
      const cellDeltaX = Math.round(deltaX / cellWithGap);
      const cellDeltaY = Math.round(deltaY / rowWithGap);

      let { x, y, w, h } = activeAction.originalWidget;

      if (activeAction.direction?.includes('e')) {
        w = Math.max(config.minSize.w, Math.min(config.maxSize.w, COLS - x, activeAction.originalWidget.w + cellDeltaX));
      }
      if (activeAction.direction?.includes('w')) {
        const newW = Math.max(config.minSize.w, Math.min(config.maxSize.w, activeAction.originalWidget.w - cellDeltaX));
        const newX = activeAction.originalWidget.x + (activeAction.originalWidget.w - newW);
        if (newX >= 0 && !isPositionOccupied(newX, y, newW, h, activeAction.widgetId)) {
          x = newX;
          w = newW;
        }
      }
      if (activeAction.direction?.includes('s')) {
        h = Math.max(config.minSize.h, Math.min(config.maxSize.h, activeAction.originalWidget.h + cellDeltaY));
      }
      if (activeAction.direction?.includes('n')) {
        const newH = Math.max(config.minSize.h, Math.min(config.maxSize.h, activeAction.originalWidget.h - cellDeltaY));
        const newY = activeAction.originalWidget.y + (activeAction.originalWidget.h - newH);
        if (newY >= 0 && !isPositionOccupied(x, newY, w, newH, activeAction.widgetId)) {
          y = newY;
          h = newH;
        }
      }

      // Only update if no collision
      if (!isPositionOccupied(x, y, w, h, activeAction.widgetId)) {
        setWidgets(prev => prev.map(widget =>
          widget.id === activeAction.widgetId ? { ...widget, x, y, w, h } : widget
        ));
      }
    }
  }, [activeAction, cellWidth, isPositionOccupied]);

  // End action
  const endAction = useCallback(() => {
    if (activeAction) {
      saveWidgets(widgets);
      setActiveAction(null);
    }
  }, [activeAction, widgets, saveWidgets]);

  // Mouse/touch handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeAction) {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeAction && e.touches.length > 0) {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    endAction();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    endAction();
  };

  // Expose addWidget globally
  useEffect(() => {
    (window as any).addWidgetToDashboard = addWidget;
    return () => {
      delete (window as any).addWidgetToDashboard;
    };
  }, [addWidget]);

  // Calculate widget position in pixels
  const getWidgetStyle = useCallback((widget: Widget): React.CSSProperties => {
    if (cellWidth === 0) {
      // Fallback when grid ref not ready
      return {
        position: 'absolute',
        left: `${PADDING + widget.x * 25}%`,
        top: `${PADDING + widget.y * (ROW_HEIGHT + GAP)}px`,
        width: `${widget.w * 25}%`,
        height: `${widget.h * ROW_HEIGHT + (widget.h - 1) * GAP}px`,
        boxSizing: 'border-box',
      };
    }
    
    return {
      position: 'absolute',
      left: `${PADDING + widget.x * (cellWidth + GAP)}px`,
      top: `${PADDING + widget.y * (ROW_HEIGHT + GAP)}px`,
      width: `${widget.w * cellWidth + (widget.w - 1) * GAP}px`,
      height: `${widget.h * ROW_HEIGHT + (widget.h - 1) * GAP}px`,
      boxSizing: 'border-box',
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
            {isEditMode ? "Drag to move • Resize from corners" : `${widgets.length} widgets • Click Edit`}
          </p>
        </div>
        <div className="flex gap-2">
          {isEditMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={forceReArrange}
              className="border-slate-600 text-slate-300"
              title="Re-arrange all widgets"
            >
              <RefreshCw className="h-4 w-4" />
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

      {/* Grid */}
      <div
        ref={gridRef}
        className={`relative rounded-xl border-2 transition-all widget-grid-bg ${
          isEditMode ? "border-fuchsia-400/50 bg-fuchsia-500/5 border-dashed" : "border-slate-700/30 bg-transparent"
        }`}
        style={{
          minHeight: `${gridHeight}px`,
        }}
        onMouseDown={handleGridMouseDown}
        onMouseUp={(e) => {
          handleGridMouseUp();
          handleMouseUp(e);
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={endAction}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {widgets.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-slate-400">
              <GripVertical className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Click Edit to add widgets</p>
              <p className="text-xs text-slate-500 mt-1">Open side panel → Widgets tab</p>
            </div>
          </div>
        ) : (
          widgets.map((widget) => (
            <div
              key={widget.id}
              style={getWidgetStyle(widget)}
              className={`transition-all duration-150 ${activeAction?.widgetId === widget.id ? 'z-50' : 'z-10'}`}
            >
              <WidgetCell
                widget={widget}
                isEditMode={isEditMode}
                isActive={activeAction?.widgetId === widget.id}
                onRemove={() => removeWidget(widget.id)}
                onDragStart={(clientX, clientY) => startDrag(widget, clientX, clientY)}
                onResizeStart={(dir, clientX, clientY) => startResize(widget, dir, clientX, clientY)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}