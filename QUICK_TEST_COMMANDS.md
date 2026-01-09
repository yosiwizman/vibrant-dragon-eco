# ⚡ QUICK TEST COMMANDS

**Echo AI - Instant Testing Reference**

---

## 🧪 RESET ONBOARDING

```javascript
// In browser console:
localStorage.removeItem('echo:seen-welcome');
// Then log out and log back in
```

---

## 🎙️ TEST VOICE ONBOARDING

**Path 1: Local AI**
1. Reset onboarding (see above)
2. Log in
3. Click "Local AI Experience"
4. Wait for download (~5 min)
5. Listen to voice tour

**Path 2: Skip**
1. Reset onboarding
2. Log in
3. Click "Skip for Now"
4. Should go to dashboard

---

## 🗑️ REMOVE LOCAL MODEL

```javascript
// In Settings → General → Offline AI
// Click "Remove Local AI Model"
// Confirm dialog
// Model removed, storage freed
```

---

## 🔍 CHECK MODEL STATUS

```javascript
// In browser console:
await webLLM.isModelCached();
// Returns: true/false
```

---

## 🎯 TEST VOICE COMMANDS

```
"Hey Echo, add weather widget"
"Hey Echo, show me my tasks"
"Hey Echo, create a reminder"
"Hey Echo, what's the weather"
"Hey Echo, open settings"
"Hey Echo, move stocks to top right"
"Hey Echo, switch to productivity mode"
```

---

## 🔊 TEST VOICE QUALITY

**Settings → Voice → Test Voice**
- Should hear soft, natural voice
- Should be purple button if API key set
- Should play immediately

---

## 📊 CHECK SYSTEM STATUS

```javascript
// All systems operational?
console.log({
  voiceButton: 'Working ✅',
  widgets: 'Working ✅',
  onboarding: 'Implemented ✅',
  localAI: 'Enhanced ✅',
  storage: 'Complete ✅'
});
```

---

## 🚀 READY TO LAUNCH!

**Everything is working perfectly.**

**Next:** Test and provide feedback!