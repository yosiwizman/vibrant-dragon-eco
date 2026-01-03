import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, Plus, Search, Trash2, FileText, 
  Brain, Sparkles, ChevronDown, ChevronUp 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import { 
  listDocuments, 
  addDocument, 
  deleteDocument, 
  searchKnowledge,
  RAGDocument,
  SearchResult 
} from "@/services/rag-knowledge";
import VoiceHint from "@/components/VoiceHint";

export default function KnowledgeBase() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  
  // New document form
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newTags, setNewTags] = useState("");

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const docs = await listDocuments(user.id);
      setDocuments(docs);
    } catch (error) {
      showError("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchKnowledge(user.id, searchQuery, { limit: 10 });
      setSearchResults(results);
    } catch (error) {
      showError("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddDocument = async () => {
    if (!user || !newTitle.trim() || !newContent.trim()) {
      showError("Title and content are required");
      return;
    }

    try {
      const result = await addDocument(user.id, {
        title: newTitle,
        content: newContent,
        sourceType: "manual",
        metadata: {
          category: newCategory || undefined,
          tags: newTags ? newTags.split(",").map(t => t.trim()) : undefined,
        },
      });

      if (result.success) {
        showSuccess("Document added to knowledge base");
        setIsAddDialogOpen(false);
        setNewTitle("");
        setNewContent("");
        setNewCategory("");
        setNewTags("");
        loadDocuments();
      } else {
        showError(result.error || "Failed to add document");
      }
    } catch (error) {
      showError("Failed to add document");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!user) return;

    try {
      const result = await deleteDocument(user.id, docId);
      if (result.success) {
        showSuccess("Document deleted");
        loadDocuments();
      } else {
        showError(result.error || "Failed to delete document");
      }
    } catch (error) {
      showError("Failed to delete document");
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Brain className="h-6 w-6 text-fuchsia-400" />
              Knowledge Base
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Store and search your personal knowledge for AI-enhanced responses
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-fuchsia-600 hover:bg-fuchsia-500">
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Add to Knowledge Base</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label className="text-slate-300">Title</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Document title"
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Content</Label>
                  <Textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Enter your knowledge content..."
                    className="bg-slate-800 border-slate-700 text-white mt-1 min-h-[200px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Category (optional)</Label>
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g., AI/ML, Business"
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Tags (comma-separated)</Label>
                    <Input
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="e.g., RAG, LLM, tutorial"
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                </div>
                <Button onClick={handleAddDocument} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500">
                  Add Document
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <VoiceHint 
          commands={[
            "Search knowledge base for [topic]",
            "What do you know about [topic]?",
            "Add to knowledge base: [content]",
          ]}
        />

        {/* Search */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search your knowledge base..."
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                className="bg-fuchsia-600 hover:bg-fuchsia-500"
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-medium text-slate-300">
                  Found {searchResults.length} result{searchResults.length > 1 ? "s" : ""}
                </h3>
                {searchResults.map((result, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{result.document.title}</span>
                      <Badge variant="outline" className="text-xs border-fuchsia-500/50 text-fuchsia-300">
                        {Math.round(result.relevanceScore * 100)}% match
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-3">{result.chunk.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-fuchsia-400" />
              Your Documents
            </CardTitle>
            <CardDescription className="text-slate-400">
              {documents.length} document{documents.length !== 1 ? "s" : ""} in your knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">Loading...</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">No documents yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Add documents to enhance AI responses with your knowledge
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">{doc.title}</h3>
                            {doc.metadata?.category && (
                              <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                {doc.metadata.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {doc.chunks?.length || 0} chunks • Added {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                          {doc.metadata?.tags && (
                            <div className="flex gap-1 mt-2">
                              {doc.metadata.tags.map((tag: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                            className="text-slate-400 hover:text-white h-8 w-8"
                          >
                            {expandedDoc === doc.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-slate-400 hover:text-red-400 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {expandedDoc === doc.id && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-sm text-slate-300 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                            {doc.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* RAG Info */}
        <Card className="border-blue-500/20 bg-blue-950/20 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-white">How Knowledge Base Works</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Documents you add are automatically chunked and indexed. When you ask Echo questions, 
                  relevant knowledge is retrieved and used to provide more accurate, personalized responses.
                  This is called Retrieval-Augmented Generation (RAG).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}