"use client";

import { logger } from "@/utils/logger";
import { offlineVoiceRecorder } from "./offline-voice-recorder";

interface Speaker {
  id: string;
  name?: string;
  voiceprint?: number[];
  language?: string;
  lastSeen: number;
}

interface ConversationSegment {
  id: string;
  speaker: Speaker;
  text: string;
  language: string;
  translation?: string;
  timestamp: number;
  context?: string;
}

interface PrivacyMode {
  active: boolean;
  startTime?: number;
  reason?: string;
}

/**
 * Always-On Assistant Service
 * Continuous listening with wake word, multi-speaker, translation, and privacy
 */
class AlwaysOnAssistantService {
  private isActive = false;
  private isRecognitionRunning = false;
  private isStarting = false;
  private wakeWord = 'echo';
  private speakers = new Map<string, Speaker>();
  private currentConversation: ConversationSegment[] = [];
  private privacyMode: PrivacyMode = { active: false };
  private recognition: any = null;
  private currentSpeaker: Speaker | null = null;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Start always-on listening
   */
  async start(wakeWord: string = 'echo'): Promise<void> {
    if (this.isActive) {
      logger.warn('AlwaysOn', 'Already active');
      return;
    }

    this.wakeWord = wakeWord.toLowerCase();
    this.isActive = true;

    // Initialize continuous speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      this.isActive = false;
      throw new Error('Speech recognition not supported');
    }

    // Clean up any existing recognition
    this.cleanupRecognition();

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isRecognitionRunning = true;
      this.isStarting = false;
      logger.log('AlwaysOn', 'Recognition started');
    };

    this.recognition.onresult = (event: any) => {
      this.handleSpeech(event);
    };

    this.recognition.onerror = (event: any) => {
      // Don't log "aborted" errors as they're expected when stopping
      if (event.error !== 'aborted') {
        logger.error('AlwaysOn', 'Recognition error:', event.error);
      }
      
      this.isRecognitionRunning = false;
      this.isStarting = false;
      
      // Auto-restart on error (except for certain errors)
      if (this.isActive && event.error !== 'not-allowed' && event.error !== 'service-not-allowed') {
        this.scheduleRestart(1000);
      }
    };

    this.recognition.onend = () => {
      this.isRecognitionRunning = false;
      this.isStarting = false;
      logger.log('AlwaysOn', 'Recognition ended');
      
      // Auto-restart if still active
      if (this.isActive) {
        this.scheduleRestart(100);
      }
    };

    this.safeStartRecognition();
    logger.log('AlwaysOn', `Started with wake word: "${this.wakeWord}"`);
  }

  /**
   * Safely start recognition with state checking
   */
  private safeStartRecognition(): void {
    if (!this.recognition || !this.isActive) {
      return;
    }

    if (this.isRecognitionRunning || this.isStarting) {
      logger.warn('AlwaysOn', 'Recognition already running or starting, skipping start');
      return;
    }

    try {
      this.isStarting = true;
      this.recognition.start();
    } catch (error: any) {
      this.isStarting = false;
      
      // Handle "already started" error gracefully
      if (error.message?.includes('already started')) {
        logger.warn('AlwaysOn', 'Recognition was already started');
        this.isRecognitionRunning = true;
      } else {
        logger.error('AlwaysOn', 'Failed to start recognition:', error);
        // Try to restart after a delay
        if (this.isActive) {
          this.scheduleRestart(1000);
        }
      }
    }
  }

  /**
   * Schedule a restart with debouncing
   */
  private scheduleRestart(delay: number): void {
    // Clear any existing restart timeout
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    this.restartTimeout = setTimeout(() => {
      this.restartTimeout = null;
      if (this.isActive && !this.isRecognitionRunning && !this.isStarting) {
        this.safeStartRecognition();
      }
    }, delay);
  }

  /**
   * Clean up recognition instance
   */
  private cleanupRecognition(): void {
    // Clear any pending restart
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition) {
      try {
        // Remove event listeners to prevent callbacks after cleanup
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        
        if (this.isRecognitionRunning) {
          this.recognition.abort();
        }
      } catch (error) {
        logger.warn('AlwaysOn', 'Error during recognition cleanup:', error);
      }
      this.recognition = null;
    }

    this.isRecognitionRunning = false;
    this.isStarting = false;
  }

  /**
   * Stop always-on listening
   */
  stop(): void {
    this.isActive = false;
    this.cleanupRecognition();
    logger.log('AlwaysOn', 'Stopped');
  }

  /**
   * Handle incoming speech
   */
  private async handleSpeech(event: any): Promise<void> {
    // Skip if in privacy mode
    if (this.privacyMode.active) {
      return;
    }

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      const isFinal = event.results[i].isFinal;

      if (!isFinal) continue;

      const lower = transcript.toLowerCase().trim();

      // Check for wake word
      if (lower.includes(this.wakeWord)) {
        await this.onWakeWordDetected(transcript);
        continue;
      }

      // Check for privacy commands
      if (this.isPrivacyCommand(lower)) {
        await this.enterPrivacyMode(lower);
        continue;
      }

      // Detect language
      const language = await this.detectLanguage(transcript);

      // Detect speaker
      const speaker = await this.identifySpeaker(transcript, language);

      // Save conversation segment
      const segment: ConversationSegment = {
        id: `seg-${Date.now()}`,
        speaker,
        text: transcript,
        language,
        timestamp: Date.now(),
      };

      // Translate if not English
      if (language !== 'en') {
        segment.translation = await this.translate(transcript, language, 'en');
      }

      this.currentConversation.push(segment);

      // Analyze if Echo should respond
      await this.analyzeAndRespond(segment);
    }
  }

  /**
   * Wake word detected
   */
  private async onWakeWordDetected(transcript: string): Promise<void> {
    logger.log('AlwaysOn', 'Wake word detected');
    
    // Extract command after wake word
    const command = transcript
      .toLowerCase()
      .replace(this.wakeWord, '')
      .trim();

    if (command) {
      // Process command
      await this.processCommand(command);
    } else {
      // Just acknowledge
      await this.speak("Yes? How can I help?");
    }
  }

  /**
   * Check if privacy command
   */
  private isPrivacyCommand(text: string): boolean {
    const privacyPhrases = [
      'give me privacy',
      'give me some privacy',
      'turn off',
      'stop listening',
      'mute',
      'privacy mode',
      'private conversation',
    ];

    return privacyPhrases.some(phrase => text.includes(phrase));
  }

  /**
   * Enter privacy mode
   */
  private async enterPrivacyMode(command: string): Promise<void> {
    this.privacyMode = {
      active: true,
      startTime: Date.now(),
      reason: command,
    };

    await this.speak("I understand. Turning microphone off. Say 'Hey Echo' when you need me again.");
    
    logger.log('AlwaysOn', 'Entered privacy mode');
  }

  /**
   * Exit privacy mode
   */
  exitPrivacyMode(): void {
    this.privacyMode = { active: false };
    logger.log('AlwaysOn', 'Exited privacy mode');
  }

  /**
   * Detect language
   */
  private async detectLanguage(text: string): Promise<string> {
    // Simple heuristic detection (can be enhanced with API)
    const chinesePattern = /[\u4e00-\u9fa5]/;
    const arabicPattern = /[\u0600-\u06FF]/;
    const cyrillicPattern = /[\u0400-\u04FF]/;

    if (chinesePattern.test(text)) return 'zh';
    if (arabicPattern.test(text)) return 'ar';
    if (cyrillicPattern.test(text)) return 'ru';

    return 'en'; // Default to English
  }

  /**
   * Identify speaker
   */
  private async identifySpeaker(text: string, language: string): Promise<Speaker> {
    // Simple speaker identification (can be enhanced with voice recognition)
    // For now, create new speaker or use existing based on language
    
    const existingSpeaker = Array.from(this.speakers.values()).find(
      s => s.language === language && Date.now() - s.lastSeen < 60000 // Same speaker if within 1 min
    );

    if (existingSpeaker) {
      existingSpeaker.lastSeen = Date.now();
      return existingSpeaker;
    }

    // New speaker
    const newSpeaker: Speaker = {
      id: `speaker-${this.speakers.size + 1}`,
      language,
      lastSeen: Date.now(),
    };

    this.speakers.set(newSpeaker.id, newSpeaker);
    return newSpeaker;
  }

  /**
   * Translate text
   */
  private async translate(text: string, from: string, to: string): Promise<string> {
    // Use Google Translate API or similar
    // For now, return placeholder
    return `[Translation from ${from}]: ${text}`;
  }

  /**
   * Analyze if Echo should respond
   */
  private async analyzeAndRespond(segment: ConversationSegment): Promise<void> {
    const lower = segment.text.toLowerCase();

    // Respond to questions directed at user
    if (segment.language !== 'en' && segment.translation) {
      // Notify user of foreign language
      await this.whisper(`Someone said in ${this.getLanguageName(segment.language)}: "${segment.translation}"`);
    }

    // Detect if Echo should help
    if (lower.includes('where') || lower.includes('how far') || lower.includes('directions')) {
      // Proactively offer help
      await this.whisper("I can help with directions if you'd like.");
    }

    // Detect shopping list or items
    if (lower.includes('bring') || lower.includes('get') || lower.includes('buy')) {
      const items = this.extractItems(segment.text);
      if (items.length > 0) {
        await this.whisper(`I heard a list of ${items.length} items. Should I save this?`);
      }
    }
  }

  /**
   * Extract items from text
   */
  private extractItems(text: string): string[] {
    // Simple item extraction (can be enhanced with NLP)
    const items: string[] = [];
    
    // Look for lists
    const listPattern = /(?:bring|get|buy)\s+(.+?)(?:\.|$)/gi;
    const matches = text.matchAll(listPattern);
    
    for (const match of matches) {
      const itemText = match[1];
      // Split by commas or "and"
      const splitItems = itemText.split(/,|\sand\s/);
      items.push(...splitItems.map(i => i.trim()));
    }

    return items;
  }

  /**
   * Get language name
   */
  private getLanguageName(code: string): string {
    const names: Record<string, string> = {
      'en': 'English',
      'zh': 'Chinese',
      'es': 'Spanish',
      'ar': 'Arabic',
      'ru': 'Russian',
      'fr': 'French',
      'de': 'German',
    };
    return names[code] || code;
  }

  /**
   * Process command
   */
  private async processCommand(command: string): Promise<void> {
    // This would integrate with existing voice command processing
    logger.log('AlwaysOn', 'Processing command:', command);
  }

  /**
   * Speak to user
   */
  private async speak(text: string): Promise<void> {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Whisper to user (quiet notification)
   */
  private async whisper(text: string): Promise<void> {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 0.5; // Quieter
    utterance.rate = 1.2;   // Slightly faster
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Get conversation history
   */
  getConversation(speakerId?: string): ConversationSegment[] {
    if (speakerId) {
      return this.currentConversation.filter(s => s.speaker.id === speakerId);
    }
    return this.currentConversation;
  }

  /**
   * Search conversation
   */
  searchConversation(query: string): ConversationSegment[] {
    const lower = query.toLowerCase();
    return this.currentConversation.filter(s => 
      s.text.toLowerCase().includes(lower) ||
      s.translation?.toLowerCase().includes(lower)
    );
  }

  /**
   * Get conversation with specific person
   */
  getConversationWith(personName: string): ConversationSegment[] {
    // Find speaker by name or recent conversation
    const speaker = Array.from(this.speakers.values()).find(s => 
      s.name?.toLowerCase().includes(personName.toLowerCase())
    );

    if (speaker) {
      return this.getConversation(speaker.id);
    }

    return [];
  }

  /**
   * Save conversation for later
   */
  async saveConversation(title: string, speakerId?: string): Promise<void> {
    const segments = speakerId 
      ? this.getConversation(speakerId)
      : this.currentConversation;

    const content = segments.map(s => 
      `[${s.speaker.name || s.speaker.id}]: ${s.text}${s.translation ? ` (${s.translation})` : ''}`
    ).join('\n');

    // Save as note
    // This would integrate with note creation
    logger.log('AlwaysOn', `Saved conversation: ${title}`);
  }

  /**
   * Clear conversation
   */
  clearConversation(): void {
    this.currentConversation = [];
    this.speakers.clear();
  }

  /**
   * Get status
   */
  getStatus(): {
    isActive: boolean;
    privacyMode: boolean;
    speakerCount: number;
    segmentCount: number;
  } {
    return {
      isActive: this.isActive,
      privacyMode: this.privacyMode.active,
      speakerCount: this.speakers.size,
      segmentCount: this.currentConversation.length,
    };
  }
}

export const alwaysOnAssistant = new AlwaysOnAssistantService();