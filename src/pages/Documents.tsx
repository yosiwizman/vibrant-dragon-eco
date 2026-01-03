"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  Search, 
  File, 
  Image, 
  FileSpreadsheet,
  Clock,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";

interface Document {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  mime_type: string;
  size: number;
  metadata: Record<string, any>;
  created_at: string;
}

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      showError(error.message || "Failed to load documents");
    }

    setLoading(false);
  };

  const handleDelete = async (id: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      // Delete from database
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;

      setDocuments(documents.filter((d) => d.id !== id));
      showSuccess("Document deleted");
    } catch (error: any) {
      showError(error.message || "Failed to delete document");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase.from("documents").insert({
        user_id: user.id,
        filename: file.name,
        file_path: fileName,
        mime_type: file.type,
        size: file.size,
        metadata: {},
      });

      if (dbError) throw dbError;

      showSuccess("Document uploaded");
      setIsUploadOpen(false);
      loadDocuments();
    } catch (error: any) {
      showError(error.message || "Failed to upload document");
    }

    setUploading(false);
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      showError(error.message || "Failed to download document");
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image className="h-5 w-5 text-blue-400" />;
    }
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
      return <FileSpreadsheet className="h-5 w-5 text-green-400" />;
    }
    if (mimeType.includes("pdf")) {
      return <FileText className="h-5 w-5 text-red-400" />;
    }
    return <File className="h-5 w-5 text-slate-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FolderOpen className="h-8 w-8 text-fuchsia-400" />
              Documents
            </h1>
            <p className="text-slate-400 mt-1">Manage your uploaded files</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDocuments}
              className="border-slate-600 text-slate-300"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-fuchsia-600 hover:bg-fuchsia-500">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Select File</Label>
                    <Input
                      type="file"
                      className="bg-slate-800 border-slate-700"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                  </div>
                  {uploading && (
                    <p className="text-sm text-slate-400">Uploading...</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <Card className="border-slate-700 bg-black/30 mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                className="bg-slate-800 border-slate-700 pl-10"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-white">{documents.length}</p>
              <p className="text-xs text-slate-400">Total Files</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {documents.filter((d) => d.mime_type.startsWith("image/")).length}
              </p>
              <p className="text-xs text-slate-400">Images</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-fuchsia-400">
                {formatFileSize(documents.reduce((acc, d) => acc + d.size, 0))}
              </p>
              <p className="text-xs text-slate-400">Total Size</p>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-slate-700 bg-black/30 animate-pulse">
                <CardContent className="p-4">
                  <div className="h-16 bg-slate-800 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="border-slate-700 bg-black/30">
            <CardContent className="p-12 text-center">
              <FolderOpen className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {searchQuery ? "No documents found" : "No documents yet"}
              </h3>
              <p className="text-slate-400 mb-4">
                {searchQuery
                  ? "Try a different search term"
                  : "Upload your first document to get started"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsUploadOpen(true)}
                  className="bg-fuchsia-600 hover:bg-fuchsia-500"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="border-slate-700 bg-black/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-slate-800">
                        {getFileIcon(doc.mime_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {doc.filename}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(parseISO(doc.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-300"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          onClick={() => handleDelete(doc.id, doc.file_path)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}