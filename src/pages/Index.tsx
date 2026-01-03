import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mic, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[radial-gradient(1200px_600px_at_80%_-10%,rgba(217,70,239,0.25),transparent),radial-gradient(800px_400px_at_10%_10%,rgba(59,130,246,0.2),transparent)]">
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="flex items-center gap-2 text-white/80">
            <Sparkles className="h-5 w-5 text-fuchsia-300" />
            <span className="text-sm">Personal • Local-first</span>
          </div>
          <h1 className="mt-2 bg-gradient-to-r from-white via-fuchsia-200 to-blue-200 bg-clip-text text-4xl font-semibold text-transparent md:text-5xl">
            Echo. Your private, always-ready copilot.
          </h1>
          <p className="mt-4 max-w-2xl text-white/70">
            Talk, search, and remember. Push-to-talk on web; headset triggers and
            hands-free options on mobile. Your data stays yours.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/chat">
              <Button className="bg-white text-black hover:bg-white/90">
                <Mic className="mr-2 h-4 w-4" /> Start talking
              </Button>
            </Link>
            <Link to="/knowledge">
              <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                Knowledge
              </Button>
            </Link>
            <Link to="/tools">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Tools
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="ghost" className="text-white/80 hover:bg-white/10">
                Settings
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardContent className="p-4 text-sm text-white/70">
              Streaming chat with citations and a minimal composer for speed.
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardContent className="p-4 text-sm text-white/70">
              Nearby places and web search with simple navigation handoff.
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardContent className="p-4 text-sm text-white/70">
              Private Mode keeps history local-only or disabled entirely.
            </CardContent>
          </Card>
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;