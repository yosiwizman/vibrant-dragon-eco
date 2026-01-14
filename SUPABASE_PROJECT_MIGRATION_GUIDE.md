# 🔄 SUPABASE PROJECT MIGRATION GUIDE

**Echo AI - New Project Setup**

---

## 🎯 RECOMMENDED: CREATE NEW PROJECT

**Why?**
- ✅ Clean separation from other apps
- ✅ No data conflicts
- ✅ Better organization
- ✅ Easier to manage
- ✅ Professional setup

---

## 📋 STEP-BY-STEP MIGRATION

### **Step 1: Create New Supabase Project** (5 min)

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name:** Echo AI Assistant
   - **Database Password:** (generate strong password - SAVE THIS!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free (can upgrade later)
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

---

### **Step 2: Enable Email Authentication** (1 min)

1. In your new project, go to **Authentication** → **Providers**
2. Find **Email** provider
3. Toggle it **ON**
4. **IMPORTANT:** Disable email confirmations for testing:
   - Scroll down to **"Email Auth"**
   - Uncheck **"Enable email confirmations"**
   - Click **Save**

---

### **Step 3: Run Database Migration** (2 min)

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the ENTIRE contents of `supabase/migrations/COMPLETE_ECHO_SCHEMA.sql`
4. Paste into SQL Editor
5. Click **"Run"**
6. Verify: Should see "Success. No rows returned"

---

### **Step 4: Get New Project Credentials** (1 min)

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL:** `https://YOUR_PROJECT_ID.supabase.co`
   - **anon/public key:** `eyJ...` (long string)

---

### **Step 5: Update Your App** (2 min)

Update `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://YOUR_NEW_PROJECT_ID.supabase.co';
const supabaseAnonKey = 'YOUR_NEW_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

### **Step 6: Test Everything** (5 min)

1. **Clear browser data:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Refresh page**

3. **Sign up with new account:**
   - Use magic link or password
   - Should work now!

4. **Test features:**
   - Create a task
   - Add a widget
   - Test voice command

---

## ✅ VERIFICATION CHECKLIST

After migration, verify:

- [ ] Can sign up with email
- [ ] Can log in
- [ ] Profile created automatically
- [ ] Can create tasks
- [ ] Can add widgets
- [ ] Widgets persist after logout
- [ ] Voice commands work
- [ ] Test Voice button works

---

## 🚨 TROUBLESHOOTING

### **Issue: "Email logins are disabled"**
**Fix:** Enable Email provider in Authentication → Providers

### **Issue: "Email confirmation required"**
**Fix:** Disable email confirmations in Auth settings

### **Issue: "Table does not exist"**
**Fix:** Re-run the COMPLETE_ECHO_SCHEMA.sql migration

### **Issue: "RLS policy violation"**
**Fix:** Check that RLS policies were created (they're in the migration)

---

## 💡 ALTERNATIVE: QUICK FIX (NOT RECOMMENDED)

**If you want to keep current project:**

1. Go to Authentication → Providers
2. Enable **Email** provider
3. Disable email confirmations
4. Test login

**Cons:**
- ⚠️ Still sharing database with other app
- ⚠️ Risk of data conflicts
- ⚠️ Harder to manage
- ⚠️ Not professional setup

---

## 🎯 CTO RECOMMENDATION

**CREATE NEW PROJECT** ✅

**Reasons:**
1. Clean, professional setup
2. No conflicts ever
3. Easy to scale
4. Better organization
5. Only takes 15 minutes total

**This is the RIGHT way to do it.**

---

## 📞 NEED HELP?

If you encounter any issues:
1. Check Supabase logs (Database → Logs)
2. Check browser console
3. Verify migration ran successfully
4. Test with fresh browser/incognito

---

**Ready to migrate?** Let's do this! 🚀