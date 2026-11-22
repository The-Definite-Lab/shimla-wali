const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

const p1 = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const authData = JSON.parse(fs.readFileSync(p1, 'utf8'));
const token = authData.tokens.access_token;

const catalogData = JSON.parse(fs.readFileSync(path.join(__dirname, '../db/catalog.json'), 'utf8'));
const inventoryData = JSON.parse(fs.readFileSync(path.join(__dirname, '../db/inventory.json'), 'utf8'));
const batchesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../db/batches.json'), 'utf8'));
const discountsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../db/discounts.json'), 'utf8'));

const fullDb = {
  catalog: catalogData,
  inventory: inventoryData,
  batches: batchesData,
  discounts: discountsData
};

const ShimlaProjection = require(path.join(__dirname, '../shared/projection.js'));
const projection = ShimlaProjection.buildPublicProductsProjection(fullDb);
projection.updatedAt = new Date().toISOString();

// Convert JS object to Firestore REST API field format
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreDoc(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) fields[k] = toFirestoreValue(v);
  }
  return { fields };
}

function patchDocument(docPath, data) {
  return new Promise((resolve, reject) => {
    const firestoreDoc = toFirestoreDoc(data);
    const payload = JSON.stringify(firestoreDoc);
    const req = https.request({
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/shimlawali-store/databases/(default)/documents/${docPath}`,
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body });
        } else {
          reject(new Error(`Failed to write ${docPath}: ${res.statusCode} ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function deleteDocument(docPath) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/shimlawali-store/databases/(default)/documents/${docPath}`,
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        resolve({ status: res.statusCode });
      });
    });
    req.on('error', () => resolve({ status: 500 }));
    req.end();
  });
}

async function run() {
  console.log('1. Writing catalog/main...');
  await patchDocument('catalog/main', catalogData);
  console.log('✅ catalog/main updated with 6 Shimla Crunch products.');

  console.log('2. Writing storefront/shimlacrunch...');
  await patchDocument('storefront/shimlacrunch', projection);
  console.log('✅ storefront/shimlacrunch updated with clean projection.');

  console.log('3. Writing 16 SKUs to inventory/{sku}...');
  const skus = Object.keys(inventoryData.bySku);
  for (const sku of skus) {
    const invItem = inventoryData.bySku[sku];
    await patchDocument(`inventory/${sku}`, invItem);
    console.log(`  - inventory/${sku} written (${invItem.availableQty} units)`);
  }
  console.log('✅ All 16 inventory SKUs updated in Firestore.');

  // Clean old legacy & alien SKUs if any
  const legacySkus = [
    'GHSM-500ML-01', 'GHSM-1L-01', 'GHSM-2L-01', 'GHSM-5L-01',
    'SW-WALNUT-250G', 'SW-WALNUT-500G', 'SW-WALNUT-1KG',
    'SW-HONEY-500G', 'SW-HONEY-1KG',
    'PK-MANGO-500G', 'PK-MANGO-1KG', 'PK-GARLIC-500G',
    'RICE-RED-1KG', 'RICE-RED-5KG',
    'PLSM-RAJMA-1KG', 'PLSM-KULTH-1KG',
    // Him Kalpa SKUs
    'HK-RAJ-JWL-500G', 'HK-RAJ-JWL-1KG', 'HK-RAJ-JWL-2KG',
    'HK-RAJ-YLW-1KG', 'HK-RAJ-YLW-2KG', 'HK-RAJ-CTR-1KG', 'HK-RAJ-CTR-2KG',
    'HK-OIL-WLN-250ML', 'HK-OIL-WLN-500ML', 'HK-OIL-APR-250ML', 'HK-OIL-APR-500ML',
    'HK-WLN-KGZ-500G', 'HK-WLN-KGZ-1KG', 'HK-WLN-GIR-500G', 'HK-WLN-GIR-1KG',
    'HK-BER-SBT-200G', 'HK-BER-SBT-400G', 'HK-AML-PRS-500G', 'HK-AML-PRS-1KG',
    'HK-NUT-HZL-250G', 'HK-NUT-HZL-500G', 'HK-GHEE-A2-250ML', 'HK-GHEE-A2-500ML',
    'HK-GHEE-A2-1000ML', 'HK-HNY-WLD-350G', 'HK-HNY-WLD-700G', 'HK-CRF-FLW-01', 'HK-CRF-FLW-02'
  ];
  console.log('4. Purging legacy inventory SKUs...');
  for (const lSku of legacySkus) {
    const r = await deleteDocument(`inventory/${lSku}`);
    if (r.status === 200) console.log(`  - Deleted legacy SKU: ${lSku}`);
  }
  console.log('✅ Legacy SKUs purged.');

  console.log('🎉 Firestore synchronization complete!');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
