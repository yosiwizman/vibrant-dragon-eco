"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";
import { Widget } from "@/types/widgets";
import WidgetContent from "./WidgetContent";

interface WidgetCellProps {
  widget: Widget;
  isEditMode: boolean;
  isDragging: boolean;
  onRemove: () => void;
  onDragStart: (clientX: number, clientY: number) => void;
}

export default function WidgetCell({
  widget,
  isEditMode,
  isDragging,
  onRemove,
  onDragStart,
}: WidgetCellProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      onDragStart(e.clientX, e.clientY);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditMode && e.touches.length > 0) {
      e.preventDefault();
      onDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  return (
    <div
      className={`
        relative h-full w-full rounded-lg overflow-hidden
        ${isEditMode ? 'cursor-move' : ''}
        ${isDragging ? 'opacity-90 scale-105 shadow-2xl' : ''}
        ${isEditMode && !isDragging ? 'ring-2 ring-fuchsia-500/50' : ''}
      `}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Widget Content */}
      <div className={`h-full w-full ${isEditMode ? 'pointer-events-none' : ''}`}>
        <WidgetContent type={widget.type} />
      </div>

      {/* Edit Mode Overlay */}
      {isEditMode && (
        <>
          {/* Drag indicator */}
          <div className="absolute top-2 left-2 bg-slate-900/80 rounded p-1 backdrop-blur-sm">
            <GripVertical className="h-4 w-4 text-slate-300" />
          </div>

          {/* Remove button */}
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-6 w-6 rounded-full shadow-lg"
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