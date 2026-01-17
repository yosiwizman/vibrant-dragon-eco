#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: false, ...opts });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    child.on('error', reject);
  });
}

function getBaseline() {
  try {
    const txt = readFileSync(new URL('../../quality-baseline.json', import.meta.url));
    const obj = JSON.parse(txt.toString());
    return {
      lintErrors: Number(obj?.baseline?.lintErrors ?? 0),
      failingTests: Number(obj?.baseline?.failingTests ?? 0),
    };
  } catch (e) {
    console.error('[quality-ratchet] Missing or invalid quality-baseline.json');
    return { lintErrors: 0, failingTests: 0 };
  }
}

async function getCurrentCounts() {
  const lintRes = await run('node', ['scripts/ci/lint-baseline.mjs']);
  const testRes = await run('node', ['scripts/ci/test-baseline.mjs']);
  const lintErrors = Number((lintRes.stdout || '').trim());
  const failingTests = Number((testRes.stdout || '').trim());
  return { lintErrors, failingTests };
}

const baseline = getBaseline();
const current = await getCurrentCounts();

const incLint = current.lintErrors > baseline.lintErrors;
const incTests = current.failingTests > baseline.failingTests;

console.log('[quality-ratchet] baseline:', baseline);
console.log('[quality-ratchet] current :', current);

if (incLint || incTests) {
  console.error('[quality-ratchet] Regression detected.');
  if (incLint) console.error(` - Lint errors increased: baseline=${baseline.lintErrors} current=${current.lintErrors}`);
  if (incTests) console.error(` - Failing tests increased: baseline=${baseline.failingTests} current=${current.failingTests}`);
  process.exit(1);
} else {
  console.log('[quality-ratchet] OK (no regressions).');
  process.exit(0);
}
