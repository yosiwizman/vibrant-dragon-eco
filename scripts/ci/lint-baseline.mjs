#!/usr/bin/env node
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

try {
  const { stdout } = await run('pnpm', ['exec', 'eslint', '.', '-f', 'json']);
  // ESLint exits non-zero on lint errors; we ignore exit code and parse stdout
  const results = JSON.parse(stdout || '[]');
  const totalErrors = results.reduce((sum, r) => sum + (r.errorCount || 0), 0);
  process.stdout.write(String(totalErrors));
  process.exit(0);
} catch (err) {
  console.error('[lint-baseline] Failed to run eslint:', err?.message || err);
  // In failure, output -1 so downstream can detect infra issue
  process.stdout.write('-1');
  process.exit(0);
}
