const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function check() {
  const port = 9788;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-inspect3-'));
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

  const info = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        document.getElementById('admin-pw').value = 'shimla@2024';
        await doLogin();
        await new Promise(r => setTimeout(r, 1000));
        const side = document.querySelector('.side');
        const brand = document.querySelector('.side .brand');
        const logo = document.querySelector('.admin-brand-logo');
        const text = document.querySelector('.brand-text');
        const name = document.querySelector('.brand-name');
        const sub = document.querySelector('.brand-sub');
        const rObj = el => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { width: r.width, height: r.height, left: r.left, top: r.top };
        };
        return {
          windowWidth: window.innerWidth,
          sideRect: rObj(side),
          brandRect: rObj(brand),
          logoRect: rObj(logo),
          textRect: rObj(text),
          nameRect: rObj(name),
          subRect: rObj(sub),
          brandComputedPadding: window.getComputedStyle(brand).padding,
          sideComputedPadding: window.getComputedStyle(side).padding,
          appGridCols: window.getComputedStyle(document.getElementById('admin-app')).gridTemplateColumns,
          brandStyle: {
            display: window.getComputedStyle(brand).display,
            gap: window.getComputedStyle(brand).gap,
            width: window.getComputedStyle(brand).width,
            boxSizing: window.getComputedStyle(brand).boxSizing
          }
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log(JSON.stringify(info.result.value, null, 2));

  chrome.kill();
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
