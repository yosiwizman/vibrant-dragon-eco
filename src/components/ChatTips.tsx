import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

const QUICK_PROMPTS = [
  "What's the weather like?",
  "Remind me to...",
  "Create a task to...",
  "Search for...",
  "Find nearby...",
  "Take a note...",
  "What's on my calendar?",
  "Draft an email...",
];

interface ChatTipsProps {
  onPromptClick: (prompt: string) => void;
}

export default function ChatTips({ onPromptClick }: ChatTipsProps) {
  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-fuchsia-400" />
          <span className="text-xs font-medium text-slate-300">Quick prompts</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="border-slate-600 text-slate-400 text-xs cursor-pointer hover:border-fuchsia-500/50 hover:text-fuchsia-300 transition-colors"
              onClick={() => onPromptClick(prompt)}
            >
              {prompt}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}