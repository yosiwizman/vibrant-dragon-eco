"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical } from "lucide-react";
import { Widget } from "@/types/widgets";
import { WIDGET_CONFIGS } from "@/types/widgets";
import { usePreferences } from "@/state/preferences";
import { showSuccess } from "@/utils/toast";
import WidgetCell from "./WidgetCell";

const COLS = 4;
const ROWS = 16;
const ROW_HEIGHT = 100;
const GAP = 8;
const PADDING = 12;

// Auto-arrange widgets to fill gaps and prevent overlaps
const arrangeWidgets = (widgetsToArrange: Widget[]): Widget[] => {
  if (widgetsToArrange.length === 0) return [];
  
  const sorted = [...widgetsToArrange].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  const arranged: Widget[] = [];
  const occupied = new Set<string>();

  const markOccupied = (x: number, y: number, w: number, h: number) => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        occupied.add(`${x + dx},${y + dy}`);
      }
    }
  };

  const canPlace = (x: number, y: number, w: number, h: number): boolean => {
    if (x < 0 || y < 0 || x + w > COLS) return false;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (occupied.has(`${x + dx},${y + dy}`)) {
          return false;
        }
      }
    }
    return true;
  };

  for (const widget of sorted) {
    let placed = false;
    
    // First try the widget's current position
    if (canPlace(widget.x, widget.y, widget.w, widget.h)) {
      markOccupied(widget.x, widget.y, widget.w, widget.h);
      arranged.push({ ...widget });
      placed = true;
      continue;
    }
    
    // If current position is occupied, find next available position
    for (let y = 0; y < ROWS * 2; y++) { // Allow extending beyond initial rows
      for (let x = 0; x <= COLS - widget.w; x++) {
        if (canPlace(x, y, widget.w, widget.h)) {
          markOccupied(x, y, widget.w, widget.h);
          arranged.push({ ...widget, x, y });
          placed = true;
          break;
        }
      }
      if (placed) break;
    }

    // Fallback: add to bottom
    if (!placed) {
      const maxY = arranged.length > 0 ? Math.max(...arranged.map(w => w.y + w.h)) : 0;
      markOccupied(0, maxY, widget.w, widget.h);
      arranged.push({ ...widget, x: 0, y: maxY });
    }
  }

  return arranged;
};

export default function WidgetGrid() {
  const { preferences, setPreferences } = usePreferences();
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([]);
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

  // Check if position is occupied
  const isPositionOccupied = useCallback((x: number, y: number, w: number, h: number, excludeId?: string): boolean => {
    for (const widget of widgets) {
      if (widget.id === excludeId) continue;
      
      const xOverlap = x < widget.x + widget.w && x + w > widget.x;
      const yOverlap = y < widget.y + widget.h && y + h > widget.y;
      
      if (xOverlap && yOverlap) {
        return true;
      }
    }
    return false;
  }, [widgets]);

  // Find next available position
  const findAvailablePosition = useCallback((w: number, h: number): { x: number; y: number } => {
    for (let y = 0; y <= ROWS * 2; y++) {
      for (let x = 0; x <= COLS - w; x++) {
        if (!isPositionOccupied(x, y, w, h)) {
          return { x, y };
        }
      }
    }
    
    const maxY = widgets.length > 0 ? Math.max(...widgets.map(w => w.y + w.h)) : 0;
    return { x: 0, y: maxY };
  }, [widgets, isPositionOccupied]);

  // Load widgets from preferences and auto-arrange
  useEffect(() => {
    const saved = preferences.widgets;
    let initialWidgets: Widget[];
    
    if (saved && Array.isArray(saved) && saved.length > 0) {
      // Always auto-arrange saved widgets to fix any overlaps
      initialWidgets = arrangeWidgets(saved);
    } else {
      // Default widgets - already arranged properly
      initialWidgets = [
        { id: '1', type: 'time', x: 0, y: 0, w: 1, h: 1 },
        { id: '2', type: 'weather', x: 1, y: 0, w: 2, h: 2 },
        { id: '3', type: 'tasks', x: 3, y: 0, w: 1, h: 2 },
        { id: '4', type: 'upcoming', x: 0, y: 2, w: 2, h: 2 },
        { id: '5', type: 'calendar', x: 2, y: 2, w: 2, h: 2 },
      ];
    }
    
    setWidgets(initialWidgets);
    
    // Save arranged widgets if they changed
    const savedStr = JSON.stringify(saved);
    const arrangedStr = JSON.stringify(initialWidgets);
    if (savedStr !== arrangedStr) {
      setPreferences({ ...preferences, widgets: initialWidgets });
    }
  }, []);

  // Calculate grid height dynamically based on actual widget positions
  const getGridHeight = () => {
    if (widgets.length === 0) return 400;
    
    const maxY = Math.max(...widgets.map(w => w.y + w.h));
    
    // Calculate: (number of rows * row height) + (gaps between rows) + padding
    const totalHeight = (maxY * ROW_HEIGHT) + ((maxY > 0 ? maxY - 1 : 0) * GAP) + (PADDING * 2);
    
    return Math.max(400, totalHeight);
  };

  // Calculate cell dimensions
  const getCellDimensions = () => {
    if (!gridRef.current) return { cellWidth: 0, cellHeight: ROW_HEIGHT };
    const gridWidth = gridRef.current.clientWidth - (PADDING * 2);
    const cellWidth = (gridWidth - (GAP * (COLS - 1))) / COLS;
    return { cellWidth, cellHeight: ROW_HEIGHT };
  };

  // Save widgets
  const saveWidgets = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    setPreferences({ ...preferences, widgets: newWidgets });
  };

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

    const position = findAvailablePosition(size.w, size.h);
    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      ...position,
      w: Math.min(size.w, COLS),
      h: size.h,
    };

    const newWidgets = arrangeWidgets([...widgets, newWidget]);
    saveWidgets(newWidgets);
    showSuccess(`Added ${type}`);
  }, [widgets, findAvailablePosition]);

  // Remove widget
  const removeWidget = (id: string) => {
    const newWidgets = widgets.filter(w => w.id !== id);
    const arranged = arrangeWidgets(newWidgets);
    saveWidgets(arranged);
    showSuccess("Removed");
  };

  // Start drag
  const startDrag = (widget: Widget, clientX: number, clientY: number) => {
    if (!isEditMode || !gridRef.current) return;
    
    setActiveAction({
      type: 'drag',
      widgetId: widget.id,
      startX: clientX,
      startY: clientY,
      originalWidget: { ...widget },
    });
  };

  // Start resize
  const startResize = (widget: Widget, direction: string, clientX: number, clientY: number) => {
    if (!isEditMode) return;
    
    setActiveAction({
      type: 'resize',
      widgetId: widget.id,
      direction,
      startX: clientX,
      startY: clientY,
      originalWidget: { ...widget },
    });
  };

  // Handle mouse/touch move
  const handleMove = (clientX: number, clientY: number) => {
    if (!activeAction || !gridRef.current) return;

    const { cellWidth, cellHeight } = getCellDimensions();
    if (cellWidth === 0) return;

    if (activeAction.type === 'drag') {
      const deltaX = clientX - activeAction.startX;
      const deltaY = clientY - activeAction.startY;
      const cellDeltaX = Math.round(deltaX / (cellWidth + GAP));
      const cellDeltaY = Math.round(deltaY / (cellHeight + GAP));

      let newX = activeAction.originalWidget.x + cellDeltaX;
      let newY = activeAction.originalWidget.y + cellDeltaY;

      // Constrain to grid bounds
      newX = Math.max(0, Math.min(COLS - activeAction.originalWidget.w, newX));
      newY = Math.max(0, newY);

      // Check for collisions - if occupied, don't move
      if (!isPositionOccupied(newX, newY, activeAction.originalWidget.w, activeAction.originalWidget.h, activeAction.widgetId)) {
        setWidgets(widgets.map(w =>
          w.id === activeAction.widgetId ? { ...w, x: newX, y: newY } : w
        ));
      }
    } else if (activeAction.type === 'resize') {
      const config = WIDGET_CONFIGS[activeAction.originalWidget.type];
      if (!config) return;
      
      const deltaX = clientX - activeAction.startX;
      const deltaY = clientY - activeAction.startY;
      const cellDeltaX = Math.round(deltaX / (cellWidth + GAP));
      const cellDeltaY = Math.round(deltaY / (cellHeight + GAP));

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
        setWidgets(widgets.map(widget =>
          widget.id === activeAction.widgetId ? { ...widget, x, y, w, h } : widget
        ));
      }
    }
  };

  // End action - auto-arrange on release
  const endAction = () => {
    if (activeAction) {
      const arranged = arrangeWidgets(widgets);
      saveWidgets(arranged);
      setActiveAction(null);
    }
  };

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
  const getWidgetStyle = (widget: Widget): React.CSSProperties => {
    const { cellWidth, cellHeight } = getCellDimensions();
    if (cellWidth === 0) {
      // Fallback when grid ref not ready - use percentage-based positioning
      const percentWidth = 100 / COLS;
      return {
        position: 'absolute',
        left: `calc(${widget.x * percentWidth}% + ${widget.x > 0 ? GAP * widget.x : 0}px)`,
        top: `${widget.y * (cellHeight + GAP)}px`,
        width: `calc(${widget.w * percentWidth}% - ${GAP}px)`,
        height: `${widget.h * cellHeight + (widget.h - 1) * GAP}px`,
      };
    }
    
    return {
      position: 'absolute',
      left: `${PADDING + widget.x * (cellWidth + GAP)}px`,
      top: `${PADDING + widget.y * (cellHeight + GAP)}px`,
      width: `${widget.w * cellWidth + (widget.w - 1) * GAP}px`,
      height: `${widget.h * cellHeight + (widget.h - 1) * GAP}px`,
    };
  };

  // Force re-render when grid size changes
  const [, forceUpdate] = useState({});
  useEffect(() => {
    const handleResize = () => forceUpdate({});
    window.addEventListener('resize', handleResize);
    // Initial calculation after mount
    const timer = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300 font-medium">
            {isEditMode ? "Edit Mode" : "Widgets"}
          </p>
          <p className="text-xs text-slate-500">
            {isEditMode ? "Drag to move • Resize from corners/edges" : `${widgets.length} widgets • Click Edit`}
          </p>
        </div>
        <Button
          size="sm"
          variant={isEditMode ? "default" : "outline"}
          onClick={() => setIsEditMode(!isEditMode)}
          className={isEditMode ? "bg-fuchsia-600 hover:bg-fuchsia-500" : "border-slate-600 text-slate-300"}
        >
          {isEditMode ? "Done" : <><Plus className="h-4 w-4 mr-1" />Edit</>}
        </Button>
      </div>

      {/* Grid - Using absolute positioning for widgets */}
      <div
        ref={gridRef}
        className={`relative rounded-xl border-2 transition-all widget-grid-bg ${
          isEditMode ? "border-fuchsia-400/50 bg-fuchsia-500/5 border-dashed" : "border-slate-700/30 bg-transparent"
        }`}
        style={{
          minHeight: `${getGridHeight()}px`,
          padding: `${PADDING}px`,
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
              className={`transition-all duration-200 ${activeAction?.widgetId === widget.id ? 'z-50' : 'z-10'}`}
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