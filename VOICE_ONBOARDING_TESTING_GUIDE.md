# 🧪 VOICE ONBOARDING - TESTING GUIDE

**Quick Testing Checklist for Voice-Guided Welcome Flow**

---

## 🎯 TEST SCENARIOS

### **Scenario 1: First-Time User (Local AI Path)**

**Steps:**
1. Clear localStorage: `localStorage.clear()`
2. Log out and log back in
3. Welcome modal should appear
4. Click "Local AI Experience"
5. Verify voice says: "Great choice! Downloading..."
6. Watch progress bar (0-100%)
7. Verify voice says: "Perfect! Let me give you a tour."
8. Tour should start automatically
9. Listen to all 7 tour steps
10. Verify weather widget is added during tour
11. Tour completes → Dashboard

**Expected Results:**
- ✅ Modal appears on first login only
- ✅ Download progress shows correctly
- ✅ Voice is soft, natural, friendly
- ✅ Tour steps execute in order
- ✅ Weather widget appears
- ✅ Dashboard loads after tour

---

### **Scenario 2: First-Time User (Skip Path)**

**Steps:**
1. Clear localStorage: `localStorage.clear()`
2. Log out and log back in
3. Welcome modal should appear
4. Click "Skip for Now"
5. Verify voice says: "No problem! You can download..."
6. Should navigate to dashboard after 2 seconds

**Expected Results:**
- ✅ Modal appears
- ✅ Skip voice message plays
- ✅ Navigates to dashboard
- ✅ Flag set: `echo:seen-welcome = true`

---

### **Scenario 3: Returning User**

**Steps:**
1. Log in (with `echo:seen-welcome` already set)
2. Should go straight to dashboard
3. No welcome modal

**Expected Results:**
- ✅ No modal shown
- ✅ Direct to dashboard
- ✅ Fast login experience

---

### **Scenario 4: Model Removal**

**Steps:**
1. Go to Settings → General → Offline AI
2. Scroll to "Remove Local AI Model" button
3. Click button
4. Confirm dialog
5. Verify model is removed
6. Check storage freed up

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Model removed successfully
- ✅ Storage freed (1.5-3GB)
- ✅ Can re-download if needed

---

### **Scenario 5: Download Interruption**

**Steps:**
1. Start local AI download
2. Close browser mid-download
3. Reopen and log in
4. Try downloading again

**Expected Results:**
- ✅ Download restarts cleanly
- ✅ No corrupted cache
- ✅ Progress starts from 0%

---

## 🔍 WHAT TO CHECK

### **Visual:**
- [ ] Modal is centered and beautiful
- [ ] Progress bar animates smoothly
- [ ] Tour bubble appears bottom-right
- [ ] UI elements highlight correctly
- [ ] Colors match brand (fuchsia/purple)

### **Audio:**
- [ ] Voice is soft and natural
- [ ] Speech rate is comfortable
- [ ] No robotic sound
- [ ] Volume is appropriate
- [ ] No audio glitches

### **Functionality:**
- [ ] Download completes successfully
- [ ] Tour executes all steps
- [ ] Weather widget is added
- [ ] Navigation works
- [ ] Model removal works
- [ ] Re-download works

### **Edge Cases:**
- [ ] Works on slow internet
- [ ] Works on mobile devices
- [ ] Works in different browsers
- [ ] Handles download failures gracefully
- [ ] Handles voice playback errors

---

## 🐛 COMMON ISSUES & FIXES

### **Issue: Voice doesn't play**
**Fix:** Check browser permissions for audio autoplay

### **Issue: Download fails**
**Fix:** Check WebGPU support: `'gpu' in navigator`

### **Issue: Progress stuck at 0%**
**Fix:** Check network connection, try again

### **Issue: Tour doesn't start**
**Fix:** Check console for errors, verify offlineVoice service

### **Issue: Modal shows every login**
**Fix:** Check localStorage flag: `echo:seen-welcome`

---

## 📱 BROWSER-SPECIFIC TESTS

### **Chrome (Desktop):**
- [ ] Download works
- [ ] Voice plays
- [ ] Tour completes
- [ ] Model removal works

### **Safari (iOS):**
- [ ] Download works (1.5GB model)
- [ ] Voice plays
- [ ] Tour completes
- [ ] Works in PWA mode

### **Chrome (Android):**
- [ ] Download works (1.5GB model)
- [ ] Voice plays
- [ ] Tour completes
- [ ] Performance acceptable

---

## ✅ ACCEPTANCE CRITERIA

**Must Pass:**
- ✅ Modal appears on first login
- ✅ Download completes without errors
- ✅ Voice is clear and natural
- ✅ Tour demonstrates all features
- ✅ Model can be removed
- ✅ Works on mobile and desktop

**Nice to Have:**
- ✅ Download resumes after interruption
- ✅ Voice adapts to user's language
- ✅ Tour can be skipped mid-way
- ✅ Progress persists across refreshes

---

## 🎯 QUICK TEST COMMANDS

### **Reset Onboarding:**
```javascript
localStorage.removeItem('echo:seen-welcome');
// Log out and log back in
```

### **Check Model Status:**
```javascript
await webLLM.isModelCached();
// Returns: true/false
```

### **Clear Model:**
```javascript
await webLLM.clearCache();
// Frees storage
```

### **Test Voice:**
```javascript
await offlineVoice.speak("Hello! Testing voice.", {
  voice: "Google UK English Female",
  rate: 0.9,
  pitch: 1.1
});
```

---

## 📊 TESTING RESULTS TEMPLATE

```
Date: ___________
Tester: ___________
Browser: ___________
Device: ___________

Scenario 1 (Local AI): [ ] Pass [ ] Fail
Scenario 2 (Skip): [ ] Pass [ ] Fail
Scenario 3 (Returning): [ ] Pass [ ] Fail
Scenario 4 (Removal): [ ] Pass [ ] Fail
Scenario 5 (Interruption): [ ] Pass [ ] Fail

Voice Quality: [ ] Excellent [ ] Good [ ] Poor
Download Speed: [ ] Fast [ ] Medium [ ] Slow
Tour Experience: [ ] Excellent [ ] Good [ ] Poor

Issues Found:
_________________________________
_________________________________

Notes:
_________________________________
_________________________________
```

---

**Happy Testing!** 🎉