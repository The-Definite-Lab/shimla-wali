const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testSimulation() {
  const port = 9846;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-sim-'));
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

  console.log('--- TEST 1: index.html -> Open Bag -> profile.html -> Back -> Back ---');
  await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
  await new Promise(r => setTimeout(r, 2000));

  // Open Bag
  const openBagRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        if (typeof window.openCart === 'function') {
          window.openCart();
        }
        return {
          cartActive: document.getElementById('cart-drawer')?.classList.contains('active'),
          hash: window.location.hash
        };
      })()
    `,
    returnByValue: true
  });
  console.log('1. Open Bag on Home:', openBagRes.result.value);

  // Navigate to profile.html
  await send('Page.navigate', { url: 'http://localhost:3000/profile.html' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('2. Navigated to profile.html');

  // Trigger browser back
  console.log('3. Triggering browser back from profile.html...');
  await send('Runtime.evaluate', { expression: 'history.back()' });
  await new Promise(r => setTimeout(r, 2500));

  const afterFirstBack = await send('Runtime.evaluate', {
    expression: `
      (() => ({
        url: window.location.href,
        cartActive: document.getElementById('cart-drawer')?.classList.contains('active'),
        hash: window.location.hash
      }))()
    `,
    returnByValue: true
  });
  console.log('4. State after 1st Back (should be index.html with Bag open):', afterFirstBack.result.value);

  chrome.kill();
  process.exit(0);
}

testSimulation().catch(e => { console.error(e); process.exit(1); });
