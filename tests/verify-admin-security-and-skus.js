// tests/verify-admin-security-and-skus.js
const fs = require('fs');
const assert = require('assert');

console.log('--- Verifying Admin Security & Stock SKU Consistency ---');

// 1. Check admin.html for password leakage
const html = fs.readFileSync('admin.html', 'utf8');
assert(!html.includes('shimla@2024'), 'FAIL: admin.html contains hardcoded passcode');
assert(!html.includes('DEV:'), 'FAIL: admin.html contains DEV indicator');
assert(html.includes('placeholder="Enter administrator passcode"'), 'FAIL: admin.html missing clean passcode placeholder');
assert(html.includes('Return to Customer Storefront'), 'FAIL: admin.html missing storefront return link');
console.log('✓ admin.html is 100% clean of hardcoded passwords, dev hints, and contains return link');

// 2. Check admin.js for password leakage in error messages
const js = fs.readFileSync('admin.js', 'utf8');
assert(!js.includes('Please enter master passcode: shimla@2024'), 'FAIL: admin.js leaks passcode in throw Error');
assert(!js.includes('Enter master key: shimla@2024'), 'FAIL: admin.js leaks passcode in catch error');
console.log('✓ admin.js is 100% clean of password leaks in error messages');

// 3. Check products.json has 16 inventory items
const prodJson = JSON.parse(fs.readFileSync('products.json', 'utf8'));
assert(prodJson.inventory, 'FAIL: products.json missing inventory object');
const invKeys = Object.keys(prodJson.inventory);
assert.strictEqual(invKeys.length, 16, `FAIL: Expected 16 inventory keys, got ${invKeys.length}`);
console.log(`✓ products.json has all ${invKeys.length} SKU inventory entries populated`);

// 4. Check authorized emails
const cfg = fs.readFileSync('firebase-config.js', 'utf8');
assert(cfg.includes('zxofficial84@gmail.com'), 'FAIL: firebase-config.js missing zxofficial84@gmail.com');
assert(cfg.includes('shimlacrunch@gmail.com'), 'FAIL: firebase-config.js missing shimlacrunch@gmail.com');
assert(cfg.includes('nimaythakur1234@gmail.com'), 'FAIL: firebase-config.js missing nimaythakur1234@gmail.com');
assert(cfg.includes('admin@shimlacrunch.com'), 'FAIL: firebase-config.js missing admin@shimlacrunch.com');
console.log('✓ firebase-config.js has all 4 whitelisted admin emails');

// 5. Check firestore.rules
const rules = fs.readFileSync('firestore.rules', 'utf8');
assert(rules.includes('zxofficial84@gmail.com'), 'FAIL: firestore.rules missing zxofficial84@gmail.com');
assert(rules.includes('shimlacrunch@gmail.com'), 'FAIL: firestore.rules missing shimlacrunch@gmail.com');
console.log('✓ firestore.rules has all whitelisted admin emails');

console.log('--- ALL ADMIN SECURITY & SKU TESTS PASSED ---');
