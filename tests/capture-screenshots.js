const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(p => fs.existsSync(p));

let portCounter = 9550;

async function capture(url, outPath, width = 375, height = 812, scrollSelector = null) {
  const port = portCounter++;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-snap-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    `--window-size=${width},${height}`,
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
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: true
    });
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1500));

    if (scrollSelector) {
      await send('Runtime.evaluate', {
        expression: `
          const el = document.querySelector('${scrollSelector}');
          if (el) {
            el.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        `
      });
      await new Promise(r => setTimeout(r, 500));
    }

    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot to ${outPath}`);
    ws.close();
  } finally {
    chrome.kill();
  }
}

async function main() {
  const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a';
  
  console.log('Capturing PDP offer banner (375x812)...');
  await capture(
    'http://localhost:3000/product.html?id=royal-apples',
    path.join(artifactDir, 'pdp-offer-fixed-375.png'),
    375, 812,
    '.pdp-festive-offer-card'
  );

  console.log('Capturing PDP offer banner (360x780)...');
  await capture(
    'http://localhost:3000/product.html?id=royal-apples',
    path.join(artifactDir, 'pdp-offer-fixed-360.png'),
    360, 780,
    '.pdp-festive-offer-card'
  );

  console.log('Capturing Comparison Matrix (375x812)...');
  await capture(
    'http://localhost:3000/index.html',
    path.join(artifactDir, 'comp-matrix-fixed-375.png'),
    375, 812,
    '.comp-matrix-card'
  );

  console.log('Capturing Comparison Matrix (360x780)...');
  await capture(
    'http://localhost:3000/index.html',
    path.join(artifactDir, 'comp-matrix-fixed-360.png'),
    360, 780,
    '.comp-matrix-card'
  );
}

main().catch(console.error);
