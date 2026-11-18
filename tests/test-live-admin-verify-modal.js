// tests/test-live-admin-verify-modal.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LIVE_URL = 'https://shimlacrunch-store.web.app/admin.html';
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\de4102c9-b6de-4891-a6ec-d0587a5ae78a';

async function testAdminVerifyModal() {
  const cdpPort = 9860;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-admin-verify-test-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=' + cdpPort,
    '--user-data-dir=' + userDataDir,
    '--window-size=1280,1000',
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

    console.log('Navigating to live admin portal...');
    await send('Page.navigate', { url: LIVE_URL });
    await new Promise(r => setTimeout(r, 2500));

    // Setup session and mock order in window.state
    const setupRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          sessionStorage.setItem('sc_master_session', '1');
          localStorage.setItem('sc_admin_token', 'sc_master_token_test');

          if (!window.state) window.state = {};
          if (!window.state.orders) window.state.orders = [];

          const sample = {
            orderId: 'SC-ORD-1025',
            storeId: 'shimlacrunch',
            createdAt: new Date().toISOString(),
            orderStatus: 'pending_whatsapp',
            verificationState: 'needs_verification',
            paymentMethod: 'COD',
            shippingCharge: 25,
            discountAmount: 480,
            discountCode: 'SHIMLA50',
            grandTotal: 1244,
            customerSnapshot: {
              name: 'Pankaj',
              phone: '9736353384',
              address: 'NAHAN',
              landmark: 'Near Bus Stand',
              city: 'NAHAN',
              pincode: '173001'
            },
            itemsSnapshot: [
              {
                sku: 'APRD-10KG-01',
                productName: 'Himachal Royal Delicious Apples',
                variantLabel: '10kg Orchard Pack',
                quantity: 1,
                price: 1699,
                lineTotal: 1699
              }
            ]
          };

          window.state.orders = [sample];

          // Open the verify buy modal
          if (typeof window.openVerifyBuyModal === 'function') {
            window.openVerifyBuyModal('SC-ORD-1025');
          }
          return { ready: true };
        })()
      `,
      returnByValue: true
    });
    console.log('Setup result:', setupRes.result.value);
    await new Promise(r => setTimeout(r, 1000));

    // Inspect the modal DOM
    const modalCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('verify-buy-modal');
          const isModalOpen = modal ? modal.classList.contains('show') : false;

          const readonlyCard = document.getElementById('vb-readonly-summary');
          const isReadonlyVisible = readonlyCard ? (readonlyCard.style.display !== 'none') : false;

          const viewName = document.getElementById('vb-view-name')?.textContent || '';
          const viewPhone = document.getElementById('vb-view-phone')?.textContent || '';
          const viewAddress = document.getElementById('vb-view-address')?.textContent || '';
          const viewTotal = document.getElementById('vb-view-total')?.textContent || '';
          const viewItems = document.getElementById('vb-view-items-list')?.innerText || '';

          const editWrap = document.getElementById('vb-edit-fields-wrap');
          const isEditWrapHidden = editWrap ? (editWrap.style.display === 'none') : true;

          const modalText = modal ? modal.innerText : '';
          const hasWali = /shimla[\s_-]*wali/i.test(modalText);

          return {
            isModalOpen,
            isReadonlyVisible,
            viewName,
            viewPhone,
            viewAddress,
            viewTotal,
            viewItems,
            isEditWrapHidden,
            hasWali
          };
        })()
      `,
      returnByValue: true
    });

    console.log('\n--- Modal State Results ---');
    const res = modalCheck.result.value;
    console.log('Modal is open:', res.isModalOpen);
    console.log('Read-only summary card visible:', res.isReadonlyVisible);
    console.log('Customer Name shown:', res.viewName);
    console.log('Customer Phone shown:', res.viewPhone);
    console.log('Customer Address shown:', res.viewAddress);
    console.log('Order Total shown:', res.viewTotal);
    console.log('Ordered Items shown:\n' + res.viewItems);
    console.log('Edit fields hidden by default (No dropdown clutter):', res.isEditWrapHidden);
    console.log('Contains previous brand (Wali):', res.hasWali);

    // Capture screenshot
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = path.join(ARTIFACTS_DIR, 'admin-verify-modal-clean-redesign.png');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`Saved screenshot to: ${screenshotPath}`);

    // Test toggle edit
    console.log('\n--- Testing Edit Toggle ---');
    const toggleCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (typeof window.toggleVerifyBuyEdit === 'function') {
            window.toggleVerifyBuyEdit();
          }
          const editWrap = document.getElementById('vb-edit-fields-wrap');
          return { isEditVisible: editWrap ? editWrap.style.display === 'block' : false };
        })()
      `,
      returnByValue: true
    });
    console.log('Edit fields visible after toggle:', toggleCheck.result.value.isEditVisible);

    ws.close();
  } finally {
    chrome.kill();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch(e) {}
  }
}

testAdminVerifyModal().catch(console.error);
