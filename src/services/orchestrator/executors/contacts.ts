import { supabase } from "@/integrations/supabase/client";
import { ActionResult } from '../types';
import { recordAction } from "@/services/action-history";

export async function executeCreateContact(
  userId: string,
  name: string,
  phone: string,
  email?: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase.from("contacts").insert({
      user_id: userId,
      name,
      phone,
      email: email || null,
      notes: notes || null,
    }).select().single();

    if (error) throw error;

    await recordAction(userId, "create", "contact", data.id, null, data);

    return {
      tool: "create_contact",
      success: true,
      data: { ...data, voiceText: `Contact added: ${name}.` },
    };
  } catch (error: any) {
    return {
      tool: "create_contact",
      success: false,
      error: error.message,
    };
  }
}

export async function executeGetContacts(
  userId: string,
  search?: string,
  limit?: number
): Promise<ActionResult> {
  try {
    let query = supabase.from("contacts").select("*").eq("user_id", userId);
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    query = query.order("name", { ascending: true });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;

    if (error) throw error;

    const voiceText = data && data.length > 0
      ? `You have ${data.length} contact${data.length > 1 ? 's' : ''}${search ? ` matching "${search}"` : ""}.`
      : `No contacts found${search ? ` matching "${search}"` : ""}.`;

    return {
      tool: "get_contacts",
      success: true,
      data: { contacts: data, voiceText },
    };
  } catch (error: any) {
    return {
      tool: "get_contacts",
      success: false,
      error: error.message,
    };
  }
}

export async function executeSearchContacts(
  userId: string,
  query: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", userId)
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .order("name", { ascending: true })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        tool: "search_contacts",
        success: true,
        data: {
          contacts: [],
          voiceText: `I couldn't find any contacts matching "${query}".`,
        },
      };
    }

    const voiceText = `Found ${data.length} contact${data.length > 1 ? 's' : ''} matching "${query}". ${data.slice(0, 3).map((c, i) => `${i + 1}. ${c.name}`).join(". ")}`;

    return {
      tool: "search_contacts",
      success: true,
      data: {
        contacts: data,
        voiceText,
      },
    };
  } catch (error: any) {
    return {
      tool: "search_contacts",
      success: false,
      error: error.message,
    };
  }
}

export async function executeUpdateContact(
  userId: string,
  contactId?: string,
  contactName?: string,
  newName?: string,
  newPhone?: string,
  newEmail?: string,
  newNotes?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("contacts").select("*").eq("user_id", userId);
    
    if (contactId) {
      query = query.eq("id", contactId);
    } else if (contactName) {
      query = query.ilike("name", `%${contactName}%`);
    } else {
      return { tool: "update_contact", success: false, error: "Either contact_id or contact_name is required" };
    }

    const { data: contact, error: fetchError } = await query.single();
    if (fetchError || !contact) {
      return { tool: "update_contact", success: false, error: "Contact not found" };
    }

    const updates: any = {};
    if (newName) updates.name = newName;
    if (newPhone) updates.phone = newPhone;
    if (newEmail) updates.email = newEmail;
    if (newNotes !== undefined) updates.notes = newNotes;

    const { data, error } = await supabase
      .from("contacts")
      .update(updates)
      .eq("id", contact.id)
      .select()
      .single();

    if (error) throw error;

    await recordAction(userId, "update", "contact", contact.id, contact, data);

    return {
      tool: "update_contact",
      success: true,
      data: {
        contact: data,
        voiceText: `Updated contact: ${data.name}.`,
      },
    };
  } catch (error: any) {
    return { tool: "update_contact", success: false, error: error.message };
  }
}

export async function executeDeleteContact(
  userId: string,
  contactId?: string,
  contactName?: string
): Promise<ActionResult> {
  try {
    let query = supabase.from("contacts").select("*").eq("user_id", userId);
    
    if (contactId) {
      query = query.eq("id", contactId);
    } else if (contactName) {
      query = query.ilike("name", `%${contactName}%`);
    } else {
      return { tool: "delete_contact", success: false, error: "Either contact_id or contact_name is required" };
    }

    const { data: contact, error: fetchError } = await query.single();
    if (fetchError || !contact) {
      return { tool: "delete_contact", success: false, error: "Contact not found" };
    }

    await recordAction(userId, "delete", "contact", contact.id, contact, null);

    const { error } = await supabase.from("contacts").delete().eq("id", contact.id);
    if (error) throw error;

    return {
      tool: "delete_contact",
      success: true,
      data: {
        contact,
        voiceText: `Deleted contact: ${contact.name}.`,
      },
    };
  } catch (error: any) {
    return { tool: "delete_contact", success: false, error: error.message };
  }
}

export async function executeCallContact(
  userId: string,
  contactName: string
): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", `%${contactName}%`)
      .limit(1)
      .single();

    if (error || !data) {
      return {
        tool: "call_contact",
        success: false,
        error: `Contact "${contactName}" not found`,
      };
    }

    return {
      tool: "call_contact",
      success: true,
      data: {
        contact: data,
        phoneUrl: `tel:${data.phone}`,
        voiceText: `Ready to call ${data.name} at ${data.phone}. Opening phone dialer.`,
      },
    };
  } catch (error: any) {
    return {
      tool: "call_contact",
      success: false,
      error: error.message,
    };
  }
}

export async function executeSendMessageToContact(
  userId: string,
  contactName: string,
  message: string
): Promise<ActionResult> {
  try {
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", `%${contactName}%`)
      .limit(1)
      .single();

    if (contactError || !contact) {
      return {
        tool: "send_message_to_contact",
        success: false,
        error: `Contact "${contactName}" not found`,
      };
    }

    const { data, error } = await supabase.from("sms_logs").insert({
      user_id: userId,
      direction: "outbound",
      status: "draft",
      to_number: contact.phone,
      text: message,
    }).select().single();

    if (error) throw error;

    return {
      tool: "send_message_to_contact",
      success: true,
      data: {
        draft: data,
        contact,
        voiceText: `Message draft created for ${contact.name}. You can review and send it from Messages.`,
      },
    };
  } catch (error: any) {
    return {
      tool: "send_message_to_contact",
      success: false,
      error: error.message,
    };
  }
}