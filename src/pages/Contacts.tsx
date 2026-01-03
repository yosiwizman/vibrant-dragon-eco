import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Users, Phone, Search, Edit, User, Mic } from "lucide-react";
import VoiceHint from "@/components/VoiceHint";
import { format } from "date-fns";

interface Contact {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  created_at: string;
}

export default function Contacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
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
      .order("name", { ascending: true });

    if (error) {
      showError("Failed to load contacts");
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const saveContact = async () => {
    if (!user || !newName.trim() || !newPhone.trim()) {
      showError("Name and phone are required");
      return;
    }

    if (editingContact) {
      const { error } = await supabase
        .from("contacts")
        .update({
          name: newName.trim(),
          phone: newPhone.trim(),
          notes: newNotes.trim() || null,
        })
        .eq("id", editingContact.id);

      if (error) {
        showError("Failed to update contact");
      } else {
        loadContacts();
        showSuccess("Contact updated!");
      }
    } else {
      const { error } = await supabase.from("contacts").insert({
        user_id: user.id,
        name: newName.trim(),
        phone: newPhone.trim(),
        notes: newNotes.trim() || null,
      });

      if (error) {
        showError("Failed to create contact");
      } else {
        loadContacts();
        showSuccess("Contact added!");
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setNewName("");
    setNewPhone("");
    setNewNotes("");
    setEditingContact(null);
    setIsDialogOpen(false);
  };

  const editContact = (contact: Contact) => {
    setEditingContact(contact);
    setNewName(contact.name);
    setNewPhone(contact.phone);
    setNewNotes(contact.notes || "");
    setIsDialogOpen(true);
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);

    if (error) {
      showError("Failed to delete contact");
    } else {
      setContacts(contacts.filter(c => c.id !== id));
      showSuccess("Contact deleted");
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  const callContact = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-400" />
              Contacts
            </h1>
            <p className="text-slate-400 mt-1">{contacts.length} contacts</p>
            <VoiceHint
              commands={["Add contact John Doe", "Find contact Sarah", "Call John"]}
              className="mt-2"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-fuchsia-600 text-white hover:bg-fuchsia-500" onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" /> Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingContact ? "Edit Contact" : "New Contact"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400">Name</label>
                  <Input
                    placeholder="John Doe"
                    className="bg-slate-800 border-slate-700 text-white"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Phone</label>
                  <Input
                    placeholder="+1 (555) 123-4567"
                    className="bg-slate-800 border-slate-700 text-white"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Notes (optional)</label>
                  <Textarea
                    placeholder="Add notes about this contact..."
                    className="bg-slate-800 border-slate-700 text-white"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm} className="border-slate-600 text-slate-300">
                    Cancel
                  </Button>
                  <Button onClick={saveContact} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                    {editingContact ? "Update" : "Add"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search contacts..."
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Contacts List */}
        <div className="space-y-2">
          {loading ? (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-8 text-center text-slate-400">
                Loading contacts...
              </CardContent>
            </Card>
          ) : filteredContacts.length === 0 ? (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {searchQuery ? "No contacts match your search." : "No contacts yet. Add one!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredContacts.map((contact) => (
              <Card
                key={contact.id}
                className="border-fuchsia-500/20 bg-black/30 backdrop-blur hover:border-fuchsia-500/40 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white">{contact.name}</h4>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </p>
                      {contact.notes && (
                        <p className="text-xs text-slate-500 mt-1 truncate">{contact.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => callContact(contact.phone)}
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editContact(contact)}
                        className="text-slate-400 hover:text-fuchsia-400"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteContact(contact.id)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}