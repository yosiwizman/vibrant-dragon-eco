"use client";

import React, { createContext, useContext, useState } from "react";
import { WidgetType } from "@/components/WidgetLibrary";

interface WidgetDragContextType {
  draggedWidget: WidgetType | null;
  setDraggedWidget: (widget: WidgetType | null) => void;
}

const WidgetDragContext = createContext<WidgetDragContextType | undefined>(undefined);

export function WidgetDragProvider({ children }: { children: React.ReactNode }) {
  const [draggedWidget, setDraggedWidget] = useState<WidgetType | null>(null);

  return (
    <WidgetDragContext.Provider value={{ draggedWidget, setDraggedWidget }}>
      {children}
    </WidgetDragContext.Provider>
  );
}

export function useWidgetDrag() {
  const context = useContext(WidgetDragContext);
  if (!context) {
    throw new Error("useWidgetDrag must be used within WidgetDragProvider");
  }
  return context;
}