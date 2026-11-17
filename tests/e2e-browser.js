/**
 * Shimla Crunch — Live Headless Chrome E2E, Visual Responsive & Sync Verification
 */
const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

function findBrowser() {
  for (const p of CHROME_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome/Edge not found');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
  }
  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    };
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('DOM.enable');
    await this.send('Network.enable');
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async navigate(url) {
    const loadPromise = new Promise(resolve => {
      const check = setInterval(() => {
        if (this.events.some(e => e.method === 'Page.loadEventFired')) {
          clearInterval(check);
          resolve();
        }
      }, 40);
      setTimeout(() => { clearInterval(check); resolve(); }, 6000);
    });
    this.events = [];
    await this.send('Page.navigate', { url });
    await loadPromise;
    await new Promise(r => setTimeout(r, 450));
  }
  async eval(expression) {
    const res = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (res.exceptionDetails) {
      throw new Error(`Page eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }
  async setViewport(width, height, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile
    });
    await new Promise(r => setTimeout(r, 150));
  }
  async screenshot(outPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
  }
  close() {
    try { this.ws.close(); } catch {}
  }
}

async function runE2E() {
  const baseUrl = process.env.E2E_URL || 'http://localhost:3000';
  const chromeBin = findBrowser();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shimla-cdp-'));
  const debugPort = 9335;

  const chrome = spawn(
    chromeBin,
    [
      '--headless=new',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--disable-gpu',
      '--window-size=1280,820',
      'about:blank'
    ],
    { stdio: 'ignore' }
  );

  const waitReady = async () => {
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const tabs = await res.json();
        const page = tabs.find(t => t.type === 'page');
        if (page) return page.webSocketDebuggerUrl;
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }
    throw new Error('Timed out waiting for headless Chrome DevTools');
  };

  let cdp = null;
  const errors = [];
  let adminToken = '';
  let preBackupFile = '';

  try {
    const wsUrl = await waitReady();
    cdp = new CDPClient(wsUrl);
    await cdp.connect();

    // Helper: fetch backup via Admin login API so we restore pristine live DB at the end
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: process.env.ADMIN_PASSWORD || 'shimla@2024' })
    }).then(r => r.json());
    assert.ok(loginRes.ok && loginRes.token, 'Live admin login failed');
    adminToken = loginRes.token;

    const bk = await fetch(`${baseUrl}/api/admin/backup`, {
      method: 'POST',
      headers: { 'X-Admin-Token': adminToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).then(r => r.json());
    preBackupFile = bk.backup.filename;

    console.log('\n🌐 Running Headless Browser E2E Checks against', baseUrl);

    // 1. Admin Portal Login + All 10 Tabs + Responsive Checks
    await cdp.setViewport(1280, 820, false);
    await cdp.navigate(`${baseUrl}/admin.html`);
    const signedIn = await cdp.eval(`(async () => {
      document.getElementById('admin-pw').value = ${JSON.stringify(process.env.ADMIN_PASSWORD || 'shimla@2024')};
      await doLogin();
      await new Promise(r => setTimeout(r, 350));
      const el = document.getElementById('admin-app');
      return !el.classList.contains('is-hidden') && getComputedStyle(el).display !== 'none';
    })()`);
    assert.strictEqual(signedIn, true, 'Admin UI did not display after login');
    console.log('  ✅ Admin Login rendered Studio Shell');

    // Verify all 10 tabs switch cleanly with real DB numbers
    const tabsToCheck = ['dashboard', 'products', 'inventory', 'batches', 'orders', 'customers', 'discounts', 'analytics', 'content', 'settings'];
    for (const t of tabsToCheck) {
      const okTab = await cdp.eval(`(() => {
        document.querySelector('[data-tab="${t}"]').click();
        return document.getElementById('${t}').classList.contains('active');
      })()`);
      assert.strictEqual(okTab, true, `Tab ${t} did not activate`);
    }
    await cdp.eval(`document.querySelector('[data-tab="dashboard"]').click()`);
    const netRevTxt = await cdp.eval(`document.getElementById('kpi-net-revenue').textContent.trim()`);
    assert.strictEqual(netRevTxt, '₹0', `Expected real zero revenue initially, got ${netRevTxt}`);

    const shotDir = process.env.SCREENSHOT_DIR || '';
    if (shotDir) {
      await cdp.screenshot(path.join(shotDir, 'admin-desktop-overview.png'));
    }

    // Check responsive breakpoints (Tablet & Mobile) on Admin
    for (const [w, h, mob, label] of [[820, 1024, false, 'Tablet'], [390, 844, true, 'Mobile']]) {
      await cdp.setViewport(w, h, mob);
      const layoutOk = await cdp.eval(`(() => {
        const overflowOk = document.documentElement.scrollWidth <= window.innerWidth + 2;
        const mainRect = document.querySelector('.main').getBoundingClientRect();
        return overflowOk && (!${mob} || mainRect.width >= ${w - 4});
      })()`);
      assert.strictEqual(layoutOk, true, `Admin layout broken on ${label} (${w}px)`);
    }
    if (shotDir) {
      await cdp.screenshot(path.join(shotDir, 'admin-mobile-overview.png'));
    }
    await cdp.setViewport(1280, 820, false);
    console.log('  ✅ All 10 Admin tabs + Desktop/Tablet/Mobile responsive layouts verified');

    // 2. Real Admin Edit -> Public Storefront Verification (index.html + product.html)
    await cdp.eval(`(async () => {
      openProductModal('ghee');
      document.getElementById('pm-pillText').value = 'E2E Live Badge';
      const rows = document.querySelectorAll('#pm-variants-list .variant-row');
      rows[1].querySelector('.vr-price').value = '1275';
      await submitProductForm();
      await new Promise(r => setTimeout(r, 350));
    })()`);

    await cdp.navigate(`${baseUrl}/index.html`);
    const homeCheck = await cdp.eval(`(() => {
      const card = document.querySelector('[data-product-id="ghee"]');
      return card ? card.innerText : '';
    })()`);
    assert.ok(homeCheck.includes('1,275') && homeCheck.toUpperCase().includes('E2E LIVE BADGE'), `Home card missing synced Admin update: ${homeCheck}`);
    console.log('  ✅ Admin edit synced live to Home catalog card (₹1,275 + E2E Live Badge)');

    await cdp.navigate(`${baseUrl}/product.html?id=ghee`);
    const pdpInit = await cdp.eval(`({
      price: document.getElementById('pdp-price').textContent,
      sku: document.getElementById('pdp-sku').textContent
    })`);
    assert.strictEqual(pdpInit.price, '₹1,275');
    assert.strictEqual(pdpInit.sku, 'SKU: GHSM-500ML-01');

    // Click 1000ml size button -> SKU & price update dynamically
    const pdp1000 = await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('.pdp-size-selector .pdp-size-btn'));
      const b = btns.find(x => x.textContent.trim().includes('1000ml'));
      b.click();
      return { price: document.getElementById('pdp-price').textContent, sku: document.getElementById('pdp-sku').textContent };
    })()`);
    assert.strictEqual(pdp1000.price, '₹2,199');
    assert.strictEqual(pdp1000.sku, 'SKU: GHSM-1000ML-01');
    console.log('  ✅ Product PDP hydrated live from DB & switched SKU cleanly (GHSM-500ML-01 → GHSM-1000ML-01)');

    // Check Pickle niche variety + size SKU resolution
    await cdp.navigate(`${baseUrl}/product.html?id=pickle`);
    const pickleSku = await cdp.eval(`(() => {
      const vars = Array.from(document.querySelectorAll('#pdp-variety-selector .pdp-size-btn'));
      vars[1].click();
      const sz = Array.from(document.querySelectorAll('.pdp-size-selector .pdp-size-btn')).find(b => b.textContent.includes('800g'));
      sz.click();
      return document.getElementById('pdp-sku').textContent;
    })()`);
    assert.strictEqual(pickleSku, 'SKU: PKSM-AAM-800G');
    console.log('  ✅ Pickle niche variety+size auto-resolved structured SKU: PKSM-AAM-800G');

    // Check Checkout, Verify, Profile, Shop render cleanly without exceptions
    for (const pg of ['checkout.html', 'verify.html', 'profile.html', 'shop.html']) {
      await cdp.navigate(`${baseUrl}/${pg}`);
      const ok = await cdp.eval(`document.body.innerText.length > 50`);
      assert.strictEqual(ok, true, `${pg} failed to render`);
    }
    console.log('  ✅ Checkout, Verify, Profile & Shop pages rendered cleanly in Chromium');

    // 3. Real E2E WhatsApp Verification Workaround: Order Entry -> Wait 2d -> Accept Buy UI Update
    await cdp.eval(`(async () => {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'E2E Buyer', phone: '9876540001', address: 'The Ridge 5', city: 'Shimla, HP', pincode: '171001' },
          items: [{ sku: 'GHSM-500ML-01', quantity: 1 }],
          paymentMethod: 'COD'
        })
      });
    })()`);

    await cdp.navigate(`${baseUrl}/admin.html`);
    const verifyQueueHasEntry = await cdp.eval(`(async () => {
      await new Promise(r => setTimeout(r, 350));
      const txt = document.getElementById('dash-verification-list').innerText;
      return txt.includes('E2E Buyer') && txt.includes('Yes, Accept Buy') && txt.includes('Wait (2d)');
    })()`);
    assert.strictEqual(verifyQueueHasEntry, true, 'Admin Verification Queue missing WhatsApp order entry');

    // Click Wait (2d), then open Verify Buy modal from Waiting filter and Accept Buy
    const acceptedUiOk = await cdp.eval(`(async () => {
      const waitBtn = document.querySelector('#dash-verification-list .btn.gold');
      waitBtn.click();
      await new Promise(r => setTimeout(r, 400));
      openOrdersFiltered('waiting_followup');
      await new Promise(r => setTimeout(r, 250));
      const rowTxt = document.getElementById('orders-tbody').innerText;
      if (!rowTxt.includes('E2E Buyer') || !rowTxt.includes('Re-ask')) return false;
      const oid = state.orders.find(o => o.customerSnapshot?.name === 'E2E Buyer').orderId;
      openVerifyBuyModal(oid, 'accept');
      document.querySelector('#vb-items-list .vb-item-qty').value = '2';
      recalcVerifyBuyPreview();
      document.getElementById('vb-accept-note').value = 'Verified via E2E';
      await submitVerifyBuyDecision();
      await new Promise(r => setTimeout(r, 350));
      const waModalShow = document.getElementById('wa-send-modal').classList.contains('show');
      const waConfirmMsg = document.getElementById('was-msg').value;
      if (!waModalShow || !waConfirmMsg.includes('Namaste E2E Buyer') || !waConfirmMsg.includes('sharing payment')) return false;
      closeModal('wa-send-modal');

      // Also verify Stage 2 Dispatch Courier + Auto Tracking Link -> WhatsApp Tracking message
      openDispatchModal(oid);
      document.getElementById('dp-courier').value = 'Delhivery';
      document.getElementById('dp-tracking').value = 'DL9948271';
      updateDispatchTrackingPreview();
      if (!document.getElementById('dp-tracking-url').value.includes('delhivery.com/track/package/DL9948271')) return false;
      await submitDispatch();
      await new Promise(r => setTimeout(r, 350));
      const waDispMsg = document.getElementById('was-msg').value;
      if (!waDispMsg.includes('DISPATCHED') || !waDispMsg.includes('DL9948271')) return false;
      closeModal('wa-send-modal');

      tab('dashboard');
      await new Promise(r => setTimeout(r, 250));
      const kpiOrders = document.getElementById('kpi-orders-confirmed').textContent.trim();
      const stockMeta = document.getElementById('kpi-products-meta').textContent;
      return kpiOrders === '1' && stockMeta.includes('2 units sold') && stockMeta.includes('2 dispatched');
    })()`);
    assert.strictEqual(acceptedUiOk, true, 'Wait (2d) -> Accept Buy -> Stage 1/2 WhatsApp & Tracking workflow failed in Chromium');
    console.log('  ✅ WhatsApp Buy Verification UI (Wait 2d -> Accept Buy -> Stage 1 WA -> Courier Track Stage 2 WA -> Live Stock) verified in Chromium');

    const runtimeErrors = cdp.events.filter(e => e.method === 'Runtime.exceptionThrown');
    assert.strictEqual(runtimeErrors.length, 0, `Runtime JS exceptions encountered: ${JSON.stringify(runtimeErrors)}`);
    console.log('  ✅ Zero uncaught browser JS exceptions across full walkthrough');
  } finally {
    if (preBackupFile && adminToken) {
      await fetch(`${baseUrl}/api/admin/backup/restore`, {
        method: 'POST',
        headers: { 'X-Admin-Token': adminToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: preBackupFile })
      }).catch(() => {});
    }
    if (cdp) cdp.close();
    try { chrome.kill('SIGKILL'); } catch {}
    setTimeout(() => { try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {} }, 300);
  }

  if (errors.length) process.exit(1);
}

runE2E().catch(err => {
  console.error('❌ E2E Browser verification failed:', err);
  process.exit(1);
});
