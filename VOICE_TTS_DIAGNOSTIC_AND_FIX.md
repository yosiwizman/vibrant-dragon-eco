# 🔍 VOICE TTS DIAGNOSTIC & FIX

**Issue:** Can't hear OpenAI TTS voices when clicking "Test Voice"

---

## 🎯 DIAGNOSTIC CHECKLIST

### **1. API Key Check** ✅
From your screenshot, I can see:
- "No AI" indicator in top right
- This means: **No OpenAI API key detected**

### **2. Root Cause:**
The `useOpenAIKey` hook is checking:
1. `preferences.openaiApiKey` (localStorage)
2. `api_providers` table (Supabase)

**Problem:** You're connected to a NEW Supabase project, so the `api_providers` table is empty!

---

## ✅ SOLUTION

### **Option 1: Add API Key in General Tab** (30 seconds)

1. Go to Settings → **General** tab
2. Find "OpenAI API Key" section
3. Paste your API key: `sk-proj-...`
4. Go back to Voice tab
5. Click "Test Voice"
6. Should work! ✅

### **Option 2: Add API Key in Providers Tab** (1 minute)

1. Go to Settings → **API Providers** tab
2. Find "OpenAI" provider
3. Enter your API key
4. Toggle "Enable"
5. Save
6. Go to Voice tab
7. Click "Test Voice"
8. Should work! ✅

---

## 🔧 WHY THIS HAPPENED

**Old Project:**
- Had API key in `api_providers` table ✅
- Test Voice worked ✅

**New Project:**
- Fresh database (no data) ❌
- API key not migrated ❌
- Test Voice can't find key ❌

**Fix:**
- Add API key again (one-time) ✅
- Test Voice will work ✅

---

## 🧪 TEST AFTER FIXING

1. Add API key (General or Providers tab)
2. Go to Voice tab
3. Click "Test Voice"
4. Should hear: "Hello! I'm Echo, your personal AI assistant..."
5. Button should be **purple** (not gray)

---

## 📊 EXPECTED BEHAVIOR

**With API Key:**
- Button: Purple ✅
- Click: Plays voice ✅
- Sound: Clear audio ✅
- Toast: "Playing [voice] voice..." ✅

**Without API Key:**
- Button: Gray ⚠️
- Click: Shows error ⚠️
- Toast: "Please enter API key" ⚠️

---

## 🎯 QUICK FIX NOW

**Do this:**
1. Settings → General
2. Scroll to "OpenAI API Key"
3. Paste: `sk-proj-...` (your key)
4. Go to Voice tab
5. Click "Test Voice"
6. Listen! 🔊

---

**That's it! Simple fix.** 🚀