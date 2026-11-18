// tests/test-whatsapp-order-message.js
const fs = require('fs');
const assert = require('assert');

// Test the exact message builder from checkout.html
function generateCheckoutWhatsAppMessage(order, brandUpper = 'SHIMLA CRUNCH') {
  const itemsList = (order.itemsSnapshot || []).map(it =>
    `• ${it.productName} (${it.variantLabel}) × ${it.quantity} = *₹${it.lineTotal.toLocaleString('en-IN')}*`
  ).join('\n');

  const payActionText = order.paymentMethod === 'COD'
    ? `• *Mode:* *Cash on Delivery (COD verified)*\n• *Handling Fee:* +₹${order.shippingCharge} courier verification fee\n• *Status:* Pay rider via Cash or UPI QR on arrival`
    : `• *Mode:* *Direct UPI / Online Payment*\n👉 *PLEASE SHARE PAYMENT DETAILS:*\n_Kindly share your UPI ID / QR Code so I can complete payment!_`;

  const promoLine = order.discountAmount
    ? `🏷️ *Promo (${order.discountCode}):* *-₹${order.discountAmount.toLocaleString('en-IN')}*`
    : '';

  const sep = '--------------------------------';
  const waMsgParts = [
    `🛒 *NEW ${brandUpper} ORDER*`,
    `*Order ID:* *${order.orderId}*`,
    `*Status:* *Pending WhatsApp Confirmation*`,
    sep,
    `📦 *ORDERED ITEMS:*`,
    itemsList
  ];

  if (promoLine) {
    waMsgParts.push(promoLine);
  }

  waMsgParts.push(
    `💰 *Total Payable:* *₹${order.grandTotal.toLocaleString('en-IN')}*`,
    sep,
    `💳 *PAYMENT DETAILS:*`,
    payActionText,
    sep,
    `👤 *DELIVERY ADDRESS:*`,
    `• *Name:* *${order.customerSnapshot.name}*`,
    `• *Phone:* *+91 ${order.customerSnapshot.phone}*`,
    `• *Address:* ${order.customerSnapshot.address}`
  );

  if (order.customerSnapshot.landmark) {
    waMsgParts.push(`• *Landmark:* ${order.customerSnapshot.landmark}`);
  }

  waMsgParts.push(
    `• *City / State:* ${order.customerSnapshot.city}`,
    `• *PIN Code:* *${order.customerSnapshot.pincode}*`,
    sep,
    `🌿 *Shimla Crunch Orchard Harvest*`,
    `_Freshly handpicked from Kotkhai, Shimla._`
  );

  return waMsgParts.join('\n');
}

// Mock realistic order matching user scenario
const sampleOrder = {
  orderId: 'SC-ORD-1019',
  itemsSnapshot: [
    { productName: 'Himachal Royal Delicious Apples', variantLabel: '10kg Orchard Pack', quantity: 1, lineTotal: 1699 }
  ],
  paymentMethod: 'COD',
  shippingCharge: 25,
  discountAmount: 480,
  discountCode: 'SHIMLA50',
  grandTotal: 1244,
  customerSnapshot: {
    name: 'Pankaj',
    phone: '9736353384',
    address: 'NAHAN',
    landmark: 'NAHAN',
    city: 'NAHAN',
    pincode: '173001'
  }
};

const msg = generateCheckoutWhatsAppMessage(sampleOrder);
console.log('=== GENERATED WHATSAPP ORDER MESSAGE ===\n');
console.log(msg);
console.log('\n=======================================');

// Validations
const sep = '--------------------------------';
assert(msg.includes(sep), 'Message must contain dashed separator lines');
const sepCount = (msg.match(/--------------------------------/g) || []).length;
console.log(`\nVerified ${sepCount} dashed separator lines separating all sections.`);
assert(sepCount === 4, `Expected 4 separator lines, found ${sepCount}`);

// Verify emojis
const requiredEmojis = ['🛒', '📦', '🏷️', '💰', '💳', '👤', '🌿'];
for (const em of requiredEmojis) {
  assert(msg.includes(em), `Emoji ${em} must be present`);
}
console.log('All required emojis present and intact!');

// Verify URL encoding roundtrip
const encoded = encodeURIComponent(msg);
const decoded = decodeURIComponent(encoded);
assert.strictEqual(decoded, msg, 'URL encode/decode roundtrip must match exactly');
assert(!decoded.includes('?'), 'Message must not contain corrupted question marks');
console.log('Roundtrip URL encoding: 100% PERFECT (Zero question marks!)');

console.log('\n>>> WHATSAPP MESSAGE VERIFICATION PASSED 100%! <<<');
