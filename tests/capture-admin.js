const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(p => fs.existsSync(p));

let portCounter = 9660;

async function captureAdmin(outPath) {
  const port = portCounter++;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-admin-snap-'));
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
    await send('Page.navigate', { url: 'http://localhost:3000/admin.html' });
    await new Promise(r => setTimeout(r, 1500));

    // Log in using token and unlock admin app
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Owner', password: 'shimla@2024' })
          });
          const data = await res.json();
          if (data.token) {
            localStorage.setItem('swa_admin_token', data.token);
            sessionStorage.setItem('swa_admin_token', data.token);
            document.documentElement.classList.add('swa-has-session');
            const scr = document.getElementById('login-screen');
            if (scr) scr.style.display = 'none';
            const app = document.getElementById('admin-app');
            if (app) app.classList.remove('is-hidden');
            if (typeof loadBootstrap === 'function') await loadBootstrap();
            if (typeof window.tab === 'function') window.tab('content');
            return { ok: true, token: data.token.slice(0, 10) };
          }
          return { ok: false, data };
        })();
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Login eval result:', evalRes);
    await new Promise(r => setTimeout(r, 2000));

    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
    console.log(`Saved admin screenshot to ${outPath}`);
    ws.close();
  } finally {
    chrome.kill();
  }
}

async function main() {
  const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a';
  await captureAdmin(path.join(artifactDir, 'admin-content-cms-verified.png'));
}

main().catch(console.error);
