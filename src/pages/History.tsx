import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/state/preferences";

export default function History() {
  const { preferences } = usePreferences();
  const raw = localStorage.getItem("echo:conversation:default");
  const hasData = !!raw && !preferences.privateMode;

  const clear = () => {
    localStorage.removeItem("echo:conversation:default");
    location.reload();
  };

  return (
    <div className="mx-auto max-w-3xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {preferences.privateMode ? (
            <p className="text-sm text-muted-foreground">
              Private Mode is enabled. No history is stored.
            </p>
          ) : hasData ? (
            <>
              <p className="text-sm text-muted-foreground">
                History is stored locally in your browser.
              </p>
              <pre className="rounded border p-2 text-xs overflow-auto">
                {raw}
              </pre>
              <Button variant="destructive" onClick={clear}>
                Clear History
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}