// tests/test-all-skus-checkout.js
const fs = require('fs');
const path = require('path');
const domain = require('../shared/domain');
const catalog = require('../products.json');

const sampleDb = {
  catalog: catalog,
  inventory: { bySku: {} },
  discounts: { discounts: [] }
};

const TEST_SKUS = [
  // Canonical SKUs
  'APRD-5KG-01', 'APRD-10KG-01', 'APRD-20KG-01',
  'APGL-5KG-01', 'APGL-10KG-01', 'APGL-20KG-01',
  'CRCH-100G-01', 'CRCH-300G-01', 'CRCH-500G-01',
  'AKSM-250G-01', 'AKSM-500G-01', 'AKSM-1KG-01',
  'HNSM-500G-01', 'HNSM-1KG-01',
  'DISC-STD-01', 'DISC-FAM-01',
  // Legacy / Storefront Aliases
  'SC-ROYAL-5KG', 'SC-ROYAL-10KG', 'SC-ROYAL-20KG',
  'SC-GALA-5KG', 'SC-GALA-10KG', 'SC-GALA-20KG',
  'SC-CRUNCH-100G', 'SC-CRUNCH-300G', 'SC-CRUNCH-500G',
  'SC-WAL-250G', 'SC-WAL-500G', 'SC-WAL-1KG',
  'SC-HNY-500G', 'SC-HNY-1KG',
  'SC-DISCOVERY-STD', 'SC-DISCOVERY-FAM'
];

let failed = 0;
console.log(`Testing all ${TEST_SKUS.length} SKUs against domain quote calculator...`);

for (const sku of TEST_SKUS) {
  try {
    const quote = domain.calculateCheckoutQuote(sampleDb, {
      items: [{ sku, quantity: 1 }],
      paymentMethod: 'ONLINE'
    });
    if (!quote || quote.grandTotal <= 0) {
      console.error(`❌ SKU ${sku} returned invalid quote:`, quote);
      failed++;
    } else {
      console.log(`✅ SKU ${sku.padEnd(18)} -> Matched! Price: ₹${quote.grandTotal}`);
    }
  } catch (e) {
    console.error(`❌ SKU ${sku} FAILED with error:`, e.message);
    failed++;
  }
}

if (failed === 0) {
  console.log(`\n🎉 SUCCESS: All ${TEST_SKUS.length} SKUs verified successfully with zero errors!`);
} else {
  console.error(`\n⚠️ ${failed} SKUs failed validation.`);
  process.exit(1);
}
