import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { VoiceProvider } from "@/contexts/VoiceContext";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";
import OnboardingTour from "@/components/OnboardingTour";
import QuickAddModal, { useQuickAdd } from "@/components/QuickAddModal";
import NavBar from "@/components/NavBar";
import MicButton from "@/components/MicButton";
import FloatingVoiceWidget from "@/components/FloatingVoiceWidget";
import VoiceStatusIndicator from "@/components/VoiceStatusIndicator";
import ListeningModeIndicator from "@/components/ListeningModeIndicator";
import VoiceCommandPalette, { useCommandPalette } from "@/components/VoiceCommandPalette";
import ProtectedRoute from "@/components/ProtectedRoute";
import QuickAccessPanel from "@/components/QuickAccessPanel";
import ThumbsPanel from "@/components/ThumbsPanel";

// Lazy load route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Chat = lazy(() => import("./pages/Chat"));
const VoiceChat = lazy(() => import("./pages/VoiceChat"));
const Settings = lazy(() => import("./pages/Settings"));
const Tools = lazy(() => import("./pages/Tools"));
const History = lazy(() => import("./pages/History"));
const Debug = lazy(() => import("./pages/Debug"));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const Profile = lazy(() => import("./pages/Profile"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Reminders = lazy(() => import("./pages/Reminders"));
const Notes = lazy(() => import("./pages/Notes"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Messages = lazy(() => import("./pages/Messages"));
const Appointments = lazy(() => import("./pages/Appointments"));
const AILogs = lazy(() => import("./pages/AILogs"));
const Drafts = lazy(() => import("./pages/Drafts"));
const BookingTasks = lazy(() => import("./pages/BookingTasks"));
const Documents = lazy(() => import("./pages/Documents"));
const ListeningSessions = lazy(() => import("./pages/ListeningSessions"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

// Wrapper component for command palette
function CommandPaletteWrapper() {
  const { isOpen, close } = useCommandPalette();
  return <VoiceCommandPalette open={isOpen} onClose={close} />;
}

// Wrapper component for global keyboard shortcuts
function GlobalShortcutsWrapper() {
  useGlobalShortcuts();
  return null;
}

// Wrapper component for quick add modal
function QuickAddWrapper() {
  const { isOpen, close, defaultTab } = useQuickAdd();
  return <QuickAddModal open={isOpen} onClose={close} defaultTab={defaultTab} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <VoiceProvider>
            <NavBar />
            <VoiceStatusIndicator />
            <CommandPaletteWrapper />
            <GlobalShortcutsWrapper />
            <KeyboardShortcutsHelp />
            <OnboardingTour />
            <QuickAddWrapper />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/voice"
                  element={
                    <ProtectedRoute>
                      <VoiceChat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tools"
                  element={
                    <ProtectedRoute>
                      <Tools />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/knowledge"
                  element={
                    <ProtectedRoute>
                      <Knowledge />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/knowledge-base"
                  element={
                    <ProtectedRoute>
                      <KnowledgeBase />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <History />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/debug"
                  element={
                    <ProtectedRoute>
                      <Debug />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/integrations"
                  element={
                    <ProtectedRoute>
                      <Integrations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute>
                      <Tasks />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reminders"
                  element={
                    <ProtectedRoute>
                      <Reminders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notes"
                  element={
                    <ProtectedRoute>
                      <Notes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <Calendar />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contacts"
                  element={
                    <ProtectedRoute>
                      <Contacts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments"
                  element={
                    <ProtectedRoute>
                      <Appointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-logs"
                  element={
                    <ProtectedRoute>
                      <AILogs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/drafts"
                  element={
                    <ProtectedRoute>
                      <Drafts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/booking-tasks"
                  element={
                    <ProtectedRoute>
                      <BookingTasks />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <ProtectedRoute>
                      <Documents />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/listening-sessions"
                  element={
                    <ProtectedRoute>
                      <ListeningSessions />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <MicButton />
            <FloatingVoiceWidget />
            <ListeningModeIndicator />
            <QuickAccessPanel />
            <ThumbsPanel />
          </VoiceProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;