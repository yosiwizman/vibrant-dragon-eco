# 🎯 INVESTOR DEMO RUNBOOK
**Echo AI Assistant - v0.1.0-demo**  
**Duration:** 5–10 minutes  
**Last Updated:** 2026-01-17

---

## PRE-DEMO CHECKLIST (2 minutes before)

✅ Open https://www.echo-voice.com in a private/incognito window  
✅ Verify `/api/ai/status` returns `{"configured":true,...}` (server-side OpenAI ready)  
✅ Confirm you have valid login credentials (email + password or OAuth)  
✅ Test microphone permission in browser (allow when prompted)  
✅ Ensure audio output is working (unmuted, volume up)  
✅ Have backup: screenshot/video recording of working demo as fallback

---

## DEMO SCRIPT (5–10 minutes)

### **INTRO (30 seconds)**
> "Echo is an AI assistant that works end-to-end without users needing their own OpenAI API key. I'll show you our Demo Mode feature built specifically for this investor presentation."

### **1. Login Flow (30 seconds)**
**URL:** https://www.echo-voice.com/login

**Actions:**
1. Show clean login screen
2. Sign in with credentials
3. Redirect to `/app` dashboard

**Fallback if login fails:**
- "We have a pre-authenticated session ready" → use existing logged-in session
- Skip to Step 2 immediately

---

### **2. Enable Demo Mode (60 seconds)**
**URL:** https://www.echo-voice.com/app → Click "Settings" (gear icon)

**Actions:**
1. Navigate to Settings page
2. Locate "Demo Mode" card (fuchsia border, "Investor Demo" badge)
3. Show status indicator: "Ready (server configured)" with green checkmark
4. Toggle "Enable Demo Mode" switch → ON
5. Highlight message: "Demo Mode enabled - AI features work without a client key"

**Key talking points:**
- "Notice we didn't enter any OpenAI API key"
- "All AI requests go through our secure server-side proxy at `/api/ai/*`"
- "Server validates every request with Supabase authentication"
- "User's personal OpenAI key is never exposed"

**Fallback if Demo Mode UI not visible:**
- Check Settings → General tab for Demo Mode card
- If missing, explain: "Demo Mode is enabled by default in this deployment"

---

### **3. Text Chat Demo (90 seconds)**
**URL:** https://www.echo-voice.com/app (or `/chat`)

**Actions:**
1. Navigate to Chat interface
2. Type simple query: "What's the weather like today in San Francisco?"
3. Wait for AI response (should be fast, < 3 seconds)
4. Type follow-up: "What should I pack for a trip there?"
5. Show conversation context is maintained

**Key talking points:**
- "No OpenAI key required from the user"
- "Server-side proxy handles authentication and rate limiting"
- "Responses are fast and natural"

**Fallback if chat fails:**
- Show Settings → confirm Demo Mode toggle is ON and status is "Ready"
- Retry with simpler query: "Hello, can you help me?"
- If persistent failure: move to Voice demo or show pre-recorded video

---

### **4. Voice Chat Demo (120 seconds)**
**URL:** https://www.echo-voice.com/app → Voice Chat or mic button

**Actions:**
1. Click microphone button to start voice conversation
2. **Allow microphone permission** when browser prompts
3. Say: "Hello Echo, what can you help me with?"
4. Wait for voice response (TTS playback)
5. Follow-up: "Set a reminder for tomorrow at 9 AM to call John"

**Key talking points:**
- "Speech-to-text (Whisper) proxied server-side"
- "Text-to-speech (OpenAI TTS) also proxied"
- "No client-side API key needed for voice features either"
- "All voice data stays encrypted in transit"

**Fallback if mic permission denied:**
- "Let me show text chat capabilities instead" → return to Step 3
- Or: "Browser microphone blocked - we have pre-recorded demo" → show video

**Fallback if voice fails:**
- Check browser console for errors (F12)
- Verify Demo Mode is ON in Settings
- Fall back to showing text chat working smoothly

---

### **5. Demo Mode Architecture Overview (60 seconds)**
**Show Settings → Demo Mode card again**

**Explain:**
1. Server-side proxy endpoints:
   - `GET /api/ai/status` - Configuration check
   - `POST /api/ai/chat` - Chat completions
   - `POST /api/ai/tts` - Text-to-speech
   - `POST /api/ai/stt` - Speech-to-text (Whisper)

2. Security features:
   - Supabase JWT validation on every request
   - Model allowlists (gpt-4o-mini, gpt-4o)
   - Input/output caps and rate limits
   - Server-side key never exposed to client

3. User experience:
   - Zero friction - no API key signup
   - Works immediately after login
   - Same features as if user provided own key

---

### **CLOSING (30 seconds)**
> "This Demo Mode allows us to showcase the full Echo experience to investors and new users without requiring them to obtain their own OpenAI API keys. The same architecture can support freemium tiers, trial periods, or enterprise deployments where the organization provides centralized AI access."

**Next steps mention:**
- Production-ready for investor demos
- Architecture scales for multi-tenant usage
- Can toggle between user-provided keys and server-side proxy per user/org

---

## FALLBACK SCENARIOS

### **If Demo Mode Toggle Missing**
1. Verify logged in as correct user
2. Check URL is production: https://www.echo-voice.com
3. Hard refresh browser (Ctrl+Shift+R)
4. If still missing: explain feature is server-configured and proceed to test chat/voice

### **If Microphone Permission Blocked**
1. Click browser address bar → site settings → microphone → allow
2. Refresh page and retry
3. If blocked at OS level: skip voice demo, focus on text chat

### **If AI Responses Fail**
1. Open browser DevTools (F12) → Network tab
2. Check `/api/ai/chat` or `/api/ai/status` responses
3. If 500 error: "Temporary backend issue, let me show our backup demo recording"
4. If 401 error: "Session expired" → re-login
5. If configured:false: "Server key not set" → escalate to tech team (should not happen in prod)

### **If Login Fails**
1. Try password reset flow
2. Use OAuth provider (GitHub/Google) if configured
3. Use pre-authenticated session or demo account
4. Worst case: show screen recording of working demo

### **If Entire Site is Down**
1. Check https://www.echo-voice.com/api/ai/status first
2. Verify Vercel deployment status: https://vercel.com/software-4-all/vibrant-dragon-echo
3. Use backup: pre-recorded demo video
4. Mention: "We have 99.9% uptime SLA on Vercel's infrastructure"

---

## POST-DEMO ACTIONS

✅ Log out of demo account (if using shared credentials)  
✅ Clear browser session/cookies if demoing on public machine  
✅ Verify no sensitive data visible in browser history/autocomplete  
✅ Check Vercel logs for any errors during demo (optional)

---

## BACKUP MATERIALS

**If live demo fails completely:**
1. Show architecture diagram (if available)
2. Show screen recording of working demo (record beforehand)
3. Walk through code in GitHub: https://github.com/yosiwizman/vibrant-dragon-eco
   - `/api/ai/*` endpoints
   - `src/components/DemoModeCard.tsx`
   - `src/services/ai-proxy.ts`

---

## EMERGENCY CONTACTS

**If technical issues during investor call:**
- Developer on-call: [Add contact info]
- Vercel dashboard: https://vercel.com/software-4-all/vibrant-dragon-echo
- GitHub repo (check CI status): https://github.com/yosiwizman/vibrant-dragon-eco

---

**Version:** v0.1.0-demo  
**Status:** Production-ready for investor presentations  
**Last Smoke Test:** 2026-01-17T06:00:00Z ✅
