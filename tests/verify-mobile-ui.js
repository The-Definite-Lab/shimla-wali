const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(p => fs.existsSync(p));

async function run() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-mob-'));
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9338', `--user-data-dir=${userDataDir}`, '--disable-gpu', '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
  let ws;
  try {
    let wsUrl = '';
    for (let i = 0; i < 30; i++) {
      try {
        const tabs = await (await fetch('http://127.0.0.1:9338/json/list')).json();
        const p = tabs.find(t => t.type === 'page');
        if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }
    ws = new WebSocket(wsUrl);
    await new Promise(r => { ws.onopen = r; });
    let cid = 0;
    const pend = new Map();
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.id && pend.has(m.id)) {
        const { resolve, reject } = pend.get(m.id);
        pend.delete(m.id);
        if (m.error) reject(new Error(m.error.message));
        else resolve(m.result);
      }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++cid;
      pend.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
    await new Promise(r => setTimeout(r, 1400));

    const evalJs = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;
    const layout = await evalJs(`(() => {
      const cards = Array.from(document.querySelectorAll('#dynamic-product-grid .m-product-card')).map(c => {
        const r = c.getBoundingClientRect();
        return { title: c.querySelector('.m-card-title')?.textContent?.trim(), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), top: Math.round(r.top) };
      });
      const pills = Array.from(document.querySelectorAll('.m-black-pill, .slide-live-badge')).map(p => ({
        txt: p.textContent.trim(),
        clipped: p.scrollWidth > p.clientWidth + 2
      }));
      return { vw: window.innerWidth, count: cards.length, pair0: [cards[0], cards[1]], pair1: [cards[2], cards[3]], pills };
    })()`);

    console.log('MOBILE GRID:', JSON.stringify(layout, null, 2));
    assert.strictEqual(layout.count, 7);
    // Pair 0 and Pair 1 must sit cleanly side-by-side inside 390px
    assert.ok(layout.pair0[1].right <= 390, `Card 2 overflows right: ${layout.pair0[1].right}`);
    assert.ok(Math.abs(layout.pair0[0].top - layout.pair0[1].top) <= 4, 'First pair not aligned horizontally');
    assert.ok(Math.abs(layout.pair0[0].width - layout.pair0[1].width) <= 3, 'Pair widths unequal');
    assert.ok(Math.abs(layout.pair1[0].top - layout.pair1[1].top) <= 4, 'Second pair not aligned horizontally');

    // No 24h / Dispatching Today strings
    const badText = layout.pills.filter(p => /24h|24\s*hr|Dispatching Today|Ships Today/i.test(p.txt));
    assert.strictEqual(badText.length, 0, `Disallowed shipping timeframe text found: ${JSON.stringify(badText)}`);

    // Screenshot mobile carousel + product pairs
    await evalJs(`document.querySelector('.collection-section').scrollIntoView({ behavior: 'instant' })`);
    await new Promise(r => setTimeout(r, 250));
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/user/.gemini/antigravity/brain/7031990c-b334-4866-b78c-5b953fb265c1/screenshots/mobile-grid-after.png', Buffer.from(shot1.data, 'base64'));

    await evalJs(`window.scrollTo(0, 0)`);
    await new Promise(r => setTimeout(r, 250));
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/user/.gemini/antigravity/brain/7031990c-b334-4866-b78c-5b953fb265c1/screenshots/mobile-carousel-after.png', Buffer.from(shot2.data, 'base64'));

    // Verify Heals cards (01..07) never show literal <span> tags in EN or HI
    const healsCheck = await evalJs(`(() => {
      const enHeads = Array.from(document.querySelectorAll('.heal-slide-content h3')).map(h => h.textContent.trim());
      if (typeof window.setLanguage === 'function') window.setLanguage('hi');
      const hiHeads = Array.from(document.querySelectorAll('.heal-slide-content h3')).map(h => h.textContent.trim());
      if (typeof window.setLanguage === 'function') window.setLanguage('en');
      return { enHeads, hiHeads };
    })()`);
    assert.strictEqual(healsCheck.enHeads.length, 7);
    assert.strictEqual(healsCheck.enHeads.some(t => t.includes('<span')), false, `Literal <span> in EN: ${JSON.stringify(healsCheck.enHeads)}`);
    assert.strictEqual(healsCheck.hiHeads.some(t => t.includes('<span')), false, `Literal <span> in HI: ${JSON.stringify(healsCheck.hiHeads)}`);

    await evalJs(`document.querySelector('.heals-section').scrollIntoView({ behavior: 'instant' })`);
    await new Promise(r => setTimeout(r, 250));
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/user/.gemini/antigravity/brain/7031990c-b334-4866-b78c-5b953fb265c1/screenshots/mobile-heals-after.png', Buffer.from(shot3.data, 'base64'));

    console.log('HEALS_HEADINGS:', JSON.stringify(healsCheck.enHeads));
    console.log('MOBILE_UI_PASSED');
  } finally {
    try { if (ws) ws.close(); } catch {}
    try { chrome.kill('SIGKILL'); } catch {}
    setTimeout(() => { try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {} }, 300);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
