"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical } from "lucide-react";
import { Widget } from "@/types/widgets";
import { WIDGET_CONFIGS } from "@/types/widgets";
import { usePreferences } from "@/state/preferences";
import { showSuccess } from "@/utils/toast";
import WidgetCell from "./WidgetCell";

const COLS = 4;
const ROWS = 16;

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

  // Load widgets from preferences
  useEffect(() => {
    const saved = preferences.widgets;
    if (saved && Array.isArray(saved)) {
      setWidgets(saved);
    } else {
      setWidgets([
        { id: '1', type: 'time', x: 0, y: 0, w: 1, h: 1 },
        { id: '2', type: 'weather', x: 1, y: 0, w: 2, h: 2 },
        { id: '3', type: 'tasks', x: 3, y: 0, w: 1, h: 2 },
        { id: '4', type: 'upcoming', x: 0, y: 2, w: 4, h: 2 },
      ]);
    }
  }, []);

  // Save widgets
  const saveWidgets = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    setPreferences({ ...preferences, widgets: newWidgets });
  };

  // Long press to enter edit mode
  const handleGridMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode && (e.target as HTMLElement).classList.contains('widget-grid-bg')) {
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
  const addWidget = (type: string, size: { w: number; h: number }) => {
    if (widgets.some(w => w.type === type)) {
      showSuccess(`${type} already added`);
      return;
    }

    const maxY = widgets.length > 0 ? Math.max(...widgets.map(w => w.y + w.h)) : 0;
    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      x: 0,
      y: maxY,
      w: Math.min(size.w, COLS),
      h: size.h,
    };

    saveWidgets([...widgets, newWidget]);
    showSuccess(`Added ${type}`);
  };

  // Remove widget
  const removeWidget = (id: string) => {
    saveWidgets(widgets.filter(w => w.id !== id));
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

    const gridRect = gridRef.current.getBoundingClientRect();
    const cellW = (gridRect.width - 24) / COLS; // Account for padding
    const cellH = 100;

    if (activeAction.type === 'drag') {
      const deltaX = clientX - activeAction.startX;
      const deltaY = clientY - activeAction.startY;
      const cellDeltaX = Math.round(deltaX / cellW);
      const cellDeltaY = Math.round(deltaY / cellH);

      const newX = Math.max(0, Math.min(COLS - activeAction.originalWidget.w, activeAction.originalWidget.x + cellDeltaX));
      const newY = Math.max(0, Math.min(ROWS - activeAction.originalWidget.h, activeAction.originalWidget.y + cellDeltaY));

      setWidgets(widgets.map(w =>
        w.id === activeAction.widgetId ? { ...w, x: newX, y: newY } : w
      ));
    } else if (activeAction.type === 'resize') {
      const config = WIDGET_CONFIGS[activeAction.originalWidget.type];
      const deltaX = clientX - activeAction.startX;
      const deltaY = clientY - activeAction.startY;
      const cellDeltaX = Math.round(deltaX / cellW);
      const cellDeltaY = Math.round(deltaY / cellH);

      let { x, y, w, h } = activeAction.originalWidget;

      // Apply resize based on direction
      if (activeAction.direction?.includes('e')) {
        w = Math.max(config.minSize.w, Math.min(config.maxSize.w, COLS - x, activeAction.originalWidget.w + cellDeltaX));
      }
      if (activeAction.direction?.includes('w')) {
        const newW = Math.max(config.minSize.w, Math.min(config.maxSize.w, activeAction.originalWidget.w - cellDeltaX));
        const newX = activeAction.originalWidget.x + (activeAction.originalWidget.w - newW);
        if (newX >= 0) {
          x = newX;
          w = newW;
        }
      }
      if (activeAction.direction?.includes('s')) {
        h = Math.max(config.minSize.h, Math.min(config.maxSize.h, ROWS - y, activeAction.originalWidget.h + cellDeltaY));
      }
      if (activeAction.direction?.includes('n')) {
        const newH = Math.max(config.minSize.h, Math.min(config.maxSize.h, activeAction.originalWidget.h - cellDeltaY));
        const newY = activeAction.originalWidget.y + (activeAction.originalWidget.h - newH);
        if (newY >= 0) {
          y = newY;
          h = newH;
        }
      }

      setWidgets(widgets.map(widget =>
        widget.id === activeAction.widgetId ? { ...widget, x, y, w, h } : widget
      ));
    }
  };

  // End action
  const endAction = () => {
    if (activeAction) {
      saveWidgets(widgets);
      setActiveAction(null);
    }
  };

  // Mouse handlers
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Expose addWidget globally
  useEffect(() => {
    (window as any).addWidgetToDashboard = addWidget;
    return () => delete (window as any).addWidgetToDashboard;
  }, [widgets]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300 font-medium">
            {isEditMode ? "Edit Mode" : "Widgets"}
          </p>
          <p className="text-xs text-slate-500">
            {isEditMode ? "Drag to move • Resize from corners" : `${widgets.length} widgets • Hold to edit`}
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

      {/* Grid */}
      <div
        ref={gridRef}
        className={`relative rounded-xl border-2 transition-all widget-grid-bg ${
          isEditMode ? "border-fuchsia-400/50 bg-fuchsia-500/5 border-dashed" : "border-slate-700/30 bg-transparent"
        }`}
        style={{ 
          minHeight: `${ROWS * 100 + 24}px`,
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 100px)`,
          gap: '8px',
          padding: '12px',
        }}
        onMouseDown={handleGridMouseDown}
        onMouseUp={handleGridMouseUp}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseLeave={endAction}
        onTouchEnd={endAction}
      >
        {widgets.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-slate-400">
              <GripVertical className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Hold grid to enter edit mode</p>
              <p className="text-xs text-slate-500 mt-1">Then click Edit to add widgets</p>
            </div>
          </div>
        ) : (
          widgets.map((widget) => (
            <WidgetCell
              key={widget.id}
              widget={widget}
              isEditMode={isEditMode}
              isActive={activeAction?.widgetId === widget.id}
              onRemove={() => removeWidget(widget.id)}
              onDragStart={(clientX, clientY) => startDrag(widget, clientX, clientY)}
              onResizeStart={(dir, clientX, clientY) => startResize(widget, dir, clientX, clientY)}
            />
          ))
        )}
      </div>
    </div>
  );
}