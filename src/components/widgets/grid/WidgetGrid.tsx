"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, RotateCcw, AlertTriangle } from "lucide-react";
import type { Widget } from "@/types/widgets";
import { WIDGET_CONFIGS } from "@/types/widgets";
import { usePreferences } from "@/state/preferences";
import { showSuccess, showError } from "@/utils/toast";
import { findNextPosition, packWidgets } from "../system/layout.ts";
import WidgetCell from "./WidgetCell.tsx";
import { trackWidgetInteraction } from "@/services/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const GRID_COLS = 4;
const CELL_HEIGHT = 100;
const GAP = 8;
const PADDING = 12;
const DEBOUNCE_MS = 100;

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const DEFAULT_WIDGETS: Widget[] = [
  { id: "default-1", type: "time", x: 0, y: 0, w: 1, h: 1 },
  { id: "default-2", type: "weather", x: 1, y: 0, w: 2, h: 2 },
  { id: "default-3", type: "tasks", x: 3, y: 0, w: 1, h: 2 },
  { id: "default-4", type: "upcoming", x: 0, y: 2, w: 2, h: 2 },
];

// Enhanced validation functions
function validateWidget(widget: Partial<Widget>): widget is Widget {
  return (
    typeof widget.id === 'string' &&
    typeof widget.type === 'string' &&
    typeof widget.x === 'number' &&
    typeof widget.y === 'number' &&
    typeof widget.w === 'number' &&
    typeof widget.h === 'number' &&
    widget.w > 0 && widget.h > 0
  );
}

function sanitizeWidgets(widgets: any[]): Widget[] {
  return widgets.filter(validateWidget).map(w => ({
    ...w,
    x: Math.max(0, Math.min(GRID_COLS - w.w, w.x)),
    y: Math.max(0, w.y),
    w: Math.max(1, Math.min(GRID_COLS, w.w)),
    h: Math.max(1, w.h)
  }));
}

function buildOccupied(widgets: Widget[], excludeId?: string) {
  const occ = new Set<string>();
  for (const w of widgets) {
    if (excludeId && w.id === excludeId) continue;
    for (let dy = 0; dy < w.h; dy++) {
      for (let dx = 0; dx < w.w; dx++) {
        occ.add(`${w.x + dx},${w.y + dy}`);
      }
    }
  }
  return occ;
}

function canPlaceAt(widgets: Widget[], x: number, y: number, w: number, h: number, excludeId?: string) {
  if (x < 0 || y < 0 || x + w > GRID_COLS) return false;
  const occ = buildOccupied(widgets, excludeId);
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (occ.has(`${x + dx},${y + dy}`)) return false;
    }
  }
  return true;
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default function WidgetGrid() {
  const { user } = useAuth();
  const { preferences, setPreferences } = usePreferences();
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const [activeResize, setActiveResize] = useState<{
    widgetId: string;
    dir: ResizeDir;
    startX: number;
    startY: number;
    original: Widget;
  } | null>(null);

  const [activeDrag, setActiveDrag] = useState<{
    widgetId: string;
    startX: number;
    startY: number;
    original: Widget;
  } | null>(null);

  const gridHeight = useMemo(() => {
    if (widgets.length === 0) return 400;
    const maxRow = Math.max(...widgets.map((w) => w.y + w.h));
    return Math.max(400, maxRow * CELL_HEIGHT + (maxRow - 1) * GAP + 24);
  }, [widgets]);

  const getCellWidth = useCallback(() => {
    const el = containerRef.current;
    if (!el) return 0;
    const contentWidth = el.clientWidth - PADDING * 2;
    return (contentWidth - GAP * (GRID_COLS - 1)) / GRID_COLS;
  }, []);

  // Sync widgets to Supabase helper function (defined first)
  const syncWidgetsToSupabase = useCallback(async (userId: string, widgets: Widget[]) => {
    try {
      // Delete all existing widgets for this user
      await supabase
        .from('user_widgets')
        .delete()
        .eq('user_id', userId);

      // Insert new widgets
      if (widgets.length > 0) {
        const widgetData = widgets.map(w => ({
          user_id: userId,
          widget_id: w.id,
          widget_type: w.type,
          position: { x: w.x, y: w.y },
          size: { w: w.w, h: w.h },
          config: {},
        }));

        await supabase
          .from('user_widgets')
          .insert(widgetData);
      }
    } catch (error) {
      console.error('Failed to sync widgets to Supabase:', error);
    }
  }, []);

  // Enhanced save with error handling and Supabase sync
  const saveWidgets = useCallback(
    debounce(async (next: Widget[]) => {
      try {
        const sanitized = sanitizeWidgets(next);
        const packed = packWidgets(sanitized);
        setWidgets(packed);
        setPreferences({ ...preferences, widgets: packed });
        
        // Save to Supabase for persistence
        if (user) {
          await syncWidgetsToSupabase(user.id, packed);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to save widgets:', err);
        setError('Failed to save layout');
        showError('Could not save widget layout');
      }
    loadWidgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, syncWidgetsToSupabase]);

  const resetLayout = useCallback(() => {
    try {
      saveWidgets(DEFAULT_WIDGETS);
      showSuccess("Layout reset");
      setError(null);
    } catch (err) {
      console.error('Failed to reset layout:', err);
      setError('Failed to reset layout');
      showError('Could not reset layout');
    }
  }, [saveWidgets]);

  const removeWidget = useCallback(
    (id: string) => {
      try {
        const widget = widgets.find(w => w.id === id);
        const filtered = widgets.filter((w) => w.id !== id);
        saveWidgets(filtered);
        showSuccess("Widget removed");
        
        // Track widget removal
        if (widget && user) {
          trackWidgetInteraction(widget.type, "remove", {}, user.id);
        }
      } catch (err) {
        console.error('Failed to remove widget:', err);
        showError('Could not remove widget');
      }
    },
    [saveWidgets, widgets, user]
  );

  const addWidget = useCallback(
    (type: string, size: { w: number; h: number }) => {
      try {
        if (widgets.some((w) => w.type === type)) {
          showSuccess(`${type} already exists`);
          return;
        }

        const cfg = WIDGET_CONFIGS[type];
        if (!cfg) {
          showError(`Unknown widget type: ${type}`);
          return;
        }

        const w = Math.max(1, Math.min(GRID_COLS, cfg.defaultSize.w || size.w));
        const h = Math.max(1, cfg.defaultSize.h || size.h);

        const pos = findNextPosition(widgets, w, h);
        if (!pos) {
          showError('No space available for widget');
          return;
        }

        const next: Widget[] = [
          ...widgets,
          {
            id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            x: pos.x,
            y: pos.y,
            w,
            h,
          },
        ];

        saveWidgets(next);
        showSuccess(`Added ${type}`);
        
        // Track widget addition
        if (user) {
          trackWidgetInteraction(type, "add", { w, h }, user.id);
        }
      } catch (err) {
        console.error('Failed to add widget:', err);
        showError('Could not add widget');
      }
    },
    [saveWidgets, widgets, user]
  );

  useEffect(() => {
    (window as any).addWidgetToDashboard = addWidget;
    return () => {
      delete (window as any).addWidgetToDashboard;
    };
  }, [addWidget]);

  const beginResize = useCallback(
    (widget: Widget, dir: ResizeDir, clientX: number, clientY: number) => {
      if (!isEditMode) return;
      setActiveResize({
        widgetId: widget.id,
        dir,
        startX: clientX,
        startY: clientY,
        original: { ...widget },
      });
    },
    [isEditMode]
  );

  const beginDrag = useCallback(
    (widget: Widget, clientX: number, clientY: number) => {
      if (!isEditMode) return;
      setActiveDrag({
        widgetId: widget.id,
        startX: clientX,
        startY: clientY,
        original: { ...widget },
      });
    },
    [isEditMode]
  );

  // Enhanced resize with better error handling
  useEffect(() => {
    if (!activeResize) return;

    const onMove = (e: PointerEvent) => {
      try {
        const cellW = getCellWidth();
        if (!cellW) return;

        const dx = e.clientX - activeResize.startX;
        const dy = e.clientY - activeResize.startY;

        const dCols = Math.round(dx / (cellW + GAP));
        const dRows = Math.round(dy / (CELL_HEIGHT + GAP));

        const cfg = WIDGET_CONFIGS[activeResize.original.type];
        const minW = cfg?.minSize.w ?? 1;
        const minH = cfg?.minSize.h ?? 1;
        const maxW = cfg?.maxSize.w ?? GRID_COLS;
        const maxH = cfg?.maxSize.h ?? 200;

        let nextW = activeResize.original.w;
        let nextH = activeResize.original.h;
        let nextX = activeResize.original.x;
        let nextY = activeResize.original.y;

        // Handle width changes
        if (activeResize.dir === "e" || activeResize.dir === "se" || activeResize.dir === "ne") {
          nextW = activeResize.original.w + dCols;
        } else if (activeResize.dir === "w" || activeResize.dir === "sw" || activeResize.dir === "nw") {
          nextW = activeResize.original.w - dCols;
          nextX = activeResize.original.x + dCols;
        }

        // Handle height changes
        if (activeResize.dir === "s" || activeResize.dir === "se" || activeResize.dir === "sw") {
          nextH = activeResize.original.h + dRows;
        } else if (activeResize.dir === "n" || activeResize.dir === "ne" || activeResize.dir === "nw") {
          nextH = activeResize.original.h - dRows;
          nextY = activeResize.original.y + dRows;
        }

        nextW = Math.max(minW, Math.min(maxW, nextW));
        nextH = Math.max(minH, Math.min(maxH, nextH));
        nextX = Math.max(0, Math.min(GRID_COLS - nextW, nextX));
        nextY = Math.max(0, nextY);

        if (nextW === activeResize.original.w && nextH === activeResize.original.h) return;

        const ok = canPlaceAt(
          widgets,
          nextX,
          nextY,
          nextW,
          nextH,
          activeResize.widgetId
        );
        if (!ok) return;

        setWidgets((prev) =>
          prev.map((w) =>
            w.id === activeResize.widgetId ? { ...w, x: nextX, y: nextY, w: nextW, h: nextH } : w
          )
        );
      } catch (err) {
        console.error('Resize error:', err);
      }
    };

    const onUp = () => {
      try {
        saveWidgets(widgets);
        
        // Track widget resize
        if (user && activeResize) {
          const widget = widgets.find(w => w.id === activeResize.widgetId);
          if (widget) {
            trackWidgetInteraction(widget.type, "resize", {
              direction: activeResize.dir,
              newSize: { w: widget.w, h: widget.h }
            }, user.id);
          }
        }
        
        setActiveResize(null);
      } catch (err) {
        console.error('Resize save error:', err);
        setActiveResize(null);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp as any);
    };
  }, [activeResize, getCellWidth, saveWidgets, widgets]);

  // Enhanced drag with better error handling
  useEffect(() => {
    if (!activeDrag) return;

    const onMove = (e: PointerEvent) => {
      try {
        const cellW = getCellWidth();
        if (!cellW) return;

        const dx = e.clientX - activeDrag.startX;
        const dy = e.clientY - activeDrag.startY;

        const dCols = Math.round(dx / (cellW + GAP));
        const dRows = Math.round(dy / (CELL_HEIGHT + GAP));

        let nextX = activeDrag.original.x + dCols;
        let nextY = activeDrag.original.y + dRows;

        nextX = Math.max(0, Math.min(GRID_COLS - activeDrag.original.w, nextX));
        nextY = Math.max(0, nextY);

        const ok = canPlaceAt(
          widgets,
          nextX,
          nextY,
          activeDrag.original.w,
          activeDrag.original.h,
          activeDrag.widgetId
        );

        if (!ok) return;

        setWidgets((prev) =>
          prev.map((w) =>
            w.id === activeDrag.widgetId ? { ...w, x: nextX, y: nextY } : w
          )
        );
      } catch (err) {
        console.error('Drag error:', err);
      }
    };

    const onUp = () => {
      try {
        saveWidgets(widgets);
        
        // Track widget drag
        if (user && activeDrag) {
          const widget = widgets.find(w => w.id === activeDrag.widgetId);
          if (widget) {
            trackWidgetInteraction(widget.type, "move", {
              newPosition: { x: widget.x, y: widget.y }
            }, user.id);
          }
        }
        
        setActiveDrag(null);
      } catch (err) {
        console.error('Drag save error:', err);
        setActiveDrag(null);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp as any);
    };
  }, [activeDrag, getCellWidth, saveWidgets, widgets]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-slate-400">
            <GripVertical className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
            <p className="text-sm">Loading widgets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300 font-medium">
            {isEditMode ? "Edit Mode" : "Widgets"}
          </p>
          <p className="text-xs text-slate-500">
            {isEditMode ? (
              activeResize ? `Resizing widget...` :
              activeDrag ? `Moving widget...` :
              "Drag to move, resize from handles"
            ) : `${widgets.length} widgets`}
          </p>
        </div>

        <div className="flex gap-2">
          {isEditMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={resetLayout}
              className="border-slate-600 text-slate-300"
              title="Reset layout"
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
            {isEditMode ? (
              "Done"
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-500/30">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Grid */}
      <div
        ref={containerRef}
        className={`relative rounded-xl border-2 p-3 transition-colors ${
          isEditMode
            ? activeResize || activeDrag
              ? "border-fuchsia-400 bg-fuchsia-500/10 border-solid"
              : "border-fuchsia-400/50 bg-fuchsia-500/5 border-dashed"
            : "border-slate-700/30 bg-transparent"
        }`}
        style={{ minHeight: gridHeight }}
      >
        {widgets.length === 0 ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center text-slate-400">
              <GripVertical className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No widgets</p>
              <p className="text-xs text-slate-500 mt-1">Click Edit to add</p>
            </div>
          </div>
        ) : (
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
              gridAutoRows: `${CELL_HEIGHT}px`,
              gap: `${GAP}px`,
              alignContent: "start",
            }}
          >
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="min-h-0 min-w-0"
                style={{
                  gridColumn: `${widget.x + 1} / span ${widget.w}`,
                  gridRow: `${widget.y + 1} / span ${widget.h}`,
                }}
              >
                <WidgetCell
                  widget={widget}
                  isEditMode={isEditMode}
                  onRemove={() => removeWidget(widget.id)}
                  onResizeStart={(dir, x, y) => beginResize(widget, dir, x, y)}
                  onDragStart={(widget, x, y) => beginDrag(widget, x, y)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}