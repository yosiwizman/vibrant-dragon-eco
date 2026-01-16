"use client";

import { logger } from "@/utils/logger";

interface WhisperConfig {
  volume: number;
  rate: number;
  pitch: number;
  voice?: SpeechSynthesisVoice;
}

interface WhisperMessage {
  id: string;
  text: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: number;
  spoken: boolean;
}

/**
 * Whisper Mode Service
 * Provides quiet, unobtrusive voice notifications
 */
class WhisperModeService {
  private isEnabled = true;
  private config: WhisperConfig = {
    volume: 0.3,
    rate: 1.2,
    pitch: 1.0,
  };
  private messageQueue: WhisperMessage[] = [];
  private isSpeaking = false;
  private preferredVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.initializeVoice();
  }

  /**
   * Initialize preferred voice
   */
  private initializeVoice(): void {
    if (typeof window === 'undefined') return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Prefer a natural-sounding voice
      const preferredVoices = [
        'Google US English',
        'Microsoft Zira',
        'Samantha',
        'Karen',
        'Daniel',
      ];

      for (const name of preferredVoices) {
        const voice = voices.find(v => v.name.includes(name));
        if (voice) {
          this.preferredVoice = voice;
          this.config.voice = voice;
          logger.log('WhisperMode', `Using voice: ${voice.name}`);
          break;
        }
      }

      // Fallback to first English voice
      if (!this.preferredVoice) {
        this.preferredVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        if (this.preferredVoice) {
          this.config.voice = this.preferredVoice;
        }
      }
    };

    // Load voices (may be async)
    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices();
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Whisper a message to the user
   */
  async whisper(
    text: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<void> {
    if (!this.isEnabled) return;

    const message: WhisperMessage = {
      id: `whisper-${Date.now()}`,
      text,
      priority,
      timestamp: Date.now(),
      spoken: false,
    };

    // Add to queue based on priority
    if (priority === 'urgent') {
      // Urgent messages go to front
      this.messageQueue.unshift(message);
    } else {
      this.messageQueue.push(message);
    }

    // Process queue
    await this.processQueue();
  }

  /**
   * Process message queue
   */
  private async processQueue(): Promise<void> {
    if (this.isSpeaking || this.messageQueue.length === 0) return;

    this.isSpeaking = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      await this.speak(message);
    }

    this.isSpeaking = false;
  }

  /**
   * Speak a message
   */
  private speak(message: WhisperMessage): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(message.text);
      
      // Apply whisper config
      utterance.volume = this.getVolumeForPriority(message.priority);
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;
      
      if (this.config.voice) {
        utterance.voice = this.config.voice;
      }

      utterance.onend = () => {
        message.spoken = true;
        logger.log('WhisperMode', `Whispered: "${message.text.substring(0, 30)}..."`);
        resolve();
      };

      utterance.onerror = (event) => {
        logger.error('WhisperMode', 'Speech error:', event.error);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Get volume based on priority
   */
  private getVolumeForPriority(priority: string): number {
    switch (priority) {
      case 'urgent':
        return Math.min(0.6, this.config.volume * 2);
      case 'high':
        return Math.min(0.5, this.config.volume * 1.5);
      case 'low':
        return this.config.volume * 0.7;
      default:
        return this.config.volume;
    }
  }

  /**
   * Whisper a translation
   */
  async whisperTranslation(
    originalLanguage: string,
    translation: string
  ): Promise<void> {
    const text = `They said in ${originalLanguage}: ${translation}`;
    await this.whisper(text, 'high');
  }

  /**
   * Whisper a fact check result
   */
  async whisperFactCheck(
    claim: string,
    suggestion: string
  ): Promise<void> {
    await this.whisper(suggestion, 'high');
  }

  /**
   * Whisper a reminder
   */
  async whisperReminder(text: string): Promise<void> {
    await this.whisper(`Reminder: ${text}`, 'normal');
  }

  /**
   * Whisper a suggestion
   */
  async whisperSuggestion(text: string): Promise<void> {
    await this.whisper(text, 'low');
  }

  /**
   * Enable whisper mode
   */
  enable(): void {
    this.isEnabled = true;
    logger.log('WhisperMode', 'Enabled');
  }

  /**
   * Disable whisper mode
   */
  disable(): void {
    this.isEnabled = false;
    this.messageQueue = [];
    window.speechSynthesis?.cancel();
    logger.log('WhisperMode', 'Disabled');
  }

  /**
   * Check if enabled
   */
  isWhisperEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0.1, Math.min(1, volume));
    logger.log('WhisperMode', `Volume set to ${this.config.volume}`);
  }

  /**
   * Set speaking rate (0.5-2)
   */
  setRate(rate: number): void {
    this.config.rate = Math.max(0.5, Math.min(2, rate));
    logger.log('WhisperMode', `Rate set to ${this.config.rate}`);
  }

  /**
   * Get current config
   */
  getConfig(): WhisperConfig {
    return { ...this.config };
  }

  /**
   * Stop current speech
   */
  stop(): void {
    window.speechSynthesis?.cancel();
    this.isSpeaking = false;
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.messageQueue = [];
  }
}

export const whisperMode = new WhisperModeService();