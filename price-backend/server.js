require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// تفعيل الحزم الأساسية للسيرفر
app.use(cors()); // يتيح لصفحات الـ HTML حريّة الاتصال بالسيرفر محلياً بدون قيود أمنية
app.use(express.json()); // يسمح للسيرفر بقراءة بيانات الـ JSON القادمة من الفرونت إند

// نقطة الاتصال (Endpoint) الرئيسية لحساب السعر الذكي
app.post('/api/calculate-price', async (req, res) => {
    try {
        const { productName } = req.body; // استقبال اسم المنتج من واجهة المستخدم

        if (!productName) {
            return res.status(400).json({ error: 'الرجاء إدخال اسم المنتج بدقة' });
        }

        console.log(`🔎 جاري فحص السوق والاتصال بـ SerpApi للمنتج: "${productName}"...`);

        // 1. استدعاء البيانات بالتطابق الحرفي مع الـ Playground الناجح
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google',         
                q: productName,
                google_domain: 'google.com',
                gl: 'sa',                 // النطاق: السعودية
                hl: 'en',                 // اللغة إنجليزي لتأمين البيانات
                tbm: 'shop',              // فتح تبويب التسوق لـ جلب المنتجات والمنافسين
                api_key: process.env.SERPAPI_KEY // يعتمد على مفتاحك الصحيح المسجل في ملف .env
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 30000 // ⏱️ تم رفع وقت الانتظار إلى 30 ثانية كاملة لضمان عدم انقطاع الطلب
        });

        const shoppingResults = response.data.shopping_results;

        // طباعة تتبع حجم البيانات في الترمينال فوراً بعد الرد
        if (!shoppingResults || shoppingResults.length === 0) {
            console.log("⚠️ تنبيه: نجح الاتصال بالمفتاح ولكن لم تظهر أي نتائج تسوق لهذا الاسم المحدد.");
            return res.status(404).json({ error: 'لم نجد منتجات مشابهة في السوق حالياً، تأكد من الاسم.' });
        }

        console.log(`📦 نجح جلب البيانات حياً! تم رصد ${shoppingResults.length} عنصر في مصفوفة السوق.`);

        let totalWeightedPrice = 0;
        let totalReviewsVolume = 0;
        let validPricesList = [];
        let totalPurePrice = 0;

        // 2. معالجة وتصفية البيانات البرمجية بناءً على الهيكل المستلم
        shoppingResults.forEach(item => {
            let price = 0;
            
            // قراءة السعر الرقمي الصافي المباشر (extracted_price)
            if (item.extracted_price) {
                price = parseFloat(item.extracted_price);
            } else if (item.price) {
                // حل احتياطي في حال القراءة النصية
                const priceString = String(item.price).replace(/[^0-9.]/g, '');
                price = parseFloat(priceString);
            }
            
            // قراءة عدد التقييمات (المبيعات) وتنظيفها من الفواصل
            let reviews = 0;
            if (item.reviews) {
                const reviewsString = String(item.reviews).replace(/[^0-9]/g, '');
                reviews = parseInt(reviewsString) || 0;
            }

            // نأخذ الأسعار فوق 5 ريال لضمان استبعاد الملحقات الصغيرة جداً أو الروابط الإعلانية
            if (price > 5) {
                validPricesList.push(price);
                totalPurePrice += price;
                
                // التثقيل بالتقييمات: إذا كان المنتج يملك تقييمات نعتمدها كوزن، وإلا نمنحه وزناً بسيطاً = 1
                const weight = reviews > 0 ? reviews : 1;
                
                totalWeightedPrice += (price * weight);
                totalReviewsVolume += weight;
            }
        });

        // تحقق أمني بعد عملية التصفية
        if (validPricesList.length === 0) {
            console.log("⚠️ تنبيه: تم تصفية كافة العناصر ولم نجد أسعاراً منطقية فوق 5 ريال.");
            return res.status(404).json({ error: 'لم نجد أسعار منطقية بعد تصفية عناصر السوق.' });
        }

        console.log(`✅ عدد المنافسين الحقيقيين المقارنين في المعادلة: ${validPricesList.length}`);

        // حساب أعلى وأقل سعر رُصد في السوق الفعلي للمقارنة
        const maxPrice = Math.max(...validPricesList);
        const minPrice = Math.min(...validPricesList);
        
        // 3. احتساب السعر الذكي المقترح (بناءً على خطة حماية بديلة مزدوجة)
        const simpleAverage = Math.round(totalPurePrice / validPricesList.length); // المتوسط الحسابي البسيط
        
        // إذا كان هناك حركة مبيعات وتقييمات عالية نطبق المتوسط المرجح المطور، وإلا نتحول للمتوسط البسيط
        const weightedAverage = totalReviewsVolume > validPricesList.length 
            ? Math.round(totalWeightedPrice / totalReviewsVolume) 
            : simpleAverage;

        // تأمين نهائي: نضمن برمجياً أن السعر الذكي الناتج لا يقل عن أقل سعر رُصد بالسوق
        const smartPrice = weightedAverage >= minPrice ? weightedAverage : simpleAverage;

        console.log(`🎯 النتيجة النهائية المقترحة للواجهة: ${smartPrice} ريال سعودي.`);

        // 4. إرسال الإجابة والتحليلات النهائية إلى واجهة المستخدم (HTML)
        res.json({
            success: true,
            productSearched: productName,
            marketAnalysis: {
                smartSuggestedPrice: smartPrice,       // السعر الذكي المرجح
                highestPriceInMarket: maxPrice,        // أعلى سعر رُصد بالسوق
                lowestPriceInMarket: minPrice,         // أقل سعر رُصد بالسوق
                competitorsCount: validPricesList.length   // عدد المنافسين
            }
        });

    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error('❌ خطأ: انتهت مهلة الـ 30 ثانية والشبكة لم تستجب للطلب.');
        } else {
            console.error('❌ خطأ في السيرفر أثناء محاولة جلب البيانات الحيّة:', error.message);
        }
        res.status(500).json({ error: 'حدث خطأ في السيرفر أثناء معالجة بيانات السوق الحية.' });
    }
});

// تحديد بورت السيرفر وتشغيله
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 خادم منصة Good Margin يعمل بنجاح وبأعلى مهلة أمان على البورت: http://localhost:${PORT}`);
});