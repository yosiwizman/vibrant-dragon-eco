"use client";

import React, { useState } from "react";
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
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, direction: string) => void;
}

export default function WidgetCell({ 
  widget, 
  isEditMode, 
  isDragging,
  onRemove, 
  onDragStart,
  onResizeStart
}: WidgetCellProps) {
  const [isHovered, setIsHovered] = useState(false);

  const resizeHandles = [
    { dir: 'n', className: 'top-0 left-1/2 -translate-x-1/2 w-12 h-2 cursor-ns-resize' },
    { dir: 's', className: 'bottom-0 left-1/2 -translate-x-1/2 w-12 h-2 cursor-ns-resize' },
    { dir: 'e', className: 'right-0 top-1/2 -translate-y-1/2 w-2 h-12 cursor-ew-resize' },
    { dir: 'w', className: 'left-0 top-1/2 -translate-y-1/2 w-2 h-12 cursor-ew-resize' },
    { dir: 'ne', className: 'top-0 right-0 w-4 h-4 cursor-ne-resize' },
    { dir: 'nw', className: 'top-0 left-0 w-4 h-4 cursor-nw-resize' },
    { dir: 'se', className: 'bottom-0 right-0 w-4 h-4 cursor-se-resize' },
    { dir: 'sw', className: 'bottom-0 left-0 w-4 h-4 cursor-sw-resize' },
  ];

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditMode && (
        <>
          {/* Drag Handle */}
          <div className="absolute top-1 left-1 z-20 bg-slate-800/90 rounded p-1 backdrop-blur-sm pointer-events-none">
            <GripVertical className="h-3 w-3 text-slate-300" />
          </div>
          
          {/* Remove Button */}
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

          {/* Resize Handles - 8 directions */}
          {resizeHandles.map(({ dir, className }) => (
            <div
              key={dir}
              className={`absolute ${className} bg-fuchsia-500/80 hover:bg-fuchsia-400 transition-colors z-30`}
              onMouseDown={(e) => {
                e.stopPropagation();
                onResizeStart(e, dir);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                onResizeStart(e, dir);
              }}
            />
          ))}
        </>
      )}
      <div className={`h-full w-full ${isEditMode ? 'pointer-events-none' : ''}`}>
        <WidgetContent type={widget.type} />
      </div>
    </div>
  );
}