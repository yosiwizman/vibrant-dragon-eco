import { synthesizeSpeech } from '@/services/openai-voice';
import { offlineVoice, isOfflineVoiceSupported } from '@/services/offline-voice';
import { SpeechOptions } from './types';

export class VoicePlayer {
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeaking = false;
  private pendingOnEnd: (() => void) | null = null;

  async speak(
    text: string,
    apiKey: string | null,
    options: SpeechOptions = {}
  ): Promise<void> {
    if (!text || text.trim().length === 0) {
      console.warn('[VoicePlayer] Empty text provided');
      // Still call onEnd to continue conversation flow
      options.onEnd?.();
      return;
    }

    // Stop any current audio
    this.stop();

    // Store the onEnd callback for later use
    this.pendingOnEnd = options.onEnd || null;

    const isOnline = navigator.onLine;
    const hasApiKey = !!apiKey;
    const hasOfflineVoice = isOfflineVoiceSupported();

    // Use offline voice if offline or no API key
    if ((!isOnline || !hasApiKey) && hasOfflineVoice) {
      return this.speakOffline(text, options);
    }

    // Use OpenAI TTS
    if (!apiKey) {
      console.error('[VoicePlayer] No API key, calling onEnd');
      this.pendingOnEnd = null;
      options.onEnd?.();
      throw new Error('OpenAI API key not configured');
    }

    return this.speakOnline(text, apiKey, options);
  }

  private async speakOffline(text: string, options: SpeechOptions): Promise<void> {
    console.log('[VoicePlayer] Using offline TTS (Web Speech API)');
    
    this.isSpeaking = true;
    options.onStart?.();

    try {
      await offlineVoice.speak(text, {
        rate: options.rate || 1.0,
      });
      
      this.isSpeaking = false;
      console.log('[VoicePlayer] Offline speech ended, calling onEnd');
      this.pendingOnEnd = null;
      options.onEnd?.();
    } catch (error: any) {
      this.isSpeaking = false;
      console.error('[VoicePlayer] Offline speech error:', error);
      this.pendingOnEnd = null;
      options.onError?.(error);
      // Still call onEnd to continue conversation flow
      options.onEnd?.();
      throw error;
    }
  }

  private async speakOnline(
    text: string,
    apiKey: string,
    options: SpeechOptions
  ): Promise<void> {
    console.log('[VoicePlayer] Using OpenAI TTS');

    try {
      this.isSpeaking = true;
      options.onStart?.();

      const speechBlob = await synthesizeSpeech(
        text,
        apiKey,
        (options.voice as any) || 'nova'
      );

      if (speechBlob.size === 0) {
        throw new Error('Empty audio blob received');
      }

      console.log('[VoicePlayer] Speech blob received:', {
        size: speechBlob.size,
        type: speechBlob.type,
      });

      await this.playBlob(speechBlob, options);
    } catch (error: any) {
      console.error('[VoicePlayer] OpenAI TTS error:', error);
      this.isSpeaking = false;

      // Fallback to offline voice
      if (isOfflineVoiceSupported()) {
        console.log('[VoicePlayer] Falling back to Web Speech API');
        return this.speakOffline(text, options);
      }

      this.pendingOnEnd = null;
      options.onError?.(error);
      // Still call onEnd to continue conversation flow even on error
      options.onEnd?.();
      throw error;
    }
  }

  private async playBlob(blob: Blob, options: SpeechOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      this.currentAudio = audio;
      const audioUrl = URL.createObjectURL(blob);

      audio.src = audioUrl;
      audio.volume = 1.0;

      let resolved = false;

      const cleanup = () => {
        if (resolved) return;
        resolved = true;
        URL.revokeObjectURL(audioUrl);
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        this.isSpeaking = false;
      };

      audio.onended = () => {
        console.log('[VoicePlayer] Playback ended naturally');
        cleanup();
        this.pendingOnEnd = null;
        options.onEnd?.();
        resolve();
      };

      audio.onerror = (e) => {
        console.error('[VoicePlayer] Playback error:', e);
        cleanup();
        const error = new Error(`Audio playback failed: ${audio.error?.message || 'Unknown error'}`);
        this.pendingOnEnd = null;
        options.onError?.(error);
        // Still call onEnd to continue conversation flow
        options.onEnd?.();
        reject(error);
      };

      audio.oncanplay = () => {
        console.log('[VoicePlayer] Audio ready, starting playback');
        audio.play()
          .then(() => console.log('[VoicePlayer] Playback started successfully'))
          .catch((err) => {
            console.error('[VoicePlayer] Play failed:', err);
            cleanup();
            this.pendingOnEnd = null;
            options.onError?.(err);
            // Still call onEnd to continue conversation flow
            options.onEnd?.();
            reject(err);
          });
      };

      // Timeout fallback - if audio doesn't load in 10 seconds, fail gracefully
      setTimeout(() => {
        if (!resolved) {
          if (audio.readyState >= 2) {
            audio.play()
              .catch((err) => {
                cleanup();
                this.pendingOnEnd = null;
                options.onEnd?.();
                reject(err);
              });
          } else {
            console.warn('[VoicePlayer] Audio loading timeout, continuing conversation');
            cleanup();
            this.pendingOnEnd = null;
            options.onEnd?.();
            reject(new Error('Audio loading timeout'));
          }
        }
      }, 10000);
    });
  }

  stop(): void {
    console.log('[VoicePlayer] Stop called');
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      try {
        URL.revokeObjectURL(this.currentAudio.src);
      } catch (e) {
        // Ignore URL revoke errors
      }
      this.currentAudio = null;
    }
    this.isSpeaking = false;
    
    // If there was a pending onEnd callback, call it now
    if (this.pendingOnEnd) {
      console.log('[VoicePlayer] Calling pending onEnd after stop');
      const onEnd = this.pendingOnEnd;
      this.pendingOnEnd = null;
      onEnd();
    }
  }

  get speaking(): boolean {
    return this.isSpeaking;
  }
}

export const voicePlayer = new VoicePlayer();