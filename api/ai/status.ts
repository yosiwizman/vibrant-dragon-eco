import { getOpenAIEnv, getSupabaseEnv, sendJson, sendText } from '../../src/server/ai-proxy.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendText(res, 405, 'Method Not Allowed');
  }

  const { apiKey } = getOpenAIEnv();
  const { env: supabaseEnv, missing } = getSupabaseEnv();

  const openaiConfigured = !!apiKey;
  const supabaseConfigured = !!supabaseEnv;

  // "configured" means Demo Mode can actually function end-to-end (auth + OpenAI calls).
  const configured = openaiConfigured && supabaseConfigured;

  return sendJson(res, 200, {
    configured,
    openaiConfigured,
    supabaseConfigured,
    missing,
  });
}
