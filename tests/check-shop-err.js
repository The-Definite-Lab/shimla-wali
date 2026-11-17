const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkErr() {
  const port = 9866;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-dbgerr-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2000));
  
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  
  let cid = 0;
  const pend = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE:', m.params.args.map(a => a.value || a.description).join(' '));
    }
    if (m.method === 'Runtime.exceptionThrown') {
      console.log('EXCEPTION:', m.params.exceptionDetails.text, m.params.exceptionDetails.exception?.description);
    }
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

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:3000/shop.html' });
  await new Promise(r => setTimeout(r, 2500));

  const res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        return {
          window__isStoreSubpage: window.__isStoreSubpage,
          window_openCart: typeof window.openCart,
          historyState: history.state,
          visitedHome: sessionStorage.getItem('sc_visited_home'),
          referrer: document.referrer
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Evaluate result:', res.result.value);

  chrome.kill();
  process.exit(0);
}

checkErr().catch(e => { console.error(e); process.exit(1); });
