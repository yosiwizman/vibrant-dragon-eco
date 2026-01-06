"use client";

import React from "react";

type Dir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export default function ResizeHandles({
  onResizeStart,
}: {
  onResizeStart: (dir: Dir, clientX: number, clientY: number) => void;
}) {
  const handlePointerDown = (e: React.PointerEvent, dir: Dir) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    onResizeStart(dir, e.clientX, e.clientY);
  };

  return (
    <>
      {/* Top edge */}
      <div
        data-resize-handle
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-3 rounded-full bg-fuchsia-500/80 hover:bg-fuchsia-400 cursor-n-resize pointer-events-auto z-30"
        onPointerDown={(e) => handlePointerDown(e, "n")}
        title="Resize from top"
      />
      {/* Bottom edge */}
      <div
        data-resize-handle
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-10 h-3 rounded-full bg-fuchsia-500/80 hover:bg-fuchsia-400 cursor-s-resize pointer-events-auto z-30"
        onPointerDown={(e) => handlePointerDown(e, "s")}
        title="Resize from bottom"
      />
      {/* Left edge */}
      <div
        data-resize-handle
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-10 rounded-full bg-fuchsia-500/80 hover:bg-fuchsia-400 cursor-w-resize pointer-events-auto z-30"
        onPointerDown={(e) => handlePointerDown(e, "w")}
        title="Resize from left"
      />
      {/* Right edge */}
      <div
        data-resize-handle
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-10 rounded-full bg-fuchsia-500/80 hover:bg-fuchsia-400 cursor-e-resize pointer-events-auto z-30"
        onPointerDown={(e) => handlePointerDown(e, "e")}
        title="Resize from right"
      />
      {/* Top-left corner */}
      <div
        data-resize-handle
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 cursor-nw-resize pointer-events-auto z-40"
        onPointerDown={(e) => handlePointerDown(e, "nw")}
        title="Resize from top-left"
      />
      {/* Top-right corner */}
      <div
        data-resize-handle
        className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 cursor-ne-resize pointer-events-auto z-40"
        onPointerDown={(e) => handlePointerDown(e, "ne")}
        title="Resize from top-right"
      />
      {/* Bottom-left corner */}
      <div
        data-resize-handle
        className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 cursor-sw-resize pointer-events-auto z-40"
        onPointerDown={(e) => handlePointerDown(e, "sw")}
        title="Resize from bottom-left"
      />
      {/* Bottom-right corner */}
      <div
        data-resize-handle
        className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 cursor-se-resize pointer-events-auto z-40"
        onPointerDown={(e) => handlePointerDown(e, "se")}
        title="Resize from bottom-right"
      />
    </>
  );
}