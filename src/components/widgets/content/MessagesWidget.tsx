"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { openEmailClient, copyEmailToClipboard } from "@/services/email";
import { openSMSApp, copySMSToClipboard, formatPhoneNumber } from "@/services/sms";
import { 
  Send,
  Mail,
  MessageSquare,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Clock,
  RefreshCw,
  Edit
} from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  type: "email" | "sms";
  to: string;
  subject?: string;
  body: string;
  status: string;
  created_at: string;
}

export default function MessagesWidget() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [messageType, setMessageType] = useState<"email" | "sms">("email");
  const [filterType, setFilterType] = useState<"all" | "email" | "sms">("all");
  
  // Form fields
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
          .limit(20),
        supabase
          .from("sms_logs")
          .select("id, to_number, text, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const allMessages: Message[] = [];

      if (emailRes.data) {
        allMessages.push(...emailRes.data.map(e => ({
          id: e.id,
          type: "email" as const,
          to: e.to_email,
          subject: e.subject,
          body: e.body,
          status: e.status,
          created_at: e.created_at,
        })));
      }

      if (smsRes.data) {
        allMessages.push(...smsRes.data.map(s => ({
          id: s.id,
          type: "sms" as const,
          to: s.to_number,
          body: s.text,
          status: s.status,
          created_at: s.created_at,
        })));
      }

      allMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setMessages(allMessages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }

    setLoading(false);
  };

  const openNewMessage = (type: "email" | "sms") => {
    setEditingMessage(null);
    setMessageType(type);
    setNewTo("");
    setNewSubject("");
    setNewBody("");
    setIsDialogOpen(true);
  };

  const startEditMessage = (message: Message) => {
    setEditingMessage(message);
    setMessageType(message.type);
    setNewTo(message.to);
    setNewSubject(message.subject || "");
    setNewBody(message.body);
    setIsDialogOpen(true);
  };

  const createMessage = async () => {
    if (!user || !newTo.trim() || !newBody.trim()) {
      showError("Please fill in all required fields");
      return;
    }

    if (messageType === "email") {
      const { error } = await supabase.from("email_logs").insert({
        user_id: user.id,
        direction: "outbound",
        status: "draft",
        to_email: newTo.trim(),
        subject: newSubject.trim() || "No subject",
        body: newBody.trim(),
      });

      if (error) {
        showError("Failed to create email draft");
      } else {
        await loadMessages();
        resetForm();
        showSuccess("Email draft created!");
      }
    } else {
      const { error } = await supabase.from("sms_logs").insert({
        user_id: user.id,
        direction: "outbound",
        status: "draft",
        to_number: newTo.trim(),
        text: newBody.trim(),
      });

      if (error) {
        showError("Failed to create SMS draft");
      } else {
        await loadMessages();
        resetForm();
        showSuccess("SMS draft created!");
      }
    }
  };

  const updateMessage = async () => {
    if (!editingMessage || !newTo.trim() || !newBody.trim()) {
      showError("Please fill in all required fields");
      return;
    }

    const table = editingMessage.type === "email" ? "email_logs" : "sms_logs";
    const updates = editingMessage.type === "email" 
      ? { to_email: newTo.trim(), subject: newSubject.trim(), body: newBody.trim() }
      : { to_number: newTo.trim(), text: newBody.trim() };

    const { error } = await supabase
      .from(table)
      .update(updates)
      .eq("id", editingMessage.id);

    if (error) {
      showError("Failed to update message");
    } else {
      await loadMessages();
      resetForm();
      showSuccess("Message updated!");
    }
  };

  const deleteMessage = async (message: Message) => {
    const table = message.type === "email" ? "email_logs" : "sms_logs";
    const { error } = await supabase.from(table).delete().eq("id", message.id);

    if (error) {
      showError("Failed to delete message");
    } else {
      await loadMessages();
      showSuccess("Message deleted");
    }
  };

  const sendMessage = (message: Message) => {
    if (message.type === "email") {
      openEmailClient({
        to: message.to,
        subject: message.subject || "",
        body: message.body,
      });
    } else {
      openSMSApp({
        to: message.to,
        text: message.body,
      });
    }
  };

  const copyMessage = async (message: Message) => {
    const success = message.type === "email"
      ? await copyEmailToClipboard({
          to: message.to,
          subject: message.subject || "",
          body: message.body,
        })
      : await copySMSToClipboard({
          to: message.to,
          text: message.body,
        });

    if (success) showSuccess("Copied to clipboard");
    else showError("Failed to copy");
  };

  const resetForm = () => {
    setNewTo("");
    setNewSubject("");
    setNewBody("");
    setEditingMessage(null);
    setIsDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50 text-[9px]">Draft</Badge>;
      case "sent":
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/50 text-[9px]">Sent</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/50 text-[9px]">Failed</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-300 text-[9px]">{status}</Badge>;
    }
  };

  const filteredMessages = filterType === "all" 
    ? messages 
    : messages.filter(m => m.type === filterType);

  const emailCount = messages.filter(m => m.type === "email").length;
  const smsCount = messages.filter(m => m.type === "sms").length;

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Send className="h-4 w-4 text-emerald-400" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex-1 min-h-0 flex items-center justify-center">
          <div className="animate-pulse text-slate-400 text-xs">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-400" />
              Messages
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={loadMessages}
                disabled={loading}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openNewMessage("email")}
                className="h-6 w-6 p-0 text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 flex-1 min-h-0 flex flex-col gap-2">
          {/* Filter Chips */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => setFilterType("all")}
              className={filterType === "all" 
                ? "h-5 px-2 text-[9px] bg-emerald-600 text-white" 
                : "h-5 px-2 text-[9px] border-slate-600 text-slate-400"
              }
            >
              All ({messages.length})
            </Button>
            <Button
              size="sm"
              variant={filterType === "email" ? "default" : "outline"}
              onClick={() => setFilterType("email")}
              className={filterType === "email" 
                ? "h-5 px-2 text-[9px] bg-emerald-600 text-white" 
                : "h-5 px-2 text-[9px] border-slate-600 text-slate-400"
              }
            >
              <Mail className="h-2.5 w-2.5 mr-1" />
              {emailCount}
            </Button>
            <Button
              size="sm"
              variant={filterType === "sms" ? "default" : "outline"}
              onClick={() => setFilterType("sms")}
              className={filterType === "sms" 
                ? "h-5 px-2 text-[9px] bg-emerald-600 text-white" 
                : "h-5 px-2 text-[9px] border-slate-600 text-slate-400"
              }
            >
              <MessageSquare className="h-2.5 w-2.5 mr-1" />
              {smsCount}
            </Button>
          </div>

          {/* Messages List */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-2">
            {filteredMessages.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-4">
                No {filterType === "all" ? "" : filterType} messages
              </p>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {message.type === "email" ? (
                        <Mail className="h-3 w-3 text-blue-400 shrink-0" />
                      ) : (
                        <MessageSquare className="h-3 w-3 text-green-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">To:</span>
                          <span className="text-xs text-white truncate">
                            {message.type === "sms" ? formatPhoneNumber(message.to) : message.to}
                          </span>
                        </div>
                        {message.subject && (
                          <p className="text-xs text-white font-medium truncate">{message.subject}</p>
                        )}
                        <p className="text-[10px] text-slate-400 line-clamp-2">{message.body}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {getStatusBadge(message.status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-600">
                      {format(new Date(message.created_at), "MMM d, h:mm a")}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => sendMessage(message)}
                        className="h-5 w-5 p-0 text-slate-400 hover:text-emerald-400"
                        title="Send"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(message)}
                        className="h-5 w-5 p-0 text-slate-400 hover:text-blue-400"
                        title="Copy"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditMessage(message)}
                        className="h-5 w-5 p-0 text-slate-400 hover:text-cyan-400"
                        title="Edit"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMessage(message)}
                        className="h-5 w-5 p-0 text-slate-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {messageType === "email" ? (
                <><Mail className="h-5 w-5 text-blue-400" /> {editingMessage ? "Edit Email" : "New Email"}</>
              ) : (
                <><MessageSquare className="h-5 w-5 text-green-400" /> {editingMessage ? "Edit SMS" : "New SMS"}</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingMessage && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={messageType === "email" ? "default" : "outline"}
                  onClick={() => setMessageType("email")}
                  className={messageType === "email" 
                    ? "flex-1 bg-blue-600 text-white" 
                    : "flex-1 border-slate-600 text-slate-300"
                  }
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
                <Button
                  size="sm"
                  variant={messageType === "sms" ? "default" : "outline"}
                  onClick={() => setMessageType("sms")}
                  className={messageType === "sms" 
                    ? "flex-1 bg-green-600 text-white" 
                    : "flex-1 border-slate-600 text-slate-300"
                  }
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  SMS
                </Button>
              </div>
            )}

            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                To {messageType === "email" ? "(Email)" : "(Phone)"} *
              </label>
              <Input
                placeholder={messageType === "email" ? "email@example.com" : "+1 (555) 123-4567"}
                className="bg-slate-800 border-slate-700 text-white"
                value={newTo}
                onChange={(e) => setNewTo(e.target.value)}
              />
            </div>

            {messageType === "email" && (
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Subject</label>
                <Input
                  placeholder="Email subject"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="text-sm text-slate-400 mb-1 block">Message *</label>
              <Textarea
                placeholder={messageType === "email" ? "Email body..." : "Message text..."}
                className="bg-slate-800 border-slate-700 text-white resize-none"
                rows={6}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={resetForm}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={editingMessage ? updateMessage : createMessage}
                className="bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {editingMessage ? "Update" : "Save Draft"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}