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
  
  // Determine the correct file extension based on blob type
  let filename = "audio.webm";
  let mimeType = audioBlob.type;
  
  // Map blob types to proper extensions
  if (mimeType.includes('webm')) {
    filename = "audio.webm";
  } else if (mimeType.includes('mp4')) {
    filename = "audio.mp4";
  } else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
    filename = "audio.mp3";
  } else if (mimeType.includes('wav')) {
    filename = "audio.wav";
  } else if (mimeType.includes('ogg')) {
    filename = "audio.ogg";
  } else {
    // Default to webm if unknown
    console.warn('[Whisper] Unknown mime type, defaulting to webm');
    filename = "audio.webm";
  }
  
  console.log('[Whisper] Using filename:', filename);
  
  const formData = new FormData();
  formData.append("file", audioBlob, filename);
  formData.append("model", "whisper-1");
  formData.append("language", "en");

  const response = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Whisper] Transcription failed:', error);
    throw new Error(`Transcription failed: ${error}`);
  }

  const result = await response.json();
  console.log('[Whisper] Transcription successful:', result.text);
  
  return result;
}

export async function synthesizeSpeech(
  text: string,
  apiKey: string,
  voice: OpenAIVoice = "nova"
): Promise<Blob> {
  console.log(`[OpenAI TTS] Synthesizing speech with voice: ${voice}`);
  
  const response = await fetch(`${OPENAI_API_BASE}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1-hd", // Use HD model for better quality
      input: text,
      voice: voice,
      response_format: "mp3",
      speed: 1.0,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[OpenAI TTS] Synthesis failed:`, error);
    throw new Error(`Speech synthesis failed: ${error}`);
  }

  const blob = await response.blob();
  console.log(`[OpenAI TTS] Successfully synthesized ${blob.size} bytes with ${voice} voice`);
  
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