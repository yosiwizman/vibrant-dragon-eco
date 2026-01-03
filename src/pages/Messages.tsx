import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { openEmailClient, copyEmailToClipboard } from "@/services/email";
import { openSMSApp, copySMSToClipboard, formatPhoneNumber } from "@/services/sms";
import {
  Mail,
  MessageSquare,
  Trash2,
  Copy,
  ExternalLink,
  Plus,
  Clock,
  Mic
} from "lucide-react";
import VoiceHint from "@/components/VoiceHint";
import { format } from "date-fns";

interface EmailDraft {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
}

interface SMSDraft {
  id: string;
  to_number: string;
  text: string;
  status: string;
  created_at: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("email");
  const [emailDrafts, setEmailDrafts] = useState<EmailDraft[]>([]);
  const [smsDrafts, setSMSDrafts] = useState<SMSDraft[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New message dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMessageType, setNewMessageType] = useState<"email" | "sms">("email");
  const [newTo, setNewTo] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");

  useEffect(() => {
    if (user) loadMessages();
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [emailRes, smsRes] = await Promise.all([
        supabase
          .from("email_logs")
          .select("id, to_email, subject, body, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("sms_logs")
          .select("id, to_number, text, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      setEmailDrafts(emailRes.data || []);
      setSMSDrafts(smsRes.data || []);
    } catch (error) {
      showError("Failed to load messages");
    }

    setLoading(false);
  };

  const deleteEmail = async (id: string) => {
    const { error } = await supabase.from("email_logs").delete().eq("id", id);
    if (error) {
      showError("Failed to delete");
    } else {
      setEmailDrafts(emailDrafts.filter(e => e.id !== id));
      showSuccess("Deleted");
    }
  };

  const deleteSMS = async (id: string) => {
    const { error } = await supabase.from("sms_logs").delete().eq("id", id);
    if (error) {
      showError("Failed to delete");
    } else {
      setSMSDrafts(smsDrafts.filter(s => s.id !== id));
      showSuccess("Deleted");
    }
  };

  const handleSendEmail = (draft: EmailDraft) => {
    openEmailClient({
      to: draft.to_email,
      subject: draft.subject,
      body: draft.body,
    });
  };

  const handleSendSMS = (draft: SMSDraft) => {
    openSMSApp({
      to: draft.to_number,
      text: draft.text,
    });
  };

  const handleCopyEmail = async (draft: EmailDraft) => {
    const success = await copyEmailToClipboard({
      to: draft.to_email,
      subject: draft.subject,
      body: draft.body,
    });
    if (success) showSuccess("Copied to clipboard");
    else showError("Failed to copy");
  };

  const handleCopySMS = async (draft: SMSDraft) => {
    const success = await copySMSToClipboard({
      to: draft.to_number,
      text: draft.text,
    });
    if (success) showSuccess("Copied to clipboard");
    else showError("Failed to copy");
  };

  const createNewMessage = async () => {
    if (!user) return;

    if (newMessageType === "email") {
      const { error } = await supabase.from("email_logs").insert({
        user_id: user.id,
        direction: "outbound",
        status: "draft",
        to_email: newTo,
        subject: newSubject,
        body: newBody,
      });

      if (error) {
        showError("Failed to create draft");
      } else {
        showSuccess("Email draft created");
        loadMessages();
      }
    } else {
      const { error } = await supabase.from("sms_logs").insert({
        user_id: user.id,
        direction: "outbound",
        status: "draft",
        to_number: newTo,
        text: newBody,
      });

      if (error) {
        showError("Failed to create draft");
      } else {
        showSuccess("SMS draft created");
        loadMessages();
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setNewTo("");
    setNewSubject("");
    setNewBody("");
    setIsDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">Draft</Badge>;
      case "sent":
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/50">Sent</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/50">Failed</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-300">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Mail className="h-8 w-8 text-blue-400" />
              Messages
            </h1>
            <p className="text-slate-400 mt-1">
              Email and SMS drafts
            </p>
            <VoiceHint
              commands={["Draft email to John about meeting", "Text Sarah I'm running late", "Send message to Mom"]}
              className="mt-2"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                <Plus className="h-4 w-4 mr-2" /> New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">New Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Tabs value={newMessageType} onValueChange={(v) => setNewMessageType(v as "email" | "sms")}>
                  <TabsList className="bg-slate-800 w-full">
                    <TabsTrigger value="email" className="flex-1 data-[state=active]:bg-fuchsia-600">
                      <Mail className="h-4 w-4 mr-2" /> Email
                    </TabsTrigger>
                    <TabsTrigger value="sms" className="flex-1 data-[state=active]:bg-fuchsia-600">
                      <MessageSquare className="h-4 w-4 mr-2" /> SMS
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Input
                  placeholder={newMessageType === "email" ? "To (email address)" : "To (phone number)"}
                  className="bg-slate-800 border-slate-700 text-white"
                  value={newTo}
                  onChange={(e) => setNewTo(e.target.value)}
                />

                {newMessageType === "email" && (
                  <Input
                    placeholder="Subject"
                    className="bg-slate-800 border-slate-700 text-white"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                  />
                )}

                <Textarea
                  placeholder={newMessageType === "email" ? "Email body..." : "Message text..."}
                  className="bg-slate-800 border-slate-700 text-white min-h-[150px]"
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                />

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm} className="border-slate-600 text-slate-300">
                    Cancel
                  </Button>
                  <Button onClick={createNewMessage} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                    Save Draft
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800">
            <TabsTrigger value="email" className="data-[state=active]:bg-fuchsia-600">
              <Mail className="h-4 w-4 mr-2" /> Emails ({emailDrafts.length})
            </TabsTrigger>
            <TabsTrigger value="sms" className="data-[state=active]:bg-fuchsia-600">
              <MessageSquare className="h-4 w-4 mr-2" /> SMS ({smsDrafts.length})
            </TabsTrigger>
          </TabsList>

          {/* Email Tab */}
          <TabsContent value="email" className="mt-4 space-y-3">
            {loading ? (
              <Card className="border-slate-700 bg-slate-800/50">
                <CardContent className="p-8 text-center text-slate-400">
                  Loading...
                </CardContent>
              </Card>
            ) : emailDrafts.length === 0 ? (
              <Card className="border-slate-700 bg-slate-800/50">
                <CardContent className="p-8 text-center">
                  <Mail className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No email drafts yet.</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Ask Echo to draft an email for you!
                  </p>
                </CardContent>
              </Card>
            ) : (
              emailDrafts.map((draft) => (
                <Card key={draft.id} className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-slate-400">To:</span>
                          <span className="text-white">{draft.to_email || "[No recipient]"}</span>
                          {getStatusBadge(draft.status)}
                        </div>
                        <h4 className="font-medium text-white truncate">
                          {draft.subject || "[No subject]"}
                        </h4>
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                          {draft.body}
                        </p>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(draft.created_at), "PPp")}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendEmail(draft)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Open in email app"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyEmail(draft)}
                          className="text-slate-400 hover:text-white"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEmail(draft.id)}
                          className="text-slate-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms" className="mt-4 space-y-3">
            {loading ? (
              <Card className="border-slate-700 bg-slate-800/50">
                <CardContent className="p-8 text-center text-slate-400">
                  Loading...
                </CardContent>
              </Card>
            ) : smsDrafts.length === 0 ? (
              <Card className="border-slate-700 bg-slate-800/50">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No SMS drafts yet.</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Ask Echo to draft a text message for you!
                  </p>
                </CardContent>
              </Card>
            ) : (
              smsDrafts.map((draft) => (
                <Card key={draft.id} className="border-fuchsia-500/20 bg-black/30 backdrop-blur">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-slate-400">To:</span>
                          <span className="text-white">
                            {draft.to_number ? formatPhoneNumber(draft.to_number) : "[No recipient]"}
                          </span>
                          {getStatusBadge(draft.status)}
                        </div>
                        <p className="text-white mt-1">{draft.text}</p>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(draft.created_at), "PPp")}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendSMS(draft)}
                          className="text-green-400 hover:text-green-300"
                          title="Open in SMS app"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopySMS(draft)}
                          className="text-slate-400 hover:text-white"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSMS(draft.id)}
                          className="text-slate-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}