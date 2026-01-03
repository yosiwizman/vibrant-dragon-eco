import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useVoice } from "@/contexts/VoiceContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  CheckSquare, Bell, FileText, Calendar, 
  CloudSun, Search, Navigation, Volume2 
} from "lucide-react";

const QUICK_SUGGESTIONS = [
  { icon: CheckSquare, text: "Add task", color: "text-green-400" },
  { icon: Bell, text: "Set reminder", color: "text-yellow-400" },
  { icon: FileText, text: "Take note", color: "text-purple-400" },
  { icon: Calendar, text: "Schedule event", color: "text-blue-400" },
  { icon: CloudSun, text: "Weather", color: "text-orange-400" },
  { icon: Search, text: "Search web", color: "text-cyan-400" },
  { icon: Navigation, text: "Open tasks", color: "text-green-400" },
  { icon: Volume2, text: "Summarize day", color: "text-fuchsia-400" },
];

export default function VoiceQuickActions() {
  const location = useLocation();
  const { user } = useAuth();
  const { isListening } = useVoice();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isListening) {
      // Show after a short delay
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isListening]);

  // Don't show on login page or when not authenticated
  if (location.pathname === "/login" || !user) {
    return null;
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-slate-900/95 border border-slate-700 rounded-2xl p-3 backdrop-blur-lg shadow-2xl">
        <p className="text-xs text-slate-500 text-center mb-2">Try saying...</p>
        <div className="flex flex-wrap gap-2 justify-center max-w-md">
          {QUICK_SUGGESTIONS.map((suggestion, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="border-slate-700 bg-slate-800/50 text-slate-300 text-xs py-1 px-2 flex items-center gap-1.5"
            >
              <suggestion.icon className={`h-3 w-3 ${suggestion.color}`} />
              {suggestion.text}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}