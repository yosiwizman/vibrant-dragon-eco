import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePreferences } from "../state/preferences";
import { showError, showSuccess } from "@/utils/toast";

export default function Debug() {
  const { preferences } = usePreferences();

  const checkMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      showSuccess("Microphone OK");
    } catch {
      showError("Microphone not available or denied");
    }
  };

  const checkLocation = async () => {
    if (!("geolocation" in navigator)) {
      showError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => showSuccess("Location OK"),
      () => showError("Location denied"),
      { timeout: 3000 }
    );
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-3xl">
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-300 mb-2">Preferences</div>
              <pre className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-xs text-slate-300 overflow-auto">
                {JSON.stringify(preferences, null, 2)}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button className="bg-slate-700 text-white hover:bg-slate-600" onClick={checkMic}>Check Microphone</Button>
              <Button className="bg-slate-700 text-white hover:bg-slate-600" onClick={checkLocation}>Check Location</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}