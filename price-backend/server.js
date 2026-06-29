/**
 * =============================================================
 *  Good Margin — Backend Server
 *  Express.js + SerpAPI for live market price analysis
 * =============================================================
 *
 *  Start: node server.js
 *  Endpoint: POST http://localhost:5000/api/calculate-price
 *
 * =============================================================
 */

require('dotenv').config();
const express = require('express');
const axios   = require('axios');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors());          // Allow cross-origin requests from frontend HTML
app.use(express.json()); // Parse JSON request bodies

// ── Health Check ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── POST /api/calculate-price ──────────────────────────────────────
// Accepts: { productName: string }
// Returns: { success, productSearched, marketAnalysis }
app.post('/api/calculate-price', async (req, res) => {
  const { productName } = req.body;

  if (!productName || typeof productName !== 'string' || !productName.trim()) {
    return res.status(400).json({ error: 'الرجاء إدخال اسم المنتج بدقة' });
  }

  const cleanName = productName.trim();
  console.log(`🔎 Searching market for: "${cleanName}"`);

  try {
    // ── Call SerpAPI (Google Shopping) ────────────────────────────
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine:        'google',
        q:             cleanName,
        google_domain: 'google.com',
        gl:            'sa',     // Saudi Arabia
        hl:            'en',     // English for consistent data
        tbm:           'shop',   // Shopping tab
        api_key:       process.env.SERPAPI_KEY,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30_000, // 30 second timeout
    });

    const shoppingResults = response.data.shopping_results;

    if (!shoppingResults || shoppingResults.length === 0) {
      console.warn('⚠️  No shopping results found for this query.');
      return res.status(404).json({
        error: 'لم نجد منتجات مشابهة في السوق حالياً. تأكد من اسم المنتج أو جرب كلمات أكثر شيوعاً.',
      });
    }

    console.log(`📦 Raw results fetched: ${shoppingResults.length} items`);

    // ── Parse & Filter Results ─────────────────────────────────────
    let totalWeightedPrice  = 0;
    let totalReviewsWeight  = 0;
    let totalPurePrice      = 0;
    const validPrices       = [];

    shoppingResults.forEach(item => {
      // Extract numeric price (prefer pre-extracted, fall back to parsing)
      let price = 0;
      if (item.extracted_price) {
        price = parseFloat(item.extracted_price);
      } else if (item.price) {
        const cleaned = String(item.price).replace(/[^0-9.]/g, '');
        price = parseFloat(cleaned);
      }

      // Extract review count (used as popularity weight)
      let reviews = 0;
      if (item.reviews) {
        reviews = parseInt(String(item.reviews).replace(/[^0-9]/g, '')) || 0;
      }

      // Filter out accessories/ads (anything under 5 SAR)
      if (price > 5) {
        validPrices.push(price);
        totalPurePrice += price;

        const weight = reviews > 0 ? reviews : 1;
        totalWeightedPrice += price * weight;
        totalReviewsWeight += weight;
      }
    });

    if (validPrices.length === 0) {
      console.warn('⚠️  All items filtered out (prices too low or missing).');
      return res.status(404).json({
        error: 'لم نجد أسعاراً منطقية بعد تصفية نتائج السوق. حاول بمنتج مختلف.',
      });
    }

    console.log(`✅ Valid competitors found: ${validPrices.length}`);

    // ── Price Algorithm ────────────────────────────────────────────
    const maxPrice     = Math.max(...validPrices);
    const minPrice     = Math.min(...validPrices);
    const simpleAvg    = Math.round(totalPurePrice / validPrices.length);

    // Use weighted average (by reviews) if enough review data exists,
    // otherwise fall back to simple average for safety
    const weightedAvg  = totalReviewsWeight > validPrices.length
      ? Math.round(totalWeightedPrice / totalReviewsWeight)
      : simpleAvg;

    // Final guard: smart price must never go below market minimum
    const smartPrice   = weightedAvg >= minPrice ? weightedAvg : simpleAvg;

    console.log(`🎯 Smart suggested price: ${smartPrice} SAR`);

    // ── Response ───────────────────────────────────────────────────
    return res.json({
      success:         true,
      productSearched: cleanName,
      marketAnalysis:  {
        smartSuggestedPrice:  smartPrice,
        highestPriceInMarket: maxPrice,
        lowestPriceInMarket:  minPrice,
        competitorsCount:     validPrices.length,
      },
    });

  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      console.error('❌ Timeout: SerpAPI did not respond within 30 seconds.');
      return res.status(504).json({ error: 'انتهت مهلة الاتصال بمحرك البحث. حاول مجدداً.' });
    }

    if (err.response?.status === 401) {
      console.error('❌ Invalid SerpAPI key.');
      return res.status(500).json({ error: 'مفتاح API غير صالح. تحقق من ملف .env' });
    }

    console.error('❌ Server error:', err.message);
    return res.status(500).json({ error: 'حدث خطأ في الخادم أثناء تحليل بيانات السوق.' });
  }
});

// ── Start Server ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Good Margin server running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});