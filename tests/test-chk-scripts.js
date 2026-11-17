const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkScripts() {
  const port = 9856;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-scripts2-'));
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
  await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
  await new Promise(r => setTimeout(r, 2500));

  const val = await send('Runtime.evaluate', {
    expression: `
      (() => {
        window.openCart();
        const d = document.getElementById('cart-drawer');
        return {
          windowOpenCart: typeof window.openCart,
          cartActive: d?.classList.contains('active'),
          cartTransform: window.getComputedStyle(d).transform,
          hash: window.location.hash
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Result:', JSON.stringify(val.result.value, null, 2));

  chrome.kill();
  process.exit(0);
}

checkScripts().catch(e => { console.error(e); process.exit(1); });
