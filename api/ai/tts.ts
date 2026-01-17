import {
  clampNumber,
  getBearerToken,
  getOpenAIEnv,
  readJson,
  sendJson,
  sendText,
  truncateString,
  verifySupabaseJwt,
} from '../../src/server/ai-proxy';

export const config = {
  runtime: 'nodejs',
};

const ALLOWED_MODELS = new Set(['tts-1', 'tts-1-hd']);
const ALLOWED_VOICES = new Set(['alloy', 'ash', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer']);

const MAX_BODY_BYTES = 64 * 1024; // 64KB
const MAX_INPUT_CHARS = 4096;

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
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

  const inputRaw = payload?.input ?? payload?.text;
  const input = truncateString(inputRaw, MAX_INPUT_CHARS).trim();
  if (!input) {
    return sendJson(res, 400, { error: 'input/text is required' });
  }

  const model = typeof payload?.model === 'string' && ALLOWED_MODELS.has(payload.model)
    ? payload.model
    : 'tts-1';

  const voice = typeof payload?.voice === 'string' && ALLOWED_VOICES.has(payload.voice)
    ? payload.voice
    : 'nova';

  const speed = clampNumber(payload?.speed, 0.5, 2.0, 1.0);

  console.log('[api/ai/tts] request', {
    userId: user.id,
    model,
    voice,
    inputChars: input.length,
  });

  const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input,
      voice,
      response_format: 'mp3',
      speed,
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return sendJson(res, upstream.status, {
      error: 'OpenAI request failed',
      status: upstream.status,
      message: truncateString(text, 500),
    });
  }

  const arrayBuffer = await upstream.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Length', String(buf.length));
  res.end(buf);
}
