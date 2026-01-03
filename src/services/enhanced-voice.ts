import type { OpenAIVoice } from "@/types/models";

const OPENAI_API_BASE = "https://api.openai.com/v1";

export interface VoiceConfig {
  voice: OpenAIVoice;
  speed: number;
  model: "tts-1" | "tts-1-hd";
}

export interface AudioQueueItem {
  id: string;
  text: string;
  priority: "high" | "normal" | "low";
  onStart?: () => void;
  onEnd?: () => void;
}

class AudioQueueManager {
  private queue: AudioQueueItem[] = [];
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private apiKey: string = "";
  private voiceConfig: VoiceConfig = {
    voice: "nova",
    speed: 1.0,
    model: "tts-1",
  };

  setApiKey(key: string) {
    this.apiKey = key;
  }

  setVoiceConfig(config: Partial<VoiceConfig>) {
    this.voiceConfig = { ...this.voiceConfig, ...config };
  }

  async enqueue(item: AudioQueueItem) {
    // Insert based on priority
    if (item.priority === "high") {
      this.queue.unshift(item);
    } else {
      this.queue.push(item);
    }
    
    if (!this.isPlaying) {
      await this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const item = this.queue.shift()!;
    
    try {
      item.onStart?.();
      await this.speak(item.text);
      item.onEnd?.();
    } catch (error) {
      console.error("Audio playback error:", error);
    }

    await this.processQueue();
  }

  private async speak(text: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error("API key not set");
    }

    // Split long text into chunks for better streaming
    const chunks = this.splitTextIntoChunks(text, 500);
    
    for (const chunk of chunks) {
      const blob = await this.synthesize(chunk);
      await this.playBlob(blob);
    }
  }

  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) return [text];
    
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = "";
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  private async synthesize(text: string): Promise<Blob> {
    const response = await fetch(`${OPENAI_API_BASE}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.voiceConfig.model,
        input: text,
        voice: this.voiceConfig.voice,
        speed: this.voiceConfig.speed,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Speech synthesis failed: ${error}`);
    }

    return response.blob();
  }

  private playBlob(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      this.currentAudio = audio;
      audio.src = URL.createObjectURL(blob);
      
      audio.onended = () => {
        URL.revokeObjectURL(audio.src);
        this.currentAudio = null;
        resolve();
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audio.src);
        this.currentAudio = null;
        reject(new Error("Audio playback failed"));
      };
      
      audio.play().catch(reject);
    });
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.queue = [];
    this.isPlaying = false;
  }

  clear() {
    this.queue = [];
  }

  get isPaused(): boolean {
    return this.currentAudio?.paused ?? false;
  }

  pause() {
    this.currentAudio?.pause();
  }

  resume() {
    this.currentAudio?.play();
  }
}

export const audioQueue = new AudioQueueManager();

// Enhanced transcription with retry and better error handling
export async function transcribeWithRetry(
  audioBlob: Blob,
  apiKey: string,
  maxRetries: number = 2
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("language", "en");
      // Add prompt for better accuracy with common commands
      formData.append("prompt", "Echo, reminder, task, calendar, note, schedule, weather, search");

      const response = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Transcription failed: ${error}`);
      }

      const result = await response.json();
      return result.text.trim();
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error("Transcription failed after retries");
}

// Quick speak function for immediate feedback
export async function quickSpeak(
  text: string,
  apiKey: string,
  voice: OpenAIVoice = "nova"
): Promise<void> {
  audioQueue.setApiKey(apiKey);
  audioQueue.setVoiceConfig({ voice });
  
  await audioQueue.enqueue({
    id: crypto.randomUUID(),
    text,
    priority: "high",
  });
}

// Speak with callback support
export async function speakWithCallbacks(
  text: string,
  apiKey: string,
  voice: OpenAIVoice = "nova",
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  audioQueue.setApiKey(apiKey);
  audioQueue.setVoiceConfig({ voice });
  
  await audioQueue.enqueue({
    id: crypto.randomUUID(),
    text,
    priority: "normal",
    onStart,
    onEnd,
  });
}

// Stop all audio
export function stopSpeaking() {
  audioQueue.stop();
}

// Check if currently speaking
export function isSpeaking(): boolean {
  return !audioQueue.isPaused;
}