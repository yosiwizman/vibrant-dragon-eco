"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";
import { Widget } from "@/types/widgets";
import WidgetContent from "./WidgetContent";

interface WidgetCellProps {
  widget: Widget;
  isEditMode: boolean;
  isActive: boolean;
  onRemove: () => void;
  onDragStart: (clientX: number, clientY: number) => void;
  onResizeStart: (direction: string, clientX: number, clientY: number) => void;
}

export default function WidgetCell({ 
  widget, 
  isEditMode, 
  isActive,
  onRemove, 
  onDragStart,
  onResizeStart
}: WidgetCellProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditMode && !(e.target as HTMLElement).closest('.resize-handle')) {
      e.preventDefault();
      onDragStart(e.clientX, e.clientY);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditMode && !(e.target as HTMLElement).closest('.resize-handle') && e.touches.length > 0) {
      e.preventDefault();
      onDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    onResizeStart(direction, e.clientX, e.clientY);
  };

  const handleResizeTouchStart = (e: React.TouchEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.touches.length > 0) {
      onResizeStart(direction, e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  return (
    <div
      className={`relative transition-transform ${isEditMode && !isActive ? 'animate-subtle-wiggle' : ''} ${isActive ? 'z-50 scale-105' : 'z-10'}`}
      style={{
        gridColumn: `${widget.x + 1} / span ${widget.w}`,
        gridRow: `${widget.y + 1} / span ${widget.h}`,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Widget Content */}
      <div className={`h-full w-full p-1 ${isEditMode ? 'pointer-events-none' : ''}`}>
        <div className="h-full w-full">
          <WidgetContent type={widget.type} />
        </div>
      </div>

      {/* Edit Mode Overlays */}
      {isEditMode && (
        <>
          {/* Drag Handle */}
          <div className="absolute top-2 left-2 z-30 bg-slate-900/90 rounded-md p-1.5 backdrop-blur-sm pointer-events-none">
            <GripVertical className="h-4 w-4 text-slate-300" />
          </div>
          
          {/* Remove Button */}
          <div className="absolute top-2 right-2 z-30">
            <Button
              size="icon"
              variant="destructive"
              className="h-7 w-7 rounded-full shadow-lg pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Resize Handles - Only corners for cleaner look */}
          <div
            className="resize-handle absolute -top-1 -left-1 w-5 h-5 bg-fuchsia-500 rounded-full cursor-nw-resize hover:scale-125 transition-transform pointer-events-auto"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            onTouchStart={(e) => handleResizeTouchStart(e, 'nw')}
          />
          <div
            className="resize-handle absolute -top-1 -right-1 w-5 h-5 bg-fuchsia-500 rounded-full cursor-ne-resize hover:scale-125 transition-transform pointer-events-auto"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            onTouchStart={(e) => handleResizeTouchStart(e, 'ne')}
          />
          <div
            className="resize-handle absolute -bottom-1 -left-1 w-5 h-5 bg-fuchsia-500 rounded-full cursor-sw-resize hover:scale-125 transition-transform pointer-events-auto"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            onTouchStart={(e) => handleResizeTouchStart(e, 'sw')}
          />
          <div
            className="resize-handle absolute -bottom-1 -right-1 w-5 h-5 bg-fuchsia-500 rounded-full cursor-se-resize hover:scale-125 transition-transform pointer-events-auto"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            onTouchStart={(e) => handleResizeTouchStart(e, 'se')}
          />

          {/* Edge Handles - Smaller and subtler */}
          <div
            className="resize-handle absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-3 bg-fuchsia-500/80 rounded-full cursor-n-resize hover:bg-fuchsia-400 transition-colors pointer-events-auto"
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            onTouchStart={(e) => handleResizeTouchStart(e, 'n')}
          />
          <div
            className="resize-handle absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-3 bg-fuchsia-500/80 rounded-full cursor-s-resize hover:bg-fuchsia-400 transition-colors pointer-events-auto"
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            onTouchStart={(e) => handleResizeTouchStart(e, 's')}
          />
          <div
            className="resize-handle absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-8 bg-fuchsia-500/80 rounded-full cursor-w-resize hover:bg-fuchsia-400 transition-colors pointer-events-auto"
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            onTouchStart={(e) => handleResizeTouchStart(e, 'w')}
          />
          <div
            className="resize-handle absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-8 bg-fuchsia-500/80 rounded-full cursor-e-resize hover:bg-fuchsia-400 transition-colors pointer-events-auto"
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            onTouchStart={(e) => handleResizeTouchStart(e, 'e')}
          />
        </>
      )}
    </div>
  );
}