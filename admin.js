/* ═══════════════════════════════════════════════════════════════
   Shimla Wali Business Studio — Production Admin JavaScript
   ═══════════════════════════════════════════════════════════════ */

let state = {
  admin: 'Business Admin',
  metrics: null,
  products: [],
  niches: [],
  inventory: {},
  movements: [],
  batches: [],
  orders: [],
  payments: [],
  customers: [],
  discounts: [],
  content: {},
  settings: {},
  media: {},
  auditLogs: [],
  backups: [],
  reports: null
};
window.state = state;

let currentTab = 'dashboard';
let orderFilter = 'all';
let toastTimer = null;
let adminLang = 'hi';
let adminTheme = 'dark';
let sideCollapsed = false;
try {
  if (localStorage.getItem('shimla_admin_lang') === 'en') adminLang = 'en';
  if (localStorage.getItem('shimla_admin_theme') === 'light') adminTheme = 'light';
  if (localStorage.getItem('shimla_admin_side_collapsed') === '1') sideCollapsed = true;
} catch {}

function applyAdminTheme() {
  const isLight = adminTheme === 'light';
  document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
  if (document.body) document.body.setAttribute('data-theme', isLight ? 'light' : 'dark');
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.title = isLight ? 'Switch to Night Mode (Dark)' : 'Switch to Day Mode (Light)';
    toggleBtn.setAttribute('aria-label', toggleBtn.title);
    toggleBtn.innerHTML = isLight
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
  }
  const darkBtn = document.getElementById('theme-btn-dark');
  const lightBtn = document.getElementById('theme-btn-light');
  if (darkBtn) darkBtn.className = `btn ${!isLight ? 'primary' : ''}`;
  if (lightBtn) lightBtn.className = `btn ${isLight ? 'primary' : ''}`;
}

function setAdminTheme(mode) {
  adminTheme = mode === 'light' ? 'light' : 'dark';
  try {
    localStorage.setItem('shimla_admin_theme', adminTheme);
  } catch {}
  applyAdminTheme();
  if (state.metrics) renderDashboard();
  showToast(
    adminTheme === 'light'
      ? (adminLang === 'en' ? 'Day Mode (Light) enabled' : 'डे मोड (Light Theme) चालू हो गया')
      : (adminLang === 'en' ? 'Night Mode (Dark) enabled' : 'नाइट मोड (Dark Theme) चालू हो गया')
  );
}

function toggleAdminTheme() {
  setAdminTheme(adminTheme === 'light' ? 'dark' : 'light');
}

function updateBotToggleUI(enabled) {
  const isEnabled = enabled !== false;
  const enBtn = document.getElementById('bot-btn-enable');
  const disBtn = document.getElementById('bot-btn-disable');
  if (enBtn) enBtn.className = `btn sm ${isEnabled ? 'primary' : ''}`;
  if (disBtn) disBtn.className = `btn sm ${!isEnabled ? 'primary' : ''}`;
  const cb = document.getElementById('set-bot-enabled');
  if (cb) cb.checked = isEnabled;
}
window.updateBotToggleUI = updateBotToggleUI;

function setAdminBotEnabled(enabled, skipApi = false) {
  const isEnabled = Boolean(enabled);
  try {
    localStorage.setItem('shimla_admin_bot_enabled', isEnabled ? 'true' : 'false');
  } catch {}
  if (state && state.settings) {
    state.settings.admin_bot_enabled = isEnabled;
  }
  updateBotToggleUI(isEnabled);
  if (typeof window.__syncCopilotVisibility === 'function') {
    window.__syncCopilotVisibility();
  }
  if (!skipApi && typeof apiFetch === 'function') {
    apiFetch('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ admin_bot_enabled: isEnabled })
    }).catch(err => console.warn('Could not persist bot setting:', err));
  }
  showToast(
    isEnabled
      ? (adminLang === 'en' ? 'DOVA AI Bot enabled' : 'DOVA AI बॉट चालू (Enable) किया गया')
      : (adminLang === 'en' ? 'DOVA AI Bot disabled' : 'DOVA AI बॉट बंद (Disable) किया गया')
  );
}
window.setAdminBotEnabled = setAdminBotEnabled;

function applySidebarState() {
  const isMobile = window.innerWidth <= 720;
  document.body.classList.toggle('side-collapsed', !isMobile && sideCollapsed);
  const btn = document.getElementById('side-toggle-btn');
  if (btn) {
    const isExpanded = isMobile
      ? Boolean(document.getElementById('side')?.classList.contains('open'))
      : !sideCollapsed;
    btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    btn.title = isExpanded ? 'Collapse Left Navigation Bar' : 'Open Left Navigation Bar';
  }
}

function toggleSidebar() {
  if (window.innerWidth <= 720) {
    toggleMobileSide();
    applySidebarState();
    return;
  }
  sideCollapsed = !sideCollapsed;
  try {
    localStorage.setItem('shimla_admin_side_collapsed', sideCollapsed ? '1' : '0');
  } catch {}
  applySidebarState();
}

const ADMIN_I18N = {
  hi: {
    navlabel_work: 'मुख्य कामकाज',
    navlabel_insights: 'रिपोर्ट व सेटिंग्स',
    nav_dashboard: 'मुख्य पेज (Overview)',
    nav_products: 'प्रोडक्ट लिस्ट',
    nav_inventory: 'गोदाम व स्टॉक',
    nav_batches: 'बैच रिकॉर्ड',
    nav_orders: 'ऑर्डर व डिलीवरी',
    nav_customers: 'ग्राहक लिस्ट',
    nav_discounts: 'ऑफर व कूपन',
    nav_analytics: 'रिपोर्ट और कमाई',
    nav_content: 'वेबसाइट बदलाव',
    nav_settings: 'सेटिंग्स व पासवर्ड',
    btn_storefront: 'वेबसाइट देखें ↗',
    btn_logout: 'लॉगआउट',
    btn_sync: '↻ रिफ्रेश',
    btn_lab: 'लैब पेज ↗',
    search_placeholder: 'ऑर्डर नंबर, ग्राहक का नाम या फोन खोजें…',
    dash_eyebrow: 'व्यापार डैशबोर्ड',
    dash_title: 'आज का ताज़ा हिसाब',
    dash_sub: 'कमाई, ऑर्डर, बचा हुआ स्टॉक और जरूरी काम का सीधा हिसाब।',
    r_7: '7 दिन',
    r_14: '14 दिन',
    r_30: '30 दिन',
    r_all: 'सब',
    r_this_month: 'इस महीने',
    r_last_month: 'पिछला महीना',
    r_custom: 'कस्टम',
    kpi_v2_sales: 'कुल बिक्री (Sales)',
    kpi_v2_orders: 'कुल ऑर्डर (Orders)',
    kpi_v2_customers: 'कुल ग्राहक (Customers)',
    kpi_v2_aov: 'औसत बिल (AOV)',
    btn_wa_order: 'WhatsApp ऑर्डर',
    btn_add_prod: 'नया प्रोडक्ट',
    btn_orders_shortcut: 'ऑर्डर व डिलीवरी',
    btn_stock_shortcut: 'गोदाम व स्टॉक',
    btn_export_shortcut: 'CSV रिपोर्ट',
    kpi_rev_lbl: 'कुल पक्की कमाई',
    kpi_ord_lbl: 'पक्के ऑर्डर',
    kpi_stk_lbl: 'गोदाम में बचा माल',
    kpi_alt_lbl: 'जरूरी ध्यान / आज के काम',
    kpi_rep_lbl: 'दोबारा आए ग्राहक (Repeat)',
    kpi_vis_lbl: 'वेबसाइट विज़िट (Views)',
    wa_eyebrow: 'WHATSAPP ऑर्डर जाँच कतार',
    wa_title: 'वेबसाइट से आए ऑर्डर पक्के करें (Verify Buy)',
    wa_sub: 'ग्राहक ने वेबसाइट पर "Confirm Order on WhatsApp" दबाया है — जब आप Yes, Accept Buy दबाएंगे तभी सेल और स्टॉक अपडेट होगा।',
    btn_view_waiting: 'इंतज़ार वाले देखें →',
    chart_sub: 'माउस या उंगली ले जाकर हर दिन की पूरी कमाई देखें',
    chart_bars_tab: 'रोज़ ऑर्डर',
    chart_line_tab: 'कमाई लाइन (₹)',
    prog_title: 'कौन सा प्रोडक्ट कितना बिका',
    prog_rev: 'कमाई ₹',
    prog_units: 'पीस बिके',
    prog_views: 'देखा गया',
    sum_eyebrow: 'आसान हिसाब-किताब',
    sum_title: 'स्टोर का पूरा हाल (Summary)',
    sum_tab_stages: 'ऑर्डर स्थिति (Status)',
    sum_tab_products: 'कौन सा प्रोडक्ट बिका',
    sum_tab_payments: 'पैसे: UPI vs Cash',
    rep_eyebrow: 'ग्राहक भरोसा',
    rep_title: 'दोबारा आने वाले ग्राहक (Repeat)',
    rep_sub: 'जिन्होंने कम से कम 2 बार सामान मंगवाया है',
    vip_eyebrow: 'खास और बड़े ग्राहक',
    vip_title: 'सबसे बड़े खरीदार (VIP)',
    vip_sub: 'सबसे ज्यादा रकम की खरीदारी व बड़े ऑर्डर',
    vip_tab_buyers: 'बड़े ग्राहक',
    vip_tab_orders: 'सबसे बड़ा ऑर्डर',
    kan_eyebrow: 'ऑर्डर कहां तक पहुंचे',
    kan_title: 'काम की पाइपलाइन (Order Flow Board)',
    kan_btn_orders: 'पूरा ऑर्डर पेज खोलें →',
    kan_c1: 'WhatsApp जाँच बाकी',
    kan_c2: '2 दिन इंतज़ार',
    kan_c3: 'पक्का / पैकिंग',
    kan_c4: 'रास्ते में / पहुंच गए',
    drawer_title: 'अधिक जानकारी देखें (बचा हुआ स्टॉक टेबल, जरूरी अलर्ट और हाल के ऑर्डर)',
    drawer_pill: 'खोलने के लिए क्लिक करें ▾',
    sku_tbl_title: 'SKU बिका माल बनाम बचा स्टॉक',
    sku_tbl_sub: 'किस पैक के कितने डिब्बे बिके और कितने बचे हैं',
    btn_manage_stock: 'गोदाम खोलें →',
    th_sku_prod: 'प्रोडक्ट व पैक',
    th_sku_sold: 'बिका (पक्का)',
    th_sku_disp: 'भेजा गया',
    th_sku_res: 'रिज़र्व',
    th_sku_left: 'बचा हुआ',
    att_title: 'जरूरी अलर्ट (कम स्टॉक / फॉलो-अप)',
    act_title: 'ताज़ा गतिविधि',
    rec_title: 'हाल के ऑर्डर',
    rec_sub: 'सभी नए व पुराने ऑर्डर की लिस्ट',
    btn_view_all: 'सभी देखें →',
    th_ord_id: 'ऑर्डर नंबर',
    th_ord_cust: 'ग्राहक',
    th_ord_amt: 'रकम',
    th_ord_pay: 'पेमेंट',
    th_ord_st: 'स्थिति',
    notif_title: 'सूचनाएं (Notifications)',
    notif_mark_all: 'सभी पढ़ा हुआ',
    notif_restore: 'वापस लाएं'
  },
  en: {
    navlabel_work: 'WORKSPACE',
    navlabel_insights: 'BUSINESS INSIGHTS',
    nav_dashboard: 'Overview',
    nav_products: 'Products',
    nav_inventory: 'Stock & Inventory',
    nav_batches: 'Batch Records',
    nav_orders: 'Orders',
    nav_customers: 'Customers',
    nav_discounts: 'Offers & Discounts',
    nav_analytics: 'Reports & Analytics',
    nav_content: 'Website Content',
    nav_settings: 'Settings & Security',
    btn_storefront: 'Storefront ↗',
    btn_logout: 'Logout',
    btn_sync: '↻ Sync',
    btn_lab: 'Lab Page ↗',
    search_placeholder: 'Jump to order, customer, phone or SKU…',
    dash_eyebrow: 'BUSINESS DASHBOARD',
    dash_title: "Today's Business Overview",
    dash_sub: 'Real-time revenue, orders, remaining stock, and urgent actions from verified records.',
    r_7: '7D',
    r_14: '14D',
    r_30: 'Last 30D',
    r_all: 'All Time',
    r_this_month: 'This Month',
    r_last_month: 'Last Month',
    r_custom: 'Custom',
    kpi_v2_sales: 'Total Sales',
    kpi_v2_orders: 'Total Orders',
    kpi_v2_customers: 'Total Customers',
    kpi_v2_aov: 'Average Order Value',
    btn_wa_order: 'WhatsApp Order',
    btn_add_prod: 'Add Product',
    btn_orders_shortcut: 'Orders & Delivery',
    btn_stock_shortcut: 'Stock & Inventory',
    btn_export_shortcut: 'Export CSV',
    kpi_rev_lbl: 'Net Revenue (Paid & Dispatched)',
    kpi_ord_lbl: 'Confirmed Orders',
    kpi_stk_lbl: 'Remaining Stock',
    kpi_alt_lbl: 'Action Required / Urgent Tasks',
    kpi_rep_lbl: 'Repeat & VIP Customers',
    kpi_vis_lbl: 'Storefront Views',
    wa_eyebrow: 'WHATSAPP BUY VERIFICATION QUEUE',
    wa_title: 'Confirm Order on WhatsApp → Verify Buy Entries',
    wa_sub: 'Customers tapped "Confirm Order on WhatsApp" — click Yes, Accept Buy to update confirmed sales and reserve stock.',
    btn_view_waiting: 'View Waiting →',
    chart_sub: 'Hover or tap any day for full breakdown',
    chart_bars_tab: 'Daily Orders',
    chart_line_tab: 'Revenue Line (₹)',
    prog_title: 'Product Performance',
    prog_rev: 'Revenue ₹',
    prog_units: 'Units',
    prog_views: 'Views',
    sum_eyebrow: 'CLEAR STORE BREAKDOWN',
    sum_title: 'Store Summary & Splits',
    sum_tab_stages: 'Order Status',
    sum_tab_products: 'Top Products',
    sum_tab_payments: 'UPI vs Cash (COD)',
    rep_eyebrow: 'CUSTOMER LOYALTY',
    rep_title: 'Repeat Customers',
    rep_sub: 'Buyers who returned for 2 or more confirmed orders',
    vip_eyebrow: 'VIP & HIGHEST SALES',
    vip_title: 'Biggest Buyers & Top Orders',
    vip_sub: 'Highest cumulative buyers and single highest orders',
    vip_tab_buyers: 'Top Spenders',
    vip_tab_orders: 'Biggest Orders',
    kan_eyebrow: 'LIVE FULFILLMENT PIPELINE',
    kan_title: 'Order Flow Board',
    kan_btn_orders: 'Open Full Orders Tab →',
    kan_c1: 'Verify WhatsApp',
    kan_c2: 'Waiting Follow-Up',
    kan_c3: 'Confirmed / Packing',
    kan_c4: 'Dispatched & Delivered',
    drawer_title: 'More Details (SKU Stock Table, Urgent Alerts & Recent Orders)',
    drawer_pill: 'Click to expand ▾',
    sku_tbl_title: 'SKU Sales vs Remaining Stock',
    sku_tbl_sub: 'Units sold (confirmed & dispatched) vs remaining free stock',
    btn_manage_stock: 'Manage Stock →',
    th_sku_prod: 'Product & SKU',
    th_sku_sold: 'Sold (Buy)',
    th_sku_disp: 'Dispatched',
    th_sku_res: 'Reserved',
    th_sku_left: 'Remaining Left',
    att_title: 'Needs Your Attention',
    act_title: 'Recent Activity',
    rec_title: 'Recent Orders',
    rec_sub: 'Latest checkout & WhatsApp verified orders',
    btn_view_all: 'View all →',
    th_ord_id: 'Order',
    th_ord_cust: 'Customer',
    th_ord_amt: 'Amount',
    th_ord_pay: 'Payment',
    th_ord_st: 'Status',
    notif_title: 'Notifications',
    notif_mark_all: 'Mark all read',
    notif_restore: 'Restore dismissed'
  }
};

function updateAdminGreeting() {
  const el = document.getElementById('dash-greeting');
  if (!el) return;
  el.textContent = adminLang === 'en' ? "Today's Business Overview" : 'आज का ताज़ा हिसाब';
}

function applyAdminLang() {
  const dict = ADMIN_I18N[adminLang] || ADMIN_I18N.hi;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      const sp = el.querySelector('span');
      if (sp) {
        sp.textContent = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });
  const searchInp = document.getElementById('global-quick-search');
  if (searchInp && dict.search_placeholder) searchInp.placeholder = dict.search_placeholder;

  const btnEn = document.getElementById('lang-btn-en');
  const btnHi = document.getElementById('lang-btn-hi');
  if (btnEn && btnHi) {
    btnEn.classList.toggle('primary', adminLang === 'en');
    btnHi.classList.toggle('primary', adminLang === 'hi');
  }

  const navBtn = document.querySelector(`[data-tab="${currentTab}"]`);
  const crumbEl = document.getElementById('crumb');
  if (navBtn && crumbEl) {
    crumbEl.textContent = navBtn.querySelector('.nav-title')?.textContent.trim() || currentTab;
  }
  updateAdminGreeting();
}

function setAdminLang(lang) {
  adminLang = lang === 'en' ? 'en' : 'hi';
  try { localStorage.setItem('shimla_admin_lang', adminLang); } catch {}
  applyAdminLang();
  renderDashboard();
  renderNotificationsPanel();
  showToast(adminLang === 'en' ? 'Admin language switched to English' : 'एडमिन पोर्टल की भाषा हिंदी में बदल गई');
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cash(n) {
  return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return esc(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function showToast(msg, isError = false) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('error', Boolean(isError));
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

function toggleMobileSide(forceOpen) {
  const side = document.getElementById('side');
  const backdrop = document.getElementById('side-backdrop');
  const next = forceOpen !== undefined ? forceOpen : !side.classList.contains('open');
  side.classList.toggle('open', next);
  backdrop.classList.toggle('show', next);
}

// ── API Client (Cookie + Header Token with Auto 401 Lockout) ────
function getStoredToken() {
  return localStorage.getItem('swa_admin_token') || sessionStorage.getItem('swa_admin_token') || '';
}

function setStoredToken(token) {
  if (token) {
    try { localStorage.setItem('swa_admin_token', token); } catch(e) {}
    try { sessionStorage.setItem('swa_admin_token', token); } catch(e) {}
    try { document.documentElement.classList.add('swa-has-session'); } catch(e) {}
  } else {
    try { localStorage.removeItem('swa_admin_token'); } catch(e) {}
    try { sessionStorage.removeItem('swa_admin_token'); } catch(e) {}
    try { document.documentElement.classList.remove('swa-has-session'); } catch(e) {}
  }
}

async function apiFetch(url, options = {}) {
  const token = getStoredToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['X-Admin-Token'] = token;
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers, credentials: 'same-origin' });
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (res.status === 401) {
      setStoredToken('');
      showLoginScreen();
      throw new Error(data.error || 'Session expired — sign in again');
    }
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res;
}

// ── Authentication ──────────────────────────────────────────────
function showLoginScreen() {
  try { document.documentElement.classList.remove('swa-has-session'); } catch(e) {}
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-app').classList.add('is-hidden');
}

function showStudioApp() {
  try { document.documentElement.classList.add('swa-has-session'); } catch(e) {}
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').classList.remove('is-hidden');
}

async function doLogin() {
  const emailEl = document.getElementById('admin-email');
  const email = (emailEl && emailEl.value.trim()) || window.SHIMLA_FIREBASE_CONFIG?.adminEmail || 'admin@shimlawali.in';
  const pw = document.getElementById('admin-pw').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-submit-btn');
  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pw })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      errEl.textContent = data.error || 'Invalid credentials';
      errEl.style.display = 'block';
      return;
    }
    setStoredToken(data.token);
    document.getElementById('admin-pw').value = '';
    showStudioApp();
    await loadBootstrap();
    startLiveAutoSync();
  } catch (e) {
    errEl.textContent = e.message || 'Cannot reach server. Ensure node server.js is running.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In to Studio';
  }
}

async function doLogout() {
  try { await apiFetch('/api/admin/logout', { method: 'POST' }); } catch {}
  setStoredToken('');
  location.reload();
}

let autoSyncTimer = null;
let lastSyncAt = null;

function updateSyncBadge() {
  const pill = document.getElementById('live-sync-pill');
  if (!pill) return;
  if (!lastSyncAt) { pill.textContent = '● Connecting…'; return; }
  const t = lastSyncAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  pill.textContent = `● Live Synced ${t}`;
}

function isUserEditingOrModalOpen() {
  if (document.querySelector('.modalbg.show')) return true;
  const activeTag = (document.activeElement?.tagName || '').toLowerCase();
  return ['input', 'textarea', 'select'].includes(activeTag);
}

// ── Bootstrap & Navigation ──────────────────────────────────────
async function loadBootstrap(opts = {}) {
  const silent = Boolean(opts.silent);
  if (silent && document.hidden) return;
  try {
    const data = await apiFetch('/api/admin/bootstrap');
    state = { ...state, ...data };
    window.state = state;
    window.apiFetch = apiFetch;
    window.loadBootstrap = loadBootstrap;
    window.showToast = showToast;
    lastSyncAt = new Date();
    const adminName = state.admin || 'Owner';
    document.getElementById('admin-identity-label').textContent = adminName;
    const avInit = document.getElementById('top-avatar-initials');
    const avName = document.getElementById('top-avatar-name');
    if (avInit) {
      avInit.setAttribute('title', adminName);
    }
    if (avName) avName.textContent = adminName;
    const bName = (state.settings && state.settings.brand_name) || 'Shimla Wali';
    document.title = `${bName} — Business Studio Admin`;
    document.querySelectorAll('.side .brand').forEach(el => {
      el.innerHTML = `${esc(bName)}<small>BUSINESS STUDIO</small>`;
    });
    document.querySelectorAll('.login-logo').forEach(el => { el.textContent = bName; });
    const topCrumbLabel = document.querySelector('.top-left span');
    if (topCrumbLabel && topCrumbLabel.firstChild && topCrumbLabel.firstChild.nodeType === 3) {
      topCrumbLabel.firstChild.textContent = `${bName} / `;
    }
    updateSyncBadge();
    renderAllSections({ skipFormInputs: silent });
  } catch (err) {
    if (!silent) showToast(err.message, true);
  }
}

function startLiveAutoSync() {
  if (autoSyncTimer) clearInterval(autoSyncTimer);
  autoSyncTimer = setInterval(() => {
    if (document.getElementById('admin-app').classList.contains('is-hidden')) return;
    if (isUserEditingOrModalOpen()) return;
    loadBootstrap({ silent: true });
  }, 8000);
}

function tab(id) {
  currentTab = id;
  toggleNotifPopover(false);
  document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === id));
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  const navBtn = document.querySelector(`[data-tab="${id}"]`);
  if (navBtn) {
    const label = navBtn.querySelector('.nav-title')?.textContent.trim()
      || navBtn.querySelector('span')?.textContent.replace(/^[^\w]+/, '').trim()
      || id;
    document.getElementById('crumb').textContent = label;
  }
  toggleMobileSide(false);
  loadBootstrap({ silent: true });
  if (id === 'analytics') loadReports();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => tab(btn.dataset.tab));
  });
  document.addEventListener('click', ev => {
    const pop = document.getElementById('notif-popover');
    const bell = document.getElementById('notif-bell-btn');
    if (!pop || !pop.classList.contains('show')) return;
    if (!pop.contains(ev.target) && (!bell || !bell.contains(ev.target))) {
      toggleNotifPopover(false);
    }
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') toggleNotifPopover(false);
  });
  window.addEventListener('focus', () => {
    if (!document.getElementById('admin-app').classList.contains('is-hidden') && !isUserEditingOrModalOpen()) {
      loadBootstrap({ silent: true });
    }
  });
  applyAdminTheme();
  applySidebarState();
  applyAdminLang();
  updateBotToggleUI(localStorage.getItem('shimla_admin_bot_enabled') !== 'false');
  window.addEventListener('resize', applySidebarState);

  if (window.shimlaFirebaseBridge && window.shimlaFirebaseBridge.isEnabled()) {
    const emailWrap = document.getElementById('admin-email-wrap');
    const emailInp = document.getElementById('admin-email');
    const secNote = document.getElementById('login-security-note');
    const seedBtn = document.getElementById('btn-seed-firestore');
    if (emailWrap) emailWrap.style.display = 'none';
    if (emailInp) {
      emailInp.value = window.SHIMLA_FIREBASE_CONFIG?.adminEmail || 'admin@shimlawali.in';
    }
    if (secNote) secNote.textContent = 'Protected by Encrypted Passcode & Cloud Firestore Security Rules (₹0 Spark Mode).';
    if (seedBtn) seedBtn.style.display = 'inline-flex';
  }

  try {
    await apiFetch('/api/admin/session');
    showStudioApp();
    await loadBootstrap();
    startLiveAutoSync();
  } catch {
    showLoginScreen();
  }
});

function renderAllSections(opts = {}) {
  renderNavBadges();
  renderNotificationsPanel();
  renderDashboard();
  populateNicheSelects();
  renderProducts();
  renderInventory();
  renderMovements();
  renderBatches();
  renderOrders();
  renderCustomers();
  renderDiscounts();
  if (!opts.skipFormInputs || (currentTab !== 'content' && currentTab !== 'settings')) {
    loadContentCms();
    loadSettingsView();
  }
  if (currentTab === 'analytics') loadReports();
}

function getNotifStorageSet(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveNotifStorageSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify(Array.from(set).slice(-80))); } catch {}
}

function buildAdminNotifications() {
  const isEn = adminLang === 'en';
  const items = [];
  const orders = state.orders || [];
  const prodMap = new Map((state.products || []).map(p => [p.id, p]));

  orders.forEach(o => {
    const cust = o.customerSnapshot?.name || 'Customer';
    if (o.orderStatus === 'waiting_followup' && isFollowUpDueClient(o)) {
      items.push({
        id: `due:${o.orderId}`,
        tone: 'orange',
        icon: '⏰',
        title: isEn ? `Follow-up Due: ${o.orderId}` : `फॉलो-अप समय पूरा: ${o.orderId}`,
        desc: isEn ? `${cust} • ${cash(o.grandTotal)} ready for WhatsApp re-ask` : `${cust} • ${cash(o.grandTotal)} दोबारा पूछने के लिए तैयार`,
        time: o.followUpAt || o.createdAt,
        tab: 'orders',
        orderId: o.orderId,
        priority: 3
      });
    } else if (o.orderStatus === 'pending_whatsapp') {
      items.push({
        id: `wa:${o.orderId}`,
        tone: 'orange',
        icon: '💬',
        title: isEn ? `WhatsApp Verify Needed: ${cust}` : `WhatsApp जाँच बाकी: ${cust}`,
        desc: isEn ? `${o.orderId} • ${cash(o.grandTotal)} (${o.paymentMethod})` : `${o.orderId} • ${cash(o.grandTotal)} (${o.paymentMethod})`,
        time: o.createdAt,
        tab: 'dashboard',
        orderId: o.orderId,
        priority: 3
      });
    } else if (o.orderStatus && o.orderStatus.startsWith('return_')) {
      items.push({
        id: `ret:${o.orderId}:${o.orderStatus}`,
        tone: 'red',
        icon: '↩',
        title: isEn ? `Return Alert: ${o.orderId}` : `वापसी अलर्ट: ${o.orderId}`,
        desc: `${cust} • ${o.orderStatus.replace('_', ' ')}`,
        time: o.updatedAt || o.createdAt,
        tab: 'orders',
        orderId: o.orderId,
        priority: 4
      });
    } else if (o.paymentStatus === 'paid' && o.orderStatus === 'delivered') {
      items.push({
        id: `deliv:${o.orderId}`,
        tone: 'green',
        icon: '✓',
        title: isEn ? `Delivered & Paid: ${o.orderId}` : `पहुंच गया व पेड: ${o.orderId}`,
        desc: `${cust} • ${cash(o.grandTotal)}`,
        time: o.deliveredAt || o.updatedAt || o.createdAt,
        tab: 'orders',
        orderId: o.orderId,
        priority: 1
      });
    }
  });

  Object.values(state.inventory || {}).forEach(inv => {
    const free = Math.max(0, (inv.availableQty || 0) - (inv.reservedQty || 0));
    // Alert RED only when completely out of stock (0 units)
    // Alert YELLOW when critically low (1-2 units left)
    if (free <= 2) {
      const prod = prodMap.get(inv.productId);
      const isZero = free === 0;
      items.push({
        id: `stk:${inv.sku}:${free}`,
        tone: isZero ? 'red' : 'amber',
        icon: '!',
        title: isZero
          ? (isEn ? `Out of Stock: ${inv.sku}` : `स्टॉक खत्म: ${inv.sku}`)
          : (isEn ? `Critical Low Stock (≤2 left): ${inv.sku}` : `अत्यधिक कम स्टॉक (सिर्फ ${free} बचे): ${inv.sku}`),
        desc: `${prod?.title || inv.productId} (${inv.variantLabel}) • ${free} units left`,
        time: inv.updatedAt || new Date().toISOString(),
        tab: 'inventory',
        orderId: '',
        priority: isZero ? 4 : 2
      });
    }
  });

  (state.batches || []).forEach(b => {
    if (b.status === 'expired') {
      items.push({
        id: `bat:exp:${b.batchNumber}`,
        tone: 'red',
        icon: '⚠️',
        title: isEn ? `Batch Expired: ${b.batchNumber}` : `बैच एक्सपायर: ${b.batchNumber}`,
        desc: `${b.productName} • ${b.currentQuantity} units`,
        time: b.updatedAt || new Date().toISOString(),
        tab: 'batches',
        orderId: '',
        priority: 4
      });
    }
  });

  return items.sort((a, b) => (b.priority || 0) - (a.priority || 0) || (new Date(b.time || 0) - new Date(a.time || 0))).slice(0, 12);
}

function renderNotificationsPanel() {
  const listEl = document.getElementById('notif-list');
  const badgeEl = document.getElementById('notif-unread-badge');
  const countPill = document.getElementById('notif-count-pill');
  const resetBtn = document.getElementById('notif-reset-btn');
  if (!listEl) return;

  const isEn = adminLang === 'en';
  const readSet = getNotifStorageSet('shimla_admin_notif_read');
  const dismissedSet = getNotifStorageSet('shimla_admin_notif_dismiss');
  const all = buildAdminNotifications();
  const visible = all.filter(n => !dismissedSet.has(n.id));
  const unreadCount = visible.filter(n => !readSet.has(n.id)).length;
  const urgentUnreadCount = visible.filter(n => !readSet.has(n.id) && n.tone !== 'green').length;

  if (badgeEl) {
    badgeEl.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
    badgeEl.style.display = unreadCount > 0 ? 'grid' : 'none';
  }
  const ovBadge = document.getElementById('nav-overview-badge');
  if (ovBadge) {
    ovBadge.textContent = urgentUnreadCount > 9 ? '9+' : String(urgentUnreadCount);
    ovBadge.style.display = urgentUnreadCount > 0 ? 'inline-flex' : 'none';
  }
  if (countPill) countPill.textContent = String(visible.length);
  if (resetBtn) resetBtn.style.display = dismissedSet.size > 0 ? 'inline-block' : 'none';

  if (!visible.length) {
    listEl.innerHTML = `<div class="empty-state" style="padding:26px 12px;">${isEn ? 'All caught up — no pending alerts right now.' : 'सब ठीक है — अभी कोई नई सूचना बाकी नहीं है।'}</div>`;
    return;
  }

  listEl.innerHTML = visible.map(n => {
    const isUnread = !readSet.has(n.id);
    const encId = esc(n.id);
    return `
      <div class="notif-item ${isUnread ? 'unread' : ''}" onclick="handleNotifClick('${encId}', '${esc(n.tab)}', '${esc(n.orderId || '')}')">
        <div class="notif-ic ${esc(n.tone)}">${esc(n.icon)}</div>
        <div class="notif-body">
          <div class="notif-title-row">
            ${isUnread ? '<span class="notif-unread-pip"></span>' : ''}
            <span>${esc(n.title)}</span>
          </div>
          <div class="notif-desc">${esc(n.desc)}</div>
          <div class="notif-meta">${esc(fmtDateTime(n.time))}</div>
        </div>
        <button type="button" class="notif-dismiss" onclick="dismissNotif('${encId}', event)" title="Dismiss">&times;</button>
      </div>
    `;
  }).join('');
}

function toggleNotifPopover(forceState) {
  const pop = document.getElementById('notif-popover');
  const bell = document.getElementById('notif-bell-btn');
  if (!pop || !bell) return;
  const open = typeof forceState === 'boolean' ? forceState : !pop.classList.contains('show');
  pop.classList.toggle('show', open);
  bell.classList.toggle('open', open);
  bell.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) renderNotificationsPanel();
}

function markAllNotifsRead() {
  const readSet = getNotifStorageSet('shimla_admin_notif_read');
  buildAdminNotifications().forEach(n => readSet.add(n.id));
  saveNotifStorageSet('shimla_admin_notif_read', readSet);
  renderNotificationsPanel();
}

function dismissNotif(id, ev) {
  if (ev) ev.stopPropagation();
  const dismissed = getNotifStorageSet('shimla_admin_notif_dismiss');
  dismissed.add(id);
  saveNotifStorageSet('shimla_admin_notif_dismiss', dismissed);
  renderNotificationsPanel();
}

function resetDismissedNotifs() {
  try { localStorage.removeItem('shimla_admin_notif_dismiss'); } catch {}
  renderNotificationsPanel();
}

function handleNotifClick(id, targetTab, orderId) {
  const readSet = getNotifStorageSet('shimla_admin_notif_read');
  readSet.add(id);
  saveNotifStorageSet('shimla_admin_notif_read', readSet);
  toggleNotifPopover(false);
  if (targetTab && targetTab !== currentTab) tab(targetTab);
  if (orderId && typeof openOrderDetails === 'function') openOrderDetails(orderId);
  renderNotificationsPanel();
}

function renderNavBadges() {
  const orders = state.orders || [];
  const invList = Object.values(state.inventory || {});

  // 1. Stock & Inventory: Alert only for 0 units (RED) or <= 2 units (YELLOW)
  const zeroStock = invList.filter(i => Math.max(0, (i.availableQty || 0) - (i.reservedQty || 0)) === 0);
  const critStock = invList.filter(i => {
    const free = Math.max(0, (i.availableQty || 0) - (i.reservedQty || 0));
    return free > 0 && free <= 2;
  });
  const urgentStockCount = zeroStock.length + critStock.length;
  const lowBadge = document.getElementById('nav-low-badge');
  if (lowBadge) {
    lowBadge.textContent = String(urgentStockCount);
    lowBadge.className = 'nav-badge';
    if (urgentStockCount > 0) {
      if (zeroStock.length > 0) lowBadge.classList.add('badge-red');
      else lowBadge.classList.add('badge-yellow');
      lowBadge.style.display = 'inline-flex';
    } else {
      lowBadge.style.display = 'none';
    }
  }

  // 2. Orders & Delivery: WhatsApp verify or Due follow-up -> ORANGE; Return -> RED
  const waOrders = orders.filter(o => o.orderStatus === 'pending_whatsapp');
  const dueOrders = orders.filter(isFollowUpDueClient);
  const returnOrders = orders.filter(o => String(o.orderStatus || '').startsWith('return_'));
  const pendingCount = waOrders.length + dueOrders.length + returnOrders.length;
  const pendBadge = document.getElementById('nav-pending-badge');
  if (pendBadge) {
    pendBadge.textContent = String(pendingCount);
    pendBadge.className = 'nav-badge';
    if (pendingCount > 0) {
      if (returnOrders.length > 0) pendBadge.classList.add('badge-red');
      else pendBadge.classList.add('badge-orange');
      pendBadge.style.display = 'inline-flex';
    } else {
      pendBadge.style.display = 'none';
    }
  }

  // 3. Overview badge: highest risk color among active alerts
  const ovBadge = document.getElementById('nav-overview-badge');
  if (ovBadge) {
    const notifs = buildAdminNotifications();
    const dismissedSet = getNotifStorageSet('shimla_admin_notif_dismiss');
    const readSet = getNotifStorageSet('shimla_admin_notif_read');
    const urgentNotifs = notifs.filter(n => !dismissedSet.has(n.id) && !readSet.has(n.id) && n.tone !== 'green');
    ovBadge.textContent = urgentNotifs.length > 9 ? '9+' : String(urgentNotifs.length);
    ovBadge.className = 'nav-badge';
    if (urgentNotifs.length > 0) {
      const hasRed = urgentNotifs.some(n => n.tone === 'red');
      const hasOrange = urgentNotifs.some(n => n.tone === 'orange');
      if (hasRed) ovBadge.classList.add('badge-red');
      else if (hasOrange) ovBadge.classList.add('badge-orange');
      else ovBadge.classList.add('badge-yellow');
      ovBadge.style.display = 'inline-flex';
    } else {
      ovBadge.style.display = 'none';
    }
  }
}

// ── 1. Dashboard Overview ───────────────────────────────────────
function isFollowUpDueClient(o) {
  if (!o || o.orderStatus !== 'waiting_followup' || !o.followUpAt) return false;
  const t = new Date(o.followUpAt).getTime();
  return Number.isFinite(t) && t <= Date.now();
}

function formatFollowUpMeta(iso) {
  if (!iso) return 'Not scheduled';
  const diffMs = new Date(iso).getTime() - Date.now();
  const dateTxt = fmtDateTime(iso);
  if (diffMs <= 0) {
    const passedHrs = Math.max(0, Math.round(Math.abs(diffMs) / 3600000));
    return passedHrs >= 24
      ? `Due now (${Math.round(passedHrs / 24)}d past)`
      : `Due now (scheduled ${dateTxt})`;
  }
  const hrsLeft = Math.ceil(diffMs / 3600000);
  if (hrsLeft >= 24) {
    const dLeft = Math.floor(hrsLeft / 24);
    const remH = hrsLeft % 24;
    return `Re-ask ${dateTxt} (in ${dLeft}d${remH ? ' ' + remH + 'h' : ''})`;
  }
  return `Re-ask ${dateTxt} (in ${hrsLeft}h)`;
}

function openOrdersFiltered(statusVal) {
  orderFilter = statusVal || 'all';
  tab('orders');
  document.querySelectorAll('#order-status-tabs .fpill').forEach(b => {
    b.classList.toggle('active', b.dataset.ostatus === orderFilter);
  });
  renderOrders();
}

function renderVerificationQueue() {
  const wrapCard = document.getElementById('dash-verification-section');
  const listEl = document.getElementById('dash-verification-list');
  const waitPill = document.getElementById('verify-waiting-pill');
  if (!wrapCard || !listEl) return;

  const orders = state.orders || [];
  const dueFollowUps = orders.filter(o => isFollowUpDueClient(o));
  const freshEntries = orders.filter(o => o.orderStatus === 'pending_whatsapp');
  const waitingLater = orders.filter(o => o.orderStatus === 'waiting_followup' && !isFollowUpDueClient(o));

  if (waitPill) {
    waitPill.textContent = `${waitingLater.length} Waiting (Snoozed)`;
    waitPill.style.display = waitingLater.length > 0 ? 'inline-flex' : 'none';
  }
  wrapCard.classList.toggle('has-due', dueFollowUps.length > 0);

  const actionQueue = [...dueFollowUps, ...freshEntries];
  if (actionQueue.length === 0) {
    listEl.innerHTML = waitingLater.length > 0
      ? `<div class="empty-state" style="padding:14px;">Abhi koi pending buy verification nahi hai. <strong>${waitingLater.length} order(s)</strong> "Wait karo" list mein hain — time pura hote hi yahin poochha jayega.</div>`
      : `<div class="empty-state" style="padding:14px;">Website par abhi kisi naye "Confirm Order on WhatsApp" entry ki verification pending nahi hai.</div>`;
    return;
  }

  listEl.innerHTML = actionQueue.map(o => {
    const isDue = isFollowUpDueClient(o);
    const itemsSummary = (o.itemsSnapshot || []).map(i => `${i.productName} (${i.variantLabel}) × ${i.quantity}`).join(', ');
    const rawPhone = o.customerSnapshot?.phone || '';
    const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
    const brandName = (state.settings && state.settings.brand_name) || 'Shimla Wali';
    const waText = encodeURIComponent(`Hi ${o.customerSnapshot?.name || ''}, your ${brandName} order ${o.orderId} (${itemsSummary}, Total ₹${o.grandTotal}) is ready for confirmation. Please confirm on WhatsApp to proceed!`);
    return `
      <div class="verify-entry ${isDue ? 'is-due' : 'is-fresh'}">
        <div class="verify-entry-main">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="pill ${isDue ? 'warn' : 'info'}">${isDue ? '⏰ Wait Complete — Ask Again!' : '🛒 Reached Buy / WhatsApp'}</span>
            <strong>${esc(o.orderId)}</strong>
            <span class="tiny">${esc(fmtDateTime(o.whatsappClickedAt || o.createdAt))}</span>
          </div>
          <div style="margin-top:5px;font-size:13px;">
            <strong>${esc(o.customerSnapshot?.name || 'Customer')}</strong> (+91 ${esc(cleanPhone || rawPhone)}) &bull; <strong>${cash(o.grandTotal)}</strong> (${esc(o.paymentMethod)})
          </div>
          <div class="tiny" style="margin-top:2px;">${esc(itemsSummary)}</div>
          ${o.verificationNotes ? `<div class="tiny" style="color:var(--warn-fg);margin-top:2px;">Previous note: ${esc(o.verificationNotes)}</div>` : ''}
          <div class="verify-entry-q">Kya isko Confirmed Buy mein consider karein? ${isDue ? '(2-day follow-up due!)' : ''}</div>
        </div>
        <div class="verify-entry-actions">
          <button type="button" class="btn sm primary" onclick="openVerifyBuyModal('${esc(o.orderId)}','accept')">Yes, Accept Buy</button>
          <button type="button" class="btn sm gold" onclick="quickWaitOrder('${esc(o.orderId)}', 2)">Wait (2d)</button>
          <button type="button" class="btn sm" onclick="openVerifyBuyModal('${esc(o.orderId)}','wait')">More Options</button>
          <button type="button" class="btn sm danger" onclick="openVerifyBuyModal('${esc(o.orderId)}','not_bought')">Not Bought</button>
          ${cleanPhone ? `<a class="btn sm" href="https://wa.me/91${cleanPhone}?text=${waText}" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderStockVsSalesOverview() {
  const tbody = document.getElementById('dash-stock-sales-tbody');
  if (!tbody) return;
  const rows = (state.metrics && state.metrics.skuStockAndSales) || [];
  const sorted = [...rows].sort((a, b) => (b.acceptedSoldQty - a.acceptedSoldQty) || (a.remainingFreeQty - b.remainingFreeQty)).slice(0, 10);
  tbody.innerHTML = sorted.length ? sorted.map(r => {
    const lowCls = r.remainingFreeQty <= 0 ? 'bad' : r.remainingFreeQty <= (r.reorderThreshold || 8) ? 'warn' : '';
    return `
      <tr>
        <td><strong>${esc(r.productName)}</strong><div class="tiny"><span class="sku-code">${esc(r.sku)}</span> ${esc(r.variantLabel)}</div></td>
        <td><strong>${r.acceptedSoldQty}</strong></td>
        <td>${r.dispatchedSoldQty}</td>
        <td>${r.reservedQty}</td>
        <td><span class="pill ${lowCls}">${r.remainingFreeQty} left</span></td>
      </tr>
    `;
  }).join('') : '<tr><td colspan="5" class="empty-state">No SKU records loaded yet.</td></tr>';
}

let dashRangeDays = 'this_month';
window.dashRangeDays = dashRangeDays;
let dashProgMode = 'revenue';
let dashDonutMode = 'stages';
let dashChartMode = 'bars';
let dashVipMode = 'buyers';

const STUDIO_PALETTE = ['#16D69A', '#4DA3FF', '#A78BFA', '#F5B942', '#FF6B72', '#32E6A6', '#38BDF8', '#C084FC'];

function setDashRange(val) {
  dashRangeDays = val;
  window.dashRangeDays = val;
  document.querySelectorAll('#dash-range-pills .range-btn').forEach(b => {
    b.classList.toggle('active', String(b.dataset.range) === String(dashRangeDays));
  });
  const customBox = document.getElementById('dash-custom-range-box');
  if (customBox && val !== 'custom') {
    customBox.style.display = 'none';
  }
  renderDashboard();
}
window.setDashRange = setDashRange;

function toggleDashCustomRange() {
  const box = document.getElementById('dash-custom-range-box');
  if (!box) return;
  const isHidden = box.style.display === 'none' || !box.style.display;
  box.style.display = isHidden ? 'inline-flex' : 'none';
  if (isHidden) {
    const now = new Date();
    const past = new Date(Date.now() - 30 * 86400000);
    const fromInp = document.getElementById('dash-custom-from');
    const toInp = document.getElementById('dash-custom-to');
    if (fromInp && !fromInp.value) fromInp.value = past.toISOString().slice(0, 10);
    if (toInp && !toInp.value) toInp.value = now.toISOString().slice(0, 10);
  }
}
window.toggleDashCustomRange = toggleDashCustomRange;

function applyDashCustomRange() {
  const fromVal = document.getElementById('dash-custom-from')?.value;
  const toVal = document.getElementById('dash-custom-to')?.value;
  if (!fromVal || !toVal) {
    if (typeof showToast === 'function') showToast('Please select both start and end dates', true);
    return;
  }
  setDashRange('custom');
}
window.applyDashCustomRange = applyDashCustomRange;

function setDashProgMode(mode) {
  dashProgMode = mode || 'revenue';
  document.querySelectorAll('#prog-mode-tabs .mini-tab').forEach(b => b.classList.toggle('active', b.dataset.prog === dashProgMode));
  renderProductProgress();
}
window.setDashProgMode = setDashProgMode;

function setDashDonutMode(mode) {
  dashDonutMode = mode || 'stages';
  document.querySelectorAll('#donut-mode-tabs .mini-tab').forEach(b => b.classList.toggle('active', b.dataset.donut === dashDonutMode));
  renderCategoryMix((state.metrics && state.metrics.productSalesDistribution) || []);
}
window.setDashDonutMode = setDashDonutMode;

function setDashChartMode(mode) {
  dashChartMode = mode || 'bars';
  document.querySelectorAll('#chart-mode-tabs .mini-tab').forEach(b => b.classList.toggle('active', b.dataset.cmode === dashChartMode));
  renderSalesChart((state.metrics && state.metrics.dailySeries) || []);
}
window.setDashChartMode = setDashChartMode;

function setDashVipMode(mode) {
  dashVipMode = mode || 'buyers';
  document.querySelectorAll('#vip-mode-tabs .mini-tab').forEach(b => b.classList.toggle('active', b.dataset.vmode === dashVipMode));
  renderRepeatAndVipCustomers();
}
window.setDashVipMode = setDashVipMode;

function getDashTimeWindows() {
  const now = new Date();
  const isEn = adminLang === 'en';

  if (dashRangeDays === 'this_month') {
    const curStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
    const curEnd = now.getTime();
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0).getTime();
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
    return {
      curStart,
      curEnd,
      prevStart,
      prevEnd,
      deltaLabel: isEn ? 'vs. last month' : 'पिछले महीने से'
    };
  }

  if (dashRangeDays === 'last_month') {
    const curStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0).getTime();
    const curEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0).getTime();
    const prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999).getTime();
    return {
      curStart,
      curEnd,
      prevStart,
      prevEnd,
      deltaLabel: isEn ? 'vs. previous month' : 'पिछले महीने से'
    };
  }

  if (dashRangeDays === 30 || dashRangeDays === '30' || dashRangeDays === 14 || dashRangeDays === 7) {
    const days = Number(dashRangeDays) || 30;
    const durMs = days * 86400000;
    const curEnd = now.getTime();
    const curStart = curEnd - durMs;
    const prevEnd = curStart;
    const prevStart = prevEnd - durMs;
    return {
      curStart,
      curEnd,
      prevStart,
      prevEnd,
      deltaLabel: isEn ? `vs. prev ${days}D` : `पिछले ${days} दिनों से`
    };
  }

  if (dashRangeDays === 'custom') {
    const fromVal = document.getElementById('dash-custom-from')?.value;
    const toVal = document.getElementById('dash-custom-to')?.value;
    const curStart = fromVal ? new Date(fromVal + 'T00:00:00').getTime() : 0;
    const curEnd = toVal ? new Date(toVal + 'T23:59:59').getTime() : now.getTime();
    const dur = Math.max(86400000, curEnd - curStart);
    const prevEnd = curStart;
    const prevStart = prevEnd - dur;
    return {
      curStart,
      curEnd,
      prevStart,
      prevEnd,
      deltaLabel: isEn ? 'vs. prev period' : 'पिछले समय से'
    };
  }

  // All time
  return {
    curStart: 0,
    curEnd: Infinity,
    prevStart: null,
    prevEnd: null,
    deltaLabel: isEn ? 'all-time total' : 'शुरू से अब तक'
  };
}

function getFilteredDashOrders() {
  const orders = state.orders || [];
  const { curStart, curEnd } = getDashTimeWindows();
  return orders.filter(o => {
    const t = new Date(o.createdAt || 0).getTime();
    return Number.isFinite(t) && t >= curStart && t <= curEnd;
  });
}

function calculateWindowKpis(orders, startMs, endMs) {
  const windowOrders = orders.filter(o => {
    const t = new Date(o.createdAt || 0).getTime();
    if (!Number.isFinite(t)) return false;
    if (startMs !== null && startMs !== undefined && t < startMs) return false;
    if (endMs !== null && endMs !== undefined && t > endMs) return false;
    return true;
  });

  const isPaidOrder = o => (o.paymentStatus === 'paid' || o.paymentStatus === 'partially_refunded');

  const accepted = windowOrders.filter(o =>
    !['pending_whatsapp', 'waiting_followup', 'cancelled'].includes(o.orderStatus) &&
    o.paymentStatus !== 'refunded'
  );

  // Total Sales strictly includes realized/paid revenue (COD orders ONLY count once payment received)
  const paidSalesOrders = accepted.filter(isPaidOrder);

  const totalSales = paidSalesOrders.reduce((sum, o) => {
    const amt = Number(o.grandTotal ?? o.agreedTotalOverride ?? o.subtotal ?? o.total ?? o.finalAmount ?? o.orderTotal ?? 0);
    return sum + (Number.isFinite(amt) ? amt : 0);
  }, 0);

  const totalOrders = accepted.length;

  const custSet = new Set();
  accepted.forEach(o => {
    const key = o.customerSnapshot?.phone || o.customerSnapshot?.email || o.customerPhone || o.phone || o.customerEmail || o.email || o.customerId || o.shippingAddress?.phone;
    if (key) custSet.add(String(key).trim());
  });
  const totalCustomers = custSet.size;

  const aov = paidSalesOrders.length > 0 ? Math.round(totalSales / paidSalesOrders.length) : 0;

  return { totalSales, totalOrders, totalCustomers, aov, accepted, paidSalesOrders };
}

function computeDeltaBadgeHtml(curr, prev, deltaLabel) {
  if (prev === null || prev === undefined) {
    return `<span class="delta-badge delta-neutral">&bull;</span> <span class="delta-label">${esc(deltaLabel)}</span>`;
  }
  if (prev === 0) {
    if (curr > 0) {
      return `<span class="delta-badge delta-pos">&uarr; 100%</span> <span class="delta-label">${esc(deltaLabel)}</span>`;
    }
    return `<span class="delta-badge delta-neutral">&mdash; 0.0%</span> <span class="delta-label">${esc(deltaLabel)}</span>`;
  }
  const diff = curr - prev;
  const pct = Math.abs((diff / prev) * 100);
  const formatted = pct.toFixed(1) + '%';
  if (diff > 0) {
    return `<span class="delta-badge delta-pos">&uarr; ${formatted}</span> <span class="delta-label">${esc(deltaLabel)}</span>`;
  } else if (diff < 0) {
    return `<span class="delta-badge delta-neg">&darr; ${formatted}</span> <span class="delta-label">${esc(deltaLabel)}</span>`;
  }
  return `<span class="delta-badge delta-neutral">&mdash; 0.0%</span> <span class="delta-label">${esc(deltaLabel)}</span>`;
}

function isAcceptedOrderRow(o) {
  return o && !['pending_whatsapp', 'waiting_followup', 'cancelled'].includes(o.orderStatus) && o.paymentStatus !== 'refunded';
}

function buildSvgDonutHtml(segments, centerVal, centerLbl, emptyMsg) {
  const total = segments.reduce((s, d) => s + (Number(d.value) || 0), 0);
  if (!segments.length || total <= 0) {
    return `<div class="empty-state" style="width:100%;padding:26px 10px;">${esc(emptyMsg || 'अभी कोई डेटा उपलब्ध नहीं है।')}</div>`;
  }
  const R = 64;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const circles = segments.filter(s => s.value > 0).map(seg => {
    const frac = seg.value / total;
    const len = frac * C;
    const dashArray = `${len.toFixed(2)} ${(C - len).toFixed(2)}`;
    const dashOffset = (-offset).toFixed(2);
    offset += len;
    return `<circle cx="88" cy="88" r="${R}" fill="none" stroke="${seg.color}" stroke-width="24" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}" stroke-linecap="butt"><title>${esc(seg.label)}: ${esc(seg.displayVal)} (${Math.round(frac * 100)}%)</title></circle>`;
  }).join('');

  const ringTrack = adminTheme === 'light' ? 'rgba(19, 34, 28, 0.09)' : 'rgba(255,255,255,0.07)';
  return `
    <div class="svg-donut-wrap">
      <div class="svg-donut-box">
        <svg viewBox="0 0 176 176" width="100%" height="100%" style="transform:rotate(-90deg);">
          <circle cx="88" cy="88" r="${R}" fill="none" stroke="${ringTrack}" stroke-width="24"></circle>
          ${circles}
        </svg>
        <div class="svg-donut-center">
          <strong>${esc(centerVal)}</strong>
          <span>${esc(centerLbl)}</span>
        </div>
      </div>
      <div class="donut-legend-grid">
        ${segments.slice(0, 6).map(seg => {
          const pct = Math.round((seg.value / total) * 100);
          return `
            <div class="donut-leg-item">
              <span class="donut-leg-left">
                <span class="legend-dot" style="background:${seg.color};flex:none;"></span>
                <span style="overflow:hidden;text-overflow:ellipsis;">${esc(seg.label)}</span>
              </span>
              <span class="donut-leg-right">
                <strong>${esc(seg.displayVal)}</strong>
                <span class="leg-pct-pill">${pct}%</span>
              </span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderDashboard() {
  const m = state.metrics || {};
  const orders = state.orders || [];
  const customers = state.customers || [];
  const isEn = adminLang === 'en';

  // Dynamic Action Summary in Dashboard Header
  const waCount = orders.filter(o => o.orderStatus === 'pending_whatsapp').length;
  const dueCount = orders.filter(isFollowUpDueClient).length;
  const invList = Object.values(state.inventory || {});
  const zeroStockUnits = invList.filter(i => Math.max(0, (i.availableQty || 0) - (i.reservedQty || 0)) === 0).length;
  const critLowUnits = invList.filter(i => {
    const free = Math.max(0, (i.availableQty || 0) - (i.reservedQty || 0));
    return free > 0 && free <= 2;
  }).length;
  const returnTasks = orders.filter(o => String(o.orderStatus || '').startsWith('return_')).length;

  const actSumEl = document.getElementById('dash-action-summary');
  if (actSumEl) {
    const actions = [];
    if (waCount > 0) actions.push(isEn ? `<strong>${waCount}</strong> WhatsApp verify needed` : `<strong>${waCount}</strong> नए WhatsApp ऑर्डर जाँच बाकी`);
    if (dueCount > 0) actions.push(isEn ? `<strong>${dueCount}</strong> follow-up due today` : `<strong>${dueCount}</strong> फॉलो-अप आज जरूरी`);
    if (zeroStockUnits > 0) actions.push(isEn ? `<strong>${zeroStockUnits}</strong> out of stock` : `<strong>${zeroStockUnits}</strong> प्रोडक्ट स्टॉक खत्म`);
    if (critLowUnits > 0) actions.push(isEn ? `<strong>${critLowUnits}</strong> low stock (≤2)` : `<strong>${critLowUnits}</strong> कम स्टॉक (≤2)`);
    if (returnTasks > 0) actions.push(isEn ? `<strong>${returnTasks}</strong> return pending` : `<strong>${returnTasks}</strong> वापसी अनुरोध`);
    if (!actions.length) {
      actSumEl.textContent = isEn ? 'All caught up — no urgent action pending today.' : 'सब ठीक है — आज कोई भी जरूरी काम पेंडिंग नहीं है।';
    } else {
      actSumEl.innerHTML = actions.join(' &bull; ');
    }
  }

  // ── Executive 4-Card Hero Calculations ──
  const win = getDashTimeWindows();
  const allOrders = state.orders || [];
  const currKpis = calculateWindowKpis(allOrders, win.curStart, win.curEnd);
  const prevKpis = win.prevStart !== null ? calculateWindowKpis(allOrders, win.prevStart, win.prevEnd) : null;

  // 1. Total Sales
  const salesValEl = document.getElementById('kpi-net-revenue');
  if (salesValEl) salesValEl.textContent = cash(currKpis.totalSales);
  const salesDeltaEl = document.getElementById('kpi-v2-sales-delta');
  if (salesDeltaEl) salesDeltaEl.innerHTML = computeDeltaBadgeHtml(currKpis.totalSales, prevKpis ? prevKpis.totalSales : null, win.deltaLabel);

  // 2. Total Orders
  const ordersValEl = document.getElementById('kpi-orders-confirmed');
  if (ordersValEl) ordersValEl.textContent = currKpis.totalOrders.toLocaleString('en-IN');
  const ordersDeltaEl = document.getElementById('kpi-v2-orders-delta');
  if (ordersDeltaEl) ordersDeltaEl.innerHTML = computeDeltaBadgeHtml(currKpis.totalOrders, prevKpis ? prevKpis.totalOrders : null, win.deltaLabel);

  // 3. Total Customers
  const custValEl = document.getElementById('kpi-v2-customers-val');
  if (custValEl) custValEl.textContent = currKpis.totalCustomers.toLocaleString('en-IN');
  const custDeltaEl = document.getElementById('kpi-v2-customers-delta');
  if (custDeltaEl) custDeltaEl.innerHTML = computeDeltaBadgeHtml(currKpis.totalCustomers, prevKpis ? prevKpis.totalCustomers : null, win.deltaLabel);

  // 4. Average Order Value
  const aovValEl = document.getElementById('kpi-v2-aov-val');
  if (aovValEl) aovValEl.textContent = cash(currKpis.aov);
  const aovDeltaEl = document.getElementById('kpi-v2-aov-delta');
  if (aovDeltaEl) aovDeltaEl.innerHTML = computeDeltaBadgeHtml(currKpis.aov, prevKpis ? prevKpis.aov : null, win.deltaLabel);

  // ── Backward Compatibility Helpers for Auxiliary / Test Elements ──
  const pendingAmt = m.pendingPaymentsTotal || 0;
  const soldUnits = m.acceptedUnitsSold || 0;
  const inTransitUnits = m.inTransitUnitsSold ?? 0;
  const delivUnits = m.deliveredUnitsSold ?? 0;

  const stockMetaEl = document.getElementById('kpi-products-meta');
  if (stockMetaEl) {
    const metaParts = [];
    if (soldUnits > 0) metaParts.push(`${soldUnits} units sold`);
    if (delivUnits > 0) metaParts.push(`${delivUnits} delivered`);
    if (inTransitUnits > 0) metaParts.push(`${inTransitUnits} dispatched`);
    metaParts.push(`${m.totalActiveProducts || 0} active products`);
    stockMetaEl.textContent = metaParts.join(' · ');
  }

  const stockUnitsEl = document.getElementById('kpi-stock-units');
  if (stockUnitsEl) stockUnitsEl.textContent = `${m.totalAvailableUnits || 0} units`;

  const paidDispEl = document.getElementById('kpi-paid-dispatched');
  if (paidDispEl) paidDispEl.textContent = `${soldUnits} sold`;

  const revPill = document.getElementById('kpi-rev-pill');
  if (revPill) revPill.textContent = cash(currKpis.totalSales);

  const aovPill = document.getElementById('kpi-aov-pill');
  if (aovPill) aovPill.textContent = `Avg Bill ${cash(currKpis.aov)}`;

  const stockPill = document.getElementById('kpi-stock-pill');
  if (stockPill) stockPill.textContent = `${m.totalSkus || 0} SKUs`;

  const urgentTotal = zeroStockUnits + critLowUnits + waCount + dueCount + returnTasks;
  const lowCntEl = document.getElementById('kpi-low-count');
  if (lowCntEl) lowCntEl.textContent = String(urgentTotal);

  const alertPill = document.getElementById('kpi-alert-pill');
  if (alertPill) alertPill.textContent = urgentTotal === 0 ? (isEn ? '✓ All Clear' : '✓ सब ठीक') : `${urgentTotal} tasks`;

  const custMetaEl = document.getElementById('kpi-cust-meta');
  if (custMetaEl) custMetaEl.textContent = urgentTotal === 0 ? 'All clear' : `${urgentTotal} urgent tasks`;

  const repeatList = customers.filter(c => (c.totalOrders || 0) >= 2);
  const repeatRate = customers.length > 0 ? Math.round((repeatList.length / customers.length) * 100) : 0;
  const topSpender = [...customers].sort((a, b) => (b.acceptedSpend || 0) - (a.acceptedSpend || 0))[0];
  const repCountEl = document.getElementById('kpi-repeat-count');
  const repMetaEl = document.getElementById('kpi-repeat-meta');
  const repPillEl = document.getElementById('kpi-repeat-pill');
  if (repCountEl) repCountEl.textContent = `${repeatList.length} / ${customers.length}`;
  if (repPillEl) repPillEl.textContent = isEn ? `${repeatRate}% repeat` : `${repeatRate}% दोबारा`;
  if (repMetaEl) {
    repMetaEl.innerHTML = repeatList.length > 0 && topSpender
      ? (isEn
        ? `Top buyer: <strong>${esc(topSpender.name)} (${cash(topSpender.acceptedSpend || topSpender.verifiedSpend)})</strong>`
        : `सबसे बड़े ग्राहक: <strong>${esc(topSpender.name)} (${cash(topSpender.acceptedSpend || topSpender.verifiedSpend)})</strong>`)
      : (isEn
        ? 'No repeat buyer yet — appears once a customer orders twice'
        : 'अभी कोई Repeat ग्राहक नहीं — दूसरी बार खरीदने पर दिखेगा');
  }

  const totalViews = (m.traffic && m.traffic.totalViews) || 0;
  const prodViewsObj = (m.traffic && m.traffic.productViews) || {};
  const topViewEntry = Object.entries(prodViewsObj).sort((a, b) => b[1] - a[1])[0];
  const topViewProd = topViewEntry ? (state.products.find(p => p.id === topViewEntry[0])?.title || topViewEntry[0]) : '—';
  const viewConv = totalViews > 0 ? ((orders.length / totalViews) * 100).toFixed(1) : '0.0';
  const trafEl = document.getElementById('kpi-traffic-views');
  const trafMetaEl = document.getElementById('kpi-traffic-meta');
  const trafPillEl = document.getElementById('kpi-traffic-pill');
  if (trafEl) trafEl.textContent = totalViews.toLocaleString('en-IN');
  if (trafPillEl) trafPillEl.textContent = isEn ? `${viewConv}% view→buy` : `${viewConv}% ऑर्डर`;
  if (trafMetaEl) {
    trafMetaEl.textContent = topViewEntry
      ? (isEn ? `Top viewed: ${topViewProd} (${topViewEntry[1]} views)` : `सबसे ज्यादा देखा: ${topViewProd} (${topViewEntry[1]} बार)`)
      : (isEn ? 'First-party views recorded automatically as visitors browse' : 'जैसे ही ग्राहक वेबसाइट देखेंगे, गिनती यहां अपने आप दिखेगी');
  }

  document.getElementById('kpi-delivered-rev-pill').textContent = isEn
    ? `Delivered & Paid Revenue: ${cash(m.deliveredPaidRevenue)}`
    : `पहुंचने के बाद मिली कमाई: ${cash(m.deliveredPaidRevenue)}`;

  renderVerificationQueue();
  renderProductProgress();
  renderCategoryMix(m.productSalesDistribution || []);
  renderSalesChart(m.dailySeries || []);
  renderRepeatAndVipCustomers();
  renderOrderPipelineKanban();
  renderStockVsSalesOverview();

  // Recent Orders table
  const recentTbody = document.getElementById('dash-recent-orders');
  const recentOrders = orders.slice(0, 6);
  recentTbody.innerHTML = recentOrders.length
    ? recentOrders.map(o => `
      <tr style="cursor:pointer;" onclick="openOrderDetails('${esc(o.orderId)}')">
        <td><strong>${esc(o.orderId)}</strong><div class="tiny">${esc(fmtDateTime(o.createdAt))}</div></td>
        <td>${esc(o.customerSnapshot?.name || 'Customer')}</td>
        <td><strong>${cash(o.grandTotal)}</strong></td>
        <td>${renderPayPill(o.paymentStatus)}</td>
        <td>${renderOrderStatusPill(o)}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="5" class="empty-state">No real customer orders yet. Requests from checkout.html appear here automatically.</td></tr>';

  // Attention Items
  const alerts = [];
  if ((m.dueFollowUpCount || 0) > 0) {
    alerts.push({
      label: `${m.dueFollowUpCount} Waiting order(s) completed 2-day timer — ask again!`,
      badge: 'Re-Ask Now',
      tone: 'warn'
    });
  }
  if ((m.freshWhatsAppCount || 0) > 0) {
    alerts.push({
      label: `${m.freshWhatsAppCount} WhatsApp Buy request(s) await verification`,
      badge: 'Verify Buy',
      tone: 'warn'
    });
  }
  (m.lowStockItems || []).slice(0, 4).forEach(i => {
    const free = Math.max(0, (i.availableQty || 0) - (i.reservedQty || 0));
    alerts.push({
      label: `${i.variantLabel} (${i.sku})`,
      badge: free <= 0 ? 'Out of stock' : `${free} left`,
      tone: free <= 0 ? 'bad' : 'warn'
    });
  });
  (m.expiringOrLowBatches || []).slice(0, 2).forEach(b => {
    alerts.push({ label: `Batch ${b.id} (${b.sku})`, badge: b.status, tone: b.status === 'expired' ? 'bad' : 'warn' });
  });
  document.getElementById('dash-attention-list').innerHTML = alerts.length
    ? alerts.map(a => `<div class="item"><span>${esc(a.label)}</span><span class="pill ${a.tone}">${esc(a.badge)}</span></div>`).join('')
    : '<div class="empty-state" style="padding:14px;">All stock levels, verifications, and batches look healthy.</div>';

  // Audit summary
  const recentAudit = (state.auditLogs || []).slice(0, 4);
  document.getElementById('dash-audit-list').innerHTML = recentAudit.length
    ? recentAudit.map(l => `<div class="item"><span>${esc(l.summary)}</span><span class="tiny">${esc(fmtDateTime(l.createdAt))}</span></div>`).join('')
    : '<div class="tiny">No recent activity logged.</div>';
}

function renderProductProgress() {
  const wrap = document.getElementById('dash-product-progress');
  const sub = document.getElementById('dash-prog-sub');
  if (!wrap) return;

  const orders = getFilteredDashOrders();
  const prodMap = new Map();
  (state.products || []).filter(p => !p.archived).forEach((p, idx) => {
    prodMap.set(p.id, {
      id: p.id,
      title: p.title,
      short: p.title.split(' ').slice(0, 2).join(' '),
      color: STUDIO_PALETTE[idx % STUDIO_PALETTE.length],
      revenue: 0,
      units: 0,
      views: Number((state.metrics?.traffic?.productViews || {})[p.id] || 0)
    });
  });

  orders.forEach(o => {
    if (!isAcceptedOrderRow(o)) return;
    (o.itemsSnapshot || []).forEach(it => {
      const entry = prodMap.get(it.productId) || {
        id: it.productId,
        title: it.productName || it.productId,
        short: it.productName || it.productId,
        color: STUDIO_PALETTE[prodMap.size % STUDIO_PALETTE.length],
        revenue: 0,
        units: 0,
        views: 0
      };
      entry.revenue += Number(it.lineTotal) || 0;
      entry.units += Number(it.quantity) || 0;
      prodMap.set(it.productId, entry);
    });
  });

  const rows = Array.from(prodMap.values());
  const isEn = adminLang === 'en';
  const metricKey = dashProgMode;
  if (sub) {
    sub.textContent = isEn
      ? (metricKey === 'views'
        ? 'Storefront product page visits'
        : metricKey === 'units'
          ? 'Confirmed & dispatched quantity sold'
          : 'Accepted & paid gross sales breakdown')
      : (metricKey === 'views'
        ? 'ग्राहकों ने कौन सा प्रोडक्ट कितनी बार देखा'
        : metricKey === 'units'
          ? 'पक्के व भेजे गए ऑर्डर के कुल पीस'
          : 'पक्के ऑर्डर से कमाई का हिसाब');
  }
  rows.sort((a, b) => b[metricKey] - a[metricKey]);
  const topRows = rows.slice(0, 5);
  const maxVal = Math.max(...topRows.map(r => r[metricKey]), 0);
  const totalVal = rows.reduce((s, r) => s + r[metricKey], 0);

  if (!topRows.length || maxVal <= 0) {
    wrap.innerHTML = `<div class="empty-state" style="padding:36px 10px;">${isEn ? 'No data recorded in this period yet.' : 'इस समय कोई डेटा दर्ज नहीं हुआ है।'}</div>`;
    return;
  }

  wrap.innerHTML = `<div class="prog-list">` + topRows.map(r => {
    const val = r[metricKey];
    const widthPct = Math.max(4, Math.round((val / maxVal) * 100));
    const sharePct = totalVal > 0 ? Math.round((val / totalVal) * 100) : 0;
    const valStr = metricKey === 'revenue'
      ? cash(val)
      : metricKey === 'units'
        ? (isEn ? `${val} units` : `${val} पीस`)
        : (isEn ? `${val} views` : `${val} बार`);
    return `
      <div class="prog-row">
        <div class="prog-meta">
          <span class="prog-title">
            <span class="prog-badge-ic" style="background:${r.color};">${esc(r.short.slice(0, 2).toUpperCase())}</span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.short)}</span>
          </span>
          <span><strong>${valStr}</strong> <span class="tiny">(${sharePct}%)</span></span>
        </div>
        <div class="prog-track">
          <div class="prog-fill" style="width:${widthPct}%;background:linear-gradient(90deg, ${r.color}, ${r.color}cc);"></div>
        </div>
      </div>
    `;
  }).join('') + `</div>`;
}

function showSalesTooltip(el, idx) {
  const stage = el.closest('.chart-svg-stage');
  if (!stage || !stage._tooltipBins) return;
  const tip = stage.querySelector('.chart-tooltip-box');
  const b = stage._tooltipBins[idx];
  if (!tip || !b) return;
  tip.innerHTML = `<strong>${esc(b.title)}</strong><div>${b.line1}</div>${b.line2 ? `<div style="opacity:.86;">${b.line2}</div>` : ''}`;
  const xPct = Math.max(14, Math.min(86, Number(el.dataset.xpct || 50)));
  const yPx = Math.max(38, Number(el.dataset.ypx || 60));
  tip.style.left = `${xPct}%`;
  tip.style.top = `${yPx}px`;
  tip.classList.add('show');
  stage.querySelectorAll('[data-dot-idx]').forEach(dot => {
    const isHit = Number(dot.dataset.dotIdx) === idx;
    dot.setAttribute('r', isHit ? '6.5' : '4.5');
    dot.setAttribute('stroke-width', isHit ? '3' : '2');
  });
}

function hideSalesTooltip(stage) {
  if (!stage) return;
  const tip = stage.querySelector('.chart-tooltip-box');
  if (tip) tip.classList.remove('show');
  stage.querySelectorAll('[data-dot-idx]').forEach(dot => {
    dot.setAttribute('r', '4.5');
    dot.setAttribute('stroke-width', '2');
  });
}

function renderSalesChart(series) {
  const wrap = document.getElementById('sales-chart-wrap');
  const titleEl = document.getElementById('dash-activity-title');
  if (!wrap) return;
  const isEn = adminLang === 'en';

  const orders = state.orders || [];
  const daysCount = dashRangeDays === 'all' ? 14 : Math.min(30, Number(dashRangeDays) || 14);
  const barDays = Math.min(14, daysCount);
  const activityBins = [];
  for (let i = barDays - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const dayOrders = orders.filter(o => (o.createdAt || '').startsWith(key));
    const delivered = dayOrders.filter(o => o.orderStatus === 'delivered').length;
    const active = dayOrders.filter(o => ['confirmed', 'processing', 'ready_for_dispatch', 'dispatched'].includes(o.orderStatus)).length;
    const pending = dayOrders.filter(o => ['pending_whatsapp', 'waiting_followup'].includes(o.orderStatus)).length;
    const rev = dayOrders.filter(isAcceptedOrderRow).reduce((s, o) => s + (o.grandTotal || 0), 0);
    activityBins.push({ key, label: label.split(' ')[0], fullLabel: label, delivered, active, pending, total: delivered + active + pending, rev });
  }

  if (dashChartMode === 'bars') {
    if (titleEl) titleEl.textContent = isEn ? `Daily Order Activity (Last ${barDays}d)` : `रोज़ाना ऑर्डर गतिविधि (पिछले ${barDays} दिन)`;
    const maxTot = Math.max(...activityBins.map(b => b.total), 0);
    if (maxTot <= 0) {
      wrap.innerHTML = `<div class="empty-state" style="padding:36px 12px;">${isEn ? `No orders recorded in the last ${barDays} days.` : `पिछले ${barDays} दिनों में अभी तक कोई ऑर्डर नहीं आया है।`}</div>`;
      return;
    }
    wrap.innerHTML = `
      <div class="chart-svg-stage" onmouseleave="hideSalesTooltip(this)">
        <div class="chart-tooltip-box"></div>
        <div class="bar-chart-wrap">
          <div class="bar-cols" style="grid-template-columns:repeat(${activityBins.length}, minmax(0, 1fr));">
            ${activityBins.map((b, idx) => {
              const hDelivered = Math.round((b.delivered / maxTot) * 124);
              const hActive = Math.round((b.active / maxTot) * 124);
              const hPending = Math.round((b.pending / maxTot) * 124);
              const totH = Math.max(6, hDelivered + hActive + hPending);
              const xPct = (((idx + 0.5) / activityBins.length) * 100).toFixed(1);
              const yPx = Math.max(40, 152 - totH);
              return `
                <div class="bar-col-item" data-idx="${idx}" data-xpct="${xPct}" data-ypx="${yPx}" onmouseenter="showSalesTooltip(this, ${idx})" onclick="showSalesTooltip(this, ${idx})">
                  <div class="bar-stack" style="height:${totH}px;">
                    ${b.delivered > 0 ? `<div class="bar-seg" style="height:${hDelivered}px;background:#16D69A;"></div>` : ''}
                    ${b.active > 0 ? `<div class="bar-seg" style="height:${hActive}px;background:#4DA3FF;"></div>` : ''}
                    ${b.pending > 0 ? `<div class="bar-seg" style="height:${hPending}px;background:#F5B942;"></div>` : ''}
                  </div>
                  <span class="bar-lbl">${esc(b.label)}</span>
                </div>
              `;
            }).join('')}
          </div>
          <div class="bar-legend-row">
            <span><span class="legend-dot" style="display:inline-block;background:#16D69A;margin-right:4px;"></span>${isEn ? 'Delivered' : 'पहुंच गए (Delivered)'}</span>
            <span><span class="legend-dot" style="display:inline-block;background:#4DA3FF;margin-right:4px;"></span>${isEn ? 'Confirmed / In Transit' : 'पक्के / रास्ते में'}</span>
            <span><span class="legend-dot" style="display:inline-block;background:#F5B942;margin-right:4px;"></span>${isEn ? 'Verify / Waiting' : 'जाँच / इंतज़ार'}</span>
          </div>
        </div>
      </div>
    `;
    const stage = wrap.querySelector('.chart-svg-stage');
    if (stage) {
      stage._tooltipBins = activityBins.map(b => ({
        title: b.fullLabel,
        line1: isEn ? `${b.total} orders • Accepted Value: ${cash(b.rev)}` : `कुल ${b.total} ऑर्डर • पक्की बिक्री: ${cash(b.rev)}`,
        line2: isEn ? `Delivered: ${b.delivered} · Active: ${b.active} · Pending: ${b.pending}` : `पहुंचे: ${b.delivered} · रास्ते में/पक्के: ${b.active} · जाँच बाकी: ${b.pending}`
      }));
    }
    return;
  }

  if (titleEl) titleEl.textContent = isEn ? 'Verified Revenue Trend (Last 14 Days)' : 'पक्की कमाई की लाइन (पिछले 14 दिन)';
  const maxVal = Math.max(...series.map(d => d.revenue || 0), 0);
  if (!series.length || maxVal <= 0) {
    wrap.innerHTML = `<div class="empty-state" style="padding:40px 12px;">${isEn ? 'No verified dispatched revenue recorded in the last 14 days.' : 'पिछले 14 दिनों में अभी तक कोई भेजी व पेड कमाई दर्ज नहीं हुई है।'}</div>`;
    return;
  }
  const W = 620;
  const H = 215;
  const leftPad = 62;
  const rightPad = 20;
  const topPad = 24;
  const bottomPad = 28;
  const plotW = W - leftPad - rightPad;
  const plotH = H - topPad - bottomPad;
  const stepX = plotW / Math.max(1, series.length - 1);
  const pts = series.map((d, idx) => {
    const x = leftPad + idx * stepX;
    const y = topPad + plotH - ((d.revenue / maxVal) * plotH);
    return { x, y, d };
  });
  const polyLine = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${leftPad},${topPad + plotH} ${polyLine} ${(leftPad + (pts.length - 1) * stepX).toFixed(1)},${topPad + plotH}`;
  const midVal = Math.round(maxVal / 2);

  const isLight = adminTheme === 'light';
  const gridStroke = isLight ? 'rgba(19, 34, 28, 0.1)' : 'rgba(255,255,255,0.08)';
  const axisFill = isLight ? '#485B53' : '#9BAAA7';
  const lineAccent = isLight ? '#0F8A5F' : '#32E6A6';
  const dotFill = isLight ? '#FFFFFF' : '#111B24';

  wrap.innerHTML = `
    <div class="chart-svg-stage" onmouseleave="hideSalesTooltip(this)">
      <div class="chart-tooltip-box"></div>
      <svg class="chart" style="height:215px;" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${lineAccent}" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="${lineAccent}" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        <g stroke="${gridStroke}" stroke-dasharray="3 3">
          <line x1="${leftPad}" y1="${topPad}" x2="${W - rightPad}" y2="${topPad}"/>
          <line x1="${leftPad}" y1="${topPad + plotH * 0.5}" x2="${W - rightPad}" y2="${topPad + plotH * 0.5}"/>
          <line x1="${leftPad}" y1="${topPad + plotH}" x2="${W - rightPad}" y2="${topPad + plotH}" stroke-dasharray="none"/>
        </g>
        <g fill="${axisFill}" font-size="11" font-family="DM Sans, sans-serif">
          <text x="${leftPad - 8}" y="${topPad + 4}" text-anchor="end">${esc(cash(maxVal))}</text>
          <text x="${leftPad - 8}" y="${topPad + plotH * 0.5 + 4}" text-anchor="end">${esc(cash(midVal))}</text>
          <text x="${leftPad - 8}" y="${topPad + plotH + 4}" text-anchor="end">₹0</text>
        </g>
        <polygon points="${area}" fill="url(#revAreaGrad)"></polygon>
        <polyline points="${polyLine}" fill="none" stroke="${lineAccent}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></polyline>
        ${pts.map((p, idx) => `
          <circle data-dot-idx="${idx}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="${dotFill}" stroke="${lineAccent}" stroke-width="2.2"></circle>
          <rect class="chart-hit-col" x="${Math.max(0, p.x - stepX / 2).toFixed(1)}" y="0" width="${Math.max(18, stepX).toFixed(1)}" height="${H}" fill="transparent"
            data-xpct="${((p.x / W) * 100).toFixed(1)}" data-ypx="${Math.max(44, Math.round(p.y) - 8)}"
            onmouseenter="showSalesTooltip(this, ${idx})" onclick="showSalesTooltip(this, ${idx})"></rect>
        `).join('')}
      </svg>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:4px;">
        <span>${esc(series[0]?.label || '')}</span>
        <span>${isEn ? `Peak Day: <strong style="color:${lineAccent};">${esc(cash(maxVal))}</strong> (Hover points)` : `सबसे ज्यादा कमाई: <strong style="color:${lineAccent};">${esc(cash(maxVal))}</strong> (ग्राफ पर माउस ले जाएं)`}</span>
        <span>${esc(series[series.length - 1]?.label || '')}</span>
      </div>
    </div>
  `;
  const stage = wrap.querySelector('.chart-svg-stage');
  if (stage) {
    stage._tooltipBins = series.map(d => ({
      title: d.label,
      line1: isEn ? `Verified Revenue: ${cash(d.revenue)}` : `पक्की कमाई: ${cash(d.revenue)}`,
      line2: isEn ? `${d.orders || 0} accepted orders` : `${d.orders || 0} पक्के ऑर्डर`
    }));
  }
}

function renderCategoryMix(dist) {
  const wrap = document.getElementById('product-mix-wrap');
  const sub = document.getElementById('dash-donut-sub');
  if (!wrap) return;
  const isEn = adminLang === 'en';
  const orders = getFilteredDashOrders();

  if (dashDonutMode === 'stages') {
    if (sub) sub.textContent = isEn ? 'Order count & share across every stage — clean single-line view' : 'हर स्थिति में कितने ऑर्डर हैं — बिल्कुल साफ एक लाइन में';
    const stages = [
      { label: isEn ? 'Delivered' : 'पहुंच गए (Delivered)', color: '#16D69A', count: orders.filter(o => o.orderStatus === 'delivered').length },
      { label: isEn ? 'Dispatched (In Transit)' : 'रास्ते में (Dispatched)', color: '#32E6A6', count: orders.filter(o => o.orderStatus === 'dispatched').length },
      { label: isEn ? 'Confirmed & Packing' : 'पक्का व पैकिंग (Confirmed)', color: '#A78BFA', count: orders.filter(o => ['confirmed', 'processing', 'ready_for_dispatch'].includes(o.orderStatus)).length },
      { label: isEn ? 'WhatsApp Verify Pending' : 'WhatsApp जाँच बाकी', color: '#4DA3FF', count: orders.filter(o => o.orderStatus === 'pending_whatsapp').length },
      { label: isEn ? '2-Day Follow-up Waiting' : '2 दिन इंतज़ार (Waiting)', color: '#F5B942', count: orders.filter(o => o.orderStatus === 'waiting_followup').length },
      { label: isEn ? 'Cancelled / Returned' : 'रद्द / वापस (Cancelled)', color: '#FF6B72', count: orders.filter(o => o.orderStatus === 'cancelled' || o.orderStatus.startsWith('return_')).length }
    ].map(s => ({ ...s, value: s.count, displayVal: isEn ? `${s.count} order${s.count === 1 ? '' : 's'}` : `${s.count} ऑर्डर` }));

    wrap.innerHTML = buildSvgDonutHtml(stages, String(orders.length), isEn ? 'Total Orders' : 'कुल ऑर्डर', isEn ? 'No orders yet in selected window.' : 'इस समय के दौरान अभी तक कोई ऑर्डर नहीं आया है।');
    return;
  }

  if (dashDonutMode === 'payments') {
    if (sub) sub.textContent = isEn ? 'Online UPI vs Cash on Delivery (COD) vs Awaiting payment' : 'ऑनलाइन UPI, कैश (COD) और बकाया पैसों का पूरा हिसाब';
    const activeOrders = orders.filter(o => o.orderStatus !== 'cancelled');
    const upiPaid = activeOrders.filter(o => (o.paymentMethod === 'ONLINE' || o.paymentMethod === 'UPI') && o.paymentStatus === 'paid').reduce((s, o) => s + o.grandTotal, 0);
    const codPaid = activeOrders.filter(o => (o.paymentMethod === 'COD' || o.paymentMethod === 'CASH') && o.paymentStatus === 'paid').reduce((s, o) => s + o.grandTotal, 0);
    const awaiting = activeOrders.filter(o => o.paymentStatus !== 'paid' && o.paymentStatus !== 'refunded').reduce((s, o) => s + o.grandTotal, 0);
    const segs = [
      { label: isEn ? 'Online (UPI) Paid' : 'ऑनलाइन (UPI) से मिले पैसे', color: '#4DA3FF', value: upiPaid, displayVal: cash(upiPaid) },
      { label: isEn ? 'Cash on Delivery (COD) Paid' : 'कैश ऑन डिलीवरी (COD) मिला', color: '#16D69A', value: codPaid, displayVal: cash(codPaid) },
      { label: isEn ? 'Awaiting Settlement' : 'पेमेंट आना बाकी है (Pending)', color: '#F5B942', value: awaiting, displayVal: cash(awaiting) }
    ];
    wrap.innerHTML = buildSvgDonutHtml(segs, cash(upiPaid + codPaid + awaiting), isEn ? 'Total Value' : 'कुल रकम', isEn ? 'No payment data recorded yet.' : 'अभी तक कोई पेमेंट डेटा दर्ज नहीं है।');
    return;
  }

  if (sub) sub.textContent = isEn ? 'Revenue contribution (%) by product — clean single-line view' : 'किस प्रोडक्ट से कितनी कमाई (%) हुई — साफ एक लाइन में';
  const map = new Map();
  orders.filter(isAcceptedOrderRow).forEach(o => {
    (o.itemsSnapshot || []).forEach(it => {
      const cur = map.get(it.productId) || { name: it.productName || it.productId, amount: 0 };
      cur.amount += Number(it.lineTotal) || 0;
      map.set(it.productId, cur);
    });
  });
  const list = map.size > 0
    ? Array.from(map.values()).sort((a, b) => b.amount - a.amount)
    : (dist || []);
  const totAmt = list.reduce((s, d) => s + (d.amount || 0), 0);
  const segs = list.slice(0, 6).map((d, idx) => ({
    label: (d.name || '').split(' ').slice(0, 4).join(' '),
    color: STUDIO_PALETTE[idx % STUDIO_PALETTE.length],
    value: d.amount || 0,
    displayVal: cash(d.amount || 0)
  }));
  wrap.innerHTML = buildSvgDonutHtml(segs, cash(totAmt), isEn ? 'Product Sales' : 'प्रोडक्ट बिक्री', isEn ? 'No accepted product sales recorded yet.' : 'अभी तक कोई पक्की प्रोडक्ट बिक्री नहीं हुई है।');
}

function renderRepeatAndVipCustomers() {
  const repWrap = document.getElementById('dash-repeat-customers');
  const vipWrap = document.getElementById('dash-biggest-buyers');
  const badge = document.getElementById('repeat-cust-badge');
  if (!repWrap || !vipWrap) return;
  const isEn = adminLang === 'en';

  const customers = state.customers || [];
  const orders = state.orders || [];

  const getCustomerTopProduct = c => {
    const counts = new Map();
    (c.orders || []).filter(isAcceptedOrderRow).forEach(o => {
      (o.itemsSnapshot || []).forEach(it => {
        counts.set(it.productName, (counts.get(it.productName) || 0) + (it.quantity || 1));
      });
    });
    const best = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
    return best ? `${best[0]} (${best[1]})` : (isEn ? 'Pending verification' : 'ऑर्डर पक्का नहीं');
  };

  const repeaters = customers
    .filter(c => (c.totalOrders || 0) >= 2)
    .sort((a, b) => (b.totalOrders - a.totalOrders) || ((b.acceptedSpend || 0) - (a.acceptedSpend || 0)));

  if (badge) {
    badge.textContent = `${repeaters.length} Repeat`;
    badge.className = `pill ${repeaters.length > 0 ? '' : 'muted'}`;
  }

  if (repeaters.length > 0) {
    repWrap.innerHTML = repeaters.slice(0, 5).map((c, idx) => {
      const col = STUDIO_PALETTE[idx % STUDIO_PALETTE.length];
      const initials = (c.name || 'CU').trim().split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
      return `
        <div class="vip-row">
          <div class="vip-left">
            <div class="vip-avatar" style="background:${col};">${esc(initials)}</div>
            <div class="vip-meta">
              <div class="vip-name">
                <span>${esc(c.name)}</span>
                <span class="pill warn">${isEn ? `${c.totalOrders} orders` : `${c.totalOrders} बार खरीदा`}</span>
              </div>
              <div class="tiny">${esc(c.city || '')} &bull; ${isEn ? 'Top' : 'पसंदीदा'}: ${esc(getCustomerTopProduct(c))}</div>
            </div>
          </div>
          <div class="vip-right">
            <div class="vip-amt">${cash(c.acceptedSpend ?? c.verifiedSpend)}</div>
            <div class="toolbar" style="margin-top:4px;justify-content:flex-end;">
              <button type="button" class="btn sm" onclick="openCustomerOrders('${esc(c.customerId)}')">${isEn ? 'Orders' : 'ऑर्डर देखें'}</button>
              <a class="btn sm" href="https://wa.me/91${esc(c.phone)}" target="_blank">WA ↗</a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    repWrap.innerHTML = `<div class="empty-state" style="padding:26px 12px;">${isEn ? 'No Repeat Customers yet — any buyer returning for a <strong>2nd order (2+ purchases)</strong> will appear here.' : 'अभी कोई Repeat Customer नहीं है — जब कोई ग्राहक <strong>दूसरी बार (2+ ऑर्डर)</strong> सामान खरीदेगा, तब उसका नाम यहां दिखेगा।'}</div>`;
  }

  if (dashVipMode === 'orders') {
    const topOrders = orders
      .filter(isAcceptedOrderRow)
      .sort((a, b) => (b.grandTotal || 0) - (a.grandTotal || 0))
      .slice(0, 5);
    vipWrap.innerHTML = topOrders.length ? topOrders.map((o, idx) => {
      const rankCls = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
      const itemsTxt = (o.itemsSnapshot || []).map(it => `${it.productName} (${it.variantLabel}) × ${it.quantity}`).join(', ');
      return `
        <div class="vip-row" style="cursor:pointer;" onclick="openOrderDetails('${esc(o.orderId)}')">
          <div class="vip-left">
            <div class="rank-medal ${rankCls}">#${idx + 1}</div>
            <div class="vip-meta">
              <div class="vip-name"><span>${esc(o.customerSnapshot?.name || 'Customer')}</span><span class="sku-code">${esc(o.orderId)}</span></div>
              <div class="tiny">${esc(itemsTxt)}</div>
            </div>
          </div>
          <div class="vip-right">
            <div class="vip-amt">${cash(o.grandTotal)}</div>
            <div class="tiny">${esc(o.paymentMethod || '')} &bull; ${esc(fmtDateTime(o.createdAt))}</div>
          </div>
        </div>
      `;
    }).join('') : `<div class="empty-state" style="padding:24px 10px;">${isEn ? 'No accepted high-value orders recorded yet.' : 'अभी तक कोई पक्का बड़ा ऑर्डर दर्ज नहीं हुआ है।'}</div>`;
    return;
  }

  const topBuyers = [...customers]
    .filter(c => (c.acceptedSpend || c.verifiedSpend || 0) > 0)
    .sort((a, b) => ((b.acceptedSpend || b.verifiedSpend || 0) - (a.acceptedSpend || a.verifiedSpend || 0)))
    .slice(0, 5);
  vipWrap.innerHTML = topBuyers.length ? topBuyers.map((c, idx) => {
    const rankCls = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
    const unitsTotal = (c.orders || []).filter(isAcceptedOrderRow).reduce((sum, o) => sum + (o.itemsSnapshot || []).reduce((s, it) => s + (it.quantity || 0), 0), 0);
    const paidTotal = (c.orders || []).filter(o => o.orderStatus !== 'cancelled' && ['paid', 'partially_refunded'].includes(o.paymentStatus)).reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
    return `
      <div class="vip-row" style="cursor:pointer;" onclick="openCustomerOrders('${esc(c.customerId)}')">
        <div class="vip-left">
          <div class="rank-medal ${rankCls}">#${idx + 1}</div>
          <div class="vip-meta">
            <div class="vip-name"><span>${esc(c.name)}</span><span class="pill muted">${isEn ? `${unitsTotal} units` : `${unitsTotal} पीस`}</span></div>
            <div class="tiny">${isEn ? `${c.totalOrders} accepted &bull; Paid: <strong>${cash(paidTotal || c.verifiedSpend)}</strong>` : `${c.totalOrders} पक्के ऑर्डर &bull; मिला पैसा: <strong>${cash(paidTotal || c.verifiedSpend)}</strong>`}</div>
          </div>
        </div>
        <div class="vip-right">
          <div class="vip-amt">${cash(c.acceptedSpend ?? c.verifiedSpend)}</div>
          <div class="tiny">${esc(c.city || `+91 ${c.phone}`)}</div>
        </div>
      </div>
    `;
  }).join('') : `<div class="empty-state" style="padding:24px 10px;">${isEn ? 'Top buyers appear here after orders are accepted.' : 'ऑर्डर पक्के होने के बाद सबसे बड़े खरीदार यहां दिखेंगे।'}</div>`;
}

function renderOrderPipelineKanban() {
  const isEn = adminLang === 'en';
  const orders = state.orders || [];
  const buckets = {
    verify: orders.filter(o => o.orderStatus === 'pending_whatsapp'),
    waiting: orders.filter(o => o.orderStatus === 'waiting_followup'),
    confirmed: orders.filter(o => ['confirmed', 'processing', 'ready_for_dispatch'].includes(o.orderStatus)),
    shipped: orders.filter(o => ['dispatched', 'delivered'].includes(o.orderStatus))
  };

  const renderCol = (id, cntId, list, emptyTxt) => {
    const el = document.getElementById(id);
    const cnt = document.getElementById(cntId);
    if (cnt) cnt.textContent = String(list.length);
    if (!el) return;
    if (!list.length) {
      el.innerHTML = `<div class="tiny" style="padding:10px 4px;">${esc(emptyTxt)}</div>`;
      return;
    }
    el.innerHTML = list.slice(0, 4).map(o => {
      const itemsTxt = (o.itemsSnapshot || []).map(it => `${it.productName} ×${it.quantity}`).join(', ');
      const stateTag = o.orderStatus === 'delivered'
        ? `<span class="pill" style="font-size:10px;padding:1px 6px;">${isEn ? 'Delivered ✓' : 'पहुंच गया ✓'}</span>`
        : o.orderStatus === 'dispatched'
          ? `<span class="pill info" style="font-size:10px;padding:1px 6px;">${isEn ? 'In Transit' : 'रास्ते में'}</span>`
          : '';
      return `
        <div class="kanban-card" onclick="openOrderDetails('${esc(o.orderId)}')">
          <div class="kanban-card-title" style="display:flex;justify-content:space-between;gap:6px;align-items:center;">
            <span>${esc(o.customerSnapshot?.name || 'Customer')}</span>
            ${stateTag}
          </div>
          <div class="kanban-card-sub">${esc(itemsTxt)}</div>
          <div class="kanban-card-foot">
            <span>${cash(o.grandTotal)}</span>
            <span class="tiny">${esc(o.orderId)}</span>
          </div>
        </div>
      `;
    }).join('');
  };

  renderCol('kcol-verify', 'kcnt-verify', buckets.verify, isEn ? 'No pending WhatsApp confirmations' : 'कोई नई WhatsApp जांच बाकी नहीं');
  renderCol('kcol-waiting', 'kcnt-waiting', buckets.waiting, isEn ? 'No follow-up waiting orders' : 'कोई ऑर्डर इंतज़ार में नहीं');
  renderCol('kcol-confirmed', 'kcnt-confirmed', buckets.confirmed, isEn ? 'No confirmed orders awaiting dispatch' : 'कोई पैकिंग बाकी नहीं');
  renderCol('kcol-shipped', 'kcnt-shipped', buckets.shipped, isEn ? 'No dispatched or delivered orders yet' : 'अभी कोई ऑर्डर नहीं भेजा गया');
}

// ── 2. Products & Structured Niche/SKU Builder ──────────────────
function populateNicheSelects() {
  const niches = state.niches || [];
  const filterSel = document.getElementById('prod-niche-filter');
  if (filterSel) {
    const cur = filterSel.value;
    filterSel.innerHTML = `<option value="all">All Niches</option>` +
      niches.map(n => `<option value="${esc(n.id)}">${esc(n.name)} (${esc(n.tag)})</option>`).join('');
    filterSel.value = cur || 'all';
  }
  const modalSel = document.getElementById('pm-niche');
  if (modalSel) {
    modalSel.innerHTML = niches.map(n => `<option value="${esc(n.id)}" data-tag="${esc(n.tag)}">${esc(n.name)} (${esc(n.tag)})</option>`).join('');
  }
}

function getProductTotalFreeStock(p) {
  const vars = Array.isArray(p.variants) && p.variants.length ? p.variants : [{ sku: p.sku }];
  return vars.reduce((sum, v) => {
    const inv = state.inventory[v.sku];
    return sum + (inv ? Math.max(0, (inv.availableQty || 0) - (inv.reservedQty || 0)) : 0);
  }, 0);
}

// ── Table Column Sorting Engine ────────────────────────────────
const sortState = {
  inventory: { col: 'product', dir: 'asc' },
  products: { col: 'title', dir: 'asc' },
  orders: { col: 'orderId', dir: 'desc' }
};

const expandedVariantProducts = new Set();

function toggleProductVariantBreakdown(productId) {
  if (expandedVariantProducts.has(productId)) {
    expandedVariantProducts.delete(productId);
  } else {
    expandedVariantProducts.add(productId);
  }
  renderProducts();
}

function setTableSort(tableId, col) {
  const cur = sortState[tableId] || { col: '', dir: 'asc' };
  if (cur.col === col) {
    cur.dir = cur.dir === 'asc' ? 'desc' : 'asc';
  } else {
    cur.col = col;
    // Numerical metrics default to desc on first click (highest first)
    cur.dir = ['physical', 'reserved', 'free', 'sold', 'damaged', 'reorder', 'price', 'stock', 'variants', 'total'].includes(col) ? 'desc' : 'asc';
  }
  sortState[tableId] = cur;

  if (tableId === 'inventory') renderInventory();
  else if (tableId === 'products') renderProducts();
  else if (tableId === 'orders') renderOrders();
}

function updateSortIndicators(tableId) {
  const cur = sortState[tableId] || { col: '', dir: 'asc' };
  const prefix = tableId === 'inventory' ? 'sort-inv-' : tableId === 'products' ? 'sort-prod-' : 'sort-ord-';
  const els = document.querySelectorAll(`[id^="${prefix}"]`);
  els.forEach(el => {
    const colName = el.id.replace(prefix, '');
    const isSorted = cur.col === colName;
    const dir = isSorted ? cur.dir : 'none';
    const th = el.closest('th');
    if (th) {
      th.classList.toggle('sorted-asc', isSorted && dir === 'asc');
      th.classList.toggle('sorted-desc', isSorted && dir === 'desc');
    }
    el.innerHTML = `
      <span class="sort-indicator ${isSorted ? 'sorted-' + dir : ''}" data-dir="${dir}">
        <svg class="sort-icon-svg" width="9" height="13" viewBox="0 0 10 13" fill="none">
          <path class="arrow-up" d="M5 1.5L9 5.5H1L5 1.5Z" fill="${isSorted && dir === 'asc' ? '#38BDF8' : 'rgba(255,255,255,0.32)'}"/>
          <path class="arrow-down" d="M5 11.5L1 7.5H9L5 11.5Z" fill="${isSorted && dir === 'desc' ? '#38BDF8' : 'rgba(255,255,255,0.32)'}"/>
        </svg>
      </span>
    `;
  });
}

function renderProducts() {
  const q = (document.getElementById('prod-search')?.value || '').toLowerCase();
  const vf = document.getElementById('prod-vis-filter')?.value || 'all';
  const nf = document.getElementById('prod-niche-filter')?.value || 'all';
  const rows = (state.products || []).filter(p => {
    if (vf === 'archived') { if (!p.archived) return false; }
    else { if (p.archived) return false; }
    if (vf === 'active' && p.visible === false) return false;
    if (vf === 'hidden' && p.visible !== false) return false;
    if (nf !== 'all' && p.niche !== nf && p.category !== nf) return false;
    const text = `${p.title} ${p.sku} ${p.nicheTag} ${(p.variants || []).map(v => v.sku).join(' ')}`.toLowerCase();
    return text.includes(q);
  });

  const soldByProd = new Map();
  ((state.metrics && state.metrics.skuStockAndSales) || []).forEach(r => {
    soldByProd.set(r.productId, (soldByProd.get(r.productId) || 0) + (r.acceptedSoldQty || 0));
  });

  const curSort = sortState.products || { col: 'title', dir: 'asc' };
  rows.sort((a, b) => {
    let va, vb;
    const freeA = getProductTotalFreeStock(a);
    const freeB = getProductTotalFreeStock(b);

    switch (curSort.col) {
      case 'title':
        va = (a.title || '').toLowerCase();
        vb = (b.title || '').toLowerCase();
        break;
      case 'niche':
        va = (a.nicheTag || a.niche || a.category || '').toLowerCase();
        vb = (b.nicheTag || b.niche || b.category || '').toLowerCase();
        break;
      case 'variants':
        va = (a.variants || []).length;
        vb = (b.variants || []).length;
        break;
      case 'price':
        va = a.price || 0;
        vb = b.price || 0;
        break;
      case 'stock':
        va = freeA;
        vb = freeB;
        break;
      case 'visibility':
        va = a.archived ? 0 : a.visible !== false ? 2 : 1;
        vb = b.archived ? 0 : b.visible !== false ? 2 : 1;
        break;
      default:
        va = (a.title || '').toLowerCase();
        vb = (b.title || '').toLowerCase();
    }

    if (typeof va === 'string') {
      return curSort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return curSort.dir === 'asc' ? va - vb : vb - va;
  });

  const tbody = document.getElementById('products-tbody');
  tbody.innerHTML = rows.length ? rows.map(p => {
    const freeTotal = getProductTotalFreeStock(p);
    const prodSold = soldByProd.get(p.id) || 0;
    const variants = p.variants || [];
    const varCount = variants.length;
    const isOpen = expandedVariantProducts.has(p.id);

    let breakdownHtml = '';
    if (isOpen && varCount > 0) {
      const varRows = variants.map(v => {
        const inv = state.inventory && state.inventory[v.sku];
        const physical = inv ? (inv.availableQty || 0) : 0;
        const reserved = inv ? (inv.reservedQty || 0) : 0;
        const free = Math.max(0, physical - reserved);
        const thr = inv?.reorderThreshold ?? 8;
        const healthCls = free <= 0 ? 'bad' : free <= thr ? 'warn' : '';
        const healthTxt = free <= 0 ? 'Out of stock' : free <= thr ? 'Low stock' : 'Healthy';
        const label = v.size || v.variantLabel || v.label || 'Standard Pack';
        return `
          <tr>
            <td>
              <strong>${esc(label)}</strong>
              ${v.isDefault ? '<span class="pill info" style="margin-left:5px;font-size:9.5px;padding:2px 7px;">Default</span>' : ''}
              ${v.variety ? `<div class="tiny">${esc(v.variety)}</div>` : ''}
            </td>
            <td><span class="sku-code">${esc(v.sku)}</span></td>
            <td><strong>${cash(v.price)}</strong>${v.mrp > v.price ? `<div class="tiny" style="text-decoration:line-through;opacity:.7;">MRP ${cash(v.mrp)}</div>` : ''}</td>
            <td><strong>${physical}</strong> in warehouse</td>
            <td>${reserved > 0 ? `<span style="color:var(--warn-fg);font-weight:700;">${reserved} reserved</span>` : '0 reserved'}</td>
            <td><span class="pill ${healthCls}"><strong>${free}</strong> left</span></td>
            <td><span class="pill ${healthCls}">${healthTxt}</span></td>
            <td>
              <button type="button" class="btn sm" onclick="openStockModal('${esc(v.sku)}')">Adjust Stock</button>
            </td>
          </tr>
        `;
      }).join('');

      breakdownHtml = `
        <tr id="var-breakdown-${esc(p.id)}" class="var-breakdown-row">
          <td colspan="7">
            <div class="var-breakdown-card">
              <div class="var-breakdown-head">
                <div class="var-head-left">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                  <strong>${esc(p.title)} — Variant Stock Breakdown (${varCount} Pack Sizes)</strong>
                </div>
                <div class="tiny" style="color:var(--text-secondary);">
                  Total Available: <strong style="color:var(--text);">${freeTotal} units</strong> across all pack sizes
                </div>
              </div>
              <div class="table-scroll">
                <table class="var-mini-table">
                  <thead>
                    <tr>
                      <th>Pack Size / Variant</th>
                      <th>SKU Code</th>
                      <th>Selling Price</th>
                      <th>Physical (Godam)</th>
                      <th>Reserved</th>
                      <th>Free Left (Bache Hue)</th>
                      <th>Status</th>
                      <th>Stock Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${varRows}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      `;
    }

    return `
      <tr>
        <td>
          <div class="prod-cell">
            <img class="prod-thumb" src="${esc(p.image)}" alt="${esc(p.title)}" onerror="this.src='./images/shimla-ghee.webp'" />
            <div>
              <strong>${esc(p.title)}</strong>
              <div class="tiny">${esc(p.subtitle || '')} ${p.batchNo ? '· Batch #' + esc(p.batchNo) : ''}</div>
            </div>
          </div>
        </td>
        <td><span class="sku-code">${esc(p.nicheTag || 'SWSM')}</span><div class="tiny">${esc(p.niche || p.category)}</div></td>
        <td>
          <button type="button" class="btn-var-accordion ${isOpen ? 'is-open' : ''}" onclick="toggleProductVariantBreakdown('${esc(p.id)}')" title="Click to view all ${varCount} variant pack stocks">
            <div>
              <span class="sku-code">${esc(p.sku)}</span>
              <div class="tiny" style="margin-top:2px;">
                <strong>${varCount}</strong> variant SKU${varCount === 1 ? '' : 's'}
              </div>
            </div>
            <svg class="var-arrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </td>
        <td><strong>${cash(p.price)}</strong><div class="tiny">${p.mrp > p.price ? 'MRP ' + cash(p.mrp) : ''}</div></td>
        <td><span class="pill ${freeTotal <= 0 ? 'bad' : freeTotal <= 10 ? 'warn' : ''}">${freeTotal} left</span><div class="tiny">${prodSold} sold</div></td>
        <td><span class="pill ${p.archived ? 'muted' : p.visible !== false ? '' : 'warn'}">${p.archived ? 'Archived' : p.visible !== false ? 'Active' : 'Hidden'}</span></td>
        <td>
          <div class="toolbar">
            <button type="button" class="btn sm" onclick="openProductModal('${esc(p.id)}')">Edit</button>
            <button type="button" class="btn sm" onclick="toggleProductVisibility('${esc(p.id)}', ${p.visible === false})">${p.visible === false ? 'Show' : 'Hide'}</button>
            <button type="button" class="btn sm danger" onclick="archiveProduct('${esc(p.id)}')">${p.archived ? 'Restore' : 'Archive'}</button>
          </div>
        </td>
      </tr>
      ${breakdownHtml}
    `;
  }).join('') : '<tr><td colspan="7" class="empty-state">No products match your filter.</td></tr>';

  updateSortIndicators('products');
}

function onProductNicheChange() {
  const sel = document.getElementById('pm-niche');
  const tagInput = document.getElementById('pm-niche-tag');
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.dataset.tag) tagInput.value = opt.dataset.tag;
}

function addVariantEditorRow(v = {}, index = null) {
  const list = document.getElementById('pm-variants-list');
  const idx = index !== null ? index : list.children.length;
  const nicheTag = (document.getElementById('pm-niche-tag')?.value || 'SWSM').toUpperCase();
  const inv = v.sku && state.inventory[v.sku] ? state.inventory[v.sku] : null;
  const row = document.createElement('div');
  row.className = 'variant-row';
  row.innerHTML = `
    <input class="vr-size" placeholder="500ml / 1kg" value="${esc(v.size || '')}" required oninput="autoFillVariantSku(this)" />
    <input class="vr-variety" placeholder="Optional variety" value="${esc(v.variety || '')}" oninput="autoFillVariantSku(this)" />
    <input class="vr-sku" placeholder="${esc(nicheTag)}-500ML-01" value="${esc(v.sku || '')}" style="text-transform:uppercase;font-family:monospace;" required />
    <input class="vr-price" type="number" min="0" value="${esc(v.price ?? '')}" required />
    <input class="vr-mrp" type="number" min="0" value="${esc(v.mrp ?? '')}" required />
    <input class="vr-reorder" type="number" min="0" value="${esc(v.reorderThreshold ?? inv?.reorderThreshold ?? 8)}" />
    <input class="vr-open" type="number" min="0" value="${inv ? inv.availableQty : (v.initialStock ?? 10)}" ${inv ? 'disabled title="Adjust existing SKU stock in Stock & Inventory tab"' : ''} />
    <input class="vr-def" type="radio" name="vr-default" ${v.isDefault || idx === 0 ? 'checked' : ''} style="width:16px;height:16px;justify-self:center;" />
    <button type="button" class="btn sm danger" onclick="this.parentElement.remove()">✕</button>
  `;
  list.appendChild(row);
}

function autoFillVariantSku(inputEl) {
  const row = inputEl.closest('.variant-row');
  const skuInput = row.querySelector('.vr-sku');
  if (skuInput.dataset.touched === '1' || skuInput.value.trim()) return;
  const tag = (document.getElementById('pm-niche-tag')?.value || 'SWSM').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const size = row.querySelector('.vr-size').value.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'STD';
  const variety = row.querySelector('.vr-variety').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  skuInput.value = variety ? `${tag}-${variety}-${size}` : `${tag}-${size}-01`;
}

function openProductModal(productId = null) {
  populateNicheSelects();
  const isEdit = Boolean(productId);
  document.getElementById('pm-is-edit').value = isEdit ? '1' : '0';
  document.getElementById('prod-modal-title').textContent = isEdit ? 'Edit Product & SKUs' : 'Add New Product';
  document.getElementById('pm-variants-list').innerHTML = '';

  const p = isEdit ? state.products.find(x => x.id === productId) : null;
  document.getElementById('pm-id').value = p ? p.id : '';
  document.getElementById('pm-id').disabled = isEdit;
  document.getElementById('pm-title').value = p ? p.title : '';
  document.getElementById('pm-subtitle').value = p ? (p.subtitle || '') : '';
  document.getElementById('pm-niche').value = p ? (p.niche || p.category || 'ghee') : (state.niches[0]?.id || 'ghee');
  document.getElementById('pm-niche-tag').value = p ? (p.nicheTag || 'GHSM') : (state.niches[0]?.tag || 'GHSM');
  document.getElementById('pm-image').value = p ? p.image : './images/shimla-ghee.webp';
  document.getElementById('pm-batchNo').value = p ? (p.batchNo || '') : '';
  document.getElementById('pm-badge').value = p ? (p.badge || '') : 'Mountain Harvest';
  document.getElementById('pm-tag').value = p ? (p.tag || 'always_available') : 'fresh_listed';
  document.getElementById('pm-pillText').value = p ? (p.pillText || '') : '';
  document.getElementById('pm-carouselNote').value = p ? (p.carouselNote || '') : '';
  document.getElementById('pm-visible').value = p && p.visible === false ? 'false' : 'true';
  document.getElementById('pm-packType').value = p ? (p.packType || '') : 'Glass Jar / Eco-Pouch';
  document.getElementById('pm-origin').value = p ? (p.origin || '') : 'Shimla, Himachal Pradesh';
  document.getElementById('pm-optionLabel').value = p ? (p.optionLabel || 'SELECT PACK SIZE') : 'SELECT PACK SIZE';
  document.getElementById('pm-specTag').value = p ? (p.specTag || '') : '';
  document.getElementById('pm-upcomingDate').value = p && p.upcomingDate ? String(p.upcomingDate).slice(0, 10) : '';
  document.getElementById('pm-description').value = p ? (p.description || '') : '';
  document.getElementById('pm-gallery').value = p && Array.isArray(p.gallery) ? p.gallery.join('\n') : '';
  document.getElementById('pm-specs').value = p && p.specs
    ? Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join('\n')
    : '';
  document.getElementById('pm-methodTitle').value = p ? (p.methodTitle || '') : '';
  document.getElementById('pm-methodSteps').value = p && Array.isArray(p.methodSteps)
    ? p.methodSteps.map(s => (typeof s === 'string' ? s : `${s.title || s.step || ''} | ${s.desc || s.detail || ''}`)).join('\n')
    : '';
  document.getElementById('pm-mathTitle').value = p ? (p.mathTitle || '') : '';
  document.getElementById('pm-mathSteps').value = p && Array.isArray(p.mathSteps)
    ? p.mathSteps.map(s => (typeof s === 'string' ? s : `${s.label || s.title || ''} | ${s.val || s.value || ''}`)).join('\n')
    : '';

  const vars = p && Array.isArray(p.variants) && p.variants.length
    ? p.variants
    : [{ size: '500g', price: 499, mrp: 650, reorderThreshold: 8, initialStock: 15, isDefault: true }];
  vars.forEach((v, idx) => addVariantEditorRow(v, idx));

  openModal('product-modal');
}

async function submitProductForm() {
  const isEdit = document.getElementById('pm-is-edit').value === '1';
  const id = document.getElementById('pm-id').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const variantRows = Array.from(document.querySelectorAll('#pm-variants-list .variant-row'));
  if (!variantRows.length) return showToast('Add at least one SKU variant', true);

  const variants = variantRows.map(r => ({
    size: r.querySelector('.vr-size').value.trim(),
    variety: r.querySelector('.vr-variety').value.trim(),
    sku: r.querySelector('.vr-sku').value.trim().toUpperCase(),
    price: Number(r.querySelector('.vr-price').value),
    mrp: Number(r.querySelector('.vr-mrp').value),
    reorderThreshold: Number(r.querySelector('.vr-reorder').value) || 8,
    initialStock: r.querySelector('.vr-open').disabled ? undefined : Number(r.querySelector('.vr-open').value || 0),
    isDefault: r.querySelector('.vr-def').checked,
    visible: true
  }));

  const payload = {
    id,
    title: document.getElementById('pm-title').value.trim(),
    subtitle: document.getElementById('pm-subtitle').value.trim(),
    niche: document.getElementById('pm-niche').value,
    nicheTag: document.getElementById('pm-niche-tag').value.trim().toUpperCase(),
    image: document.getElementById('pm-image').value.trim(),
    batchNo: document.getElementById('pm-batchNo').value.trim(),
    badge: document.getElementById('pm-badge').value.trim(),
    tag: document.getElementById('pm-tag').value,
    pillText: document.getElementById('pm-pillText').value.trim(),
    carouselNote: document.getElementById('pm-carouselNote').value.trim(),
    visible: document.getElementById('pm-visible').value === 'true',
    packType: document.getElementById('pm-packType').value.trim(),
    origin: document.getElementById('pm-origin').value.trim(),
    optionLabel: document.getElementById('pm-optionLabel').value.trim(),
    specTag: document.getElementById('pm-specTag').value.trim(),
    upcomingDate: document.getElementById('pm-upcomingDate').value || null,
    description: document.getElementById('pm-description').value.trim(),
    gallery: document.getElementById('pm-gallery').value.split('\n').map(s => s.trim()).filter(Boolean),
    specs: document.getElementById('pm-specs').value.split('\n').reduce((acc, line) => {
      const idx = line.indexOf(':');
      if (idx > 0) acc[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      return acc;
    }, {}),
    methodTitle: document.getElementById('pm-methodTitle').value.trim(),
    methodSteps: document.getElementById('pm-methodSteps').value.split('\n').map(s => s.trim()).filter(Boolean).map(line => {
      const [title, ...rest] = line.split('|');
      return { title: (title || '').trim(), desc: rest.join('|').trim() };
    }),
    mathTitle: document.getElementById('pm-mathTitle').value.trim(),
    mathSteps: document.getElementById('pm-mathSteps').value.split('\n').map(s => s.trim()).filter(Boolean).map(line => {
      const [label, ...rest] = line.split('|');
      return { label: (label || '').trim(), val: rest.join('|').trim() };
    }),
    variants
  };

  try {
    await apiFetch(isEdit ? `/api/admin/products/${encodeURIComponent(id)}` : '/api/admin/products', {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    closeModal('product-modal');
    showToast('Product saved & synchronized with storefront!');
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function uploadProductImage(inp) {
  if (!inp.files || !inp.files[0]) return;
  const fd = new FormData();
  fd.append('product_image', inp.files[0]);
  try {
    const res = await apiFetch('/api/admin/upload', { method: 'POST', body: fd });
    if (res.files && res.files[0]) {
      document.getElementById('pm-image').value = res.files[0].url;
      showToast('Image uploaded!');
    }
  } catch (err) {
    showToast(err.message, true);
  } finally {
    inp.value = '';
  }
}

async function toggleProductVisibility(id, nextVisible) {
  try {
    await apiFetch(`/api/admin/products/${encodeURIComponent(id)}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visible: nextVisible })
    });
    showToast(`Product ${nextVisible ? 'shown on storefront' : 'hidden from storefront'}`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function archiveProduct(id) {
  try {
    await apiFetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
    showToast('Product archive state updated');
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

function openNicheModal() {
  document.getElementById('nm-name').value = '';
  document.getElementById('nm-tag').value = '';
  openModal('niche-modal');
}

async function submitNicheForm() {
  try {
    await apiFetch('/api/admin/niches', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('nm-name').value.trim(),
        tag: document.getElementById('nm-tag').value.trim().toUpperCase()
      })
    });
    closeModal('niche-modal');
    showToast('Niche category added');
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

// ── 3. Stock & Inventory ────────────────────────────────────────
function renderInventory() {
  const entries = Object.values(state.inventory || {});
  const freeTotal = entries.reduce((s, i) => s + Math.max(0, (i.availableQty || 0) - (i.reservedQty || 0)), 0);
  const resTotal = entries.reduce((s, i) => s + (i.reservedQty || 0), 0);
  const lowTotal = entries.filter(i => {
    const f = Math.max(0, (i.availableQty || 0) - (i.reservedQty || 0));
    return f > 0 && f <= (i.reorderThreshold ?? 8);
  }).length;
  const outTotal = entries.filter(i => Math.max(0, (i.availableQty || 0) - (i.reservedQty || 0)) <= 0).length;
  const dmgTotal = entries.reduce((s, i) => s + (i.damagedQty || 0), 0);

  document.getElementById('inv-free-total').textContent = String(freeTotal);
  document.getElementById('inv-reserved-note').textContent = `${resTotal} reserved in confirmed orders`;
  document.getElementById('inv-low-total').textContent = String(lowTotal);
  document.getElementById('inv-out-total').textContent = String(outTotal);
  document.getElementById('inv-dmg-total').textContent = String(dmgTotal);

  const q = (document.getElementById('inv-search')?.value || '').toLowerCase();
  const prodMap = new Map((state.products || []).map(p => [p.id, p]));
  const filtered = entries.filter(i => {
    const prod = prodMap.get(i.productId);
    const txt = `${prod?.title || ''} ${i.variantLabel} ${i.sku}`.toLowerCase();
    return txt.includes(q);
  });

  const soldMap = new Map(((state.metrics && state.metrics.skuStockAndSales) || []).map(r => [r.sku, r]));
  const curSort = sortState.inventory || { col: 'product', dir: 'asc' };
  filtered.sort((a, b) => {
    let va, vb;
    const prodA = prodMap.get(a.productId);
    const prodB = prodMap.get(b.productId);
    const freeA = Math.max(0, (a.availableQty || 0) - (a.reservedQty || 0));
    const freeB = Math.max(0, (b.availableQty || 0) - (b.reservedQty || 0));
    const statsA = soldMap.get(a.sku) || { acceptedSoldQty: 0, dispatchedSoldQty: 0 };
    const statsB = soldMap.get(b.sku) || { acceptedSoldQty: 0, dispatchedSoldQty: 0 };

    switch (curSort.col) {
      case 'product':
        va = (prodA?.title || a.productId).toLowerCase();
        vb = (prodB?.title || b.productId).toLowerCase();
        break;
      case 'sku':
        va = (a.sku || '').toLowerCase();
        vb = (b.sku || '').toLowerCase();
        break;
      case 'physical':
        va = a.availableQty || 0;
        vb = b.availableQty || 0;
        break;
      case 'reserved':
        va = a.reservedQty || 0;
        vb = b.reservedQty || 0;
        break;
      case 'free':
        va = freeA;
        vb = freeB;
        break;
      case 'sold':
        va = statsA.acceptedSoldQty || 0;
        vb = statsB.acceptedSoldQty || 0;
        break;
      case 'damaged':
        va = a.damagedQty || 0;
        vb = b.damagedQty || 0;
        break;
      case 'reorder':
        va = a.reorderThreshold ?? 8;
        vb = b.reorderThreshold ?? 8;
        break;
      case 'health':
        va = freeA <= 0 ? 0 : freeA <= (a.reorderThreshold ?? 8) ? 1 : 2;
        vb = freeB <= 0 ? 0 : freeB <= (b.reorderThreshold ?? 8) ? 1 : 2;
        break;
      default:
        va = (prodA?.title || '').toLowerCase();
        vb = (prodB?.title || '').toLowerCase();
    }

    if (typeof va === 'string') {
      return curSort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return curSort.dir === 'asc' ? va - vb : vb - va;
  });

  document.getElementById('inventory-tbody').innerHTML = filtered.length ? filtered.map(i => {
    const prod = prodMap.get(i.productId);
    const free = Math.max(0, (i.availableQty || 0) - (i.reservedQty || 0));
    const thr = i.reorderThreshold ?? 8;
    const stats = soldMap.get(i.sku) || { acceptedSoldQty: 0, dispatchedSoldQty: 0 };
    const health = free <= 0 ? { cls: 'bad', txt: 'Out of stock' } : free <= thr ? { cls: 'warn', txt: 'Low stock' } : { cls: '', txt: 'Healthy' };
    return `
      <tr>
        <td><strong>${esc(prod?.title || i.productId)}</strong><div class="tiny">${esc(i.variantLabel)}</div></td>
        <td><span class="sku-code">${esc(i.sku)}</span></td>
        <td><strong>${i.availableQty}</strong></td>
        <td>${i.reservedQty || 0}</td>
        <td><strong>${free} left</strong></td>
        <td><strong>${stats.acceptedSoldQty || 0}</strong> <span class="tiny">(${stats.dispatchedSoldQty || 0} disp)</span></td>
        <td>${i.damagedQty || 0}</td>
        <td>${thr}</td>
        <td><span class="pill ${health.cls}">${health.txt}</span></td>
        <td><button type="button" class="btn sm" onclick="openStockModal('${esc(i.sku)}')">Adjust</button></td>
      </tr>
    `;
  }).join('') : '<tr><td colspan="10" class="empty-state">No SKUs found.</td></tr>';

  updateSortIndicators('inventory');
}

function renderMovements() {
  const q = (document.getElementById('mov-search')?.value || '').toLowerCase();
  const rows = (state.movements || []).filter(m =>
    `${m.sku} ${m.movementType} ${m.referenceOrderId || ''} ${m.batchId || ''} ${m.reason}`.toLowerCase().includes(q)
  );
  document.getElementById('movements-tbody').innerHTML = rows.length ? rows.slice(0, 120).map(m => `
    <tr>
      <td class="tiny">${esc(fmtDateTime(m.createdAt))}</td>
      <td><span class="sku-code">${esc(m.sku)}</span></td>
      <td><span class="pill ${m.movementType === 'damaged_stock' || m.movementType === 'dispatch_deduction' ? 'warn' : 'info'}">${esc(m.movementType)}</span></td>
      <td><strong>${m.qtyDelta > 0 ? '+' + m.qtyDelta : m.qtyDelta}</strong></td>
      <td class="tiny">${m.qtyBefore} → ${m.qtyAfter}</td>
      <td class="tiny">${esc(m.referenceOrderId || m.batchId || '—')}</td>
      <td>${esc(m.reason)}</td>
      <td class="tiny">${esc(m.createdBy)}</td>
    </tr>
  `).join('') : '<tr><td colspan="8" class="empty-state">No stock movements logged yet.</td></tr>';
}

function openStockModal(preselectedSku = '') {
  const sel = document.getElementById('sm-sku');
  const prodMap = new Map((state.products || []).map(p => [p.id, p]));
  sel.innerHTML = Object.values(state.inventory || {}).map(i => {
    const title = prodMap.get(i.productId)?.title || i.productId;
    return `<option value="${esc(i.sku)}">${esc(i.sku)} — ${esc(title)} (${esc(i.variantLabel)}) [Avail: ${i.availableQty}]</option>`;
  }).join('');
  if (preselectedSku) sel.value = preselectedSku;
  document.getElementById('sm-delta').value = '';
  document.getElementById('sm-reorder').value = '';
  document.getElementById('sm-reason').value = '';
  openModal('stock-modal');
}

async function submitStockAdjustment() {
  try {
    await apiFetch('/api/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        sku: document.getElementById('sm-sku').value,
        movementType: document.getElementById('sm-type').value,
        qtyDelta: Number(document.getElementById('sm-delta').value),
        reorderThreshold: document.getElementById('sm-reorder').value !== '' ? Number(document.getElementById('sm-reorder').value) : undefined,
        reason: document.getElementById('sm-reason').value.trim()
      })
    });
    closeModal('stock-modal');
    showToast('Stock updated with movement log!');
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

function openBulkStockModal() {
  const prodMap = new Map((state.products || []).map(p => [p.id, p]));
  const tbody = document.getElementById('bsm-tbody');
  tbody.innerHTML = Object.values(state.inventory || {}).map(i => {
    const title = prodMap.get(i.productId)?.title || i.productId;
    return `
      <tr class="bsm-row" data-sku="${esc(i.sku)}">
        <td><strong>${esc(title)}</strong><div class="tiny">${esc(i.variantLabel)}</div></td>
        <td><span class="sku-code">${esc(i.sku)}</span></td>
        <td>${i.reservedQty || 0}</td>
        <td><input type="number" class="bsm-qty" min="${i.reservedQty || 0}" value="${i.availableQty}" style="width:90px;" required /></td>
        <td><input type="number" class="bsm-reorder" min="0" value="${i.reorderThreshold ?? 8}" style="width:76px;" /></td>
      </tr>
    `;
  }).join('');
  document.getElementById('bsm-reason').value = '';
  openModal('bulk-stock-modal');
}

function zeroBulkInputs() {
  document.querySelectorAll('#bsm-tbody .bsm-row').forEach(row => {
    const inp = row.querySelector('.bsm-qty');
    const min = Number(inp.min) || 0;
    inp.value = String(min);
  });
}

async function submitBulkStockForm() {
  const reason = document.getElementById('bsm-reason').value.trim();
  const items = Array.from(document.querySelectorAll('#bsm-tbody .bsm-row')).map(row => ({
    sku: row.dataset.sku,
    availableQty: Number(row.querySelector('.bsm-qty').value),
    reorderThreshold: Number(row.querySelector('.bsm-reorder').value)
  }));
  try {
    const res = await apiFetch('/api/admin/inventory/bulk', {
      method: 'POST',
      body: JSON.stringify({ reason, items })
    });
    closeModal('bulk-stock-modal');
    showToast(`Updated physical stock on ${(res.updated || []).length} SKU(s)`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

// ── 4. Batches & Lab Reports ────────────────────────────────────
function renderBatches() {
  const q = (document.getElementById('batch-search')?.value || '').toLowerCase();
  const prodMap = new Map((state.products || []).map(p => [p.id, p]));
  const rows = (state.batches || []).filter(b => `${b.id} ${b.sku} ${b.productId}`.toLowerCase().includes(q));
  document.getElementById('batches-tbody').innerHTML = rows.length ? rows.map(b => {
    const title = prodMap.get(b.productId)?.title || b.productId;
    const stCls = b.status === 'active' ? '' : (b.status === 'low' ? 'warn' : 'bad');
    return `
      <tr>
        <td><strong>${esc(b.id)}</strong></td>
        <td>${esc(title)}<div class="tiny"><span class="sku-code">${esc(b.sku || b.sizeLabel)}</span></div></td>
        <td>${esc(b.productionDate || b.date || '—')}</td>
        <td>${esc(b.bestBeforeDate || '—')}</td>
        <td><strong>${b.remainingQty ?? '—'}</strong> / ${b.initialQty ?? '—'}</td>
        <td><span class="pill ${stCls}">${esc(b.status || 'active')}</span></td>
        <td>
          ${b.report ? `<a href="${esc(b.report)}" target="_blank" class="btn sm">View PDF ↗</a> ` : ''}
          <label class="btn sm" style="cursor:pointer;">Upload PDF<input type="file" accept=".pdf" style="display:none;" onchange="uploadBatchPdf(this, '${esc(b.id)}')" /></label>
        </td>
        <td>
          <div class="toolbar">
            <button type="button" class="btn sm" onclick="openBatchModal('${esc(b.id)}')">Edit</button>
            <button type="button" class="btn sm danger" onclick="deleteBatch('${esc(b.id)}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('') : '<tr><td colspan="8" class="empty-state">No production batches recorded yet.</td></tr>';
}

function onBatchProductChange() {
  const pid = document.getElementById('bm-product').value;
  const prod = state.products.find(p => p.id === pid);
  const skuSel = document.getElementById('bm-sku');
  skuSel.innerHTML = (prod?.variants || []).map(v => `<option value="${esc(v.sku)}">${esc(v.sku)} (${esc(v.label)})</option>`).join('');
}

function openBatchModal(batchId = null) {
  const isEdit = Boolean(batchId);
  document.getElementById('bm-is-edit').value = isEdit ? '1' : '0';
  document.getElementById('bm-title').textContent = isEdit ? `Edit Batch ${batchId}` : 'Create Production Batch';

  const prodSel = document.getElementById('bm-product');
  prodSel.innerHTML = (state.products || []).filter(p => !p.archived).map(p => `<option value="${esc(p.id)}">${esc(p.title)} (${esc(p.nicheTag)})</option>`).join('');

  const b = isEdit ? state.batches.find(x => x.id === batchId) : null;
  if (b) prodSel.value = b.productId;
  onBatchProductChange();
  if (b && b.sku) document.getElementById('bm-sku').value = b.sku;
  document.getElementById('bm-id').value = b ? b.id : '';
  document.getElementById('bm-id').disabled = isEdit;
  document.getElementById('bm-qty').value = b ? (b.remainingQty ?? b.initialQty ?? 0) : 25;
  document.getElementById('bm-made').value = new Date().toISOString().slice(0, 10);
  document.getElementById('bm-exp').value = '';
  document.getElementById('bm-add-inv').disabled = isEdit;
  document.getElementById('bm-add-inv').checked = !isEdit;
  document.getElementById('bm-pdf').value = '';
  openModal('batch-modal');
}

async function submitBatchForm() {
  const isEdit = document.getElementById('bm-is-edit').value === '1';
  let reportUrl;
  const pdfFile = document.getElementById('bm-pdf').files?.[0];
  try {
    if (pdfFile) {
      const fd = new FormData();
      fd.append('lab_report', pdfFile);
      const up = await apiFetch('/api/admin/upload', { method: 'POST', body: fd });
      reportUrl = up.files?.[0]?.url;
    }

    const payload = {
      id: document.getElementById('bm-id').value.trim().toUpperCase(),
      productId: document.getElementById('bm-product').value,
      sku: document.getElementById('bm-sku').value,
      productionDate: document.getElementById('bm-made').value,
      bestBeforeDate: document.getElementById('bm-exp').value,
      initialQty: isEdit ? undefined : Number(document.getElementById('bm-qty').value),
      remainingQty: isEdit ? Number(document.getElementById('bm-qty').value) : undefined,
      addToInventory: isEdit ? false : document.getElementById('bm-add-inv').checked,
      setAsActiveProductBatch: document.getElementById('bm-set-active').checked,
      report: reportUrl
    };

    const batchId = encodeURIComponent(payload.id);
    await apiFetch(isEdit ? `/api/admin/batches/${batchId}` : '/api/admin/batches', {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    closeModal('batch-modal');
    showToast('Batch record saved & synced!');
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function uploadBatchPdf(inp, batchId) {
  if (!inp.files || !inp.files[0]) return;
  const fd = new FormData();
  fd.append('lab_report', inp.files[0]);
  try {
    const up = await apiFetch('/api/admin/upload', { method: 'POST', body: fd });
    const url = up.files?.[0]?.url;
    const b = state.batches.find(x => x.id === batchId);
    if (url && b) {
      await apiFetch(`/api/admin/batches/${encodeURIComponent(batchId)}`, {
        method: 'PUT',
        body: JSON.stringify({ ...b, report: url })
      });
      showToast(`Lab PDF linked to batch ${batchId}`);
      await loadBootstrap();
    }
  } catch (err) {
    showToast(err.message, true);
  } finally {
    inp.value = '';
  }
}

async function deleteBatch(batchId) {
  if (!confirm(`Delete batch ${batchId}?`)) return;
  try {
    await apiFetch(`/api/admin/batches/${encodeURIComponent(batchId)}`, { method: 'DELETE' });
    showToast('Batch deleted');
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

// ── 5. Orders, Payments, Returns & Refunds ──────────────────────
function setOrderFilter(filterVal, btnEl) {
  orderFilter = filterVal;
  document.querySelectorAll('#order-status-tabs .fpill').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderOrders();
}

function renderOrderStatusPill(orderOrStatus) {
  const isObj = orderOrStatus && typeof orderOrStatus === 'object';
  const st = isObj ? orderOrStatus.orderStatus : orderOrStatus;
  if (isObj && st === 'waiting_followup') {
    const due = isFollowUpDueClient(orderOrStatus);
    return `<span class="pill ${due ? 'warn' : 'info'}">${due ? '⏰ 2d Wait Over — Ask Again!' : '⏳ Waiting Follow-up'}</span>`;
  }
  const map = {
    pending_whatsapp: ['Verify Buy Needed', 'warn'],
    waiting_followup: ['Waiting Follow-up', 'info'],
    confirmed: ['Buy Accepted', 'info'],
    processing: ['Processing', 'info'],
    ready_for_dispatch: ['Ready Dispatch', 'info'],
    dispatched: ['Dispatched', ''],
    delivered: ['Delivered', ''],
    cancelled: [
      isObj && orderOrStatus.verificationState === 'not_bought' ? 'Not Bought' : 'Cancelled',
      isObj && orderOrStatus.verificationState === 'not_bought' ? 'muted' : 'bad'
    ],
    return_requested: ['Return Requested', 'purple'],
    return_approved: ['Return Approved', 'purple'],
    return_received: ['Return Received', 'purple'],
    return_inspected: ['Return Inspected', 'purple']
  };
  const [label, cls] = map[st] || [st, 'muted'];
  return `<span class="pill ${cls}">${esc(label)}</span>`;
}

function renderPayPill(st, method = '') {
  const cls = st === 'paid'
    ? ''
    : (st === 'refunded' || st === 'partially_refunded'
      ? 'purple'
      : (st === 'failed' ? 'bad' : 'warn'));
  const mNorm = method === 'ONLINE' ? 'UPI' : (method === 'COD' ? 'Cash' : method);
  const txt = mNorm ? `${st} · ${mNorm}` : st;
  return `<span class="pill ${cls}">${esc(txt)}</span>`;
}

function renderOrders() {
  const q = (document.getElementById('order-search')?.value || '').toLowerCase();
  const rows = (state.orders || []).filter(o => {
    if (orderFilter === 'returns') {
      if (!o.orderStatus.startsWith('return_') && !o.returnDetails) return false;
    } else if (orderFilter === 'processing') {
      if (!['processing', 'ready_for_dispatch'].includes(o.orderStatus)) return false;
    } else if (orderFilter === 'pending_whatsapp') {
      if (o.orderStatus !== 'pending_whatsapp' && !isFollowUpDueClient(o)) return false;
    } else if (orderFilter !== 'all' && o.orderStatus !== orderFilter) {
      return false;
    }
    const itemsStr = (o.itemsSnapshot || []).map(i => `${i.productName} ${i.sku}`).join(' ');
    const txt = `${o.orderId} ${o.customerSnapshot?.name} ${o.customerSnapshot?.phone} ${itemsStr}`.toLowerCase();
    return txt.includes(q);
  });

  const curSort = sortState.orders || { col: 'orderId', dir: 'desc' };
  rows.sort((a, b) => {
    let va, vb;
    switch (curSort.col) {
      case 'orderId':
        va = a.orderId || '';
        vb = b.orderId || '';
        break;
      case 'customer':
        va = (a.customerSnapshot?.name || '').toLowerCase();
        vb = (b.customerSnapshot?.name || '').toLowerCase();
        break;
      case 'total':
        va = a.grandTotal || 0;
        vb = b.grandTotal || 0;
        break;
      case 'payment':
        va = (a.paymentStatus || '').toLowerCase();
        vb = (b.paymentStatus || '').toLowerCase();
        break;
      case 'status':
        va = (a.orderStatus || '').toLowerCase();
        vb = (b.orderStatus || '').toLowerCase();
        break;
      default:
        va = a.orderId || '';
        vb = b.orderId || '';
    }
    if (typeof va === 'string') {
      return curSort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return curSort.dir === 'asc' ? va - vb : vb - va;
  });

  const tbody = document.getElementById('orders-tbody');
  tbody.innerHTML = rows.length ? rows.map(o => {
    const itemsHtml = (o.itemsSnapshot || []).map(i =>
      `<div><strong>${esc(i.productName)}</strong> (${esc(i.variantLabel)}) × ${i.quantity} <span class="sku-code">${esc(i.sku)}</span></div>`
    ).join('');

    const st = o.orderStatus;
    const isPaid = (o.paymentStatus === 'paid' || o.paymentStatus === 'partially_refunded');
    const isSettled = (st === 'delivered' && isPaid);
    const btns = [];

    // Always provide View button
    btns.push(`<button type="button" class="btn sm" onclick="openOrderDetails('${esc(o.orderId)}')">View</button>`);

    if (isSettled) {
      // Order is delivered and payment received: clean settled state!
      // Only View (and Return/Inspect if customer requests return)
      if (['delivered', 'return_requested', 'return_approved', 'return_received'].includes(st)) {
        btns.push(`<button type="button" class="btn sm danger" onclick="openReturnModal('${esc(o.orderId)}')">Return / Inspect</button>`);
      }
    } else if (st === 'pending_whatsapp' || st === 'waiting_followup') {
      // Stage 1: Verification Queue
      btns.push(`<button type="button" class="btn sm primary" onclick="openVerifyBuyModal('${esc(o.orderId)}','accept')">Verify Buy</button>`);
      btns.push(`<button type="button" class="btn sm gold" onclick="quickWaitOrder('${esc(o.orderId)}', 2)">Wait (2d)</button>`);
      btns.push(`<button type="button" class="btn sm danger" onclick="openVerifyBuyModal('${esc(o.orderId)}','not_bought')">Not Bought</button>`);
    } else if (['confirmed', 'processing', 'ready_for_dispatch'].includes(st)) {
      // Stage 2: Confirmed / Packaging
      const confSent = o.whatsappComms && o.whatsappComms.confirmSentAt;
      btns.push(`<button type="button" class="btn sm primary" onclick="openDispatchModal('${esc(o.orderId)}')">Mark Dispatched</button>`);
      if (!confSent) {
        btns.push(`<button type="button" class="btn sm" onclick="openWhatsAppSendModal('${esc(o.orderId)}','confirm')">WA Msg</button>`);
      }
      if (!isPaid) {
        btns.push(`<button type="button" class="btn sm gold" onclick="openPaymentModal('${esc(o.orderId)}')">Payment Received</button>`);
        btns.push(`<button type="button" class="btn sm danger" onclick="doCancelOrder('${esc(o.orderId)}')">Cancel</button>`);
      }
    } else if (st === 'dispatched') {
      // Stage 3: Dispatched & In Transit
      const dispSent = o.whatsappComms && o.whatsappComms.dispatchSentAt;
      btns.push(`<button type="button" class="btn sm ${dispSent ? '' : 'gold'}" onclick="openWhatsAppSendModal('${esc(o.orderId)}','dispatch')">${dispSent ? '✓ WA Track' : 'WhatsApp Track'}</button>`);
      btns.push(`<button type="button" class="btn sm primary" onclick="doDeliverOrder('${esc(o.orderId)}')">Mark Delivered</button>`);
      if (!isPaid) {
        btns.push(`<button type="button" class="btn sm gold" onclick="openPaymentModal('${esc(o.orderId)}')">Payment Received</button>`);
      }
    } else if (st === 'delivered') {
      // Stage 4: Delivered, awaiting payment if unpaid (e.g. COD cash collection)
      if (!isPaid) {
        btns.push(`<button type="button" class="btn sm gold" onclick="openPaymentModal('${esc(o.orderId)}')">Payment Received</button>`);
      }
      btns.push(`<button type="button" class="btn sm danger" onclick="openReturnModal('${esc(o.orderId)}')">Return / Inspect</button>`);
    } else if (st === 'cancelled') {
      // Stage 5: Cancelled
      if (isPaid) {
        btns.push(`<button type="button" class="btn sm" onclick="openRefundModal('${esc(o.orderId)}')">Refund</button>`);
      }
    } else if (st.startsWith('return_') || o.returnDetails) {
      btns.push(`<button type="button" class="btn sm danger" onclick="openReturnModal('${esc(o.orderId)}')">Return / Inspect</button>`);
      if (isPaid) {
        btns.push(`<button type="button" class="btn sm" onclick="openRefundModal('${esc(o.orderId)}')">Refund</button>`);
      }
    }

    const waBadge = (o.whatsappComms?.dispatchSentAt)
      ? `<div class="tiny" style="color:var(--ok-fg);">✓ WA tracking sent</div>`
      : (o.whatsappComms?.confirmSentAt ? `<div class="tiny" style="color:var(--ok-fg);">✓ WA confirm sent</div>` : '');
    const followUpSub = st === 'waiting_followup'
      ? `<div class="tiny" style="color:${isFollowUpDueClient(o) ? 'var(--bad-fg)' : 'var(--warn-fg)'};">${esc(formatFollowUpMeta(o.followUpAt))}</div>`
      : st === 'pending_whatsapp'
        ? `<div class="tiny">Clicked WhatsApp Buy</div>`
        : o.stockDeducted
          ? `<div class="tiny">Stock deducted${o.shippingDetails?.trackingId ? ' · ' + esc(o.shippingDetails.trackingId) : ''}</div>${waBadge}`
          : o.stockReserved
            ? `<div class="tiny">Stock reserved</div>${waBadge}`
            : waBadge;

    return `
      <tr>
        <td><strong>${esc(o.orderId)}</strong><div class="tiny">${esc(fmtDateTime(o.createdAt))}</div></td>
        <td><strong>${esc(o.customerSnapshot?.name || '')}</strong><div class="tiny">+91 ${esc(o.customerSnapshot?.phone || '')}</div></td>
        <td>${itemsHtml}</td>
        <td><strong>${cash(o.grandTotal)}</strong>${o.discountCode ? `<div class="tiny">${esc(o.discountCode)} (−${cash(o.discountAmount)})</div>` : ''}${o.agreedTotalOverride !== null && o.agreedTotalOverride !== undefined ? '<div class="tiny" style="color:var(--warn-fg);">Custom agreed</div>' : ''}</td>
        <td>${renderPayPill(o.paymentStatus, o.paymentMethod)}</td>
        <td>${renderOrderStatusPill(o)}${followUpSub}</td>
        <td><div class="toolbar">${btns.join('')}</div></td>
      </tr>
    `;
  }).join('') : '<tr><td colspan="7" class="empty-state">No orders in this queue.</td></tr>';
  updateSortIndicators('orders');
}

function getAllSkuPriceMap() {
  const map = new Map();
  (state.products || []).forEach(p => {
    (p.variants || []).forEach(v => {
      map.set(v.sku, { sku: v.sku, label: `${p.title} (${v.label || v.size})`, price: Number(v.price) || 0 });
    });
  });
  return map;
}

function selectVerifyDecision(decision) {
  document.getElementById('vb-decision').value = decision;
  document.querySelectorAll('[data-vb-opt]').forEach(el => {
    el.classList.toggle('active', el.dataset.vbOpt === decision);
  });
  document.getElementById('vb-accept-box').style.display = decision === 'accept' ? 'block' : 'none';
  document.getElementById('vb-wait-box').style.display = decision === 'wait' ? 'block' : 'none';
  document.getElementById('vb-reject-box').style.display = decision === 'not_bought' ? 'block' : 'none';

  const submitBtn = document.getElementById('vb-submit-btn');
  if (decision === 'accept') {
    submitBtn.textContent = 'Accept Buy & Open WhatsApp';
    submitBtn.className = 'btn primary';
  } else if (decision === 'wait') {
    submitBtn.textContent = 'Snooze & Remind Later';
    submitBtn.className = 'btn gold';
  } else {
    submitBtn.textContent = 'Mark as Not Bought / Cancelled';
    submitBtn.className = 'btn danger';
  }
}

function addVerifyBuyItemRow(skuVal = '', qtyVal = 1) {
  const container = document.getElementById('vb-items-list');
  const skuMap = getAllSkuPriceMap();
  const optionsHtml = Array.from(skuMap.values()).map(s =>
    `<option value="${esc(s.sku)}" ${s.sku === skuVal ? 'selected' : ''}>${esc(s.sku)} — ${esc(s.label)} (${cash(s.price)})</option>`
  ).join('');
  const div = document.createElement('div');
  div.className = 'vb-item-row';
  div.innerHTML = `
    <select class="vb-item-sku" onchange="recalcVerifyBuyPreview()">${optionsHtml}</select>
    <input type="number" class="vb-item-qty" min="1" max="100" value="${Number(qtyVal) || 1}" oninput="recalcVerifyBuyPreview()" />
    <button type="button" class="btn sm danger" onclick="this.parentElement.remove(); recalcVerifyBuyPreview();">✕</button>
  `;
  container.appendChild(div);
  recalcVerifyBuyPreview();
}

function recalcVerifyBuyPreview() {
  const oid = document.getElementById('vb-order-id').value;
  const ord = state.orders.find(x => x.orderId === oid);
  const skuMap = getAllSkuPriceMap();
  const rows = Array.from(document.querySelectorAll('#vb-items-list .vb-item-row'));
  let sub = 0;
  rows.forEach(r => {
    const sku = r.querySelector('.vb-item-sku').value;
    const qty = Math.max(1, Number(r.querySelector('.vb-item-qty').value) || 1);
    sub += (skuMap.get(sku)?.price || 0) * qty;
  });
  const payMode = document.getElementById('vb-pay-method').value;
  const codFee = payMode === 'COD' ? Number(state.settings?.cod_fee ?? 25) : 0;
  const disc = Number(ord?.discountAmount || 0);
  const autoTotal = Math.max(0, sub - disc + codFee);
  document.getElementById('vb-calc-hint').textContent = `(SKU total: ${cash(autoTotal)})`;
  const agreedEl = document.getElementById('vb-agreed-total');
  if (agreedEl) agreedEl.value = String(autoTotal);
}

function openVerifyBuyModal(orderId, initialDecision = 'accept') {
  const o = state.orders.find(x => x.orderId === orderId);
  if (!o) return;
  document.getElementById('vb-order-id').value = o.orderId;
  document.getElementById('vb-modal-title').textContent = `Verify Buy — ${o.orderId}`;
  document.getElementById('vb-modal-sub').textContent =
    `Reached "Confirm Order on WhatsApp" on ${fmtDateTime(o.whatsappClickedAt || o.createdAt)} · Quote: ${cash(o.grandTotal)}`;

  const histTxt = (o.verificationHistory || []).slice(0, 3).map(h =>
    `${fmtDateTime(h.actedAt)}: ${h.action} — ${h.note}`
  ).join(' | ');
  const rawCustPhone = o.customerSnapshot?.phone || '';
  const cleanCustPhone = String(rawCustPhone).replace(/\D/g, '').slice(-10);
  const brandName = (state.settings && state.settings.brand_name) || 'Shimla Wali';
  const chatMsg = encodeURIComponent(`Hi ${o.customerSnapshot?.name || ''}, regarding your ${brandName} order ${o.orderId}`);
  document.getElementById('vb-order-banner').innerHTML =
    `<strong>Customer:</strong> ${esc(o.customerSnapshot?.name)} (+91 ${esc(cleanCustPhone || rawCustPhone)})` +
    (cleanCustPhone ? ` <a href="https://wa.me/91${cleanCustPhone}?text=${chatMsg}" target="_blank" rel="noopener noreferrer" style="color:var(--ok-fg);font-weight:700;text-decoration:underline;margin-left:8px;">Chat on WhatsApp ↗</a>` : '') +
    (o.followUpCount ? `<br><strong>Previous Follow-ups:</strong> ${o.followUpCount} (${esc(histTxt)})` : '');

  const list = document.getElementById('vb-items-list');
  list.innerHTML = '';
  (o.itemsSnapshot || []).forEach(it => addVerifyBuyItemRow(it.sku, it.quantity));

  document.getElementById('vb-cust-name').value = o.customerSnapshot?.name || '';
  document.getElementById('vb-cust-phone').value = o.customerSnapshot?.phone || '';
  document.getElementById('vb-cust-city').value = o.customerSnapshot?.city || '';
  document.getElementById('vb-cust-pin').value = o.customerSnapshot?.pincode || '';
  document.getElementById('vb-cust-addr').value = o.customerSnapshot?.address || '';
  document.getElementById('vb-pay-method').value = o.paymentMethod || 'COD';
  recalcVerifyBuyPreview();
  if (o.agreedTotalOverride !== null && o.agreedTotalOverride !== undefined) {
    document.getElementById('vb-agreed-total').value = String(o.agreedTotalOverride);
  }

  document.getElementById('vb-dispatch-now').checked = false;
  document.getElementById('vb-disp-fields').style.display = 'none';
  if (document.getElementById('vb-courier')) document.getElementById('vb-courier').value = 'Delhivery';
  document.getElementById('vb-tracking').value = '';
  if (document.getElementById('vb-eta')) document.getElementById('vb-eta').value = 'In 2–4 days (Pan-India Express)';
  document.getElementById('vb-accept-note').value = o.verificationNotes || '';

  document.getElementById('vb-wait-days').value = '2';
  document.getElementById('vb-custom-date-wrap').style.display = 'none';
  document.getElementById('vb-wait-note').value = '';

  selectVerifyDecision(initialDecision);
  openModal('verify-buy-modal');
}

async function submitVerifyBuyDecision() {
  const orderId = document.getElementById('vb-order-id').value;
  const decision = document.getElementById('vb-decision').value;
  const payload = { decision };

  if (decision === 'accept') {
    const itemRows = Array.from(document.querySelectorAll('#vb-items-list .vb-item-row'));
    if (!itemRows.length) return showToast('At least one product SKU is required to accept a buy', true);
    payload.items = itemRows.map(r => ({
      sku: r.querySelector('.vb-item-sku').value,
      quantity: Math.max(1, Number(r.querySelector('.vb-item-qty').value) || 1)
    }));
    payload.customer = {
      name: document.getElementById('vb-cust-name').value.trim(),
      phone: document.getElementById('vb-cust-phone').value.trim(),
      city: document.getElementById('vb-cust-city').value.trim(),
      pincode: document.getElementById('vb-cust-pin').value.trim(),
      address: document.getElementById('vb-cust-addr').value.trim()
    };
    payload.paymentMethod = document.getElementById('vb-pay-method').value;
    const agreedRaw = document.getElementById('vb-agreed-total').value;
    if (agreedRaw !== '') payload.agreedTotal = Number(agreedRaw);
    payload.dispatchNow = document.getElementById('vb-dispatch-now').checked;
    payload.courier = document.getElementById('vb-courier').value.trim();
    payload.trackingId = document.getElementById('vb-tracking').value.trim();
    payload.expectedDeliveryText = document.getElementById('vb-eta') ? document.getElementById('vb-eta').value : '';
    payload.notes = document.getElementById('vb-accept-note').value.trim();
  } else if (decision === 'wait') {
    const sel = document.getElementById('vb-wait-days').value;
    if (sel === 'custom') {
      const customVal = document.getElementById('vb-wait-custom-at').value;
      if (!customVal) return showToast('Please pick a follow-up date and time', true);
      payload.followUpAt = new Date(customVal).toISOString();
    } else {
      payload.followUpDays = Number(sel) || 2;
    }
    payload.notes = document.getElementById('vb-wait-note').value.trim() || `Follow up after ${payload.followUpDays || 2} day(s)`;
  } else {
    payload.reason = document.getElementById('vb-reject-reason').value.trim() || 'Not bought on WhatsApp';
  }

  try {
    const res = await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/verify-buy`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    closeModal('verify-buy-modal');
    const msg = decision === 'accept'
      ? `Buy accepted for ${orderId} — stock & sales updated live!`
      : decision === 'wait'
        ? `Order ${orderId} snoozed — will re-ask when follow-up is due!`
        : `Order ${orderId} marked Not Bought`;
    showToast(msg);
    await loadBootstrap();
    if (decision === 'accept') {
      const stage = payload.dispatchNow ? 'dispatch' : 'confirm';
      const waInfo = (res.whatsapp && res.whatsapp[stage]) || (res.messages && res.messages[stage]) || null;
      openWhatsAppSendModal(orderId, stage, waInfo);
    }
  } catch (err) {
    showToast(err.message, true);
  }
}

async function quickWaitOrder(orderId, days = 2) {
  try {
    await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/verify-buy`, {
      method: 'POST',
      body: JSON.stringify({
        decision: 'wait',
        followUpDays: days,
        notes: `Wait karo abhi — re-ask after ${days} days`
      })
    });
    showToast(`${orderId} snoozed for ${days} days — portal will re-ask automatically!`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function doConfirmOrder(orderId) {
  try {
    await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/confirm`, { method: 'POST', body: JSON.stringify({}) });
    showToast(`Order ${orderId} confirmed — stock reserved`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function doAdvanceStatus(orderId, targetStatus) {
  try {
    await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'POST',
      body: JSON.stringify({ targetStatus })
    });
    showToast(`Order ${orderId} moved to ${targetStatus}`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

function computeClientTrackingUrl(courier, trackingId) {
  const awb = encodeURIComponent(String(trackingId || '').trim());
  const cKey = String(courier || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!trackingId && cKey !== 'indiapost') return '';
  if (cKey === 'delhivery') return `https://www.delhivery.com/track/package/${awb}`;
  if (cKey === 'bluedart') return `https://www.bluedart.com/tracking?handler=tnt&action=awbquery&awb=awb&numbers=${awb}`;
  if (cKey === 'dtdc') return `https://www.dtdc.in/tracking.asp?strCnno=${awb}`;
  if (cKey === 'indiapost') return 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx';
  if (cKey === 'xpressbees') return `https://www.xpressbees.com/shipment/tracking?awbNo=${awb}`;
  if (cKey === 'shadowfax') return `https://tracker.shadowfax.in/#/track?waybill=${awb}`;
  if (cKey === 'ecomexpress') return `https://ecomexpress.in/tracking/?awb_field=${awb}`;
  if (cKey === 'shiprocket') return `https://www.shiprocket.in/shipment-tracking/?id=${awb}`;
  return trackingId ? `https://www.google.com/search?q=${encodeURIComponent(courier + ' tracking ' + trackingId)}` : '';
}

function updateDispatchTrackingPreview() {
  const courier = document.getElementById('dp-courier').value;
  const trackingId = document.getElementById('dp-tracking').value.trim();
  const urlInp = document.getElementById('dp-tracking-url');
  if (urlInp) urlInp.value = computeClientTrackingUrl(courier, trackingId);
}

function openDispatchModal(orderId) {
  document.getElementById('dp-order-id').value = orderId;
  document.getElementById('dp-courier').value = 'Delhivery';
  document.getElementById('dp-tracking').value = '';
  document.getElementById('dp-tracking-url').value = '';
  document.getElementById('dp-eta').value = 'In 2–4 days (Pan-India Express)';
  document.getElementById('dp-eta-custom-wrap').style.display = 'none';
  document.getElementById('dp-eta-custom').value = '';
  document.getElementById('dp-notes').value = '';
  openModal('dispatch-modal');
}

async function submitDispatch() {
  const orderId = document.getElementById('dp-order-id').value;
  const etaSel = document.getElementById('dp-eta').value;
  const expectedDeliveryText = etaSel === 'custom'
    ? document.getElementById('dp-eta-custom').value.trim()
    : etaSel;
  try {
    const res = await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/dispatch`, {
      method: 'POST',
      body: JSON.stringify({
        courier: document.getElementById('dp-courier').value.trim(),
        trackingId: document.getElementById('dp-tracking').value.trim(),
        trackingUrl: document.getElementById('dp-tracking-url').value.trim(),
        expectedDeliveryText,
        dispatchNotes: document.getElementById('dp-notes').value.trim(),
        idempotencyKey: `disp-${orderId}-${Date.now()}`
      })
    });
    closeModal('dispatch-modal');
    showToast(`Order ${orderId} dispatched & stock deducted!`);
    await loadBootstrap();
    if (res.whatsapp && res.whatsapp.dispatch) {
      openWhatsAppSendModal(orderId, 'dispatch', res.whatsapp.dispatch);
    }
  } catch (err) {
    showToast(err.message, true);
  }
}

async function openWhatsAppSendModal(orderId, stage = 'confirm', preloadedPayload = null) {
  const o = state.orders.find(x => x.orderId === orderId);
  if (!o) return;
  let info = preloadedPayload;
  if (!info) {
    try {
      const res = await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/whatsapp`);
      info = stage === 'dispatch' ? (res.whatsapp?.dispatch || res.messages?.dispatch) : (res.whatsapp?.confirm || res.messages?.confirm);
    } catch (err) {
      showToast(err.message, true);
      return;
    }
  }
  const cleanStage = stage === 'dispatch' ? 'dispatch' : 'confirm';
  const rawPhone = info?.phone || o.customerSnapshot?.phone || '';
  const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
  document.getElementById('was-order-id').value = orderId;
  document.getElementById('was-stage').value = cleanStage;
  document.getElementById('was-phone').value = cleanPhone;
  document.getElementById('was-title').textContent = cleanStage === 'dispatch'
    ? `WhatsApp Dispatch & Tracking — ${orderId}`
    : `WhatsApp Order Confirmation — ${orderId}`;
  document.getElementById('was-sub').textContent = cleanStage === 'dispatch'
    ? 'Includes live courier tracking link & delivery estimate — 1 tap to send.'
    : 'Confirms order, items, quantities & total (no payment handle exposed).';
  const sentBefore = cleanStage === 'dispatch' ? o.whatsappComms?.dispatchSentAt : o.whatsappComms?.confirmSentAt;
  document.getElementById('was-recipient-bar').innerHTML =
    `<strong>To:</strong> ${esc(o.customerSnapshot?.name || 'Customer')} (+91 ${esc(cleanPhone || rawPhone)})` +
    (info?.trackingUrl ? `<br><strong>Tracking Link:</strong> <a href="${esc(info.trackingUrl)}" target="_blank" rel="noopener noreferrer">${esc(info.trackingUrl)}</a>` : '') +
    (sentBefore ? `<br><span style="color:var(--ok-fg);font-weight:700;">✓ Previously sent on ${esc(fmtDateTime(sentBefore))}</span>` : '');
  document.getElementById('was-msg').value = info?.message || '';
  openModal('wa-send-modal');
}

async function sendWhatsAppUpdateAndLog() {
  const orderId = document.getElementById('was-order-id').value;
  const stage = document.getElementById('was-stage').value;
  const rawPhone = String(document.getElementById('was-phone').value || '');
  const phone = rawPhone.replace(/\D/g, '').slice(-10);
  const message = document.getElementById('was-msg').value.trim();
  if (!phone || phone.length !== 10) return showToast('Valid 10-digit customer mobile number missing', true);

  const waUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;

  // Reliable open with mobile browser / popup blocker fallback
  let opened = false;
  try {
    const w = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (w && !w.closed && typeof w.closed !== 'undefined') {
      opened = true;
    }
  } catch (e) {}

  if (!opened) {
    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
    }, 500);
  }

  try {
    await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/whatsapp-sent`, {
      method: 'POST',
      body: JSON.stringify({ stage })
    });
    closeModal('wa-send-modal');
    showToast(`Opened WhatsApp & logged ${stage} message sent!`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function copyWhatsAppMessageOnly() {
  const orderId = document.getElementById('was-order-id').value;
  const stage = document.getElementById('was-stage').value;
  const message = document.getElementById('was-msg').value;
  try {
    if (navigator.clipboard) await navigator.clipboard.writeText(message);
    await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/whatsapp-sent`, {
      method: 'POST',
      body: JSON.stringify({ stage })
    });
    showToast('Message copied to clipboard & marked Sent!');
    await loadBootstrap();
  } catch (err) {
    showToast(err.message || 'Copied message', false);
  }
}

async function doDeliverOrder(orderId) {
  try {
    await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/deliver`, { method: 'POST', body: JSON.stringify({}) });
    showToast(`Order ${orderId} marked Delivered`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function doCancelOrder(orderId) {
  const reason = prompt(`Cancel order ${orderId}? Enter reason:`, 'Customer did not confirm on WhatsApp');
  if (reason === null) return;
  try {
    await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    showToast(`Order ${orderId} cancelled`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

function openPaymentModal(orderId) {
  const o = state.orders.find(x => x.orderId === orderId);
  document.getElementById('py-order-id').value = orderId;
  document.getElementById('py-action').value = 'mark_paid';
  document.getElementById('py-method').value = o?.paymentMethod || 'ONLINE';
  document.getElementById('py-ref').value = '';
  document.getElementById('py-notes').value = '';
  openModal('payment-modal');
}

async function submitPaymentVerification() {
  const orderId = document.getElementById('py-order-id').value;
  try {
    await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/payment`, {
      method: 'POST',
      body: JSON.stringify({
        action: document.getElementById('py-action').value,
        paymentMethod: document.getElementById('py-method').value,
        transactionReference: document.getElementById('py-ref').value.trim(),
        notes: document.getElementById('py-notes').value.trim()
      })
    });
    closeModal('payment-modal');
    showToast(`Payment status updated for ${orderId}`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

function openReturnModal(orderId) {
  const o = state.orders.find(x => x.orderId === orderId);
  const totalQty = (o?.itemsSnapshot || []).reduce((s, i) => s + i.quantity, 0);
  document.getElementById('rt-order-id').value = orderId;
  document.getElementById('rt-order-summary').innerHTML =
    `<strong>${esc(orderId)}</strong> — Shipped ${totalQty} total unit(s): ${(o?.itemsSnapshot || []).map(i => `${esc(i.sku)} × ${i.quantity}`).join(', ')}`;
  document.getElementById('rt-stage').value = 'return_inspected';
  document.getElementById('rt-inspect-fields').style.display = 'grid';
  document.getElementById('rt-reason').value = o?.returnDetails?.reason || '';
  document.getElementById('rt-restock').value = String(totalQty);
  document.getElementById('rt-damaged').value = '0';
  document.getElementById('rt-notes').value = '';
  openModal('return-modal');
}

async function submitReturnInspection() {
  const orderId = document.getElementById('rt-order-id').value;
  try {
    await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/return`, {
      method: 'POST',
      body: JSON.stringify({
        stage: document.getElementById('rt-stage').value,
        reason: document.getElementById('rt-reason').value.trim(),
        restockedQty: Number(document.getElementById('rt-restock').value) || 0,
        damagedQty: Number(document.getElementById('rt-damaged').value) || 0,
        notes: document.getElementById('rt-notes').value.trim()
      })
    });
    closeModal('return-modal');
    showToast(`Return inspection saved for ${orderId}`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

function openRefundModal(orderId) {
  const o = state.orders.find(x => x.orderId === orderId);
  document.getElementById('rf-order-id').value = orderId;
  document.getElementById('rf-amount').value = o ? o.grandTotal : '';
  document.getElementById('rf-ref').value = '';
  document.getElementById('rf-notes').value = '';
  openModal('refund-modal');
}

async function submitRefund() {
  const orderId = document.getElementById('rf-order-id').value;
  try {
    await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/refund`, {
      method: 'POST',
      body: JSON.stringify({
        refundAmount: Number(document.getElementById('rf-amount').value),
        transactionReference: document.getElementById('rf-ref').value.trim(),
        notes: document.getElementById('rf-notes').value.trim()
      })
    });
    closeModal('refund-modal');
    showToast(`Refund processed for ${orderId}`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

function openManualOrderModal() {
  const sel = document.getElementById('mo-sku');
  const prodMap = new Map((state.products || []).map(p => [p.id, p]));
  sel.innerHTML = Object.values(state.inventory || {}).map(i => {
    const prod = prodMap.get(i.productId);
    const v = prod?.variants?.find(x => x.sku === i.sku);
    return `<option value="${esc(i.sku)}">${esc(i.sku)} — ${esc(prod?.title || '')} (${esc(i.variantLabel)}) · ${cash(v?.price || prod?.price || 0)}</option>`;
  }).join('');
  openModal('manual-order-modal');
}

async function submitManualOrder() {
  try {
    await apiFetch('/api/admin/orders/manual', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          name: document.getElementById('mo-name').value.trim(),
          phone: document.getElementById('mo-phone').value.trim(),
          address: document.getElementById('mo-addr').value.trim(),
          city: document.getElementById('mo-city').value.trim(),
          pincode: document.getElementById('mo-pin').value.trim()
        },
        items: [{ sku: document.getElementById('mo-sku').value, quantity: Number(document.getElementById('mo-qty').value) }],
        paymentMethod: document.getElementById('mo-pay').value
      })
    });
    closeModal('manual-order-modal');
    showToast('WhatsApp order request added!');
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

function openOrderDetails(orderId) {
  const o = state.orders.find(x => x.orderId === orderId);
  if (!o) return;
  const orderPayments = (state.payments || []).filter(p => p.orderId === orderId);
  const vHist = Array.isArray(o.verificationHistory) ? o.verificationHistory : [];
  document.getElementById('dm-title').textContent = `Order ${o.orderId}`;
  document.getElementById('dm-sub').textContent = `Created ${fmtDateTime(o.createdAt)} · Source: ${o.source}`;
  document.getElementById('dm-body').innerHTML = `
    <div class="notice">
      <strong>Customer:</strong> ${esc(o.customerSnapshot?.name)} (+91 ${esc(o.customerSnapshot?.phone)})<br>
      <strong>Address:</strong> ${esc(o.customerSnapshot?.address)} ${esc(o.customerSnapshot?.city)} - ${esc(o.customerSnapshot?.pincode)}<br>
      <strong>Order Status:</strong> ${esc(o.orderStatus)} ${o.confirmedBy ? `(Confirmed by ${esc(o.confirmedBy)})` : ''}<br>
      <strong>Verification State:</strong> ${esc(o.verificationState || 'needs_verification')} ${o.followUpAt ? `· ${esc(formatFollowUpMeta(o.followUpAt))}` : ''}<br>
      <strong>Payment Status:</strong> ${esc(o.paymentStatus)} (${esc(o.paymentMethod)})<br>
      ${o.shippingDetails?.trackingId ? `<strong>Tracking:</strong> ${esc(o.shippingDetails.courier)} · ${esc(o.shippingDetails.trackingId)}<br>` : ''}
      ${o.returnDetails ? `<strong>Return Inspection:</strong> ${esc(o.returnDetails.status)} (Restocked: ${o.returnDetails.restockedQty}, Damaged: ${o.returnDetails.damagedQty}, Refunded: ${cash(o.returnDetails.refundAmount)})` : ''}
    </div>
    <strong>Immutable Item Price Snapshots</strong>
    ${(o.itemsSnapshot || []).map(it => `<div class="item"><span>${esc(it.productName)} (${esc(it.variantLabel)}) [${esc(it.sku)}] × ${it.quantity} @ ${cash(it.unitPrice)}</span><strong>${cash(it.lineTotal)}</strong></div>`).join('')}
    <div class="item"><span>Subtotal</span><span>${cash(o.subtotal)}</span></div>
    ${o.discountAmount ? `<div class="item"><span>Discount (${esc(o.discountCode)})</span><span>−${cash(o.discountAmount)}</span></div>` : ''}
    <div class="item"><span>Shipping / COD Fee</span><span>${cash(o.shippingCharge)}</span></div>
    <div class="item"><strong>Grand Total</strong><strong>${cash(o.grandTotal)}</strong></div>
    ${vHist.length ? `<div style="margin-top:12px;"><strong>Buy Verification Timeline</strong>${vHist.map(h => `<div class="item"><span><strong>${esc(h.action)}</strong> · ${esc(h.note || '')}</span><span class="tiny">${esc(fmtDateTime(h.actedAt))}</span></div>`).join('')}</div>` : ''}
    ${orderPayments.length ? `<div style="margin-top:12px;"><strong>Payment Ledger</strong>${orderPayments.map(p => `<div class="item"><span>${esc(p.paymentId)} · ${esc(p.type)} (${esc(p.paymentStatus)}) ${p.transactionReference ? '· Ref: ' + esc(p.transactionReference) : ''}</span><strong>${cash(p.amount)}</strong></div>`).join('')}</div>` : ''}
  `;
  const actionsEl = document.getElementById('dm-actions');
  if (actionsEl) {
    const canCancel = !['delivered', 'cancelled', 'return_received'].includes(o.orderStatus);
    actionsEl.innerHTML = `
      ${canCancel ? `<button type="button" class="btn danger" onclick="closeModal('detail-modal'); doCancelOrder('${esc(o.orderId)}')">Cancel Order…</button>` : ''}
      <button type="button" class="btn primary" onclick="closeModal('detail-modal')">Close</button>
    `;
  }
  openModal('detail-modal');
}

// ── 6. Customers Directory ──────────────────────────────────────
function renderCustomers() {
  const q = (document.getElementById('cust-search')?.value || '').toLowerCase();
  const rows = (state.customers || []).filter(c =>
    `${c.name} ${c.phone} ${c.city} ${c.pincode}`.toLowerCase().includes(q)
  );
  document.getElementById('customers-tbody').innerHTML = rows.length ? rows.map(c => `
    <tr>
      <td><strong>${esc(c.name)}</strong><div class="tiny">${esc(c.customerId)}</div></td>
      <td>+91 ${esc(c.phone)}</td>
      <td class="tiny">${esc(c.defaultAddress || '')} ${esc(c.city || '')} ${esc(c.pincode || '')}</td>
      <td><strong>${c.totalOrders} buys</strong> <span class="tiny">(${c.totalRequests} req)</span></td>
      <td><strong>${cash(c.acceptedSpend ?? c.verifiedSpend)}</strong><div class="tiny">Paid: ${cash(c.verifiedSpend)}</div></td>
      <td class="tiny">${esc(fmtDateTime(c.lastOrderAt))}</td>
      <td><button type="button" class="btn sm" onclick="openCustomerOrders('${esc(c.customerId)}')">History</button></td>
    </tr>
  `).join('') : '<tr><td colspan="7" class="empty-state">No customers recorded yet. Real checkout orders build customer records automatically.</td></tr>';
}

function openCustomerOrders(custId) {
  const c = state.customers.find(x => x.customerId === custId);
  if (!c) return;
  document.getElementById('dm-title').textContent = c.name;
  document.getElementById('dm-sub').textContent = `+91 ${c.phone} · Verified Spend: ${cash(c.verifiedSpend)}`;
  document.getElementById('dm-body').innerHTML = (c.orders || []).length
    ? c.orders.map(o => `<div class="item"><span><strong>${esc(o.orderId)}</strong> · ${esc(o.orderStatus)} / ${esc(o.paymentStatus)}</span><strong>${cash(o.grandTotal)}</strong></div>`).join('')
    : '<div class="empty-state">No orders yet.</div>';
  openModal('detail-modal');
}

// ── 7. Offers & Discounts ───────────────────────────────────────
function renderDiscounts() {
  const rows = state.discounts || [];
  document.getElementById('discounts-tbody').innerHTML = rows.length ? rows.map(d => `
    <tr>
      <td><strong>${esc(d.title)}</strong></td>
      <td><span class="sku-code">${esc(d.code)}</span></td>
      <td>${d.type === 'percent' ? `${d.value}%` : cash(d.value)} ${d.maxDiscount ? `(max ${cash(d.maxDiscount)})` : ''}</td>
      <td>${cash(d.minOrderAmount)}</td>
      <td class="tiny">${esc(d.startsAt || 'Now')} → ${esc(d.expiresAt || 'No expiry')}</td>
      <td>${d.usedCount || 0} / ${d.usageLimit || '∞'}</td>
      <td><span class="pill ${d.active ? '' : 'warn'}">${d.active ? 'Active' : 'Disabled'}</span></td>
      <td>
        <div class="toolbar">
          <button type="button" class="btn sm" onclick="openDiscountModal('${esc(d.code)}')">Edit</button>
          <button type="button" class="btn sm danger" onclick="deleteDiscountCode('${esc(d.code)}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="8" class="empty-state">No promo offers created yet. Click "+ Create Offer Code" to add one.</td></tr>';
}

function openDiscountModal(code = null) {
  const isEdit = Boolean(code);
  const d = isEdit ? state.discounts.find(x => x.code === code) : null;
  document.getElementById('dc-is-edit').value = isEdit ? '1' : '0';
  document.getElementById('dc-title').textContent = isEdit ? `Edit Offer ${code}` : 'Create Offer Code';
  document.getElementById('dc-name').value = d ? d.title : '';
  document.getElementById('dc-code').value = d ? d.code : '';
  document.getElementById('dc-code').disabled = isEdit;
  document.getElementById('dc-type').value = d ? d.type : 'percent';
  document.getElementById('dc-value').value = d ? d.value : 10;
  document.getElementById('dc-max').value = d && d.maxDiscount ? d.maxDiscount : '';
  document.getElementById('dc-min').value = d ? d.minOrderAmount : 0;
  document.getElementById('dc-start').value = d?.startsAt ? String(d.startsAt).slice(0, 10) : '';
  document.getElementById('dc-end').value = d?.expiresAt ? String(d.expiresAt).slice(0, 10) : '';
  document.getElementById('dc-limit').value = d && d.usageLimit ? d.usageLimit : '';
  document.getElementById('dc-active').value = d && d.active === false ? 'false' : 'true';
  openModal('discount-modal');
}

async function submitDiscountForm() {
  const isEdit = document.getElementById('dc-is-edit').value === '1';
  const code = document.getElementById('dc-code').value.trim().toUpperCase();
  const payload = {
    isEdit,
    code,
    title: document.getElementById('dc-name').value.trim(),
    type: document.getElementById('dc-type').value,
    value: Number(document.getElementById('dc-value').value),
    maxDiscount: document.getElementById('dc-max').value || null,
    minOrderAmount: Number(document.getElementById('dc-min').value) || 0,
    startsAt: document.getElementById('dc-start').value || null,
    expiresAt: document.getElementById('dc-end').value || null,
    usageLimit: document.getElementById('dc-limit').value || null,
    active: document.getElementById('dc-active').value === 'true'
  };
  try {
    await apiFetch(isEdit ? `/api/admin/discounts/${encodeURIComponent(code)}` : '/api/admin/discounts', {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    closeModal('discount-modal');
    showToast(`Promo offer ${code} saved!`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function deleteDiscountCode(code) {
  if (!confirm(`Delete promo code ${code}?`)) return;
  try {
    await apiFetch(`/api/admin/discounts/${encodeURIComponent(code)}`, { method: 'DELETE' });
    showToast(`Offer ${code} deleted`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

// ── 8. Reports & Analytics + CSV Exports ────────────────────────
async function loadReports() {
  const from = document.getElementById('rep-from')?.value || '';
  const to = document.getElementById('rep-to')?.value || '';
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  try {
    const rep = await apiFetch('/api/admin/reports?' + qs.toString());
    const m = rep.metrics || {};
    document.getElementById('rep-views').textContent = String(m.traffic?.totalViews || 0);
    document.getElementById('rep-ga4-note').textContent = m.traffic?.ga4MeasurementId
      ? `GA4 Live: ${m.traffic.ga4MeasurementId}`
      : 'Built-in store analytics active';
    const ps = rep.paymentSummary || {};
    document.getElementById('rep-collections').textContent = cash((ps.upiCollected || 0) + (ps.codCollected || 0));
    document.getElementById('rep-pay-split').textContent = `UPI: ${cash(ps.upiCollected)} · COD: ${cash(ps.codCollected)}`;
    document.getElementById('rep-pending-pay').textContent = cash(m.pendingPaymentsTotal);
    document.getElementById('rep-pending-cnt').textContent = `${m.pendingPaymentsCount || 0} unpaid active orders`;
    document.getElementById('rep-refunds').textContent = cash(ps.refundsIssued);
    document.getElementById('rep-ret-can').textContent = `${m.returnedCount || 0} returns · ${m.cancelledCount || 0} cancellations`;

    const skuRows = (rep.acceptedSkuSales && rep.acceptedSkuSales.length) ? rep.acceptedSkuSales : (rep.skuSales || []);
    const dispQtyMap = new Map((rep.skuSales || []).map(s => [s.sku, s.qtySold]));
    document.getElementById('rep-sku-tbody').innerHTML = skuRows.length
      ? skuRows.map(s => `<tr><td><span class="sku-code">${esc(s.sku)}</span></td><td>${esc(s.productName)} (${esc(s.variant)})</td><td><strong>${s.qtySold}</strong> <span class="tiny">(${dispQtyMap.get(s.sku) || 0} disp)</span></td><td>${cash(s.grossSales)}</td></tr>`).join('')
      : '<tr><td colspan="4" class="empty-state">No accepted or dispatched SKU sales in this period.</td></tr>';

    document.getElementById('rep-daily-tbody').innerHTML = (rep.dailySales || []).length
      ? rep.dailySales.map(d => `<tr><td>${esc(d.period)}</td><td>${d.orders}</td><td>${cash(d.gross)}</td><td>${cash(d.refunds)}</td><td><strong>${cash(d.net)}</strong></td></tr>`).join('')
      : '<tr><td colspan="5" class="empty-state">No verified daily sales in this period.</td></tr>';

    document.getElementById('rep-low-tbody').innerHTML = (rep.lowStockReport || []).length
      ? rep.lowStockReport.map(i => `<tr><td><span class="sku-code">${esc(i.sku)}</span></td><td>${esc(i.variantLabel)}</td><td><strong>${Math.max(0, (i.availableQty || 0) - (i.reservedQty || 0))}</strong></td><td>${i.reorderThreshold}</td></tr>`).join('')
      : '<tr><td colspan="4" class="empty-state">Zero SKUs below reorder threshold.</td></tr>';

    const pvEntries = Object.entries(m.traffic?.productViews || {}).sort((a, b) => b[1] - a[1]);
    document.getElementById('rep-prodviews-tbody').innerHTML = pvEntries.length
      ? pvEntries.map(([pid, cnt]) => `<tr><td>${esc(pid)}</td><td><strong>${cnt}</strong></td></tr>`).join('')
      : '<tr><td colspan="2" class="empty-state">No first-party product views recorded yet.</td></tr>';
  } catch (err) {
    showToast(err.message, true);
  }
}

async function downloadReportCsv(type) {
  try {
    const res = await apiFetch(`/api/admin/reports/export.csv?type=${encodeURIComponent(type)}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shimlawali-${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${type} CSV`);
  } catch (err) {
    showToast(err.message, true);
  }
}

// ── 9. Website Content CMS ──────────────────────────────────────
function loadContentCms() {
  const c = state.content || {};
  const m = state.media || {};
  document.getElementById('cms-announcement').value = c.announcement_bar || '';
  document.getElementById('cms-hero-heading').value = c.hero_heading || '';
  document.getElementById('cms-hero-desc').value = c.hero_description || '';
  document.getElementById('cms-about-heading').value = c.about_heading || '';
  document.getElementById('cms-about-body').value = c.about_body || '';
  document.getElementById('cms-marquee').value = Array.isArray(c.marquee_items) ? c.marquee_items.join('\n') : '';
  document.getElementById('cms-footer').value = c.footer_note || '';
  document.getElementById('cms-sec-featured').checked = c.sections?.featured_products !== false;
  document.getElementById('cms-sec-story').checked = c.sections?.our_story !== false;
  document.getElementById('cms-sec-reviews').checked = c.sections?.customer_reviews !== false;
  if (m.himalayan_image) document.getElementById('cms-prev-himalayan').src = m.himalayan_image;
  document.getElementById('cms-process-url').textContent = m.process_video ? `Active: ${String(m.process_video).slice(0, 60)}` : 'Current: Default';
  document.getElementById('cms-makers-url').textContent = m.makers_video ? `Active: ${String(m.makers_video).slice(0, 60)}` : 'Current: Default';
  document.getElementById('cms-process-video-url').value = m.process_video || '';
  document.getElementById('cms-makers-video-url').value = m.makers_video || '';
}

async function saveContentCms() {
  try {
    const procUrl = document.getElementById('cms-process-video-url').value.trim();
    const makersUrl = document.getElementById('cms-makers-video-url').value.trim();
    await apiFetch('/api/admin/content', {
      method: 'POST',
      body: JSON.stringify({
        announcement_bar: document.getElementById('cms-announcement').value.trim(),
        hero_heading: document.getElementById('cms-hero-heading').value.trim(),
        hero_description: document.getElementById('cms-hero-desc').value.trim(),
        about_heading: document.getElementById('cms-about-heading').value.trim(),
        about_body: document.getElementById('cms-about-body').value.trim(),
        marquee_items: document.getElementById('cms-marquee').value.split('\n').map(s => s.trim()).filter(Boolean),
        footer_note: document.getElementById('cms-footer').value.trim(),
        sections: {
          featured_products: document.getElementById('cms-sec-featured').checked,
          our_story: document.getElementById('cms-sec-story').checked,
          customer_reviews: document.getElementById('cms-sec-reviews').checked
        },
        media: {
          process_video: procUrl,
          makers_video: makersUrl
        }
      })
    });
    showToast('Website content published to storefront!');
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function uploadMediaSlot(inp, slotName) {
  if (!inp.files || !inp.files[0]) return;
  const fd = new FormData();
  fd.append(slotName, inp.files[0]);
  try {
    await apiFetch('/api/admin/upload', { method: 'POST', body: fd });
    showToast(`${slotName} updated!`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    inp.value = '';
  }
}

// ── 10. Settings, Backups & Audit Logs ──────────────────────────
function loadSettingsView() {
  const s = state.settings || {};
  document.getElementById('set-brand').value = s.brand_name || 'Shimla Wali';
  document.getElementById('set-wa').value = s.whatsapp_number || '';
  document.getElementById('set-phone').value = s.phone || '';
  document.getElementById('set-email').value = s.support_email || '';
  document.getElementById('set-upi').value = s.upi_id || '';
  document.getElementById('set-cod-fee').value = s.cod_fee ?? 25;
  document.getElementById('set-ig-handle').value = s.instagram_handle || '';
  document.getElementById('set-ig-url').value = s.instagram || '';
  document.getElementById('set-ga4').value = s.ga4_measurement_id || '';
  document.getElementById('set-accept-orders').checked = s.accept_orders !== false;
  document.getElementById('set-guest-checkout').checked = s.allow_guest_checkout !== false;
  document.getElementById('set-fssai').value = s.fssai_number || '';
  document.getElementById('set-households').value = s.maker_households || '';
  document.getElementById('set-districts').value = s.maker_districts || '';
  document.getElementById('set-method').value = s.maker_method || '';
  document.getElementById('set-verify-note').value = s.verify_page_note || '';

  const botEnabled = s.admin_bot_enabled !== false && localStorage.getItem('shimla_admin_bot_enabled') !== 'false';
  updateBotToggleUI(botEnabled);

  document.getElementById('backup-list-wrap').innerHTML = (state.backups || []).length
    ? state.backups.map(b => `
      <div class="item">
        <span class="tiny">${esc(b.filename)} (${Math.round(b.sizeBytes / 1024)} KB)</span>
        <button type="button" class="btn sm" onclick="restoreDbBackup('${esc(b.filename)}')">Restore</button>
      </div>
    `).join('')
    : '<div class="tiny">No manual snapshots created yet.</div>';

  document.getElementById('audit-tbody').innerHTML = (state.auditLogs || []).slice(0, 80).map(l => `
    <tr>
      <td class="tiny">${esc(fmtDateTime(l.createdAt))}</td>
      <td>${esc(l.actor)}</td>
      <td><span class="sku-code">${esc(l.action)}</span></td>
      <td class="tiny">${esc(l.entityType)}:${esc(l.entityId)}</td>
      <td>${esc(l.summary)}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="empty-state">No audit logs recorded.</td></tr>';
}

async function saveBusinessSettings() {
  try {
    await apiFetch('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({
        brand_name: document.getElementById('set-brand').value.trim(),
        whatsapp_number: document.getElementById('set-wa').value.trim(),
        phone: document.getElementById('set-phone').value.trim(),
        support_email: document.getElementById('set-email').value.trim(),
        upi_id: document.getElementById('set-upi').value.trim(),
        cod_fee: Number(document.getElementById('set-cod-fee').value) || 0,
        instagram_handle: document.getElementById('set-ig-handle').value.trim(),
        instagram: document.getElementById('set-ig-url').value.trim(),
        ga4_measurement_id: document.getElementById('set-ga4').value.trim(),
        accept_orders: document.getElementById('set-accept-orders').checked,
        allow_guest_checkout: document.getElementById('set-guest-checkout').checked,
        admin_bot_enabled: document.getElementById('set-bot-enabled') ? document.getElementById('set-bot-enabled').checked : true,
        fssai_number: document.getElementById('set-fssai').value.trim(),
        maker_households: document.getElementById('set-households').value.trim(),
        maker_districts: document.getElementById('set-districts').value.trim(),
        maker_method: document.getElementById('set-method').value.trim(),
        verify_page_note: document.getElementById('set-verify-note').value.trim()
      })
    });
    showToast('Business settings saved!');
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function triggerDbBackup() {
  try {
    await apiFetch('/api/admin/backup', { method: 'POST', body: JSON.stringify({}) });
    showToast('Snapshot backup created in db/backups/!');
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function restoreDbBackup(filename) {
  if (!confirm(`Restore entire database from snapshot "${filename}"? Current state will first be auto-backed up.`)) return;
  try {
    await apiFetch('/api/admin/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ filename })
    });
    showToast(`Database restored from ${filename}`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}

function downloadStoreBackupJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    products: state.products || [],
    niches: state.niches || [],
    inventory: { bySku: state.inventory || {} },
    batches: state.batches || [],
    orders: state.orders || [],
    customers: state.customers || [],
    discounts: state.discounts || [],
    settings: state.settings || {},
    content: state.content || {},
    media: state.media || {}
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `shimla-store-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Exported store JSON backup!');
}

async function seedFirestoreFromPublicJson() {
  if (!confirm('Import products, batches, settings & CMS content from products.json into Cloud Firestore?')) return;
  try {
    const r = await fetch('products.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('Could not read products.json');
    const snapshot = await r.json();
    const res = await apiFetch('/api/admin/firebase/seed', {
      method: 'POST',
      body: JSON.stringify(snapshot)
    });
    showToast(`Synced ${res.products} products, ${res.skus} SKUs & ${res.batches} batches to Firestore!`);
    await loadBootstrap();
  } catch (err) {
    showToast(err.message, true);
  }
}
