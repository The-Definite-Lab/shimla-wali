const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testSubpages() {
  const port = 9862;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-subpages-'));
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

  const pages = [
    'http://localhost:3000/shop.html',
    'http://localhost:3000/product.html?id=apple-crunch',
    'http://localhost:3000/policies.html#privacy',
    'http://localhost:3000/terms.html'
  ];

  for (const p of pages) {
    console.log(`Testing direct landing on: ${p}`);
    await send('Page.navigate', { url: p });
    await new Promise(r => setTimeout(r, 2000));

    // Trigger back
    await send('Runtime.evaluate', { expression: 'history.back()' });
    await new Promise(r => setTimeout(r, 2500));

    const res = await send('Runtime.evaluate', {
      expression: `(() => ({ url: window.location.href, title: document.title }))()`,
      returnByValue: true
    });
    console.log(`  -> After back:`, res.result.value);
  }

  chrome.kill();
  process.exit(0);
}

testSubpages().catch(e => { console.error(e); process.exit(1); });
