import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess } from "@/utils/toast";
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
  MessageSquare,
  Trello,
  Cloud,
  Music,
  ShoppingCart,
  Plane,
  DollarSign,
  Heart,
  Bookmark,
  Phone,
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
    icon: <FileText className="h-8 w-8 text-slate-200" />,
    rating: 4.0,
    installs: 750,
    installed: false,
    featured: true,
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
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Send and receive WhatsApp messages hands-free through voice commands.",
    category: "Communication",
    icon: <MessageSquare className="h-8 w-8 text-green-400" />,
    rating: 4.4,
    installs: 1100,
    installed: false,
    featured: true,
  },
  {
    id: "github",
    name: "GitHub",
    description: "Check issues, PRs, and repository status. Create issues with voice commands.",
    category: "Developer",
    icon: <Github className="h-8 w-8 text-slate-200" />,
    rating: 4.2,
    installs: 520,
    installed: false,
    featured: false,
  },
  {
    id: "trello",
    name: "Trello",
    description: "Manage boards, create cards, and track projects with voice commands.",
    category: "Productivity",
    icon: <Trello className="h-8 w-8 text-blue-400" />,
    rating: 4.0,
    installs: 450,
    installed: false,
    featured: false,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Access and manage your files in the cloud through voice commands.",
    category: "Storage",
    icon: <Cloud className="h-8 w-8 text-blue-400" />,
    rating: 3.9,
    installs: 380,
    installed: false,
    featured: false,
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Control music playback, create playlists, and discover new music.",
    category: "Entertainment",
    icon: <Music className="h-8 w-8 text-green-400" />,
    rating: 4.6,
    installs: 1500,
    installed: false,
    featured: true,
  },
  {
    id: "amazon",
    name: "Amazon Shopping",
    description: "Search products, track orders, and manage your shopping lists.",
    category: "Shopping",
    icon: <ShoppingCart className="h-8 w-8 text-orange-400" />,
    rating: 4.1,
    installs: 620,
    installed: false,
    featured: false,
  },
  {
    id: "expedia",
    name: "Travel Planner",
    description: "Search flights, hotels, and plan your trips with voice assistance.",
    category: "Travel",
    icon: <Plane className="h-8 w-8 text-cyan-400" />,
    rating: 4.0,
    installs: 340,
    installed: false,
    featured: false,
  },
  {
    id: "mint",
    name: "Finance Tracker",
    description: "Track expenses, budgets, and get financial insights through voice.",
    category: "Finance",
    icon: <DollarSign className="h-8 w-8 text-green-400" />,
    rating: 4.2,
    installs: 480,
    installed: false,
    featured: false,
  },
  {
    id: "health",
    name: "Health & Wellness",
    description: "Track workouts, nutrition, and health metrics with voice logging.",
    category: "Health",
    icon: <Heart className="h-8 w-8 text-red-400" />,
    rating: 4.3,
    installs: 560,
    installed: false,
    featured: false,
  },
  {
    id: "pocket",
    name: "Bookmarks",
    description: "Save articles, websites, and content for later reading.",
    category: "Productivity",
    icon: <Bookmark className="h-8 w-8 text-pink-400" />,
    rating: 4.0,
    installs: 290,
    installed: false,
    featured: false,
  },
  {
    id: "twilio",
    name: "SMS & Calls",
    description: "Send SMS messages and make phone calls through Echo.",
    category: "Communication",
    icon: <Phone className="h-8 w-8 text-red-400" />,
    rating: 4.4,
    installs: 720,
    installed: false,
    featured: true,
  },
];

export default function Integrations() {
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

    showSuccess(`${integration.name} integration installed!`);

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

  const categories = [...new Set(integrations.map(i => i.category))];

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
              <div className="h-12 w-12 rounded-xl bg-fuchsia-600/30 flex items-center justify-center text-fuchsia-300">
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
        <div className="flex flex-wrap items-center gap-4">
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
              <TabsTrigger value="all" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
                All
              </TabsTrigger>
              <TabsTrigger value="featured" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
                Featured
              </TabsTrigger>
              <TabsTrigger value="installed" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
                Installed
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Integrations Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredIntegrations.map((integration) => (
            <Card
              key={integration.id}
              className="border-fuchsia-500/20 bg-black/30 backdrop-blur hover:border-fuchsia-500/40 transition-colors"
            >
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
                      className="border-green-500/50 text-green-400 hover:bg-green-500/20 hover:text-green-300"
                      onClick={() => handleUninstall(integration.id)}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Installed
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                      onClick={() => handleInstall(integration.id)}
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
                  {integration.featured && (
                    <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
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
  );
}