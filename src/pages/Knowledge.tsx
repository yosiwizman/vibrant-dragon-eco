import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Plus, Trash2, Search, Tag, Folder } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface KnowledgeItem {
  id: string;
  category: string;
  key: string;
  value: string;
  created_at: string;
}

const CATEGORIES = [
  "Personal",
  "Work",
  "Preferences",
  "Contacts",
  "Health",
  "Finance",
  "Travel",
  "Other",
];

export default function Knowledge() {
  const { user } = useAuth();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
  // New item form
  const [newCategory, setNewCategory] = useState("Personal");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    if (user) loadKnowledge();
  }, [user]);

  const loadKnowledge = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("knowledge")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      showError("Failed to load knowledge");
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const addKnowledge = async () => {
    if (!user || !newKey.trim() || !newValue.trim()) {
      showError("Please fill in all fields");
      return;
    }

    const { data, error } = await supabase.from("knowledge").insert({
      user_id: user.id,
      category: newCategory,
      key: newKey.trim(),
      value: newValue.trim(),
    }).select().single();

    if (error) {
      showError("Failed to add knowledge");
    } else {
      setItems([data, ...items]);
      setNewKey("");
      setNewValue("");
      showSuccess("Knowledge added!");
    }
  };

  const deleteKnowledge = async (id: string) => {
    const { error } = await supabase.from("knowledge").delete().eq("id", id);

    if (error) {
      showError("Failed to delete");
    } else {
      setItems(items.filter(k => k.id !== id));
      showSuccess("Deleted");
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.value.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, KnowledgeItem[]>);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Personal: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      Work: "bg-purple-500/20 text-purple-300 border-purple-500/50",
      Preferences: "bg-green-500/20 text-green-300 border-green-500/50",
      Contacts: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
      Health: "bg-red-500/20 text-red-300 border-red-500/50",
      Finance: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      Travel: "bg-orange-500/20 text-orange-300 border-orange-500/50",
      Other: "bg-slate-500/20 text-slate-300 border-slate-500/50",
    };
    return colors[category] || colors.Other;
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="h-8 w-8 text-fuchsia-400" />
            Knowledge Base
          </h1>
          <p className="text-slate-400 mt-1">
            Store facts and preferences that Echo should remember about you
          </p>
        </div>

        {/* Add New Knowledge */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-fuchsia-400" />
              Add Knowledge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label className="text-slate-300">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-white">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Key / Topic</Label>
                <Input
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  placeholder="e.g., Favorite color"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-300">Value / Information</Label>
                <div className="flex gap-2">
                  <Input
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    placeholder="e.g., Blue"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addKnowledge()}
                  />
                  <Button onClick={addKnowledge} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Examples: "My birthday is March 15", "I prefer morning meetings", "My doctor's name is Dr. Smith"
            </p>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              placeholder="Search knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
              <Folder className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat} className="text-white">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Knowledge Items */}
        {loading ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-8 text-center text-slate-400">
              Loading knowledge...
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-8 text-center">
              <Brain className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                {searchQuery || filterCategory !== "all" 
                  ? "No knowledge matches your search." 
                  : "No knowledge stored yet. Add some facts about yourself!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-fuchsia-400" />
                  {category}
                  <Badge variant="outline" className="border-slate-600 text-slate-400 ml-2">
                    {categoryItems.length}
                  </Badge>
                </h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {categoryItems.map((item) => (
                    <Card
                      key={item.id}
                      className="border-fuchsia-500/20 bg-black/30 backdrop-blur"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">{item.key}</span>
                              <Badge className={getCategoryColor(item.category)}>
                                {item.category}
                              </Badge>
                            </div>
                            <p className="text-slate-300">{item.value}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteKnowledge(item.id)}
                            className="text-slate-400 hover:text-red-400 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {items.length > 0 && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-fuchsia-400">{items.length}</p>
                  <p className="text-xs text-slate-400">Total Items</p>
                </div>
                <Separator orientation="vertical" className="h-12 bg-slate-700" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-fuchsia-400">
                    {new Set(items.map(i => i.category)).size}
                  </p>
                  <p className="text-xs text-slate-400">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}