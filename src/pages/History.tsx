import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePreferences } from "../state/preferences";

export default function History() {
  const { preferences } = usePreferences();
  const raw = localStorage.getItem("echo:conversation:default");
  const hasData = !!raw && !preferences.privateMode;

  const clear = () => {
    localStorage.removeItem("echo:conversation:default");
    location.reload();
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-3xl">
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {preferences.privateMode ? (
              <p className="text-sm text-slate-400">
                Private Mode is enabled. No history is stored.
              </p>
            ) : hasData ? (
              <>
                <p className="text-sm text-slate-400">
                  History is stored locally in your browser.
                </p>
                <pre className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-xs text-slate-300 overflow-auto max-h-96">
                  {raw}
                </pre>
                <Button variant="destructive" onClick={clear}>
                  Clear History
                </Button>
              </>
            ) : (
              <p className="text-sm text-slate-400">No history yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}