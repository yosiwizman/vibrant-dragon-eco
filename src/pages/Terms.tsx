import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle, CheckCircle } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-fuchsia-400" />
            Terms of Service
          </h1>
          <p className="text-slate-400 mt-1">Last updated: January 7, 2026</p>
        </div>

        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white">Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-slate-300">
            <p>
              By accessing or using Echo AI ("the Service"), you agree to be bound by these Terms of Service.
            </p>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">1. Use of Service</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>You must be 13 years or older to use this service</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You agree not to misuse the service or help anyone else do so</li>
                <li>You retain all rights to your data</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">2. API Keys</h3>
              <p>
                If you choose to use online mode, you must provide your own OpenAI API key. 
                You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Keeping your API key secure</li>
                <li>All costs associated with API usage</li>
                <li>Compliance with OpenAI's terms of service</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">3. Offline Mode</h3>
              <p>
                Offline mode downloads AI models to your browser. By using offline mode, you agree that:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Models are provided "as-is" without warranty</li>
                <li>You are responsible for storage space used</li>
                <li>Offline AI quality may differ from online mode</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                4. Disclaimer
              </h3>
              <p>
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. 
                We do not guarantee that the service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">5. Limitation of Liability</h3>
              <p>
                We shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                resulting from your use of the service.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                6. Your Rights
              </h3>
              <ul className="list-disc list-inside space-y-2">
                <li>You own all your data</li>
                <li>You can export your data anytime</li>
                <li>You can delete your account anytime</li>
                <li>You can use the service offline</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">7. Changes to Terms</h3>
              <p>
                We may update these terms from time to time. We will notify you of any material changes 
                by posting the new terms on this page.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">8. Contact</h3>
              <p>
                Questions about these terms? Email us at: <a href="mailto:legal@echoai.app" className="text-fuchsia-400 hover:underline">legal@echoai.app</a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}