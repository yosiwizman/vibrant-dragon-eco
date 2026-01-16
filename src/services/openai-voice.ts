import type { OpenAIVoice } from "../types/models";

const OPENAI_API_BASE = "https://api.openai.com/v1";

export interface TranscriptionResult {
  text: string;
}

export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string
): Promise<TranscriptionResult> {
  console.log('[Whisper] Original blob type:', audioBlob.type);
  console.log('[Whisper] Original blob size:', audioBlob.size);
  
  // OpenAI Whisper accepts these formats directly without conversion
  // Let's send the original WebM/Opus which is actually supported
  let filename = "audio.webm";
  const mimeType = audioBlob.type.toLowerCase();
  
  // Map MIME types to filenames that OpenAI accepts
  if (mimeType.includes('webm')) {
    filename = "audio.webm";
  } else if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
    filename = "audio.mp4";
  } else if (mimeType.includes('mpeg') || mimeType.includes('mp3') || mimeType.includes('mpga')) {
    filename = "audio.mp3";
  } else if (mimeType.includes('ogg') || mimeType.includes('oga')) {
    filename = "audio.ogg";
  } else if (mimeType.includes('wav')) {
    filename = "audio.wav";
  } else if (mimeType.includes('flac')) {
    filename = "audio.flac";
  } else {
    // Default to webm if unknown
    console.warn('[Whisper] Unknown MIME type, defaulting to webm:', mimeType);
    filename = "audio.webm";
  }
  
  console.log('[Whisper] Using filename:', filename);
  console.log('[Whisper] Sending blob size:', audioBlob.size);
  
  // Validate blob size
  if (audioBlob.size === 0) {
    throw new Error('Audio recording is empty. Please try speaking again.');
  }
  
  if (audioBlob.size < 1000) {
    console.warn('[Whisper] Audio blob is very small, might be too short');
  }
  
  const formData = new FormData();
  formData.append("file", audioBlob, filename);
  formData.append("model", "whisper-1");
  
  // Don't force language - let Whisper auto-detect for better accuracy
  // formData.append("language", "en");

  const response = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Whisper] Transcription failed:', errorText);
    
    let errorMessage = 'Transcription failed';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorText;
    } catch {
      errorMessage = errorText;
    }
    
    throw new Error(errorMessage);
  }

  const result = await response.json();
  const transcribedText = result.text || '';
  console.log('[Whisper] Transcription result:', transcribedText || '(empty)');
  
  // Don't throw an error for empty results - let the caller handle it
  // This allows the system to continue listening instead of stopping
  if (!transcribedText || transcribedText.trim().length === 0) {
    console.log('[Whisper] No speech detected in audio - this may be due to:');
    console.log('[Whisper] - Microphone not picking up voice clearly');
    console.log('[Whisper] - Background noise being filtered out');
    console.log('[Whisper] - Speaking too quietly or too far from microphone');
  }
  
  return { text: transcribedText };
}

// Valid OpenAI TTS voices as of the API
const VALID_OPENAI_VOICES = ["alloy", "ash", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"];

export async function synthesizeSpeech(
  text: string,
  apiKey: string,
  voice: OpenAIVoice = "nova"
): Promise<Blob> {
  // Validate voice - fall back to nova if invalid
  const validatedVoice = VALID_OPENAI_VOICES.includes(voice) ? voice : "nova";
  
  if (voice !== validatedVoice) {
    console.warn(`[OpenAI TTS] Invalid voice "${voice}" - falling back to "${validatedVoice}"`);
  }
  
  console.log(`[OpenAI TTS] Synthesizing speech with voice: ${validatedVoice}`);
  console.log(`[OpenAI TTS] Text length: ${text.length} characters`);
  
  // Truncate very long text to avoid API issues
  const maxLength = 4096;
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  
  const response = await fetch(`${OPENAI_API_BASE}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1", // Use standard model for faster response
      input: truncatedText,
      voice: validatedVoice,
      response_format: "mp3",
      speed: 1.0,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[OpenAI TTS] Synthesis failed:`, error);
    throw new Error(`Speech synthesis failed: ${error}`);
  }

  // Get the raw array buffer first
  const arrayBuffer = await response.arrayBuffer();
  console.log(`[OpenAI TTS] Received ${arrayBuffer.byteLength} bytes`);
  
  // Create blob with explicit MP3 MIME type
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  console.log(`[OpenAI TTS] Created blob with type: ${blob.type}, size: ${blob.size} bytes`);
  
  if (blob.size === 0) {
    throw new Error('Empty audio response from TTS API');
  }
  
  return blob;
}

export async function chatWithOpenAI(
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<string> {
  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chat failed: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

export function createAudioContext(): AudioContext {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

export async function playAudioBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`[Audio Player] Playing audio blob of size: ${blob.size} bytes`);
    
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    audio.src = url;
    
    audio.onloadedmetadata = () => {
      console.log(`[Audio Player] Audio loaded, duration: ${audio.duration}s`);
    };
    
    audio.onended = () => {
      console.log(`[Audio Player] Playback completed`);
      URL.revokeObjectURL(url);
      resolve();
    };
    
    audio.onerror = (e) => {
      console.error(`[Audio Player] Playback error:`, e);
      URL.revokeObjectURL(url);
      reject(new Error("Audio playback failed"));
    };
    
    audio.play()
      .then(() => console.log(`[Audio Player] Playback started`))
      .catch((e) => {
        console.error(`[Audio Player] Play failed:`, e);
        URL.revokeObjectURL(url);
        reject(e);
      });
  });
}