import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePreferences } from "../state/preferences";
import { useProviders } from "@/hooks/useProviders";
import { useOpenAIKey } from "@/hooks/useOpenAIKey";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProviderCard from "@/components/ProviderCard";
import IntegrationStatus from "@/components/IntegrationStatus";
import AITestButton from "@/components/AITestButton";
import OfflineAIDownloader from "@/components/OfflineAIDownloader";
import { PROVIDER_CONFIGS, PROVIDER_CATEGORIES } from "@/types/providers";
import { showError, showSuccess } from "@/utils/toast";
import { getCurrentLocation } from "../services/location";
import { synthesizeSpeech, playAudioBlob } from "../services/openai-voice";
import { OPENAI_VOICES, type OpenAIVoice } from "../types/models";
import { getMemories, deleteMemory, MemoryItem } from "@/services/memory";
import { getChatHistoryStats, clearChatHistory } from "@/services/chat-history";
import { isWakeWordSupported } from "@/services/wake-word-detection";
import { webLLM } from "@/services/web-llm";
import {
  Volume2, Key, Mic, Settings2, Brain, Search, MapPin, CloudSun,
  MessageSquare, Calendar, Shield, Zap, Clock, Globe, User, Bell,
  Trash2, Database, History, Sparkles, AlertCircle, ExternalLink,
  CalendarClock, EarOff, CheckCircle2
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ai: Brain,
  voice: Mic,
  search: Search,
  maps: MapPin,
  weather: CloudSun,
  communication: MessageSquare,
  calendar: Calendar,
};

export default function Settings() {
  const { user } = useAuth();
  const { preferences, setPreferences } = usePreferences();
  const { providers, saveProvider, toggleProvider } = useProviders();
  const { apiKey: openaiApiKey, hasKey: hasOpenAIKey } = useOpenAIKey();
  const [activeTab, setActiveTab] = useState("general");
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [chatStats, setChatStats] = useState<{
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
  }>({ totalMessages: 0, userMessages: 0, assistantMessages: 0 });
  const [loadingMemories, setLoadingMemories] = useState(false);

  useEffect(() => {
    if (user && activeTab === "memory") {
      loadMemories();
      loadChatStats();
    }
  }, [user, activeTab]);

  const loadMemories = async () => {
    if (!user) return;
    setLoadingMemories(true);
    const data = await getMemories(user.id);
    setMemories(data);
    setLoadingMemories(false);
  };

  const loadChatStats = async () => {
    if (!user) return;
    const stats = await getChatHistoryStats(user.id);
    setChatStats(stats);
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!user) return;
    const result = await deleteMemory(user.id, memoryId);
    if (result.success) {
      showSuccess("Memory deleted");
      loadMemories();
    } else {
      showError(result.error || "Failed to delete memory");
    }
  };

  const handleClearChatHistory = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to clear all chat history? This cannot be undone.")) {
      return;
    }
    const result = await clearChatHistory(user.id);
    if (result.success) {
      showSuccess("Chat history cleared");
      loadChatStats();
    } else {
      showError(result.error || "Failed to clear history");
    }
  };

  const testVoice = async () => {
    console.log('[Test Voice] Starting test...');
    console.log('[Test Voice] API key exists:', !!openaiApiKey);
    console.log('[Test Voice] API key length:', openaiApiKey?.length);
    
    if (!openaiApiKey) {
      console.error('[Test Voice] No API key found');
      showError("Please enter your OpenAI API key first in the General tab");
      return;
    }
    
    try {
      const name = preferences.assistantName || "Echo";
      const selectedVoice = preferences.openaiVoice || "nova";
      
      console.log('[Test Voice] Assistant name:', name);
      console.log('[Test Voice] Selected voice:', selectedVoice);
      
      // Get voice description for feedback
      const voiceInfo = OPENAI_VOICES.find(v => v.value === selectedVoice);
      const voiceDescription = voiceInfo ? voiceInfo.description : selectedVoice;
      
      showSuccess("Testing voice... Please wait");
      
      console.log('[Test Voice] Calling synthesizeSpeech...');
      console.log('[Test Voice] API key (first 10 chars):', openaiApiKey.substring(0, 10) + '...');
      
      // Force OpenAI TTS synthesis
      const blob = await synthesizeSpeech(
        `Hello! I'm ${name}, your personal AI assistant. This is the ${voiceDescription} voice. How can I help you today?`,
        openaiApiKey,
        selectedVoice
      );
      
      console.log('[Test Voice] Speech blob received!');
      console.log('[Test Voice] Blob size:', blob.size, 'bytes');
      console.log('[Test Voice] Blob type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Received empty audio blob from OpenAI');
      }
      
      // Stop any currently playing audio first
      const existingAudio = document.querySelectorAll('audio');
      console.log('[Test Voice] Stopping', existingAudio.length, 'existing audio elements');
      existingAudio.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      
      // Play the audio with comprehensive error handling
      console.log('[Test Voice] Creating audio element...');
      const audio = new Audio();
      const url = URL.createObjectURL(blob);
      console.log('[Test Voice] Created blob URL:', url);
      
      audio.src = url;
      audio.volume = 1.0;
      
      console.log('[Test Voice] Audio element created, setting up event listeners...');
      
      audio.onloadstart = () => {
        console.log('[Test Voice] Audio loading started');
      };
      
      audio.onloadeddata = () => {
        console.log('[Test Voice] Audio data loaded');
      };
      
      audio.oncanplay = () => {
        console.log('[Test Voice] Audio can play');
      };
      
      audio.onplay = () => {
        console.log('[Test Voice] Audio playback started!');
        showSuccess(`Playing ${voiceInfo?.label || selectedVoice} voice...`);
      };
      
      audio.onended = () => {
        console.log('[Test Voice] Audio playback ended');
        URL.revokeObjectURL(url);
        showSuccess(`Voice test complete!`);
      };
      
      audio.onerror = (e) => {
        console.error('[Test Voice] Audio playback error:', e);
        console.error('[Test Voice] Audio error code:', audio.error?.code);
        console.error('[Test Voice] Audio error message:', audio.error?.message);
        URL.revokeObjectURL(url);
        showError(`Audio playback failed: ${audio.error?.message || 'Unknown error'}`);
      };
      
      // Attempt to play with detailed logging
      console.log('[Test Voice] Attempting to play audio...');
      try {
        const playPromise = audio.play();
        console.log('[Test Voice] Play promise created');
        
        await playPromise;
        console.log('[Test Voice] Play promise resolved - audio should be playing!');
      } catch (playError: any) {
        console.error('[Test Voice] Play promise rejected:', playError);
        console.error('[Test Voice] Play error name:', playError.name);
        console.error('[Test Voice] Play error message:', playError.message);
        
        // Check if it's an autoplay policy error
        if (playError.name === 'NotAllowedError') {
          showError('Browser blocked audio autoplay. Please click the page first, then try again.');
        } else {
          showError(`Failed to play audio: ${playError.message}`);
        }
        
        URL.revokeObjectURL(url);
      }
      
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Voice test failed";
      console.error("[Test Voice] Outer catch - Error:", e);
      console.error("[Test Voice] Error type:", typeof e);
      console.error("[Test Voice] Error details:", JSON.stringify(e, null, 2));
      showError(`Voice test failed: ${errorMessage}`);
    }
  };

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      showSuccess("Microphone permission granted");
    } catch {
      showError("Microphone permission denied");
    }
  };

  const requestLocation = async () => {
    try {
      showSuccess("Requesting location access...");
      const loc = await getCurrentLocation();
      showSuccess(`Location access granted! Coordinates: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unable to access location";
      console.error("[Settings] Location error:", e);
      showError(errorMessage);
    }
  };

  const getProvidersByCategory = (category: string) => {
    return PROVIDER_CONFIGS.filter(p => p.category === category);
  };

  const getEnabledCount = (category: string) => {
    return providers.filter(p => {
      const config = p.config as Record<string, unknown>;
      return config?.category === category && p.is_enabled;
    }).length;
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-fuchsia-400" />
            Settings
          </h1>
          <p className="text-slate-400 mt-1">Configure your AI assistant and connect services</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="general" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
              <User className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="voice" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
              <Volume2 className="h-4 w-4 mr-2" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="memory" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
              <Brain className="h-4 w-4 mr-2" />
              Memory
            </TabsTrigger>
            <TabsTrigger value="providers" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
              <Zap className="h-4 w-4 mr-2" />
              API Providers
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
              <CalendarClock className="h-4 w-4 mr-2" />
              Scheduling
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <IntegrationStatus />

            {/* User Profile */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-fuchsia-400" />
                  Your Profile
                </CardTitle>
                <CardDescription className="text-slate-400">
                  How the assistant should address you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-slate-300">How would you like the assistant to call you?</Label>
                  <Input
                    className="bg-slate-900 border-slate-700 text-white"
                    placeholder="Your name"
                    value={preferences.preferredName || ""}
                    onChange={(e) => setPreferences({ ...preferences, preferredName: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">
                    This name will appear in greetings and throughout the app
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Assistant Personalization */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-fuchsia-400" />
                  Assistant Personalization
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Customize your AI assistant's identity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-slate-300">Assistant Name</Label>
                  <Input
                    className="bg-slate-900 border-slate-700 text-white"
                    placeholder="Echo"
                    value={preferences.assistantName || "Echo"}
                    onChange={(e) => setPreferences({ ...preferences, assistantName: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">
                    The name your assistant will use when introducing itself
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-fuchsia-500/30 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Key className="h-5 w-5 text-fuchsia-400" />
                  OpenAI API Key
                  <Badge className="ml-2 bg-blue-500/20 text-blue-300 border-blue-500/50">
                    Online Mode
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  For online mode with GPT-4o. Or use Offline AI below for zero-cost, privacy-first operation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-slate-300">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      className="bg-slate-900 border-slate-700 text-white flex-1"
                      placeholder="sk-..."
                      value={preferences.openaiApiKey || ""}
                      onChange={(e) => setPreferences({ ...preferences, openaiApiKey: e.target.value })}
                    />
                    <AITestButton apiKey={preferences.openaiApiKey || ""} provider="openai" />
                  </div>
                  {preferences.openaiApiKey ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>API key configured - all AI features are enabled</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Enter your OpenAI API key to enable voice and chat features</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    Your key is stored locally in your browser. It's only sent to OpenAI's servers when you use AI features.
                    Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:underline">platform.openai.com</a>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-fuchsia-500/30 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-fuchsia-400" />
                  Offline AI Mode
                  <Badge className="ml-2 bg-green-500/20 text-green-300 border-green-500/50">
                    Zero Installation
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Download AI model to your browser for 100% offline operation. No installation required!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-300 font-medium">Privacy-First AI</p>
                      <p className="text-xs text-green-400/80 mt-1">
                        All processing happens in your browser. No data leaves your device. No API costs.
                      </p>
                    </div>
                  </div>
                </div>

                <OfflineAIDownloader />

                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!confirm("Are you sure you want to remove the local AI model? This will free up storage space but you'll need to re-download it to use offline features.")) {
                      return;
                    }
                    try {
                      await webLLM.clearCache();
                      showSuccess("Local AI model removed successfully");
                    } catch (error: any) {
                      showError(error.message || "Failed to remove model");
                    }
                  }}
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Local AI Model
                </Button>

                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-medium">How it works:</p>
                  <ul className="space-y-1 text-xs text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                      Model downloads to browser cache (one-time)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                      Works on iOS, Android, and Desktop
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                      Automatic fallback when offline
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                      Voice commands work without internet
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-fuchsia-400" />
                  Time & Location Awareness
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Help your assistant understand your context
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Time Awareness</Label>
                    <p className="text-sm text-slate-400">
                      Knows the current date, time, and timezone
                    </p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    Always On
                  </Badge>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Location Awareness</Label>
                    <p className="text-sm text-slate-400">
                      Enable for weather, nearby places, and local context
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestLocation}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Grant Access
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Microphone Access</Label>
                    <p className="text-sm text-slate-400">
                      Required for voice conversations
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestMic}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Grant Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Settings */}
          <TabsContent value="voice" className="space-y-6">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-fuchsia-400" />
                  Voice Configuration
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure how {preferences.assistantName || "Echo"} speaks and listens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label className="text-slate-300">Assistant Voice</Label>
                  <Select
                    value={preferences.openaiVoice}
                    onValueChange={(value: OpenAIVoice) => {
                      setPreferences({ ...preferences, openaiVoice: value });
                      const voiceInfo = OPENAI_VOICES.find(v => v.value === value);
                      showSuccess(`Voice changed to ${voiceInfo?.label || value}. Click "Test Voice" to hear it!`);
                    }}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {OPENAI_VOICES.map((voice) => (
                        <SelectItem
                          key={voice.value}
                          value={voice.value}
                          className="text-white hover:bg-slate-800"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{voice.label}</span>
                            <span className="text-xs text-slate-400">{voice.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Current voice: <span className="text-fuchsia-400 font-medium">
                      {OPENAI_VOICES.find(v => v.value === preferences.openaiVoice)?.label || preferences.openaiVoice}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  {/* Debug info */}
                  <div className="p-2 rounded bg-slate-900/50 border border-slate-700">
                    <p className="text-xs text-slate-400">
                      Debug: API Key {hasOpenAIKey ? '✅ Detected' : '❌ Missing'}
                      {openaiApiKey && ` (${openaiApiKey.substring(0, 10)}...)`}
                    </p>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // User interaction required for autoplay
                      console.log('[Test Voice] Button clicked - user interaction registered');
                      console.log('[Test Voice] hasOpenAIKey:', hasOpenAIKey);
                      console.log('[Test Voice] openaiApiKey exists:', !!openaiApiKey);
                      
                      await testVoice();
                    }}
                    className={`w-full font-semibold px-6 py-3 shadow-lg transition-all ${
                      hasOpenAIKey
                        ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-500 cursor-pointer'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600 cursor-pointer'
                    }`}
                    style={{ pointerEvents: 'auto', zIndex: 10 }}
                  >
                    <Volume2 className="mr-2 h-5 w-5" />
                    Test Voice
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Simple beep test to verify audio works
                      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const oscillator = audioContext.createOscillator();
                      const gainNode = audioContext.createGain();
                      
                      oscillator.connect(gainNode);
                      gainNode.connect(audioContext.destination);
                      
                      oscillator.frequency.value = 440; // A4 note
                      gainNode.gain.value = 0.3;
                      
                      oscillator.start();
                      setTimeout(() => {
                        oscillator.stop();
                        showSuccess('If you heard a beep, your audio is working!');
                      }, 200);
                    }}
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    🔊 Test Audio (Beep)
                  </Button>
                  
                  <p className="text-xs text-slate-500 text-center">
                    🔊 Make sure your volume is up and browser tab is not muted
                  </p>
                </div>

                <Separator className="bg-slate-700" />

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Prefer OpenAI Voice</Label>
                    <p className="text-sm text-slate-400">
                      Always use OpenAI TTS instead of browser's built-in voice (recommended for best quality)
                    </p>
                  </div>
                  <Switch
                    checked={preferences.preferOpenAIVoice !== false}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, preferOpenAIVoice: checked })
                    }
                  />
                </div>

                <Separator className="bg-slate-700" />

                <div className="grid gap-3">
                  <Label className="text-slate-300">
                    Voice Speed: {preferences.voiceSpeed?.toFixed(1) || "1.0"}x
                  </Label>
                  <Slider
                    value={[preferences.voiceSpeed || 1.0]}
                    onValueChange={([value]) =>
                      setPreferences({ ...preferences, voiceSpeed: value })
                    }
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="grid gap-3">
                  <Label className="text-slate-300">
                    Silence Timeout: {preferences.silenceTimeout}ms
                  </Label>
                  <Slider
                    value={[preferences.silenceTimeout]}
                    onValueChange={([value]) =>
                      setPreferences({ ...preferences, silenceTimeout: value })
                    }
                    min={500}
                    max={3000}
                    step={100}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Mic className="h-5 w-5 text-fuchsia-400" />
                  Wake Word
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Activate {preferences.assistantName || "Echo"} hands-free with a wake word
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Enable Wake Word</Label>
                    <p className="text-sm text-slate-400">
                      Say "{preferences.wakeWord || "Echo"}" to activate the assistant
                    </p>
                  </div>
                  <Switch
                    checked={preferences.wakeWordEnabled}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, wakeWordEnabled: checked })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-slate-300">Wake Word</Label>
                  <Input
                    className="bg-slate-900 border-slate-700 text-white"
                    placeholder="Echo"
                    value={preferences.wakeWord || "Echo"}
                    onChange={(e) => setPreferences({ ...preferences, wakeWord: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">
                    Choose a unique word that's easy to say. Examples: "Echo", "Hey Assistant", "Computer"
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-300 font-medium">Always-On Assistant</p>
                      <p className="text-xs text-blue-400/80 mt-1">
                        When enabled, {preferences.assistantName || "Echo"} listens continuously for the wake word. Say "{preferences.wakeWord || "Echo"}" anytime to activate.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Memory & Knowledge Settings */}
          <TabsContent value="memory" className="space-y-6">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-fuchsia-400" />
                  Memory
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Things {preferences.assistantName || "Echo"} remembers about you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Enable Memory</Label>
                    <p className="text-sm text-slate-400">
                      Allow {preferences.assistantName || "Echo"} to remember important information
                    </p>
                  </div>
                  <Switch
                    checked={preferences.enableMemory}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, enableMemory: checked })
                    }
                  />
                </div>

                <p className="text-sm text-slate-400">
                  Say things like "Remember that my favorite color is blue" or "Save this: my doctor's name is Dr. Smith"
                </p>

                <Separator className="bg-slate-700" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">Saved Memories ({memories.length})</h4>
                    {loadingMemories && <span className="text-xs text-slate-500">Loading...</span>}
                  </div>
                  
                  {memories.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">
                      No memories saved yet. Ask {preferences.assistantName || "Echo"} to remember something!
                    </p>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {memories.map((memory) => (
                          <div
                            key={memory.id}
                            className="flex items-start justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{memory.key}</p>
                              <p className="text-xs text-slate-400 truncate">{memory.value}</p>
                              <Badge variant="outline" className="mt-1 text-[10px] border-slate-600 text-slate-500">
                                {memory.category}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMemory(memory.id)}
                              className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Providers */}
          <TabsContent value="providers" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {PROVIDER_CATEGORIES.map(cat => {
                const IconComp = CATEGORY_ICONS[cat.key] || Zap;
                const enabledCount = getEnabledCount(cat.key);
                const totalCount = getProvidersByCategory(cat.key).length;
                
                return (
                  <Card
                    key={cat.key}
                    className="border-slate-700 bg-slate-800/30 cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => {
                      const element = document.getElementById(`category-${cat.key}`);
                      element?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${enabledCount > 0 ? "bg-fuchsia-500/20" : "bg-slate-700"}`}>
                        <IconComp className={`h-5 w-5 ${enabledCount > 0 ? "text-fuchsia-400" : "text-slate-400"}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{cat.label}</p>
                        <p className="text-xs text-slate-400">
                          {enabledCount} of {totalCount} enabled
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8">
                {PROVIDER_CATEGORIES.map(cat => (
                  <div key={cat.key} id={`category-${cat.key}`}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      {(() => {
                        const IconComp = CATEGORY_ICONS[cat.key] || Zap;
                        return <IconComp className="h-5 w-5 text-fuchsia-400" />;
                      })()}
                      {cat.label}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {getProvidersByCategory(cat.key).map(config => (
                        <ProviderCard
                          key={config.name}
                          config={config}
                          provider={providers.find(p => p.provider_name === config.name)}
                          onSave={saveProvider}
                          onToggle={toggleProvider}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Smart Scheduling Settings */}
          <TabsContent value="scheduling" className="space-y-6">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-fuchsia-400" />
                  Smart Scheduling
                </CardTitle>
                <CardDescription className="text-slate-400">
                  AI-powered scheduling with conflict detection and pattern learning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Enable Smart Scheduling</Label>
                    <p className="text-sm text-slate-400">
                      Automatically check for conflicts and suggest optimal times
                    </p>
                  </div>
                  <Switch
                    checked={preferences.enableSmartScheduling}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, enableSmartScheduling: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-fuchsia-400" />
                  Privacy & Security
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Control your data and access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Private Mode</Label>
                    <p className="text-sm text-slate-400">
                      Disables conversation history logging
                    </p>
                  </div>
                  <Switch
                    checked={preferences.privateMode}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, privateMode: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-fuchsia-400" />
                  Data Management
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Export, import, and manage your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Backup & Export</Label>
                    <p className="text-sm text-slate-400">
                      Download all your data as a backup file
                    </p>
                  </div>
                  <Link to="/data-management">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Manage Data
                    </Button>
                  </Link>
                </div>

                <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-300 font-medium">Your Data is Safe</p>
                      <p className="text-xs text-blue-400/80 mt-1">
                        All data is stored securely with Row Level Security. You can export and delete your data anytime.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}