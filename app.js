
// Tribal Treasure - Cache Sanity Check
(function() {
  try {
    ['shimla_cached_catalog', 'shimla_store_settings', 'shimla_brand_name', 'shimla_cart', 'shimla_catalog_cache', 'tribal_treasure_by_tribalgirl_cached_catalog'].forEach(k => {
      try {
        const val = localStorage.getItem(k);
        if (val && (val.includes('GHSM') || val.includes('Shimla Wali') || val.includes('bilona') || val.includes('shimlawali') || val.includes('A2 Pahadi Cow') || val.includes('red-rice'))) {
          localStorage.removeItem(k);
        }
      } catch (e) {}
    });
    const v2 = localStorage.getItem('tribal_treasure_by_tribalgirl_cached_catalog_v2');
    if (v2 && (!v2.includes('apple-crunch') || v2.includes('bilona'))) {
      localStorage.removeItem('tribal_treasure_by_tribalgirl_cached_catalog_v2');
    }
  } catch(e) {}
})();
// Dynamic active discounts loader
window.__activeDiscountsPromise = (typeof fetch === 'function')
  ? fetch('/api/discounts').then(r => r.ok ? r.json() : null).then(data => {
      if (data && Array.isArray(data.discounts) && data.discounts.length > 0) {
        window.__activeDiscounts = data.discounts;
        const prim = data.discounts.find(d => d.type === 'percent') || data.discounts[0];
        if (prim) window.__primaryDiscount = prim;
      }
      return window.__activeDiscounts;
    }).catch(() => null)
  : Promise.resolve(null);

// Global Bag Drawer Helpers
window.openCart = function() {
  if (typeof window.syncCartAndRender === 'function') {
    window.syncCartAndRender();
  }
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-drawer-overlay');
  if (cartDrawer) cartDrawer.classList.add('active');
  if (cartOverlay) cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeCart = function() {
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-drawer-overlay');
  if (cartDrawer) cartDrawer.classList.remove('active');
  if (cartOverlay) cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
};

// Global Nav Drawer Helpers
window.openNavDrawer = function() {
  if (typeof window.renderSharedNavDrawer === 'function') {
    window.renderSharedNavDrawer();
  }
  if (typeof window.refreshDrawerAuthCard === 'function') {
    window.refreshDrawerAuthCard();
  }
  let navDrawer = document.getElementById('nav-drawer');
  let navOverlay = document.getElementById('nav-drawer-overlay');
  if (navDrawer) navDrawer.classList.add('active');
  if (navOverlay) navOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeNavDrawer = function() {
  const navDrawer = document.getElementById('nav-drawer');
  const navOverlay = document.getElementById('nav-drawer-overlay');
  if (navDrawer) navDrawer.classList.remove('active');
  if (navOverlay) navOverlay.classList.remove('active');
  document.body.style.overflow = '';
};

// 72-Hour Freshness Journey & Live Harvest Reserve Controllers
window.dispatchCatalog = {
  apples: {
    id: 'kinnauri-royal-apples',
    name: 'Kinnauri Royal Delicious Apples',
    image: './images/royal-delicious-box.webp',
    stockText: 'Only 14 crates left in today\'s harvest run',
    sizes: [
      { label: '3 kg', price: 999, mrp: 1199, discount: '17% OFF', sku: 'TT-ROYAL-3KG' },
      { label: '5 kg', price: 1399, mrp: 1699, discount: '18% OFF', sku: 'TT-ROYAL-5KG', default: true },
      { label: '10 kg', price: 2499, mrp: 2999, discount: '17% OFF', sku: 'TT-ROYAL-10KG' }
    ],
    trust: [
      { strong: '100%', text: 'Tree-Ripened' },
      { strong: 'Zero Wax', text: 'Edible Skin' },
      { strong: '0 Days', text: 'Cold Storage' }
    ]
  },
  walnuts: {
    id: 'kinnauri-walnuts',
    name: 'Kinnauri Paper-Shell Walnuts',
    image: './images/himachali-walnuts.webp',
    stockText: 'Only 19 kg left from high-altitude plucking',
    sizes: [
      { label: '500 g', price: 499, mrp: 699, discount: '28% OFF', sku: 'TTWN-500G-01' },
      { label: '1 kg', price: 899, mrp: 1099, discount: '18% OFF', sku: 'TTWN-1KG-01', default: true },
      { label: '2 kg', price: 1699, mrp: 2099, discount: '19% OFF', sku: 'TTWN-2KG-01' }
    ],
    trust: [
      { strong: 'Paper-Shell', text: 'Crack by Hand' },
      { strong: 'Mountain Air', text: 'Sun-Dried' },
      { strong: 'Natural Oils', text: 'High Omega-3' }
    ]
  },
  ghee: {
    id: 'tribal-desi-ghee',
    name: 'Pure Tribal Desi Ghee (Bilona)',
    image: './images/tribal-ghee.webp',
    stockText: 'Only 11 hand-churned jars available for tomorrow',
    sizes: [
      { label: '250 ml', price: 449, mrp: 549, discount: '18% OFF', sku: 'TTGH-250ML-01' },
      { label: '500 ml', price: 849, mrp: 999, discount: '15% OFF', sku: 'TTGH-500ML-01', default: true },
      { label: '1 L', price: 1599, mrp: 1899, discount: '16% OFF', sku: 'TTGH-1000ML-01' }
    ],
    trust: [
      { strong: 'Vedic Bilona', text: 'Wooden Churned' },
      { strong: 'Pahadi Cow', text: 'Herb-Grazing Curd' },
      { strong: 'Danedar Gold', text: 'Zero Starch' }
    ]
  }
};

window.dispatchFlowState = {
  currentProduct: 'apples',
  currentSize: '5 kg',
  currentPrice: 1399,
  currentMrp: 1699,
  currentDiscount: '18% OFF',
  currentSku: 'TT-ROYAL-5KG'
};

window.switchFreshnessStage = function(stageNum) {
  const cards = document.querySelectorAll('.freshness-milestone-card');
  cards.forEach((c, idx) => {
    if (idx + 1 === Number(stageNum)) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
};

window.renderPackSizePills = function(prodKey) {
  const prod = window.dispatchCatalog[prodKey];
  if (!prod) return;
  const container = document.getElementById('pack-size-options');
  if (!container) return;

  container.innerHTML = prod.sizes.map(s => {
    const isActive = s.label === window.dispatchFlowState.currentSize;
    return `
      <button type="button" class="pack-size-pill ${isActive ? 'active' : ''}" 
        data-size="${s.label}" 
        data-price="${s.price}"
        data-mrp="${s.mrp}"
        data-discount="${s.discount}"
        data-sku="${s.sku}"
        onclick="window.selectPackSize(this, '${s.label}', ${s.price}, ${s.mrp}, '${s.discount}', '${s.sku}')">
        ${isActive ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
        <span>${s.label}</span>
      </button>
    `;
  }).join('');
};

window.updatePriceBanner = function() {
  const priceEl = document.getElementById('h-disp-price');
  const mrpEl = document.getElementById('h-disp-mrp');
  const saveEl = document.getElementById('h-disp-save');
  const stockEl = document.getElementById('h-disp-stock-text');
  const ctaTextEl = document.getElementById('dispatch-cta-text');

  const p = window.dispatchFlowState.currentPrice;
  const m = window.dispatchFlowState.currentMrp;
  const d = window.dispatchFlowState.currentDiscount;
  const saveAmount = m - p;
  const prod = window.dispatchCatalog[window.dispatchFlowState.currentProduct];

  if (priceEl) priceEl.textContent = '₹' + p.toLocaleString('en-IN');
  if (mrpEl) mrpEl.textContent = '₹' + m.toLocaleString('en-IN');
  if (saveEl) saveEl.textContent = 'Save ₹' + saveAmount + ' (' + d + ')';
  if (stockEl && prod) stockEl.textContent = prod.stockText;
  if (ctaTextEl) {
    ctaTextEl.textContent = 'Reserve Fresh Harvest • ₹' + p.toLocaleString('en-IN') + ' (Dispatches Tomorrow)';
  }
};

window.selectHarvestProduct = function(prodKey) {
  const prod = window.dispatchCatalog[prodKey];
  if (!prod) return;

  window.dispatchFlowState.currentProduct = prodKey;
  
  // Highlight product card
  ['apples', 'walnuts', 'ghee'].forEach(k => {
    const card = document.getElementById('h-prod-' + k);
    if (card) {
      if (k === prodKey) {
        card.classList.add('active');
        card.setAttribute('aria-checked', 'true');
      } else {
        card.classList.remove('active');
        card.setAttribute('aria-checked', 'false');
      }
    }
  });

  // Set default size for chosen product
  const defSize = prod.sizes.find(s => s.default) || prod.sizes[0];
  window.dispatchFlowState.currentSize = defSize.label;
  window.dispatchFlowState.currentPrice = defSize.price;
  window.dispatchFlowState.currentMrp = defSize.mrp;
  window.dispatchFlowState.currentDiscount = defSize.discount;
  window.dispatchFlowState.currentSku = defSize.sku;

  // Render pills
  window.renderPackSizePills(prodKey);

  // Update Trust Strip highlights based on selected product
  const trustStrip = document.getElementById('harvest-trust-items');
  if (trustStrip) {
    trustStrip.innerHTML = prod.trust.map(t => `
      <div class="ht-item">
        <div class="ht-icon-circle">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <span class="ht-text"><strong>${t.strong}</strong><br class="ht-br"> ${t.text}</span>
      </div>
    `).join('');
  }

  window.updatePriceBanner();
};

window.selectPackSize = function(btnEl, size, price, mrp, discount, sku) {
  window.dispatchFlowState.currentSize = size;
  if (price) window.dispatchFlowState.currentPrice = Number(price);
  if (mrp) window.dispatchFlowState.currentMrp = Number(mrp);
  if (discount) window.dispatchFlowState.currentDiscount = discount;
  if (sku) window.dispatchFlowState.currentSku = sku;

  const parent = btnEl.parentElement;
  if (parent) {
    parent.querySelectorAll('.pack-size-pill').forEach(b => {
      b.classList.remove('active');
      const checkSvg = b.querySelector('svg');
      if (checkSvg) checkSvg.remove();
    });
    btnEl.classList.add('active');
    btnEl.insertAdjacentHTML('afterbegin', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>');
  }

  window.updatePriceBanner();
};

// High-Converting Direct Reserve & Add to Bag
window.handleDispatchCta = function() {
  const prodKey = window.dispatchFlowState.currentProduct || 'apples';
  const prod = window.dispatchCatalog[prodKey];
  if (!prod) return;

  const item = {
    id: prod.id,
    productId: prod.id,
    sku: window.dispatchFlowState.currentSku || '',
    name: prod.name,
    size: window.dispatchFlowState.currentSize,
    price: window.dispatchFlowState.currentPrice,
    image: prod.image,
    variety: ''
  };

  const btn = document.getElementById('dispatch-cta-btn');
  const ctaText = document.getElementById('dispatch-cta-text');
  const originalText = ctaText ? ctaText.textContent : 'Reserve Fresh Harvest';

  if (ctaText) {
    ctaText.textContent = '✓ Added to Bag! Opening...';
  }
  if (btn) {
    btn.style.background = '#0F2B1D';
  }

  // Trigger add to cart
  if (typeof window.addToCart === 'function') {
    window.addToCart(item, 1);
  } else {
    try {
      let cart = JSON.parse(localStorage.getItem('shimla_cart') || '[]');
      const idx = cart.findIndex(i => i.id === item.id && i.size === item.size);
      if (idx > -1) {
        cart[idx].quantity = (Number(cart[idx].quantity) || 1) + 1;
      } else {
        cart.push({ ...item, quantity: 1 });
      }
      localStorage.setItem('shimla_cart', JSON.stringify(cart));
      if (typeof window.openCart === 'function') window.openCart();
    } catch(e) {}
  }

  setTimeout(() => {
    if (ctaText) ctaText.textContent = originalText;
    if (btn) btn.style.background = '';
  }, 2200);
};

// Legacy compatibility shim for any old inline call
window.switchZcStep = function(stepNum) {
  window.switchFreshnessStage(stepNum);
};

// Auto-initialize freshness flow on page load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof window.selectHarvestProduct === 'function') {
        window.selectHarvestProduct('apples');
      }
    });
  } else {
    setTimeout(() => {
      if (typeof window.selectHarvestProduct === 'function') {
        window.selectHarvestProduct('apples');
      }
    }, 50);
  }
}

// Global Theme & Language Controllers
window.setTheme = function(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-theme', isDark);
  try { localStorage.setItem('shimla-theme', isDark ? 'dark' : 'light'); } catch (e) {}
  const dayBtn = document.getElementById('theme-day');
  const nightBtn = document.getElementById('theme-night');
  if (dayBtn) dayBtn.classList.toggle('active', !isDark);
  if (nightBtn) nightBtn.classList.toggle('active', isDark);
};

window.setLanguage = function(lang) {
  const isHi = lang === 'hi';
  document.documentElement.lang = isHi ? 'hi' : 'en';
  try { localStorage.setItem('shimla-lang', isHi ? 'hi' : 'en'); } catch (e) {}
  document.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = isHi ? (el.dataset.hi || el.dataset.en) : el.dataset.en;
  });
  const btnEn = document.getElementById('lang-en');
  const btnHi = document.getElementById('lang-hi');
  if (btnEn) btnEn.classList.toggle('active', !isHi);
  if (btnHi) btnHi.classList.toggle('active', isHi);
};

window.escapeHtml = function(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

window.__storefrontCatalogPromise = null;
window.__storefrontListeners = [];
window.onStorefrontUpdate = function(fn) {
  if (typeof fn === 'function') window.__storefrontListeners.push(fn);
};

window.loadStorefrontCatalog = function() {
  if (!window.__storefrontCatalogPromise) {
    window.__storefrontCatalogPromise = fetch('/api/products', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('api error'))))
      .catch(() => fetch('products.json').then(r => r.json()))
      .then(data => {
        if (data && Array.isArray(data.discounts) && data.discounts.length > 0) {
          window.__activeDiscounts = data.discounts;
          const prim = data.discounts.find(d => d.type === 'percent') || data.discounts[0];
          if (prim) window.__primaryDiscount = prim;
        }
        return data;
      });

    if (window.shimlaFirebaseBridge && window.shimlaFirebaseBridge.isEnabled()) {
      window.shimlaFirebaseBridge.subscribeStorefront(fresh => {
        window.__storefrontCatalogPromise = Promise.resolve(fresh);
        window.applyStorefrontContent(fresh);
        window.__storefrontListeners.forEach(cb => {
          try { cb(fresh); } catch {}
        });
      });
    }
  }
  return window.__storefrontCatalogPromise;
};

function renderEmbeddedVideoHtml(rawUrl) {
  const esc = window.escapeHtml;
  const u = String(rawUrl || '').trim();
  if (!u) return '';
  const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/i);
  if (ytMatch) {
    const id = encodeURIComponent(ytMatch[1]);
    return `<iframe src="https://www.youtube.com/embed/${id}?rel=0" style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px;" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }
  return `<video src="${esc(u)}" controls playsinline preload="metadata" style="width:100%;border-radius:12px;max-height:360px;background:#0f172a;object-fit:cover;"></video>`;
}

window.renderCategoryStories = function(products) {
  const track = document.querySelector('.category-stories-track');
  if (!track || !Array.isArray(products)) return;
  const esc = window.escapeHtml;
  const visible = products.filter(p => p.visible !== false);
  const allCard = `
    <div class="category-story-item active" onclick="location.href='shop.html'">
      <div class="category-story-ring">
        <div class="category-story-img-wrap">
          <img src="./images/shimla-wali-trio.webp" alt="All Harvest" />
        </div>
      </div>
      <span class="category-story-label">All Harvest</span>
    </div>`;
  const prodCards = visible.map(p => {
    const shortTitle = (p.title || '').replace(/\(.*?\)/g, '').split(' ').slice(0, 2).join(' ');
    const target = p.link || `product.html?id=${encodeURIComponent(p.id)}`;
    return `
      <div class="category-story-item" onclick="location.href='${esc(target)}'">
        <div class="category-story-ring">
          <div class="category-story-img-wrap">
            <img src="${esc(p.image || '')}" alt="${esc(p.title || '')}" />
          </div>
        </div>
        <span class="category-story-label">${esc(shortTitle)}</span>
      </div>`;
  }).join('');
  track.innerHTML = allCard + prodCards;
};

window.applyStorefrontContent = function(data) {
  if (!data) return;
  const s = data.settings || {};
  const c = data.content || {};
  const m = data.media || {};
  const brandName = String(s.brand_name || 'Tribal Treasure').trim() || 'Tribal Treasure';
  window.__shimlaBrandName = brandName;
  window.__shimlaSettings = s;
  window.__shimlaContent = c;
  window.__shimlaMedia = m;
  window.__shimlaCodFee = Number.isFinite(Number(s.cod_fee)) ? Number(s.cod_fee) : 25;

  const isHindi = localStorage.getItem('shimla-lang') === 'hi';
  const applyBilingualEn = (el, val) => {
    if (!el || !val) return;
    el.dataset.en = val;
    if (!isHindi || !el.dataset.hi) el.textContent = val;
  };

  // Announcement bar
  if (c.announcement_bar) {
    document.querySelectorAll('.announcement-item span:last-child').forEach(el => {
      el.textContent = c.announcement_bar;
    });
  }

  // Hero / Catalog Headings
  if (c.hero_heading) {
    document.querySelectorAll('[data-cms-hero-heading], .archive-header-title').forEach(el => {
      applyBilingualEn(el, c.hero_heading);
    });
  }
  if (c.hero_description) {
    document.querySelectorAll('[data-cms-hero-desc], .archive-header-sub').forEach(el => {
      applyBilingualEn(el, c.hero_description);
    });
  }

  // Marquee items
  if (Array.isArray(c.marquee_items) && c.marquee_items.length > 0) {
    const track = document.querySelector('.luxury-marquee-track');
    if (track) {
      // Strictly exclude any Hindi/Devanagari text items
      const englishItems = c.marquee_items
        .map(rawTxt => String(rawTxt || '').trim())
        .filter(txt => txt && !/[\u0900-\u097F]/.test(txt));
      const sourceList = englishItems.length > 0 ? englishItems : [
        "FLAT 10% OFF ON ORDERS ABOVE ₹1,500 • USE CODE: TRIBAL10",
        "100% ARTISANAL & TREE-RIPENED",
        "FROM OUR HILLS TO YOUR HOME",
        "SHIMLA ROYAL DELICIOUS APPLES",
        "CRISP RED GALA APPLES",
        "100% DEHYDRATED APPLE CRUNCH CHIPS",
        "HIMACHALI KAGZI WALNUTS",
        "PURE RAW APPLE BLOSSOM HONEY",
        "PURE • LOCAL • NATURAL"
      ];
      const doubled = [...sourceList, ...sourceList];
      track.innerHTML = doubled
        .map(rawTxt => {
          const txt = String(rawTxt || '').trim();
          const isPromo = /20%|OFF|SHIMLA50|CODE:/i.test(txt);
          if (isPromo) {
            const cleanTxt = txt.replace(/^[✨🎁\s\uFFFD\u2666\u25C6♦]+/, '');
            return `<span class="marquee-pill-item promo-highlight"><span class="marquee-dot gold"></span> <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:2px;"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> ${window.escapeHtml(cleanTxt)}</span>`;
          }
          return `<span class="marquee-pill-item"><span class="marquee-dot"></span> ${window.escapeHtml(txt)}</span>`;
        })
        .join('');
    }
  }

  // Dynamic phone, WhatsApp, Support Email & Instagram links
  const waNum = String(s.whatsapp_number || '919800000000').replace(/\D/g, '') || '919800000000';
  window.__shimlaWhatsAppNumber = waNum;
  if (s.phone) {
    document.querySelectorAll('a[href^="tel:"]').forEach(a => {
      a.href = 'tel:' + s.phone.replace(/\s+/g, '');
      const span = a.querySelector('span');
      if (span) span.textContent = span.textContent.startsWith('Call:') ? `Call: ${s.phone}` : s.phone;
    });
    document.querySelectorAll('[data-phone-text]').forEach(el => { el.textContent = s.phone; });
  }
  if (waNum) {
    document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
      try {
        const u = new URL(a.href);
        const q = u.search || '';
        a.href = `https://wa.me/${waNum}${q}`;
        if (a.hasAttribute('data-wa-phone-text')) a.textContent = s.phone || `+${waNum}`;
      } catch {}
    });
  }
  if (s.instagram || s.instagram_handle) {
    const handle = s.instagram_handle || '@shimla_wali08';
    document.querySelectorAll('a[href*="instagram.com"]').forEach(a => {
      if (s.instagram) a.href = s.instagram;
      if (handle) {
        const sp = a.querySelector('span');
        if (sp && sp.textContent.includes('@')) {
          sp.textContent = sp.textContent.includes('Instagram:') ? `Instagram: ${handle}` : handle;
        } else if (!sp && a.textContent.includes('@')) {
          a.textContent = a.textContent.replace(/@[A-Za-z0-9_.]+/g, handle);
        }
      }
    });
  }
  if (s.support_email) {
    document.querySelectorAll('[data-support-email]').forEach(el => {
      if (el.tagName === 'A') el.href = `mailto:${s.support_email}`;
      el.textContent = s.support_email;
    });
  }

  // Dynamic COD fee labels across PDP & Checkout
  document.querySelectorAll('[data-cod-fee-pill]').forEach(el => {
    el.textContent = window.__shimlaCodFee > 0 ? `+₹${window.__shimlaCodFee} COD Fee` : 'FREE COD';
  });
  document.querySelectorAll('[data-cod-fee-short]').forEach(el => {
    el.textContent = window.__shimlaCodFee > 0 ? `₹${window.__shimlaCodFee} fee • Pay at doorstep` : 'Zero fee • Pay at doorstep';
  });

  // Editable About/Story/Footer/Brand text & Section Toggles (preserving EN/HI compatibility)
  const himTitle = document.querySelector('.himalayan-title');
  if (himTitle && c.about_heading) applyBilingualEn(himTitle, c.about_heading);
  const himDesc = document.querySelector('.himalayan-desc');
  if (himDesc && c.about_body) applyBilingualEn(himDesc, c.about_body);

  if (c.footer_note || s.tagline) {
    document.querySelectorAll('.footer-brand-tagline').forEach(el => {
      el.textContent = c.footer_note || s.tagline;
    });
  }

  // Sync Business / Website Brand Name globally across DOM, Drawer, Copyright & Title
  document.querySelectorAll('.brand-title, .footer-brand-name, .drawer-brand-title, [data-brand-text]').forEach(el => {
    el.textContent = brandName;
  });
  const replaceBrand = (txt) => String(txt || '').replace(/Shimla Wali/gi, m => (m === m.toUpperCase() ? brandName.toUpperCase() : brandName));
  document.querySelectorAll('[data-brand-copy]').forEach(el => {
    if (!el.dataset.brandTpl) el.dataset.brandTpl = el.textContent;
    const replaced = replaceBrand(el.dataset.brandTpl);
    if (el.dataset.en !== undefined) {
      if (!el.dataset.brandEnTpl) el.dataset.brandEnTpl = el.dataset.en;
      el.dataset.en = replaceBrand(el.dataset.brandEnTpl);
    }
    if (!isHindi || !el.dataset.hi) el.textContent = replaced;
  });
  if (!document.documentElement.dataset.titleTpl) {
    document.documentElement.dataset.titleTpl = document.title;
  }
  document.title = replaceBrand(document.documentElement.dataset.titleTpl);

  // Story Banner Image (matches Indigenous Pahadi Cows tile #3, or first fallback)
  if (m.himalayan_image) {
    const tiles = document.querySelectorAll('.himalayan-mosaic .h-mosaic-item img');
    const targetImg = tiles.length >= 3 ? tiles[2] : tiles[0];
    if (targetImg) targetImg.src = m.himalayan_image;
  }

  // Makers Video & Transparency Stats / Verify Details
  const hhEl = document.getElementById('stat-households');
  if (hhEl && s.maker_households) hhEl.textContent = s.maker_households;
  const distEl = document.getElementById('stat-districts');
  if (distEl && s.maker_districts) distEl.textContent = s.maker_districts;
  const methodEl = document.getElementById('verify-maker-method');
  if (methodEl && s.maker_method) methodEl.textContent = s.maker_method;
  const noteEl = document.getElementById('verify-purity-note');
  if (noteEl && s.verify_page_note) noteEl.textContent = s.verify_page_note;

  const makersSlot = document.getElementById('makers-video-slot');
  if (makersSlot) {
    if (m.makers_video) {
      makersSlot.innerHTML = renderEmbeddedVideoHtml(m.makers_video);
      const wrap = document.getElementById('makers-showcase-wrap');
      if (wrap) wrap.style.display = 'block';
    } else {
      makersSlot.innerHTML = '';
    }
  }

  // Dynamic Category Story Circles + Section visibility toggles
  if (Array.isArray(data.products)) {
    window.renderCategoryStories(data.products);
  }
  if (c.sections) {
    const shopSec = document.getElementById('shop-collection');
    if (shopSec) shopSec.style.display = c.sections.featured_products === false ? 'none' : '';
    const storySec = document.querySelector('.himalayan-section');
    if (storySec) storySec.style.display = c.sections.our_story === false ? 'none' : '';
    const cmpSec = document.querySelector('.comparison-section');
    if (cmpSec) cmpSec.style.display = c.sections.customer_reviews === false ? 'none' : '';
  }

  // Optional GA4 Measurement ID injection (only real user-configured ID)
  if (s.ga4_measurement_id && /^G-[A-Z0-9]+$/i.test(s.ga4_measurement_id) && !window.__ga4Injected) {
    window.__ga4Injected = true;
    const gs = document.createElement('script');
    gs.async = true;
    gs.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(s.ga4_measurement_id)}`;
    document.head.appendChild(gs);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', s.ga4_measurement_id);
  }
};

// Shared Natural Status Pill & Carousel Live Prep Helpers
window.getProductStatusPill = function(p) {
  if (p && (p.inStock === false || p.status === 'out_of_stock')) {
    return { label: 'Out of Stock', tone: 'pill-red', liveNote: 'Currently Sold Out • Restocking Soon' };
  }
  const TONE_MAP = {
    fresh_dispatched: { tone: 'pill-green',  fallback: 'Fresh Churned',   live: 'Fresh Bilona • Few Left' },
    fresh_listed:     { tone: 'pill-green',  fallback: 'Fresh Harvest',   live: 'Fresh Harvest • Now Live' },
    limited_stock:    { tone: 'pill-red',    fallback: 'Low Stock',       live: 'Small Lot • Few Jars Left' },
    upcoming:         { tone: 'pill-orange', fallback: 'Tree Picked',     live: 'Orchard Harvest • Picking Fresh' },
    always_available: { tone: 'pill-gold',   fallback: 'Small Lot',       live: 'Handcrafted • Limited Stock' }
  };
  const cfg = TONE_MAP[p && p.tag] || null;
  let label = (p && p.pillText && p.pillText.trim()) ? p.pillText.trim() : (cfg ? cfg.fallback : '');
  if (p && p.tag === 'upcoming' && p.upcomingDate && !(p.pillText && p.pillText.trim())) {
    const days = Math.ceil((new Date(p.upcomingDate) - new Date()) / 86400000);
    label = days > 0 ? `Harvest in ${days}d` : 'Plucked Fresh';
  }
  let liveNote = (p && p.carouselNote && p.carouselNote.trim()) ? p.carouselNote.trim() : (cfg ? cfg.live : '');
  if (p && p.tag === 'upcoming' && p.upcomingDate && !(p.carouselNote && p.carouselNote.trim())) {
    const days = Math.ceil((new Date(p.upcomingDate) - new Date()) / 86400000);
    if (days > 0) liveNote = `Orchard Picking • Ready in ${days}d`;
  }
  return {
    label,
    tone: cfg ? cfg.tone : 'pill-gold',
    liveNote
  };
};

window.buildProductCardHTML = function(p) {
  const esc = window.escapeHtml;
  const priceNum = Number(p.price) || 0;
  const mrpNum = Number(p.mrp) || 0;
  const hasDiscount = mrpNum > priceNum;
  const discountPercent = hasDiscount ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;
  const cleanTitle = (p.title || '').trim();
  const pill = window.getProductStatusPill(p);
  const pillHTML = pill.label ? `<span class="m-black-pill ${esc(pill.tone)}">${esc(pill.label)}</span>` : '';
  const targetLink = p.link || `product.html?id=${encodeURIComponent(p.id || '')}`;
  return `
    <div class="m-product-card" data-product-id="${esc(p.id || '')}" data-sku="${esc(p.sku || '')}" onclick="location.href='${esc(targetLink)}'">
      <div class="m-card-image-wrap">
        <button class="m-wishlist-btn" aria-label="Add to wishlist" onclick="event.stopPropagation(); alert('Added to favorites!');">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        ${pillHTML}
        <img src="${esc(p.image || '')}" alt="${esc(p.title || '')}" class="m-card-img" />
      </div>
      <div class="m-card-details">
        <div class="m-card-meta-row">
          <div class="m-rating-tag">
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>${(Number(p.rating) || 4.9).toFixed(1)}</span>
            <span class="m-rating-count">(${Number(p.reviews) || 48})</span>
          </div>
        </div>
        <div class="m-card-title">${esc(cleanTitle)}</div>
        <div class="m-price-line">
          <span class="m-current-price">₹${priceNum.toLocaleString('en-IN')}</span>
          ${hasDiscount ? `<span class="m-orig-price">₹${mrpNum.toLocaleString('en-IN')}</span><span class="m-discount-tag">${discountPercent}% off</span>` : ''}
        </div>
      </div>
    </div>
  `;
};

window.recordOrderHistory = function(order) {
  try {
    const existing = JSON.parse(localStorage.getItem('shimla_order_history') || '[]');
    existing.unshift({
      refId: order.refId,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: order.items || [],
      total: Number(order.total) || 0,
      paymentMode: order.paymentMode || 'COD',
      addressSummary: order.addressSummary || ''
    });
    localStorage.setItem('shimla_order_history', JSON.stringify(existing.slice(0, 20)));
  } catch (e) {}
};

window.refreshDrawerAuthCard = function() {
  const card = document.getElementById('drawer-auth-card');
  if (!card) return;
  let profile = null;
  try { profile = JSON.parse(localStorage.getItem('shimla_user_profile') || 'null'); } catch (e) {}
  const isLoggedIn = profile && profile.loggedIn && (profile.name || profile.phone || profile.email || profile.uid);
  const iconEl = card.querySelector('.vip-user-icon');
  const titleEl = card.querySelector('.vip-title');
  const subEl = card.querySelector('.vip-sub');
  if (isLoggedIn) {
    const fullName = (profile.name || 'Customer').trim();
    if (iconEl) {
      iconEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    }
    if (titleEl) {
      const safeName = typeof window.escapeHtml === 'function' ? window.escapeHtml(fullName) : fullName;
      titleEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${safeName} <img src="./images/verified-green.webp" onerror="this.src='./images/verified-green.png'" alt="Verified" style="width:16px;height:16px;display:inline-block;vertical-align:middle;flex-shrink:0;" title="Verified Account" /></span>`;
      titleEl.removeAttribute('data-en');
      titleEl.removeAttribute('data-hi');
    }
    if (subEl) {
      let contact = profile.phone ? `+91 ${profile.phone}` : (profile.email || 'My Profile & Orders');
      subEl.textContent = `${contact} • View Account →`;
      subEl.removeAttribute('data-en');
      subEl.removeAttribute('data-hi');
    }
  } else {
    if (iconEl) {
      iconEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    }
    if (titleEl) {
      titleEl.setAttribute('data-en', 'Login / Sign In');
      titleEl.setAttribute('data-hi', 'लॉगिन / साइन इन');
    }
    if (subEl) {
      subEl.setAttribute('data-en', 'Phone Login • 1-Tap Buy & Orders →');
      subEl.setAttribute('data-hi', 'फ़ोन लॉगिन • 1-टैप ऑर्डर और ट्रैक →');
    }
    const lang = localStorage.getItem('shimla-lang') || 'en';
    window.setLanguage(lang);
  }
};

window.renderSharedNavDrawer = function() {
  let navOverlay = document.getElementById('nav-drawer-overlay');
  if (!navOverlay) {
    navOverlay = document.createElement('div');
    navOverlay.id = 'nav-drawer-overlay';
    navOverlay.className = 'nav-drawer-overlay';
    navOverlay.onclick = window.closeNavDrawer;
    document.body.appendChild(navOverlay);
  }
  let navDrawer = document.getElementById('nav-drawer');
  if (!navDrawer) {
    navDrawer = document.createElement('div');
    navDrawer.id = 'nav-drawer';
    navDrawer.className = 'nav-drawer-card';
    document.body.appendChild(navDrawer);
  }
  const currentTheme = localStorage.getItem('shimla-theme') || 'light';
  const currentLang = localStorage.getItem('shimla-lang') || 'en';

  navDrawer.innerHTML = `
    <div class="nav-drawer-header">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;border-radius:50%;padding:2px;background:linear-gradient(135deg,#B81D24,#D97706);display:flex;align-items:center;justify-content:center;">
          <img src="./images/logo.svg" onerror="this.src='./images/logo.png'" alt="Tribal Treasure" style="width:100%;height:100%;object-fit:contain;border-radius:50%;background:#fff;" />
        </div>
        <div>
          <div class="drawer-brand-title" style="font-size:1.15rem;font-weight:850;color:#143828;line-height:1.1;">TRIBAL TREASURE</div>
          <div style="font-size:0.62rem;font-weight:700;color:#B81D24;letter-spacing:0.06em;">BY TRIBALGIRL • KINNAUR 10,000 FT</div>
        </div>
      </div>
      <button id="nav-drawer-close" class="nav-round-btn drawer-close-btn" aria-label="Close Menu" onclick="window.closeNavDrawer()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <div id="drawer-auth-card" class="drawer-vip-card" onclick="location.href='profile.html'">
      <div class="vip-user-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      </div>
      <div class="vip-info">
        <div class="vip-title" data-en="Login / Sign In" data-hi="लॉगिन / साइन इन">Login / Sign In</div>
        <div class="vip-sub" data-en="Phone Login • 1-Tap Buy & Orders →" data-hi="फ़ोन लॉगिन • 1-टैप ऑर्डर और ट्रैक →">Phone Login • 1-Tap Buy & Orders →</div>
      </div>
    </div>

    <div class="drawer-section-label">KINNAUR HARVEST</div>
    <div class="drawer-nav-list">
      <a href="index.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span>
        <span class="d-item-text" data-en="Home & Fresh Drops" data-hi="होम व ताज़ा बैच">Home & Fresh Drops</span>
      </a>
      <a href="shop.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span>
        <span class="d-item-text" data-en="All Mountain Harvest" data-hi="सभी पहाड़ी उत्पाद">All Mountain Harvest</span>
      </a>
      <a href="product-apples.html" class="drawer-nav-item item-highlight">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg></span>
        <span class="d-item-text" data-en="Kinnauri Royal Apples" data-hi="किन्नौरी रॉयल सेब">Kinnauri Royal Apples</span>
        <span class="drawer-badge-purple" style="background:#B81D24;color:#fff;">LIVE</span>
      </a>
      <a href="product-royal-apples.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>
        <span class="d-item-text" data-en="Kinnauri Golden Apples" data-hi="किन्नौरी गोल्डन सेब">Kinnauri Golden Apples</span>
      </a>
      <a href="product-walnuts.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5"/></svg></span>
        <span class="d-item-text" data-en="Paper-Shell Kagzi Walnuts" data-hi="कागज़ी अखरोट">Paper-Shell Kagzi Walnuts</span>
      </a>
      <a href="product-ghee.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
        <span class="d-item-text" data-en="Pure Vedic Bilona Ghee" data-hi="बिलोना देसी घी">Pure Vedic Bilona Ghee</span>
      </a>
      <a href="product-honey.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
        <span class="d-item-text" data-en="Wild Blossom Honey" data-hi="जंगली शहद">Wild Blossom Honey</span>
      </a>
      <a href="about.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5"/></svg></span>
        <span class="d-item-text" data-en="Amita's Story (Tribal Girl)" data-hi="अमिता की कहानी">Amita's Story (Tribal Girl)</span>
      </a>
      <a href="verify.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
        <span class="d-item-text" data-en="Track Order & Purity" data-hi="ऑर्डर ट्रैक करें">Track Order & Purity</span>
      </a>
      <a href="contact.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></span>
        <span class="d-item-text" data-en="Help & WhatsApp Order" data-hi="सहायता व व्हाट्सएप">Help & WhatsApp Order</span>
      </a>
    </div>

    <div class="drawer-bottom-panel">
      <div class="drawer-util-row">
        <span class="drawer-util-label" data-en="Theme" data-hi="थीम">Theme</span>
        <div class="drawer-pill-group">
          <button type="button" class="theme-btn ${currentTheme !== 'dark' ? 'active' : ''}" id="theme-day" onclick="window.setTheme('light')">☀ Light</button>
          <button type="button" class="theme-btn ${currentTheme === 'dark' ? 'active' : ''}" id="theme-night" onclick="window.setTheme('dark')">🌙 Dark</button>
        </div>
      </div>
      <div class="drawer-util-row">
        <span class="drawer-util-label" data-en="Language" data-hi="भाषा">Language</span>
        <div class="drawer-pill-group">
          <button type="button" class="lang-btn ${currentLang !== 'hi' ? 'active' : ''}" id="lang-en" onclick="window.setLanguage('en')">EN</button>
          <button type="button" class="lang-btn ${currentLang === 'hi' ? 'active' : ''}" id="lang-hi" onclick="window.setLanguage('hi')">हिंदी</button>
        </div>
      </div>
    </div>
  `;

  window.refreshDrawerAuthCard();
};
/* ==========================================================================
   Shimla Wali - INTERACTIVE FUNCTIONALITY (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial State & Elements
  const state = {
    cart: JSON.parse(localStorage.getItem('shimla_cart') || '[]'),
    selectedProductVariant: {
      id: 'sc-royal-10kg',
      name: 'Shimla Royal Delicious Fresh Apples',
      size: '10 kg Family Carton',
      price: 1699,
      originalPrice: 2299,
      image: './images/royal-delicious-box.webp'
    },
    heroQty: 1
  };

  const productVariants = {
    '5kg': {
      id: 'sc-royal-5kg',
      name: 'Shimla Royal Delicious Fresh Apples',
      size: '5 kg Trial Box',
      price: 899,
      originalPrice: 1199,
      image: './images/royal-delicious-box.webp',
      discount: '25% OFF'
    },
    '10kg': {
      id: 'sc-royal-10kg',
      name: 'Shimla Royal Delicious Fresh Apples',
      size: '10 kg Family Carton',
      price: 1699,
      originalPrice: 2299,
      image: './images/royal-delicious-box.webp',
      discount: '26% OFF'
    },
    '20kg': {
      id: 'sc-royal-20kg',
      name: 'Shimla Royal Delicious Fresh Apples',
      size: '20 kg Orchard Master Box',
      price: 3199,
      originalPrice: 4299,
      image: './images/royal-delicious-box.webp',
      discount: '26% OFF'
    }
  };

  
  // Shared Nav Drawer, Theme & Language Initialization
  window.renderSharedNavDrawer();
  window.setTheme(localStorage.getItem('shimla-theme') || 'light');
  window.setLanguage(localStorage.getItem('shimla-lang') || 'en');

  const navDrawer = document.getElementById('nav-drawer');
  const navOverlay = document.getElementById('nav-drawer-overlay');
  const navToggles = document.querySelectorAll('.mobile-menu-toggle');

  navToggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.openNavDrawer();
    });
  });

  if (navOverlay) navOverlay.addEventListener('click', window.closeNavDrawer);

    // Close on click outside or on nav links
    document.querySelectorAll('.main-nav a').forEach(link => {
      link.addEventListener('click', () => {
        const mainNav = document.querySelector('.main-nav');
        if (mainNav) mainNav.classList.remove('active');
      });
    });

  // 3-Step Zero Confusion Tab Listeners (both click and touchend)
  for (let s = 1; s <= 3; s++) {
    const tabBtn = document.getElementById('zc-tab-' + s);
    if (tabBtn) {
      tabBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.switchZcStep(s);
      });
    }
  }

  // 3. Product Variant Selector (Hero Showcase)
  const sizeButtons = document.querySelectorAll('.size-btn');
  const priceCurrent = document.getElementById('product-price-val');
  const priceOriginal = document.getElementById('product-price-orig');
  const priceDiscount = document.getElementById('product-price-disc');
  const heroQtyVal = document.getElementById('hero-qty-val');
  const heroQtyMinus = document.getElementById('hero-qty-minus');
  const heroQtyPlus = document.getElementById('hero-qty-plus');

  if (sizeButtons.length > 0) {
    sizeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sizeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const size = btn.getAttribute('data-size');
        const variant = productVariants[size];
        if (variant) {
          state.selectedProductVariant = variant;
          if (priceCurrent) priceCurrent.textContent = '₹' + variant.price.toLocaleString('en-IN');
          if (priceOriginal) priceOriginal.textContent = '₹' + variant.originalPrice.toLocaleString('en-IN');
          if (priceDiscount) priceDiscount.textContent = variant.discount;
        }
      });
    });
  }

  // Hero Quantity Selector
  if (heroQtyMinus && heroQtyPlus && heroQtyVal) {
    heroQtyMinus.addEventListener('click', () => {
      if (state.heroQty > 1) {
        state.heroQty--;
        heroQtyVal.textContent = state.heroQty;
      }
    });
    heroQtyPlus.addEventListener('click', () => {
      state.heroQty++;
      heroQtyVal.textContent = state.heroQty;
    });
  }

  // 4. Cart State Management
  const cartBtn = document.getElementById('cart-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-drawer-overlay');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartCountBadges = document.querySelectorAll('.cart-count');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartSubtotalVal = document.getElementById('cart-subtotal-val');
  const checkoutBtn = document.getElementById('checkout-btn');

  function saveCart() {
    try {
      localStorage.setItem('tribal_cart', JSON.stringify(state.cart));
      localStorage.setItem('shimla_cart', JSON.stringify(state.cart));
    } catch (e) {}
    updateCartUI();
  }

  function updateCartUI() {
    try {
      const saved = localStorage.getItem('tribal_cart') || localStorage.getItem('shimla_cart');
      if (saved) {
        state.cart = JSON.parse(saved);
      }
    } catch (e) {}

    const totalCount = state.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartCountBadges.forEach(badge => {
      badge.textContent = totalCount;
    });

    // Remove any leftover static footer element from legacy layouts
    document.querySelectorAll('.cart-footer').forEach(el => el.remove());

    const bodyContainer = document.getElementById('cart-drawer-body') || document.getElementById('cart-items');
    if (!bodyContainer) return;

    if (!state.cart || state.cart.length === 0) {
      bodyContainer.innerHTML = `
        <div class="cart-empty-card">
          <div class="cart-empty-icon">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#B81D24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2C10.5 2 9.5 3 9.5 4.5C9.5 5.5 10.2 6.3 11 6.7C7.5 7.4 5 10.5 5 14.5C5 18.5 8 22 12 22C16 22 19 18.5 19 14.5C19 10.5 16.5 7.4 13 6.7C13.8 6.3 14.5 5.5 14.5 4.5C14.5 3 13.5 2 12 2Z"></path>
              <path d="M12 2v4"></path>
            </svg>
          </div>
          <h3 class="cart-empty-title">Your Harvest Bag is Empty</h3>
          <p class="cart-empty-sub">Hand-picked Kinnauri Royal Delicious Apples & Kagzi Walnuts grown at 10,000 ft are available for direct orchard dispatch.</p>
          <button type="button" class="btn-explore-harvest" onclick="window.closeCart(); location.href='shop.html'">
            EXPLORE KINNAUR HARVEST &rarr;
          </button>
          
          <div class="cart-empty-perks">
            <div class="perk-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Zero Wax Coating
            </div>
            <div class="perk-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 3l4 8 5-5 5 15H2L8 3z"></path></svg>
              10,000 Ft Elevation
            </div>
            <div class="perk-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
              Shockproof Foam Pack
            </div>
          </div>
        </div>
      `;
      return;
    }

    let subtotal = 0;
    state.cart.forEach(item => {
      const price = Number(item.price) || 1399;
      const qty = Number(item.quantity) || 1;
      subtotal += price * qty;
    });

    const promoCode = 'TRIBAL10';
    const promoPct = 10;
    const promoRate = 0.10;
    const promoMin = 1000;

    const storedPromo = (localStorage.getItem('tribal_promo_code') || localStorage.getItem('shimla_promo_code') || '').trim().toUpperCase();
    const isPromoEligible = subtotal >= promoMin;
    let isPromoApplied = false;
    let promoDiscount = 0;

    if (storedPromo === promoCode || storedPromo === 'SHIMLA50') {
      if (isPromoEligible) {
        isPromoApplied = true;
        promoDiscount = Math.round(subtotal * promoRate);
      } else {
        localStorage.removeItem('tribal_promo_code');
        localStorage.removeItem('shimla_promo_code');
      }
    }

    const finalGrandTotal = Math.max(0, subtotal - promoDiscount);

    // Build promo nudge / unlock banner
    let promoCardHtml = '';
    if (isPromoApplied) {
      promoCardHtml = `
        <div class="cart-promo-unlocked-card applied">
          <div class="promo-card-left">
            <span class="promo-badge-tag success">10% HARVEST DISCOUNT APPLIED</span>
            <div class="promo-card-heading">Coupon <strong>${promoCode}</strong> Active</div>
            <div class="promo-card-savings">You save <strong>₹${promoDiscount.toLocaleString('en-IN')}</strong> (Flat 10% OFF) on this bag!</div>
          </div>
          <button type="button" class="promo-card-btn remove" onclick="window.removeCartPromo()">
            Remove
          </button>
        </div>
      `;
    } else if (isPromoEligible) {
      promoCardHtml = `
        <div class="cart-promo-unlocked-card unlocked">
          <div class="promo-card-left">
            <span class="promo-badge-tag gold">10% OFF UNLOCKED!</span>
            <div class="promo-card-heading">Your order is above ₹${promoMin.toLocaleString('en-IN')}!</div>
            <div class="promo-card-savings">Apply code <strong>${promoCode}</strong> now to get 10% off and save ₹${Math.round(subtotal * promoRate).toLocaleString('en-IN')}.</div>
          </div>
          <button type="button" class="promo-card-btn apply-btn" onclick="window.applyCartPromo('${promoCode}')">
            Apply 10% OFF
          </button>
        </div>
      `;
    } else {
      const needed = promoMin - subtotal;
      const pct = Math.min(100, Math.round((subtotal / promoMin) * 100));
      promoCardHtml = `
        <div class="cart-promo-nudge-card">
          <div class="promo-nudge-top">
            <span class="promo-nudge-title"><strong>Flat 10% OFF</strong> above ₹${promoMin.toLocaleString('en-IN')}</span>
            <span class="promo-nudge-need">Add <strong>₹${needed.toLocaleString('en-IN')}</strong> more</span>
          </div>
          <div class="promo-nudge-progress-wrap">
            <div class="promo-nudge-progress-bar" style="width: ${pct}%;"></div>
          </div>
          <div class="promo-nudge-sub">Reach ₹${promoMin.toLocaleString('en-IN')} & apply coupon <strong>${promoCode}</strong> to get 10% off entire bag.</div>
        </div>
      `;
    }

    // Build WhatsApp 1-Click order URL
    const itemsSummary = state.cart.map(it => `${it.name || 'Harvest Pack'} (${it.size || 'Std'}) x ${it.quantity || 1}`).join(', ');
    const waText = encodeURIComponent(`Namaste Tribal Treasure, I would like to order from your website:\n• Items: ${itemsSummary}\n• Total Amount: ₹${finalGrandTotal.toLocaleString('en-IN')}\n\nPlease share payment details & delivery schedule.`);
    const waCartUrl = `https://wa.me/919800000000?text=${waText}`;

    bodyContainer.innerHTML = `
      <!-- Card 1: Items In Bag -->
      <div class="cart-section-card">
        <div class="cart-card-header">
          <span class="cart-items-count-text">${totalCount} ${totalCount === 1 ? 'ITEM' : 'ITEMS'} IN HARVEST BAG</span>
          <a href="shop.html" class="add-more-drops-link" onclick="window.closeCart();">+ ADD MORE HARVEST</a>
        </div>
        <div class="cart-card-divider"></div>
        
        <div class="cart-items-list">
          ${state.cart.map((item, index) => {
            const esc = window.escapeHtml;
            const itemPrice = Number(item.price) || 1399;
            const itemQty = Number(item.quantity) || 1;
            const itemTotal = itemPrice * itemQty;
            const itemImg = item.image || './images/royal-delicious-box.webp';
            const itemSize = item.size ? String(item.size).toUpperCase() : '5KG';
            return `
              <div class="atelier-cart-item">
                <div class="cart-item-thumb">
                  <img src="${esc(itemImg)}" alt="${esc(item.name || 'Kinnaur Harvest')}" onerror="this.src='./images/royal-delicious-box.webp'" />
                </div>
                <div class="atelier-item-details">
                  <h4 class="atelier-item-title">${esc((item.name || 'Kinnauri Royal Delicious Apples').toUpperCase())}</h4>
                  <div class="atelier-item-meta">10,000 FT KINNAUR &bull; PACK: ${esc(itemSize)}</div>
                  <div class="atelier-item-sub">Tree-Ripened &bull; Zero Chemical Wax</div>
                  <div class="atelier-item-price">₹${itemTotal.toLocaleString('en-IN')}</div>
                  
                  <div class="atelier-item-actions-row">
                    <div class="atelier-qty-pill">
                      <button type="button" class="qty-pill-btn" onclick="window.changeCartQty(${index}, -1)">−</button>
                      <span class="qty-pill-num">${itemQty}</span>
                      <button type="button" class="qty-pill-btn" onclick="window.changeCartQty(${index}, 1)">+</button>
                    </div>
                    <button type="button" class="save-for-later-btn" onclick="window.removeCartItem(${index})" aria-label="Remove item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 10% Off Promo Incentive / Unlock Card -->
      ${promoCardHtml}

      <!-- Card 2: Order Summary -->
      <div class="cart-section-card summary-card">
        <h3 class="summary-card-title">ORDER SUMMARY</h3>
        
        <div class="summary-line-row">
          <span>Items Subtotal (${totalCount} ${totalCount === 1 ? 'item' : 'items'})</span>
          <span style="font-weight: 700; color: #0f172a;">₹${subtotal.toLocaleString('en-IN')}</span>
        </div>
        
        ${isPromoApplied ? `
          <div class="summary-line-row promo-discount-line" style="color: #059669; font-weight: 700;">
            <span>Harvest Promo (${promoCode} &bull; 10% OFF)</span>
            <span>-₹${promoDiscount.toLocaleString('en-IN')}</span>
          </div>
        ` : ''}

        <div class="summary-line-row">
          <span>Packaging &amp; Transit</span>
          <span style="color:#15803D;font-weight:700;">Foam-Carton Protected</span>
        </div>

        <div class="summary-divider"></div>

        <div class="summary-total-row">
          <span class="total-label">TOTAL AMOUNT</span>
          <span class="total-val">₹${finalGrandTotal.toLocaleString('en-IN')}</span>
        </div>

        ${isPromoApplied ? `
          <div class="cart-savings-pill">
            You Save ₹${promoDiscount.toLocaleString('en-IN')} on this order!
          </div>
        ` : ''}

        <!-- Primary Action: Fast Web Checkout -->
        <button type="button" class="atelier-green-buy-btn" onclick="window.location.href='checkout.html';">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span>PROCEED TO CHECKOUT (₹${finalGrandTotal.toLocaleString('en-IN')})</span>
        </button>

        <!-- Secondary Action: WhatsApp 1-Click Order -->
        <a href="${waCartUrl}" target="_blank" class="cart-whatsapp-order-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          <span>Order Directly on WhatsApp</span>
        </a>
      </div>
    `;
  }

  window.applyCartPromo = function(code) {
    const c = String(code || '').trim().toUpperCase();
    localStorage.setItem('shimla_promo_code', c);
    window.syncCartAndRender();
  };

  window.removeCartPromo = function() {
    localStorage.removeItem('shimla_promo_code');
    window.syncCartAndRender();
  };

  window.syncCartAndRender = () => {
    try {
      const saved = localStorage.getItem('shimla_cart');
      state.cart = saved ? JSON.parse(saved) : [];
    } catch (e) {
      state.cart = [];
    }
    updateCartUI();
  };

  window.changeCartQty = (index, delta) => {
    if (state.cart && state.cart[index]) {
      state.cart[index].quantity = (Number(state.cart[index].quantity) || 1) + delta;
      if (state.cart[index].quantity <= 0) {
        state.cart.splice(index, 1);
      }
      saveCart();
    }
  };

  window.removeCartItem = (index) => {
    if (state.cart && state.cart[index]) {
      state.cart.splice(index, 1);
      saveCart();
      showToast('Item removed from cart');
    }
  };

  window.addToCart = (product, qty = 1) => {
    try {
      const saved = localStorage.getItem('shimla_cart');
      if (saved) state.cart = JSON.parse(saved);
    } catch (e) {}

    const matchKey = product.sku
      ? (i => i.sku === product.sku && i.size === product.size && (i.variety || '') === (product.variety || ''))
      : (i => i.id === product.id && i.size === product.size);
    const existingIndex = state.cart.findIndex(matchKey);
    if (existingIndex > -1) {
      state.cart[existingIndex].quantity = (Number(state.cart[existingIndex].quantity) || 1) + qty;
    } else {
      state.cart.push({
        id: product.id,
        productId: product.productId || product.id,
        sku: product.sku || '',
        name: product.name,
        size: product.size,
        variety: product.variety || '',
        price: Number(product.price) || 1099,
        image: product.image,
        quantity: qty
      });
    }
    saveCart();
    showToast(`Added ${qty} jar${qty > 1 ? 's' : ''} to your bag!`);
    window.openCart();
  };

  // Add to cart from Hero Section
  const heroAddToCartBtn = document.getElementById('hero-add-to-cart');
  if (heroAddToCartBtn) {
    heroAddToCartBtn.addEventListener('click', () => {
      window.addToCart(state.selectedProductVariant, state.heroQty);
    });
  }

  const heroBuyNowBtn = document.getElementById('hero-buy-now');
  if (heroBuyNowBtn) {
    heroBuyNowBtn.addEventListener('click', () => {
      window.addToCart(state.selectedProductVariant, state.heroQty);
      window.location.href = 'checkout.html';
    });
  }

  if (cartBtn) cartBtn.addEventListener('click', window.openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', window.closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', window.closeCart);

  // 5. Toast Notification System
  let toastTimeout;
  function showToast(msg) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-svg"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg> ${msg}`;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // 6. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-question');
    if (header) {
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(f => f.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // 7. Quick Checkout Modal Simulation
  const checkoutModal = document.getElementById('checkout-modal');
  const closeCheckoutModalBtn = document.getElementById('close-checkout-modal');
  const checkoutForm = document.getElementById('checkout-form');
  const orderSuccessCard = document.getElementById('order-success-message');

  function openCheckoutModal() {
    closeCart();
    window.location.href = 'checkout.html';
  }

  function closeCheckoutModal() {
    if (checkoutModal) {
      checkoutModal.classList.remove('active');
      document.body.style.overflow = '';
      if (orderSuccessCard) orderSuccessCard.style.display = 'none';
      if (checkoutForm) checkoutForm.style.display = 'block';
    }
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', openCheckoutModal);
  }
  if (closeCheckoutModalBtn) {
    closeCheckoutModalBtn.addEventListener('click', closeCheckoutModal);
  }
  if (checkoutModal) {
    checkoutModal.addEventListener('click', (e) => {
      if (e.target === checkoutModal) closeCheckoutModal();
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const customerName = document.getElementById('cust-name').value.trim();
      const customerPhone = document.getElementById('cust-phone').value.trim();
      const customerAddress = document.getElementById('cust-address').value.trim();
      const payMethodRadio = document.querySelector('input[name="pay-method"]:checked');
      const paymentMethod = payMethodRadio && payMethodRadio.value === 'ONLINE' ? 'ONLINE' : 'COD';

      const reqItems = (state.cart && state.cart.length > 0)
        ? state.cart.map(i => ({ productId: i.productId || i.id, sku: i.sku || '', size: i.size, variety: i.variety || '', quantity: Number(i.quantity) || 1 }))
        : [(() => {
            const fb = typeof window.getCurrentVariant === 'function' ? window.getCurrentVariant() : { productId: 'ghee', size: '500ml' };
            return { productId: fb.productId || fb.id || 'ghee', sku: fb.sku || '', size: fb.size, quantity: 1 };
          })()];

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: { name: customerName, phone: customerPhone, address: customerAddress, pincode: '171001', city: 'Shimla, HP' },
            items: reqItems,
            paymentMethod
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          showToast(data.error || 'Could not submit order request');
          return;
        }
        const order = data.order;
        const waNum = window.__shimlaWhatsAppNumber || '919800000000';
        const itemsListText = (order.itemsSnapshot || []).map(i => `• ${i.productName} (${i.variantLabel}) × ${i.quantity} = *₹${i.lineTotal.toLocaleString('en-IN')}*\n`).join('');
        const bNameUp = (window.__shimlaBrandName || 'Tribal Treasure').toUpperCase();
        const waMessage = `🛒 *NEW ${bNameUp} ORDER*\n*Order ID:* *${order.orderId}*\n*Status:* *Pending WhatsApp Confirmation*\n\n📦 *ITEMS:*\n${itemsListText.trim()}\n\n💰 *Total Payable:* *₹${order.grandTotal.toLocaleString('en-IN')}* (${paymentMethod})\n\n👤 *CUSTOMER:*\n• *Name:* *${order.customerSnapshot.name}*\n• *Phone:* *+91 ${order.customerSnapshot.phone}*\n• *Address:* ${order.customerSnapshot.address}`;
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '') || (window.innerWidth <= 768);
        const waUrl = `https://api.whatsapp.com/send?phone=${waNum}&text=${encodeURIComponent(waMessage)}`;

        state.cart = [];
        saveCart();
        checkoutForm.style.display = 'none';
        if (orderSuccessCard) {
          const esc = window.escapeHtml;
          orderSuccessCard.style.display = 'block';
          orderSuccessCard.innerHTML = `
            <h3 style="color:#0f172a;font-size:1.35rem;font-weight:800;margin-bottom:4px;">Order Details Generated!</h3>
            <p style="color:#64748b;font-size:0.85rem;margin-bottom:12px;">Ref ID: <strong style="color:#b45309;">${esc(order.orderId)}</strong></p>
            <a href="${esc(waUrl)}" class="whatsapp-order-btn" style="text-decoration:none;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px;">Confirm on WhatsApp</a>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;text-align:left;margin-bottom:12px;font-size:0.80rem;color:#334155;">
              <div><strong>Status:</strong> <span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:12px;font-size:0.72rem;font-weight:700;">Pending WhatsApp Confirmation</span></div>
              <div style="margin-top:4px;"><strong>Customer:</strong> ${esc(order.customerSnapshot.name)} (+91 ${esc(order.customerSnapshot.phone)})</div>
              <div style="margin-top:4px;"><strong>Total:</strong> <strong style="color:#059669;">₹${order.grandTotal.toLocaleString('en-IN')}</strong></div>
            </div>
          `;
        }
        if (isMobile) {
          window.location.href = waUrl;
        }
      } catch (err) {
        showToast('Network error submitting order');
      }
    });
  }

  // 8. Contact Form Handler (for contact page)
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast(`Thank you! Your message has been sent to ${window.__shimlaBrandName || 'Tribal Treasure'}.`);
      contactForm.reset();
    });
  }

  // 9. Newsletter Subscriber
  const newsletterForms = document.querySelectorAll('.newsletter-box');
  newsletterForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast(`Thank you for subscribing to ${window.__shimlaBrandName || 'Tribal Treasure'} updates!`);
      form.reset();
    });
  });

  // Initial render
  updateCartUI();
});


// Mobile-First Sticky Bar & Touch Handlers
window.getCurrentVariant = () => {
  return (typeof state !== 'undefined' && state.selectedProductVariant) ? state.selectedProductVariant : {
    id: 'a2-bilona-ghee-500ml',
    name: 'A2 Pahadi Cow Bilona Desi Ghee',
    size: '500ml',
    price: 1199,
    image: './images/shimla-ghee.webp'
  };
};

window.quickBuyMobile = () => {
  const variant = window.getCurrentVariant();
  window.addToCart(variant, 1);
  const checkoutModal = document.getElementById('checkout-modal');
  if (checkoutModal) {
    checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

function syncMobileBar() {
  const mPrice = document.getElementById('mobile-bar-price-val');
  const mSize = document.getElementById('mobile-bar-size-val');
  const variant = window.getCurrentVariant();
  if (mPrice && variant) {
    mPrice.textContent = '₹' + variant.price.toLocaleString('en-IN');
  }
  if (mSize && variant) {
    mSize.textContent = variant.size + ' Jar';
  }
}

document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setTimeout(syncMobileBar, 50);
  });
});

// ==========================================================================
// Atelier 3D Coverflow Carousel Controller
// ==========================================================================
function initAtelierCarousel() {
  const wrapper = document.getElementById('carousel-wrapper');
  const cards = document.querySelectorAll('.carousel-card');
  const dots = document.querySelectorAll('.c-dot');
  if (!wrapper || cards.length === 0) return;

  function updateActiveCard() {
    const wrapperCenter = wrapper.getBoundingClientRect().left + wrapper.offsetWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(wrapperCenter - cardCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    cards.forEach((card, i) => {
      if (i === closestIndex) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    dots.forEach((dot, i) => {
      if (i === closestIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  wrapper.addEventListener('scroll', () => {
    requestAnimationFrame(updateActiveCard);
  }, { passive: true });

  window.scrollCarouselToIndex = function(index) {
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Initial call
  setTimeout(updateActiveCard, 100);
}

document.addEventListener('DOMContentLoaded', () => {
  initAtelierCarousel();
});

// ==========================================================================
// 3D COVERFLOW CAROUSEL CLASS (USER SPECIFIED)
// ==========================================================================
class CoverflowCarousel {
  constructor(containerId, items) {
    this.container = document.getElementById(containerId);
    this.items = items || [];
    this.currentIndex = 0;
    this.isDragging = false;
    this.startX = 0;
    this.currentX = 0;
    this.hasMoved = false;
    this.autoPlayTimer = null;
    if (this.container && this.items.length > 0) {
      this.init();
    }
  }
  init() {
    this.render();
    this.updateSlides();
    this.attachEvents();
    this.startAutoPlay();
  }
  render() {
    this.container.innerHTML = `
      <section class="hero-showcase-section">
        <div class="coverflow-stage" id="coverflow-stage">
          <!-- Left Arrow -->
          <button class="coverflow-side-btn left" id="coverflow-prev" aria-label="Previous">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div class="coverflow-track" id="coverflow-track">
            ${this.items.map((item, idx) => `
              <div class="coverflow-slide" data-index="${idx}" data-link="${item.link || '#'}">
                <div class="coverflow-card-inner">
                  ${item.isDiagram ? `
                    <div class="coverflow-diagram-card">
                      <div class="diagram-bg-radial"></div>
                      <div class="diagram-top-pill">✦ VEDIC BILONA CYCLE ✦</div>
                      <div class="diagram-main-circle">
                        <div class="d-circle-center">
                          <span class="d-circle-icon">✨</span>
                          <span class="d-circle-text">${window.escapeHtml(window.__shimlaBrandName || 'Tribal Treasure')}<br>Pure Pahadi</span>
                        </div>
                        <div class="d-orbit-node node-top">
                          <span class="d-node-icon">🏔️</span>
                          <span class="d-node-title">Pahadi Cow</span>
                        </div>
                        <div class="d-orbit-node node-right">
                          <span class="d-node-icon">🏺</span>
                          <span class="d-node-title">Curd</span>
                        </div>
                        <div class="d-orbit-node node-bottom">
                          <span class="d-node-icon">🔥</span>
                          <span class="d-node-title">Slow Fire</span>
                        </div>
                        <div class="d-orbit-node node-left">
                          <span class="d-node-icon">🪵</span>
                          <span class="d-node-title">Bilona</span>
                        </div>
                      </div>
                      <div class="diagram-footer-stats">
                        <div class="d-stat-pill"><strong>12+</strong> Households</div>
                        <div class="d-stat-pill"><strong>0%</strong> Chem</div>
                        <div class="d-stat-pill"><strong>A2</strong> Pure</div>
                      </div>
                    </div>
                  ` : `
                    ${item.liveNote ? `
                      <div class="slide-live-pill">
                        <span class="slide-live-badge ${item.pillTone || 'pill-green'}">
                          <span class="slide-live-dot"></span>
                          <span>${item.liveNote}</span>
                        </span>
                      </div>
                    ` : ''}
                    <img src="${item.image}" alt="${item.title}" class="coverflow-img">
                  `}
                  <div class="slide-overlay-info">
                    <div class="slide-info-left">
                      <div class="slide-title">${item.title}</div>
                      <div class="slide-category">${item.subtitle || ''}</div>
                    </div>
                    <div class="slide-info-right">
                      <div class="slide-price-current">${item.price || ''}</div>
                      ${item.mrp ? `<div class="slide-price-mrp">${item.mrp}</div>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <!-- Right Arrow -->
          <button class="coverflow-side-btn right" id="coverflow-next" aria-label="Next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </section>
    `;
  }
  attachEvents() {
    const prevBtn = document.getElementById('coverflow-prev');
    const nextBtn = document.getElementById('coverflow-next');
    const stage = document.getElementById('coverflow-stage');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stopAutoPlay();
        this.prev();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stopAutoPlay();
        this.next();
      });
    }
    if (stage) {
      // Tap / Click handling for mobile & desktop
      stage.addEventListener('click', (e) => {
        const slide = e.target.closest('.coverflow-slide');
        if (slide) {
          const idx = parseInt(slide.dataset.index, 10);
          if (idx === this.currentIndex) {
            if (slide.dataset.link && slide.dataset.link !== '#') {
              window.location.href = slide.dataset.link;
            }
          } else {
            this.stopAutoPlay();
            this.goTo(idx);
          }
        }
      });
      // Touch Handling with tap vs drag distinction
      stage.addEventListener('touchstart', (e) => {
        this.isDragging = true;
        this.startX = e.touches[0].clientX;
        this.currentX = this.startX;
        this.hasMoved = false;
        this.stopAutoPlay();
      }, { passive: true });
      stage.addEventListener('touchmove', (e) => {
        if (!this.isDragging) return;
        this.currentX = e.touches[0].clientX;
        if (Math.abs(this.startX - this.currentX) > 12) {
          this.hasMoved = true;
        }
      }, { passive: true });
      stage.addEventListener('touchend', () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        if (this.hasMoved) {
          const diff = this.startX - this.currentX;
          if (Math.abs(diff) > 30) {
            diff > 0 ? this.next() : this.prev();
          }
        }
      });
      stage.addEventListener('mouseenter', () => this.stopAutoPlay());
      stage.addEventListener('mouseleave', () => this.startAutoPlay());
    }
  }
  updateSlides() {
    const slides = this.container.querySelectorAll('.coverflow-slide');
    const total = this.items.length;
    slides.forEach((slide, idx) => {
      slide.className = 'coverflow-slide';
      const diff = (idx - this.currentIndex + total) % total;
      if (diff === 0) slide.classList.add('active');
      else if (diff === 1) slide.classList.add('next-1');
      else if (diff === 2) slide.classList.add('next-2');
      else if (diff === total - 1) slide.classList.add('prev-1');
      else if (diff === total - 2) slide.classList.add('prev-2');
      else slide.classList.add('hidden-offscreen');
    });
  }
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.updateSlides();
  }
  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
    this.updateSlides();
  }
  goTo(idx) {
    this.currentIndex = idx;
    this.updateSlides();
  }
  startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => this.next(), 4000);
  }
  stopAutoPlay() {
    if (this.autoPlayTimer) clearInterval(this.autoPlayTimer);
  }
  updateData(newItems) {
    if (!Array.isArray(newItems) || newItems.length === 0) return;
    this.stopAutoPlay();
    this.items = newItems;
    this.currentIndex = Math.min(this.currentIndex, this.items.length - 1);
    this.render();
    this.updateSlides();
    this.attachEvents();
    this.startAutoPlay();
  }
}
// Initialize Coverflow Carousel & Global CMS + Analytics View Sync
document.addEventListener('DOMContentLoaded', () => {
  const pathName = (window.location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
  const pid = new URLSearchParams(window.location.search).get('id') || '';
  if (!window.location.pathname.includes('admin')) {
    fetch('/api/analytics/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pathName, productId: pid })
    }).catch(() => {});
  }

  const customContainer = document.getElementById('my-custom-carousel');
  const fallback = [
    { title: 'KINNAURI ROYAL DELICIOUS APPLES', subtitle: '5 kg Harvest Box', price: '₹1,399', mrp: '₹1,699', image: './images/royal-delicious-box.webp', link: 'product-apples.html', liveNote: '10,000 Ft Kinnaur Valley', pillTone: 'pill-green' },
    { title: 'KINNAURI GOLDEN DELICIOUS APPLES', subtitle: '5 kg Harvest Box', price: '₹1,299', mrp: '₹1,599', image: './images/shimla-apples.webp', link: 'product-royal-apples.html', liveNote: 'Honey Sweet • Handpicked', pillTone: 'pill-gold' },
    { title: 'KINNAURI PAPER-SHELL WALNUTS', subtitle: '1 kg Kagzi Pack', price: '₹899', mrp: '₹1,099', image: './images/himachali-walnuts.webp', link: 'product-walnuts.html', liveNote: 'Thin Kagzi Shell • Hand-Cracked', pillTone: 'pill-green' },
    { title: 'PURE TRIBAL DESI GHEE (BILONA)', subtitle: '500ml Glass Jar', price: '₹849', mrp: '₹999', image: './images/shimla-ghee.webp', link: 'product-ghee.html', liveNote: 'Vedic Bilona • Pahadi Cow Curd', pillTone: 'pill-gold' },
    { title: 'WILD KINNAURI FOREST HONEY', subtitle: '500g Glass Jar', price: '₹699', mrp: '₹849', image: './images/pure-honey.webp', link: 'product-honey.html', liveNote: '100% Raw • Unfiltered Nectar', pillTone: 'pill-gold' }
  ];

  function formatProductsForCarousel(catalogData) {
    if (!catalogData || !Array.isArray(catalogData.products)) return fallback;
    const shimlaProducts = catalogData.products
      .filter(p => p.visible !== false)
      .map(p => {
        const meta = window.getProductStatusPill ? window.getProductStatusPill(p) : { liveNote: '', tone: 'pill-green' };
        const cleanTitle = p.title || '';
        const firstSub = p.subtitle ? p.subtitle.split(' ')[0] : '';
        return {
          title: cleanTitle.toUpperCase() + (firstSub && !cleanTitle.includes(firstSub) ? ` (${firstSub})` : ''),
          subtitle: p.subtitle,
          price: `₹${(Number(p.price) || 0).toLocaleString('en-IN')}`,
          mrp: p.mrp > p.price ? `₹${Number(p.mrp).toLocaleString('en-IN')}` : '',
          image: p.image,
          link: p.link,
          liveNote: meta.liveNote,
          pillTone: meta.tone
        };
      });

    // 5 products standard
    return shimlaProducts.length > 0 ? shimlaProducts : fallback;
  }

  // 1. Instantly render hero Coverflow Carousel from localStorage or fallback (0ms latency!)
  if (customContainer) {
    let initialList = fallback;
    try {
      const cached = JSON.parse(localStorage.getItem('tribal_treasure_by_tribalgirl_cached_catalog_v2') || 'null');
      if (cached && Array.isArray(cached.products) && cached.products.length > 0) {
        initialList = formatProductsForCarousel(cached);
      }
    } catch (e) {}
    window.__heroCarouselInstance = new CoverflowCarousel('my-custom-carousel', initialList);
  }

  // 2. Load fresh catalog asynchronously, update cache, and refresh carousel
  window.loadStorefrontCatalog()
    .then(data => {
      window.applyStorefrontContent(data);
      try {
        localStorage.setItem('tribal_treasure_by_tribalgirl_cached_catalog_v2', JSON.stringify(data));
      } catch (e) {}
      if (!customContainer) return;
      const renderHomeCarousel = (catalogData) => {
        const freshList = formatProductsForCarousel(catalogData);
        if (window.__heroCarouselInstance) {
          window.__heroCarouselInstance.updateData(freshList);
        } else {
          window.__heroCarouselInstance = new CoverflowCarousel('my-custom-carousel', freshList);
        }
      };
      renderHomeCarousel(data);
      window.onStorefrontUpdate(renderHomeCarousel);
    })
    .catch(err => {
      console.error('Failed to load products for carousel', err);
    });
});



// ── Draggable & Expandable WhatsApp Concierge Logic ──
(function initDraggableWhatsApp() {
  function setup() {
    const widget = document.getElementById('shimla-wa-widget');
    const trigger = document.getElementById('shimla-wa-trigger');
    if (!widget || !trigger) return;

    let isDragging = false;
    let hasMoved = false;
    let startX, startY;
    let initialLeft, initialTop;

    function onStart(e) {
      const point = e.touches ? e.touches[0] : e;
      startX = point.clientX;
      startY = point.clientY;
      hasMoved = false;
      isDragging = true;

      const rect = widget.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      widget.style.right = 'auto';
      widget.style.bottom = 'auto';
      widget.style.left = initialLeft + 'px';
      widget.style.top = initialTop + 'px';
    }

    function onMove(e) {
      if (!isDragging) return;
      const point = e.touches ? e.touches[0] : e;
      const deltaX = point.clientX - startX;
      const deltaY = point.clientY - startY;

      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        hasMoved = true;
        if (e.cancelable) e.preventDefault();
      }

      if (hasMoved) {
        const maxX = window.innerWidth - widget.offsetWidth - 10;
        const maxY = window.innerHeight - widget.offsetHeight - 10;
        const newX = Math.max(10, Math.min(maxX, initialLeft + deltaX));
        const newY = Math.max(10, Math.min(maxY, initialTop + deltaY));

        widget.style.left = newX + 'px';
        widget.style.top = newY + 'px';
      }
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;

      if (hasMoved) {
        // Snap smoothly to closest edge
        const rect = widget.getBoundingClientRect();
        const midX = window.innerWidth / 2;
        widget.style.transition = 'left 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)';
        if (rect.left + rect.width / 2 < midX) {
          widget.style.left = '16px';
        } else {
          widget.style.left = (window.innerWidth - widget.offsetWidth - 16) + 'px';
        }
        setTimeout(() => { widget.style.transition = ''; }, 300);
        return;
      }

      // Tap Interaction:
      if (widget.classList.contains('collapsed')) {
        // Expand
        widget.classList.remove('collapsed');
        widget.classList.add('expanded');
      } else {
        // Open WhatsApp
        const waNum = window.__shimlaWhatsAppNumber || '919800000000';
        const waUrl = `https://wa.me/${waNum}?text=Hello%20Shimla%20Wali%20Care,%20I%20need%20help%20with%20my%20order%20or%20products.`;
        window.open(waUrl, '_blank');
      }
    }

    trigger.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    trigger.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    // Auto-collapse when clicking outside
    document.addEventListener('click', (e) => {
      if (!widget.contains(e.target) && widget.classList.contains('expanded')) {
        widget.classList.remove('expanded');
        widget.classList.add('collapsed');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();



// Exclusive Accordion Logic for 72-Hour Freshness Journey
window.toggleFreshnessAccordion = function(stageNum) {
  const items = document.querySelectorAll('.freshness-accordion-item');
  items.forEach(item => {
    const itemStage = item.getAttribute('data-stage');
    const headerBtn = item.querySelector('.f-accordion-header');
    if (itemStage === String(stageNum)) {
      const isOpen = item.classList.contains('active');
      if (isOpen) {
        // Toggle closed
        item.classList.remove('active');
        if (headerBtn) headerBtn.setAttribute('aria-expanded', 'false');
      } else {
        // Open
        item.classList.add('active');
        if (headerBtn) headerBtn.setAttribute('aria-expanded', 'true');
      }
    } else {
      // Close all other items
      item.classList.remove('active');
      if (headerBtn) headerBtn.setAttribute('aria-expanded', 'false');
    }
  });
};
