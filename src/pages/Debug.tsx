import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/state/preferences";
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
    <div className="mx-auto max-w-3xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm font-medium">Preferences</div>
            <pre className="rounded border p-2 text-xs overflow-auto">
              {JSON.stringify(preferences, null, 2)}
            </pre>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={checkMic}>Check Microphone</Button>
            <Button variant="secondary" onClick={checkLocation}>Check Location</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}