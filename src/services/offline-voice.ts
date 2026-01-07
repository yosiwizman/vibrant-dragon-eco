"use client";

/**
 * Offline Voice Service
 * Uses Web Speech API for both speech-to-text and text-to-speech
 * Works completely offline with zero downloads
 */

interface OfflineVoiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

class OfflineVoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
  }

  /**
   * Initialize Web Speech API for speech recognition
   */
  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  /**
   * Initialize Web Speech API for speech synthesis
   */
  private initializeSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  /**
   * Check if offline voice is supported
   */
  isSupported(): boolean {
    return !!(this.recognition && this.synthesis);
  }

  /**
   * Start listening (offline speech-to-text)
   */
  async startListening(config?: OfflineVoiceConfig): Promise<string> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    if (this.isListening) {
      throw new Error('Already listening');
    }

    return new Promise((resolve, reject) => {
      if (config?.language) {
        this.recognition.lang = config.language;
      }
      if (config?.continuous !== undefined) {
        this.recognition.continuous = config.continuous;
      }
      if (config?.interimResults !== undefined) {
        this.recognition.interimResults = config.interimResults;
      }

      this.recognition.onstart = () => {
        this.isListening = true;
        console.log('[Offline Voice] Started listening');
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        console.log('[Offline Voice] Transcript:', transcript, 'Confidence:', confidence);
        resolve(transcript);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        console.error('[Offline Voice] Recognition error:', event.error);
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        this.isListening = false;
        console.log('[Offline Voice] Stopped listening');
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        reject(error);
      }
    });
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Speak text (offline text-to-speech)
   */
  async speak(text: string, options?: {
    voice?: SpeechSynthesisVoice;
    rate?: number;
    pitch?: number;
    volume?: number;
  }): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    // Cancel any ongoing speech
    this.stopSpeaking();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Configure voice
      if (options?.voice) {
        utterance.voice = options.voice;
      } else {
        // Use default or first available voice
        const voices = this.synthesis!.getVoices();
        if (voices.length > 0) {
          // Prefer English voices
          const englishVoice = voices.find(v => v.lang.startsWith('en'));
          utterance.voice = englishVoice || voices[0];
        }
      }

      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = options?.volume || 1.0;

      utterance.onend = () => {
        this.currentUtterance = null;
        console.log('[Offline Voice] Finished speaking');
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        console.error('[Offline Voice] Speech error:', event);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synthesis!.speak(utterance);
      console.log('[Offline Voice] Started speaking');
    });
  }

  /**
   * Stop speaking
   */
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  /**
   * Get English voices only
   */
  getEnglishVoices(): SpeechSynthesisVoice[] {
    return this.getVoices().filter(v => v.lang.startsWith('en'));
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.synthesis?.speaking || false;
  }
}

// Singleton instance
export const offlineVoice = new OfflineVoiceService();

// Helper function to check support
export function isOfflineVoiceSupported(): boolean {
  return offlineVoice.isSupported();
}

// React hook for offline voice
export function useOfflineVoice() {
  const [isListening, setIsListening] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const startListening = async (config?: OfflineVoiceConfig) => {
    setIsListening(true);
    try {
      const transcript = await offlineVoice.startListening(config);
      setIsListening(false);
      return transcript;
    } catch (error) {
      setIsListening(false);
      throw error;
    }
  };

  const speak = async (text: string, options?: any) => {
    setIsSpeaking(true);
    try {
      await offlineVoice.speak(text, options);
      setIsSpeaking(false);
    } catch (error) {
      setIsSpeaking(false);
      throw error;
    }
  };

  const stopListening = () => {
    offlineVoice.stopListening();
    setIsListening(false);
  };

  const stopSpeaking = () => {
    offlineVoice.stopSpeaking();
    setIsSpeaking(false);
  };

  return {
    isListening,
    isSpeaking,
    startListening,
    speak,
    stopListening,
    stopSpeaking,
    getVoices: () => offlineVoice.getVoices(),
  };
}

// Add React import
import React from 'react';