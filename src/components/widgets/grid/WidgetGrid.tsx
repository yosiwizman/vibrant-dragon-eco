"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, RotateCcw } from "lucide-react";
import type { Widget } from "@/types/widgets";
import { WIDGET_CONFIGS } from "@/types/widgets";
import { usePreferences } from "@/state/preferences";
import { showSuccess } from "@/utils/toast";
import { findNextPosition, packWidgets } from "../system/layout";
import WidgetCell from "./WidgetCell";

const GRID_COLS = 4;
const CELL_HEIGHT = 100;
const GAP = 8;

const DEFAULT_WIDGETS: Widget[] = [
  { id: "default-1", type: "time", x: 0, y: 0, w: 1, h: 1 },
  { id: "default-2", type: "weather", x: 1, y: 0, w: 2, h: 2 },
  { id: "default-3", type: "tasks", x: 3, y: 0, w: 1, h: 2 },
  { id: "default-4", type: "upcoming", x: 0, y: 2, w: 2, h: 2 },
];

export default function WidgetGrid() {
  const { preferences, setPreferences } = usePreferences();
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([]);

  const gridHeight = useMemo(() => {
    if (widgets.length === 0) return 400;
    const maxRow = Math.max(...widgets.map((w) => w.y + w.h));
    // Let grid expand naturally; this is just a minimum so the box doesn't collapse.
    return Math.max(400, maxRow * CELL_HEIGHT + (maxRow - 1) * GAP + 24);
  }, [widgets]);

  const saveWidgets = useCallback(
    (next: Widget[]) => {
      const packed = packWidgets(next);
      setWidgets(packed);
      setPreferences({ ...preferences, widgets: packed });
    },
    [preferences, setPreferences]
  );

  useEffect(() => {
    const saved = preferences.widgets;
    const initial = packWidgets(
      Array.isArray(saved) && saved.length > 0 ? (saved as Widget[]) : DEFAULT_WIDGETS
    );
    setWidgets(initial);

    if (JSON.stringify(saved) !== JSON.stringify(initial)) {
      setPreferences({ ...preferences, widgets: initial });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetLayout = useCallback(() => {
    saveWidgets(DEFAULT_WIDGETS);
    showSuccess("Layout reset");
  }, [saveWidgets]);

  const removeWidget = useCallback(
    (id: string) => {
      saveWidgets(widgets.filter((w) => w.id !== id));
      showSuccess("Widget removed");
    },
    [saveWidgets, widgets]
  );

  const addWidget = useCallback(
    (type: string, size: { w: number; h: number }) => {
      if (widgets.some((w) => w.type === type)) {
        showSuccess(`${type} already exists`);
        return;
      }

      const cfg = WIDGET_CONFIGS[type];
      const w = cfg ? cfg.defaultSize.w : size.w;
      const h = cfg ? cfg.defaultSize.h : size.h;

      const pos = findNextPosition(widgets, w, h);

      const next: Widget[] = [
        ...widgets,
        {
          id: `${type}-${Date.now()}`,
          type,
          x: pos.x,
          y: pos.y,
          w,
          h,
        },
      ];

      saveWidgets(next);
      showSuccess(`Added ${type}`);
    },
    [saveWidgets, widgets]
  );

  useEffect(() => {
    (window as any).addWidgetToDashboard = addWidget;
    return () => {
      delete (window as any).addWidgetToDashboard;
    };
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
            {isEditMode ? "Done" : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div
        className={`relative rounded-xl border-2 p-3 transition-colors ${
          isEditMode
            ? "border-fuchsia-400/50 bg-fuchsia-500/5 border-dashed"
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
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}