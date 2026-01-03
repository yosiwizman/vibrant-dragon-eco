import type { Message } from "@/types/models";

export interface ConversationState {
  currentStep: number;
  totalSteps: number;
  intent: string;
  collectedData: Record<string, any>;
  pendingQuestion?: string;
  awaitingConfirmation: boolean;
  lastModification?: {
    field: string;
    oldValue: any;
    newValue: any;
  };
}

export interface MultiStepFlow {
  intent: string;
  steps: FlowStep[];
  onComplete: (data: Record<string, any>) => Promise<any>;
}

export interface FlowStep {
  field: string;
  prompt: string;
  required: boolean;
  validate?: (value: string) => boolean;
  transform?: (value: string) => any;
  skipIf?: (data: Record<string, any>) => boolean;
}

// Active conversation states by user
const activeConversations = new Map<string, ConversationState>();

// Predefined multi-step flows
export const MULTI_STEP_FLOWS: Record<string, MultiStepFlow> = {
  create_detailed_task: {
    intent: "create_detailed_task",
    steps: [
      {
        field: "title",
        prompt: "What's the task?",
        required: true,
      },
      {
        field: "priority",
        prompt: "What priority? (low, medium, high, or urgent)",
        required: false,
        validate: (v) => ["low", "medium", "high", "urgent"].includes(v.toLowerCase()),
        transform: (v) => v.toLowerCase(),
      },
      {
        field: "due_date",
        prompt: "When is it due?",
        required: false,
      },
      {
        field: "description",
        prompt: "Any additional details?",
        required: false,
      },
    ],
    onComplete: async (data) => data,
  },
  create_detailed_reminder: {
    intent: "create_detailed_reminder",
    steps: [
      {
        field: "text",
        prompt: "What should I remind you about?",
        required: true,
      },
      {
        field: "due_time",
        prompt: "When should I remind you?",
        required: true,
      },
      {
        field: "recurrence",
        prompt: "Should this repeat? (daily, weekly, or just once)",
        required: false,
      },
    ],
    onComplete: async (data) => data,
  },
  create_calendar_event: {
    intent: "create_calendar_event",
    steps: [
      {
        field: "title",
        prompt: "What's the event?",
        required: true,
      },
      {
        field: "start_time",
        prompt: "When does it start?",
        required: true,
      },
      {
        field: "duration",
        prompt: "How long will it be? (e.g., 1 hour, 30 minutes)",
        required: false,
      },
      {
        field: "location",
        prompt: "Where is it?",
        required: false,
      },
    ],
    onComplete: async (data) => data,
  },
};

/**
 * Start a multi-step conversation flow
 */
export function startMultiStepFlow(
  userId: string,
  flowName: string,
  initialData: Record<string, any> = {}
): { prompt: string; state: ConversationState } | null {
  const flow = MULTI_STEP_FLOWS[flowName];
  if (!flow) return null;

  const state: ConversationState = {
    currentStep: 0,
    totalSteps: flow.steps.length,
    intent: flowName,
    collectedData: { ...initialData },
    awaitingConfirmation: false,
  };

  // Skip steps that already have data or should be skipped
  while (state.currentStep < flow.steps.length) {
    const step = flow.steps[state.currentStep];
    if (state.collectedData[step.field] !== undefined) {
      state.currentStep++;
      continue;
    }
    if (step.skipIf && step.skipIf(state.collectedData)) {
      state.currentStep++;
      continue;
    }
    break;
  }

  if (state.currentStep >= flow.steps.length) {
    // All data already collected
    return null;
  }

  const currentStep = flow.steps[state.currentStep];
  state.pendingQuestion = currentStep.prompt;

  activeConversations.set(userId, state);

  return { prompt: currentStep.prompt, state };
}

/**
 * Process user response in a multi-step flow
 */
export function processMultiStepResponse(
  userId: string,
  userResponse: string
): {
  complete: boolean;
  nextPrompt?: string;
  collectedData?: Record<string, any>;
  state: ConversationState | null;
} {
  const state = activeConversations.get(userId);
  if (!state) {
    return { complete: false, state: null };
  }

  const flow = MULTI_STEP_FLOWS[state.intent];
  if (!flow) {
    activeConversations.delete(userId);
    return { complete: false, state: null };
  }

  const currentStep = flow.steps[state.currentStep];

  // Handle confirmation responses
  if (state.awaitingConfirmation) {
    const isConfirmed = /\b(yes|yeah|yep|sure|ok|okay|confirm|correct)\b/i.test(userResponse);
    const isDenied = /\b(no|nope|cancel|stop|wrong|change)\b/i.test(userResponse);

    if (isConfirmed) {
      activeConversations.delete(userId);
      return {
        complete: true,
        collectedData: state.collectedData,
        state,
      };
    } else if (isDenied) {
      // Allow modification
      state.awaitingConfirmation = false;
      state.pendingQuestion = "What would you like to change?";
      return {
        complete: false,
        nextPrompt: state.pendingQuestion,
        state,
      };
    }
  }

  // Handle "skip" or "none" responses
  if (/\b(skip|none|no|nothing|next)\b/i.test(userResponse) && !currentStep.required) {
    state.currentStep++;
  } else {
    // Validate and store the response
    let value: any = userResponse.trim();

    if (currentStep.validate && !currentStep.validate(value)) {
      // Invalid response, ask again
      return {
        complete: false,
        nextPrompt: `Sorry, that doesn't seem right. ${currentStep.prompt}`,
        state,
      };
    }

    if (currentStep.transform) {
      value = currentStep.transform(value);
    }

    state.collectedData[currentStep.field] = value;
    state.currentStep++;
  }

  // Find next step
  while (state.currentStep < flow.steps.length) {
    const nextStep = flow.steps[state.currentStep];
    if (nextStep.skipIf && nextStep.skipIf(state.collectedData)) {
      state.currentStep++;
      continue;
    }
    break;
  }

  // Check if flow is complete
  if (state.currentStep >= flow.steps.length) {
    // Ask for confirmation
    state.awaitingConfirmation = true;
    const summary = generateSummary(state.intent, state.collectedData);
    state.pendingQuestion = `${summary} Is that correct?`;

    return {
      complete: false,
      nextPrompt: state.pendingQuestion,
      state,
    };
  }

  // Move to next step
  const nextStep = flow.steps[state.currentStep];
  state.pendingQuestion = nextStep.prompt;

  return {
    complete: false,
    nextPrompt: nextStep.prompt,
    state,
  };
}

/**
 * Check if user is in an active multi-step flow
 */
export function hasActiveFlow(userId: string): boolean {
  return activeConversations.has(userId);
}

/**
 * Get current flow state
 */
export function getFlowState(userId: string): ConversationState | null {
  return activeConversations.get(userId) || null;
}

/**
 * Cancel active flow
 */
export function cancelFlow(userId: string): boolean {
  return activeConversations.delete(userId);
}

/**
 * Handle inline modifications during flow
 * e.g., "actually make it high priority"
 */
export function handleInlineModification(
  userId: string,
  modification: string
): { handled: boolean; message?: string } {
  const state = activeConversations.get(userId);
  if (!state) return { handled: false };

  const lowerMod = modification.toLowerCase();

  // Priority modifications
  const priorityMatch = lowerMod.match(/\b(low|medium|high|urgent)\s*priority\b/);
  if (priorityMatch && state.collectedData.title) {
    const oldPriority = state.collectedData.priority;
    state.collectedData.priority = priorityMatch[1];
    state.lastModification = {
      field: "priority",
      oldValue: oldPriority,
      newValue: priorityMatch[1],
    };
    return {
      handled: true,
      message: `Got it, changed priority to ${priorityMatch[1]}.`,
    };
  }

  // Due date modifications
  if (/\b(due|by|before)\s+(tomorrow|today|next\s+\w+)/i.test(lowerMod)) {
    const dateMatch = lowerMod.match(/\b(tomorrow|today|next\s+\w+)/i);
    if (dateMatch) {
      const oldDate = state.collectedData.due_date;
      state.collectedData.due_date = dateMatch[1];
      state.lastModification = {
        field: "due_date",
        oldValue: oldDate,
        newValue: dateMatch[1],
      };
      return {
        handled: true,
        message: `Got it, due ${dateMatch[1]}.`,
      };
    }
  }

  return { handled: false };
}

/**
 * Generate a summary of collected data
 */
function generateSummary(intent: string, data: Record<string, any>): string {
  switch (intent) {
    case "create_detailed_task":
      let taskSummary = `I'll create a task: "${data.title}"`;
      if (data.priority && data.priority !== "medium") {
        taskSummary += ` with ${data.priority} priority`;
      }
      if (data.due_date) {
        taskSummary += `, due ${data.due_date}`;
      }
      return taskSummary + ".";

    case "create_detailed_reminder":
      let reminderSummary = `I'll remind you to "${data.text}" at ${data.due_time}`;
      if (data.recurrence && data.recurrence !== "once") {
        reminderSummary += `, repeating ${data.recurrence}`;
      }
      return reminderSummary + ".";

    case "create_calendar_event":
      let eventSummary = `I'll schedule "${data.title}" for ${data.start_time}`;
      if (data.duration) {
        eventSummary += ` (${data.duration})`;
      }
      if (data.location) {
        eventSummary += ` at ${data.location}`;
      }
      return eventSummary + ".";

    default:
      return `I've collected: ${JSON.stringify(data)}`;
  }
}

/**
 * Detect if user wants to start a multi-step flow
 */
export function detectMultiStepIntent(text: string): string | null {
  const lowerText = text.toLowerCase();

  // Detailed task creation
  if (/\b(create|add|new)\s+(a\s+)?(detailed|complex)\s+task\b/i.test(lowerText)) {
    return "create_detailed_task";
  }

  // Detailed reminder
  if (/\b(set|create)\s+(a\s+)?(detailed|recurring|repeating)\s+reminder\b/i.test(lowerText)) {
    return "create_detailed_reminder";
  }

  // Calendar event
  if (/\b(schedule|create|add)\s+(a\s+)?(meeting|event|appointment)\b/i.test(lowerText)) {
    return "create_calendar_event";
  }

  return null;
}