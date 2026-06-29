// ── App State ──────────────────────────────────────────────────
let currentRange = 30;
let currentSort  = 'top';
let storeData    = null;
let selectedCityFilter = null;
const charts     = {};
let leafletMap   = null;
let mapMarkers   = [];

// ── Bootstrap ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  loadHeader();
  initLeafletMap();
  bindControls();
  await loadData();
});

// ── Header ─────────────────────────────────────────────────────
function loadHeader() {
  fetch('header.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('global-header').innerHTML = html;
      document.querySelectorAll('.navbar-item a').forEach(a => {
        if (a.getAttribute('href') === 'index.html') a.parentElement.classList.add('active');
      });
    })
    .catch(() => {});
}

// ── Initialize Real Map ─────────────────────────────────────────
function initLeafletMap() {
  // مركز المملكة العربية السعودية
  leafletMap = L.map('ksa-real-map', {
    center: [23.8859, 45.0792],
    zoom: 5,
    minZoom: 4,
    maxZoom: 8,
    attributionControl: false
  });

  // نمط خرائط خفيف وعصري يناسب هوية الداشبورد (CartoDB Positron)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(leafletMap);
}

// ── Controls ───────────────────────────────────────────────────
function bindControls() {
  document.querySelectorAll('.btn-range').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.btn-range').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = Number(btn.dataset.range);
      selectedCityFilter = null; // إعادة تعيين الفلتر الجغرافي عند تغيير المدة
      document.getElementById('resetMapFilter').style.display = 'none';
      await loadData();
    });
  });

  document.getElementById('syncBtn').addEventListener('click', async () => {
    const icon = document.querySelector('#syncBtn i');
    icon.style.animation = 'spin .6s linear infinite';
    await loadData();
    icon.style.animation = '';
  });

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if(btn.id === 'resetMapFilter') return;
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      if (storeData) renderProductsTable(storeData.products, currentSort);
    });
  });

  document.getElementById('resetMapFilter').addEventListener('click', () => {
    selectedCityFilter = null;
    document.getElementById('resetMapFilter').style.display = 'none';
    renderAll(storeData);
  });
}

// ── Data Loading ───────────────────────────────────────────────
async function loadData() {
  showLoading(true);
  try {
    storeData = await getMockData(currentRange);
    renderAll(storeData);
  } catch (err) {
    console.error('Dashboard load error:', err);
    alert('تعذّر تحميل البيانات، حاول مجدداً.');
  } finally {
    showLoading(false);
  }
}

// ── Render All ─────────────────────────────────────────────────
function renderAll(data) {
  document.getElementById('storeName').textContent = data.store.name;
  document.title = `${data.store.name} — Good Margin`;
  document.getElementById('alertBadge').textContent = data.alerts.length;

  renderAlerts(data.alerts);
  
  // إذا تم اختيار مدينة معينة، يتم فلترة الـ KPIs والـ Charts بناءً عليها لتفاعل حقيقي كـ Power BI
  let filteredSales = data.dailySales;
  let filteredKPIs = data.kpis;
  let filteredProducts = data.products;

  if (selectedCityFilter) {
    const cityObj = data.cities.find(c => c.city === selectedCityFilter);
    if (cityObj) {
      // تعديل وهمي لنسب الـ KPIs بناءً على مبيعات المدينة المختارة
      filteredKPIs = JSON.parse(JSON.stringify(data.kpis));
      filteredKPIs.totalSales.value = cityObj.sales;
      filteredKPIs.totalSessions.value = cityObj.sessions;
      filteredKPIs.totalProfit.value = Math.round(cityObj.sales * 0.3);
    }
  }

  renderKPIs(filteredKPIs);
  renderSalesTrend(filteredSales);
  renderCategoryDonut(data.categories);
  renderMarketingChannels(data.marketingData);
  renderFunnel(data.funnel);
  renderRealKSAMap(data.cities);
  renderProductsTable(filteredProducts, currentSort);
  renderLastUpdated(data.lastUpdated);
}

// ── 1. Alerts ──────────────────────────────────────────────────
function renderAlerts(alerts) {
  const iconMap = { warning: 'fa-triangle-exclamation', info: 'fa-circle-info', success: 'fa-circle-check' };
  document.getElementById('alertsList').innerHTML = alerts.map(a => `
    <div class="alert-item ${a.type}">
      <i class="fa-solid ${iconMap[a.type]}"></i>
      <span>${a.message}</span>
    </div>
  `).join('');
}

// ── 2. KPI Cards ────────────────────────────────────────────────
function renderKPIs(kpis) {
  const defs = [
    { key: 'totalSales',    icon: 'fa-sack-dollar',    label: 'إجمالي المبيعات',  fmt: v => `${formatNum(v)} ر.س`, accent: 'var(--primary)'   },
    { key: 'totalProfit',   icon: 'fa-chart-line',     label: 'صافي الأرباح',     fmt: v => `${formatNum(v)} ر.س`, accent: 'var(--secondary)'  },
    { key: 'avgCartSize',   icon: 'fa-cart-shopping',  label: 'متوسط حجم السلة',  fmt: v => `${v} منتج`,           accent: 'var(--purple)'    },
    { key: 'totalSessions', icon: 'fa-users',          label: 'إجمالي الزيارات',  fmt: v => formatNum(v),          accent: 'var(--amber)'     },
    { key: 'avgRating',     icon: 'fa-star',           label: 'تقييم العملاء',    fmt: v => `${v} / 5`,            cls: v => v >= 4 ? '' : 'kpi-warn' },
    { key: 'abandonedRate', icon: 'fa-cart-arrow-down',label: 'التخلي عن السلة',  fmt: v => `${v}%`,               accent: 'var(--danger)',   cls: () => 'kpi-danger' },
  ];

  const grid = document.getElementById('kpiGrid');
  grid.innerHTML = defs.map(d => {
    const kpi   = kpis[d.key];
    const chg   = kpi.prevChange;
    const isGood = d.key === 'abandonedRate' ? chg < 0 : chg >= 0;
    const cc    = isGood ? 'up' : 'down';
    const ci    = chg >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
    const extra = typeof d.cls === 'function' ? d.cls(kpi.value) : '';
    const style = d.accent ? `style="--accent: ${d.accent}"` : '';

    return `
      <div class="kpi-card ${extra}" ${style}>
        <i class="kpi-icon fa-solid ${d.icon}"></i>
        <div class="kpi-value" data-key="${d.key}" data-target="${kpi.value}">0</div>
        <div class="kpi-label">${d.label}</div>
        <div class="kpi-change ${cc}">
          <i class="fa-solid ${ci}"></i> ${Math.abs(chg)}% مقارنة بالفترة السابقة
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.kpi-value[data-target]').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const key    = el.dataset.key;
    const def    = defs.find(d => d.key === key);
    const floatKeys = ['avgCartSize', 'avgRating', 'abandonedRate'];
    let start = null;

    function step(ts) {
      if (!start) start = ts;
      const prog   = Math.min((ts - start) / 700, 1);
      const current = target * prog;
      el.textContent = def.fmt(floatKeys.includes(key) ? Math.round(current * 10) / 10 : Math.round(current));
      if (prog < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// ── 3. Sales Trend Chart ───────────────────────────────────────
function renderSalesTrend(daily) {
  if (charts.trend) charts.trend.destroy();
  charts.trend = new Chart(document.getElementById('salesTrendChart'), {
    type: 'line',
    data: {
      labels: daily.map(d => d.date.slice(5)),
      datasets: [
        { label: 'المبيعات', data: daily.map(d => d.sales),  borderColor: '#0097B2', backgroundColor: 'rgba(0,151,178,.04)',  fill: true, tension: .4, pointRadius: 1 },
        { label: 'الأرباح',  data: daily.map(d => d.profit), borderColor: '#42CE60', backgroundColor: 'rgba(66,206,96,.02)',   fill: true, tension: .4, pointRadius: 1 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'inherit' } } } },
      scales: {
        y: { ticks: { callback: v => `${(v / 1000).toFixed(0)}k` }, grid: { color: '#F1F5F9' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ── 4. Category Donut ──────────────────────────────────────────
function renderCategoryDonut(cats) {
  if (charts.donut) charts.donut.destroy();
  charts.donut = new Chart(document.getElementById('categoryDonutChart'), {
    type: 'doughnut',
    data: {
      labels: cats.map(c => c.category),
      datasets: [{ data: cats.map(c => c.percentage), backgroundColor: cats.map(c => c.color), borderWidth: 2, borderColor: '#fff' }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 8, boxWidth: 10, font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` } }
      }
    }
  });
}

// ── 4b. Marketing Channels Donut (حساب المنصات التفاعلية) ────────────────
function renderMarketingChannels(marketing) {
  if (charts.marketing) charts.marketing.destroy();
  charts.marketing = new Chart(document.getElementById('marketingChannelsChart'), {
    type: 'doughnut',
    data: {
      labels: marketing.map(m => m.source),
      datasets: [{ data: marketing.map(m => m.visitors), backgroundColor: marketing.map(m => m.color), borderWidth: 2, borderColor: '#fff' }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 8, boxWidth: 10, font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${formatNum(ctx.parsed)} زائر` } }
      }
    }
  });
}

// ── 5. Conversion Funnel ───────────────────────────────────────
function renderFunnel(funnel) {
  const steps = [
    { ...funnel.views,     color: 'var(--secondary)' },
    { ...funnel.cartAdds,  color: 'var(--primary)'   },
    { ...funnel.purchases, color: 'var(--purple)'    },
  ];
  const drop1 = ((steps[0].count - steps[1].count) / steps[0].count * 100).toFixed(0);
  const drop2 = ((steps[1].count - steps[2].count) / steps[1].count * 100).toFixed(0);
  const bigDrop = Number(drop1) > Number(drop2) ? 'product' : 'checkout';

  const widths = ['100%', '75%', '52%'];
  document.getElementById('funnelWrapper').innerHTML = steps.map((s, i) => {
    const dropRow = i > 0 ? `<div class="funnel-drop-row"><i class="fa-solid fa-arrow-down"></i> <span>−${i === 1 ? drop1 : drop2}% انخفاض</span></div>` : '';
    return `
      ${dropRow}
      <div class="funnel-tier">
        <div class="funnel-block" style="background: ${s.color}; width: ${widths[i]};">
          <span class="funnel-label">${s.label}</span>
          <span class="funnel-count">${formatNum(s.count)}</span>
        </div>
      </div>
    `;
  }).join('');

  const alertEl = document.getElementById('bottleneckAlert');
  alertEl.classList.add('visible');
  document.getElementById('bottleneckMsg').textContent = bigDrop === 'product'
    ? `اختناق في صفحة المنتج — هبوط ${drop1}% قبل الإضافة للسلة. تحقق من السعر أو الصور.`
    : `اختناق في صفحة الدفع — هبوط ${drop2}% قبل إتمام الشراء. تحقق من خيارات الشحن أو الدفع.`;
}

// ── 6. Real Leaflet Map ────────────────────────────────────────
function renderRealKSAMap(cities) {
  // مسح الماركرز القديمة لمنع تكرار الرسم
  mapMarkers.forEach(m => leafletMap.removeLayer(m));
  mapMarkers = [];

  const maxSales = Math.max(...cities.map(c => c.sales));

  cities.forEach(city => {
    // بناء دوائر ذكية تتناسب أحجامها مع حجم مبيعات المدينة لتبدو احترافية
    const radiusSize = Math.max((city.sales / maxSales) * 60000, 25000);
    
    // تحديد لون الدائرة حسب جودة المبيعات لتعطي طابع مالي مميز
    const circleColor = city.sales > maxSales * 0.7 ? '#0097B2' : city.sales > maxSales * 0.4 ? '#42CE60' : '#F59E0B';

    const circle = L.circle([city.lat, city.lng], {
      color: circleColor,
      fillColor: circleColor,
      fillOpacity: 0.5,
      radius: radiusSize,
      weight: 2
    }).addTo(leafletMap);

    // ربط نافذة بوب أب تفاعلية تظهر عند تمرير الماوس أو النقر
    circle.bindTooltip(`
      <div style="text-align:right; font-family:sans-serif; padding:2px;">
        <strong>${city.city}</strong><br/>
        المبيعات: ${formatNum(city.sales)} ر.س<br/>
        الزيارات: ${formatNum(city.sessions)} زائر
      </div>
    `, { direction: 'top', sticky: true });

    // تصفية اللوحة بالكامل عند الضغط على الدائرة كأنظمة الذكاء المالي
    circle.on('click', () => {
      selectedCityFilter = city.city;
      document.getElementById('resetMapFilter').style.display = 'inline-block';
      renderAll(storeData);
    });

    mapMarkers.push(circle);
  });

  // تحديث محتوى جدول البيانات المالي المرفق بالخريطة في الجانب
  document.getElementById('mapLegend').innerHTML = cities.map(c => `
    <div class="legend-item ${selectedCityFilter === c.city ? 'active-filter' : ''}" onclick="triggerCityFilter('${c.city}')">
      <div class="legend-dot" style="background: ${c.sales > maxSales * 0.7 ? '#0097B2' : c.sales > maxSales * 0.4 ? '#42CE60' : '#F59E0B'};"></div>
      <div>
        <div class="legend-city">${c.city} ${selectedCityFilter === c.city ? '🔑' : ''}</div>
        <div class="legend-val">${formatNum(c.sales)} ر.س</div>
      </div>
    </div>
  `).join('');
}

// دالة وسيطة لفلترة الخريطة من القائمة الجانبية أيضاً
function triggerCityFilter(cityName) {
  selectedCityFilter = cityName;
  document.getElementById('resetMapFilter').style.display = 'inline-block';
  renderAll(storeData);
}

// ── 7. Products Table ──────────────────────────────────────────
function renderProductsTable(products, sort) {
  const sorted = [...products].sort((a, b) => {
    if (sort === 'top')   return b.revenue - a.revenue;
    if (sort === 'worst') return a.revenue - b.revenue;
    if (sort === 'views') return b.views   - a.views;
    return 0;
  });

  document.getElementById('productsBody').innerHTML = sorted.map((p, i) => {
    const conv    = (p.purchases / p.views * 100).toFixed(1);
    const convCls = conv >= 20 ? '' : conv >= 10 ? 'warn' : 'danger';
    const stars   = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));
    const isAlert = p.views > 800 && Number(conv) < 10;

    return `
      <tr class="${isAlert ? 'row-alert' : ''}">
        <td class="product-rank">${i + 1}</td>
        <td class="product-name">
          ${isAlert ? '<span class="alert-tag">يحتاج مراجعة</span>' : ''}
          ${p.name}
        </td>
        <td><span class="category-badge">${p.category}</span></td>
        <td>${formatNum(p.views)}</td>
        <td>${formatNum(p.cartAdds)}</td>
        <td>${formatNum(p.purchases)}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <div class="conv-bar">
              <div class="conv-fill ${convCls}" style="width: ${Math.min(conv, 100)}%;"></div>
            </div>
            <span style="font-size: 0.76rem; color: var(--text-sub);">${conv}%</span>
          </div>
        </td>
        <td class="star-rating">${stars}</td>
        <td><strong>${formatNum(p.revenue)} ر.س</strong></td>
      </tr>
    `;
  }).join('');
}

// ── Helpers ────────────────────────────────────────────────────
function renderLastUpdated(iso) {
  document.getElementById('lastUpdated').textContent = new Date(iso).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' });
}

function showLoading(show) {
  document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)     return (n / 1000).toFixed(1) + 'k';
  return String(n);
}