const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testDesign() {
  const port = 9814;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-brand-test2-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, '--window-size=1280,850', 'about:blank'], { stdio: 'ignore' });
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
        await new Promise(r => setTimeout(r, 600));
        setAdminLang('en');
        setAdminTheme('light');

        const style = document.createElement('style');
        style.id = 'brand-redesign-style';
        style.textContent = \`
          .side {
            gap: 18px !important;
          }
          .brand,
          .brand.brand-with-logo {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            padding: 2px 4px !important;
            margin: 0 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            flex-shrink: 0 !important;
            min-height: 44px !important;
            overflow: visible !important;
          }
          .admin-brand-logo {
            width: 38px !important;
            height: 38px !important;
            border-radius: 11px !important;
            object-fit: cover !important;
            flex-shrink: 0 !important;
            background: linear-gradient(135deg, #10b981 0%, #047857 100%) !important;
            padding: 3.5px !important;
            border: 1px solid rgba(0, 0, 0, 0.08) !important;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.28), 0 1px 3px rgba(0, 0, 0, 0.06) !important;
            transition: transform 0.2s ease !important;
          }
          .brand-text {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            gap: 3px !important;
            min-width: 0 !important;
            overflow: visible !important;
          }
          .brand-name {
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-size: 15.5px !important;
            font-weight: 700 !important;
            color: #0f172a !important;
            letter-spacing: -0.25px !important;
            line-height: 1.15 !important;
            white-space: nowrap !important;
          }
          .brand-sub {
            display: flex !important;
            align-items: center !important;
            gap: 5px !important;
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
            font-size: 9.5px !important;
            font-weight: 700 !important;
            letter-spacing: 1.1px !important;
            color: #15803d !important;
            text-transform: uppercase !important;
            line-height: 1 !important;
            white-space: nowrap !important;
          }
          .brand-sub::before {
            content: '';
            display: inline-block;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 6px #22c55e;
          }
          [data-theme="dark"] .admin-brand-logo {
            border: 1px solid rgba(255, 255, 255, 0.16) !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
          }
          [data-theme="dark"] .brand-name {
            color: #f8fafc !important;
          }
          [data-theme="dark"] .brand-sub {
            color: #34d399 !important;
          }
        \`;
        document.head.appendChild(style);
      })()
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 600));

  // Capture screenshot of new design in Light Mode
  const clipLight = await send('Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 340, height: 300, scale: 2 }
  });
  const pLight = path.join('C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a', 'brand-true-light.png');
  fs.writeFileSync(pLight, Buffer.from(clipLight.data, 'base64'));

  // Switch to Dark mode and capture screenshot
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        setAdminTheme('dark');
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const clipDark = await send('Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 340, height: 300, scale: 2 }
  });
  const pDark = path.join('C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a', 'brand-true-dark.png');
  fs.writeFileSync(pDark, Buffer.from(clipDark.data, 'base64'));

  console.log('Saved true theme screenshots:');
  console.log('  1. True Light:', pLight);
  console.log('  2. True Dark:', pDark);

  chrome.kill();
  process.exit(0);
}

testDesign().catch(e => { console.error(e); process.exit(1); });
