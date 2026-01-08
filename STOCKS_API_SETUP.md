# 📈 STOCKS API SETUP GUIDE
**Get Real-Time Stock Data**

---

## 🎯 QUICK SETUP (5 minutes)

### **Step 1: Get Free API Key**

1. Visit: https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Click "GET FREE API KEY"
4. Copy the API key (looks like: `ABC123XYZ456`)

---

### **Step 2: Add API Key to Code**

Open `src/components/widgets/content/StocksWidget.tsx`

Find this line:
```typescript
const API_KEY = 'demo'; // Replace with your API key
```

Replace with your key:
```typescript
const API_KEY = 'YOUR_API_KEY_HERE';
```

---

### **Step 3: Update Fetch Logic**

The widget is already configured to use Alpha Vantage API. Once you add your key, it will automatically fetch real data.

**Current (Mock Data):**
```typescript
// Mock data for demo
const stockData = defaultSymbols.map((symbol) => ({
  symbol,
  name: symbol,
  price: Math.random() * 500 + 100,
  // ...
}));
```

**With Real API (Automatic):**
```typescript
const response = await fetch(
  `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
);
```

---

## 📊 API LIMITS (Free Tier)

- **5 API calls per minute**
- **500 API calls per day**
- **No credit card required**

**Our Implementation:**
- Fetches 5 stocks = 5 API calls
- Auto-refreshes every 60 seconds
- Well within free tier limits!

---

## 🎨 CUSTOMIZATION

### **Change Stock Symbols:**

In `StocksWidget.tsx`, modify:
```typescript
const defaultSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
```

**Popular Symbols:**
- **Tech:** AAPL, GOOGL, MSFT, META, NVDA
- **Finance:** JPM, BAC, GS, V, MA
- **Retail:** AMZN, WMT, TGT, COST
- **Auto:** TSLA, F, GM, TM
- **Crypto:** COIN, MSTR

---

## 🔧 ADVANCED: Environment Variable

For production, store API key securely:

1. Create `.env.local`:
```env
VITE_ALPHA_VANTAGE_KEY=your_api_key_here
```

2. Update code:
```typescript
const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY || 'demo';
```

3. Add to `.gitignore`:
```
.env.local
```

---

## 🚨 TROUBLESHOOTING

### **Issue: "Invalid API call"**
- **Cause:** Invalid API key
- **Fix:** Double-check your API key

### **Issue: "Rate limit exceeded"**
- **Cause:** Too many requests
- **Fix:** Increase refresh interval or upgrade to paid tier

### **Issue: "No data returned"**
- **Cause:** Invalid stock symbol
- **Fix:** Use valid symbols (check NYSE/NASDAQ)

---

## 🎯 ALTERNATIVE APIs

If you prefer different data sources:

### **1. Finnhub (Free Tier)**
- 60 API calls/minute
- Real-time data
- https://finnhub.io

### **2. IEX Cloud (Free Tier)**
- 50,000 messages/month
- High-quality data
- https://iexcloud.io

### **3. Yahoo Finance (Unofficial)**
- No API key needed
- Use `yahoo-finance2` npm package
- May be less reliable

---

## ✅ VERIFICATION

After setup, verify it works:

1. Add Stocks widget to dashboard
2. Wait 10 seconds
3. Check if prices look realistic
4. Check browser console for errors
5. Verify auto-refresh works

**If you see realistic prices changing, you're all set!** 🎉

---

## 📝 NOTES

- Free tier is perfect for personal use
- Paid tiers available for high-frequency trading apps
- Data is delayed by 15 minutes (real-time requires paid tier)
- Our implementation caches data to minimize API calls

---

**Ready to get real stock data!** 📈