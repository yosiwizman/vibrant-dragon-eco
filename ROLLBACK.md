# 🔄 PRODUCTION ROLLBACK GUIDE
**Echo AI Assistant - v0.1.0-demo**  
**Production URL:** https://www.echo-voice.com  
**Vercel Project:** vibrant-dragon-echo (team: software-4-all)  
**Last Updated:** 2026-01-17

---

## WHEN TO ROLLBACK

Initiate a rollback immediately if ANY of the following occur in production:

### Critical Issues
- ❌ `/api/ai/status` returns HTTP 500 or `configured: false`
- ❌ Login page (https://www.echo-voice.com/login) returns HTTP 500 or fails to load
- ❌ App dashboard (https://www.echo-voice.com/app) crashes or shows blank page
- ❌ Demo Mode AI requests fail with consistent HTTP 401 or 500 errors
- ❌ Security issue: Unauthenticated users can access protected routes or API endpoints
- ❌ Data loss: User preferences, chat history, or voice recordings deleted/corrupted

### High-Severity Issues (Rollback During Demo)
- ❌ Voice chat (STT/TTS) completely broken during investor presentation
- ❌ Text chat non-functional during live demo
- ❌ Demo Mode toggle missing or broken during presentation
- ❌ Console floods with errors, degrading user experience

### Non-Critical Issues (Defer Rollback)
- ⚠️ Minor UI glitches (misaligned text, color issues)
- ⚠️ Non-blocking console warnings
- ⚠️ Slow response times (but still functional)
- ⚠️ Single feature broken (if others work)

**Decision Rule:** If the issue prevents a successful investor demo OR poses a security risk, rollback immediately. Otherwise, evaluate and patch forward if possible.

---

## ROLLBACK METHODS

### Method 1: Vercel Dashboard Rollback (RECOMMENDED)
**Use when:** You need immediate rollback with GUI visibility (fastest, safest)

**Steps:**
1. Open Vercel Dashboard:  
   https://vercel.com/software-4-all/vibrant-dragon-echo/deployments

2. Identify the last known-good deployment:
   - Look for deployments with status "Ready" (green checkmark)
   - Check deployment commit message and SHA
   - Verify deployment timestamp (before the issue started)
   - Recommended: Use the most recent "Ready" deployment before the problematic one

3. Click the three-dot menu (⋮) on the last known-good deployment

4. Select **"Redeploy"**
   - Vercel will rebuild and redeploy that exact commit
   - This creates a NEW deployment (not an instant rollback)
   - Build time: ~2-3 minutes

5. Wait for deployment status to change to "Ready"

6. Verify the rollback (see "Post-Rollback Verification" section below)

---

### Method 2: Vercel CLI Rollback
**Use when:** You prefer command-line tools or need scripting/automation

**Prerequisites:**
- Vercel CLI installed: `npm install -g vercel`
- Authenticated: `vercel login`
- Linked to project: `vercel link` (in repo root)

**Steps:**

```bash
# 1. List recent deployments
vercel ls vibrant-dragon-echo

# Output example:
# Age  Deployment                            Status   Duration  Branch
# 5m   vibrant-dragon-echo-abc123.vercel.app Ready    2m 15s    main
# 1h   vibrant-dragon-echo-xyz789.vercel.app Ready    2m 10s    main
# 3h   vibrant-dragon-echo-def456.vercel.app Failed   1m 5s     main

# 2. Identify the last known-good deployment URL (from the list above)
# Example: vibrant-dragon-echo-xyz789.vercel.app

# 3. Promote that deployment to production
vercel promote vibrant-dragon-echo-xyz789.vercel.app

# 4. Confirm promotion
# Vercel will ask: "Promote vibrant-dragon-echo-xyz789.vercel.app to production? (y/N)"
# Type: y

# 5. Verify the rollback
curl https://www.echo-voice.com/api/ai/status
# Expected: {"configured":true,...}
```

**Advantages:**
- Instant promotion (no rebuild required)
- Can be scripted for automation
- Shows deployment history clearly

**Disadvantages:**
- Requires CLI installed and authenticated
- Less visual than dashboard

---

### Method 3: Git Revert + Redeploy
**Use when:** You want to revert code in `main` branch (for long-term fix, not emergency)

**Steps:**

```bash
# 1. Identify the problematic commit on main
git log --oneline -10

# Example output:
# abc1234 feat: broken feature
# xyz5678 fix: stable commit
# def9012 feat: demo mode

# 2. Revert the problematic commit (creates a new commit that undoes changes)
git revert abc1234 --no-edit

# 3. Push to main
git push origin main

# 4. Vercel auto-deploys from main (CI triggers deployment)
# Wait ~2-3 minutes for build + deploy

# 5. Verify the rollback
curl https://www.echo-voice.com/api/ai/status
```

**Advantages:**
- Fixes the `main` branch permanently
- Creates a clean revert commit in history
- Allows team to review what was reverted

**Disadvantages:**
- Slower than Vercel dashboard rollback (requires rebuild)
- May cause merge conflicts if multiple commits need reverting
- Not recommended during live investor demo (too slow)

---

### Method 4: Emergency Manual Deployment (LAST RESORT)
**Use when:** All other methods fail OR you need to deploy from a specific local commit

**Steps:**

```bash
# 1. Check out the last known-good commit locally
git checkout xyz5678  # Replace with SHA of stable commit

# 2. Deploy directly to production (bypasses CI)
vercel --prod

# 3. Confirm deployment
# Vercel CLI will output deployment URL
# Example: https://vibrant-dragon-echo-abc123.vercel.app

# 4. Verify the rollback
curl https://www.echo-voice.com/api/ai/status
```

**⚠️ WARNING:**
- Bypasses CI checks (dangerous)
- Only use in true emergencies
- Deployment may not match `main` branch state
- Document the emergency deployment in team chat/log

---

## POST-ROLLBACK VERIFICATION

After rolling back, run the following checks (in order):

### 1. Server Configuration Check
```bash
curl https://www.echo-voice.com/api/ai/status
```
**Expected:**
```json
{
  "configured": true,
  "openaiConfigured": true,
  "supabaseConfigured": true,
  "missing": []
}
```
✅ **Pass:** If all booleans are `true`  
❌ **Fail:** If any boolean is `false` or HTTP 500 → Check environment variables

---

### 2. Login Page Load
```bash
curl -I https://www.echo-voice.com/login
```
**Expected:** `HTTP/2 200`  
✅ **Pass:** If HTTP 200  
❌ **Fail:** If HTTP 500 or timeout → Check Vercel deployment logs

---

### 3. App Dashboard (Unauthenticated)
```bash
curl -I https://www.echo-voice.com/app
```
**Expected:** `HTTP/2 200` or `HTTP/2 302` (redirect to /login)  
✅ **Pass:** If HTTP 200 or 302  
❌ **Fail:** If HTTP 500 → App routing broken

---

### 4. Demo Mode UI Check (Requires Browser)
**Steps:**
1. Open https://www.echo-voice.com/login in browser
2. Log in with test credentials
3. Navigate to Settings (gear icon)
4. Verify Demo Mode card is visible with:
   - "Ready (server configured)" status
   - Toggle switch functional
   - Fuchsia border + "Investor Demo" badge

✅ **Pass:** If Demo Mode card renders correctly  
❌ **Fail:** If card missing or status shows "Not configured" → Check server env vars

---

### 5. Text Chat Smoke Test (Requires Browser)
**Steps:**
1. Log in at https://www.echo-voice.com/login
2. Enable Demo Mode in Settings (toggle ON)
3. Navigate to Chat interface
4. Send message: "Hello"
5. Wait for AI response

✅ **Pass:** If response appears in < 5 seconds  
❌ **Fail:** If no response or HTTP 500 → Check `/api/ai/chat` logs

---

### 6. Voice Chat Smoke Test (Requires Browser + Mic)
**Steps:**
1. Log in at https://www.echo-voice.com/login
2. Enable Demo Mode in Settings
3. Navigate to Voice Chat
4. Click microphone button
5. Allow microphone permission
6. Speak: "Hello Echo"

✅ **Pass:** If transcription + TTS response work  
❌ **Fail:** If STT/TTS fails → Check `/api/ai/stt` and `/api/ai/tts` logs

---

### 7. Verify Deployment SHA Matches Expected
**In Vercel Dashboard:**
- Check "Latest Deployment" commit SHA
- Confirm it matches the intended rollback target

**In CLI:**
```bash
vercel inspect vibrant-dragon-echo --prod
# Check "Deployment Source" → "Commit SHA"
```

✅ **Pass:** If SHA matches last known-good commit  
❌ **Fail:** If SHA is unexpected → Wrong deployment promoted

---

## ENVIRONMENT VARIABLES CHECK

If rollback succeeds but features still broken, verify production environment variables:

**Required Env Vars (Production scope):**
1. `OPENAI_API_KEY` (Sensitive) - Server-side OpenAI API key
2. `SUPABASE_URL` - Supabase project URL
3. `SUPABASE_ANON_KEY` (Sensitive) - Supabase anon key

**How to Check (Vercel Dashboard):**
1. Go to: https://vercel.com/software-4-all/vibrant-dragon-echo/settings/environment-variables
2. Filter by "Production" scope
3. Verify all 3 variables are present
4. If missing: Add them and redeploy

**How to Check (Vercel CLI):**
```bash
vercel env ls --prod
# Expected output should list OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
```

⚠️ **SECURITY NOTE:** Never log or expose these values. Only verify they exist.

---

## ROLLBACK DECISION TREE

```
Issue detected in production
    │
    ├─ Is it blocking investor demo or security-critical?
    │   ├─ YES → Use Method 1 (Vercel Dashboard Rollback) IMMEDIATELY
    │   └─ NO → Continue to next check
    │
    ├─ Can it be patched forward quickly (< 10 min)?
    │   ├─ YES → Fix forward (commit + push to main)
    │   └─ NO → Use Method 1 (Vercel Dashboard Rollback)
    │
    ├─ Is it a known-good deployment within last 24 hours?
    │   ├─ YES → Use Method 1 or 2 (promote last known-good)
    │   └─ NO → Use Method 3 (git revert + redeploy)
    │
    └─ All methods failing?
        └─ YES → Use Method 4 (Emergency Manual Deployment) + escalate to dev team
```

---

## POST-ROLLBACK ACTIONS

### Immediate (Within 5 Minutes)
1. ✅ Verify rollback using "Post-Rollback Verification" checklist above
2. ✅ Notify team in Slack/Discord/Email: "Production rolled back to [COMMIT_SHA]"
3. ✅ Document the incident:
   - What broke?
   - When did it break?
   - Which deployment caused it?
   - What was rolled back to?

### Short-Term (Within 1 Hour)
1. ✅ Investigate root cause of failure:
   - Check Vercel deployment logs
   - Check Vercel function logs (Runtime Logs)
   - Check browser console errors (if UI issue)
   - Review diff of problematic commit

2. ✅ Create GitHub issue:
   - Title: "Production rollback: [brief description]"
   - Body: Include incident details, logs, reproduction steps
   - Label: `bug`, `production`, `high-priority`

### Long-Term (Within 24 Hours)
1. ✅ Fix the root cause in a new PR
2. ✅ Test fix thoroughly in preview deployment (Vercel auto-creates preview for PR branches)
3. ✅ Require PR review before merging to `main`
4. ✅ Monitor production after fix is deployed
5. ✅ Update this ROLLBACK.md if process can be improved

---

## ROLLBACK HISTORY LOG

Keep a record of production rollbacks for post-mortem analysis.

| Date | Time (UTC) | Rolled Back From | Rolled Back To | Reason | Initiated By |
|------|------------|------------------|----------------|--------|--------------|
| 2026-01-17 | 06:00 | (example) | abc1234 | HTTP 500 on /api/ai/status | DevOps |
| | | | | | |

---

## EMERGENCY CONTACTS

**If rollback fails or you need help:**
- Developer on-call: [Add contact info]
- Vercel support: support@vercel.com (Enterprise customers have dedicated support)
- GitHub repo: https://github.com/yosiwizman/vibrant-dragon-eco
- Vercel dashboard: https://vercel.com/software-4-all/vibrant-dragon-echo

---

## APPENDIX: Known-Good Deployments (v0.1.0-demo)

**Last Stable Production Deployments:**

| Commit SHA | Date/Time | Status | Notes |
|------------|-----------|--------|-------|
| `8c2a884` | 2026-01-17 | ✅ Ready | Dependabot globals upgrade |
| `1abacb1` | 2026-01-17 | ✅ Ready | Demo Mode Vercel Functions TS fix |
| `c442391` | 2026-01-17 | ⚠️ Partial | Demo Mode initial deploy (HTTP 500 on /api/ai/status) |

**Recommended Rollback Target for v0.1.0-demo:** `8c2a884` (most recent stable)

---

**Version:** v0.1.0-demo  
**Status:** Production rollback procedures  
**Last Updated:** 2026-01-17
