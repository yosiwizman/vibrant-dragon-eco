import { synthesizeSpeech } from '@/services/openai-voice';
import { offlineVoice, isOfflineVoiceSupported } from '@/services/offline-voice';
import { SpeechOptions } from './types';

export class VoicePlayer {
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeaking = false;

  async speak(
    text: string,
    apiKey: string | null,
    options: SpeechOptions = {}
  ): Promise<void> {
    if (!text || text.trim().length === 0) {
      console.warn('[VoicePlayer] Empty text provided');
      return;
    }

    // Stop any current audio
    this.stop();

    const isOnline = navigator.onLine;
    const hasApiKey = !!apiKey;
    const hasOfflineVoice = isOfflineVoiceSupported();

    // Use offline voice if offline or no API key
    if ((!isOnline || !hasApiKey) && hasOfflineVoice) {
      return this.speakOffline(text, options);
    }

    // Use OpenAI TTS
    if (!apiKey) {
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
      options.onEnd?.();
    } catch (error: any) {
      this.isSpeaking = false;
      options.onError?.(error);
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

      options.onError?.(error);
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
        console.log('[VoicePlayer] Playback ended');
        cleanup();
        options.onEnd?.();
        resolve();
      };

      audio.onerror = (e) => {
        console.error('[VoicePlayer] Playback error:', e);
        cleanup();
        const error = new Error(`Audio playback failed: ${audio.error?.message || 'Unknown error'}`);
        options.onError?.(error);
        reject(error);
      };

      audio.oncanplay = () => {
        console.log('[VoicePlayer] Starting playback');
        audio.play()
          .then(() => console.log('[VoicePlayer] Playback started'))
          .catch((err) => {
            cleanup();
            options.onError?.(err);
            reject(err);
          });
      };

      // Timeout fallback
      setTimeout(() => {
        if (!resolved && audio.readyState >= 2) {
          audio.play()
            .catch((err) => {
              cleanup();
              reject(err);
            });
        } else if (!resolved) {
          cleanup();
          reject(new Error('Audio loading timeout'));
        }
      }, 5000);
    });
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      URL.revokeObjectURL(this.currentAudio.src);
      this.currentAudio = null;
    }
    this.isSpeaking = false;
  }

  get speaking(): boolean {
    return this.isSpeaking;
  }
}

export const voicePlayer = new VoicePlayer();