const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function check() {
  const port = 9794;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-app-'));
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

  await send('DOM.enable');
  await send('CSS.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: 'https://shimlacrunch-store.web.app/admin.html' });
  await new Promise(r => setTimeout(r, 3000));

  await send('Runtime.evaluate', {
    expression: `
      (async () => {
        document.getElementById('admin-pw').value = 'shimla@2024';
        await doLogin();
      })()
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 1000));

  const doc = await send('DOM.getDocument', { depth: -1 });
  const appNode = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#admin-app' });
  const matched = await send('CSS.getMatchedStylesForNode', { nodeId: appNode.nodeId });

  console.log('Matched rules for #admin-app:');
  for (const rule of matched.matchedCSSRules || []) {
    console.log('--- Selector:', rule.rule.selectorList.text);
    for (const prop of rule.rule.style.cssProperties) {
      if (['display', 'grid-template-columns', 'width'].includes(prop.name)) {
        console.log(`    ${prop.name}: ${prop.value}`);
      }
    }
  }

  const details = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const app = document.getElementById('admin-app');
        const main = document.querySelector('.main');
        const side = document.querySelector('.side');
        return {
          appDisplay: window.getComputedStyle(app).display,
          appCols: window.getComputedStyle(app).gridTemplateColumns,
          mainWidth: main.getBoundingClientRect().width,
          mainMinW: window.getComputedStyle(main).minWidth,
          sideWidth: side.getBoundingClientRect().width,
          sideCols: window.getComputedStyle(side).width,
          windowW: window.innerWidth,
          devicePixelRatio: window.devicePixelRatio,
          zoom: window.getComputedStyle(document.body).zoom
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Runtime evaluate:', details.result.value);

  chrome.kill();
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
