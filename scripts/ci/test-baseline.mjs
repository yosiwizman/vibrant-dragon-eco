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
  const { stdout } = await run('pnpm', ['exec', 'vitest', 'run', '--reporter=json']);
  const obj = JSON.parse(stdout || '{}');
  const failures = Number(obj.numFailedTests ?? 0);
  process.stdout.write(String(failures));
  process.exit(0);
} catch (err) {
  console.error('[test-baseline] Failed to run vitest:', err?.message || err);
  process.stdout.write('-1');
  process.exit(0);
}
