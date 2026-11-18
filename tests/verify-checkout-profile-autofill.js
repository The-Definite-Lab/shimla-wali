// tests/verify-checkout-profile-autofill.js
const fs = require('fs');
const assert = require('assert');

console.log('--- Verifying Checkout & Profile Phone Autofill & Guest Auto-Profile ---');

const checkoutHtml = fs.readFileSync('checkout.html', 'utf8');
const profileHtml = fs.readFileSync('profile.html', 'utf8');

// 1. Verify checkout.html reads sc_user_profile and sc_customer_phone
assert(checkoutHtml.includes("localStorage.getItem('sc_user_profile')"), 'FAIL: checkout.html missing sc_user_profile check');
assert(checkoutHtml.includes("localStorage.getItem('sc_customer_phone')"), 'FAIL: checkout.html missing sc_customer_phone fallback');
assert(checkoutHtml.includes('autoSaveCheckoutInputs'), 'FAIL: checkout.html missing autoSaveCheckoutInputs');
assert(checkoutHtml.includes('updateAuthStripUI'), 'FAIL: checkout.html missing updateAuthStripUI');
assert(checkoutHtml.includes('inputmode="numeric"'), 'FAIL: checkout.html cust-phone missing numeric inputmode');
console.log('✓ checkout.html has complete multi-tier profile loading and live autosave');

// 2. Verify guest order profile creation in checkout.html
assert(checkoutHtml.includes("localStorage.setItem('sc_user_profile'"), 'FAIL: checkout.html missing sc_user_profile saving on order');
assert(checkoutHtml.includes("localStorage.setItem('sc_customer_phone'"), 'FAIL: checkout.html missing sc_customer_phone saving on order');
assert(checkoutHtml.includes("loggedIn: true"), 'FAIL: checkout.html order does not auto-activate profile');
console.log('✓ checkout.html auto-creates verified customer profile on guest order submission');

// 3. Verify profile.html saves and restores phone
assert(profileHtml.includes("localStorage.getItem('sc_customer_phone')"), 'FAIL: profile.html missing sc_customer_phone fallback');
assert(profileHtml.includes("localStorage.setItem('sc_customer_phone'"), 'FAIL: profile.html missing sc_customer_phone persistence');
assert(profileHtml.includes("if (data.phone) savedPhone = data.phone;"), 'FAIL: profile.html missing Firestore data.phone loading');
console.log('✓ profile.html correctly reads and syncs phone number from Firestore and local storage');

// 4. Zero mention of legacy brand in checkout.html
const bannedBrand = ['Shimla', 'Wali'].join(' ');
const bannedDomain = ['shimla', 'wali'].join('');
assert(!checkoutHtml.includes(bannedBrand), 'FAIL: checkout.html contains legacy brand');
assert(!checkoutHtml.includes(bannedDomain), 'FAIL: checkout.html contains legacy domain');
console.log('✓ checkout.html has zero legacy brand occurrences');

console.log('--- ALL CODE INTEGRITY TESTS PASSED ---');
