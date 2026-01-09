/**
 * Voice Layout Service
 * Manage preset and custom dashboard layouts
 */

import type { Widget } from "@/types/widgets";

export interface Layout {
  name: string;
  widgets: Widget[];
}

const DEFAULT_LAYOUTS: Record<string, Partial<Widget>[]> = {
  "default": [
    { type: "time", x: 0, y: 0, w: 1, h: 1 },
    { type: "weather", x: 1, y: 0, w: 2, h: 2 },
    { type: "tasks", x: 3, y: 0, w: 1, h: 2 },
    { type: "upcoming", x: 0, y: 2, w: 2, h: 2 },
  ],
  "productivity": [
    { type: "tasks", x: 0, y: 0, w: 2, h: 4 },
    { type: "calendar", x: 2, y: 0, w: 2, h: 2 },
    { type: "notes", x: 2, y: 2, w: 2, h: 2 },
  ],
  "finance": [
    { type: "stocks", x: 0, y: 0, w: 4, h: 2 },
    { type: "news", x: 0, y: 2, w: 4, h: 3 },
  ],
  "morning": [
    { type: "time", x: 0, y: 0, w: 1, h: 1 },
    { type: "weather", x: 1, y: 0, w: 2, h: 1 },
    { type: "upcoming", x: 0, y: 1, w: 4, h: 2 },
    { type: "news", x: 0, y: 3, w: 4, h: 2 },
  ]
};

/**
 * Apply a preset layout
 */
export function getLayout(name: string): Partial<Widget>[] | null {
  const lower = name.toLowerCase();
  
  if (lower.includes("default") || lower.includes("reset")) return DEFAULT_LAYOUTS["default"];
  if (lower.includes("productivity") || lower.includes("work")) return DEFAULT_LAYOUTS["productivity"];
  if (lower.includes("finance") || lower.includes("market") || lower.includes("stock")) return DEFAULT_LAYOUTS["finance"];
  if (lower.includes("morning") || lower.includes("briefing")) return DEFAULT_LAYOUTS["morning"];
  
  return null;
}

/**
 * Generate unique IDs for layout widgets
 */
export function hydrateLayout(layoutWidgets: Partial<Widget>[]): Widget[] {
  return layoutWidgets.map(w => ({
    ...w,
    id: `${w.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    x: w.x || 0,
    y: w.y || 0,
    w: w.w || 1,
    h: w.h || 1,
  } as Widget));
}