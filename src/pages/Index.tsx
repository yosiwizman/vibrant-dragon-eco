import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mic, Sparkles, MessageSquareText, Volume2, Brain, Shield, Puzzle, Bell, CheckSquare, Clock, Search, Mail, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-fuchsia-500/30 bg-black/40 p-8 backdrop-blur-lg shadow-xl">
          <div className="flex items-center gap-2 text-fuchsia-300">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Personal • Voice-first • Private</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">
            {getGreeting()}{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Have natural conversations with your AI assistant. Just speak — Echo listens,
            thinks, and responds. Like ChatGPT voice mode, but yours.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/voice">
              <Button size="lg" className="bg-fuchsia-600 text-white hover:bg-fuchsia-500 shadow-lg shadow-fuchsia-500/25">
                <Mic className="mr-2 h-5 w-5" /> Start Voice Conversation
              </Button>
            </Link>
            <Link to="/chat">
              <Button size="lg" className="border border-fuchsia-500/40 bg-fuchsia-500/20 text-white hover:bg-fuchsia-500/30">
                <MessageSquareText className="mr-2 h-4 w-4" /> Text Chat
              </Button>
            </Link>
            <Link to="/integrations">
              <Button size="lg" className="border border-slate-600 bg-slate-800 text-white hover:bg-slate-700">
                <Puzzle className="mr-2 h-4 w-4" /> Browse Apps
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <Link to="/tasks">
            <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur hover:bg-black/40 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckSquare className="h-6 w-6 text-green-400" />
                <span className="font-medium text-white">Tasks</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/reminders">
            <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur hover:bg-black/40 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Bell className="h-6 w-6 text-yellow-400" />
                <span className="font-medium text-white">Reminders</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/knowledge">
            <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur hover:bg-black/40 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Brain className="h-6 w-6 text-purple-400" />
                <span className="font-medium text-white">Knowledge</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/calendar">
            <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur hover:bg-black/40 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-6 w-6 text-blue-400" />
                <span className="font-medium text-white">Calendar</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/notes">
            <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur hover:bg-black/40 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="h-6 w-6 text-orange-400" />
                <span className="font-medium text-white">Notes</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/notifications">
            <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur hover:bg-black/40 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Bell className="h-6 w-6 text-fuchsia-400" />
                <span className="font-medium text-white">Notifications</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
            <CardContent className="p-4">
              <Volume2 className="h-8 w-8 text-fuchsia-400 mb-2" />
              <h3 className="font-semibold text-white mb-1">Natural Voice</h3>
              <p className="text-sm text-slate-300">
                OpenAI Whisper STT + TTS with 11 voice options. Speak naturally, hear clear responses.
              </p>
            </CardContent>
          </Card>
          <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
            <CardContent className="p-4">
              <Search className="h-8 w-8 text-fuchsia-400 mb-2" />
              <h3 className="font-semibold text-white mb-1">Web Search</h3>
              <p className="text-sm text-slate-300">
                Search the web, get summaries, and find information instantly through voice.
              </p>
            </CardContent>
          </Card>
          <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
            <CardContent className="p-4">
              <Mail className="h-8 w-8 text-fuchsia-400 mb-2" />
              <h3 className="font-semibold text-white mb-1">Email & SMS</h3>
              <p className="text-sm text-slate-300">
                Send emails and texts, get summaries, and manage communications hands-free.
              </p>
            </CardContent>
          </Card>
          <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
            <CardContent className="p-4">
              <Shield className="h-8 w-8 text-fuchsia-400 mb-2" />
              <h3 className="font-semibold text-white mb-1">Private & Secure</h3>
              <p className="text-sm text-slate-300">
                Your API key, your data. Everything stays private and under your control.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Quick Setup</h2>
          <ol className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600 text-xs text-white shrink-0">1</span>
              <span>Go to <Link to="/settings" className="text-fuchsia-300 hover:underline">Settings</Link> and enter your OpenAI API key</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600 text-xs text-white shrink-0">2</span>
              <span>Choose your preferred voice (Nova, Alloy, Echo, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600 text-xs text-white shrink-0">3</span>
              <span>Browse <Link to="/integrations" className="text-fuchsia-300 hover:underline">Integrations</Link> to connect your apps</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600 text-xs text-white shrink-0">4</span>
              <span>Click "Start Voice Conversation" and start talking!</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Index;