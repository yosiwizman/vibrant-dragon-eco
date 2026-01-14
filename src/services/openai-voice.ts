import type { OpenAIVoice } from "../types/models";

const OPENAI_API_BASE = "https://api.openai.com/v1";

export interface TranscriptionResult {
  text: string;
}

export async function convertToWav(audioBlob: Blob): Promise<Blob> {
  console.log('[Whisper] Converting audio to WAV format');
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Create WAV file
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numberOfChannels * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  
  // Write WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);
  
  // Write audio data
  const offset = 44;
  const channelData = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channelData.push(audioBuffer.getChannelData(i));
  }
  
  let index = 0;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      view.setInt16(offset + index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      index += 2;
    }
  }
  
  await audioContext.close();
  
  const wavBlob = new Blob([buffer], { type: 'audio/wav' });
  console.log('[Whisper] Converted to WAV, size:', wavBlob.size);
  
  return wavBlob;
}

export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string
): Promise<TranscriptionResult> {
  console.log('[Whisper] Original blob type:', audioBlob.type);
  console.log('[Whisper] Original blob size:', audioBlob.size);
  
  // Convert to WAV format for maximum compatibility with OpenAI Whisper
  let processedBlob = audioBlob;
  let filename = "audio.wav";
  
  try {
    // Always convert to WAV for OpenAI Whisper
    processedBlob = await convertToWav(audioBlob);
  } catch (conversionError) {
    console.warn('[Whisper] WAV conversion failed, trying original format:', conversionError);
    
    // Fallback: use original blob with appropriate filename
    const mimeType = audioBlob.type;
    if (mimeType.includes('mp4')) {
      filename = "audio.mp4";
    } else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
      filename = "audio.mp3";
    } else if (mimeType.includes('ogg')) {
      filename = "audio.ogg";
    } else if (mimeType.includes('webm')) {
      filename = "audio.webm";
    }
  }
  
  console.log('[Whisper] Using filename:', filename);
  console.log('[Whisper] Final blob size:', processedBlob.size);
  
  const formData = new FormData();
  formData.append("file", processedBlob, filename);
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