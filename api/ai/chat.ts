import {
  clampNumber,
  getBearerToken,
  getOpenAIEnv,
  sendJson,
  sendText,
  truncateString,
  readJson,
  verifySupabaseJwt,
} from '../../src/server/ai-proxy';

export const config = {
  runtime: 'nodejs',
};

const ALLOWED_MODELS = new Set(['gpt-4o-mini', 'gpt-4o']);
const MAX_BODY_BYTES = 256 * 1024; // 256KB
const MAX_MESSAGES = 32;
const MAX_CONTENT_CHARS = 8000;
const MAX_TOTAL_CHARS = 24000;

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    // Same-origin requests shouldn't preflight, but handle just in case.
    res.statusCode = 204;
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return sendText(res, 405, 'Method Not Allowed');
  }

  const { apiKey } = getOpenAIEnv();
  if (!apiKey) {
    return sendJson(res, 503, { error: 'OPENAI_API_KEY not configured' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { error: 'Missing Authorization bearer token' });
  }

  const user = await verifySupabaseJwt(token);
  if (!user) {
    return sendJson(res, 401, { error: 'Invalid Supabase session' });
  }

  let payload: any;
  try {
    payload = await readJson(req, MAX_BODY_BYTES);
  } catch (e: any) {
    return sendJson(res, 400, { error: e?.message || 'Invalid request body' });
  }

  const rawMessages = Array.isArray(payload?.messages) ? payload.messages : [];
  const messages = rawMessages
    .slice(0, MAX_MESSAGES)
    .map((m: any) => ({
      role: m?.role === 'system' || m?.role === 'assistant' || m?.role === 'user' ? m.role : 'user',
      content: truncateString(m?.content, MAX_CONTENT_CHARS),
    }))
    .filter((m: any) => typeof m.content === 'string' && m.content.trim().length > 0);

  const totalChars = messages.reduce((sum: number, m: any) => sum + (m.content?.length || 0), 0);
  if (messages.length === 0) {
    return sendJson(res, 400, { error: 'messages[] is required' });
  }
  if (totalChars > MAX_TOTAL_CHARS) {
    return sendJson(res, 400, { error: `messages too large (>${MAX_TOTAL_CHARS} chars)` });
  }

  const model = typeof payload?.model === 'string' && ALLOWED_MODELS.has(payload.model)
    ? payload.model
    : 'gpt-4o-mini';

  const max_tokens = clampNumber(payload?.max_tokens ?? payload?.maxTokens, 1, 1024, 512);
  const temperature = clampNumber(payload?.temperature, 0, 1, 0.7);

  // Minimal logging (no prompts)
  console.log('[api/ai/chat] request', {
    userId: user.id,
    model,
    messageCount: messages.length,
    totalChars,
    max_tokens,
  });

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens,
      temperature,
      // OpenAI supports an optional "user" field for abuse monitoring.
      user: user.id,
    }),
  });

  const text = await upstream.text();

  if (!upstream.ok) {
    // Avoid leaking full payloads. Return a truncated upstream error message.
    return sendJson(res, upstream.status, {
      error: 'OpenAI request failed',
      status: upstream.status,
      message: truncateString(text, 500),
    });
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return sendJson(res, 502, { error: 'Invalid OpenAI response' });
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    return sendJson(res, 502, { error: 'OpenAI response missing content' });
  }

  return sendJson(res, 200, {
    content,
    model: data?.model || model,
    usage: data?.usage,
  });
}
