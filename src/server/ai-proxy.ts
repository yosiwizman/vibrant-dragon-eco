// Server-only helpers for Vercel Functions under /api/ai/*
// NOTE: Do not import this from client/browser code.

export type SupabaseAuthUser = {
  id: string;
  email?: string;
};

export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export function getSupabaseEnv(): { env: SupabaseEnv | null; missing: string[] } {
  // Support both server-style and existing VITE_ prefixed env vars.
  // In Vercel, both are available to serverless functions if configured.
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  const missing: string[] = [];
  if (!url) missing.push('SUPABASE_URL (or VITE_SUPABASE_URL)');
  if (!anonKey) missing.push('SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY)');

  if (!url || !anonKey) {
    return { env: null, missing };
  }

  return { env: { url, anonKey }, missing: [] };
}

export function getOpenAIEnv(): { apiKey: string | null } {
  const apiKey = process.env.OPENAI_API_KEY || '';
  return { apiKey: apiKey ? apiKey : null };
}

export function getBearerToken(req: any): string | null {
  const header = (req?.headers?.authorization || req?.headers?.Authorization || '') as string;
  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1]?.trim();
  return token ? token : null;
}

export async function verifySupabaseJwt(token: string): Promise<SupabaseAuthUser | null> {
  const { env } = getSupabaseEnv();
  if (!env) return null;

  // Validate token by calling Supabase Auth user endpoint.
  // This does not require service role key; anon key is sufficient.
  const url = `${env.url.replace(/\/$/, '')}/auth/v1/user`;

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    return null;
  }

  const data: any = await resp.json();
  if (!data?.id) return null;

  return { id: data.id, email: data.email };
}

export function sendJson(res: any, status: number, body: any): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export function sendText(res: any, status: number, text: string): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(text);
}

export async function readBody(req: any, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      throw new Error(`Request body too large (>${maxBytes} bytes)`);
    }
    chunks.push(buf);
  }

  return Buffer.concat(chunks);
}

export async function readJson(req: any, maxBytes: number): Promise<any> {
  const body = await readBody(req, maxBytes);
  if (!body.length) return null;

  try {
    return JSON.parse(body.toString('utf-8'));
  } catch {
    throw new Error('Invalid JSON');
  }
}

export function clampNumber(n: any, min: number, max: number, fallback: number): number {
  const num = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

export function truncateString(s: any, maxLen: number): string {
  const str = typeof s === 'string' ? s : '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen);
}
