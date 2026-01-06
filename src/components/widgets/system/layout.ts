import { WIDGET_CONFIGS, type Widget } from "@/types/widgets";

const GRID_COLS = 4;

type CellKey = `${number},${number}`;

function normalizeWidgetSize(widget: Widget): Pick<Widget, "w" | "h"> {
  const cfg = WIDGET_CONFIGS[widget.type];
  let w = Number.isFinite(widget.w) ? widget.w : 1;
  let h = Number.isFinite(widget.h) ? widget.h : 1;

  w = Math.max(1, Math.min(GRID_COLS, w));
  h = Math.max(1, h);

  if (cfg) {
    w = Math.max(cfg.minSize.w, Math.min(cfg.maxSize.w, w));
    h = Math.max(cfg.minSize.h, Math.min(cfg.maxSize.h, h));
    w = Math.min(GRID_COLS, w);
  }

  return { w, h };
}

function canPlace(occupied: Set<CellKey>, x: number, y: number, w: number, h: number) {
  if (x < 0 || y < 0 || x + w > GRID_COLS) return false;

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const key = `${x + dx},${y + dy}` as CellKey;
      if (occupied.has(key)) return false;
    }
  }

  return true;
}

function markOccupied(occupied: Set<CellKey>, widgetId: string, x: number, y: number, w: number, h: number) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const key = `${x + dx},${y + dy}` as CellKey;
      occupied.add(key);
    }
  }
  void widgetId;
}

function findFirstFit(occupied: Set<CellKey>, w: number, h: number) {
  for (let y = 0; y < 200; y++) {
    for (let x = 0; x <= GRID_COLS - w; x++) {
      if (canPlace(occupied, x, y, w, h)) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

/**
 * Packs widgets into the 4-col grid with no overlaps.
 * - Normalizes sizes to config min/max.
 * - Tries to keep existing position if free; otherwise finds first fit.
 */
export function packWidgets(widgets: Widget[]): Widget[] {
  const input = Array.isArray(widgets) ? widgets : [];
  if (input.length === 0) return [];

  const occupied = new Set<CellKey>();
  const result: Widget[] = [];

  const sorted = [...input].sort((a, b) => {
    const ay = Number.isFinite(a.y) ? a.y : 0;
    const ax = Number.isFinite(a.x) ? a.x : 0;
    const by = Number.isFinite(b.y) ? b.y : 0;
    const bx = Number.isFinite(b.x) ? b.x : 0;
    return ay * 1000 + ax - (by * 1000 + bx);
  });

  for (const w0 of sorted) {
    const { w, h } = normalizeWidgetSize(w0);
    const desiredX = Number.isFinite(w0.x) ? Math.max(0, Math.min(GRID_COLS - w, w0.x)) : 0;
    const desiredY = Number.isFinite(w0.y) ? Math.max(0, w0.y) : 0;

    let x = desiredX;
    let y = desiredY;

    if (!canPlace(occupied, x, y, w, h)) {
      const fit = findFirstFit(occupied, w, h);
      x = fit.x;
      y = fit.y;
    }

    markOccupied(occupied, w0.id, x, y, w, h);

    result.push({
      id: w0.id,
      type: w0.type,
      x,
      y,
      w,
      h,
    });
  }

  return result;
}

export function findNextPosition(existing: Widget[], w: number, h: number) {
  const occupied = new Set<CellKey>();
  for (const widget of existing) {
    const { w: ww, h: hh } = normalizeWidgetSize(widget);
    markOccupied(occupied, widget.id, widget.x, widget.y, ww, hh);
  }
  return findFirstFit(occupied, Math.min(GRID_COLS, Math.max(1, w)), Math.max(1, h));
}