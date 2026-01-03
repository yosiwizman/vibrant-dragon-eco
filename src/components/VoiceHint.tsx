import { Badge } from "@/components/ui/badge";
import { Mic } from "lucide-react";

interface VoiceHintProps {
  commands: string[];
  className?: string;
}

export default function VoiceHint({ commands, className = "" }: VoiceHintProps) {
  if (commands.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <Mic className="h-3 w-3" />
        <span>Try:</span>
      </div>
      {commands.map((cmd, idx) => (
        <Badge
          key={idx}
          variant="outline"
          className="border-slate-700 text-slate-400 text-xs font-normal"
        >
          "{cmd}"
        </Badge>
      ))}
    </div>
  );
}