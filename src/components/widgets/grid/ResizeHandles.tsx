"use client";

import React from "react";

type Dir = "e" | "s" | "se";

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
      {/* Right edge */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-10 rounded-full bg-fuchsia-500/80 hover:bg-fuchsia-400 cursor-e-resize pointer-events-auto z-30"
        onPointerDown={(e) => handlePointerDown(e, "e")}
        title="Resize"
      />
      {/* Bottom edge */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-10 h-3 rounded-full bg-fuchsia-500/80 hover:bg-fuchsia-400 cursor-s-resize pointer-events-auto z-30"
        onPointerDown={(e) => handlePointerDown(e, "s")}
        title="Resize"
      />
      {/* Bottom-right corner */}
      <div
        className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 cursor-se-resize pointer-events-auto z-40"
        onPointerDown={(e) => handlePointerDown(e, "se")}
        title="Resize"
      />
    </>
  );
}