import { useState } from "react";
import { usePreferences } from "../state/preferences";
import { useProviders } from "@/hooks/useProviders";
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
import {
  Volume2, Key, Mic, Settings2, Brain, Search, MapPin, CloudSun,
  MessageSquare, Calendar, Shield, Zap, Clock, Globe, User, Bell
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  ai: Brain,
  voice: Mic,
  search: Search,
  maps: MapPin,
  weather: CloudSun,
  communication: MessageSquare,
  calendar: Calendar,
};

export default function Settings() {
  const { preferences, setPreferences } = usePreferences();
  const { providers, loading, saveProvider, toggleProvider } = useProviders();
  const [activeTab, setActiveTab] = useState("general");

  const testVoice = async () => {
    if (!preferences.openaiApiKey) {
      showError("Please enter your OpenAI API key first");
      return;
    }
    try {
      const blob = await synthesizeSpeech(
        "Hello! I'm Echo, your personal AI assistant. How can I help you today?",
        preferences.openaiApiKey,
        preferences.openaiVoice
      );
      await playAudioBlob(blob);
      showSuccess("Voice test successful!");
    } catch (e: any) {
      showError(e.message || "Voice test failed");
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
    } catch (e: any) {
      showError(e.message || "Location permission denied");
    }
  };

  const getProvidersByCategory = (category: string) => {
    return PROVIDER_CONFIGS.filter(p => p.category === category);
  };

  const getEnabledCount = (category: string) => {
    return providers.filter(p => {
      const config = p.config as any;
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
            <TabsTrigger value="providers" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
              <Zap className="h-4 w-4 mr-2" />
              API Providers
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            {/* Integration Status Overview */}
            <IntegrationStatus />

            <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
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
                      className="bg-slate-800 border-slate-700 text-white flex-1"
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

            <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-fuchsia-400" />
                  Time & Location Awareness
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Help Echo understand your context
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <div>
                    <Label className="text-white">Time Awareness</Label>
                    <p className="text-sm text-slate-400">
                      Echo knows the current date, time, and timezone
                    </p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    Always On
                  </Badge>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
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
                    className="border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-500/20"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Grant Access
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
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
                    className="border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-500/20"
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
            <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-fuchsia-400" />
                  Voice Configuration
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure how Echo speaks and listens
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
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {OPENAI_VOICES.map((voice) => (
                        <SelectItem
                          key={voice.value}
                          value={voice.value}
                          className="text-white hover:bg-slate-700"
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

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <div>
                    <Label className="text-white">Continuous Conversation</Label>
                    <p className="text-sm text-slate-400">
                      Auto-listen after Echo responds
                    </p>
                  </div>
                  <Switch
                    checked={preferences.conversationMode}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, conversationMode: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <div>
                    <Label className="text-white">Auto-Listen After Speech</Label>
                    <p className="text-sm text-slate-400">
                      Automatically start listening after Echo finishes speaking
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
                  <p className="text-xs text-slate-500">
                    Adjust how fast Echo speaks (0.5x - 2.0x)
                  </p>
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
                  <p className="text-xs text-slate-500">
                    How long to wait after you stop speaking before processing
                  </p>
                </div>

                <div className="grid gap-3">
                  <Label className="text-slate-300">
                    Silence Sensitivity: {((1 - (preferences.silenceThreshold || 0.01)) * 100).toFixed(0)}%
                  </Label>
                  <Slider
                    value={[1 - (preferences.silenceThreshold || 0.01)]}
                    onValueChange={([value]) =>
                      setPreferences({ ...preferences, silenceThreshold: 1 - value })
                    }
                    min={0.9}
                    max={0.99}
                    step={0.01}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500">
                    Higher = more sensitive to quiet speech
                  </p>
                </div>

                <Separator className="bg-slate-700" />

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
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

                {preferences.voiceFeedbackEnabled && (
                  <div className="grid gap-3">
                    <Label className="text-slate-300">
                      Feedback Volume: {Math.round((preferences.voiceFeedbackVolume || 0.5) * 100)}%
                    </Label>
                    <Slider
                      value={[preferences.voiceFeedbackVolume || 0.5]}
                      onValueChange={([value]) =>
                        setPreferences({ ...preferences, voiceFeedbackVolume: value })
                      }
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-fuchsia-400" />
                  Advanced Features
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Enable advanced AI capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <div>
                    <Label className="text-white">Multi-Step Conversations</Label>
                    <p className="text-sm text-slate-400">
                      Allow Echo to ask follow-up questions for complex tasks
                    </p>
                  </div>
                  <Switch
                    checked={preferences.enableMultiStepConversations}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, enableMultiStepConversations: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <div>
                    <Label className="text-white">Knowledge Base (RAG)</Label>
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

                <div className="grid gap-2">
                  <Label className="text-slate-300">Wake Word</Label>
                  <Input
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="echo"
                    value={preferences.wakeWord || "echo"}
                    onChange={(e) =>
                      setPreferences({ ...preferences, wakeWord: e.target.value.toLowerCase() })
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Say this word to activate voice (experimental)
                  </p>
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

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
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
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
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

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <div>
                    <Label className="text-white">PIN Protection</Label>
                    <p className="text-sm text-slate-400">
                      Require PIN to access Echo
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
                      className="bg-slate-800 border-slate-700 text-white"
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
                    className="bg-slate-800 border-slate-700 text-white"
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