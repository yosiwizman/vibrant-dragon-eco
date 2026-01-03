import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail,
  Calendar,
  FileText,
  Github,
  Slack,
  Search,
  Star,
  Download,
  Check,
  ExternalLink,
  Puzzle,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  rating: number;
  installs: number;
  installed: boolean;
  featured: boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Read, send, and manage your emails. Echo can summarize emails and draft responses.",
    category: "Productivity",
    icon: <Mail className="h-8 w-8 text-red-400" />,
    rating: 4.5,
    installs: 1250,
    installed: false,
    featured: true,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Manage your schedule, create events, and get reminders through voice commands.",
    category: "Productivity",
    icon: <Calendar className="h-8 w-8 text-blue-400" />,
    rating: 4.3,
    installs: 980,
    installed: false,
    featured: true,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Create notes, manage databases, and organize your workspace with voice.",
    category: "Productivity",
    icon: <FileText className="h-8 w-8 text-white" />,
    rating: 4.0,
    installs: 750,
    installed: false,
    featured: true,
  },
  {
    id: "github",
    name: "GitHub",
    description: "Check issues, PRs, and repository status. Create issues with voice commands.",
    category: "Developer",
    icon: <Github className="h-8 w-8 text-white" />,
    rating: 4.2,
    installs: 520,
    installed: false,
    featured: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send messages, check channels, and manage notifications through Echo.",
    category: "Communication",
    icon: <Slack className="h-8 w-8 text-purple-400" />,
    rating: 4.1,
    installs: 890,
    installed: false,
    featured: true,
  },
];

export default function Integrations() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [activeTab, setActiveTab] = useState("all");

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "installed" && integration.installed) ||
      (activeTab === "featured" && integration.featured);
    return matchesSearch && matchesTab;
  });

  const handleInstall = async (integrationId: string) => {
    const integration = integrations.find((i) => i.id === integrationId);
    if (!integration) return;

    if (integrationId === "gmail") {
      // For Gmail, we would initiate OAuth flow
      // For now, we'll simulate the installation
      showSuccess(`${integration.name} integration installed! OAuth setup would happen here.`);
    } else {
      showSuccess(`${integration.name} integration installed!`);
    }

    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === integrationId ? { ...i, installed: true, installs: i.installs + 1 } : i
      )
    );
  };

  const handleUninstall = (integrationId: string) => {
    const integration = integrations.find((i) => i.id === integrationId);
    if (!integration) return;

    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === integrationId ? { ...i, installed: false, installs: i.installs - 1 } : i
      )
    );
    showSuccess(`${integration.name} integration removed.`);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Puzzle className="h-8 w-8 text-fuchsia-400" />
              Integrations
            </h1>
            <p className="text-slate-400 mt-1">
              Connect Echo with your favorite apps and services
            </p>
          </div>
        </div>

        {/* Create Your Own App Card */}
        <Card className="border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-900/30 to-purple-900/30 backdrop-blur">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-fuchsia-600/30 flex items-center justify-center">
                <span className="text-2xl">+</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Create Your Own App</h3>
                <p className="text-slate-400 text-sm">Build and share your custom integration</p>
              </div>
            </div>
            <Button className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
              Get Started
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search integrations..."
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-fuchsia-600">
                All
              </TabsTrigger>
              <TabsTrigger value="featured" className="data-[state=active]:bg-fuchsia-600">
                Featured
              </TabsTrigger>
              <TabsTrigger value="installed" className="data-[state=active]:bg-fuchsia-600">
                Installed
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Featured Section */}
        {activeTab !== "installed" && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Featured</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredIntegrations
                .filter((i) => i.featured)
                .map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onInstall={handleInstall}
                    onUninstall={handleUninstall}
                  />
                ))}
            </div>
          </div>
        )}

        {/* All Integrations */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {activeTab === "installed" ? "Installed Integrations" : "All Integrations"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onInstall={handleInstall}
                onUninstall={handleUninstall}
              />
            ))}
          </div>
          {filteredIntegrations.length === 0 && (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-8 text-center">
                <p className="text-slate-400">No integrations found.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({
  integration,
  onInstall,
  onUninstall,
}: {
  integration: Integration;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
}) {
  return (
    <Card className="border-fuchsia-500/20 bg-black/30 backdrop-blur hover:border-fuchsia-500/40 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center">
              {integration.icon}
            </div>
            <div>
              <h3 className="font-semibold text-white">{integration.name}</h3>
              <p className="text-xs text-slate-400">{integration.category}</p>
            </div>
          </div>
          {integration.installed ? (
            <Button
              size="sm"
              variant="outline"
              className="border-green-500/50 text-green-400 hover:bg-green-500/20"
              onClick={() => onUninstall(integration.id)}
            >
              <Check className="mr-1 h-3 w-3" />
              Installed
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
              onClick={() => onInstall(integration.id)}
            >
              Install
            </Button>
          )}
        </div>
        <p className="mt-3 text-sm text-slate-300 line-clamp-2">{integration.description}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            {integration.rating}
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            {integration.installs}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}