const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testComplete() {
  const port = 9860;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-navtest-'));
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

  console.log('=== TEST SUITE: BROWSER & ANDROID BACK NAVIGATION ===\n');

  // ---------------------------------------------------------------
  // SCENARIO 1: User on Home -> Opens Bag -> Navigates to Profile ->
  //             Presses Back -> Bag Reopens -> Presses Back -> Bag Closes -> Home!
  // ---------------------------------------------------------------
  console.log('--- SCENARIO 1: Home -> Bag -> Profile -> Back (Bag) -> Back (Home) ---');
  await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Open Bag
  const step1 = await send('Runtime.evaluate', {
    expression: `
      (() => {
        window.openCart();
        return {
          url: window.location.href,
          hash: window.location.hash,
          cartActive: document.getElementById('cart-drawer')?.classList.contains('active')
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Step 1 (Open Bag):', step1.result.value);

  // 2. Click Profile from Bag
  await send('Runtime.evaluate', {
    expression: "window.location.href = 'profile.html'"
  });
  await new Promise(r => setTimeout(r, 2000));

  const step2 = await send('Runtime.evaluate', {
    expression: `(() => ({ url: window.location.href, title: document.title }))()`,
    returnByValue: true
  });
  console.log('Step 2 (On Profile):', step2.result.value);

  // 3. Android Back from Profile
  console.log('Step 3: Triggering Android back from profile...');
  await send('Runtime.evaluate', { expression: 'history.back()' });
  await new Promise(r => setTimeout(r, 2500));

  const step3 = await send('Runtime.evaluate', {
    expression: `
      (() => ({
        url: window.location.href,
        hash: window.location.hash,
        cartActive: document.getElementById('cart-drawer')?.classList.contains('active')
      }))()
    `,
    returnByValue: true
  });
  console.log('Step 3 Result (Should be index.html with Bag OPEN):', step3.result.value);

  // 4. Android Back from Bag
  console.log('Step 4: Triggering Android back to close Bag...');
  await send('Runtime.evaluate', { expression: 'history.back()' });
  await new Promise(r => setTimeout(r, 1500));

  const step4 = await send('Runtime.evaluate', {
    expression: `
      (() => ({
        url: window.location.href,
        hash: window.location.hash,
        cartActive: document.getElementById('cart-drawer')?.classList.contains('active')
      }))()
    `,
    returnByValue: true
  });
  console.log('Step 4 Result (Should be index.html with Bag CLOSED):', step4.result.value);

  // ---------------------------------------------------------------
  // SCENARIO 2: Direct Entry to Subpage -> Back -> Lands on Homepage
  // ---------------------------------------------------------------
  console.log('\n--- SCENARIO 2: Direct Landing on profile.html -> Back -> Lands on Home ---');
  await send('Page.navigate', { url: 'http://localhost:3000/profile.html' });
  await new Promise(r => setTimeout(r, 2000));

  const directSub = await send('Runtime.evaluate', {
    expression: `(() => ({ url: window.location.href, isSubpage: window.__isStoreSubpage }))()`,
    returnByValue: true
  });
  console.log('Direct Subpage:', directSub.result.value);

  console.log('Triggering Back from direct subpage...');
  await send('Runtime.evaluate', { expression: 'history.back()' });
  await new Promise(r => setTimeout(r, 2500));

  const afterDirectBack = await send('Runtime.evaluate', {
    expression: `(() => ({ url: window.location.href, title: document.title }))()`,
    returnByValue: true
  });
  console.log('After Back (Should land on index.html):', afterDirectBack.result.value);

  chrome.kill();
  process.exit(0);
}

testComplete().catch(e => { console.error(e); process.exit(1); });
