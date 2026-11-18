// tests/verify-live-wa-message.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LIVE_URL = 'https://shimlacrunch-store.web.app/checkout.html';

async function testLiveWa() {
  const cdpPort = 9858;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-live-wa-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=' + cdpPort,
    '--user-data-dir=' + userDataDir,
    'about:blank'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));
  try {
    const tabs = await (await fetch('http://127.0.0.1:' + cdpPort + '/json/list')).json();
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
    const send = (method, params = {}) => new Promise(resolve => {
      const id = ++cid;
      pend.set(id, { resolve });
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: LIVE_URL });
    await new Promise(r => setTimeout(r, 2000));

    // Setup cart
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          localStorage.setItem('sc_cart', JSON.stringify([{
            productId: 'royal-apples',
            sku: 'APRD-10KG-01',
            name: 'Himachal Royal Delicious Apples',
            price: 1699,
            quantity: 1,
            size: '10kg Orchard Pack'
          }]));
          localStorage.setItem('sc_customer_name', 'Pankaj');
          localStorage.setItem('sc_customer_phone', '9736353384');
          localStorage.setItem('sc_customer_address', 'NAHAN');
          localStorage.setItem('sc_customer_pincode', '173001');
        })()
      `
    });

    await send('Page.navigate', { url: LIVE_URL });
    await new Promise(r => setTimeout(r, 3000));

    let navigatedUrl = '';
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Page.frameNavigated') {
        const u = m.params.frame.url;
        if (u.includes('whatsapp.com')) navigatedUrl = u;
      }
      if (m.id && pend.has(m.id)) {
        pend.get(m.id).resolve(m.result);
        pend.delete(m.id);
      }
    };

    // Submit form using submit button click
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          document.getElementById('cust-name').value = 'Pankaj';
          document.getElementById('cust-phone').value = '9736353384';
          document.getElementById('cust-address').value = 'NAHAN';
          if (document.getElementById('cust-landmark')) document.getElementById('cust-landmark').value = 'NAHAN';
          document.getElementById('cust-city').value = 'NAHAN';
          document.getElementById('cust-pincode').value = '173001';

          const btn = document.getElementById('checkout-submit-btn');
          console.log('Clicking checkout button:', btn ? 'found' : 'not found');
          btn.click();
        })()
      `
    });

    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 200));
      if (navigatedUrl) break;
    }

    const waUrl = navigatedUrl;
    console.log('Generated Live WhatsApp URL:', waUrl ? waUrl.slice(0, 100) + '...' : '(none)');
    if (waUrl && waUrl.includes('text=')) {
      const rawText = decodeURIComponent(waUrl.split('text=')[1]);
      console.log('\n--- LIVE DECODED WHATSAPP MESSAGE ---\n' + rawText + '\n-------------------------------------');
      console.log('Contains separator lines:', rawText.includes('--------------------------------'));
      console.log('Contains question mark:', rawText.includes('?'));
    }

    ws.close();
  } finally {
    chrome.kill();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch(e) {}
  }
}

testLiveWa().catch(console.error);
