/**
 * =============================================================
 * Good Margin — Backend Server (Integrated Frontend)
 * Express.js + SerpAPI for live market price analysis
 * =============================================================
 *
 * Start: npm run dev
 * Endpoint: POST http://localhost:5000/api/calculate-price
 * Frontend: http://localhost:5000
 *
 * =============================================================
 */

require('dotenv').config();
const express = require('express');
const axios   = require('axios');
const cors    = require('cors');
const path    = require('path'); 

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors());          
app.use(express.json()); 

// ── تشغيل ملفات الواجهة الأمامية (Static Files) ──────────────────────
// تفعيل السيرفر ليقرأ المجلد الرئيسي ومجلد الـ src كملفات ثابتة
app.use(express.static(path.join(__dirname, '../'))); 
app.use('/src', express.static(path.join(__dirname, '../src')));

// توجيه الرابط الرئيسي تلقائياً للمسار الصحيح لكي تعمل جميع ملفات الـ CSS والـ JS بالنسبية الصحيحة
app.get('/', (req, res) => {
  res.redirect('/src/pages/index.html');
});

// ── Health Check ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── POST /api/calculate-price ──────────────────────────────────────
app.post('/api/calculate-price', async (req, res) => {
  const { productName } = req.body;

  if (!productName || typeof productName !== 'string' || !productName.trim()) {
    return res.status(400).json({ error: 'الرجاء إدخال اسم المنتج بدقة' });
  }

  const cleanName = productName.trim();
  console.log(`🔎 Searching market for: "${cleanName}"`);

  try {
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine:        'google',
        q:             cleanName,
        google_domain: 'google.com',
        gl:            'sa',     
        hl:            'en',     
        tbm:           'shop',   
        api_key:       process.env.SERPAPI_KEY,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30_000, 
    });

    const shoppingResults = response.data.shopping_results;

    if (!shoppingResults || shoppingResults.length === 0) {
      console.warn('⚠️  No shopping results found for this query.');
      return res.status(404).json({
        error: 'لم نجد منتجات مشابهة في السوق حالياً. تأكد من اسم المنتج أو جرب كلمات أكثر شيوعاً.',
      });
    }

    let totalWeightedPrice  = 0;
    let totalReviewsWeight  = 0;
    let totalPurePrice      = 0;
    const validPrices       = [];

    shoppingResults.forEach(item => {
      let price = 0;
      if (item.extracted_price) {
        price = parseFloat(item.extracted_price);
      } else if (item.price) {
        const cleaned = String(item.price).replace(/[^0-9.]/g, '');
        price = parseFloat(cleaned);
      }

      let reviews = 0;
      if (item.reviews) {
        reviews = parseInt(String(item.reviews).replace(/[^0-9]/g, '')) || 0;
      }

      if (price > 5) {
        validPrices.push(price);
        totalPurePrice += price;

        const weight = reviews > 0 ? reviews : 1;
        totalWeightedPrice += price * weight;
        totalReviewsWeight += weight;
      }
    });

    if (validPrices.length === 0) {
      return res.status(404).json({ error: 'لم نجد أسعاراً منطقية بعد تصفية نتائج السوق. حاول بمنتج مختلف.' });
    }

    const maxPrice     = Math.max(...validPrices);
    const minPrice     = Math.min(...validPrices);
    const simpleAvg    = Math.round(totalPurePrice / validPrices.length);

    const weightedAvg  = totalReviewsWeight > validPrices.length
      ? Math.round(totalWeightedPrice / totalReviewsWeight)
      : simpleAvg;

    const smartPrice   = weightedAvg >= minPrice ? weightedAvg : simpleAvg;

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
    if (err.code === 'ECONNABORTED') return res.status(504).json({ error: 'انتهت مهلة الاتصال بمحرك البحث. حاول مجدداً.' });
    if (err.response?.status === 401) return res.status(500).json({ error: 'مفتاح API غير صالح. تحقق من ملف .env' });
    return res.status(500).json({ error: 'حدث خطأ في الخادم أثناء تحليل بيانات السوق.' });
  }
});

// ── Start Server ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Good Margin Integrated Server Running!`);
  console.log(`   👉 View Website & Dashboard: http://localhost:${PORT}`);
  console.log(`   👉 API Health check: http://localhost:${PORT}/health\n`);
});