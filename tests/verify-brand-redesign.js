const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verify() {
  const port = 9820;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-brand-ver-'));
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
  await send('Page.navigate', { url: 'http://localhost:3000/admin.html' });
  await new Promise(r => setTimeout(r, 2000));

  // Test in Light Mode first (exact user screenshot condition)
  const lightEval = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        document.getElementById('admin-pw').value = 'shimla@2024';
        await doLogin();
        await new Promise(r => setTimeout(r, 600));
        setAdminLang('en');
        setAdminTheme('light');
        await new Promise(r => setTimeout(r, 300));

        const side = document.querySelector('.side');
        const brand = document.querySelector('.side .brand');
        const logo = document.querySelector('.admin-brand-logo');
        const name = document.querySelector('.brand-name');
        const sub = document.querySelector('.brand-sub');

        const rObj = el => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { width: Math.round(r.width), height: Math.round(r.height), left: Math.round(r.left), top: Math.round(r.top) };
        };

        return {
          theme: document.documentElement.getAttribute('data-theme'),
          sideRect: rObj(side),
          brandRect: rObj(brand),
          logoRect: rObj(logo),
          nameRect: rObj(name),
          subRect: rObj(sub),
          brandBg: window.getComputedStyle(brand).backgroundColor,
          brandBorder: window.getComputedStyle(brand).border,
          brandShrink: window.getComputedStyle(brand).flexShrink,
          brandMinHeight: window.getComputedStyle(brand).minHeight
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Light Mode Verification:', JSON.stringify(lightEval.result.value, null, 2));

  // Capture screenshot of Light Mode
  const lightClip = await send('Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 340, height: 260, scale: 2 }
  });
  const lightPath = path.join('C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a', 'verified-brand-light.png');
  fs.writeFileSync(lightPath, Buffer.from(lightClip.data, 'base64'));

  // Switch to Dark Mode
  const darkEval = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        setAdminTheme('dark');
        await new Promise(r => setTimeout(r, 300));
        const side = document.querySelector('.side');
        const brand = document.querySelector('.side .brand');
        const rObj = el => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { width: Math.round(r.width), height: Math.round(r.height), left: Math.round(r.left), top: Math.round(r.top) };
        };
        return {
          theme: document.documentElement.getAttribute('data-theme'),
          brandRect: rObj(brand)
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Dark Mode Verification:', JSON.stringify(darkEval.result.value, null, 2));

  // Capture screenshot of Dark Mode
  const darkClip = await send('Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 340, height: 260, scale: 2 }
  });
  const darkPath = path.join('C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a', 'verified-brand-dark.png');
  fs.writeFileSync(darkPath, Buffer.from(darkClip.data, 'base64'));

  chrome.kill();
  process.exit(0);
}

verify().catch(e => { console.error(e); process.exit(1); });
