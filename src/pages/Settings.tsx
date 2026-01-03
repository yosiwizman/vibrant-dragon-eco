import { usePreferences } from "../state/preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { showError, showSuccess } from "@/utils/toast";
import { getCurrentLocation } from "../services/location";
import { synthesizeSpeech, playAudioBlob } from "../services/openai-voice";
import { OPENAI_VOICES, type OpenAIVoice } from "../types/models";
import { Volume2, Key, Mic, Settings2 } from "lucide-react";

export default function Settings() {
  const { preferences, setPreferences } = usePreferences();

  const testBrain = async () => {
    if (!preferences.baseUrl) {
      showError("Set BASE_URL first");
      return;
    }
    try {
      const res = await fetch(`${preferences.baseUrl}/v1/brain/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] }),
      });
      showSuccess(res.ok ? "Brain API reachable" : `Brain API error: ${res.status}`);
    } catch {
      showError("Brain API unreachable");
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
      await getCurrentLocation();
      showSuccess("Location permission granted");
    } catch (e: any) {
      showError(e.message || "Location permission denied");
    }
  };

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

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* OpenAI Voice Settings */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Volume2 className="h-6 w-6 text-fuchsia-400" />
              Voice Settings
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure OpenAI voice for speech-to-text and text-to-speech.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="openaiKey" className="text-slate-300 flex items-center gap-2">
                <Key className="h-4 w-4" />
                OpenAI API Key
              </Label>
              <Input
                id="openaiKey"
                type="password"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                placeholder="sk-..."
                value={preferences.openaiApiKey || ""}
                onChange={(e) =>
                  setPreferences({ ...preferences, openaiApiKey: e.target.value })
                }
              />
              <p className="text-xs text-slate-500">
                Your API key is stored locally and never sent to any server except OpenAI.
              </p>
            </div>

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
                      className="text-white hover:bg-slate-700 focus:bg-slate-700"
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
          </CardContent>
        </Card>

        {/* Conversation Mode Settings */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Mic className="h-5 w-5 text-fuchsia-400" />
              Conversation Mode
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure hands-free conversation settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div>
                <Label className="text-white">Continuous Conversation</Label>
                <p className="text-sm text-slate-400">
                  Automatically listen after Echo responds (like ChatGPT voice mode).
                </p>
              </div>
              <Switch
                checked={preferences.conversationMode}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, conversationMode: checked })
                }
              />
            </div>

            <div className="grid gap-3">
              <Label className="text-slate-300">
                Silence Detection Timeout: {preferences.silenceTimeout}ms
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
                How long to wait after you stop speaking before processing.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Backend Settings */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-fuchsia-400" />
              Backend & Privacy
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure Echo's backend and privacy settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="baseUrl" className="text-slate-300">Brain API Base URL (Optional)</Label>
              <Input
                id="baseUrl"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                placeholder="https://your-brain.example/v1"
                value={preferences.baseUrl}
                onChange={(e) =>
                  setPreferences({ ...preferences, baseUrl: e.target.value })
                }
              />
              <p className="text-xs text-slate-500">
                Leave empty to use OpenAI directly for chat.
              </p>
            </div>

            <Separator className="bg-slate-700" />

            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div>
                <Label className="text-white">Private Mode</Label>
                <p className="text-sm text-slate-400">
                  Disables logging/history. Recommended for personal privacy.
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
                <Label className="text-white">PIN Required</Label>
                <p className="text-sm text-slate-400">
                  Optional PIN for access.
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
                <Label htmlFor="pin" className="text-slate-300">PIN Code</Label>
                <Input
                  id="pin"
                  type="password"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={preferences.pinCode || ""}
                  onChange={(e) =>
                    setPreferences({ ...preferences, pinCode: e.target.value })
                  }
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button className="bg-slate-700 text-white hover:bg-slate-600" onClick={requestMic}>
                Request Microphone
              </Button>
              <Button className="bg-slate-700 text-white hover:bg-slate-600" onClick={requestLocation}>
                Request Location
              </Button>
              {preferences.baseUrl && (
                <Button className="bg-fuchsia-600 text-white hover:bg-fuchsia-500" onClick={testBrain}>
                  Test Brain API
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}