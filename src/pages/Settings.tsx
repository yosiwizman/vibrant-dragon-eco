import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePreferences } from "../state/preferences";
import { useProviders } from "@/hooks/useProviders";
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
import { PROVIDER_CONFIGS, PROVIDER_CATEGORIES } from "@/types/providers";
import { showError, showSuccess } from "@/utils/toast";
import { getCurrentLocation } from "../services/location";
import { synthesizeSpeech, playAudioBlob } from "../services/openai-voice";
import { OPENAI_VOICES, type OpenAIVoice } from "../types/models";
import { getMemories, deleteMemory, MemoryItem } from "@/services/memory";
import { getChatHistoryStats, clearChatHistory } from "@/services/chat-history";
import { isWakeWordSupported } from "@/services/wake-word-detection";
import {
  Volume2, Key, Mic, Settings2, Brain, Search, MapPin, CloudSun,
  MessageSquare, Calendar, Shield, Zap, Clock, Globe, User, Bell,
  Trash2, Database, History, Sparkles, AlertCircle, ExternalLink,
  CalendarClock, EarOff
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
    if (!preferences.openaiApiKey) {
      showError("Please enter your OpenAI API key first");
      return;
    }
    try {
      const name = preferences.assistantName || "Echo";
      const blob = await synthesizeSpeech(
        `Hello! I'm ${name}, your personal AI assistant. How can I help you today?`,
        preferences.openaiApiKey,
        preferences.openaiVoice
      );
      await playAudioBlob(blob);
      showSuccess("Voice test successful!");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Voice test failed";
      showError(errorMessage);
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
      const loc = await getCurrentLocation();
      showSuccess(`Location access granted: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Location permission denied";
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

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Key className="h-5 w-5 text-fuchsia-400" />
                  OpenAI Configuration
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Your primary AI provider for chat, voice, and transcription
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
                  <p className="text-xs text-slate-500">
                    Stored locally. Never sent anywhere except OpenAI.
                  </p>
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
                    onValueChange={(value: OpenAIVoice) =>
                      setPreferences({ ...preferences, openaiVoice: value })
                    }
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
                </div>

                <Button
                  onClick={testVoice}
                  className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                  disabled={!preferences.openaiApiKey}
                >
                  <Volume2 className="mr-2 h-4 w-4" />
                  Test Voice
                </Button>

                <Separator className="bg-slate-700" />

                {/* Wake Word Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Mic className="h-5 w-5 text-fuchsia-400" />
                    Wake Word (Hands-Free)
                  </h3>
                  
                  <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                    <div>
                      <Label className="text-white">Enable Wake Word</Label>
                      <p className="text-sm text-slate-400">
                        Say "{preferences.wakeWord || "Echo"}" to activate voice
                      </p>
                    </div>
                    <Switch
                      checked={preferences.wakeWordEnabled}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, wakeWordEnabled: checked })
                      }
                      disabled={!isWakeWordSupported()}
                    />
                  </div>

                  {!isWakeWordSupported() && (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Wake word detection is not supported in this browser
                    </div>
                  )}

                  {preferences.wakeWordEnabled && (
                    <div className="grid gap-2">
                      <Label className="text-slate-300">Wake Word</Label>
                      <Input
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="echo"
                        value={preferences.wakeWord || "echo"}
                        onChange={(e) =>
                          setPreferences({ ...preferences, wakeWord: e.target.value.toLowerCase() })
                        }
                      />
                      <p className="text-xs text-slate-500">
                        Say "Hey {preferences.wakeWord || "echo"}" or "OK {preferences.wakeWord || "echo"}" to activate
                      </p>
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-700" />

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Continuous Conversation</Label>
                    <p className="text-sm text-slate-400">
                      Auto-listen after {preferences.assistantName || "Echo"} responds
                    </p>
                  </div>
                  <Switch
                    checked={preferences.conversationMode}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, conversationMode: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Auto-Listen After Speech</Label>
                    <p className="text-sm text-slate-400">
                      Automatically start listening after speaking finishes
                    </p>
                  </div>
                  <Switch
                    checked={preferences.autoListenAfterSpeech}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, autoListenAfterSpeech: checked })
                    }
                  />
                </div>

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

                <Separator className="bg-slate-700" />

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Voice Feedback Sounds</Label>
                    <p className="text-sm text-slate-400">
                      Play audio cues when starting/stopping listening
                    </p>
                  </div>
                  <Switch
                    checked={preferences.voiceFeedbackEnabled}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, voiceFeedbackEnabled: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Memory & Knowledge Settings */}
          <TabsContent value="memory" className="space-y-6">
            {/* Knowledge Base Link */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-fuchsia-400" />
                  Knowledge Base (RAG)
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Upload documents and files for {preferences.assistantName || "Echo"} to reference
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Enable Knowledge Base</Label>
                    <p className="text-sm text-slate-400">
                      Use your stored documents to enhance AI responses
                    </p>
                  </div>
                  <Switch
                    checked={preferences.enableRAGKnowledge}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, enableRAGKnowledge: checked })
                    }
                  />
                </div>

                <Link to="/knowledge-base">
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Knowledge Base
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Memory Settings */}
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

            {/* Chat History Settings */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-fuchsia-400" />
                  Chat History
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Conversation history with {preferences.assistantName || "Echo"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Save Chat History</Label>
                    <p className="text-sm text-slate-400">
                      Store conversations for context and reference
                    </p>
                  </div>
                  <Switch
                    checked={preferences.enableChatHistory}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, enableChatHistory: checked })
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-center">
                    <p className="text-2xl font-bold text-white">{chatStats.totalMessages}</p>
                    <p className="text-xs text-slate-500">Total Messages</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-center">
                    <p className="text-2xl font-bold text-white">{chatStats.userMessages}</p>
                    <p className="text-xs text-slate-500">Your Messages</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-center">
                    <p className="text-2xl font-bold text-white">{chatStats.assistantMessages}</p>
                    <p className="text-xs text-slate-500">Assistant</p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-slate-300">
                    History Limit: {preferences.chatHistoryLimit} messages
                  </Label>
                  <Slider
                    value={[preferences.chatHistoryLimit]}
                    onValueChange={([value]) =>
                      setPreferences({ ...preferences, chatHistoryLimit: value })
                    }
                    min={10}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500">
                    Number of recent messages to include in AI context
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={handleClearChatHistory}
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Chat History
                </Button>
              </CardContent>
            </Card>

            {/* Advanced Features */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-fuchsia-400" />
                  Advanced Features
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Enable advanced AI capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">Multi-Step Conversations</Label>
                    <p className="text-sm text-slate-400">
                      Allow {preferences.assistantName || "Echo"} to ask follow-up questions
                    </p>
                  </div>
                  <Switch
                    checked={preferences.enableMultiStepConversations}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, enableMultiStepConversations: checked })
                    }
                  />
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

                <div className="grid gap-3">
                  <Label className="text-slate-300">
                    Default Reminder Lead Time: {preferences.defaultReminderLeadTime} minutes
                  </Label>
                  <Slider
                    value={[preferences.defaultReminderLeadTime]}
                    onValueChange={([value]) =>
                      setPreferences({ ...preferences, defaultReminderLeadTime: value })
                    }
                    min={5}
                    max={60}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500">
                    How early to remind you before scheduled events
                  </p>
                </div>

                <Separator className="bg-slate-700" />

                <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <h4 className="text-sm font-medium text-white mb-2">What Smart Scheduling Does</h4>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      <span>Detects scheduling conflicts before you create events</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Brain className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                      <span>Learns your routines and suggests optimal times</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Bell className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                      <span>Creates automatic reminders for recurring activities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                      <span>Warns about back-to-back meetings and insufficient time</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 p-4">
                  <h4 className="text-sm font-medium text-fuchsia-300 mb-2">Voice Commands</h4>
                  <ul className="space-y-1 text-sm text-slate-300">
                    <li>"Schedule a meeting tomorrow at 2pm" - checks conflicts first</li>
                    <li>"When should I do this task?" - suggests optimal times</li>
                    <li>"Remember I pick up my daughter Wednesdays at 2pm" - creates pattern</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <EarOff className="h-5 w-5 text-purple-400" />
                  Quiet / Listening Mode
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Let {preferences.assistantName || "Echo"} listen silently and summarize later
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-slate-300">Exit Phrase</Label>
                  <Input
                    className="bg-slate-900 border-slate-700 text-white"
                    placeholder="Echo summarize"
                    value={preferences.quietModeExitPhrase}
                    onChange={(e) =>
                      setPreferences({ ...preferences, quietModeExitPhrase: e.target.value })
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Say this phrase to exit quiet mode and get a summary
                  </p>
                </div>

                <Separator className="bg-slate-700" />

                <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <h4 className="text-sm font-medium text-white mb-2">How Quiet Mode Works</h4>
                  <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
                    <li>Say "Go quiet" or "Listening mode" to enter</li>
                    <li>{preferences.assistantName || "Echo"} will listen without interrupting</li>
                    <li>Perfect for meetings, conversations, or lectures</li>
                    <li>Say "{preferences.quietModeExitPhrase || "Echo summarize"}" to get a summary</li>
                    <li>Receive bullet points and action items from the conversation</li>
                  </ol>
                </div>

                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
                  <h4 className="text-sm font-medium text-purple-300 mb-2">Entry Phrases</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Go quiet", "Listening mode", "Just listen", "Meeting mode", "Don't interrupt"].map((phrase) => (
                      <Badge
                        key={phrase}
                        variant="outline"
                        className="border-purple-500/50 text-purple-300"
                      >
                        "{phrase}"
                      </Badge>
                    ))}
                  </div>
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

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-white">PIN Protection</Label>
                    <p className="text-sm text-slate-400">
                      Require PIN to access {preferences.assistantName || "Echo"}
                    </p>
                  </div>
                  <Switch
                    checked={preferences.pinEnabled}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, pinEnabled: checked })
                    }
                  />
                </div>

                {preferences.pinEnabled && (
                  <div className="grid gap-2">
                    <Label className="text-slate-300">PIN Code</Label>
                    <Input
                      type="password"
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="Enter PIN"
                      value={preferences.pinCode || ""}
                      onChange={(e) =>
                        setPreferences({ ...preferences, pinCode: e.target.value })
                      }
                    />
                  </div>
                )}

                <Separator className="bg-slate-700" />

                <div className="grid gap-2">
                  <Label className="text-slate-300">Brain API URL (Optional)</Label>
                  <Input
                    className="bg-slate-900 border-slate-700 text-white"
                    placeholder="https://your-brain.example/v1"
                    value={preferences.baseUrl}
                    onChange={(e) =>
                      setPreferences({ ...preferences, baseUrl: e.target.value })
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Custom backend for advanced users. Leave empty to use OpenAI directly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}