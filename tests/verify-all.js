/**
 * Shimla Wali — End-to-End Backend, Concurrency, Security & Workflow Test Suite
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { createAppServer } = require('../server');
const { hashPasswordPbkdf2 } = require('../server/auth');

async function reqJson(baseUrl, pathname, { method = 'GET', body = null, headers = {} } = {}) {
  const opts = {
    method,
    headers: { ...headers }
  };
  if (body !== null && !(body instanceof Buffer) && typeof body !== 'string') {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body !== null) {
    opts.body = body;
  }
  const res = await fetch(`${baseUrl}${pathname}`, opts);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, headers: res.headers, text, json };
}

function buildMultipart(fieldName, filename, mime, contentBuf) {
  const boundary = '----ShimlaBoundaryTest123456';
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`,
    'utf8'
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat([head, contentBuf, tail])
  };
}

async function runSuite() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'shimla-test-'));
  const legacySrc = path.join(__dirname, '..', 'products.json');
  const testLegacyCopy = path.join(tmpRoot, 'products.json');
  fs.copyFileSync(legacySrc, testLegacyCopy);

  // Override password in env for deterministic PBKDF2 hash test
  const testPassword = 'Test@ShimlaSecure#2026';
  process.env.ADMIN_PASSWORD_HASH = hashPasswordPbkdf2(testPassword);
  delete process.env.ADMIN_PASSWORD;

  const { server } = createAppServer({
    rootDir: path.join(__dirname, '..'),
    dbDir: path.join(tmpRoot, 'db'),
    uploadsDir: path.join(tmpRoot, 'uploads'),
    legacyProductsFile: testLegacyCopy,
    publicSnapshotFile: testLegacyCopy,
    quiet: true
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const results = [];
  async function test(name, fn) {
    try {
      await fn();
      results.push({ name, ok: true });
      console.log(`  ✅ ${name}`);
    } catch (err) {
      results.push({ name, ok: false, error: err.message });
      console.error(`  ❌ ${name}: ${err.stack || err.message}`);
    }
  }

  let adminToken = '';
  let custAToken = '';
  let custAOrderId = '';
  let custBToken = '';
  let codOrderId = '';
  let backupFile = '';

  try {
    console.log('\n🧪 Running Shimla Wali Production Verification Suite...\n');

    await test('1. Initial migration seeds 7 products & 21 structured SKUs with ZERO fake orders/revenue', async () => {
      const pub = await reqJson(baseUrl, '/api/products');
      assert.strictEqual(pub.status, 200);
      assert.strictEqual(pub.json.products.length, 7);
      const ghee = pub.json.products.find(p => p.id === 'ghee');
      assert.strictEqual(ghee.nicheTag, 'GHSM');
      assert.strictEqual(ghee.sku, 'GHSM-500ML-01');
      assert.strictEqual(ghee.variants.length, 3);
      const pickle = pub.json.products.find(p => p.id === 'pickle');
      assert.strictEqual(pickle.nicheTag, 'PKSM');
      assert.ok(pickle.variants.some(v => v.sku === 'PKSM-GAL-400G'));
      assert.ok(pickle.variants.some(v => v.sku === 'PKSM-AAM-800G'));
    });

    await test('2. Security: Static file traversal, db/ exposure & unauthenticated admin endpoints blocked', async () => {
      assert.strictEqual((await reqJson(baseUrl, '/db/orders.json')).status, 403);
      assert.strictEqual((await reqJson(baseUrl, '/db/customers.json')).status, 403);
      assert.strictEqual((await reqJson(baseUrl, '/server.js')).status, 403);
      assert.strictEqual((await reqJson(baseUrl, '/api/admin/bootstrap')).status, 401);
      assert.strictEqual((await reqJson(baseUrl, '/api/admin/products', { method: 'POST', body: {} })).status, 401);
    });

    await test('3. Admin login verifies PBKDF2 password hash & rejects invalid passwords', async () => {
      const bad = await reqJson(baseUrl, '/api/admin/login', { method: 'POST', body: { password: 'wrong' } });
      assert.strictEqual(bad.status, 401);
      const good = await reqJson(baseUrl, '/api/admin/login', { method: 'POST', body: { password: testPassword } });
      assert.strictEqual(good.status, 200);
      assert.ok(good.json.token && !good.json.token.includes(testPassword));
      adminToken = good.json.token;

      const boot = await reqJson(baseUrl, '/api/admin/bootstrap', { headers: { 'X-Admin-Token': adminToken } });
      assert.strictEqual(boot.status, 200);
      assert.strictEqual(boot.json.metrics.netRevenue, 0);
      assert.strictEqual(boot.json.metrics.confirmedCumulativeCount, 0);
      assert.strictEqual(boot.json.orders.length, 0);
    });

    await test('4. Product & Niche/SKU Management + Storefront Public Sync + Hide/Show', async () => {
      const h = { 'X-Admin-Token': adminToken };
      const niche = await reqJson(baseUrl, '/api/admin/niches', {
        method: 'POST',
        headers: h,
        body: { name: 'Mountain Tea', tag: 'TESM' }
      });
      assert.strictEqual(niche.status, 201);

      const created = await reqJson(baseUrl, '/api/admin/products', {
        method: 'POST',
        headers: h,
        body: {
          id: 'kangra-tea',
          title: 'Kangra Orthodox Green Tea',
          subtitle: '100g High-Elevation Tin',
          niche: 'mountain-tea',
          nicheTag: 'TESM',
          variants: [
            { size: '100g', sku: 'TESM-100G-01', price: 399, mrp: 499, reorderThreshold: 5, initialStock: 10, isDefault: true }
          ]
        }
      });
      assert.strictEqual(created.status, 201);

      // Update Ghee price -> verify reflected in /api/products immediately
      const edit = await reqJson(baseUrl, '/api/admin/products/ghee', {
        method: 'PUT',
        headers: h,
        body: {
          title: 'A2 Pahadi Cow Bilona Desi Ghee',
          price: 1299,
          mrp: 1599,
          pillText: 'Batch #105 Live'
        }
      });
      assert.strictEqual(edit.status, 200);

      let pub = await reqJson(baseUrl, '/api/products');
      const liveGhee = pub.json.products.find(p => p.id === 'ghee');
      const liveTea = pub.json.products.find(p => p.id === 'kangra-tea');
      assert.strictEqual(liveGhee.price, 1299);
      assert.strictEqual(liveGhee.pillText, 'Batch #105 Live');
      assert.strictEqual(liveTea.sku, 'TESM-100G-01');

      // Hide product -> must vanish from public /api/products and reject checkout
      await reqJson(baseUrl, '/api/admin/products/kangra-tea/visibility', {
        method: 'PATCH',
        headers: h,
        body: { visible: false }
      });
      pub = await reqJson(baseUrl, '/api/products');
      assert.strictEqual(pub.json.products.some(p => p.id === 'kangra-tea'), false);

      // Restore visibility
      await reqJson(baseUrl, '/api/admin/products/kangra-tea/visibility', {
        method: 'PATCH',
        headers: h,
        body: { visible: true }
      });
    });

    await test('5. Inventory mandatory reason enforcement & Batch traceability linkage', async () => {
      const h = { 'X-Admin-Token': adminToken };
      const noReason = await reqJson(baseUrl, '/api/admin/inventory/adjust', {
        method: 'POST',
        headers: h,
        body: { sku: 'GHSM-500ML-01', movementType: 'manual_adjustment', qtyDelta: 5, reason: '' }
      });
      assert.strictEqual(noReason.status, 400);

      // Bulk set opening stock verifies reason enforcement + atomic ledger recording
      const bulkNoReason = await reqJson(baseUrl, '/api/admin/inventory/bulk', {
        method: 'POST',
        headers: h,
        body: { reason: '', items: [{ sku: 'GHSM-250ML-01', availableQty: 30 }] }
      });
      assert.strictEqual(bulkNoReason.status, 400);

      const bulkOk = await reqJson(baseUrl, '/api/admin/inventory/bulk', {
        method: 'POST',
        headers: h,
        body: { reason: 'Physical shelf audit verification', items: [{ sku: 'GHSM-250ML-01', availableQty: 30 }] }
      });
      assert.strictEqual(bulkOk.status, 200);
      assert.strictEqual(bulkOk.json.updated[0].after, 30);

      const batch = await reqJson(baseUrl, '/api/admin/batches', {
        method: 'POST',
        headers: h,
        body: {
          productId: 'ghee',
          sku: 'GHSM-500ML-01',
          productionDate: '2026-11-10',
          bestBeforeDate: '2027-05-10',
          initialQty: 10,
          addToInventory: true,
          setAsActiveProductBatch: true
        }
      });
      assert.strictEqual(batch.status, 201);
      assert.ok(batch.json.batch.id.startsWith('GHSM-'));
    });

    await test('6. Discounts validation & Checkout price tamper immunity', async () => {
      const h = { 'X-Admin-Token': adminToken };
      await reqJson(baseUrl, '/api/admin/discounts', {
        method: 'POST',
        headers: h,
        body: { title: 'Hills 10%', code: 'HILLS10', type: 'percent', value: 10, minOrderAmount: 500, active: true }
      });

      // Attempt frontend price tampering (unitPrice: 1, qty: 2)
      const quote = await reqJson(baseUrl, '/api/checkout/quote', {
        method: 'POST',
        body: {
          items: [{ productId: 'ghee', sku: 'GHSM-500ML-01', quantity: 2, unitPrice: 1, price: 1 }],
          paymentMethod: 'ONLINE',
          promoCode: 'HILLS10'
        }
      });
      assert.strictEqual(quote.status, 200);
      assert.strictEqual(quote.json.quote.subtotal, 2598); // 2 * 1299 from backend DB, ignoring fake 1!
      assert.strictEqual(quote.json.quote.discountAmount, 260); // 10%
      assert.strictEqual(quote.json.quote.grandTotal, 2338);

      // Reject negative / invalid qty & unknown SKU
      const badQty = await reqJson(baseUrl, '/api/orders', {
        method: 'POST',
        body: {
          customer: { name: 'Bad', phone: '9876543210', address: 'Test Lane 1', city: 'Shimla', pincode: '171001' },
          items: [{ sku: 'GHSM-500ML-01', quantity: -2 }],
          paymentMethod: 'COD'
        }
      });
      assert.strictEqual(badQty.status, 400);
    });

    await test('7. Order Request does NOT deduct stock or count as revenue until Confirm -> Dispatch -> Paid', async () => {
      const h = { 'X-Admin-Token': adminToken };
      const invBefore = (await reqJson(baseUrl, '/api/admin/inventory', { headers: h })).json.inventory['GHSM-500ML-01'].availableQty;

      const ordRes = await reqJson(baseUrl, '/api/orders', {
        method: 'POST',
        body: {
          customer: { name: 'Neha Sharma', phone: '9876500011', address: 'Mall Road 12', city: 'Shimla, HP', pincode: '171001' },
          items: [{ sku: 'GHSM-500ML-01', quantity: 2 }],
          paymentMethod: 'ONLINE',
          promoCode: 'HILLS10'
        }
      });
      assert.strictEqual(ordRes.status, 201);
      custAToken = ordRes.json.customerToken;
      custAOrderId = ordRes.json.order.orderId;
      assert.strictEqual(ordRes.json.order.orderStatus, 'pending_whatsapp');
      assert.strictEqual(ordRes.json.order.paymentStatus, 'pending');
      assert.strictEqual(ordRes.json.order.grandTotal, 2338);

      // Pending request must NOT deduct stock & MUST NOT count in netRevenue
      let boot = (await reqJson(baseUrl, '/api/admin/bootstrap', { headers: h })).json;
      assert.strictEqual(boot.inventory['GHSM-500ML-01'].availableQty, invBefore);
      assert.strictEqual(boot.metrics.netRevenue, 0);
      assert.strictEqual(boot.metrics.orderRequestsCount, 1);

      // Independent Payment BEFORE Dispatch (Prepaid UPI verified while Confirmed)
      await reqJson(baseUrl, `/api/admin/orders/${custAOrderId}/confirm`, { method: 'POST', headers: h, body: {} });
      let afterConf = (await reqJson(baseUrl, '/api/admin/bootstrap', { headers: h })).json;
      assert.strictEqual(afterConf.inventory['GHSM-500ML-01'].availableQty, invBefore); // still not deducted
      assert.strictEqual(afterConf.inventory['GHSM-500ML-01'].reservedQty, 2); // reserved!

      await reqJson(baseUrl, `/api/admin/orders/${custAOrderId}/payment`, {
        method: 'POST',
        headers: h,
        body: { action: 'mark_paid', paymentMethod: 'ONLINE', transactionReference: 'UPI998877' }
      });
      let afterPrepaid = (await reqJson(baseUrl, '/api/admin/bootstrap', { headers: h })).json;
      assert.strictEqual(afterPrepaid.metrics.totalCollectedCash, 2338);
      assert.strictEqual(afterPrepaid.metrics.paidDispatchedSales, 0); // not dispatched yet!

      // Dispatch + Idempotency duplicate call
      const key = 'idemp-disp-001';
      await reqJson(baseUrl, `/api/admin/orders/${custAOrderId}/dispatch`, {
        method: 'POST',
        headers: h,
        body: { courier: 'Delhivery', trackingId: 'DL12345', idempotencyKey: key }
      });
      await reqJson(baseUrl, `/api/admin/orders/${custAOrderId}/dispatch`, {
        method: 'POST',
        headers: h,
        body: { courier: 'Delhivery', trackingId: 'DL12345', idempotencyKey: key }
      });

      const afterDisp = (await reqJson(baseUrl, '/api/admin/bootstrap', { headers: h })).json;
      assert.strictEqual(afterDisp.inventory['GHSM-500ML-01'].availableQty, invBefore - 2); // deducted EXACTLY ONCE
      assert.strictEqual(afterDisp.inventory['GHSM-500ML-01'].reservedQty, 0);
      assert.strictEqual(afterDisp.metrics.netRevenue, 2338);

      // Cannot cancel after dispatch
      const badCancel = await reqJson(baseUrl, `/api/admin/orders/${custAOrderId}/cancel`, { method: 'POST', headers: h, body: {} });
      assert.strictEqual(badCancel.status, 409);

      // Deliver order
      await reqJson(baseUrl, `/api/admin/orders/${custAOrderId}/deliver`, { method: 'POST', headers: h, body: {} });
      const afterDeliv = (await reqJson(baseUrl, '/api/admin/bootstrap', { headers: h })).json;
      assert.strictEqual(afterDeliv.metrics.deliveredPaidRevenue, 2338);
    });

    await test('8. Return Inspection separates sellable restock vs damaged stock + Independent Refund', async () => {
      const h = { 'X-Admin-Token': adminToken };
      const invBefore = (await reqJson(baseUrl, '/api/admin/inventory', { headers: h })).json.inventory['GHSM-500ML-01'].availableQty;

      // Partial damaged + restock inspection (1 sellable, 1 damaged out of 2)
      const retRes = await reqJson(baseUrl, `/api/admin/orders/${custAOrderId}/return`, {
        method: 'POST',
        headers: h,
        body: { stage: 'return_inspected', reason: 'One jar leaked in transit', restockedQty: 1, damagedQty: 1 }
      });
      assert.strictEqual(retRes.status, 200);
      assert.strictEqual(retRes.json.order.paymentStatus, 'refund_pending');

      let afterInsp = (await reqJson(baseUrl, '/api/admin/bootstrap', { headers: h })).json;
      assert.strictEqual(afterInsp.inventory['GHSM-500ML-01'].availableQty, invBefore + 1); // +1 sellable only
      assert.strictEqual(afterInsp.inventory['GHSM-500ML-01'].damagedQty, 1); // +1 damaged quarantined

      // Issue partial refund for leaked jar (₹1169)
      const refRes = await reqJson(baseUrl, `/api/admin/orders/${custAOrderId}/refund`, {
        method: 'POST',
        headers: h,
        body: { refundAmount: 1169, transactionReference: 'REF-UPI-01' }
      });
      assert.strictEqual(refRes.status, 200);
      assert.strictEqual(refRes.json.order.paymentStatus, 'partially_refunded');

      const afterRef = (await reqJson(baseUrl, '/api/admin/bootstrap', { headers: h })).json;
      assert.strictEqual(afterRef.metrics.netRevenue, 2338 - 1169);
    });

    await test('9. Pre-dispatch cancellation releases reservation with zero stock loss & Concurrency guard on last unit', async () => {
      const h = { 'X-Admin-Token': adminToken };

      // Set TESM-100G-01 stock to exact 1 unit
      const curTesm = (await reqJson(baseUrl, '/api/admin/inventory', { headers: h })).json.inventory['TESM-100G-01'].availableQty;
      await reqJson(baseUrl, '/api/admin/inventory/adjust', {
        method: 'POST',
        headers: h,
        body: { sku: 'TESM-100G-01', movementType: 'manual_adjustment', qtyDelta: -(curTesm - 1), reason: 'Set exact 1 unit for race test' }
      });

      // Two customers place order requests for that 1 remaining unit
      const o1 = await reqJson(baseUrl, '/api/orders', {
        method: 'POST',
        body: {
          customer: { name: 'Rohit Thakur', phone: '9876500022', address: 'Sanjauli Rd', city: 'Shimla', pincode: '171006' },
          items: [{ sku: 'TESM-100G-01', quantity: 1 }],
          paymentMethod: 'COD'
        }
      });
      custBToken = o1.json.customerToken;
      codOrderId = o1.json.order.orderId;

      const o2 = await reqJson(baseUrl, '/api/orders', {
        method: 'POST',
        body: {
          customer: { name: 'Meera Verma', phone: '9876500033', address: 'Lakkar Bazar', city: 'Shimla', pincode: '171001' },
          items: [{ sku: 'TESM-100G-01', quantity: 1 }],
          paymentMethod: 'ONLINE'
        }
      });
      const raceOrder2Id = o2.json.order.orderId;

      // Two simultaneous Confirm calls race for the single available unit
      const [c1, c2] = await Promise.all([
        reqJson(baseUrl, `/api/admin/orders/${codOrderId}/confirm`, { method: 'POST', headers: h, body: {} }),
        reqJson(baseUrl, `/api/admin/orders/${raceOrder2Id}/confirm`, { method: 'POST', headers: h, body: {} })
      ]);
      const statuses = [c1.status, c2.status].sort((a, b) => a - b);
      assert.deepStrictEqual(statuses, [200, 409]); // Exactly ONE confirms, ONE rejected cleanly!

      // Cancel whichever order was confirmed -> reservation releases back to 1 free unit!
      const confirmedId = c1.status === 200 ? codOrderId : raceOrder2Id;
      await reqJson(baseUrl, `/api/admin/orders/${confirmedId}/cancel`, { method: 'POST', headers: h, body: { reason: 'Customer cancelled' } });
      const invAfterCancel = (await reqJson(baseUrl, '/api/admin/inventory', { headers: h })).json.inventory['TESM-100G-01'];
      assert.strictEqual(invAfterCancel.availableQty, 1);
      assert.strictEqual(invAfterCancel.reservedQty, 0);
    });

    await test('10. Customer data isolation & Privilege escalation prevention', async () => {
      // Customer B cannot read Customer A order or admin endpoints
      const adminAttempt = await reqJson(baseUrl, '/api/admin/orders', { headers: { 'X-Customer-Token': custBToken } });
      assert.strictEqual(adminAttempt.status, 401);

      const crossRead = await reqJson(baseUrl, `/api/orders/${custAOrderId}`, { headers: { 'X-Customer-Token': custBToken } });
      assert.strictEqual(crossRead.status, 403);

      const ownRead = await reqJson(baseUrl, `/api/orders/${custAOrderId}`, { headers: { 'X-Customer-Token': custAToken } });
      assert.strictEqual(ownRead.status, 200);

      // Anonymous phone lookup without Order ID or PIN fails for existing customer
      const phoneSnoop = await reqJson(baseUrl, '/api/customer/session', {
        method: 'POST',
        body: { phone: '9876500011', name: 'Snooper' }
      });
      assert.strictEqual(phoneSnoop.status, 403);

      // Valid Phone + Matching PIN grants own scoped session
      const validLookup = await reqJson(baseUrl, '/api/customer/session', {
        method: 'POST',
        body: { phone: '9876500011', pincode: '171001' }
      });
      assert.strictEqual(validLookup.status, 200);
      assert.strictEqual(validLookup.json.orders[0].orderId, custAOrderId);
    });

    await test('11. Upload security (magic bytes), CMS, Settings, Reports CSV & Backup/Restore', async () => {
      const h = { 'X-Admin-Token': adminToken };

      // Malicious HTML disguised as .jpg -> rejected by magic-byte check!
      const badUpload = buildMultipart('product_image', 'evil.jpg', 'image/jpeg', Buffer.from('<script>alert(1)</script>'));
      const badUpRes = await reqJson(baseUrl, '/api/admin/upload', {
        method: 'POST',
        headers: { ...h, 'Content-Type': badUpload.contentType },
        body: badUpload.body
      });
      assert.strictEqual(badUpRes.status, 400);

      // Real PNG header upload -> accepted!
      const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
      const okUpload = buildMultipart('himalayan_image', 'banner.png', 'image/png', pngMagic);
      const okUpRes = await reqJson(baseUrl, '/api/admin/upload', {
        method: 'POST',
        headers: { ...h, 'Content-Type': okUpload.contentType },
        body: okUpload.body
      });
      assert.strictEqual(okUpRes.status, 200);
      assert.ok(okUpRes.json.files[0].url.startsWith('/uploads/'));

      // CSV export + formula injection check + Backup snapshot + Restore roundtrip
      const csvRes = await reqJson(baseUrl, '/api/admin/reports/export.csv?type=orders', { headers: h });
      assert.strictEqual(csvRes.status, 200);
      assert.ok(csvRes.text.includes('SW-ORD-'));
      assert.ok(!csvRes.text.includes('\n=cmd'));

      const skuCsvRes = await reqJson(baseUrl, '/api/admin/reports/export.csv?type=skus', { headers: h });
      assert.strictEqual(skuCsvRes.status, 200);
      assert.ok(skuCsvRes.text.includes('GHSM-500ML-01'));

      const bk = await reqJson(baseUrl, '/api/admin/backup', { method: 'POST', headers: h, body: {} });
      assert.strictEqual(bk.status, 200);
      backupFile = bk.json.backup.filename;

      // Mutate announcement -> restore backup -> verify old announcement restored
      await reqJson(baseUrl, '/api/admin/content', { method: 'POST', headers: h, body: { announcement_bar: 'TEMP_MUTATION' } });
      const restore = await reqJson(baseUrl, '/api/admin/backup/restore', { method: 'POST', headers: h, body: { filename: backupFile } });
      assert.strictEqual(restore.status, 200);
      const pubAfterRestore = await reqJson(baseUrl, '/api/products');
      assert.notStrictEqual(pubAfterRestore.json.content.announcement_bar, 'TEMP_MUTATION');
    });

    await test('12. WhatsApp Buy Verification Workaround (Wait 2d -> Due Re-Ask -> Editable Accept Buy -> Sold/Remaining Sync)', async () => {
      const h = { 'X-Admin-Token': adminToken };
      const freeBefore = (skuRow) => Math.max(0, skuRow.availableQty - (skuRow.reservedQty || 0));
      const invStart = (await reqJson(baseUrl, '/api/admin/inventory', { headers: h })).json.inventory['AKSM-500G-01'];
      const freeStart = freeBefore(invStart);
      const bootStart = (await reqJson(baseUrl, '/api/admin/bootstrap', { headers: h })).json.metrics;

      // Customer clicks "Confirm Order on WhatsApp" -> logged for verification, ZERO sales/stock impact yet!
      const waClick1 = await reqJson(baseUrl, '/api/orders', {
        method: 'POST',
        body: {
          customer: { name: 'Karan Negi', phone: '9876599881', address: 'Sanjauli Top', city: 'Shimla, HP', pincode: '171006' },
          items: [{ sku: 'AKSM-500G-01', quantity: 1 }],
          paymentMethod: 'COD'
        }
      });
      assert.strictEqual(waClick1.status, 201);
      assert.strictEqual(waClick1.json.order.reachedStage, 'confirm_whatsapp_clicked');
      assert.strictEqual(waClick1.json.order.verificationState, 'needs_verification');

      const oid1 = waClick1.json.order.orderId;
      let bootMid = (await reqJson(baseUrl, '/api/admin/bootstrap', { headers: h })).json;
      assert.strictEqual(bootMid.inventory['AKSM-500G-01'].reservedQty, invStart.reservedQty);
      assert.strictEqual(bootMid.metrics.acceptedUnitsSold, bootStart.acceptedUnitsSold);

      // Admin picks "Wait karo abhi" (default 2 days follow-up)
      const waitRes = await reqJson(baseUrl, `/api/admin/orders/${oid1}/verify-buy`, {
        method: 'POST',
        headers: h,
        body: { decision: 'wait', followUpDays: 2, notes: 'Customer checking quantity, ask in 2 days' }
      });
      assert.strictEqual(waitRes.status, 200);
      assert.strictEqual(waitRes.json.order.orderStatus, 'waiting_followup');
      assert.strictEqual(waitRes.json.order.followUpDays, 2);
      assert.strictEqual(waitRes.json.order.followUpCount, 1);

      let bootWait = (await reqJson(baseUrl, '/api/admin/bootstrap', { headers: h })).json;
      assert.strictEqual(bootWait.metrics.waitingNotDueCount, 1);
      assert.strictEqual(bootWait.metrics.dueFollowUpCount, 0);
      assert.strictEqual(bootWait.metrics.acceptedUnitsSold, bootStart.acceptedUnitsSold);

      // Re-ask check when 2-day timer becomes due (past timestamp)
      const pastDueRes = await reqJson(baseUrl, `/api/admin/orders/${oid1}/verify-buy`, {
        method: 'POST',
        headers: h,
        body: { decision: 'wait', followUpAt: new Date(Date.now() - 60000).toISOString(), notes: '2 days elapsed — re-ask due' }
      });
      assert.strictEqual(pastDueRes.status, 200);
      let bootDue = (await reqJson(baseUrl, '/api/admin/bootstrap', { headers: h })).json;
      assert.strictEqual(bootDue.metrics.dueFollowUpCount, 1);
      assert.strictEqual(bootDue.metrics.waitingNotDueCount, 0);

      // Public API & snapshot MUST NOT expose private UPI VPA
      const pubSafety = await reqJson(baseUrl, '/api/products');
      assert.strictEqual(pubSafety.json.settings.upi_id, undefined);

      // Admin picks "Yes — Accept Buy", updates qty from 1 -> 2 & custom agreedTotal -> gets WhatsApp confirm template
      const acceptRes = await reqJson(baseUrl, `/api/admin/orders/${oid1}/verify-buy`, {
        method: 'POST',
        headers: h,
        body: {
          decision: 'accept',
          items: [{ sku: 'AKSM-500G-01', quantity: 2 }],
          paymentMethod: 'ONLINE',
          agreedTotal: 1050,
          notes: 'Customer bought 2 packs for Rs 1050 on WhatsApp'
        }
      });
      assert.strictEqual(acceptRes.status, 200);
      assert.strictEqual(acceptRes.json.order.orderStatus, 'confirmed');
      assert.strictEqual(acceptRes.json.order.verificationState, 'accepted_buy');
      assert.strictEqual(acceptRes.json.order.grandTotal, 1050);
      assert.ok(acceptRes.json.whatsapp && acceptRes.json.whatsapp.confirm.message.includes('Namaste Karan Negi'));
      assert.ok(acceptRes.json.whatsapp.confirm.message.includes('1,050'));
      assert.ok(acceptRes.json.whatsapp.confirm.message.includes('sharing payment'));
      assert.ok(acceptRes.json.whatsapp.confirm.waUrl.startsWith('https://api.whatsapp.com/send?phone=919876599881'));

      // Log Stage 1 WhatsApp Sent & Dispatch with Courier + Auto Tracking Link -> Stage 2 WhatsApp Dispatch
      const waLog1 = await reqJson(baseUrl, `/api/admin/orders/${oid1}/whatsapp-sent`, {
        method: 'POST',
        headers: h,
        body: { stage: 'confirm' }
      });
      assert.strictEqual(waLog1.status, 200);
      assert.ok(waLog1.json.order.whatsappComms.confirmSentAt);

      const bootAfterAccept = (await reqJson(baseUrl, '/api/admin/bootstrap', { headers: h })).json;
      assert.strictEqual(freeBefore(bootAfterAccept.inventory['AKSM-500G-01']), freeStart - 2);
      assert.strictEqual(bootAfterAccept.metrics.acceptedUnitsSold, bootStart.acceptedUnitsSold + 2);
      const skuRow = bootAfterAccept.metrics.skuStockAndSales.find(r => r.sku === 'AKSM-500G-01');
      assert.strictEqual(skuRow.acceptedSoldQty, 2);
      assert.strictEqual(skuRow.remainingFreeQty, freeStart - 2);

      // Dispatch stage generates real Delhivery tracking URL + WhatsApp dispatch message
      const dispWaRes = await reqJson(baseUrl, `/api/admin/orders/${oid1}/dispatch`, {
        method: 'POST',
        headers: h,
        body: { courier: 'Delhivery', trackingId: 'DL9948271', expectedDeliveryText: 'In 2–4 days (Express)', idempotencyKey: 'wa-disp-01' }
      });
      assert.strictEqual(dispWaRes.status, 200);
      assert.strictEqual(dispWaRes.json.order.shippingDetails.trackingUrl, 'https://www.delhivery.com/track/package/DL9948271');
      assert.ok(dispWaRes.json.whatsapp.dispatch.message.includes('DISPATCHED'));
      assert.ok(dispWaRes.json.whatsapp.dispatch.message.includes('https://www.delhivery.com/track/package/DL9948271'));
      assert.ok(dispWaRes.json.whatsapp.dispatch.message.includes('In 2–4 days (Express)'));

      // Customer 2 clicks WhatsApp, Admin marks "Not Bought" -> ZERO stock / sales impact
      const waClick2 = await reqJson(baseUrl, '/api/orders', {
        method: 'POST',
        body: {
          customer: { name: 'Pooja Chauhan', phone: '9876599882', address: 'Chhota Shimla', city: 'Shimla, HP', pincode: '171002' },
          items: [{ sku: 'AKSM-500G-01', quantity: 1 }],
          paymentMethod: 'COD'
        }
      });
      const rejRes = await reqJson(baseUrl, `/api/admin/orders/${waClick2.json.order.orderId}/verify-buy`, {
        method: 'POST',
        headers: h,
        body: { decision: 'not_bought', reason: 'No reply on WhatsApp' }
      });
      assert.strictEqual(rejRes.status, 200);
      assert.strictEqual(rejRes.json.order.orderStatus, 'cancelled');
      assert.strictEqual(rejRes.json.order.verificationState, 'not_bought');

      const bootAfterRej = (await reqJson(baseUrl, '/api/admin/bootstrap', { headers: h })).json;
      assert.strictEqual(bootAfterRej.metrics.acceptedUnitsSold, bootStart.acceptedUnitsSold + 2);
      assert.strictEqual(freeBefore(bootAfterRej.inventory['AKSM-500G-01']), freeStart - 2);
    });

  } finally {
    server.close();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`\n📊 Suite Summary: ${passed}/${results.length} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runSuite();
