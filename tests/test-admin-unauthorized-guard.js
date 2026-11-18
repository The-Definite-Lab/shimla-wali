// tests/test-admin-unauthorized-guard.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testUnauthorizedGuard() {
  const port = 9846;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-auth-guard-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,900',
    'about:blank'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));

  try {
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

    // Test entering wrong password
    const wrongPwRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          document.getElementById('admin-pw').value = 'wrongpassword123';
          await doLogin();
          await new Promise(r => setTimeout(r, 600));
          const errEl = document.getElementById('login-error');
          return {
            isDisplayed: errEl && errEl.style.display !== 'none',
            errorText: errEl ? errEl.innerText : '',
            leaksPassword: errEl ? errEl.innerText.includes('shimla@2024') : false
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Wrong Password Guard Check:', wrongPwRes.result.value);

    // Capture screenshot of wrong password error
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const artifactPath = path.join(
      'C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a',
      'admin-access-denied-verified.png'
    );
    fs.writeFileSync(artifactPath, Buffer.from(shot.data, 'base64'));
    console.log('Access Denied screenshot saved to:', artifactPath);

    ws.close();
  } finally {
    chrome.kill();
  }
}

testUnauthorizedGuard().catch(console.error);
