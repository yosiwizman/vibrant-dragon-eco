"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit,
  Phone,
  Mail,
  MessageSquare,
  User
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  created_at: string;
}

export default function ContactsWidget() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form fields
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    if (user) loadContacts();
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Failed to load contacts:", error);
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const openNewContact = () => {
    setEditingContact(null);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setNewNotes("");
    setIsDialogOpen(true);
  };

  const startEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setNewName(contact.name);
    setNewPhone(contact.phone);
    setNewEmail(contact.email || "");
    setNewNotes(contact.notes || "");
    setIsDialogOpen(true);
  };

  const createContact = async () => {
    if (!user || !newName.trim() || !newPhone.trim()) {
      showError("Please enter name and phone number");
      return;
    }

    const { error } = await supabase.from("contacts").insert({
      user_id: user.id,
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || null,
      notes: newNotes.trim() || null,
    });

    if (error) {
      showError("Failed to create contact");
    } else {
      await loadContacts();
      resetForm();
      showSuccess("Contact created!");
    }
  };

  const updateContact = async () => {
    if (!editingContact || !newName.trim() || !newPhone.trim()) {
      showError("Please enter name and phone number");
      return;
    }

    const updates = {
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || null,
      notes: newNotes.trim() || null,
    };

    const { error } = await supabase
      .from("contacts")
      .update(updates)
      .eq("id", editingContact.id);

    if (error) {
      showError("Failed to update contact");
    } else {
      await loadContacts();
      resetForm();
      showSuccess("Contact updated!");
    }
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) {
      showError("Failed to delete contact");
    } else {
      await loadContacts();
      showSuccess("Contact deleted");
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleMessage = (phone: string) => {
    window.location.href = `sms:${phone}`;
  };

  const resetForm = () => {
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setNewNotes("");
    setEditingContact(null);
    setIsDialogOpen(false);
  };

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.phone.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query)
    );
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            Contacts
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
              <Users className="h-4 w-4 text-cyan-400" />
              Contacts
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={openNewContact}
              className="h-6 w-6 p-0 text-cyan-400 hover:text-cyan-300"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 flex-1 min-h-0 flex flex-col gap-2">
          {/* Search */}
          <Input
            placeholder="Search contacts..."
            className="h-7 text-xs bg-slate-900/50 border-slate-700 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Contacts List */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-2">
            {filteredContacts.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-4">
                {searchQuery ? "No contacts found" : "No contacts yet"}
              </p>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50"
                >
                  <div className="flex items-start gap-2">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] text-cyan-400 font-medium">
                        {getInitials(contact.name)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium line-clamp-1">
                        {contact.name}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {contact.phone}
                      </p>
                      {contact.email && (
                        <p className="text-[10px] text-slate-500 line-clamp-1">
                          {contact.email}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCall(contact.phone)}
                          className="h-5 w-5 p-0 text-slate-400 hover:text-green-400"
                          title="Call"
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMessage(contact.phone)}
                          className="h-5 w-5 p-0 text-slate-400 hover:text-blue-400"
                          title="Message"
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        {contact.email && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEmail(contact.email!)}
                            className="h-5 w-5 p-0 text-slate-400 hover:text-purple-400"
                            title="Email"
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditContact(contact)}
                          className="h-5 w-5 p-0 text-slate-400 hover:text-cyan-400"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteContact(contact.id)}
                          className="h-5 w-5 p-0 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Notes Preview */}
                  {contact.notes && (
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                      {contact.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingContact ? "Edit Contact" : "New Contact"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Name *</label>
              <Input
                placeholder="Contact name"
                className="bg-slate-800 border-slate-700 text-white"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Phone *</label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                className="bg-slate-800 border-slate-700 text-white"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                className="bg-slate-800 border-slate-700 text-white"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Notes</label>
              <Textarea
                placeholder="Additional notes..."
                className="bg-slate-800 border-slate-700 text-white resize-none"
                rows={3}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
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
                onClick={editingContact ? updateContact : createContact}
                className="bg-cyan-600 text-white hover:bg-cyan-500"
              >
                {editingContact ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}