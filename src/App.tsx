import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { VoiceProvider } from "@/contexts/VoiceContext";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";
import OnboardingTour from "@/components/OnboardingTour";
import QuickAddModal, { useQuickAdd } from "@/components/QuickAddModal";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NavBar from "@/components/NavBar";
import Chat from "./pages/Chat";
import VoiceChat from "./pages/VoiceChat";
import Settings from "./pages/Settings";
import Tools from "./pages/Tools";
import History from "./pages/History";
import Debug from "./pages/Debug";
import Knowledge from "./pages/Knowledge";
import KnowledgeBase from "./pages/KnowledgeBase";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Integrations from "./pages/Integrations";
import Tasks from "./pages/Tasks";
import Reminders from "./pages/Reminders";
import Notes from "./pages/Notes";
import Calendar from "./pages/Calendar";
import Notifications from "./pages/Notifications";
import Contacts from "./pages/Contacts";
import Messages from "./pages/Messages";
import Appointments from "./pages/Appointments";
import AILogs from "./pages/AILogs";
import Drafts from "./pages/Drafts";
import BookingTasks from "./pages/BookingTasks";
import Documents from "./pages/Documents";
import ListeningSessions from "./pages/ListeningSessions";
import MicButton from "@/components/MicButton";
import FloatingVoiceWidget from "@/components/FloatingVoiceWidget";
import VoiceStatusIndicator from "@/components/VoiceStatusIndicator";
import ListeningModeIndicator from "@/components/ListeningModeIndicator";
import VoiceCommandPalette, { useCommandPalette } from "@/components/VoiceCommandPalette";
import ProtectedRoute from "@/components/ProtectedRoute";
import QuickAccessPanel from "@/components/QuickAccessPanel";
import ThumbsPanel from "@/components/ThumbsPanel";

const queryClient = new QueryClient();

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