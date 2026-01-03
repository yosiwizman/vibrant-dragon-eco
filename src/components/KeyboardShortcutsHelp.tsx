"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: isMac ? "⌘H" : "Ctrl+H", description: "Go to Home" },
      { keys: isMac ? "⌘⇧T" : "Ctrl+Shift+T", description: "Go to Tasks" },
      { keys: isMac ? "⌘⇧R" : "Ctrl+Shift+R", description: "Go to Reminders" },
      { keys: isMac ? "⌘⇧N" : "Ctrl+Shift+N", description: "Go to Notes" },
      { keys: isMac ? "⌘⇧C" : "Ctrl+Shift+C", description: "Go to Calendar" },
      { keys: isMac ? "⌘," : "Ctrl+,", description: "Go to Settings" },
    ],
  },
  {
    title: "Voice & Chat",
    shortcuts: [
      { keys: isMac ? "⌘K" : "Ctrl+K", description: "Open Command Palette" },
      { keys: isMac ? "⌘V" : "Ctrl+V", description: "Go to Voice Chat" },
      { keys: isMac ? "⌘J" : "Ctrl+J", description: "Go to Text Chat" },
      { keys: "Space", description: "Push to Talk (on Voice page)" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: "?", description: "Show Keyboard Shortcuts" },
      { keys: "Escape", description: "Close dialogs / Cancel" },
    ],
  },
];

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help on "?" key (Shift + /)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (
          target.tagName !== "INPUT" &&
          target.tagName !== "TEXTAREA" &&
          !target.isContentEditable
        ) {
          e.preventDefault();
          setIsOpen(true);
        }
      }
      
      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-fuchsia-400" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-fuchsia-300 mb-2">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-800/50"
                  >
                    <span className="text-sm text-slate-300">
                      {shortcut.description}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-slate-600 text-slate-400 font-mono text-xs"
                    >
                      {shortcut.keys}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-slate-500 text-center mt-4">
          Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">?</kbd> anytime to show this help
        </p>
      </DialogContent>
    </Dialog>
  );
}