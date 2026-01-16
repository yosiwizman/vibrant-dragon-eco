"use client";

import { useState, useEffect } from "react";
import { 
  Brain, 
  Mic, 
  MicOff, 
  Languages, 
  Users2, 
  ShieldCheck,
  Search,
  MessageSquare,
  ListChecks,
  Settings,
  Activity,
  Volume2,
  Clock,
  Trash2,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useSecondBrain } from "@/hooks/useSecondBrain";
import { speakerIdentification } from "@/services/second-brain/speaker-identification";
import { whisperMode } from "@/services/second-brain/whisper-mode";
import { translationService } from "@/services/second-brain/translation";
import { toast } from "sonner";
import SecondBrainVoiceCommands from "@/components/SecondBrainVoiceCommands";

export default function SecondBrain() {
  const [state, actions] = useSecondBrain();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [whisperVolume, setWhisperVolume] = useState(30);
  const [whisperRate, setWhisperRate] = useState(120);

  // Load speakers
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeakers(speakerIdentification.getAllSpeakers());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    const results = await actions.searchConversations(searchQuery);
    setSearchResults(results);
    toast.success(`Found ${results.length} conversations`);
  };

  // Handle whisper volume change
  const handleVolumeChange = (value: number[]) => {
    const vol = value[0];
    setWhisperVolume(vol);
    whisperMode.setVolume(vol / 100);
  };

  // Handle whisper rate change
  const handleRateChange = (value: number[]) => {
    const rate = value[0];
    setWhisperRate(rate);
    whisperMode.setRate(rate / 100);
  };

  // Test whisper
  const testWhisper = () => {
    whisperMode.whisper("This is a test whisper. Can you hear me clearly?", "normal");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${state.isActive ? 'bg-purple-500/20' : 'bg-slate-700/50'}`}>
              <Brain className={`h-8 w-8 ${state.isActive ? 'text-purple-400' : 'text-slate-400'}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Second Brain</h1>
              <p className="text-slate-400">
                {state.isActive ? 'Active and listening' : 'Inactive'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => state.isActive ? actions.stop() : actions.start()}
            className={state.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}
          >
            {state.isActive ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Stop Second Brain
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Start Second Brain
              </>
            )}
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatusCard
            icon={state.isPrivacyMode ? MicOff : Mic}
            title="Listening"
            value={state.isPrivacyMode ? 'Privacy Mode' : state.isActive ? 'Active' : 'Inactive'}
            color={state.isPrivacyMode ? 'yellow' : state.isActive ? 'green' : 'slate'}
          />
          <StatusCard
            icon={Users2}
            title="Speakers"
            value={`${state.speakerCount} detected`}
            color="blue"
          />
          <StatusCard
            icon={MessageSquare}
            title="Segments"
            value={`${state.segmentCount} captured`}
            color="purple"
          />
          <StatusCard
            icon={Activity}
            title="Fact Checking"
            value={state.isFactCheckingEnabled ? 'Enabled' : 'Disabled'}
            color={state.isFactCheckingEnabled ? 'green' : 'slate'}
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="conversations" className="space-y-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="speakers">Speakers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Conversations Tab */}
          <TabsContent value="conversations">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Conversation Search</CardTitle>
                <CardDescription>
                  Search through your indexed conversations by keyword, person, or topic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-slate-900/50 border-slate-600"
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Users2 className="h-4 w-4 text-purple-400" />
                            <span className="font-medium text-white">
                              {result.speakerName || 'Unknown Speaker'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(result.startTime).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{result.summary}</p>
                        <div className="flex gap-2">
                          {result.topics?.map((topic: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No conversations found</p>
                    <p className="text-sm">Start the Second Brain to capture conversations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Speakers Tab */}
          <TabsContent value="speakers">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Detected Speakers</CardTitle>
                <CardDescription>
                  People detected in your conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {speakers.length > 0 ? (
                  <div className="space-y-4">
                    {speakers.map((speaker) => (
                      <div
                        key={speaker.id}
                        className="p-4 rounded-lg bg-slate-900/50 border border-slate-700 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Users2 className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {speaker.name || `Speaker ${speaker.id.slice(-4)}`}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Clock className="h-3 w-3" />
                              <span>Last seen: {new Date(speaker.lastSeen).toLocaleTimeString()}</span>
                              {speaker.language && (
                                <>
                                  <Languages className="h-3 w-3 ml-2" />
                                  <span>{translationService.getLanguageName(speaker.language)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {speaker.conversationCount} conversations
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Users2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No speakers detected yet</p>
                    <p className="text-sm">Start the Second Brain to detect speakers</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Whisper Settings */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-purple-400" />
                    Whisper Mode
                  </CardTitle>
                  <CardDescription>
                    Configure how Echo whispers to you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">
                      Volume: {whisperVolume}%
                    </label>
                    <Slider
                      value={[whisperVolume]}
                      onValueChange={handleVolumeChange}
                      min={10}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">
                      Speaking Rate: {whisperRate}%
                    </label>
                    <Slider
                      value={[whisperRate]}
                      onValueChange={handleRateChange}
                      min={50}
                      max={200}
                      step={10}
                    />
                  </div>
                  <Button variant="outline" onClick={testWhisper} className="w-full">
                    Test Whisper
                  </Button>
                </CardContent>
              </Card>

              {/* Feature Toggles */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-400" />
                    Features
                  </CardTitle>
                  <CardDescription>
                    Enable or disable Second Brain features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-300">Real-time Fact Checking</span>
                    </div>
                    <Switch
                      checked={state.isFactCheckingEnabled}
                      onCheckedChange={(checked) =>
                        checked ? actions.enableFactChecking() : actions.disableFactChecking()
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-300">Auto Translation</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-300">Auto List Capture</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users2 className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-300">Speaker Recognition</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Voice Commands */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mic className="h-5 w-5 text-purple-400" />
                    Voice Commands
                  </CardTitle>
                  <CardDescription>
                    Control Second Brain with your voice
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SecondBrainVoiceCommands />
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Data Management</CardTitle>
                  <CardDescription>
                    Manage your Second Brain data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Conversations
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-400 border-red-500/50 hover:bg-red-500/10"
                    onClick={() => {
                      actions.clearMemory();
                      speakerIdentification.clearSpeakers();
                      toast.success('Memory cleared');
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  color: 'green' | 'yellow' | 'blue' | 'purple' | 'slate';
}) {
  const colorClasses = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    slate: 'bg-slate-700/50 text-slate-400 border-slate-600/50',
  };

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <div>
            <p className="text-xs opacity-70">{title}</p>
            <p className="font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}