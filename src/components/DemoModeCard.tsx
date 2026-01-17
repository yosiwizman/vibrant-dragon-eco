import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { usePreferences } from '@/state/preferences';
import { getDemoModeStatus, type DemoModeStatus } from '@/services/ai-proxy';

export default function DemoModeCard() {
  const { preferences, setPreferences } = usePreferences();
  const [status, setStatus] = useState<DemoModeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getDemoModeStatus();
      setStatus(s);
    } catch (e: any) {
      setError(e?.message || 'Failed to load status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enabled = preferences.demoModeEnabled === true;
  const ready = status?.configured === true;

  return (
    <Card className="border-fuchsia-500/30 bg-slate-800/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-fuchsia-400" />
          Demo Mode
          <Badge className="ml-2 bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/40">
            Investor Demo
          </Badge>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Use a secure server-side OpenAI proxy so users don’t need to enter an API key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          <div>
            <p className="text-white font-medium">Enable Demo Mode</p>
            <p className="text-sm text-slate-400">
              Routes chat + voice (STT/TTS) through <span className="font-mono">/api/ai/*</span>
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) =>
              setPreferences((prev) => ({ ...prev, demoModeEnabled: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {ready ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-300">Ready (server configured)</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-yellow-300">
                  {loading ? 'Checking…' : 'Not configured'}
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={refresh}
            className="text-xs text-fuchsia-300 hover:underline"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="text-xs text-red-300">{error}</div>
        )}

        {status && !status.configured && status.missing?.length > 0 && (
          <div className="text-xs text-slate-400">
            Missing: {status.missing.join(', ')}
          </div>
        )}

        {enabled && !ready && (
          <div className="text-xs text-yellow-300">
            Demo Mode is enabled, but the server proxy is not fully configured yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
