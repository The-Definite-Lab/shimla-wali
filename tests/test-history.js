const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testHistory() {
  const port = 9842;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-hist2-'));
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
  await send('Page.navigate', { url: 'http://localhost:3000/profile.html' });
  await new Promise(r => setTimeout(r, 2000));

  // Seed history and add popstate handler
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        window.__isSubpage = true;
        const homeUrl = new URL('index.html', window.location.href).href;
        const currentUrl = window.location.href;
        history.replaceState({ scIsRootHome: true }, '', homeUrl);
        history.pushState({ scSubpage: true }, '', currentUrl);

        window.addEventListener('popstate', function(e) {
          if (e.state && e.state.scIsRootHome) {
            window.location.replace('index.html');
          }
        });
      })()
    `
  });

  console.log('Seeded history on profile.html. Now calling history.back()...');

  // Trigger back
  await send('Runtime.evaluate', {
    expression: 'history.back()'
  });
  await new Promise(r => setTimeout(r, 2500));

  const afterBack = await send('Runtime.evaluate', {
    expression: `
      (() => ({
        url: window.location.href,
        title: document.title,
        hasProducts: !!document.querySelector('.product-card, .shop-grid, #products, .hero')
      }))()
    `,
    returnByValue: true
  });
  console.log('Result after back:', afterBack.result.value);

  chrome.kill();
  process.exit(0);
}

testHistory().catch(e => { console.error(e); process.exit(1); });
