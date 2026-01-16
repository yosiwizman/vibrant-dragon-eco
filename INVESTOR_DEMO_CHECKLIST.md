# 🎯 Echo AI - Investor Demo Checklist

**Domain:** https://echo-voice.com  
**Date:** January 2025

---

## Pre-Demo Setup (Do 30 minutes before)

### Browser Setup
- [ ] Use **Chrome** or **Edge** (latest version)
- [ ] Clear browser cache: `Ctrl+Shift+Delete` → Clear last hour
- [ ] Close all other tabs to maximize performance
- [ ] Ensure microphone is connected and working
- [ ] Test speakers/headphones are working

### Account Setup
- [ ] Log in to your demo account beforehand
- [ ] Ensure you have some sample data (tasks, notes, reminders)
- [ ] Set up your OpenAI API key in Settings → Integrations

---

## 🔴 CRITICAL TESTS (Must Pass)

### 1. Authentication Flow
| Test | Steps | Expected Result | ✅/❌ |
|------|-------|-----------------|-------|
| Landing Page Loads | Go to https://echo-voice.com | Marketing page displays with "Meet Echo" | |
| Sign In Button | Click "Sign In" or "Get Started" | Redirects to login page | |
| Magic Link Login | Enter email, click "Send Magic Link" | Success toast, email received | |
| Password Login | Enter email/password, click "Sign In" | Redirects to /app dashboard | |
| Logout | Click user menu → Sign Out | Returns to login page | |

### 2. Voice Commands (Core Feature)
| Test | Voice Command | Expected Result | ✅/❌ |
|------|---------------|-----------------|-------|
| Mic Button Works | Click the microphone button | Listening indicator appears | |
| Create Task | "Create a task to review investor deck" | Task created, confirmation spoken | |
| Create Reminder | "Remind me to call John in 30 minutes" | Reminder set, confirmation | |
| Create Note | "Take a note: Meeting went well" | Note saved | |
| Ask Time | "What time is it?" | Current time spoken | |
| Stop Listening | "Stop" or click mic again | Stops listening | |

### 3. Dashboard Widgets
| Test | Steps | Expected Result | ✅/❌ |
|------|-------|-----------------|-------|
| Dashboard Loads | Navigate to /app | All widgets display | |
| Clock Widget | View clock | Shows current time | |
| Tasks Widget | View tasks | Shows task list | |
| Quick Actions | Click a quick action | Action executes | |
| Widget Drag | Drag a widget | Widget moves smoothly | |

### 4. Data Persistence
| Test | Steps | Expected Result | ✅/❌ |
|------|-------|-----------------|-------|
| Create Task | Create a task via voice or UI | Task appears in list | |
| Refresh Page | Press F5 | Task still exists | |
| View in Tasks Page | Go to /app/tasks | Task visible | |

---

## 🟡 IMPORTANT TESTS (Should Pass)

### 5. Navigation
| Test | Steps | Expected Result | ✅/❌ |
|------|-------|-----------------|-------|
| Sidebar Navigation | Click each menu item | Page loads correctly | |
| Tasks Page | Click Tasks | /app/tasks loads | |
| Notes Page | Click Notes | /app/notes loads | |
| Calendar Page | Click Calendar | /app/calendar loads | |
| Settings Page | Click Settings | /app/settings loads | |
| Back Button | Use browser back | Previous page loads | |

### 6. Voice Response (TTS)
| Test | Steps | Expected Result | ✅/❌ |
|------|-------|-----------------|-------|
| Voice Enabled | Settings → Voice → Enable TTS | Toggle turns on | |
| Echo Speaks | Ask "What's on my schedule?" | Audio response plays | |
| Voice Selection | Change voice in settings | New voice used | |

### 7. Offline Indicator
| Test | Steps | Expected Result | ✅/❌ |
|------|-------|-----------------|-------|
| Online Status | Check bottom of screen | Shows online/connected | |
| Offline Mode | Disconnect internet briefly | Shows offline indicator | |

---

## 🟢 NICE-TO-HAVE TESTS

### 8. Second Brain Features
| Test | Voice Command | Expected Result | ✅/❌ |
|------|---------------|-----------------|-------|
| Remember Info | "Remember that my favorite color is blue" | Stored in knowledge | |
| Recall Info | "What's my favorite color?" | "Your favorite color is blue" | |

### 9. Advanced Voice Commands
| Test | Voice Command | Expected Result | ✅/❌ |
|------|---------------|-----------------|-------|
| Multiple Tasks | "Create 3 tasks for the project" | Multiple tasks created | |
| Reschedule | "Move my 3pm meeting to 4pm" | Event updated | |
| Search | "Find all tasks about investors" | Search results shown | |

### 10. Mobile Responsiveness
| Test | Steps | Expected Result | ✅/❌ |
|------|-------|-----------------|-------|
| Mobile View | Resize browser to mobile width | UI adapts properly | |
| Touch Mic | Tap microphone button | Voice input works | |

---

## 🚨 Known Issues to Avoid During Demo

1. **Location Widget**: May show CORS warning in console (cosmetic only, doesn't affect functionality)
2. **First Voice Command**: May take 1-2 seconds to initialize on first use
3. **OpenAI API**: Requires valid API key for voice features

---

## 💡 Demo Script Suggestions

### Opening (30 seconds)
> "Echo is your personal AI assistant that listens, understands, and helps you stay organized—all with natural voice commands."

### Voice Demo (2 minutes)
1. Click mic: "Hey Echo, what's on my schedule today?"
2. "Create a task to follow up with investors by Friday"
3. "Remind me to send the pitch deck in 2 hours"
4. "Take a note: Investor meeting went great, they loved the voice features"

### Dashboard Demo (1 minute)
- Show widgets updating in real-time
- Demonstrate drag-and-drop customization
- Show quick actions

### Closing (30 seconds)
> "Echo works 95% offline, respects your privacy, and learns from your conversations to become your true second brain."

---

## Emergency Fixes

### If Voice Doesn't Work:
1. Check microphone permissions in browser
2. Refresh the page
3. Check Settings → Integrations → OpenAI API key

### If Page Won't Load:
1. Clear cache: `Ctrl+Shift+Delete`
2. Try incognito mode
3. Try Edge browser instead of Chrome

### If Login Fails:
1. Use Magic Link instead of password
2. Check email spam folder
3. Try password reset

---

## Post-Demo Checklist

- [ ] Note any issues encountered
- [ ] Collect investor feedback
- [ ] Report bugs to development team

---

**Good luck with your demo! 🚀**