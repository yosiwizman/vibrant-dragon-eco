# 🔊 FINAL VOICE TEST INSTRUCTIONS

**Let's diagnose this systematically**

---

## 🎯 TEST 1: Verify API Key (30 sec)

**In browser console (F12):**
```javascript
// Check if API key exists
const prefs = JSON.parse(localStorage.getItem('echo:prefs') || '{}');
console.log('API Key exists:', !!prefs.openaiApiKey);
console.log('API Key starts with:', prefs.openaiApiKey?.substring(0, 10));
console.log('API Key length:', prefs.openaiApiKey?.length);
```

**Expected:**
- API Key exists: `true`
- API Key starts with: `sk-proj-` or `sk-`
- API Key length: ~150-200 characters

---

## 🎯 TEST 2: Test Audio Beep (10 sec)

1. Go to Settings → Voice tab
2. Click **"Test Audio (Beep)"** button
3. Listen for a beep sound

**Result:**
- ✅ Hear beep → Audio works, issue is OpenAI TTS
- ❌ No beep → Audio is muted/blocked

---

## 🎯 TEST 3: Test Voice with Console Open (1 min)

1. **Open console** (F12)
2. **Clear console** (trash icon)
3. **Click "Test Voice" button**
4. **Watch for logs**

**Look for:**
```
[Test Voice] Starting test...
[Test Voice] API key exists: true
[OpenAI TTS] Synthesizing speech...
[Test Voice] Speech blob received!
[Test Voice] Blob size: XXXXX bytes
[Test Voice] Attempting to play audio...
```

**If you see error:**
```
[Test Voice] Play promise rejected: NotAllowedError
```
→ Browser blocked autoplay

**If you see:**
```
[OpenAI TTS] Synthesis failed: ...
```
→ API key issue

---

## 🎯 TEST 4: Manual Audio Test (30 sec)

**In browser console:**
```javascript
// Test if audio playback works at all
const audio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
audio.volume = 0.5;
audio.play()
  .then(() => console.log('✅ Audio playback works!'))
  .catch(e => console.error('❌ Audio blocked:', e));
```

**Result:**
- ✅ Hear music → Audio works
- ❌ No music → Audio blocked

---

## 🎯 TEST 5: Direct OpenAI TTS Test (1 min)

**In browser console:**
```javascript
// Get API key
const prefs = JSON.parse(localStorage.getItem('echo:prefs') || '{}');
const apiKey = prefs.openaiApiKey;

// Test OpenAI TTS directly
fetch('https://api.openai.com/v1/audio/speech', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'tts-1-hd',
    input: 'Hello! This is a test.',
    voice: 'nova'
  })
})
.then(r => r.blob())
.then(blob => {
  console.log('✅ Got blob:', blob.size, 'bytes');
  const audio = new Audio(URL.createObjectURL(blob));
  return audio.play();
})
.then(() => console.log('✅ Audio playing!'))
.catch(e => console.error('❌ Error:', e));
```

**This will:**
- Call OpenAI TTS directly
- Create audio blob
- Play it
- Show any errors

---

## 📊 WHAT TO REPORT

**Send me:**
1. Result of TEST 1 (API key check)
2. Result of TEST 2 (beep test)
3. Screenshot of TEST 3 (console logs)
4. Result of TEST 4 (manual audio)
5. Result of TEST 5 (direct OpenAI test)

**This will show me exactly what's failing!**

---

## 🎯 MOST LIKELY ISSUES

1. **Browser autoplay blocked** → Click page first
2. **System volume muted** → Turn up volume
3. **Wrong audio output** → Check speakers/headphones
4. **API key invalid** → Verify key is correct
5. **Network blocking OpenAI** → Check firewall

---

**Run these tests and send me the results!** 📊