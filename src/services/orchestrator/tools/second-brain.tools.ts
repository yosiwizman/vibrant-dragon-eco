import { ToolDefinition } from '../types';

export const SECOND_BRAIN_TOOLS: ToolDefinition[] = [
  {
    name: 'start_second_brain',
    description: 'Start the Second Brain always-on assistant. Enables continuous listening, translation, fact-checking, and conversation indexing.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {
        wake_word: {
          type: 'string',
          description: 'The wake word to use (default: "echo")',
        },
      },
      required: [],
    },
    examples: [
      'Start second brain',
      'Enable always-on assistant',
      'Turn on continuous listening',
      'Activate second brain mode',
    ],
  },
  {
    name: 'stop_second_brain',
    description: 'Stop the Second Brain always-on assistant. Disables continuous listening and all Second Brain features.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    examples: [
      'Stop second brain',
      'Disable always-on assistant',
      'Turn off continuous listening',
      'Deactivate second brain',
    ],
  },
  {
    name: 'enter_privacy_mode',
    description: 'Enter privacy mode. The Second Brain will stop listening and recording until privacy mode is exited.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    examples: [
      'Give me privacy',
      'Enter privacy mode',
      'Stop listening',
      'Private conversation',
      'Mute the microphone',
    ],
  },
  {
    name: 'exit_privacy_mode',
    description: 'Exit privacy mode and resume Second Brain listening.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    examples: [
      'Exit privacy mode',
      'Resume listening',
      'Start listening again',
      'End private mode',
    ],
  },
  {
    name: 'search_conversations',
    description: 'Search through indexed conversations by keyword, topic, or person name.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query (keyword, topic, or person name)',
        },
      },
      required: ['query'],
    },
    examples: [
      'Search conversations about the party',
      'Find what we talked about yesterday',
      'Search for mentions of the project',
    ],
  },
  {
    name: 'get_conversations_with',
    description: 'Get all conversations with a specific person.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {
        person_name: {
          type: 'string',
          description: 'The name of the person',
        },
      },
      required: ['person_name'],
    },
    examples: [
      'What did Adam say?',
      'Show conversations with Sarah',
      'Get my talks with John',
      'What did we discuss with Mike?',
    ],
  },
  {
    name: 'get_items_from_conversation',
    description: 'Get items (like shopping lists, to-dos) mentioned in conversations with a specific person.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {
        person_name: {
          type: 'string',
          description: 'The name of the person who mentioned the items',
        },
        topic: {
          type: 'string',
          description: 'Optional topic to filter by (e.g., "party", "groceries")',
        },
      },
      required: ['person_name'],
    },
    examples: [
      'What items did Adam mention for the party?',
      'Get the list from Sarah',
      'What did John say to bring?',
    ],
  },
  {
    name: 'enable_fact_checking',
    description: 'Enable real-time fact checking during conversations.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    examples: [
      'Enable fact checking',
      'Turn on fact checker',
      'Start checking facts',
    ],
  },
  {
    name: 'disable_fact_checking',
    description: 'Disable real-time fact checking.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    examples: [
      'Disable fact checking',
      'Turn off fact checker',
      'Stop checking facts',
    ],
  },
  {
    name: 'get_second_brain_status',
    description: 'Get the current status of the Second Brain system.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    examples: [
      'Second brain status',
      'Is second brain active?',
      'Check always-on status',
    ],
  },
  {
    name: 'clear_conversation_memory',
    description: 'Clear all conversation memory and indexed conversations.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    examples: [
      'Clear conversation memory',
      'Delete all conversations',
      'Reset second brain memory',
    ],
  },
  {
    name: 'name_speaker',
    description: 'Assign a name to a detected speaker.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {
        speaker_id: {
          type: 'string',
          description: 'The ID of the speaker to name',
        },
        name: {
          type: 'string',
          description: 'The name to assign to the speaker',
        },
      },
      required: ['speaker_id', 'name'],
    },
    examples: [
      'Name that speaker Adam',
      'Call this person Sarah',
      'That was John speaking',
    ],
  },
  {
    name: 'get_detected_speakers',
    description: 'Get a list of all detected speakers.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    examples: [
      'Who has been speaking?',
      'List detected speakers',
      'Show all speakers',
    ],
  },
  {
    name: 'whisper_message',
    description: 'Whisper a message to the user quietly.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message to whisper',
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high', 'urgent'],
          description: 'The priority of the whisper',
        },
      },
      required: ['message'],
    },
    examples: [
      'Whisper a reminder',
      'Quietly tell me',
      'Whisper this to me',
    ],
  },
  {
    name: 'set_whisper_volume',
    description: 'Set the volume for whisper mode.',
    category: 'second_brain',
    parameters: {
      type: 'object',
      properties: {
        volume: {
          type: 'number',
          description: 'Volume level from 0 to 100',
        },
      },
      required: ['volume'],
    },
    examples: [
      'Set whisper volume to 50',
      'Make whispers quieter',
      'Increase whisper volume',
    ],
  },
];