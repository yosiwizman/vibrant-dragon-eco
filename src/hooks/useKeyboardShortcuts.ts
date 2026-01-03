"use client";

import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape key even in inputs
        if (event.key !== "Escape") return;
      }

      for (const shortcut of shortcuts) {
        const ctrlOrMeta = isMac ? event.metaKey : event.ctrlKey;
        const matchesModifiers =
          (shortcut.ctrl || shortcut.meta ? ctrlOrMeta : !ctrlOrMeta || (!shortcut.ctrl && !shortcut.meta)) &&
          (shortcut.shift ? event.shiftKey : !event.shiftKey) &&
          (shortcut.alt ? event.altKey : !event.altKey);

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          matchesModifiers
        ) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export function useGlobalShortcuts() {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: "h",
      meta: true,
      description: "Go to Home",
      action: () => navigate("/"),
    },
    {
      key: "t",
      meta: true,
      shift: true,
      description: "Go to Tasks",
      action: () => navigate("/tasks"),
    },
    {
      key: "r",
      meta: true,
      shift: true,
      description: "Go to Reminders",
      action: () => navigate("/reminders"),
    },
    {
      key: "n",
      meta: true,
      shift: true,
      description: "Go to Notes",
      action: () => navigate("/notes"),
    },
    {
      key: "c",
      meta: true,
      shift: true,
      description: "Go to Calendar",
      action: () => navigate("/calendar"),
    },
    {
      key: ",",
      meta: true,
      description: "Go to Settings",
      action: () => navigate("/settings"),
    },
    // Voice shortcuts
    {
      key: "v",
      meta: true,
      description: "Go to Voice Chat",
      action: () => navigate("/voice"),
    },
    {
      key: "j",
      meta: true,
      description: "Go to Text Chat",
      action: () => navigate("/chat"),
    },
    // Note: ⌘N for Quick Add is handled by QuickAddModal's useQuickAdd hook
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.shift) {
    parts.push(isMac ? "⇧" : "Shift");
  }
  if (shortcut.alt) {
    parts.push(isMac ? "⌥" : "Alt");
  }
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(isMac ? "" : "+");
}