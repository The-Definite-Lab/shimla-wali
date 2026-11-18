// tests/verify-live-stock-modal.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTest() {
  const port = 9845;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-stock-verify-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,900',
    'about:blank'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));

  try {
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
    console.log('Navigating to live admin...');
    await send('Page.navigate', { url: 'https://shimlacrunch-store.web.app/admin.html' });
    await new Promise(r => setTimeout(r, 3500));

    // 1. Verify initial login screen state
    const loginCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const pwVal = document.getElementById('admin-pw')?.value;
          const pwPlaceholder = document.getElementById('admin-pw')?.placeholder;
          const bodyText = document.body.innerText;
          const hasReturnLink = document.querySelector('.return-storefront-link') !== null;
          return {
            pwVal,
            pwPlaceholder,
            hasDevText: bodyText.includes('DEV:') || bodyText.includes('shimla@2024'),
            hasReturnLink
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Login Screen Security Check:', loginCheck.result.value);

    // 2. Perform Login and open Stock Modal
    const stockCheck = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          document.getElementById('admin-pw').value = 'shimla@2024';
          await doLogin();
          await new Promise(r => setTimeout(r, 1200));

          // Open Stock Modal
          openStockModal();
          await new Promise(r => setTimeout(r, 500));

          const sel = document.getElementById('sm-sku');
          const options = Array.from(sel.options).map(o => ({ value: o.value, text: o.text }));
          
          return {
            studioOpen: !document.getElementById('admin-app').classList.contains('is-hidden'),
            skuCount: options.length,
            options: options.slice(0, 5)
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Stock Modal Check:', stockCheck.result.value);

    // Capture screenshot of stock modal
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const artifactPath = path.join(
      'C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a',
      'admin-stock-modal-populated.png'
    );
    fs.writeFileSync(artifactPath, Buffer.from(shot.data, 'base64'));
    console.log('Screenshot saved to:', artifactPath);

    ws.close();
  } finally {
    chrome.kill();
  }
}

runTest().catch(console.error);
