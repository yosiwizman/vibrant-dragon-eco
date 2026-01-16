import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { VoiceProvider } from "@/contexts/VoiceContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { trackError } from "@/services/analytics";
import { usePageTracking } from "@/hooks/usePageTracking";
import ModelDownloadProgress from "@/components/ModelDownloadProgress";
import ProgressiveOnboarding from "@/components/ProgressiveOnboarding";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useVoicePreferences } from "@/hooks/useVoicePreferences";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";
import OnboardingTour from "@/components/OnboardingTour";
import QuickAddModal, { useQuickAdd } from "@/components/QuickAddModal";
import { lazy, Suspense } from "react";
import NavBar from "@/components/NavBar";
import { Loader2 } from "lucide-react";

// Eager load critical pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Marketing from "./pages/Marketing";

// Lazy load all other pages
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
const DataManagement = lazy(() => import("./pages/DataManagement"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 text-fuchsia-400 animate-spin mx-auto mb-3" />
      <p className="text-sm text-slate-400">Loading...</p>
    </div>
  </div>
);
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

// Wrapper component for voice preferences
function VoicePreferencesWrapper() {
  useVoicePreferences();
  return null;
}

// Wrapper component for page tracking
function PageTrackingWrapper() {
  usePageTracking();
  return null;
}

// Wrapper component for quick add modal
function QuickAddWrapper() {
  const { isOpen, close, defaultTab } = useQuickAdd();
  return <QuickAddModal open={isOpen} onClose={close} defaultTab={defaultTab} />;
}

// Conditional NavBar - hide on marketing page
function ConditionalNavBar() {
  const location = useLocation();
  const isMarketingPage = location.pathname === "/";
  
  if (isMarketingPage) return null;
  return <NavBar />;
}

// Conditional App Chrome - hide voice widgets on marketing page
function ConditionalAppChrome() {
  const location = useLocation();
  const isMarketingPage = location.pathname === "/";
  
  if (isMarketingPage) return null;
  
  return (
    <>
      <VoiceStatusIndicator />
      <CommandPaletteWrapper />
      <GlobalShortcutsWrapper />
      <VoicePreferencesWrapper />
      <KeyboardShortcutsHelp />
      <OnboardingTour />
      <QuickAddWrapper />
      <MicButton />
      <FloatingVoiceWidget />
      <ListeningModeIndicator />
      <QuickAccessPanel />
      <ThumbsPanel />
      <ModelDownloadProgress />
      <ProgressiveOnboarding />
    </>
  );
}

const App = () => (
  <ErrorBoundary onError={(error, errorInfo) => {
    trackError(error.message, {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <VoiceProvider>
            <ConditionalNavBar />
            <PageTrackingWrapper />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Marketing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                
                {/* Protected app routes */}
                <Route
                  path="/app"
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
              <Route
                path="/data-management"
                element={
                  <ProtectedRoute>
                    <DataManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <ConditionalAppChrome />
          </VoiceProvider>
        </BrowserRouter>
      </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;