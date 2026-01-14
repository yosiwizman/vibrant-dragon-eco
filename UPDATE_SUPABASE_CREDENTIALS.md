# 🔧 UPDATE SUPABASE CREDENTIALS

**Quick Guide to Connect Echo to New Project**

---

## 📋 GET YOUR NEW CREDENTIALS

1. In Supabase Dashboard, go to **Project Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy these two values:

```
Project URL: https://YOUR_PROJECT_ID.supabase.co
anon/public key: eyJ... (very long string)
```

---

## 🔄 UPDATE YOUR APP

**Option 1: Tell me your credentials**
Send me:
- Project URL
- Anon key

I'll update the file for you.

**Option 2: Update manually**

Edit `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

// Replace these with your NEW project values
const supabaseUrl = 'https://YOUR_NEW_PROJECT_ID.supabase.co';
const supabaseAnonKey = 'YOUR_NEW_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## ✅ VERIFY IT WORKS

After updating:

1. **Clear browser data:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Refresh page**

3. **Try to sign up** - Should work now!

---

**Send me your new credentials and I'll update the file!** 🚀