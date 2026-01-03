import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Bell, CheckSquare, FileText, Calendar, 
  CloudSun, MapPin, Navigation, BookOpen, Clock
} from "lucide-react";

const commandCategories = [
  {
    title: "Navigation",
    icon: Navigation,
    color: "text-green-400",
    commands: [
      "Open my tasks",
      "Go to reminders",
      "Show me my calendar",
      "Take me to notes",
      "Open settings",
    ],
  },
  {
    title: "Read & Summarize",
    icon: BookOpen,
    color: "text-purple-400",
    commands: [
      "Read my tasks",
      "What are my reminders?",
      "Summarize my day",
      "What's on my calendar?",
      "Read my notes",
    ],
  },
  {
    title: "Tasks & Reminders",
    icon: CheckSquare,
    color: "text-blue-400",
    commands: [
      "Add a task to buy groceries",
      "Remind me to call mom at 5pm",
      "Mark my first task as done",
      "Reschedule my task to tomorrow",
      "What tasks are overdue?",
    ],
  },
  {
    title: "Notes & Calendar",
    icon: Calendar,
    color: "text-orange-400",
    commands: [
      "Take a note about the meeting",
      "Schedule a meeting tomorrow at 2pm",
      "What meetings do I have today?",
      "Create an event for Friday",
      "Note that I need to follow up",
    ],
  },
  {
    title: "Search & Weather",
    icon: Search,
    color: "text-cyan-400",
    commands: [
      "Search for the latest news",
      "What's the weather like?",
      "Find nearby coffee shops",
      "What time is it?",
      "Search for React tutorials",
    ],
  },
];

export default function VoiceCommandExamples() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-400 text-center">Try saying...</h3>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {commandCategories.map((category) => (
          <Card key={category.title} className="border-slate-700/50 bg-slate-800/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <category.icon className={`h-4 w-4 ${category.color}`} />
                <span className="text-xs font-medium text-slate-300">{category.title}</span>
              </div>
              <div className="space-y-1">
                {category.commands.slice(0, 3).map((cmd, idx) => (
                  <p key={idx} className="text-xs text-slate-400 truncate">
                    "{cmd}"
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}