# Quality Debt Ratchet (Demo-Safe)

Goal: Prevent regressions in lint/test debt during the investor demo window, without destabilizing production.

## Baselines (captured 2026-01-17T13:08:00Z)
- ESLint errors: 694
- Failing tests (Vitest): 20
- Tools
  - eslint: 9.39.2
  - vitest: 4.0.17

The baselines are recorded in `quality-baseline.json` and used by CI to enforce the ratchet.

## How the ratchet works
- CI still runs `pnpm run lint` and `pnpm run test` with `continue-on-error: true` (demo-safe).
- A new required step runs `node scripts/ci/quality-ratchet.mjs` which:
  - Computes current lint error count and failing test count.
  - Compares against `quality-baseline.json`.
  - Fails CI if either count increases (prevents regressions).
  - Passes if counts are equal or lower (improvements allowed and encouraged).

## Developer workflow
- To reduce debt:
  - Fix some lint errors or failing tests.
  - Submit PR as usual. CI will pass (ratchet allows improvements).
- To avoid regressions:
  - Do not introduce new lint errors or failing tests.
  - If changes inherently move a test to failing, mark it `test.skip` with a linked issue and keep the failing count <= baseline.

## Post-demo plan
- After debt reaches zero (ESLint = 0, Failing tests = 0):
  - Make `lint` and `test` steps blocking (remove continue-on-error).
  - Keep ratchet to guard against future regressions.

## Files
- `quality-baseline.json` — baseline counts + metadata
- `scripts/ci/lint-baseline.mjs` — prints total ESLint error count
- `scripts/ci/test-baseline.mjs` — prints total Vitest failing test count
- `scripts/ci/quality-ratchet.mjs` — fails CI if debt increases
