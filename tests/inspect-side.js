const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function check() {
  const port = 9790;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-inspect4-'));
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
        const app = document.getElementById('admin-app');
        const brand = document.querySelector('.side .brand');
        
        return {
          appWidth: app.getBoundingClientRect().width,
          appStyleWidth: app.style.width,
          sideComputedWidth: window.getComputedStyle(side).width,
          sideBoxSizing: window.getComputedStyle(side).boxSizing,
          sideFlex: window.getComputedStyle(side).flex,
          sideMaxW: window.getComputedStyle(side).maxWidth,
          sideMinW: window.getComputedStyle(side).minWidth,
          sideClass: side.className,
          bodyClass: document.body.className,
          htmlClass: document.documentElement.className,
          brandHeight: brand.getBoundingClientRect().height,
          brandComputedHeight: window.getComputedStyle(brand).height,
          brandMaxH: window.getComputedStyle(brand).maxHeight,
          brandOverflowY: window.getComputedStyle(brand).overflowY,
          brandLineHeight: window.getComputedStyle(brand).lineHeight
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
