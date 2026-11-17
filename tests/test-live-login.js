const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(p => fs.existsSync(p));

async function runTest() {
  const port = 9770;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-admin-live-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--window-size=1200,900',
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    let wsUrl = '';
    for (let i = 0; i < 30; i++) {
      try {
        const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
        const p = tabs.find(t => t.type === 'page');
        if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }
    if (!wsUrl) throw new Error('Could not connect to CDP');

    const ws = new WebSocket(wsUrl);
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
    await send('Page.navigate', { url: 'https://shimlacrunch-store.web.app/admin.html' });
    await new Promise(r => setTimeout(r, 3500));

    // Submit the form with passcode shimla@2024
    const res = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          document.getElementById('admin-pw').value = 'shimla@2024';
          await doLogin();
          return {
            loginDisplay: document.getElementById('login-screen')?.style.display,
            appHidden: document.getElementById('admin-app')?.classList.contains('is-hidden'),
            brand: document.querySelector('.side .brand')?.textContent,
            productsCount: window.state?.products?.length,
            firstProduct: window.state?.products?.[0]?.title,
            activeTab: window.currentTab
          };
        })();
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('🎉 Production Live Admin Login Test Result:');
    console.log(res.result.value);

    // Capture screenshot as proof
    const snap = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a\\admin-live-firebase-verified.png', Buffer.from(snap.data, 'base64'));
    console.log('📸 Screenshot saved: admin-live-firebase-verified.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

runTest().catch(console.error);
