import { ToolDefinition } from '../types';

export const SEARCH_TOOLS: ToolDefinition[] = [
  {
    name: "web_search",
    description: "Search the web for current information, news, or any topic",
    parameters: { query: "string" },
    category: "search",
  },
  {
    name: "get_weather",
    description: "Get current weather for a location. If no location specified, uses user's current location.",
    parameters: { location: "string (optional, e.g., 'New York' or 'London, UK')" },
    category: "search",
  },
  {
    name: "find_nearby",
    description: "Find nearby places like restaurants, gas stations, pharmacies, etc.",
    parameters: { query: "string (e.g., 'coffee shop', 'gas station', 'pharmacy')" },
    category: "search",
  },
];