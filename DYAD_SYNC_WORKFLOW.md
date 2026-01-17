# Dyad Sync Workflow (No Stale Pushes to main)

This guide prevents the “fetch first / non-fast-forward” error and keeps the repo stable during demos.

## Why this happens
- The error means your local `main` is older than GitHub’s `main`.
- Pushing would overwrite newer commits on GitHub, so Git blocks the push.

## The correct workflow (always pull first)
1) Before editing, click “Sync” (or run `git fetch` + `git pull --rebase`) to get the latest `main`.
2) Never push directly to `main`.
3) Create a branch from the latest `origin/main`, make changes, then open a Pull Request (PR):
   - Branch name examples: `dyad/feature-xyz`, `dyad/fix-routing`, `dyad/recover-YYYYMMDD-short`.
   - Keep commits clean (no “WIP”).
   - Squash-merge the PR when CI is green.

## If you see “fetch first / non-fast-forward” again
- Re-sync your local `main` to match GitHub exactly:
  - `git fetch origin`
  - `git switch main`
  - `git pull --rebase origin main` (preferred)
  - If Dyad shows no local edits but still can’t push, a hard reset is safe:
    - `git fetch origin && git reset --hard origin/main` (this discards only unpushed local commits on `main`).
- Then branch from `origin/main` and continue via PR.

## Standards (already enforced)
- `main` is protected: CI required, no force-push, branches deleted after merge, squash-merge PRs.

## Helpful links
- Repo: https://github.com/yosiwizman/vibrant-dragon-eco
- New PR: https://github.com/yosiwizman/vibrant-dragon-eco/compare
- Actions (CI): https://github.com/yosiwizman/vibrant-dragon-eco/actions
