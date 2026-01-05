import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Mic, Sparkles, MessageSquareText, Brain, Shield, Puzzle, Bell,
  CheckSquare, Clock, FileText, Users, Send, Calendar, Activity,
  Phone, Edit, Settings, Wrench, History, BookOpenText, EarOff, PhoneOff
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVoice } from "@/contexts/VoiceContext";
import { useOpenAIKey } from "@/hooks/useOpenAIKey";
import { usePreferences } from "@/state/preferences";
import APIKeyStatus from "@/components/APIKeyStatus";
import WidgetDashboard from "@/components/WidgetDashboard";
import WelcomeModal from "@/components/WelcomeModal";
import VoiceTranscriptDisplay from "@/components/VoiceTranscriptDisplay";
import WeatherWidget from "@/components/WeatherWidget";
import LocationDisplay from "@/components/LocationDisplay";

const Index = () => {
  const { user } = useAuth();
  const { hasKey: hasOpenAIKey } = useOpenAIKey();
  const { preferences } = usePreferences();
  const {
    isListening,
    isProcessing,
    isSpeaking,
    isConversationMode,
    startConversationMode,
    stopConversationMode
  } = useVoice();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleVoiceToggle = async () => {
    if (isConversationMode) {
      stopConversationMode();
    } else {
      await startConversationMode();
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

  const isVoiceActive = isListening || isProcessing || isSpeaking || isConversationMode;

  const getButtonText = () => {
    if (isConversationMode) {
      if (isListening) return "Listening...";
      if (isProcessing) return "Thinking...";
      if (isSpeaking) return "Speaking...";
      return "End Conversation";
    }
    return "Talk to Echo";
  };

  const getButtonIcon = () => {
    if (isConversationMode) {
      return <PhoneOff className="mr-2 h-5 w-5" />;
    }
    return <Mic className="mr-2 h-5 w-5" />;
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 pb-safe">
      <WelcomeModal />
      <div className="mx-auto max-w-5xl px-3 py-3 md:p-6">
        {/* Hero Section */}
        <div className="rounded-xl md:rounded-2xl border border-fuchsia-500/30 bg-black/40 p-4 md:p-8 backdrop-blur-lg shadow-xl">
          <div className="flex items-center gap-2 text-fuchsia-300">
            <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm font-medium">Personal • Voice-first • Private</span>
          </div>
          <h1 className="mt-2 md:mt-3 text-2xl md:text-4xl font-bold text-white">
            {getGreeting()}{preferences.preferredName ? `, ${preferences.preferredName}` : user?.email ? `, ${user.email.split("@")[0]}` : ""}!
          </h1>
          <p className="mt-2 md:mt-3 max-w-2xl text-slate-300 text-xs md:text-base leading-relaxed">
            Have natural conversations with your AI assistant. Just speak — Echo listens,
            thinks, and responds.
          </p>
          <div className="mt-4 md:mt-5 flex flex-col sm:flex-row gap-2 md:gap-3">
            <Button
              size="lg"
              onClick={handleVoiceToggle}
              disabled={!hasOpenAIKey}
              className={`w-full sm:w-auto shadow-lg transition-all text-base md:text-lg font-semibold py-6 md:py-3 ${
                isConversationMode
                  ? "bg-green-600 hover:bg-green-500 shadow-green-500/25 ring-2 ring-green-400/50"
                  : isListening
                  ? "bg-red-600 hover:bg-red-500 animate-pulse shadow-red-500/25"
                  : "bg-fuchsia-600 hover:bg-fuchsia-500 shadow-fuchsia-500/25"
              } ${!hasOpenAIKey ? "opacity-50 cursor-not-allowed" : ""}`}
              title={!hasOpenAIKey ? "Add your OpenAI API key in Settings first" : isConversationMode ? "Click to end conversation" : "Click to start a voice conversation"}
            >
              {getButtonIcon()}
              {getButtonText()}
            </Button>
            <Link to="/chat" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full border-fuchsia-500/40 bg-fuchsia-500/10 text-white hover:bg-fuchsia-500/20 text-base md:text-lg py-6 md:py-3">
                <MessageSquareText className="mr-2 h-5 w-5" /> Text Chat
              </Button>
            </Link>
          </div>
          
          {/* Conversation Mode Status */}
          {isConversationMode && (
            <div className="mt-3 md:mt-4 p-2.5 md:p-3 rounded-lg md:rounded-xl bg-green-900/30 border border-green-500/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-green-300 font-medium">
                  {isListening ? "I'm listening..." : 
                   isProcessing ? "Processing your request..." : 
                   isSpeaking ? "Speaking..." : 
                   "Ready to listen"}
                </span>
              </div>
              <p className="text-xs text-green-400/70 mt-1">
                Say "goodbye", "bye", or "stop" to end the conversation
              </p>
            </div>
          )}
        </div>

        {/* API Key Status - Shows if not configured (hidden on mobile) */}
        {!hasOpenAIKey && (
          <div className="mt-3 md:mt-4 hidden md:block">
            <APIKeyStatus />
          </div>
        )}

        {/* Voice Transcript Display - Shows when voice is active */}
        {isVoiceActive && (
          <div className="mt-3 md:mt-4">
            <VoiceTranscriptDisplay showResponse={true} />
          </div>
        )}

        {/* Widget Dashboard - Drag & Drop */}
        <div className="mt-3 md:mt-4">
          <WidgetDashboard />
        </div>

        {/* Voice Commands Quick Reference - Collapsible on Mobile */}
        <details className="mt-3 md:mt-4 rounded-lg md:rounded-xl border border-slate-700/50 bg-black/30">
          <summary className="p-3 md:p-4 cursor-pointer text-sm md:text-base font-semibold text-white flex items-center gap-2">
            <Mic className="h-4 w-4 text-fuchsia-400" />
            Voice Commands
            <span className="text-[10px] md:text-xs text-slate-500 font-normal ml-auto">⌘K</span>
          </summary>
          <div className="px-3 pb-3 md:px-4 md:pb-4 grid gap-2 md:gap-3 grid-cols-2 md:grid-cols-4 text-xs md:text-sm">
            <div>
              <h3 className="text-xs font-medium text-fuchsia-300 mb-1.5">Create</h3>
              <ul className="space-y-1 text-slate-400 text-xs">
                <li>"Add task buy groceries"</li>
                <li>"Remind me at 5pm"</li>
                <li>"Take a note"</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium text-fuchsia-300 mb-1.5">Read & Search</h3>
              <ul className="space-y-1 text-slate-400 text-xs">
                <li>"Read my tasks"</li>
                <li>"What's the weather?"</li>
                <li>"Find coffee shops"</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium text-purple-300 mb-1.5">Smart Scheduling</h3>
              <ul className="space-y-1 text-slate-400 text-xs">
                <li>"Schedule meeting at 2pm"</li>
                <li>"When should I do this?"</li>
                <li>"Check my schedule"</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium text-purple-300 mb-1.5">Conversation</h3>
              <ul className="space-y-1 text-slate-400 text-xs">
                <li>Click mic to start</li>
                <li>Say "goodbye" to end</li>
                <li>Natural chat</li>
              </ul>
            </div>
          </div>
        </details>

        {/* Setup Reminder - Only show if no API key */}
        {!hasOpenAIKey && (
        <div className="mt-3 md:mt-4 rounded-lg md:rounded-xl border border-slate-700/50 bg-slate-800/30 p-3 md:p-4">
          <h2 className="text-sm md:text-base font-semibold text-white mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-400" />
            Quick Setup
          </h2>
          <ol className="space-y-1.5 md:space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600 text-xs text-white shrink-0">1</span>
              <span>Go to <Link to="/settings" className="text-fuchsia-300 hover:underline">Settings</Link> and add your OpenAI API key</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600 text-xs text-white shrink-0">2</span>
              <span>Click "Start Voice" for conversation mode</span>
            </li>
          </ol>
        </div>
        )}
      </div>
    </div>
  );
};

export default Index;