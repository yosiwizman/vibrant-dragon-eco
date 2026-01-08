"use client";

import { logger } from "@/utils/logger";

interface VoiceMacro {
  id: string;
  name: string;
  trigger: string;
  commands: string[];
  description?: string;
  createdAt: number;
}

const DEFAULT_MACROS: VoiceMacro[] = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    trigger: 'morning routine',
    commands: [
      'get_weather',
      'read_tasks',
      'read_calendar',
      'get_daily_summary',
    ],
    description: 'Get weather, tasks, calendar, and daily summary',
    createdAt: Date.now(),
  },
  {
    id: 'end-of-day',
    name: 'End of Day',
    trigger: 'end of day',
    commands: [
      'get_productivity_stats',
      'get_overdue_tasks',
      'read_calendar tomorrow',
    ],
    description: 'Review productivity and plan tomorrow',
    createdAt: Date.now(),
  },
  {
    id: 'quick-status',
    name: 'Quick Status',
    trigger: 'quick status',
    commands: [
      'get_system_status',
      'get_upcoming_reminders',
    ],
    description: 'Quick overview of pending items',
    createdAt: Date.now(),
  },
  {
    id: 'focus-mode',
    name: 'Focus Mode',
    trigger: 'focus mode',
    commands: [
      'start_listening_mode context=focus session',
      'send_notification title=Focus Mode body=Do not disturb',
    ],
    description: 'Enter focus mode with DND',
    createdAt: Date.now(),
  },
];

/**
 * Voice Macros Service
 * Create and execute custom voice shortcuts
 */
class VoiceMacrosService {
  private macros: Map<string, VoiceMacro> = new Map();
  private recording: { name: string; commands: string[] } | null = null;

  constructor() {
    this.loadMacros();
  }

  /**
   * Load macros from storage
   */
  private loadMacros(): void {
    try {
      const stored = localStorage.getItem('echo:voice-macros');
      if (stored) {
        const macros: VoiceMacro[] = JSON.parse(stored);
        macros.forEach(m => this.macros.set(m.trigger.toLowerCase(), m));
      } else {
        // Load defaults
        DEFAULT_MACROS.forEach(m => this.macros.set(m.trigger.toLowerCase(), m));
        this.saveMacros();
      }
      
      logger.log('VoiceMacros', `Loaded ${this.macros.size} macros`);
    } catch (error) {
      logger.error('VoiceMacros', 'Failed to load macros:', error);
      // Load defaults on error
      DEFAULT_MACROS.forEach(m => this.macros.set(m.trigger.toLowerCase(), m));
    }
  }

  /**
   * Save macros to storage
   */
  private saveMacros(): void {
    try {
      const macros = Array.from(this.macros.values());
      localStorage.setItem('echo:voice-macros', JSON.stringify(macros));
      logger.log('VoiceMacros', 'Saved macros');
    } catch (error) {
      logger.error('VoiceMacros', 'Failed to save macros:', error);
    }
  }

  /**
   * Check if command is a macro
   */
  isMacro(command: string): boolean {
    return this.macros.has(command.toLowerCase());
  }

  /**
   * Get macro by trigger
   */
  getMacro(trigger: string): VoiceMacro | null {
    return this.macros.get(trigger.toLowerCase()) || null;
  }

  /**
   * Execute macro
   */
  async executeMacro(trigger: string): Promise<{
    success: boolean;
    results: any[];
    message: string;
  }> {
    const macro = this.getMacro(trigger);
    
    if (!macro) {
      return {
        success: false,
        results: [],
        message: `Macro "${trigger}" not found`,
      };
    }

    logger.log('VoiceMacros', `Executing macro: ${macro.name}`);

    const results: any[] = [];

    // Execute each command in sequence
    for (const command of macro.commands) {
      try {
        // This would integrate with voice command processing
        const result = await this.executeCommand(command);
        results.push(result);
      } catch (error) {
        logger.error('VoiceMacros', `Command failed: ${command}`, error);
        results.push({ success: false, error });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      results,
      message: `Executed ${macro.name}: ${successCount}/${macro.commands.length} commands successful`,
    };
  }

  /**
   * Execute single command
   */
  private async executeCommand(command: string): Promise<any> {
    // This would integrate with the orchestrator
    // For now, return success
    return { success: true, command };
  }

  /**
   * Start recording new macro
   */
  startRecording(name: string): void {
    this.recording = {
      name,
      commands: [],
    };
    logger.log('VoiceMacros', `Started recording macro: ${name}`);
  }

  /**
   * Add command to recording
   */
  recordCommand(command: string): void {
    if (!this.recording) {
      logger.warn('VoiceMacros', 'No recording in progress');
      return;
    }

    this.recording.commands.push(command);
    logger.log('VoiceMacros', `Recorded command: ${command}`);
  }

  /**
   * Stop recording and save macro
   */
  stopRecording(trigger: string): VoiceMacro | null {
    if (!this.recording) {
      logger.warn('VoiceMacros', 'No recording in progress');
      return null;
    }

    const macro: VoiceMacro = {
      id: `macro-${Date.now()}`,
      name: this.recording.name,
      trigger: trigger.toLowerCase(),
      commands: this.recording.commands,
      createdAt: Date.now(),
    };

    this.macros.set(macro.trigger, macro);
    this.saveMacros();

    logger.log('VoiceMacros', `Saved macro: ${macro.name} with ${macro.commands.length} commands`);

    this.recording = null;
    return macro;
  }

  /**
   * Cancel recording
   */
  cancelRecording(): void {
    this.recording = null;
    logger.log('VoiceMacros', 'Cancelled recording');
  }

  /**
   * Delete macro
   */
  deleteMacro(trigger: string): boolean {
    const deleted = this.macros.delete(trigger.toLowerCase());
    if (deleted) {
      this.saveMacros();
      logger.log('VoiceMacros', `Deleted macro: ${trigger}`);
    }
    return deleted;
  }

  /**
   * Get all macros
   */
  getAllMacros(): VoiceMacro[] {
    return Array.from(this.macros.values());
  }

  /**
   * Get recording status
   */
  getRecordingStatus(): { isRecording: boolean; name?: string; commandCount?: number } {
    if (!this.recording) {
      return { isRecording: false };
    }

    return {
      isRecording: true,
      name: this.recording.name,
      commandCount: this.recording.commands.length,
    };
  }
}

export const voiceMacros = new VoiceMacrosService();