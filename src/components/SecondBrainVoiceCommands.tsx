"use client";

import { useState } from "react";
import {
  Brain,
  Mic,
  MicOff,
  Languages,
  Users2,
  ShieldCheck,
  Search,
  ListChecks,
  Volume2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CommandCategory {
  title: string;
  icon: React.ElementType;
  color: string;
  commands: {
    phrase: string;
    description: string;
  }[];
}

const commandCategories: CommandCategory[] = [
  {
    title: "Activation",
    icon: Brain,
    color: "text-purple-400",
    commands: [
      { phrase: "Start second brain", description: "Activate always-on listening mode" },
      { phrase: "Stop second brain", description: "Deactivate continuous listening" },
      { phrase: "Second brain status", description: "Check if Second Brain is active" },
    ],
  },
  {
    title: "Privacy",
    icon: ShieldCheck,
    color: "text-yellow-400",
    commands: [
      { phrase: "Give me privacy", description: "Stop listening temporarily" },
      { phrase: "Enter privacy mode", description: "Mute the microphone" },
      { phrase: "Exit privacy mode", description: "Resume listening" },
      { phrase: "Resume listening", description: "Start listening again after privacy mode" },
    ],
  },
  {
    title: "Conversations",
    icon: Users2,
    color: "text-blue-400",
    commands: [
      { phrase: "What did [name] say?", description: "Recall conversations with a person" },
      { phrase: "Search conversations about [topic]", description: "Find conversations by topic" },
      { phrase: "Who has been speaking?", description: "List detected speakers" },
      { phrase: "Name that speaker [name]", description: "Assign a name to a speaker" },
    ],
  },
  {
    title: "Lists & Items",
    icon: ListChecks,
    color: "text-green-400",
    commands: [
      { phrase: "What items did [name] mention?", description: "Get items from conversations" },
      { phrase: "Get the list from [name]", description: "Retrieve captured lists" },
      { phrase: "What did [name] say to bring?", description: "Get items for an event" },
    ],
  },
  {
    title: "Fact Checking",
    icon: Search,
    color: "text-orange-400",
    commands: [
      { phrase: "Enable fact checking", description: "Turn on real-time fact verification" },
      { phrase: "Disable fact checking", description: "Turn off fact checking" },
    ],
  },
  {
    title: "Whisper Mode",
    icon: Volume2,
    color: "text-cyan-400",
    commands: [
      { phrase: "Set whisper volume to [number]", description: "Adjust whisper loudness" },
      { phrase: "Make whispers quieter", description: "Lower whisper volume" },
      { phrase: "Increase whisper volume", description: "Raise whisper volume" },
    ],
  },
  {
    title: "Memory",
    icon: Brain,
    color: "text-pink-400",
    commands: [
      { phrase: "Clear conversation memory", description: "Delete all indexed conversations" },
      { phrase: "Reset second brain memory", description: "Clear all Second Brain data" },
    ],
  },
];

export default function SecondBrainVoiceCommands() {
  const [openCategories, setOpenCategories] = useState<string[]>(["Activation"]);

  const toggleCategory = (title: string) => {
    setOpenCategories((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Mic className="h-5 w-5 text-purple-400" />
        <h3 className="font-semibold text-white">Voice Commands</h3>
      </div>

      {commandCategories.map((category) => (
        <Collapsible
          key={category.title}
          open={openCategories.includes(category.title)}
          onOpenChange={() => toggleCategory(category.title)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-3 h-auto hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-2">
                <category.icon className={`h-4 w-4 ${category.color}`} />
                <span className="text-sm text-white">{category.title}</span>
                <span className="text-xs text-slate-500">
                  ({category.commands.length})
                </span>
              </div>
              {openCategories.includes(category.title) ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-6 pr-3 pb-3 space-y-2">
              {category.commands.map((command, index) => (
                <div
                  key={index}
                  className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50"
                >
                  <p className="text-sm text-purple-300 font-mono mb-1">
                    "{command.phrase}"
                  </p>
                  <p className="text-xs text-slate-400">{command.description}</p>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}

      <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <p className="text-xs text-purple-300">
          <strong>Tip:</strong> Say "Hey Echo" followed by any command to activate
          Second Brain features hands-free.
        </p>
      </div>
    </div>
  );
}