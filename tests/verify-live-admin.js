const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkLive() {
  const port = 9830;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-live-final-'));
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
  await send('Page.navigate', { url: 'https://shimlacrunch-store.web.app/admin.html' });
  await new Promise(r => setTimeout(r, 3000));

  // Light Mode + English
  const resLight = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        document.getElementById('admin-pw').value = 'shimla@2024';
        await doLogin();
        await new Promise(r => setTimeout(r, 800));
        setAdminLang('en');
        setAdminTheme('light');
        await new Promise(r => setTimeout(r, 400));

        const side = document.querySelector('.side');
        const brand = document.querySelector('.side .brand');
        const logo = document.querySelector('.admin-brand-logo');
        const name = document.querySelector('.brand-name');
        const sub = document.querySelector('.brand-sub');

        return {
          theme: document.documentElement.getAttribute('data-theme'),
          brandBg: window.getComputedStyle(brand).backgroundColor,
          brandBorder: window.getComputedStyle(brand).border,
          brandHeight: brand.getBoundingClientRect().height,
          brandWidth: brand.getBoundingClientRect().width,
          logoWidth: logo.getBoundingClientRect().width,
          logoHeight: logo.getBoundingClientRect().height,
          nameText: name.textContent,
          subText: sub.textContent
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Live Light Mode:', JSON.stringify(resLight.result.value, null, 2));

  const clipLight = await send('Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 340, height: 280, scale: 2 }
  });
  const liveLightPath = path.join('C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a', 'live-brand-light-fixed.png');
  fs.writeFileSync(liveLightPath, Buffer.from(clipLight.data, 'base64'));

  // Dark Mode + English
  const resDark = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        setAdminTheme('dark');
        await new Promise(r => setTimeout(r, 400));
        const brand = document.querySelector('.side .brand');
        return {
          theme: document.documentElement.getAttribute('data-theme'),
          brandHeight: brand.getBoundingClientRect().height
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Live Dark Mode:', JSON.stringify(resDark.result.value, null, 2));

  const clipDark = await send('Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 340, height: 280, scale: 2 }
  });
  const liveDarkPath = path.join('C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a', 'live-brand-dark-fixed.png');
  fs.writeFileSync(liveDarkPath, Buffer.from(clipDark.data, 'base64'));

  chrome.kill();
  process.exit(0);
}

checkLive().catch(e => { console.error(e); process.exit(1); });
