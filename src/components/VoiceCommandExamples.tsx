import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

const COMMAND_CATEGORIES = [
  {
    category: "Reminders & Tasks",
    examples: [
      "Remind me to call mom at 5pm",
      "Set a reminder for tomorrow morning to take medicine",
      "Create a task to review the quarterly report",
      "Add a high priority task to prepare presentation",
      "What are my pending tasks?",
      "Mark the grocery shopping task as complete",
    ],
  },
  {
    category: "Calendar & Events",
    examples: [
      "Schedule a meeting tomorrow at 2pm",
      "What's on my calendar today?",
      "Create an event for dinner with John on Friday at 7pm",
      "What do I have planned this week?",
    ],
  },
  {
    category: "Weather & Location",
    examples: [
      "What's the weather like?",
      "What's the weather in New York?",
      "Find coffee shops nearby",
      "Where's the nearest gas station?",
      "Find pharmacies near me",
    ],
  },
  {
    category: "Notes & Knowledge",
    examples: [
      "Take a note: Meeting notes from today's standup",
      "Remember that my favorite color is blue",
      "What do you know about my preferences?",
      "Save this: My doctor's name is Dr. Smith",
    ],
  },
  {
    category: "Communication",
    examples: [
      "Draft an email to my boss about the project update",
      "Write a text message to John saying I'll be late",
      "Help me write a professional email declining a meeting",
    ],
  },
  {
    category: "Web Search",
    examples: [
      "Search for the latest AI news",
      "What's happening in the stock market today?",
      "Find information about React 19 features",
    ],
  },
];

export default function VoiceCommandExamples() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const displayedCategories = isExpanded 
    ? COMMAND_CATEGORIES 
    : COMMAND_CATEGORIES.slice(0, 2);

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            Try saying...
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white h-6 px-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                More
              </>
            )}
          </Button>
        </div>

        <div className="space-y-3">
          {displayedCategories.map((cat) => (
            <div key={cat.category}>
              <button
                onClick={() => setSelectedCategory(
                  selectedCategory === cat.category ? null : cat.category
                )}
                className="text-xs font-medium text-fuchsia-300 hover:text-fuchsia-200 mb-1"
              >
                {cat.category}
              </button>
              <div className="flex flex-wrap gap-1">
                {(selectedCategory === cat.category ? cat.examples : cat.examples.slice(0, 2)).map((example, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="border-slate-600 text-slate-300 text-xs cursor-default hover:border-fuchsia-500/50 hover:text-fuchsia-300 transition-colors"
                  >
                    "{example}"
                  </Badge>
                ))}
                {selectedCategory !== cat.category && cat.examples.length > 2 && (
                  <Badge
                    variant="outline"
                    className="border-slate-700 text-slate-500 text-xs cursor-pointer hover:border-slate-600"
                    onClick={() => setSelectedCategory(cat.category)}
                  >
                    +{cat.examples.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}