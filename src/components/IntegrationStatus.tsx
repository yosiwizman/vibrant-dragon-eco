import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProviders } from "@/hooks/useProviders";
import { usePreferences } from "@/state/preferences";
import { useOpenAIKey } from "@/hooks/useOpenAIKey";
import { PROVIDER_CONFIGS } from "@/types/providers";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Brain,
  Mic,
  Search,
  MapPin,
  CloudSun,
  MessageSquare,
  Calendar,
} from "lucide-react";

interface ServiceStatus {
  name: string;
  category: string;
  status: "connected" | "not_configured" | "error";
  provider?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  ai: Brain,
  voice: Mic,
  search: Search,
  maps: MapPin,
  weather: CloudSun,
  communication: MessageSquare,
  calendar: Calendar,
};

export default function IntegrationStatus() {
  const { providers, loading } = useProviders();
  const { preferences } = usePreferences();
  const { hasKey: hasOpenAI, source: openaiSource } = useOpenAIKey();
  const [services, setServices] = useState<ServiceStatus[]>([]);

  useEffect(() => {
    const statusList: ServiceStatus[] = [];

    // Check AI provider - using centralized hook
    const hasAnthropic = providers.some(p => p.provider_name === "anthropic" && p.is_enabled && p.api_key);
    
    statusList.push({
      name: "AI Chat",
      category: "ai",
      status: hasOpenAI || hasAnthropic ? "connected" : "not_configured",
      provider: hasOpenAI
        ? `OpenAI${openaiSource === "preferences" ? " (Settings)" : " (Providers)"}`
        : hasAnthropic ? "Anthropic" : undefined,
    });

    // Check Voice (requires OpenAI for now)
    statusList.push({
      name: "Voice",
      category: "voice",
      status: hasOpenAI ? "connected" : "not_configured",
      provider: hasOpenAI ? "OpenAI Whisper + TTS" : "Add API key in Settings",
    });

    // Check Search (we have free DuckDuckGo + Wikipedia)
    const hasSerper = providers.some(p => p.provider_name === "serper" && p.is_enabled && p.api_key);
    const hasBrave = providers.some(p => p.provider_name === "brave_search" && p.is_enabled && p.api_key);
    
    statusList.push({
      name: "Web Search",
      category: "search",
      status: "connected", // Always connected via DuckDuckGo
      provider: hasSerper ? "Serper (Google)" : hasBrave ? "Brave Search" : "DuckDuckGo + Wikipedia",
    });

    // Check Maps (we have free Nominatim)
    const hasGoogleMaps = providers.some(p => p.provider_name === "google_maps" && p.is_enabled && p.api_key);
    const hasMapbox = providers.some(p => p.provider_name === "mapbox" && p.is_enabled && p.api_key);
    
    statusList.push({
      name: "Maps & Location",
      category: "maps",
      status: "connected", // Always connected via Nominatim
      provider: hasGoogleMaps ? "Google Maps" : hasMapbox ? "Mapbox" : "OpenStreetMap",
    });

    // Check Weather (we have free Open-Meteo)
    const hasOpenWeather = providers.some(p => p.provider_name === "openweathermap" && p.is_enabled && p.api_key);
    const hasWeatherAPI = providers.some(p => p.provider_name === "weatherapi" && p.is_enabled && p.api_key);
    
    statusList.push({
      name: "Weather",
      category: "weather",
      status: "connected", // Always connected via Open-Meteo
      provider: hasOpenWeather ? "OpenWeatherMap" : hasWeatherAPI ? "WeatherAPI" : "Open-Meteo",
    });

    // Check Communication
    const hasTwilio = providers.some(p => p.provider_name === "twilio" && p.is_enabled && p.api_key);
    const hasSendGrid = providers.some(p => p.provider_name === "sendgrid" && p.is_enabled && p.api_key);
    const hasGmail = providers.some(p => p.provider_name === "gmail" && p.is_enabled);
    
    statusList.push({
      name: "Email & SMS",
      category: "communication",
      status: "connected", // Draft mode always works
      provider: hasTwilio ? "Twilio" : hasSendGrid ? "SendGrid" : hasGmail ? "Gmail" : "Draft Mode (Native Apps)",
    });

    // Check Calendar
    const hasGoogleCalendar = providers.some(p => p.provider_name === "google_calendar" && p.is_enabled);
    
    statusList.push({
      name: "Calendar",
      category: "calendar",
      status: "connected", // Local calendar always works
      provider: hasGoogleCalendar ? "Google Calendar" : "Local Calendar",
    });

    setServices(statusList);
  }, [providers, hasOpenAI, openaiSource]);

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/30">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-slate-700 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const connectedCount = services.filter(s => s.status === "connected").length;

  return (
    <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Service Status</h3>
          <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
            {connectedCount}/{services.length} Active
          </Badge>
        </div>
        <div className="space-y-2">
          {services.map(service => {
            const IconComp = CATEGORY_ICONS[service.category] || Brain;
            
            return (
              <div
                key={service.name}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <IconComp className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{service.name}</p>
                    {service.provider && (
                      <p className="text-xs text-slate-400">{service.provider}</p>
                    )}
                  </div>
                </div>
                {service.status === "connected" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : service.status === "error" ? (
                  <XCircle className="h-5 w-5 text-red-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}