import { ToolDefinition } from '../types';

export const APPOINTMENT_TOOLS: ToolDefinition[] = [
  {
    name: "create_appointment",
    description: "Create a new appointment or booking",
    parameters: {
      contact_name: "string (optional)",
      contact_phone: "string (optional)",
      start_time: "ISO datetime",
      end_time: "ISO datetime (optional)",
      notes: "string (optional)",
    },
    category: "appointments",
  },
  {
    name: "get_appointments",
    description: "Get upcoming appointments",
    parameters: { days: "number (default: 7)" },
    category: "appointments",
  },
  {
    name: "cancel_appointment",
    description: "Cancel an appointment",
    parameters: {
      appointment_id: "string (optional)",
      contact_name: "string (optional, to find by contact)",
    },
    category: "appointments",
  },
  {
    name: "reschedule_appointment",
    description: "Reschedule an appointment to a new time",
    parameters: {
      appointment_id: "string (optional)",
      contact_name: "string (optional)",
      new_start_time: "ISO datetime",
      new_end_time: "ISO datetime (optional)",
    },
    category: "appointments",
  },
];