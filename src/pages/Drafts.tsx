"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, MessageSquare, Send, Trash2, Edit, Clock, Plus, RefreshCw } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";

interface EmailDraft {
  id: string;
  user_id: string;
  direction: string;
  status: string;
  from_email: string | null;
  to_email: string | null;
  subject: string | null;
  body: string | null;
  created_at: string;
}

interface SmsDraft {
  id: string;
  user_id: string;
  direction: string;
  status: string;
  from_number: string | null;
  to_number: string | null;
  text: string | null;
  created_at: string;
}

export default function Drafts() {
  const { user } = useAuth();
  const [emailDrafts, setEmailDrafts] = useState<EmailDraft[]>([]);
  const [smsDrafts, setSmsDrafts] = useState<SmsDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("email");
  const [editingEmail, setEditingEmail] = useState<EmailDraft | null>(null);
  const [editingSms, setEditingSms] = useState<SmsDraft | null>(null);

  const [emailForm, setEmailForm] = useState({
    to_email: "",
    subject: "",
    body: "",
  });

  const [smsForm, setSmsForm] = useState({
    to_number: "",
    text: "",
  });

  useEffect(() => {
    if (user) {
      loadDrafts();
    }
  }, [user]);

  const loadDrafts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [emailRes, smsRes] = await Promise.all([
        supabase
          .from("email_logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "draft")
          .order("created_at", { ascending: false }),
        supabase
          .from("sms_logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "draft")
          .order("created_at", { ascending: false }),
      ]);

      if (emailRes.error) throw emailRes.error;
      if (smsRes.error) throw smsRes.error;

      setEmailDrafts(emailRes.data || []);
      setSmsDrafts(smsRes.data || []);
    } catch (error: any) {
      showError(error.message || "Failed to load drafts");
    }

    setLoading(false);
  };

  const handleDeleteEmail = async (id: string) => {
    try {
      const { error } = await supabase.from("email_logs").delete().eq("id", id);
      if (error) throw error;
      setEmailDrafts(emailDrafts.filter((d) => d.id !== id));
      showSuccess("Email draft deleted");
    } catch (error: any) {
      showError(error.message || "Failed to delete draft");
    }
  };

  const handleDeleteSms = async (id: string) => {
    try {
      const { error } = await supabase.from("sms_logs").delete().eq("id", id);
      if (error) throw error;
      setSmsDrafts(smsDrafts.filter((d) => d.id !== id));
      showSuccess("SMS draft deleted");
    } catch (error: any) {
      showError(error.message || "Failed to delete draft");
    }
  };

  const handleEditEmail = (draft: EmailDraft) => {
    setEditingEmail(draft);
    setEmailForm({
      to_email: draft.to_email || "",
      subject: draft.subject || "",
      body: draft.body || "",
    });
  };

  const handleEditSms = (draft: SmsDraft) => {
    setEditingSms(draft);
    setSmsForm({
      to_number: draft.to_number || "",
      text: draft.text || "",
    });
  };

  const handleSaveEmail = async () => {
    if (!editingEmail) return;

    try {
      const { error } = await supabase
        .from("email_logs")
        .update({
          to_email: emailForm.to_email,
          subject: emailForm.subject,
          body: emailForm.body,
        })
        .eq("id", editingEmail.id);

      if (error) throw error;

      setEmailDrafts(
        emailDrafts.map((d) =>
          d.id === editingEmail.id
            ? { ...d, ...emailForm }
            : d
        )
      );
      setEditingEmail(null);
      showSuccess("Email draft updated");
    } catch (error: any) {
      showError(error.message || "Failed to update draft");
    }
  };

  const handleSaveSms = async () => {
    if (!editingSms) return;

    try {
      const { error } = await supabase
        .from("sms_logs")
        .update({
          to_number: smsForm.to_number,
          text: smsForm.text,
        })
        .eq("id", editingSms.id);

      if (error) throw error;

      setSmsDrafts(
        smsDrafts.map((d) =>
          d.id === editingSms.id
            ? { ...d, ...smsForm }
            : d
        )
      );
      setEditingSms(null);
      showSuccess("SMS draft updated");
    } catch (error: any) {
      showError(error.message || "Failed to update draft");
    }
  };

  const handleSendEmail = async (draft: EmailDraft) => {
    try {
      // In a real app, this would send the email via an API
      const { error } = await supabase
        .from("email_logs")
        .update({ status: "sent" })
        .eq("id", draft.id);

      if (error) throw error;

      setEmailDrafts(emailDrafts.filter((d) => d.id !== draft.id));
      showSuccess("Email marked as sent");
    } catch (error: any) {
      showError(error.message || "Failed to send email");
    }
  };

  const handleSendSms = async (draft: SmsDraft) => {
    try {
      // In a real app, this would send the SMS via an API
      const { error } = await supabase
        .from("sms_logs")
        .update({ status: "sent" })
        .eq("id", draft.id);

      if (error) throw error;

      setSmsDrafts(smsDrafts.filter((d) => d.id !== draft.id));
      showSuccess("SMS marked as sent");
    } catch (error: any) {
      showError(error.message || "Failed to send SMS");
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Mail className="h-8 w-8 text-fuchsia-400" />
              Drafts
            </h1>
            <p className="text-slate-400 mt-1">Manage your email and SMS drafts</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadDrafts}
            className="border-slate-600 text-slate-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border border-slate-700 mb-6">
            <TabsTrigger
              value="email"
              className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email ({emailDrafts.length})
            </TabsTrigger>
            <TabsTrigger
              value="sms"
              className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS ({smsDrafts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-slate-700 bg-black/30 animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-20 bg-slate-800 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : emailDrafts.length === 0 ? (
              <Card className="border-slate-700 bg-black/30">
                <CardContent className="p-12 text-center">
                  <Mail className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No email drafts</h3>
                  <p className="text-slate-400">
                    Ask Echo to draft an email and it will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {emailDrafts.map((draft) => (
                    <Card key={draft.id} className="border-slate-700 bg-black/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                                Draft
                              </Badge>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(parseISO(draft.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">
                              To: {draft.to_email || "[recipient]"}
                            </p>
                            <p className="font-medium text-white mb-2">
                              {draft.subject || "(No subject)"}
                            </p>
                            <p className="text-sm text-slate-300 line-clamp-2">
                              {draft.body || "(No content)"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                              onClick={() => handleSendEmail(draft)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300"
                              onClick={() => handleEditEmail(draft)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                              onClick={() => handleDeleteEmail(draft.id)}
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
          </TabsContent>

          <TabsContent value="sms">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-slate-700 bg-black/30 animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-16 bg-slate-800 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : smsDrafts.length === 0 ? (
              <Card className="border-slate-700 bg-black/30">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No SMS drafts</h3>
                  <p className="text-slate-400">
                    Ask Echo to draft a text message and it will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {smsDrafts.map((draft) => (
                    <Card key={draft.id} className="border-slate-700 bg-black/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                                Draft
                              </Badge>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(parseISO(draft.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">
                              To: {draft.to_number || "[recipient]"}
                            </p>
                            <p className="text-sm text-slate-300">
                              {draft.text || "(No content)"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                              onClick={() => handleSendSms(draft)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300"
                              onClick={() => handleEditSms(draft)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                              onClick={() => handleDeleteSms(draft.id)}
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
          </TabsContent>
        </Tabs>

        {/* Edit Email Dialog */}
        <Dialog open={!!editingEmail} onOpenChange={() => setEditingEmail(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Edit Email Draft</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>To</Label>
                <Input
                  className="bg-slate-800 border-slate-700"
                  placeholder="recipient@example.com"
                  value={emailForm.to_email}
                  onChange={(e) => setEmailForm({ ...emailForm, to_email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Input
                  className="bg-slate-800 border-slate-700"
                  placeholder="Email subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Body</Label>
                <Textarea
                  className="bg-slate-800 border-slate-700 min-h-[150px]"
                  placeholder="Email content..."
                  value={emailForm.body}
                  onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingEmail(null)}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEmail}
                  className="bg-fuchsia-600 hover:bg-fuchsia-500"
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit SMS Dialog */}
        <Dialog open={!!editingSms} onOpenChange={() => setEditingSms(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Edit SMS Draft</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>To</Label>
                <Input
                  className="bg-slate-800 border-slate-700"
                  placeholder="+1 555-123-4567"
                  value={smsForm.to_number}
                  onChange={(e) => setSmsForm({ ...smsForm, to_number: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Message</Label>
                <Textarea
                  className="bg-slate-800 border-slate-700"
                  placeholder="Message content..."
                  value={smsForm.text}
                  onChange={(e) => setSmsForm({ ...smsForm, text: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingSms(null)}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSms}
                  className="bg-fuchsia-600 hover:bg-fuchsia-500"
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}