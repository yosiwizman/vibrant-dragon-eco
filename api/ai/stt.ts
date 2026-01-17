import {
  getBearerToken,
  getOpenAIEnv,
  sendJson,
  sendText,
  truncateString,
  verifySupabaseJwt,
} from '../../src/server/ai-proxy';

export const config = {
  runtime: 'nodejs',
};

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MODELS = new Set(['whisper-1']);

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

  // Parse multipart form
  let fields: any;
  let files: any;
  try {
    const mod: any = await import('formidable');
    const formidable = mod?.default || mod;
    const form = formidable({
      multiples: false,
      maxFileSize: MAX_FILE_BYTES,
      allowEmptyFiles: false,
      minFileSize: 1,
    });

    ({ fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err: any, flds: any, fls: any) => {
        if (err) return reject(err);
        resolve({ fields: flds, files: fls });
      });
    }));
  } catch (e: any) {
    return sendJson(res, 400, { error: 'Invalid multipart form', message: e?.message });
  }

  const modelCandidate = typeof fields?.model === 'string' ? fields.model : 'whisper-1';
  const model = ALLOWED_MODELS.has(modelCandidate) ? modelCandidate : 'whisper-1';

  const file = files?.file || files?.audio || files?.blob;
  const picked = Array.isArray(file) ? file[0] : file;

  if (!picked?.filepath) {
    return sendJson(res, 400, { error: 'Missing audio file field (expected: file)' });
  }

  const fs = await import('node:fs/promises');
  const buf = await fs.readFile(picked.filepath);

  if (buf.length > MAX_FILE_BYTES) {
    return sendJson(res, 413, { error: `File too large (>${MAX_FILE_BYTES} bytes)` });
  }

  const filename = truncateString(picked.originalFilename || 'audio.webm', 200);
  const mimeType = truncateString(picked.mimetype || 'application/octet-stream', 200);

  console.log('[api/ai/stt] request', {
    userId: user.id,
    fileBytes: buf.length,
    mimeType,
    model,
  });

  const formData = new FormData();
  formData.append('file', new Blob([buf], { type: mimeType }), filename);
  formData.append('model', model);

  const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  const text = await upstream.text();

  if (!upstream.ok) {
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

  const transcript = data?.text;
  if (typeof transcript !== 'string') {
    return sendJson(res, 502, { error: 'OpenAI response missing text' });
  }

  return sendJson(res, 200, { text: transcript });
}
