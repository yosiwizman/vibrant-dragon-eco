export interface Widget {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  type: string;
  name: string;
  icon: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize: { w: number; h: number };
}

export const WIDGET_CONFIGS: Record<string, WidgetConfig> = {
  time: {
    type: "time",
    name: "Time",
    icon: "Clock",
    defaultSize: { w: 1, h: 1 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 3 },
  },
  weather: {
    type: "weather",
    name: "Weather",
    icon: "CloudSun",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
  },
  tasks: {
    type: "tasks",
    name: "Tasks",
    icon: "CheckSquare",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
  },
  reminders: {
    type: "reminders",
    name: "Reminders",
    icon: "Bell",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
  },
  notes: {
    type: "notes",
    name: "Notes",
    icon: "FileText",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
  },
  calendar: {
    type: "calendar",
    name: "Calendar",
    icon: "Calendar",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
  },
  upcoming: {
    type: "upcoming",
    name: "Coming Up",
    icon: "TrendingUp",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
  },
  contacts: {
    type: "contacts",
    name: "Contacts",
    icon: "Users",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
  },
  messages: {
    type: "messages",
    name: "Messages",
    icon: "Send",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
  },
  location: {
    type: "location",
    name: "Location",
    icon: "MapPin",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
  },
  productivity: {
    type: "productivity",
    name: "Productivity",
    icon: "Target",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
  },
  "ai-usage": {
    type: "ai-usage",
    name: "AI Usage",
    icon: "Brain",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
  },
  "quick-actions": {
    type: "quick-actions",
    name: "Quick Actions",
    icon: "Zap",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
  },
  "recent-activity": {
    type: "recent-activity",
    name: "Recent Activity",
    icon: "Activity",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
  },
};