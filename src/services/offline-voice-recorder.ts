"use client";

/**
 * Offline Voice Recorder
 * Uses Web Speech API for live speech-to-text (no audio blob needed)
 * Works completely offline
 */

interface RecordingResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

class OfflineVoiceRecorder {
  private recognition: any = null;
  private isRecording = false;
  private onTranscriptCallback: ((result: RecordingResult) => void) | null = null;
  private onEndCallback: ((finalTranscript: string) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private finalTranscript = '';
  private interimTranscript = '';

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('[Offline Voice Recorder] Web Speech API not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      console.log('[Offline Voice Recorder] Started');
      this.isRecording = true;
      this.finalTranscript = '';
      this.interimTranscript = '';
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          final += transcript + ' ';
          this.finalTranscript += transcript + ' ';
        } else {
          interim += transcript;
        }

        // Call transcript callback
        if (this.onTranscriptCallback) {
          this.onTranscriptCallback({
            transcript: event.results[i].isFinal ? final : interim,
            confidence,
            isFinal: event.results[i].isFinal,
          });
        }
      }

      this.interimTranscript = interim;
    };

    this.recognition.onerror = (event: any) => {
      console.error('[Offline Voice Recorder] Error:', event.error);
      this.isRecording = false;
      
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error(event.error));
      }
    };

    this.recognition.onend = () => {
      console.log('[Offline Voice Recorder] Ended');
      this.isRecording = false;
      
      if (this.onEndCallback) {
        this.onEndCallback(this.finalTranscript.trim());
      }
    };
  }

  /**
   * Check if supported
   */
  isSupported(): boolean {
    return !!this.recognition;
  }

  /**
   * Start recording
   */
  start(callbacks?: {
    onTranscript?: (result: RecordingResult) => void;
    onEnd?: (finalTranscript: string) => void;
    onError?: (error: Error) => void;
  }) {
    if (!this.recognition) {
      throw new Error('Web Speech API not supported');
    }

    if (this.isRecording) {
      console.warn('[Offline Voice Recorder] Already recording');
      return;
    }

    this.onTranscriptCallback = callbacks?.onTranscript || null;
    this.onEndCallback = callbacks?.onEnd || null;
    this.onErrorCallback = callbacks?.onError || null;

    this.recognition.start();
  }

  /**
   * Stop recording
   */
  stop() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
  }

  /**
   * Get current status
   */
  getStatus(): {
    isRecording: boolean;
    finalTranscript: string;
    interimTranscript: string;
  } {
    return {
      isRecording: this.isRecording,
      finalTranscript: this.finalTranscript,
      interimTranscript: this.interimTranscript,
    };
  }

  /**
   * Set language
   */
  setLanguage(lang: string) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }
}

// Singleton instance
export const offlineVoiceRecorder = new OfflineVoiceRecorder();

// Check if supported
export function isOfflineVoiceRecorderSupported(): boolean {
  return offlineVoiceRecorder.isSupported();
}