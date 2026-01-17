# 🔍 PRODUCTION SMOKE TEST CHECKLIST
**Echo AI Assistant - v0.1.0-demo**  
**Production URL:** https://www.echo-voice.com  
**Last Updated:** 2026-01-17

---

## CRITICAL ENDPOINTS

### 1. Server Configuration Check
**URL:** `https://www.echo-voice.com/api/ai/status`  
**Method:** GET  
**Expected Response:**
```json
{
  "configured": true,
  "openaiConfigured": true,
  "supabaseConfigured": true,
  "missing": []
}
```
**Success Criteria:**
- ✅ HTTP 200 OK
- ✅ `configured: true`
- ✅ `openaiConfigured: true`
- ✅ `supabaseConfigured: true`
- ✅ Response time < 1 second

**Failure Indicators:**
- ❌ HTTP 500: Server error (check Vercel logs)
- ❌ `configured: false`: Missing env vars (check OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY)
- ❌ Timeout: Vercel function cold start or network issue

---

### 2. Login Page
**URL:** `https://www.echo-voice.com/login`  
**Method:** GET  
**Expected Response:**
- ✅ HTTP 200 OK
- ✅ Supabase Auth UI visible (email/password fields or OAuth buttons)
- ✅ No console errors in browser DevTools
- ✅ Page loads in < 2 seconds

**Success Criteria:**
- ✅ Login form renders correctly
- ✅ "Echo AI Assistant" branding visible
- ✅ No CORS errors
- ✅ No 404s for assets (CSS, JS, images)

**Failure Indicators:**
- ❌ HTTP 404: Vercel routing misconfigured
- ❌ Blank page: JavaScript bundle failed to load
- ❌ CORS errors: Supabase config mismatch
- ❌ Redirect loop: Auth state misconfigured

---

### 3. App Dashboard (Unauthenticated)
**URL:** `https://www.echo-voice.com/app`  
**Method:** GET (without auth)  
**Expected Response:**
- ✅ HTTP 200 OK
- ✅ Redirect to `/login` OR show "Please log in" message
- ✅ No 500 errors

**Success Criteria:**
- ✅ Auth guard works correctly (no access to protected routes without login)
- ✅ Redirect to login page is smooth (no flash of protected content)

**Failure Indicators:**
- ❌ HTTP 500: App crashed on route guard
- ❌ Shows protected content: Auth guard broken (security issue)
- ❌ Blank page: React Router misconfigured

---

### 4. App Dashboard (Authenticated)
**URL:** `https://www.echo-voice.com/app`  
**Method:** GET (after successful login)  
**Expected Response:**
- ✅ HTTP 200 OK
- ✅ Main dashboard UI visible (chat interface, settings button, etc.)
- ✅ No console errors
- ✅ User session valid

**Success Criteria:**
- ✅ Dashboard renders correctly
- ✅ Navigation menu visible (Settings, Chat, Voice)
- ✅ User profile/avatar visible (if implemented)
- ✅ No 401 errors in Network tab

**Failure Indicators:**
- ❌ Redirect to login: Session expired or auth broken
- ❌ Blank dashboard: React rendering error
- ❌ 401 errors: Supabase JWT validation failing

---

## DEMO MODE FEATURE

### 5. Demo Mode Toggle (Settings Page)
**URL:** `https://www.echo-voice.com/app` → Click Settings (gear icon)  
**Expected UI Elements:**
- ✅ "Demo Mode" card visible with fuchsia border
- ✅ "Investor Demo" badge displayed
- ✅ Status indicator shows: "Ready (server configured)" with green checkmark
- ✅ Toggle switch present and functional

**Success Criteria:**
- ✅ Toggle switch: OFF → ON changes state in localStorage/preferences
- ✅ Status indicator updates when server status changes
- ✅ Helpful message displayed: "Demo Mode enabled - AI features work without a client key"

**Failure Indicators:**
- ❌ Demo Mode card missing: Component not rendered (check React tree)
- ❌ Status shows "Not configured": Server env vars not set
- ❌ Toggle doesn't persist: localStorage or Supabase preferences broken

---

### 6. Text Chat (Demo Mode Enabled)
**URL:** `https://www.echo-voice.com/app` or `/chat`  
**Prerequisites:**
- User logged in
- Demo Mode toggle: ON

**Test Actions:**
1. Navigate to Chat interface
2. Type: "Hello, what can you help me with?"
3. Press Enter

**Expected Response:**
- ✅ Message sent successfully
- ✅ AI response appears in < 5 seconds
- ✅ Response is coherent and contextual
- ✅ Network tab shows: `POST /api/ai/chat` returns HTTP 200

**Success Criteria:**
- ✅ Chat UI updates smoothly (loading state → message)
- ✅ No 401 Unauthorized errors (Supabase JWT valid)
- ✅ No 500 errors (server proxy working)
- ✅ Response matches OpenAI chat completion format

**Failure Indicators:**
- ❌ HTTP 401: Supabase JWT missing or invalid
- ❌ HTTP 500: OpenAI API key invalid or proxy crashed
- ❌ Timeout: OpenAI API slow or Vercel function timeout (10s limit)
- ❌ No response: Client-side AI service routing broken

---

### 7. Voice Chat / TTS (Demo Mode Enabled)
**URL:** `https://www.echo-voice.com/app` → Voice Chat or mic button  
**Prerequisites:**
- User logged in
- Demo Mode toggle: ON
- Microphone permission granted

**Test Actions:**
1. Click microphone button
2. Speak: "Hello Echo"
3. Wait for voice response

**Expected Response:**
- ✅ Microphone activates (visual indicator)
- ✅ Speech-to-text transcription appears
- ✅ AI text response appears
- ✅ Text-to-speech audio plays back
- ✅ Network tab shows: `POST /api/ai/stt` and `POST /api/ai/tts` return HTTP 200

**Success Criteria:**
- ✅ STT (Whisper): Audio uploaded, transcription accurate
- ✅ TTS (OpenAI): Audio file returned and plays smoothly
- ✅ No 401/500 errors
- ✅ Audio quality is clear (no distortion, glitches)

**Failure Indicators:**
- ❌ HTTP 413: Audio file too large (> 10MB for STT)
- ❌ HTTP 500: OpenAI Whisper/TTS API error
- ❌ No transcription: Microphone not capturing or STT proxy broken
- ❌ No audio playback: TTS proxy broken or browser audio blocked

---

### 8. Voice Chat / STT (Demo Mode Enabled)
**URL:** `https://www.echo-voice.com/app` → Voice Chat  
**Prerequisites:**
- User logged in
- Demo Mode toggle: ON
- Microphone permission granted

**Test Actions:**
1. Click microphone button
2. Speak clearly: "What is the capital of France?"
3. Stop recording

**Expected Response:**
- ✅ Transcription appears: "What is the capital of France?" (or similar)
- ✅ Network tab shows: `POST /api/ai/stt` returns HTTP 200
- ✅ Response body contains `{"text": "What is the capital of France?"}`

**Success Criteria:**
- ✅ Audio uploaded as multipart/form-data
- ✅ Whisper transcription accurate
- ✅ Response time < 5 seconds
- ✅ No errors in console

**Failure Indicators:**
- ❌ HTTP 400: Malformed request (multipart parsing failed)
- ❌ HTTP 413: File too large
- ❌ Empty transcription: Audio silent or codec mismatch

---

## NEGATIVE TESTS (Security & Edge Cases)

### 9. API Endpoints Without Auth
**Test:** Call `/api/ai/chat` without `Authorization` header  
**Expected:** HTTP 401 Unauthorized  
**Success:** ✅ Server rejects unauthenticated requests

**Test:** Call `/api/ai/status` without auth  
**Expected:** HTTP 200 OK (status endpoint is public)  
**Success:** ✅ Status endpoint returns config without exposing secrets

---

### 10. API Endpoints With Invalid JWT
**Test:** Call `/api/ai/chat` with `Authorization: Bearer invalid_token`  
**Expected:** HTTP 401 Unauthorized  
**Success:** ✅ Server validates JWT correctly and rejects invalid tokens

---

### 11. Demo Mode Disabled (User's Own OpenAI Key)
**Test:** Toggle Demo Mode OFF, enter valid OpenAI key in Settings  
**Expected:**
- ✅ Chat requests go directly to OpenAI (not `/api/ai/*`)
- ✅ User's key used instead of server-side key
- ✅ No 401 errors
- ✅ Chat/voice work as normal

**Success Criteria:**
- ✅ App respects Demo Mode toggle state
- ✅ Fallback to client-side OpenAI integration works

---

## DEPLOYMENT VERIFICATION

### 12. Vercel Deployment Status
**URL:** https://vercel.com/software-4-all/vibrant-dragon-echo/deployments  
**Check:**
- ✅ Latest deployment status: "Ready" (green)
- ✅ Deployed from branch: `main`
- ✅ Commit SHA matches latest main (e.g., `8c2a884...`)
- ✅ No build errors or warnings
- ✅ Environment variables set (Production scope):
  - `OPENAI_API_KEY` (Sensitive)
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY` (Sensitive)

**Success Criteria:**
- ✅ Deployment shows "Ready" status
- ✅ Build logs clean (no errors)
- ✅ Function logs show no 500 errors in last 24 hours

---

### 13. GitHub CI Status
**URL:** https://github.com/yosiwizman/vibrant-dragon-eco/actions  
**Check:**
- ✅ Latest workflow run on `main`: green checkmark
- ✅ All checks passed (lint, build, tests if any)
- ✅ No failing jobs

**Success Criteria:**
- ✅ CI green on main branch
- ✅ No pending or failing workflows

---

## SMOKE TEST EXECUTION LOG

**Tester:** _______________  
**Date/Time:** _______________  
**Environment:** Production (https://www.echo-voice.com)  
**Deployment SHA:** _______________

| Test # | Test Name | Status (✅/❌) | Notes |
|--------|-----------|---------------|-------|
| 1 | Server Config Check | | |
| 2 | Login Page | | |
| 3 | App Dashboard (Unauth) | | |
| 4 | App Dashboard (Auth) | | |
| 5 | Demo Mode Toggle | | |
| 6 | Text Chat (Demo Mode) | | |
| 7 | Voice TTS (Demo Mode) | | |
| 8 | Voice STT (Demo Mode) | | |
| 9 | API No Auth | | |
| 10 | API Invalid JWT | | |
| 11 | Demo Mode Disabled | | |
| 12 | Vercel Deployment | | |
| 13 | GitHub CI | | |

**Overall Status:** _______________  
**Issues Found:** _______________  
**Sign-off:** _______________

---

## Automated Smoke Monitor

A scheduled GitHub Actions workflow runs every 15 minutes (and can be triggered manually) to verify production health.

- Workflow: .github/workflows/prod-smoke.yml ("Production Smoke Monitor")
- Checks:
  - /api/ai/status → 200 + application/json + configured=true
  - /login → 200 + text/html
  - / (optional) → 200 reachability
- Where to see runs: GitHub → Actions → Production Smoke Monitor

### Failure Alerts
- If the smoke workflow fails, a GitHub Issue is created or updated with title: "🚨 PROD Smoke Monitor Failing" (labels: ops, prod-smoke).
- The issue dedupes by reusing the same open issue and adding a new comment with the run URL and timestamp.
- When the monitor recovers, the workflow adds a comment "✅ Recovered" and closes the issue automatically.

A scheduled GitHub Actions workflow runs every 15 minutes (and can be triggered manually) to verify production health.

- Workflow: .github/workflows/prod-smoke.yml ("Production Smoke Monitor")
- Checks:
  - /api/ai/status → 200 + application/json + configured=true
  - /login → 200 + text/html
  - / (optional) → 200 reachability
- Where to see runs: GitHub → Actions → Production Smoke Monitor

## QUICK VERIFICATION SCRIPT (CLI)

```bash
# Run these commands to verify production endpoints quickly

# 1. Server config check
curl https://www.echo-voice.com/api/ai/status

# Expected: {"configured":true,"openaiConfigured":true,"supabaseConfigured":true,"missing":[]}

# 2. Login page
curl -I https://www.echo-voice.com/login

# Expected: HTTP/2 200

# 3. App page (will redirect to login if unauth)
curl -I https://www.echo-voice.com/app

# Expected: HTTP/2 200 or 302 (redirect to /login)

# 4. Verify Vercel deployment (requires `vercel` CLI + auth)
vercel ls vibrant-dragon-echo --token YOUR_VERCEL_TOKEN

# Expected: Latest deployment status "READY"
```

---

**Version:** v0.1.0-demo  
**Status:** Production smoke test checklist  
**Last Updated:** 2026-01-17
