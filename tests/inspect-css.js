const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function check() {
  const port = 9792;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-matched-'));
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
  const brandNode = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '.side .brand' });
  const matched = await send('CSS.getMatchedStylesForNode', { nodeId: brandNode.nodeId });

  console.log('Matched rules for .side .brand:');
  for (const rule of matched.matchedCSSRules || []) {
    console.log('--- Selector:', rule.rule.selectorList.text);
    for (const prop of rule.rule.style.cssProperties) {
      if (['height', 'max-height', 'font', 'font-size', 'line-height', 'display', 'padding', 'width'].includes(prop.name)) {
        console.log(`    ${prop.name}: ${prop.value}`);
      }
    }
  }

  const sideNode = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '.side' });
  const matchedSide = await send('CSS.getMatchedStylesForNode', { nodeId: sideNode.nodeId });
  console.log('\nMatched rules for .side:');
  for (const rule of matchedSide.matchedCSSRules || []) {
    console.log('--- Selector:', rule.rule.selectorList.text);
    for (const prop of rule.rule.style.cssProperties) {
      if (['width', 'min-width', 'max-width', 'grid-template-columns', 'flex', 'padding'].includes(prop.name)) {
        console.log(`    ${prop.name}: ${prop.value}`);
      }
    }
  }

  chrome.kill();
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
