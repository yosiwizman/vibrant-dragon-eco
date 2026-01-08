import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Download } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-fuchsia-400" />
            Privacy Policy
          </h1>
          <p className="text-slate-400 mt-1">Last updated: January 7, 2026</p>
        </div>

        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white">Our Commitment to Your Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-slate-300">
            <section>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-400" />
                Privacy-First Design
              </h3>
              <p>
                Echo AI is built with privacy as the foundation. We believe your data belongs to you, 
                and you should have complete control over it.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">What We Collect</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Account Information:</strong> Email address for authentication</li>
                <li><strong>User Data:</strong> Tasks, reminders, notes, calendar events, contacts (stored in your Supabase account)</li>
                <li><strong>Usage Data:</strong> Feature usage, error logs (stored locally)</li>
                <li><strong>Voice Data:</strong> Temporary audio for transcription (deleted immediately after processing)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-400" />
                What We DON'T Collect
              </h3>
              <ul className="list-disc list-inside space-y-2">
                <li>We don't sell your data to third parties</li>
                <li>We don't use your data for advertising</li>
                <li>We don't share your conversations with anyone</li>
                <li>We don't track you across other websites</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-400" />
                How We Store Your Data
              </h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Supabase:</strong> Your tasks, notes, calendar, etc. (encrypted at rest)</li>
                <li><strong>Browser Storage:</strong> Preferences, widget layouts (local only)</li>
                <li><strong>Offline AI:</strong> Model cached in your browser (never leaves your device)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">Offline Mode</h3>
              <p>
                When using offline mode, ALL processing happens on your device. No data is sent to any server. 
                This includes voice recognition, AI processing, and text-to-speech.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Download className="h-5 w-5 text-cyan-400" />
                Your Rights
              </h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Access:</strong> Export all your data anytime</li>
                <li><strong>Deletion:</strong> Delete your account and all data</li>
                <li><strong>Portability:</strong> Download your data in JSON format</li>
                <li><strong>Correction:</strong> Edit or update any information</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">Third-Party Services</h3>
              <p className="mb-2">When you use online mode, we use:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>OpenAI:</strong> For voice transcription and AI responses (you provide your own API key)</li>
                <li><strong>Supabase:</strong> For data storage and authentication</li>
              </ul>
              <p className="mt-2">
                These services have their own privacy policies. We recommend reviewing them.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">Contact Us</h3>
              <p>
                Questions about privacy? Email us at: <a href="mailto:privacy@echoai.app" className="text-fuchsia-400 hover:underline">privacy@echoai.app</a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}