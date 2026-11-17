const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkConsole() {
  const port = 9772;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-admin-err-'));
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

    const ws = new WebSocket(wsUrl);
    await new Promise(r => { ws.onopen = r; });
    let cid = 0;
    const pend = new Map();
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', m.params.type, m.params.args.map(a => a.value || a.description));
      }
      if (m.method === 'Runtime.exceptionThrown') {
        console.log('EXCEPTION:', m.params.exceptionDetails);
      }
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

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: 'https://shimlacrunch-store.web.app/admin.html' });
    await new Promise(r => setTimeout(r, 3000));

    const clickRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          document.getElementById('admin-pw').value = 'shimla@2024';
          await doLogin();
          return {
            hasSessionClass: document.documentElement.classList.contains('swa-has-session'),
            loginStyleDisplay: document.getElementById('login-screen').style.display,
            adminAppClasses: document.getElementById('admin-app').className,
            loginErrorText: document.getElementById('login-error').textContent,
            loginErrorDisplay: document.getElementById('login-error').style.display
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('CLICK RESULT:', clickRes);

    await new Promise(r => setTimeout(r, 1000));

    // Capture screenshot
    const snap = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a\\admin-live-unlocked.png', Buffer.from(snap.data, 'base64'));
    console.log('📸 Screenshot saved: admin-live-unlocked.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

checkConsole().catch(console.error);
