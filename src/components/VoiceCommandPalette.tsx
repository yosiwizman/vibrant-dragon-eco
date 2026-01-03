import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic, Search, Navigation, CheckSquare, Bell, FileText,
  Calendar, CloudSun, MapPin, Volume2, Clock, Users,
  Command, Keyboard, CalendarClock, EarOff
} from "lucide-react";
import { useVoice } from "@/contexts/VoiceContext";

interface CommandCategory {
  name: string;
  icon: React.ElementType;
  color: string;
  commands: { phrase: string; description: string }[];
}

const COMMAND_CATEGORIES: CommandCategory[] = [
  {
    name: "Navigation",
    icon: Navigation,
    color: "text-green-400",
    commands: [
      { phrase: "Open tasks", description: "Go to tasks page" },
      { phrase: "Go to reminders", description: "Go to reminders page" },
      { phrase: "Show calendar", description: "Go to calendar page" },
      { phrase: "Open notes", description: "Go to notes page" },
      { phrase: "Go to contacts", description: "Go to contacts page" },
      { phrase: "Open messages", description: "Go to messages page" },
      { phrase: "Show settings", description: "Go to settings page" },
      { phrase: "Open knowledge base", description: "Go to knowledge base" },
      { phrase: "Go home", description: "Go to dashboard" },
      { phrase: "Open listening sessions", description: "View past listening sessions" },
      { phrase: "Show appointments", description: "Go to appointments page" },
      { phrase: "Open documents", description: "Go to documents page" },
    ],
  },
  {
    name: "Tasks",
    icon: CheckSquare,
    color: "text-blue-400",
    commands: [
      { phrase: "Add task [title]", description: "Create a new task" },
      { phrase: "Read my tasks", description: "List all pending tasks" },
      { phrase: "Mark [task] done", description: "Complete a task" },
      { phrase: "What tasks are overdue?", description: "List overdue tasks" },
      { phrase: "Reschedule [task] to tomorrow", description: "Change task due date" },
    ],
  },
  {
    name: "Reminders",
    icon: Bell,
    color: "text-yellow-400",
    commands: [
      { phrase: "Remind me to [text] at [time]", description: "Create a reminder" },
      { phrase: "Remind me every day at [time]", description: "Create recurring daily reminder" },
      { phrase: "Remind me every Monday at [time]", description: "Create weekly reminder" },
      { phrase: "Read my reminders", description: "List pending reminders" },
      { phrase: "Dismiss [reminder]", description: "Dismiss a reminder" },
      { phrase: "What reminders are coming up?", description: "List upcoming reminders" },
      { phrase: "Show recurring reminders", description: "List all recurring items" },
      { phrase: "Cancel recurring [reminder]", description: "Stop a recurring reminder" },
    ],
  },
  {
    name: "Notes",
    icon: FileText,
    color: "text-purple-400",
    commands: [
      { phrase: "Take a note about [topic]", description: "Create a new note" },
      { phrase: "Read my notes", description: "List recent notes" },
      { phrase: "Search notes for [keyword]", description: "Search through notes" },
    ],
  },
  {
    name: "Calendar",
    icon: Calendar,
    color: "text-cyan-400",
    commands: [
      { phrase: "Schedule [event] at [time]", description: "Create calendar event" },
      { phrase: "What's on my calendar?", description: "List upcoming events" },
      { phrase: "Read my schedule", description: "Read today's events" },
    ],
  },
  {
    name: "Information",
    icon: CloudSun,
    color: "text-orange-400",
    commands: [
      { phrase: "What's the weather?", description: "Get current weather" },
      { phrase: "What time is it?", description: "Get current time" },
      { phrase: "Summarize my day", description: "Get daily summary" },
      { phrase: "Search for [query]", description: "Web search" },
      { phrase: "Find nearby [place]", description: "Find nearby places" },
      { phrase: "Search knowledge base for [topic]", description: "Search your documents" },
      { phrase: "What do you know about [topic]?", description: "Query knowledge base" },
    ],
  },
  {
    name: "Smart Scheduling",
    icon: CalendarClock,
    color: "text-teal-400",
    commands: [
      { phrase: "Schedule meeting at 2pm", description: "Create event with conflict check" },
      { phrase: "When should I do this task?", description: "Get optimal time suggestions" },
      { phrase: "Check my schedule", description: "Analyze today's schedule" },
      { phrase: "What's my next free slot?", description: "Find available time" },
      { phrase: "Remember I pick up my daughter Wednesdays at 2pm", description: "Create pattern-based reminder" },
      { phrase: "Learn my patterns", description: "Analyze your scheduling habits" },
    ],
  },
  {
    name: "Quiet Mode",
    icon: EarOff,
    color: "text-purple-400",
    commands: [
      { phrase: "Go quiet", description: "Enter listening mode" },
      { phrase: "Listening mode", description: "Start silent listening" },
      { phrase: "Meeting mode", description: "Listen without interrupting" },
      { phrase: "Echo summarize", description: "Exit quiet mode and get summary" },
      { phrase: "What did you hear?", description: "Get conversation summary" },
      { phrase: "End listening mode", description: "Stop listening and summarize" },
    ],
  },
  {
    name: "Actions",
    icon: Command,
    color: "text-red-400",
    commands: [
      { phrase: "Undo", description: "Undo the last action" },
      { phrase: "Undo that", description: "Undo the last action" },
      { phrase: "Cancel", description: "Cancel current operation" },
      { phrase: "Never mind", description: "Cancel and start over" },
    ],
  },
  {
    name: "Contacts",
    icon: Users,
    color: "text-pink-400",
    commands: [
      { phrase: "Add contact [name]", description: "Create new contact" },
      { phrase: "Find contact [name]", description: "Search contacts" },
      { phrase: "Call [name]", description: "Initiate call" },
      { phrase: "Message [name]", description: "Draft message to contact" },
      { phrase: "Update contact [name]", description: "Update contact info" },
      { phrase: "Delete contact [name]", description: "Remove contact" },
    ],
  },
  {
    name: "Appointments",
    icon: Calendar,
    color: "text-teal-400",
    commands: [
      { phrase: "Schedule appointment at [time]", description: "Create appointment" },
      { phrase: "Show my appointments", description: "List upcoming appointments" },
      { phrase: "Cancel appointment with [name]", description: "Cancel appointment" },
      { phrase: "Reschedule appointment to [time]", description: "Change appointment time" },
    ],
  },
  {
    name: "System",
    icon: Command,
    color: "text-slate-400",
    commands: [
      { phrase: "What's my status?", description: "Get system overview" },
      { phrase: "Show productivity stats", description: "View productivity metrics" },
      { phrase: "How am I doing?", description: "Get productivity summary" },
      { phrase: "Clear notifications", description: "Clear read notifications" },
      { phrase: "Mark all notifications read", description: "Mark all as read" },
    ],
  },
];

interface VoiceCommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function VoiceCommandPalette({ open, onClose }: VoiceCommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { startListening, isListening, isProcessing } = useVoice();

  // Filter commands based on search
  const filteredCategories = COMMAND_CATEGORIES.map(category => ({
    ...category,
    commands: category.commands.filter(
      cmd =>
        cmd.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => 
    selectedCategory ? category.name === selectedCategory : category.commands.length > 0
  );

  const handleVoiceActivate = async () => {
    onClose();
    await startListening();
  };

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl p-0 gap-0">
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <Search className="h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search voice commands..."
            className="border-0 bg-transparent text-white placeholder:text-slate-500 focus-visible:ring-0 p-0 h-auto text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button
            onClick={handleVoiceActivate}
            disabled={isListening || isProcessing}
            className={`p-2 rounded-lg transition-colors ${
              isListening 
                ? "bg-red-500/20 text-red-400" 
                : "bg-fuchsia-500/20 text-fuchsia-400 hover:bg-fuchsia-500/30"
            }`}
          >
            <Mic className={`h-5 w-5 ${isListening ? "animate-pulse" : ""}`} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 p-2 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              !selectedCategory 
                ? "bg-fuchsia-500/20 text-fuchsia-300" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            All
          </button>
          {COMMAND_CATEGORIES.map(category => (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === category.name 
                  ? "bg-fuchsia-500/20 text-fuchsia-300" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <category.icon className={`h-3 w-3 ${category.color}`} />
              {category.name}
            </button>
          ))}
        </div>

        {/* Commands List */}
        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No commands found</p>
              </div>
            ) : (
              filteredCategories.map(category => (
                <div key={category.name} className="mb-4">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-slate-500 uppercase">
                    <category.icon className={`h-3 w-3 ${category.color}`} />
                    {category.name}
                  </div>
                  <div className="space-y-1">
                    {category.commands.map((cmd, idx) => (
                      <button
                        key={idx}
                        onClick={handleVoiceActivate}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-md bg-slate-800 group-hover:bg-slate-700 ${category.color}`}>
                            <Volume2 className="h-3 w-3" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-white">"{cmd.phrase}"</p>
                            <p className="text-xs text-slate-500">{cmd.description}</p>
                          </div>
                        </div>
                        <Mic className="h-4 w-4 text-slate-600 group-hover:text-fuchsia-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Keyboard className="h-3 w-3" />
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">⌘K</kbd>
              to open
            </span>
            <span className="flex items-center gap-1">
              <Mic className="h-3 w-3" />
              Click mic to speak
            </span>
          </div>
          <span>Tap any command to activate voice</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage command palette state
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't open on login page
      if (window.location.pathname === "/login") {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => {
      // Don't open on login page
      if (window.location.pathname === "/login") {
        return;
      }
      setIsOpen(true);
    },
    close: () => setIsOpen(false),
    toggle: () => {
      // Don't toggle on login page
      if (window.location.pathname === "/login") {
        return;
      }
      setIsOpen(prev => !prev);
    },
  };
}