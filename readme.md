# Good Margin — Smart Pricing Platform for New Merchants
> منصة التسعير الذكي للتجار المبتدئين

---

## 💡 The Idea

Most new merchants in Saudi Arabia start selling without real data. They price products by gut feeling, often too low (losing profit) or too high (losing customers). There was no simple Arabic tool that could watch the market and say: *"here's what competitors are charging — here's your safe price."*

**Good Margin** solves this. It scans live Google Shopping results for any product, applies a weighted-average algorithm (biased toward popular, highly-reviewed listings), and returns a smart suggested price that protects the merchant's margin.

---

## 🎯 The Solution

A two-part web application:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML, CSS, Vanilla JS | 5-page Arabic RTL interface |
| **Backend** | Node.js + Express | SerpAPI integration, price algorithm |

The merchant enters a product name and their cost price. The backend fetches live competitor prices from Google Shopping (Saudi Arabia), runs the smart pricing algorithm, and returns the suggested price with full market analysis. All in under 30 seconds.

---

## ✨ Features

### 1. 📊 Analytics Dashboard (`index.html`)
Real-time store performance overview (powered by mock data, ready for Salla/Zid API):

- **6 KPI cards** with animated count-up numbers:
  - Total Sales & Net Profit
  - Average Cart Size
  - Total Sessions
  - Customer Rating
  - Cart Abandonment Rate (flagged in red when rising)
- **Sales trend line chart** — daily sales vs. profit over 7 / 30 / 90 days
- **Category donut chart** — which product categories drive the most revenue
- **Conversion funnel** — visitors → add to cart → purchase, with automatic bottleneck detection
- **Interactive KSA map** — regional sales distribution with hover tooltips and color-coded intensity
- **Products performance table** — sortable by revenue, worst performers, or views; highlights products with high visits but low conversions
- **Smart alerts strip** — proactive warnings (e.g., "abandonment rate rose 2.3% this week")
- **Date range filter** — switch between 7 / 30 / 90 day views instantly
- **Refresh button** — re-fetches data on demand

---

### 2. 💰 Smart Pricing Tool (`pricing.html`)
The core feature of the platform:

1. Merchant enters the product name and their cost price
2. Backend calls SerpAPI → Google Shopping (Saudi Arabia, English results)
3. Algorithm filters results, applies review-weighted average
4. Returns:
   - ✅ Suggested smart price
   - 📈 Highest price in market
   - 📉 Lowest price in market
   - 👥 Number of competitors found
   - 💰 Expected net profit (or loss warning if market is below cost)

**Pricing Algorithm:**
```
simpleAvg = sum(prices) / count
weightedAvg = sum(price × reviewCount) / sum(reviewCounts)
smartPrice = weightedAvg if weightedAvg ≥ minPrice else simpleAvg
```
This ensures the price is market-realistic AND anchored to what popular, trusted sellers charge.

---

### 3. 🏷️ Discount Advisor (`discounts.html`)
Pure math, no API needed — runs in the browser:

- Input: product cost, current selling price, minimum acceptable profit
- Output:
  - Maximum safe discount percentage
  - New price after discount
  - Cash discount value in SAR
  - Verdict message (can/cannot discount with explanation)

Formula:
```
maxCashDiscount = currentProfit - targetProfit
maxDiscountPct  = (maxCashDiscount / currentPrice) × 100
```

---

### 4. 👤 Authentication Pages
- **Sign Up** (`signup.html`): Full name, email, password with real-time match validation
- **Login** (`login.html`): Username/email + password, social contact links (email, X, WhatsApp)
- Forms include proper HTML validation, error states, and success feedback

---

### 5. 📄 About Us (`about.html`)
- Customer service working hours (grid layout, responsive)
- Feedback form with confirmation alert
- Email response time (24 hours, 7 days)

---

## 🧑‍💼 User Stories

### As a new merchant:
- *"I want to know what price competitors are charging for my product so I don't price too high or too low."*
  → Use the **Smart Pricing Tool** — enter the product name and get a market-based suggestion in seconds.

- *"I want to run a sale but I'm scared of losing money."*
  → Use the **Discount Advisor** — enter your cost and minimum profit, get the maximum safe discount.

- *"I want to see my store's overall performance at a glance."*
  → Open the **Dashboard** — KPIs, charts, and alerts load automatically with mock data (or real API data when connected).

- *"I want to know which of my products is popular but not selling — so I can fix its page."*
  → Check the **Products Table** — items with high views but low conversion are flagged with a "needs review" badge.

- *"I want to see which city buys the most from my store."*
  → Look at the **KSA Map** — hover over regions to see sales by city.

### As a developer maintaining the platform:
- *"I want to switch from mock data to a real Salla/Zid API."*
  → Replace `getMockData()` in `src/js/mock-data.js` with your `fetchStoreData()` function. The data shape is documented in the file.

- *"I want to add a new page to the navigation."*
  → Edit `src/pages/header.html` — one file controls all nav links across all pages.

- *"I want to change the brand colors."*
  → Edit CSS variables in `src/css/style.css` under `:root { }`.

---

## 📁 Project Structure

```
goodmargin/
│
├── .env                        ← Your API keys (do NOT commit)
├── .env.example                ← Template for .env
├── server.js                   ← Express backend (SerpAPI integration)
├── package.json
│
├── public/
│   └── images/
│       ├── logo.png            ← Main navbar logo
│       ├── store-logo.jpeg     ← Sample store logo (mock data)
│       ├── pricing-icon.png    ← Pricing page icon
│       └── sale-icon.png       ← Sale/discount icon
│
└── src/
    ├── css/
    │   ├── style.css           ← Global styles (all pages except dashboard)
    │   └── dashboard.css       ← Dashboard-specific styles
    │
    ├── js/
    │   └── mock-data.js        ← Simulated store data (replace with real API)
    │
    └── pages/
        ├── header.html         ← Shared navigation header (loaded dynamically)
        ├── index.html          ← Analytics Dashboard (home page)
        ├── pricing.html        ← Smart Pricing Tool
        ├── discounts.html      ← Discount Advisor
        ├── login.html          ← Login page
        ├── signup.html         ← Sign up page
        └── about.html          ← About us & feedback
```

---

## 🚀 Setup & Running

### Prerequisites
- Node.js v18+ installed
- A SerpAPI account with a valid API key ([serpapi.com](https://serpapi.com))

### 1. Install dependencies
```bash
cd goodmargin
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Open .env and add your SERPAPI_KEY
```

### 3. Start the backend
```bash
node server.js
# Server starts at http://localhost:5000
# Health check: http://localhost:5000/health
```

### 4. Open the frontend
Open `src/pages/index.html` in your browser.
Or serve it with any static server:
```bash
npx serve src/pages
```

> **Note:** The Smart Pricing Tool (`pricing.html`) requires the backend to be running. All other pages work without it.

---

## 🔌 API Reference

### `POST /api/calculate-price`
Analyzes live market prices for a product.

**Request:**
```json
{
  "productName": "ساعة كلاسيك سوداء"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "productSearched": "ساعة كلاسيك سوداء",
  "marketAnalysis": {
    "smartSuggestedPrice": 285,
    "highestPriceInMarket": 520,
    "lowestPriceInMarket": 149,
    "competitorsCount": 18
  }
}
```

**Error Responses:**
| Code | Meaning |
|------|---------|
| 400  | Missing or empty productName |
| 404  | No shopping results found |
| 504  | SerpAPI request timed out |
| 500  | Server error / bad API key |

---

## 🔄 Connecting a Real Store API

When you're ready to replace mock dashboard data:

1. Open `src/js/mock-data.js`
2. Find the `getMockData()` function at the bottom
3. Replace it with your `fetchStoreData(apiKey, storeId, range)` function
4. Ensure the returned object has the same shape as the mock data

The mock data shape is fully documented with comments inside the file.

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend  | HTML5, CSS3 (custom, no framework), Vanilla JavaScript |
| Charts    | Chart.js 4.4 |
| Icons     | Font Awesome 6.4 |
| Fonts     | Plus Jakarta Sans (Google Fonts) |
| Backend   | Node.js, Express 5 |
| Market Data | SerpAPI → Google Shopping |
| HTTP Client | Axios |
| Env Config | dotenv |

---

## 📌 Known Limitations

- **Mock data is random** — dashboard numbers change on every reload (this is intentional for demo purposes)
- **SerpAPI has a monthly search quota** — monitor your usage at [serpapi.com/manage-api-key](https://serpapi.com/manage-api-key)
- **Map regions are simplified** — the KSA SVG map uses approximate polygons, not exact official boundaries
- **Authentication is frontend-only** — login/signup forms are UI-only; a real auth system (JWT, sessions) is not yet implemented

---

## 🗺️ Roadmap

- [ ] Real authentication with JWT
- [ ] Connect Salla / Zid store API for live dashboard data
- [ ] Price history tracking (store and chart price trends over time)
- [ ] Bulk pricing tool (CSV upload for multiple products)
- [ ] Email notifications for market price changes
- [ ] Mobile app (React Native)

---

*© 2026 Good Margin — Smart Pricing for Saudi Merchants*