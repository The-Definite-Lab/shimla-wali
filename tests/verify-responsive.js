const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verifyResponsive() {
  const port = 9822;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-brand-resp-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
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
  await send('Page.navigate', { url: 'http://localhost:3000/admin.html' });
  await new Promise(r => setTimeout(r, 2000));

  await send('Runtime.evaluate', {
    expression: `
      (async () => {
        document.getElementById('admin-pw').value = 'shimla@2024';
        await doLogin();
        await new Promise(r => setTimeout(r, 500));
        // Open mobile sidebar
        if (typeof toggleSidebar === 'function') toggleSidebar();
      })()
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 500));

  const mobileClip = await send('Page.captureScreenshot', { format: 'png' });
  const mobPath = path.join('C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a', 'verified-brand-mobile.png');
  fs.writeFileSync(mobPath, Buffer.from(mobileClip.data, 'base64'));
  console.log('Saved mobile screenshot:', mobPath);

  chrome.kill();
  process.exit(0);
}

verifyResponsive().catch(e => { console.error(e); process.exit(1); });
