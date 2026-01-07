"use client";

import { logger } from "@/utils/logger";

interface Intent {
  type: string;
  confidence: number;
  suggestedTool: string;
  parameters?: Record<string, any>;
}

/**
 * Intent Prediction Service
 * Predicts user intent from partial transcripts for faster processing
 */
class IntentPredictorService {
  private intentPatterns: Map<RegExp, Intent> = new Map();

  constructor() {
    this.initializePatterns();
  }

  /**
   * Initialize intent patterns
   */
  private initializePatterns(): void {
    // Task patterns
    this.addPattern(/\b(add|create|new)\s+(task|todo|to-do)/i, {
      type: 'create_task',
      confidence: 0.9,
      suggestedTool: 'create_task',
    });

    // Reminder patterns
    this.addPattern(/\b(remind|reminder|don't forget)/i, {
      type: 'create_reminder',
      confidence: 0.9,
      suggestedTool: 'create_reminder',
    });

    // Note patterns
    this.addPattern(/\b(note|write down|save this|remember this)/i, {
      type: 'create_note',
      confidence: 0.85,
      suggestedTool: 'create_note',
    });

    // Calendar patterns
    this.addPattern(/\b(schedule|calendar|meeting|appointment)/i, {
      type: 'create_event',
      confidence: 0.85,
      suggestedTool: 'create_calendar_event',
    });

    // Search patterns
    this.addPattern(/\b(search|find|look for|show me)/i, {
      type: 'search',
      confidence: 0.8,
      suggestedTool: 'search_notes',
    });

    // Weather patterns
    this.addPattern(/\b(weather|temperature|forecast)/i, {
      type: 'get_weather',
      confidence: 0.95,
      suggestedTool: 'get_weather',
    });

    // Navigation patterns
    this.addPattern(/\b(open|go to|show|navigate)/i, {
      type: 'navigate',
      confidence: 0.9,
      suggestedTool: 'navigate_to',
    });

    // Read patterns
    this.addPattern(/\b(read|tell me|what are|list)\s+(my\s+)?(tasks|reminders|notes|calendar)/i, {
      type: 'read_data',
      confidence: 0.9,
      suggestedTool: 'read_tasks',
    });
  }

  /**
   * Add intent pattern
   */
  private addPattern(pattern: RegExp, intent: Intent): void {
    this.intentPatterns.set(pattern, intent);
  }

  /**
   * Predict intent from partial transcript
   */
  predict(partialTranscript: string): Intent | null {
    for (const [pattern, intent] of this.intentPatterns) {
      if (pattern.test(partialTranscript)) {
        logger.log('IntentPredictor', `Predicted: ${intent.type} (${intent.confidence})`);
        return intent;
      }
    }

    return null;
  }

  /**
   * Predict with confidence threshold
   */
  predictWithThreshold(partialTranscript: string, minConfidence: number = 0.8): Intent | null {
    const intent = this.predict(partialTranscript);
    
    if (intent && intent.confidence >= minConfidence) {
      return intent;
    }

    return null;
  }

  /**
   * Get suggested parameters based on intent
   */
  getSuggestedParameters(intent: Intent, transcript: string): Record<string, any> {
    const params: Record<string, any> = {};

    switch (intent.type) {
      case 'create_task':
        params.title = this.extractTaskTitle(transcript);
        params.priority = this.extractPriority(transcript);
        break;

      case 'create_reminder':
        params.text = this.extractReminderText(transcript);
        params.due_time = this.extractTime(transcript);
        break;

      case 'create_note':
        params.title = this.extractNoteTitle(transcript);
        params.content = transcript;
        break;

      case 'navigate':
        params.page = this.extractPage(transcript);
        break;
    }

    return params;
  }

  /**
   * Extract task title from transcript
   */
  private extractTaskTitle(transcript: string): string {
    const match = transcript.match(/(?:add|create|new)\s+(?:task|todo|to-do)\s+(.+)/i);
    return match ? match[1].trim() : transcript;
  }

  /**
   * Extract priority from transcript
   */
  private extractPriority(transcript: string): string {
    const lower = transcript.toLowerCase();
    if (lower.includes('urgent') || lower.includes('asap')) return 'urgent';
    if (lower.includes('high priority') || lower.includes('important')) return 'high';
    if (lower.includes('low priority')) return 'low';
    return 'medium';
  }

  /**
   * Extract reminder text
   */
  private extractReminderText(transcript: string): string {
    const match = transcript.match(/(?:remind|reminder)\s+(?:me\s+)?(?:to\s+)?(.+?)(?:\s+at|\s+in|\s+on|$)/i);
    return match ? match[1].trim() : transcript;
  }

  /**
   * Extract time from transcript
   */
  private extractTime(transcript: string): string | null {
    // Simple time extraction (can be enhanced)
    const timeMatch = transcript.match(/\b(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (timeMatch) {
      // Return ISO time (simplified)
      return new Date().toISOString();
    }
    return null;
  }

  /**
   * Extract note title
   */
  private extractNoteTitle(transcript: string): string {
    const match = transcript.match(/(?:note|write down|save)\s+(?:this\s+)?(?:about\s+)?(.+)/i);
    return match ? match[1].substring(0, 50).trim() : 'Quick Note';
  }

  /**
   * Extract page name
   */
  private extractPage(transcript: string): string {
    const match = transcript.match(/(?:open|go to|show|navigate)\s+(?:to\s+)?(.+)/i);
    return match ? match[1].trim() : 'home';
  }
}

export const intentPredictor = new IntentPredictorService();