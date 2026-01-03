import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Mic, Sparkles, MessageSquareText, Brain, Shield, Puzzle, Bell,
  CheckSquare, Clock, FileText, Users, Send, Calendar, Activity,
  Phone, Edit, Settings, Wrench, History, BookOpenText, EarOff
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVoice } from "@/contexts/VoiceContext";
import Dashboard from "@/components/Dashboard";
import WelcomeModal from "@/components/WelcomeModal";
import VoiceTranscriptDisplay from "@/components/VoiceTranscriptDisplay";
import ChatTips from "@/components/ChatTips";

const Index = () => {
  const { user } = useAuth();
  const { isListening, isProcessing, isSpeaking, startListening, stopListening } = useVoice();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  const quickAccessItems = [
    { to: "/tasks", icon: CheckSquare, label: "Tasks", color: "text-green-400" },
    { to: "/reminders", icon: Bell, label: "Reminders", color: "text-yellow-400" },
    { to: "/notes", icon: FileText, label: "Notes", color: "text-orange-400" },
    { to: "/calendar", icon: Clock, label: "Calendar", color: "text-blue-400" },
    { to: "/contacts", icon: Users, label: "Contacts", color: "text-cyan-400" },
    { to: "/messages", icon: Send, label: "Messages", color: "text-emerald-400" },
    { to: "/appointments", icon: Calendar, label: "Appointments", color: "text-teal-400" },
    { to: "/documents", icon: FileText, label: "Documents", color: "text-indigo-400" },
  ];

  const toolsItems = [
    { to: "/knowledge", icon: BookOpenText, label: "Knowledge", color: "text-purple-400" },
    { to: "/knowledge-base", icon: Brain, label: "RAG Docs", color: "text-violet-400" },
    { to: "/listening-sessions", icon: EarOff, label: "Sessions", color: "text-purple-400" },
    { to: "/tools", icon: Wrench, label: "Tools", color: "text-fuchsia-400" },
    { to: "/integrations", icon: Puzzle, label: "Integrations", color: "text-pink-400" },
    { to: "/ai-logs", icon: Activity, label: "AI Logs", color: "text-lime-400" },
    { to: "/history", icon: History, label: "History", color: "text-amber-400" },
    { to: "/drafts", icon: Edit, label: "Drafts", color: "text-rose-400" },
  ];

  const isVoiceActive = isListening || isProcessing || isSpeaking;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <WelcomeModal />
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        {/* Hero Section */}
        <div className="rounded-2xl border border-fuchsia-500/30 bg-black/40 p-6 md:p-8 backdrop-blur-lg shadow-xl">
          <div className="flex items-center gap-2 text-fuchsia-300">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Personal • Voice-first • Private</span>
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold text-white">
            {getGreeting()}{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
          </h1>
          <p className="mt-3 max-w-2xl text-slate-300 text-sm md:text-base">
            Have natural conversations with your AI assistant. Just speak — Echo listens,
            thinks, and responds.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button 
              size="lg" 
              onClick={handleVoiceToggle}
              className={`shadow-lg shadow-fuchsia-500/25 ${
                isListening 
                  ? "bg-red-600 hover:bg-red-500 animate-pulse" 
                  : "bg-fuchsia-600 hover:bg-fuchsia-500"
              }`}
            >
              <Mic className="mr-2 h-5 w-5" /> 
              {isListening ? "Stop Listening" : "Start Voice"}
            </Button>
            <Link to="/chat">
              <Button size="lg" variant="outline" className="border-fuchsia-500/40 bg-fuchsia-500/10 text-white hover:bg-fuchsia-500/20">
                <MessageSquareText className="mr-2 h-4 w-4" /> Text Chat
              </Button>
            </Link>
          </div>
        </div>

        {/* Voice Transcript Display - Shows when voice is active */}
        {isVoiceActive && (
          <div className="mt-4">
            <VoiceTranscriptDisplay showResponse={true} />
          </div>
        )}

        {/* Quick Voice Commands - Shows when not actively using voice */}
        {!isVoiceActive && (
          <div className="mt-4">
            <ChatTips onPromptClick={async (prompt) => {
              // Start listening and process the prompt
              await startListening();
            }} />
          </div>
        )}

        {/* Dashboard Stats - Live Data */}
        <div className="mt-6">
          <Dashboard />
        </div>

        {/* Quick Access Grid */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-white mb-3">Quick Access</h2>
          <div className="grid gap-3 grid-cols-4 sm:grid-cols-4 md:grid-cols-8">
            {quickAccessItems.map((item) => (
              <Link key={item.to} to={item.to}>
                <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur hover:bg-black/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-3 flex flex-col items-center gap-1.5 text-center">
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                    <span className="font-medium text-white text-xs">{item.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Tools & More Grid */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-white mb-3">Tools & More</h2>
          <div className="grid gap-3 grid-cols-4 sm:grid-cols-4 md:grid-cols-8">
            {toolsItems.map((item) => (
              <Link key={item.to} to={item.to}>
                <Card className="border-slate-700/50 bg-black/20 backdrop-blur hover:bg-black/40 transition-colors cursor-pointer h-full">
                  <CardContent className="p-3 flex flex-col items-center gap-1.5 text-center">
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                    <span className="font-medium text-slate-300 text-xs">{item.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Voice Commands Quick Reference */}
        <div className="mt-6 rounded-xl border border-slate-700/50 bg-black/30 p-5">
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Mic className="h-4 w-4 text-fuchsia-400" />
            Voice Commands
            <span className="text-xs text-slate-500 font-normal ml-2">Press ⌘K for full list</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div>
              <h3 className="text-xs font-medium text-fuchsia-300 mb-1.5">Create</h3>
              <ul className="space-y-1 text-slate-400 text-xs">
                <li>"Add task buy groceries"</li>
                <li>"Remind me to call mom at 5pm"</li>
                <li>"Take a note about the meeting"</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium text-fuchsia-300 mb-1.5">Read & Search</h3>
              <ul className="space-y-1 text-slate-400 text-xs">
                <li>"Read my tasks"</li>
                <li>"What's the weather?"</li>
                <li>"Find nearby coffee shops"</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium text-purple-300 mb-1.5">Smart Scheduling</h3>
              <ul className="space-y-1 text-slate-400 text-xs">
                <li>"Schedule meeting at 2pm"</li>
                <li>"When should I do this task?"</li>
                <li>"Check my schedule"</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium text-purple-300 mb-1.5">Quiet Mode</h3>
              <ul className="space-y-1 text-slate-400 text-xs">
                <li>"Go quiet" / "Listening mode"</li>
                <li>"Echo summarize"</li>
                <li>"What did you hear?"</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Setup Reminder - Only show if no API key */}
        <div className="mt-6 rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
          <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-400" />
            Quick Setup
          </h2>
          <ol className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600 text-xs text-white shrink-0">1</span>
              <span>Go to <Link to="/settings" className="text-fuchsia-300 hover:underline">Settings</Link> and enter your OpenAI API key</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600 text-xs text-white shrink-0">2</span>
              <span>Choose your preferred voice and click "Start Voice"</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Index;