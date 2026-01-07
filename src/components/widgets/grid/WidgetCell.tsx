"use client";

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Move } from "lucide-react";
import type { Widget } from "@/types/widgets";
import WidgetContent from "../content/WidgetContent.tsx";
import ResizeHandles from "./ResizeHandles";
import { WidgetErrorBoundary } from "@/components/ErrorBoundary";

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface WidgetCellProps {
  widget: Widget;
  isEditMode: boolean;
  onRemove: () => void;
  onResizeStart: (dir: ResizeDir, clientX: number, clientY: number) => void;
  onDragStart: (widget: Widget, clientX: number, clientY: number) => void;
}

export default function WidgetCell({ widget, isEditMode, onRemove, onResizeStart, onDragStart }: WidgetCellProps) {
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isEditMode) return;
    
    // Only start drag if not clicking on resize handles or remove button
    if ((e.target as HTMLElement).closest('[data-resize-handle]')) return;
    if ((e.target as HTMLElement).closest('button')) return;
    
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    onDragStart(widget, e.clientX, e.clientY);
  }, [isEditMode, widget, onDragStart]);

  return (
    <div
      className={`relative h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xl transition-all cursor-move ${
        isEditMode ? "ring-2 ring-fuchsia-400/30 hover:ring-fuchsia-400/50 animate-pulse" : ""
      }`}
      onPointerDown={handlePointerDown}
      style={{
        animation: isEditMode ? 'shake 0.5s ease-in-out infinite' : 'none'
      }}
    >
      {/* Clip any child overflow so widgets never visually overlap */}
      <div className="h-full w-full min-h-0 min-w-0 overflow-hidden">
        <WidgetErrorBoundary widgetType={widget.type}>
          <WidgetContent type={widget.type} />
        </WidgetErrorBoundary>
      </div>

      {isEditMode && (
        <>
          {/* Drag indicator */}
          <div className="absolute top-2 left-2 bg-fuchsia-500/80 text-white p-1.5 rounded-full z-40 pointer-events-none">
            <Move className="h-3 w-3" />
          </div>

          <ResizeHandles onResizeStart={(dir, x, y) => onResizeStart(dir, x, y)} />

          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg z-50"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}