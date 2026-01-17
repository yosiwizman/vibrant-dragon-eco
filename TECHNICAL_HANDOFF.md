# 🔧 TECHNICAL HANDOFF DOCUMENT
**Echo AI Assistant - Developer & Operations Guide**

---

## 📋 SYSTEM OVERVIEW

**Architecture:** React + TypeScript + Supabase + WebLLM  
**Deployment:** Web (Vercel) + Mobile (iOS/Android via Capacitor)  
**Database:** Supabase (PostgreSQL with RLS)  
**AI:** OpenAI GPT-4o (online) + WebLLM LLaMA 3.2 (offline) + optional server-side OpenAI proxy for Demo Mode

---

## 🗂️ PROJECT STRUCTURE

```
echo-ai/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── widgets/        # Widget system
│   │   │   ├── grid/       # Grid layout
│   │   │   └── content/    # Widget content
│   │   └── *.tsx           # Other components
│   ├── pages/              # Route pages
│   ├── services/           # Business logic
│   │   ├── web-llm.ts      # Offline AI
│   │   ├── offline-*.ts    # Offline services
│   │   ├── orchestrator.ts # Tool execution
│   │   └── *.ts            # Other services
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── state/              # State management
│   ├── types/              # TypeScript types
│   └── utils/              # Utilities
├── public/                 # Static assets
│   └── service-worker.js   # Offline caching
├── supabase/              # Database migrations
├── ios/                   # iOS app (Capacitor)
├── android/               # Android app (Capacitor)
└── docs/                  # Documentation (12 files)
```

---

## 🔑 KEY TECHNOLOGIES

### **Frontend:**
- React 18.3.1
- TypeScript 5.5.3
- Vite 6.3.4
- TailwindCSS 3.4.11
- shadcn/ui components

### **Backend:**
- Supabase (Auth + Database)
- PostgreSQL with RLS
- Edge Functions (optional)

### **AI/ML:**
- OpenAI GPT-4o (online)
- WebLLM LLaMA 3.2 (offline)
- Whisper API (online STT)
- Web Speech API (offline STT/TTS)

### **Storage:**
- IndexedDB (offline data)
- LocalStorage (preferences)
- Supabase (cloud sync)

---

## 🚀 DEPLOYMENT

### **Web Deployment (Vercel):**

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy
vercel --prod

# Environment variables needed:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional (required for Demo Mode server proxy):
OPENAI_API_KEY=your-openai-key
```

### **iOS Deployment:**

```bash
# Build web assets
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios

# Build and archive for App Store
```

### **Android Deployment:**

```bash
# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Build signed APK/AAB
```

---

## 🔧 CONFIGURATION

### Vercel Routing (SPA + API exclusion)

- SPA fallback keeps client-side routing working.
- API routes under `/api/*` must NOT be rewritten to the SPA.
- vercel.json rewrites:

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

Order notes:
- Vercel matches API routes first; the negative lookahead ensures `/api/*` never hits the SPA rewrite.
- All other paths fall through to `/index.html`.

## 🔧 CONFIGURATION

### **Environment Variables:**

```env
# Required (client + server)
VITE_SUPABASE_URL=https://pkwiahckdwxzdpusnsui.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional (Demo Mode server proxy)
# If set, authenticated users can enable Demo Mode (no client key required).
# Server-side only. Do NOT prefix with VITE_.
OPENAI_API_KEY=your-openai-key

# Optional (user-provided)
# Users can still add their own OpenAI API key in Settings for Online Mode.
```

### **Supabase Configuration:**

**Tables (12 total):**
- profiles
- tasks
- reminders
- notes
- calendar_events
- contacts
- messages (email_logs, sms_logs)
- notifications
- knowledge
- rag_documents
- action_history
- api_providers

**All tables have RLS enabled ✅**

---

## 📦 DEPENDENCIES

### **Core:**
- react, react-dom
- react-router-dom
- @supabase/supabase-js
- @tanstack/react-query

### **UI:**
- @radix-ui/* (components)
- tailwindcss
- lucide-react (icons)

### **AI/ML:**
- @mlc-ai/web-llm
- idb (IndexedDB wrapper)

### **Mobile:**
- @capacitor/core
- @capacitor/ios
- @capacitor/android

**Total: 50+ packages**  
**Bundle Size: ~2.0MB (optimized)**

---

## 🔒 SECURITY

### **Database Security:**
- Row Level Security (RLS) on all tables
- User-specific data isolation
- Secure authentication
- API key encryption

### **API Security:**
- Rate limiting (4 limiters)
- Cost controls
- User-provided keys are stored client-side only (browser localStorage)
- Demo Mode uses server-side `OPENAI_API_KEY` via `/api/ai/*` with Supabase JWT validation and never returns the key to the client

### **Privacy:**
- Private mode available
- Offline processing option
- Data export/delete
- No tracking (optional)

---

## 📊 MONITORING

### **Analytics:**
- Page views
- Widget interactions
- Voice commands
- Error tracking
- User behavior

**Storage:** LocalStorage (1000 events max)  
**Export:** JSON format  
**Integration:** Ready for PostHog/Mixpanel

### **Error Tracking:**
- Error boundaries (global + widget)
- Error logging (last 10 errors)
- Analytics integration
- Ready for Sentry

### **Performance:**
- Lighthouse monitoring
- Core Web Vitals
- Bundle size tracking
- Load time monitoring

---

## 🐛 TROUBLESHOOTING

### **Common Issues:**

**1. Service Worker Error (Development)**
- **Cause:** Service worker only works in production
- **Fix:** Normal behavior, ignore in dev

**2. WebLLM Not Loading**
- **Cause:** Browser doesn't support WebGPU
- **Fix:** Falls back to online mode automatically

**3. Voice Not Working Offline**
- **Cause:** Model not downloaded
- **Fix:** Download model in Settings

**4. Sync Queue Growing**
- **Cause:** Offline for extended period
- **Fix:** Connect to internet, auto-syncs

---

## 🔄 MAINTENANCE

### **Regular Tasks:**

**Daily:**
- Monitor error logs
- Check uptime
- Review analytics

**Weekly:**
- Review user feedback
- Update dependencies
- Performance check

**Monthly:**
- Security audit
- Database optimization
- Feature planning

---

## 📚 DOCUMENTATION

### **For Developers:**
1. TECHNICAL_HANDOFF.md (this file)
2. PRODUCTION_READINESS_AUDIT.md
3. IMPLEMENTATION_STATUS.md
4. Code comments (inline)

### **For Operations:**
1. PRODUCTION_READINESS_AUDIT.md
2. Deployment guides (in docs)
3. Monitoring setup

### **For Users:**
1. USER_BENEFITS.md
2. In-app onboarding
3. Help documentation

---

## 🎯 CRITICAL PATHS

### **Voice Command Flow:**

```
User speaks
    ↓
Online: Whisper API → GPT-4o → OpenAI TTS
Offline: Web Speech API → WebLLM → Web Speech API
    ↓
Tool execution (orchestrator)
    ↓
Database update (Supabase or IndexedDB)
    ↓
UI update (React state)
    ↓
Response to user
```

### **Widget System Flow:**

```
User edits widget
    ↓
Drag/Resize event
    ↓
Collision detection
    ↓
Layout calculation
    ↓
State update (debounced 100ms)
    ↓
Save to preferences
    ↓
Persist to localStorage
```

### **Offline Sync Flow:**

```
User performs action offline
    ↓
Save to IndexedDB
    ↓
Add to sync queue
    ↓
Connection restored
    ↓
Auto-sync to Supabase
    ↓
Clear from queue
```

---

## 🔐 ACCESS & CREDENTIALS

### **Supabase:**
- Project ID: pkwiahckdwxzdpusnsui
- URL: https://pkwiahckdwxzdpusnsui.supabase.co
- Anon Key: (in environment variables)
- Service Role Key: (secure storage)

### **Deployment:**
- Vercel: (configure)
- Domain: (configure)
- SSL: Auto (Vercel)

---

## 📞 SUPPORT

### **Technical Issues:**
- Check error logs (localStorage)
- Review analytics dashboard
- Check browser console
- Verify environment variables

### **User Issues:**
- Check onboarding completion
- Verify permissions (mic, location)
- Check offline model download
- Review sync queue status

---

## 🎉 HANDOFF CHECKLIST

### **Code:**
- ✅ All features implemented
- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ✅ Production build tested
- ✅ Mobile builds tested

### **Infrastructure:**
- ✅ Supabase configured
- ✅ RLS policies active
- ✅ Environment variables set
- ✅ Monitoring ready
- ✅ Backups configured

### **Documentation:**
- ✅ Technical docs complete
- ✅ User docs complete
- ✅ Deployment guides ready
- ✅ Troubleshooting guide ready

### **Testing:**
- ✅ Manual testing complete
- ✅ Cross-browser tested
- ✅ Mobile tested
- ✅ Offline mode tested
- ✅ Error scenarios tested

---

## 🚀 READY TO LAUNCH

**The Echo AI Assistant is fully documented, tested, and ready for production deployment.**

**All systems: GO ✅**

---

**Prepared by:** CTO  
**Date:** January 7, 2026  
**Status:** HANDOFF COMPLETE

---

🎯 **READY FOR OPERATIONS TEAM**