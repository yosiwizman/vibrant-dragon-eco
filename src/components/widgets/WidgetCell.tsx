"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Widget } from "@/types/widgets";
import WidgetContent from "./WidgetContent";

interface WidgetCellProps {
  widget: Widget;
  isEditMode: boolean;
  isDragging: boolean;
  onRemove: () => void;
  onDragStart: () => void;
}

export default function WidgetCell({
  widget,
  isEditMode,
  isDragging,
  onRemove,
  onDragStart,
}: WidgetCellProps) {
  return (
    <div className={`relative h-full w-full ${isEditMode ? 'ring-2 ring-fuchsia-500/30 rounded-lg' : ''}`}>
      {/* Widget Content */}
      <div className="h-full w-full">
        <WidgetContent type={widget.type} />
      </div>

      {/* Remove button in edit mode */}
      {isEditMode && (
        <Button
          size="icon"
          variant="destructive"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg z-20"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}