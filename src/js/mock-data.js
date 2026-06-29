/**
 * =============================================================
 *  mock-data.js — Simulated API data for Good Margin dashboard
 * =============================================================
 *
 *  Purpose: Provide realistic test data that mirrors the shape
 *  a real e-commerce API (Salla / Zid / Shopify) would return.
 *
 *  When connecting a real API:
 *  1. Delete this file
 *  2. In home.js, replace `getMockData()` with
 *     `await fetchStoreData(apiKey, storeId, range)`
 *  3. Ensure the real API response matches the object shape below
 *
 * =============================================================
 */

// ── Test Store Config ──────────────────────────────────────────────
const MOCK_STORE = {
  id: 'store_001',
  name: 'متجر البخور والعطور',
  url: 'bakhoor-store.com',
  logo: '../public/images/store-logo.jpeg',
  plan: 'pro',
  connectedPlatform: 'salla',
  apiStatus: 'online',
};

// ── Helpers ────────────────────────────────────────────────────────
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDailySales(days = 30) {
  const data = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const isWeekend = date.getDay() === 5 || date.getDay() === 6;

    data.push({
      date: date.toISOString().split('T')[0],
      sales:    randomBetween(isWeekend ? 4000 : 2000, isWeekend ? 12000 : 7000),
      profit:   randomBetween(isWeekend ? 1200 : 600,  isWeekend ? 3600  : 2100),
      sessions: randomBetween(isWeekend ? 300  : 150,  isWeekend ? 800   : 500),
    });
  }
  return data;
}

function generateProductList() {
  return [
    { id: 'P001', name: 'عود الملك',          category: 'عود',       views: 1540, cartAdds: 620, purchases: 310, revenue: 46500, rating: 4.8 },
    { id: 'P002', name: 'بخور الورد الطائفي', category: 'بخور',      views: 1230, cartAdds: 490, purchases: 280, revenue: 33600, rating: 4.6 },
    { id: 'P003', name: 'عطر الفجر',           category: 'عطور',      views: 980,  cartAdds: 400, purchases: 255, revenue: 38250, rating: 4.7 },
    { id: 'P004', name: 'هدية العيد',          category: 'هدايا',     views: 760,  cartAdds: 310, purchases: 200, revenue: 30000, rating: 4.4 },
    { id: 'P005', name: 'مبخرة فضية',          category: 'إكسسوار',   views: 520,  cartAdds: 140, purchases: 95,  revenue: 9500,  rating: 4.2 },
    { id: 'P006', name: 'عود الليل',           category: 'عود',       views: 890,  cartAdds: 210, purchases: 88,  revenue: 13200, rating: 3.9 },
    { id: 'P007', name: 'عطر النسيم',          category: 'عطور',      views: 670,  cartAdds: 180, purchases: 72,  revenue: 10800, rating: 4.1 },
    { id: 'P008', name: 'بخور الياسمين',       category: 'بخور',      views: 1100, cartAdds: 95,  purchases: 40,  revenue: 4800,  rating: 3.7 },
    { id: 'P009', name: 'صندوق الهدايا',       category: 'هدايا',     views: 430,  cartAdds: 60,  purchases: 28,  revenue: 5600,  rating: 3.5 },
    { id: 'P010', name: 'مبخرة ذهبية',         category: 'إكسسوار',   views: 310,  cartAdds: 40,  purchases: 15,  revenue: 2250,  rating: 3.8 },
  ];
}

function generateCityData() {
  // تم تزويد المدن بالإحداثيات الجغرافية الحقيقية (Latitude & Longitude) لرسمها على الـ Map بدقة متناهية
  return [
    { city: 'الرياض',   sales: 42000, sessions: 1850, lat: 24.7136, lng: 46.6753 },
    { city: 'جدة',      sales: 31000, sessions: 1340, lat: 21.5433, lng: 39.1728 },
    { city: 'الدمام',   sales: 18500, sessions: 780,  lat: 26.4207, lng: 50.0888 },
    { city: 'مكة',      sales: 12000, sessions: 510,  lat: 21.3891, lng: 39.8579 },
    { city: 'المدينة',  sales: 8500,  sessions: 360,  lat: 24.5247, lng: 39.5692 },
    { city: 'الخبر',    sales: 6200,  sessions: 260,  lat: 26.2172, lng: 50.1971 },
  ];
}

function generateCategoryData() {
  return [
    { category: 'عطور',      percentage: 38, color: '#42CE60' },
    { category: 'بخور',      percentage: 28, color: '#0097B2' },
    { category: 'عود',       percentage: 22, color: '#8B5CF6' },
    { category: 'هدايا',     percentage: 8,  color: '#F59E0B' },
    { category: 'إكسسوار',  percentage: 4,  color: '#EF4444' },
  ];
}

// دالة توليد قنوات وحساب الزوار التسويقية الجديدة بالكامل المربوطة بالـ UTM
function generateMarketingData() {
  return [
    { source: 'رابط مباشر / منصات', visitors: randomBetween(1200, 3000), color: '#0097B2' },
    { source: 'حملات الواتساب',     visitors: randomBetween(900, 2500),  color: '#42CE60' },
    { source: 'إعلانات تويتر (X)',   visitors: randomBetween(600, 1800),  color: '#1E293B' },
    { source: 'إنستغرام وسناب',    visitors: randomBetween(400, 1200),  color: '#8B5CF6' },
  ];
}

function generateFunnelData() {
  return {
    views:     { label: 'زيارات المنتجات', count: 8420, color: '#0097B2' },
    cartAdds:  { label: 'إضافة للسلة',     count: 2525, color: '#42CE60' },
    purchases: { label: 'إتمام الشراء',    count: 1183, color: '#8B5CF6' },
  };
}

function generateKPIs(dailySales) {
  const totalSales  = dailySales.reduce((s, d) => s + d.sales, 0);
  const totalProfit = dailySales.reduce((s, d) => s + d.profit, 0);
  const products    = generateProductList();
  const funnel      = generateFunnelData();

  const abandonedCarts = funnel.cartAdds.count - funnel.purchases.count;
  const abandonedRate  = ((abandonedCarts / funnel.cartAdds.count) * 100).toFixed(1);
  const avgRating      = (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(1);

  return {
    totalSales:    { value: totalSales,   prevChange: +12.4 },
    totalProfit:   { value: totalProfit,  prevChange: +8.7  },
    avgCartSize:   { value: 2.4,          prevChange: +0.3  },
    totalSessions: { value: dailySales.reduce((s, d) => s + d.sessions, 0), prevChange: +18.2 },
    avgRating:     { value: Number(avgRating),     prevChange: -0.1 },
    abandonedRate: { value: Number(abandonedRate), prevChange: +2.3 },
  };
}

// ── Main Export ────────────────────────────────────────────────────
async function getMockData(range = 30) {
  await new Promise(resolve => setTimeout(resolve, 300));
  const dailySales = generateDailySales(range);

  return {
    store:       MOCK_STORE,
    kpis:        generateKPIs(dailySales),
    funnel:      generateFunnelData(),
    dailySales,
    products:    generateProductList(),
    cities:      generateCityData(),
    categories:  generateCategoryData(),
    marketingData: generateMarketingData(),
    alerts: [
      { type: 'warning', message: 'معدل التخلي عن السلة ارتفع 2.3% مقارنة بالأسبوع الماضي' },
      { type: 'info',    message: 'منتج «بخور الياسمين» يحظى بزيارات عالية لكن مبيعاته منخفضة' },
      { type: 'success', message: 'المبيعات تجاوزت هدف الأسبوع بـ 12.4%' },
    ],
    lastUpdated: new Date().toISOString(),
  };
}