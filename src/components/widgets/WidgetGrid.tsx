"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X, GripVertical } from "lucide-react";
import { Widget } from "@/types/widgets";
import { usePreferences } from "@/state/preferences";
import { showSuccess } from "@/utils/toast";
import WidgetCell from "./WidgetCell";

const COLS = 4;
const ROWS = 16;

interface WidgetGridProps {
  onOpenWidgetPicker?: () => void;
}

export default function WidgetGrid({ onOpenWidgetPicker }: WidgetGridProps) {
  const { preferences, setPreferences } = usePreferences();
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Load widgets from preferences
  useEffect(() => {
    const saved = preferences.widgets;
    if (saved && Array.isArray(saved)) {
      setWidgets(saved);
    } else {
      // Default widgets
      setWidgets([
        { id: '1', type: 'time', x: 0, y: 0, w: 1, h: 1 },
        { id: '2', type: 'weather', x: 1, y: 0, w: 2, h: 2 },
        { id: '3', type: 'tasks', x: 3, y: 0, w: 1, h: 2 },
        { id: '4', type: 'upcoming', x: 0, y: 2, w: 4, h: 2 },
      ]);
    }
  }, []);

  // Save widgets to preferences
  const saveWidgets = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    setPreferences({
      ...preferences,
      widgets: newWidgets,
    });
  };

  // Long press to enter edit mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.widget-grid-bg')) {
      longPressTimer.current = setTimeout(() => {
        setIsEditMode(true);
      }, 800);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.widget-grid-bg')) {
      longPressTimer.current = setTimeout(() => {
        setIsEditMode(true);
      }, 800);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // Add widget
  const addWidget = (type: string, size: { w: number; h: number }) => {
    // Check if widget type already exists
    const exists = widgets.some(w => w.type === type);
    if (exists) {
      showSuccess(`${type} widget already exists`);
      return;
    }

    // Find next available position
    const maxY = widgets.length > 0 ? Math.max(...widgets.map(w => w.y + w.h)) : 0;
    
    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      x: 0,
      y: maxY,
      w: size.w,
      h: size.h,
    };

    saveWidgets([...widgets, newWidget]);
    showSuccess(`Added ${type} widget`);
  };

  // Remove widget
  const removeWidget = (id: string) => {
    saveWidgets(widgets.filter(w => w.id !== id));
    showSuccess("Widget removed");
  };

  // Start dragging widget
  const startDrag = (widget: Widget, e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditMode) return;
    
    setDraggedWidget(widget);
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  };

  // Handle drag move
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedWidget || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const cellWidth = gridRect.width / COLS;
    const cellHeight = 100; // rowHeight

    const newX = Math.floor((clientX - gridRect.left - dragOffset.x) / cellWidth);
    const newY = Math.floor((clientY - gridRect.top - dragOffset.y) / cellHeight);

    // Constrain to grid bounds
    const constrainedX = Math.max(0, Math.min(newX, COLS - draggedWidget.w));
    const constrainedY = Math.max(0, Math.min(newY, ROWS - draggedWidget.h));

    // Update widget position
    const updatedWidgets = widgets.map(w =>
      w.id === draggedWidget.id
        ? { ...w, x: constrainedX, y: constrainedY }
        : w
    );

    setWidgets(updatedWidgets);
  };

  // End drag
  const endDrag = () => {
    if (draggedWidget) {
      saveWidgets(widgets);
      setDraggedWidget(null);
    }
  };

  // Expose addWidget function globally for ThumbsPanel
  useEffect(() => {
    (window as any).addWidgetToDashboard = addWidget;
    return () => {
      delete (window as any).addWidgetToDashboard;
    };
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
            {isEditMode ? "Drag to move • Click X to remove" : `${widgets.length} widgets • Hold to edit`}
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
        className={`relative rounded-xl border-2 transition-all ${
          isEditMode
            ? "border-fuchsia-400/50 bg-fuchsia-500/5 border-dashed"
            : "border-slate-700/30 bg-transparent"
        }`}
        style={{ 
          minHeight: `${ROWS * 100 + 24}px`,
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 100px)`,
          gap: '8px',
          padding: '12px',
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseMove={handleDragMove}
        onTouchMove={handleDragMove}
        onMouseLeave={endDrag}
        onTouchEnd={endDrag}
      >
        {widgets.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center widget-grid-bg">
            <div className="text-center text-slate-400">
              <GripVertical className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Hold to enter edit mode</p>
              <p className="text-xs text-slate-500 mt-1">Then click + to add widgets</p>
            </div>
          </div>
        ) : (
          widgets.map((widget) => (
            <WidgetCell
              key={widget.id}
              widget={widget}
              isEditMode={isEditMode}
              isDragging={draggedWidget?.id === widget.id}
              onRemove={() => removeWidget(widget.id)}
              onDragStart={(e) => startDrag(widget, e)}
            />
          ))
        )}
      </div>
    </div>
  );
}