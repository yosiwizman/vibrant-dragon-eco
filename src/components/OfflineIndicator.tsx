import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi, Brain, Cloud } from "lucide-react";
import { useOpenAIKey } from "@/hooks/useOpenAIKey";
import { isWebLLMSupported } from "@/services/web-llm";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { hasKey } = useOpenAIKey();
  const hasWebLLM = isWebLLMSupported();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine AI mode
  const getAIMode = () => {
    if (!isOnline) {
      return hasWebLLM ? "Offline AI" : "Offline (Limited)";
    }
    return hasKey ? "Online AI" : "No AI";
  };

  const getIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />;
    if (hasKey) return <Cloud className="h-3 w-3" />;
    if (hasWebLLM) return <Brain className="h-3 w-3" />;
    return <Wifi className="h-3 w-3" />;
  };

  const getVariant = () => {
    if (!isOnline && !hasWebLLM) return "destructive";
    if (!isOnline && hasWebLLM) return "secondary";
    if (hasKey) return "default";
    return "outline";
  };

  return (
    <Badge 
      variant={getVariant()}
      className="gap-1 text-[10px] px-2 py-0.5"
    >
      {getIcon()}
      <span>{getAIMode()}</span>
    </Badge>
  );
}