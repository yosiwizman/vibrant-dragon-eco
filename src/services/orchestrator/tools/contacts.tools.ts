import { ToolDefinition } from '../types';

export const CONTACT_TOOLS: ToolDefinition[] = [
  {
    name: "create_contact",
    description: "Add a new contact to the address book",
    parameters: {
      name: "string",
      phone: "string",
      email: "string (optional)",
      notes: "string (optional)",
    },
    category: "contacts",
  },
  {
    name: "get_contacts",
    description: "Get the user's contacts",
    parameters: {
      search: "string (optional)",
      limit: "number (optional)",
    },
    category: "contacts",
  },
  {
    name: "search_contacts",
    description: "Search for a contact by name or phone",
    parameters: { query: "string" },
    category: "contacts",
  },
  {
    name: "update_contact",
    description: "Update a contact's information",
    parameters: {
      contact_id: "string (optional)",
      contact_name: "string (optional)",
      new_name: "string (optional)",
      new_phone: "string (optional)",
      new_email: "string (optional)",
      new_notes: "string (optional)",
    },
    category: "contacts",
  },
  {
    name: "delete_contact",
    description: "Delete a contact",
    parameters: {
      contact_id: "string (optional)",
      contact_name: "string (optional)",
    },
    category: "contacts",
  },
  {
    name: "call_contact",
    description: "Initiate a phone call to a contact",
    parameters: { contact_name: "string" },
    category: "contacts",
  },
  {
    name: "send_message_to_contact",
    description: "Draft a message to a contact",
    parameters: {
      contact_name: "string",
      message: "string",
    },
    category: "contacts",
  },
];