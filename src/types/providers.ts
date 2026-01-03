export interface APIProvider {
  id: string;
  provider_name: string;
  api_key?: string;
  api_secret?: string;
  endpoint_url?: string;
  is_enabled: boolean;
  config: Record<string, any>;
}

export interface ProviderConfig {
  name: string;
  displayName: string;
  category: "ai" | "voice" | "search" | "maps" | "communication" | "weather" | "calendar";
  description: string;
  icon: string;
  fields: ProviderField[];
  docsUrl?: string;
}

export interface ProviderField {
  key: string;
  label: string;
  type: "text" | "password" | "url" | "select" | "boolean";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export const PROVIDER_CONFIGS: ProviderConfig[] = [
  // AI Providers
  {
    name: "openai",
    displayName: "OpenAI",
    category: "ai",
    description: "GPT-4, Whisper STT, TTS voices",
    icon: "Brain",
    docsUrl: "https://platform.openai.com/docs",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "sk-...", required: true },
      { key: "model", label: "Chat Model", type: "select", options: [
        { value: "gpt-4o", label: "GPT-4o (Recommended)" },
        { value: "gpt-4o-mini", label: "GPT-4o Mini (Faster)" },
        { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
        { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Budget)" },
      ]},
      { key: "voice", label: "TTS Voice", type: "select", options: [
        { value: "nova", label: "Nova (Female, Warm)" },
        { value: "alloy", label: "Alloy (Neutral)" },
        { value: "echo", label: "Echo (Male)" },
        { value: "fable", label: "Fable (British)" },
        { value: "onyx", label: "Onyx (Deep Male)" },
        { value: "shimmer", label: "Shimmer (Female)" },
      ]},
    ],
  },
  {
    name: "anthropic",
    displayName: "Anthropic Claude",
    category: "ai",
    description: "Claude 3.5 Sonnet, Claude 3 Opus",
    icon: "Sparkles",
    docsUrl: "https://docs.anthropic.com",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "sk-ant-...", required: true },
      { key: "model", label: "Model", type: "select", options: [
        { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (Recommended)" },
        { value: "claude-3-opus-20240229", label: "Claude 3 Opus (Most Capable)" },
        { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku (Fast)" },
      ]},
    ],
  },
  // Voice Providers
  {
    name: "resemble",
    displayName: "Resemble AI",
    category: "voice",
    description: "Custom voice cloning and synthesis",
    icon: "Mic",
    docsUrl: "https://docs.resemble.ai/welcome",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true },
      { key: "project_uuid", label: "Project UUID", type: "text" },
      { key: "voice_uuid", label: "Voice UUID", type: "text" },
    ],
  },
  {
    name: "elevenlabs",
    displayName: "ElevenLabs",
    category: "voice",
    description: "Ultra-realistic voice synthesis",
    icon: "Volume2",
    docsUrl: "https://docs.elevenlabs.io",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true },
      { key: "voice_id", label: "Voice ID", type: "text", placeholder: "21m00Tcm4TlvDq8ikWAM" },
      { key: "model_id", label: "Model", type: "select", options: [
        { value: "eleven_multilingual_v2", label: "Multilingual v2 (Best)" },
        { value: "eleven_turbo_v2", label: "Turbo v2 (Fastest)" },
        { value: "eleven_monolingual_v1", label: "English v1" },
      ]},
    ],
  },
  {
    name: "deepgram",
    displayName: "Deepgram",
    category: "voice",
    description: "Fast, accurate speech-to-text",
    icon: "AudioLines",
    docsUrl: "https://developers.deepgram.com",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true },
      { key: "model", label: "Model", type: "select", options: [
        { value: "nova-2", label: "Nova 2 (Best)" },
        { value: "nova", label: "Nova" },
        { value: "enhanced", label: "Enhanced" },
      ]},
    ],
  },
  // Search Providers
  {
    name: "serper",
    displayName: "Serper (Google Search)",
    category: "search",
    description: "Google Search API for web results",
    icon: "Search",
    docsUrl: "https://serper.dev/docs",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true },
    ],
  },
  {
    name: "brave_search",
    displayName: "Brave Search",
    category: "search",
    description: "Privacy-focused web search",
    icon: "Shield",
    docsUrl: "https://brave.com/search/api/",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true },
    ],
  },
  {
    name: "tavily",
    displayName: "Tavily",
    category: "search",
    description: "AI-optimized search API",
    icon: "Zap",
    docsUrl: "https://docs.tavily.com",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true },
    ],
  },
  // Maps & Location
  {
    name: "google_maps",
    displayName: "Google Maps",
    category: "maps",
    description: "Places, Directions, Geocoding",
    icon: "MapPin",
    docsUrl: "https://developers.google.com/maps",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true },
    ],
  },
  {
    name: "mapbox",
    displayName: "Mapbox",
    category: "maps",
    description: "Maps, Navigation, Geocoding",
    icon: "Map",
    docsUrl: "https://docs.mapbox.com",
    fields: [
      { key: "api_key", label: "Access Token", type: "password", required: true },
    ],
  },
  // Weather
  {
    name: "openweathermap",
    displayName: "OpenWeatherMap",
    category: "weather",
    description: "Weather data and forecasts",
    icon: "CloudSun",
    docsUrl: "https://openweathermap.org/api",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true },
    ],
  },
  {
    name: "weatherapi",
    displayName: "WeatherAPI",
    category: "weather",
    description: "Real-time weather and forecasts",
    icon: "Cloud",
    docsUrl: "https://www.weatherapi.com/docs/",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true },
    ],
  },
  // Communication
  {
    name: "twilio",
    displayName: "Twilio",
    category: "communication",
    description: "SMS, Voice calls, WhatsApp",
    icon: "Phone",
    docsUrl: "https://www.twilio.com/docs",
    fields: [
      { key: "account_sid", label: "Account SID", type: "text", required: true },
      { key: "api_key", label: "Auth Token", type: "password", required: true },
      { key: "phone_number", label: "Phone Number", type: "text", placeholder: "+1234567890" },
    ],
  },
  {
    name: "sendgrid",
    displayName: "SendGrid",
    category: "communication",
    description: "Email delivery service",
    icon: "Mail",
    docsUrl: "https://docs.sendgrid.com",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true },
      { key: "from_email", label: "From Email", type: "text", placeholder: "noreply@yourdomain.com" },
    ],
  },
  {
    name: "gmail",
    displayName: "Gmail API",
    category: "communication",
    description: "Send and read emails via Gmail",
    icon: "Mail",
    docsUrl: "https://developers.google.com/gmail/api",
    fields: [
      { key: "client_id", label: "Client ID", type: "text", required: true },
      { key: "client_secret", label: "Client Secret", type: "password", required: true },
      { key: "refresh_token", label: "Refresh Token", type: "password" },
    ],
  },
  // Calendar
  {
    name: "google_calendar",
    displayName: "Google Calendar",
    category: "calendar",
    description: "Sync events with Google Calendar",
    icon: "Calendar",
    docsUrl: "https://developers.google.com/calendar",
    fields: [
      { key: "client_id", label: "Client ID", type: "text", required: true },
      { key: "client_secret", label: "Client Secret", type: "password", required: true },
      { key: "refresh_token", label: "Refresh Token", type: "password" },
    ],
  },
];

export const PROVIDER_CATEGORIES = [
  { key: "ai", label: "AI & Language Models", icon: "Brain" },
  { key: "voice", label: "Voice & Speech", icon: "Mic" },
  { key: "search", label: "Web Search", icon: "Search" },
  { key: "maps", label: "Maps & Location", icon: "MapPin" },
  { key: "weather", label: "Weather", icon: "CloudSun" },
  { key: "communication", label: "Communication", icon: "MessageSquare" },
  { key: "calendar", label: "Calendar", icon: "Calendar" },
];