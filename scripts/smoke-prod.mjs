// scripts/smoke-prod.mjs
// Simple production smoke checks using native fetch (Node 18+)
// - Timeout: 5s via AbortController
// - Checks:
//   1) /api/ai/status: 200 + application/json + configured === true
//   2) /login: 200 + text/html
//   3) Optional root: 200 (log-only)

const PROD_BASE = 'https://www.echo-voice.com';
const TIMEOUT_MS = 5000;

function withTimeout(ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, cancel: () => clearTimeout(t) };
}

async function checkJsonStatus() {
  const { signal, cancel } = withTimeout(TIMEOUT_MS);
  const url = `${PROD_BASE}/api/ai/status`;
  try {
    const res = await fetch(url, { signal });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (res.status !== 200) throw new Error(`Unexpected status ${res.status}`);
    if (!ct.includes('application/json')) throw new Error(`Unexpected Content-Type ${ct}`);
    const body = await res.json();
    if (!body || body.configured !== true) throw new Error(`configured not true: ${JSON.stringify(body)}`);
    console.log(`[OK] ${url} -> 200 application/json configured=true`);
  } catch (err) {
    console.error(`[FAIL] ${url}:`, err.message || err);
    process.exit(1);
  } finally {
    cancel();
  }
}

async function checkLoginHtml() {
  const { signal, cancel } = withTimeout(TIMEOUT_MS);
  const url = `${PROD_BASE}/login`;
  try {
    const res = await fetch(url, { signal });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (res.status !== 200) throw new Error(`Unexpected status ${res.status}`);
    if (!ct.includes('text/html')) throw new Error(`Unexpected Content-Type ${ct}`);
    console.log(`[OK] ${url} -> 200 text/html`);
  } catch (err) {
    console.error(`[FAIL] ${url}:`, err.message || err);
    process.exit(1);
  } finally {
    cancel();
  }
}

async function checkRootOptional() {
  const { signal, cancel } = withTimeout(TIMEOUT_MS);
  const url = `${PROD_BASE}/`;
  try {
    const res = await fetch(url, { signal });
    if (res.status === 200) {
      console.log(`[OK] ${url} -> 200`);
    } else {
      console.warn(`[WARN] ${url} -> status ${res.status}`);
    }
  } catch (err) {
    console.warn(`[WARN] ${url}:`, err.message || err);
  } finally {
    cancel();
  }
}

(async () => {
  await checkJsonStatus();
  await checkLoginHtml();
  await checkRootOptional();
  console.log('Smoke checks passed.');
})();
