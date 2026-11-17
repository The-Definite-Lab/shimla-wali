const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkCart() {
  const port = 9848;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-chkcart-'));
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

  const diag = await send('Runtime.evaluate', {
    expression: `
      (() => {
        let err = null;
        try {
          window.openCart();
        } catch(e) {
          err = e.message + '\\n' + e.stack;
        }
        const drawer = document.getElementById('cart-drawer');
        return {
          err,
          hasDrawer: !!drawer,
          drawerClass: drawer?.className,
          isDrawerPushed: window._isDrawerPushed,
          openCartStr: window.openCart?.toString()
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Diag:', JSON.stringify(diag.result.value, null, 2));

  chrome.kill();
  process.exit(0);
}

checkCart().catch(e => { console.error(e); process.exit(1); });
