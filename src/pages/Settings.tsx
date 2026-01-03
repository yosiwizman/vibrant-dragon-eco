import { usePreferences } from "../state/preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/utils/toast";
import { getCurrentLocation } from "../services/location";

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

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-3xl">
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">Settings</CardTitle>
            <CardDescription className="text-slate-400">Configure Echo's privacy and backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="baseUrl" className="text-slate-300">Brain API Base URL</Label>
              <Input
                id="baseUrl"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                placeholder="https://your-brain.example/v1"
                value={preferences.baseUrl}
                onChange={(e) =>
                  setPreferences({ ...preferences, baseUrl: e.target.value })
                }
              />
            </div>

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
              <Button className="bg-slate-700 text-white hover:bg-slate-600" onClick={requestMic}>Request Microphone</Button>
              <Button className="bg-slate-700 text-white hover:bg-slate-600" onClick={requestLocation}>Request Location</Button>
              <Button className="bg-fuchsia-600 text-white hover:bg-fuchsia-500" onClick={testBrain}>Test Brain API</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}