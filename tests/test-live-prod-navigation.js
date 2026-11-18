const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testLive() {
  const port = 9870;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-liveprod-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2000));
  
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  
  let cid = 0;
  const pend = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) {
      pend.get(m.id).resolve(m.result);
      pend.delete(m.id);
    }
  };
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++cid;
    pend.set(id, { resolve });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');

  console.log('--- LIVE TEST 1: Home -> Bag -> Profile -> Back (Bag) -> Back (Home) ---');
  await send('Page.navigate', { url: 'https://shimlacrunch-store.web.app/' });
  await new Promise(r => setTimeout(r, 3000));

  // Open Bag
  const openBag = await send('Runtime.evaluate', {
    expression: `
      (() => {
        window.openCart();
        return {
          url: window.location.href,
          hash: window.location.hash,
          cartActive: document.getElementById('cart-drawer')?.classList.contains('active')
        };
      })()
    `,
    returnByValue: true
  });
  console.log('1. Open Bag on Live:', openBag.result.value);

  // Navigate to profile
  await send('Runtime.evaluate', { expression: "window.location.href = 'profile.html'" });
  await new Promise(r => setTimeout(r, 3000));

  console.log('2. Navigated to Live profile.html');

  // Back from profile
  console.log('3. Triggering back from profile...');
  await send('Runtime.evaluate', { expression: 'history.back()' });
  await new Promise(r => setTimeout(r, 3000));

  const afterBack1 = await send('Runtime.evaluate', {
    expression: `
      (() => ({
        url: window.location.href,
        hash: window.location.hash,
        cartActive: document.getElementById('cart-drawer')?.classList.contains('active')
      }))()
    `,
    returnByValue: true
  });
  console.log('4. After 1st Back on Live (Should be Home with Bag OPEN):', afterBack1.result.value);

  // Back to close bag
  console.log('5. Triggering back to close Bag...');
  await send('Runtime.evaluate', { expression: 'history.back()' });
  await new Promise(r => setTimeout(r, 2000));

  const afterBack2 = await send('Runtime.evaluate', {
    expression: `
      (() => ({
        url: window.location.href,
        hash: window.location.hash,
        cartActive: document.getElementById('cart-drawer')?.classList.contains('active')
      }))()
    `,
    returnByValue: true
  });
  console.log('6. After 2nd Back on Live (Should be Home with Bag CLOSED):', afterBack2.result.value);

  console.log('\n--- LIVE TEST 2: Direct landing on Live profile.html -> Back -> Lands on Home ---');
  await send('Page.navigate', { url: 'https://shimlacrunch-store.web.app/profile.html' });
  await new Promise(r => setTimeout(r, 3000));

  console.log('Direct subpage loaded. Triggering back...');
  await send('Runtime.evaluate', { expression: 'history.back()' });
  await new Promise(r => setTimeout(r, 3000));

  const afterDirect = await send('Runtime.evaluate', {
    expression: `
      (() => ({
        url: window.location.href,
        title: document.title
      }))()
    `,
    returnByValue: true
  });
  console.log('After back from direct subpage on Live:', afterDirect.result.value);

  chrome.kill();
  process.exit(0);
}

testLive().catch(e => { console.error(e); process.exit(1); });
