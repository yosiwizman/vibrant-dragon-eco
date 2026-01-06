"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Widget } from "@/types/widgets";
import WidgetContent from "../content/WidgetContent.tsx";
import ResizeHandles from "./ResizeHandles";

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface WidgetCellProps {
  widget: Widget;
  isEditMode: boolean;
  onRemove: () => void;
  onResizeStart: (dir: ResizeDir, clientX: number, clientY: number) => void;
}

export default function WidgetCell({ widget, isEditMode, onRemove, onResizeStart }: WidgetCellProps) {
  return (
    <div className="relative h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xl">
      {/* Clip any child overflow so widgets never visually overlap */}
      <div className="h-full w-full min-h-0 min-w-0 overflow-hidden">
        <WidgetContent type={widget.type} />
      </div>

      {isEditMode && (
        <>
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