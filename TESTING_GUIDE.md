# 🧪 TESTING GUIDE
**Echo AI - New Features Testing**

---

## 🎯 FEATURES TO TEST

1. ✅ Widget Persistence
2. ✅ Stocks Widget
3. ✅ News Widget
4. ✅ Forgot Password

---

## 📋 TEST PLAN

### **1. Widget Persistence Testing**

**Test Case 1.1: Save and Load**
1. Login to the app
2. Add a widget (e.g., Stocks)
3. Move it to a different position
4. Resize it
5. Logout
6. Login again
7. ✅ **Expected:** Widget should be in the same position and size

**Test Case 1.2: Multiple Widgets**
1. Add 3-4 different widgets
2. Arrange them in a custom layout
3. Logout and login
4. ✅ **Expected:** All widgets in correct positions

**Test Case 1.3: Cross-Device Sync**
1. Login on Device A
2. Add/arrange widgets
3. Login on Device B (different browser/device)
4. ✅ **Expected:** Same widget layout appears

**Test Case 1.4: Widget Removal**
1. Remove a widget
2. Logout and login
3. ✅ **Expected:** Widget stays removed

---

### **2. Stocks Widget Testing**

**Test Case 2.1: Display**
1. Add Stocks widget to dashboard
2. ✅ **Expected:** Shows 5 stocks (AAPL, GOOGL, MSFT, AMZN, TSLA)
3. ✅ **Expected:** Each shows price, change, and percentage
4. ✅ **Expected:** Green for positive, red for negative

**Test Case 2.2: Auto-Refresh**
1. Watch the stocks widget for 1 minute
2. ✅ **Expected:** Prices update automatically
3. ✅ **Expected:** No page reload needed

**Test Case 2.3: Manual Refresh**
1. Click the refresh button
2. ✅ **Expected:** Prices update immediately
3. ✅ **Expected:** Loading spinner shows briefly

**Test Case 2.4: Error Handling**
1. Disconnect internet
2. Wait for auto-refresh
3. ✅ **Expected:** Shows error message
4. ✅ **Expected:** Retry button appears
5. Reconnect internet and click retry
6. ✅ **Expected:** Data loads successfully

---

### **3. News Widget Testing**

**Test Case 3.1: Default Source**
1. Add News widget
2. ✅ **Expected:** Shows Google News by default
3. ✅ **Expected:** Can scroll and interact with news

**Test Case 3.2: Change Source**
1. Click "Change Source" button
2. Click "BBC" badge
3. ✅ **Expected:** BBC News loads
4. ✅ **Expected:** Can interact with BBC site

**Test Case 3.3: Custom URL**
1. Click "Change Source"
2. Enter custom URL (e.g., https://www.reddit.com)
3. Click "Load"
4. ✅ **Expected:** Custom site loads
5. ✅ **Expected:** Can interact with site

**Test Case 3.4: Refresh**
1. Click refresh button
2. ✅ **Expected:** Page reloads
3. ✅ **Expected:** Maintains current source

**Test Case 3.5: Blocked Sites**
1. Try loading a site that blocks iframes (e.g., some banking sites)
2. ✅ **Expected:** Shows helpful error message
3. ✅ **Expected:** Suggests trying different sources

---

### **4. Forgot Password Testing**

**Test Case 4.1: Access**
1. Go to login page
2. ✅ **Expected:** "Forgot your password?" link visible
3. Click the link
4. ✅ **Expected:** Forgot password page appears

**Test Case 4.2: Send Reset Email**
1. Enter valid email address
2. Click "Send Reset Link"
3. ✅ **Expected:** Success message appears
4. ✅ **Expected:** Check email inbox
5. ✅ **Expected:** Reset email received

**Test Case 4.3: Invalid Email**
1. Enter invalid email (e.g., "notanemail")
2. Click "Send Reset Link"
3. ✅ **Expected:** Validation error shows

**Test Case 4.4: Empty Email**
1. Leave email field empty
2. Click "Send Reset Link"
3. ✅ **Expected:** Error message: "Please enter your email address"

**Test Case 4.5: Back Navigation**
1. Click "Back to Login"
2. ✅ **Expected:** Returns to login page
3. ✅ **Expected:** Email field cleared

**Test Case 4.6: Reset Link**
1. Click reset link from email
2. ✅ **Expected:** Redirects to app
3. ✅ **Expected:** Can set new password
4. ✅ **Expected:** Can login with new password

---

## 🐛 KNOWN ISSUES & LIMITATIONS

### **Stocks Widget:**
- Uses mock data by default
- Requires Alpha Vantage API key for real data
- Free tier: 5 API calls per minute, 500 per day
- **Solution:** Get free API key and replace 'demo' in code

### **News Widget:**
- Some sites block iframe embedding (X-Frame-Options)
- Sites with strict CSP may not load
- **Solution:** Try different news sources

### **Widget Persistence:**
- Requires user to be logged in
- First-time users get default layout
- **Solution:** Working as designed

---

## ✅ ACCEPTANCE CRITERIA

### **Widget Persistence:**
- ✅ Widgets save to database
- ✅ Widgets load on login
- ✅ Layout persists across sessions
- ✅ Works across devices

### **Stocks Widget:**
- ✅ Shows 5 stocks
- ✅ Displays price, change, percentage
- ✅ Color-coded (green/red)
- ✅ Auto-refreshes every minute
- ✅ Manual refresh works
- ✅ Error handling works

### **News Widget:**
- ✅ Loads default source (Google News)
- ✅ Can change source
- ✅ Popular sources work
- ✅ Custom URLs work
- ✅ Fully interactive
- ✅ Refresh works

### **Forgot Password:**
- ✅ Link visible on login
- ✅ Email validation works
- ✅ Reset email sends
- ✅ Success confirmation shows
- ✅ Back navigation works
- ✅ Reset link works

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

1. **Database Migration:**
   ```bash
   supabase db push
   ```

2. **Environment Variables:**
   - No new variables needed
   - Stocks API key is optional

3. **Testing:**
   - ✅ Test all 4 features
   - ✅ Test on multiple browsers
   - ✅ Test on mobile
   - ✅ Test login/logout flow

4. **Documentation:**
   - ✅ Update user guide
   - ✅ Add API key instructions
   - ✅ Document iframe limitations

---

## 📊 TEST RESULTS TEMPLATE

```
Feature: Widget Persistence
- Save widgets: ✅ PASS
- Load widgets: ✅ PASS
- Cross-device: ✅ PASS
- Remove widgets: ✅ PASS

Feature: Stocks Widget
- Display: ✅ PASS
- Auto-refresh: ✅ PASS
- Manual refresh: ✅ PASS
- Error handling: ✅ PASS

Feature: News Widget
- Default source: ✅ PASS
- Change source: ✅ PASS
- Custom URL: ✅ PASS
- Interaction: ✅ PASS

Feature: Forgot Password
- Access: ✅ PASS
- Send email: ✅ PASS
- Validation: ✅ PASS
- Reset flow: ✅ PASS
```

---

## 🎉 READY FOR TESTING!

All features are implemented and ready for comprehensive testing.

**Next Steps:**
1. Run the app: `npm run dev`
2. Test each feature systematically
3. Report any issues
4. Deploy when all tests pass

**Happy Testing!** 🚀