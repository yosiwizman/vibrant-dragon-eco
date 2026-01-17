import { supabase } from '@/integrations/supabase/client';

export type DemoModeStatus = {
  configured: boolean;
  openaiConfigured: boolean;
  supabaseConfigured: boolean;
  missing: string[];
};

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

export async function getDemoModeStatus(): Promise<DemoModeStatus> {
  const res = await fetch('/api/ai/status', { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Status check failed: HTTP ${res.status}`);
  }
  return res.json();
}

export async function proxyChat(params: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  max_tokens?: number;
  temperature?: number;
}): Promise<{ content: string; model?: string; usage?: any }> {
  const token = await getAccessToken();

  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as any)?.message || (data as any)?.error || `HTTP ${res.status}`;
    throw new Error(`AI proxy error: ${message}`);
  }

  return data as any;
}

export async function proxyTTS(params: {
  input: string;
  voice?: string;
  model?: string;
  speed?: number;
}): Promise<Blob> {
  const token = await getAccessToken();

  const res = await fetch('/api/ai/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = (data as any)?.message || (data as any)?.error || `HTTP ${res.status}`;
    throw new Error(`TTS proxy error: ${message}`);
  }

  return res.blob();
}

export async function proxySTT(params: {
  file: Blob;
  filename?: string;
  model?: string;
}): Promise<{ text: string }> {
  const token = await getAccessToken();

  const formData = new FormData();
  formData.append('file', params.file, params.filename || 'audio.webm');
  formData.append('model', params.model || 'whisper-1');

  const res = await fetch('/api/ai/stt', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as any)?.message || (data as any)?.error || `HTTP ${res.status}`;
    throw new Error(`STT proxy error: ${message}`);
  }

  return data as any;
}
