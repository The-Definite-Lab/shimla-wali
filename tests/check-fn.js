const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function check() {
  const port = 9780;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-chk-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, '--window-size=1200,900', 'about:blank'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));
  
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

  const loginRes = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        document.getElementById('admin-pw').value = 'shimla@2024';
        await doLogin();
        return {
          screenDisplay: document.getElementById('login-screen')?.style.display,
          appClasses: document.getElementById('admin-app')?.className,
          brandText: document.querySelector('.side .brand')?.textContent,
          hasSession: document.documentElement.classList.contains('swa-has-session'),
          productsCount: window.state?.products?.length
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Local Node Test Result:', loginRes.result.value);

  const snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a\\admin-local-unlocked.png', Buffer.from(snap.data, 'base64'));
  console.log('📸 Screenshot saved: admin-local-unlocked.png');

  ws.close();
  chrome.kill();
}
check().catch(console.error);
