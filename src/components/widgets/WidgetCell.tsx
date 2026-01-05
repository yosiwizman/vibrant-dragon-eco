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
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

export default function WidgetCell({ 
  widget, 
  isEditMode, 
  isDragging,
  onRemove, 
  onDragStart 
}: WidgetCellProps) {
  return (
    <div
      className={`relative ${isEditMode ? 'animate-wiggle' : ''} ${isDragging ? 'opacity-50' : ''}`}
      style={{
        gridColumn: `${widget.x + 1} / span ${widget.w}`,
        gridRow: `${widget.y + 1} / span ${widget.h}`,
        cursor: isEditMode ? 'move' : 'default',
      }}
      onMouseDown={isEditMode ? onDragStart : undefined}
      onTouchStart={isEditMode ? onDragStart : undefined}
    >
      {isEditMode && (
        <>
          <div className="absolute top-1 left-1 z-20 bg-slate-800/90 rounded p-1 backdrop-blur-sm pointer-events-none">
            <GripVertical className="h-3 w-3 text-slate-300" />
          </div>
          <div className="absolute top-1 right-1 z-20">
            <Button
              size="icon"
              variant="destructive"
              className="h-6 w-6 rounded-full shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
      <div className={`h-full w-full ${isEditMode ? 'pointer-events-none' : ''}`}>
        <WidgetContent type={widget.type} />
      </div>
    </div>
  );
}