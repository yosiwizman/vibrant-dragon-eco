"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { downloadUserData, importUserData, getExportStats } from "@/services/data-export";
import { showSuccess, showError } from "@/utils/toast";
import { 
  Download, 
  Upload, 
  Database, 
  FileJson,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";

export default function DataManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setLoading(true);
    await downloadUserData(user.id);
    setLoading(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    
    setImporting(true);
    const success = await importUserData(user.id, e.target.files[0]);
    setImporting(false);
    
    if (success) {
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    const exportStats = await getExportStats(user.id);
    setStats(exportStats);
  };

  useState(() => {
    loadStats();
  });

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="h-8 w-8 text-fuchsia-400" />
            Data Management
          </h1>
          <p className="text-slate-400 mt-1">
            Export, import, and manage your data
          </p>
        </div>

        {/* Export Section */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Download className="h-5 w-5 text-green-400" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-300">
              Download all your data as a JSON file. This includes tasks, reminders, notes, events, contacts, and more.
            </p>

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400">Total Items</p>
                  <p className="text-2xl font-bold text-white">{stats.totalItems}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400">Tasks</p>
                  <p className="text-2xl font-bold text-white">{stats.breakdown.tasks}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400">Notes</p>
                  <p className="text-2xl font-bold text-white">{stats.breakdown.notes}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400">File Size</p>
                  <p className="text-lg font-bold text-white">{stats.estimatedSize}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleExport}
              disabled={loading}
              className="w-full bg-green-600 text-white hover:bg-green-500"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-400" />
              Import Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-300 font-medium">Important</p>
                  <p className="text-xs text-yellow-400/80 mt-1">
                    Importing will merge with your existing data. Duplicate items may be created.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={importing}
                  className="bg-slate-800 border-slate-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-600 file:text-white hover:file:bg-fuchsia-500"
                />
              </label>
              {importing && (
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing data...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Safety */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Data Safety
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <FileJson className="h-5 w-5 text-fuchsia-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">JSON Format</p>
                <p className="text-xs text-slate-400">
                  Your data is exported in standard JSON format, readable by any text editor.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">Secure Storage</p>
                <p className="text-xs text-slate-400">
                  All data is stored securely in Supabase with Row Level Security enabled.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">Regular Backups</p>
                <p className="text-xs text-slate-400">
                  We recommend exporting your data weekly as a backup.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}