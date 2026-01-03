import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mic, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-fuchsia-500/30 bg-black/40 p-8 backdrop-blur-lg shadow-xl">
          <div className="flex items-center gap-2 text-fuchsia-300">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Personal • Local-first</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">
            Echo. Your private, always-ready copilot.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Talk, search, and remember. Push-to-talk on web; headset triggers and
            hands-free options on mobile. Your data stays yours.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/chat">
              <Button className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                <Mic className="mr-2 h-4 w-4" /> Start talking
              </Button>
            </Link>
            <Link to="/knowledge">
              <Button variant="secondary" className="border border-fuchsia-500/40 bg-fuchsia-500/20 text-white hover:bg-fuchsia-500/30">
                Knowledge
              </Button>
            </Link>
            <Link to="/tools">
              <Button variant="outline" className="border-slate-500 text-white hover:bg-slate-700">
                Tools
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="ghost" className="text-slate-300 hover:bg-slate-800 hover:text-white">
                Settings
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
            <CardContent className="p-4 text-sm text-slate-200">
              Streaming chat with citations and a minimal composer for speed.
            </CardContent>
          </Card>
          <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
            <CardContent className="p-4 text-sm text-slate-200">
              Nearby places and web search with simple navigation handoff.
            </CardContent>
          </Card>
          <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
            <CardContent className="p-4 text-sm text-slate-200">
              Private Mode keeps history local-only or disabled entirely.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;