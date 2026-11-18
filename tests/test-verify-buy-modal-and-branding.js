// tests/test-verify-buy-modal-and-branding.js
const fs = require('fs');
const assert = require('assert');
const domain = require('../shared/domain');

console.log('--- Test 1: WhatsApp Admin Messages Formatting & Pure Branding ---');

const testOrder = {
  orderId: 'SC-ORD-1025',
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
      productName: 'Himachal Royal Delicious Apples',
      variantLabel: '10kg Orchard Pack',
      quantity: 1,
      lineTotal: 1699
    }
  ],
  shippingDetails: {
    courier: 'Delhivery',
    trackingId: 'DL9948271',
    expectedDeliveryText: 'In 2–4 days (Pan-India Express)'
  }
};

// Even if a legacy brandName is accidentally passed, domain MUST sanitize to Shimla Crunch
const wa = domain.buildWhatsAppMessagesForOrder(testOrder, 'Shimla Wali');

console.log('\n[1. CONFIRM MESSAGE]:\n' + wa.confirm.message);
console.log('\n[2. DISPATCH MESSAGE]:\n' + wa.dispatch.message);
console.log('\n[3. DELIVERED MESSAGE]:\n' + wa.delivered.message);

// Assertions on Messages
const stages = ['confirm', 'dispatch', 'delivered'];
for (const st of stages) {
  const m = wa[st].message;
  assert(m.includes('SHIMLA CRUNCH') || m.includes('Shimla Crunch'), `${st} must contain Shimla Crunch branding`);
  assert(!/shimla[\s_-]*wali/i.test(m), `${st} must NOT contain previous brand "Shimla Wali"`);
  assert(m.includes('--------------------------------'), `${st} must contain clean dashed separator lines`);
  assert(!m.includes('?'), `${st} must not contain corrupted question marks`);
}
console.log('\n✅ All admin WhatsApp messages verified: 100% Shimla Crunch, dashed separators, zero question marks!');

console.log('\n--- Test 2: Admin HTML & JS Verify-Buy Modal Structure ---');
const adminHtml = fs.readFileSync('admin.html', 'utf8');
const adminJs = fs.readFileSync('admin.js', 'utf8');

// Verify read-only summary card exists
assert(adminHtml.includes('id="vb-readonly-summary"'), 'Must have read-only summary card container');
assert(adminHtml.includes('id="vb-view-name"'), 'Must display customer name');
assert(adminHtml.includes('id="vb-view-phone"'), 'Must display customer phone');
assert(adminHtml.includes('id="vb-view-address"'), 'Must display customer address');
assert(adminHtml.includes('id="vb-view-items-list"'), 'Must display ordered items list');
assert(adminHtml.includes('id="vb-view-total"'), 'Must display total payable');

// Verify edit fields are wrapped in collapsible container
assert(adminHtml.includes('id="vb-edit-fields-wrap"'), 'Must have collapsible edit fields container');
assert(adminHtml.includes('style="display:none;'), 'Edit fields must be hidden by default');
assert(adminHtml.includes('id="vb-toggle-edit-btn"'), 'Must have toggle edit button');

// Verify admin.js functions
assert(adminJs.includes('function toggleVerifyBuyEdit'), 'admin.js must implement toggleVerifyBuyEdit');
assert(adminJs.includes('document.getElementById(\'vb-view-name\')'), 'openVerifyBuyModal must populate read-only summary');
assert(adminJs.includes('document.getElementById(\'vb-view-items-list\')'), 'openVerifyBuyModal must populate items list');

console.log('✅ Verify Buy Modal structure verified: Clean read-only summary by default with optional toggle!');
console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
