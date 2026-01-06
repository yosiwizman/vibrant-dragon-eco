"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Widget } from "@/types/widgets";
import WidgetContent from "../content/WidgetContent";

interface WidgetCellProps {
  widget: Widget;
  isEditMode: boolean;
  onRemove: () => void;
}

export default function WidgetCell({ widget, isEditMode, onRemove }: WidgetCellProps) {
  return (
    <div className="relative h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xl">
      {/* This inner wrapper is IMPORTANT: it clips any child overflow and gives a stable layout box */}
      <div className="h-full w-full min-h-0 min-w-0 overflow-hidden">
        <WidgetContent type={widget.type} />
      </div>

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