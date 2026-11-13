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
  if (typeof window.refreshDrawerAuthCard === 'function') window.refreshDrawerAuthCard();
  const navDrawer = document.getElementById('nav-drawer');
  const navOverlay = document.getElementById('nav-drawer-overlay');
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
  const brandName = String(s.brand_name || 'Shimla Wali').trim() || 'Shimla Wali';
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
    document.querySelectorAll('[data-cms-hero-desc]').forEach(el => {
      applyBilingualEn(el, c.hero_description);
    });
  }

  // Marquee items
  if (Array.isArray(c.marquee_items) && c.marquee_items.length > 0) {
    const track = document.querySelector('.luxury-marquee-track');
    if (track) {
      const doubled = [...c.marquee_items, ...c.marquee_items];
      track.innerHTML = doubled
        .map(txt => `<span class="marquee-pill-item"><span class="marquee-dot"></span> ${window.escapeHtml(txt)}</span>`)
        .join('');
    }
  }

  // Dynamic phone, WhatsApp, Support Email & Instagram links
  const waNum = String(s.whatsapp_number || '917018168156').replace(/\D/g, '') || '917018168156';
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
  const isLoggedIn = profile && profile.loggedIn && profile.phone;
  const iconEl = card.querySelector('.vip-user-icon');
  const titleEl = card.querySelector('.vip-title');
  const subEl = card.querySelector('.vip-sub');
  if (isLoggedIn) {
    const first = (profile.name || 'Friend').trim().split(' ')[0];
    if (iconEl) iconEl.textContent = first.slice(0, 2).toUpperCase();
    if (titleEl) {
      titleEl.textContent = `Hi, ${first}`;
      titleEl.removeAttribute('data-en');
    }
    if (subEl) {
      subEl.textContent = `+91 ${profile.phone} • Orders & 1-Tap →`;
      subEl.removeAttribute('data-en');
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
  const navDrawer = document.getElementById('nav-drawer');
  if (!navDrawer) return;
  const currentTheme = localStorage.getItem('shimla-theme') || 'light';
  const currentLang = localStorage.getItem('shimla-lang') || 'en';

  navDrawer.innerHTML = `
    <div class="nav-drawer-header">
      <div class="drawer-brand-title">${window.escapeHtml(window.__shimlaBrandName || 'Shimla Wali')}</div>
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

    <div class="drawer-section-label">EXPLORE</div>
    <div class="drawer-nav-list">
      <a href="index.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span>
        <span class="d-item-text" data-en="Home & Fresh Drops" data-hi="होम व ताज़ा बैच">Home & Fresh Drops</span>
      </a>
      <a href="shop.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span>
        <span class="d-item-text" data-en="All Mountain Harvest" data-hi="सभी पहाड़ी उत्पाद">All Mountain Harvest</span>
      </a>
      <a href="product.html?id=ghee" class="drawer-nav-item item-highlight">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>
        <span class="d-item-text" data-en="A2 Bilona Ghee" data-hi="A2 बिलोना घी">A2 Bilona Ghee</span>
        <span class="drawer-badge-purple">POPULAR</span>
      </a>
      <a href="about.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5"/></svg></span>
        <span class="d-item-text" data-en="Our Story" data-hi="हमारी कहानी">Our Story</span>
      </a>
      <a href="verify.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
        <span class="d-item-text" data-en="Purity & Lab Reports" data-hi="शुद्धता व लैब रिपोर्ट">Purity & Lab Reports</span>
      </a>
      <a href="contact.html" class="drawer-nav-item">
        <span class="d-item-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></span>
        <span class="d-item-text" data-en="Help & Contact" data-hi="सहायता व संपर्क">Help & Contact</span>
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
      id: 'a2-bilona-ghee-500ml',
      name: 'A2 Pahadi Cow Bilona Desi Ghee',
      size: '500ml',
      price: 1199,
      originalPrice: 1500,
      image: './images/shimla-ghee.webp'
    },
    heroQty: 1
  };

  const productVariants = {
    '250ml': {
      id: 'a2-bilona-ghee-250ml',
      name: 'A2 Pahadi Cow Bilona Desi Ghee',
      size: '250ml',
      price: 649,
      originalPrice: 799,
      image: './images/shimla-ghee.webp',
      discount: '19% OFF'
    },
    '500ml': {
      id: 'a2-bilona-ghee-500ml',
      name: 'A2 Pahadi Cow Bilona Desi Ghee',
      size: '500ml',
      price: 1199,
      originalPrice: 1500,
      image: './images/shimla-ghee.webp',
      discount: '20% OFF'
    },
    '1000ml': {
      id: 'a2-bilona-ghee-1000ml',
      name: 'A2 Pahadi Cow Bilona Desi Ghee',
      size: '1000ml (1 Litre)',
      price: 2299,
      originalPrice: 2800,
      image: './images/shimla-ghee.webp',
      discount: '18% OFF'
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
      localStorage.setItem('shimla_cart', JSON.stringify(state.cart));
    } catch (e) {}
    updateCartUI();
  }

  function updateCartUI() {
    try {
      const saved = localStorage.getItem('shimla_cart');
      if (saved) {
        state.cart = JSON.parse(saved);
      }
    } catch (e) {}

    const totalCount = state.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartCountBadges.forEach(badge => {
      badge.textContent = totalCount;
    });

    const bodyContainer = document.getElementById('cart-drawer-body') || document.getElementById('cart-items');
    if (!bodyContainer) return;

    if (!state.cart || state.cart.length === 0) {
      bodyContainer.innerHTML = `
        <div class="cart-empty-card">
          <div class="cart-empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 6px;">Your Bag is empty</h3>
          <p style="color: #64748b; font-size: 0.84rem; line-height: 1.4; margin-bottom: 18px;">Discover 100% pure Vedic A2 Bilona Ghee handcrafted in brass & clay vessels.</p>
          <button class="btn btn-primary" style="width: 100%; border-radius: 24px; padding: 12px;" onclick="window.closeCart(); location.href='index.html#shop-collection'">+ EXPLORE DROPS</button>
        </div>
      `;
      return;
    }

    let subtotal = 0;
    state.cart.forEach(item => {
      const price = Number(item.price) || 1099;
      const qty = Number(item.quantity) || 1;
      subtotal += price * qty;
    });

    const activeDiscount = window.__primaryDiscount ||
      (window.__activeDiscounts && window.__activeDiscounts[0]) ||
      { code: 'SHIMLA50', value: 20, minOrderAmount: 1500 };
    const promoCode = (activeDiscount.code || 'SHIMLA50').toUpperCase();
    const promoPct = Number(activeDiscount.value) || 20;
    const promoRate = promoPct / 100;
    const promoMin = Number(activeDiscount.minOrderAmount) || 1500;

    const storedPromo = (localStorage.getItem('shimla_promo_code') || '').trim().toUpperCase();
    const isPromoEligible = subtotal >= promoMin;
    let isPromoApplied = false;
    let promoDiscount = 0;

    if (storedPromo === promoCode) {
      if (isPromoEligible) {
        isPromoApplied = true;
        promoDiscount = Math.round(subtotal * promoRate);
      } else {
        localStorage.removeItem('shimla_promo_code');
      }
    }

    const isShimla50Applied = isPromoApplied;
    const finalGrandTotal = Math.max(0, subtotal - promoDiscount);

    // Build promo nudge / unlock banner
    let promoCardHtml = '';
    if (isPromoApplied) {
      promoCardHtml = `
        <div class="cart-promo-unlocked-card applied">
          <div class="promo-card-left">
            <span class="promo-badge-tag success">✨ ${promoPct}% DISCOUNT APPLIED</span>
            <div class="promo-card-heading">Coupon <strong>${promoCode}</strong> Active</div>
            <div class="promo-card-savings">You save <strong>₹${promoDiscount.toLocaleString('en-IN')}</strong> (Flat ${promoPct}% OFF) on this bag!</div>
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
            <span class="promo-badge-tag gold">🎉 ${promoPct}% OFF UNLOCKED!</span>
            <div class="promo-card-heading">Your cart is above ₹${promoMin.toLocaleString('en-IN')}!</div>
            <div class="promo-card-savings">Apply code <strong>${promoCode}</strong> now to get ${promoPct}% off & save ₹${Math.round(subtotal * promoRate).toLocaleString('en-IN')}.</div>
          </div>
          <button type="button" class="promo-card-btn apply-btn" onclick="window.applyCartPromo('${promoCode}')">
            ⚡ Apply ${promoPct}% OFF
          </button>
        </div>
      `;
    } else {
      const needed = promoMin - subtotal;
      const pct = Math.min(100, Math.round((subtotal / promoMin) * 100));
      promoCardHtml = `
        <div class="cart-promo-nudge-card">
          <div class="promo-nudge-top">
            <span class="promo-nudge-title">🏔️ <strong>Flat ${promoPct}% OFF</strong> above ₹${promoMin.toLocaleString('en-IN')}</span>
            <span class="promo-nudge-need">Add <strong>₹${needed.toLocaleString('en-IN')}</strong> more</span>
          </div>
          <div class="promo-nudge-progress-wrap">
            <div class="promo-nudge-progress-bar" style="width: ${pct}%;"></div>
          </div>
          <div class="promo-nudge-sub">Reach ₹${promoMin.toLocaleString('en-IN')} & apply coupon <strong>${promoCode}</strong> to get ${promoPct}% off entire bag.</div>
        </div>
      `;
    }

    bodyContainer.innerHTML = `
      <!-- Card 1: Items In Bag -->
      <div class="cart-section-card">
        <div class="cart-card-header">
          <span class="cart-items-count-text">${totalCount} ${totalCount === 1 ? 'ITEM' : 'ITEMS'} IN YOUR BAG</span>
          <a href="index.html#shop-collection" class="add-more-drops-link" onclick="window.closeCart();">+ ADD MORE DROPS</a>
        </div>
        <div class="cart-card-divider"></div>
        
        <div class="cart-items-list">
          ${state.cart.map((item, index) => {
            const esc = window.escapeHtml;
            const itemPrice = Number(item.price) || 1099;
            const itemQty = Number(item.quantity) || 1;
            const itemTotal = itemPrice * itemQty;
            const itemImg = item.image || './images/shimla-ghee.webp';
            const itemSize = item.size ? String(item.size).toUpperCase() : '500ML';
            return `
              <div class="atelier-cart-item">
                <div class="cart-item-thumb">
                  <img src="${esc(itemImg)}" alt="${esc(item.name || 'Shimla Wali Product')}" onerror="this.src='./images/shimla-ghee.webp'" />
                </div>
                <div class="atelier-item-details">
                  <h4 class="atelier-item-title">${esc((item.name || 'A2 PAHADI COW BILONA DESI GHEE').toUpperCase())}</h4>
                  <div class="atelier-item-meta">AUTHENTIC HP &bull; SIZE: ${esc(itemSize)}</div>
                  <div class="atelier-item-sub">Pure Mountain Sourced &bull; Shimla Wali</div>
                  <div class="atelier-item-price">₹${itemTotal.toLocaleString('en-IN')}</div>
                  
                  <div class="atelier-item-actions-row">
                    <div class="atelier-qty-pill">
                      <button type="button" class="qty-pill-btn" onclick="window.changeCartQty(${index}, -1)">−</button>
                      <span class="qty-pill-num">${itemQty}</span>
                      <button type="button" class="qty-pill-btn" onclick="window.changeCartQty(${index}, 1)">+</button>
                    </div>
                    <button type="button" class="save-for-later-btn" onclick="window.removeCartItem(${index})">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 50% Off Promo Incentive / Unlock Card -->
      ${promoCardHtml}

      <!-- Card 2: Order Summary -->
      <div class="cart-section-card summary-card">
        <h3 class="summary-card-title">ORDER SUMMARY</h3>
        
        <div class="summary-line-row">
          <span>Items Subtotal (${totalCount} ${totalCount === 1 ? 'item' : 'items'})</span>
          <span style="font-weight: 700; color: #0f172a;">₹${subtotal.toLocaleString('en-IN')}</span>
        </div>
        
        ${isShimla50Applied ? `
          <div class="summary-line-row promo-discount-line" style="color: #059669; font-weight: 700;">
            <span>Harvest Offer (${promoCode} &bull; ${promoPct}% OFF)</span>
            <span>-₹${promoDiscount.toLocaleString('en-IN')}</span>
          </div>
        ` : ''}

        <div class="summary-line-row">
          <span>Pan-India Shipping</span>
          <span class="free-badge-green">FREE</span>
        </div>

        <div class="summary-divider"></div>

        <div class="summary-total-row">
          <span class="total-label">TOTAL AMOUNT</span>
          <span class="total-val">₹${finalGrandTotal.toLocaleString('en-IN')}</span>
        </div>

        ${isShimla50Applied ? `
          <div class="cart-savings-pill">
            ✨ You Save ₹${promoDiscount.toLocaleString('en-IN')} on this order!
          </div>
        ` : ''}

        <!-- Big Green Buy Button -->
        <button type="button" class="atelier-green-buy-btn" onclick="window.location.href='checkout.html';">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span>BUY / CONFIRM ORDER</span>
        </button>
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
        const waNum = window.__shimlaWhatsAppNumber || '917018168156';
        const itemsListText = (order.itemsSnapshot || []).map(i => `• ${i.productName} (${i.variantLabel}) [${i.sku}] × ${i.quantity} = ₹${i.lineTotal.toLocaleString('en-IN')}\n`).join('');
        const bNameUp = (window.__shimlaBrandName || 'Shimla Wali').toUpperCase();
        const waMessage = `🛍️ *NEW ${bNameUp} ORDER*\n*Order ID:* ${order.orderId}\n*📦 ITEMS:*\n${itemsListText}*💰 Total:* ₹${order.grandTotal.toLocaleString('en-IN')} (${paymentMethod})\n*👤 CUSTOMER:* ${order.customerSnapshot.name} (+91 ${order.customerSnapshot.phone})\n• *Address:* ${order.customerSnapshot.address}`;
        const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(waMessage)}`;

        state.cart = [];
        saveCart();
        checkoutForm.style.display = 'none';
        if (orderSuccessCard) {
          const esc = window.escapeHtml;
          orderSuccessCard.style.display = 'block';
          orderSuccessCard.innerHTML = `
            <h3 style="color:#0f172a;font-size:1.35rem;font-weight:800;margin-bottom:4px;">Order Request Recorded</h3>
            <p style="color:#64748b;font-size:0.85rem;margin-bottom:12px;">Order ID: <strong style="color:#315d43;">${esc(order.orderId)}</strong></p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;text-align:left;margin-bottom:12px;font-size:0.80rem;color:#334155;">
              <div><strong>Customer:</strong> ${esc(order.customerSnapshot.name)} (+91 ${esc(order.customerSnapshot.phone)})</div>
              <div style="margin-top:4px;"><strong>Total:</strong> ₹${order.grandTotal.toLocaleString('en-IN')}</div>
            </div>
            <a href="${esc(waUrl)}" class="whatsapp-order-btn" style="text-decoration:none;margin-bottom:6px;display:flex;align-items:center;justify-content:center;gap:8px;">Confirm on WhatsApp</a>
          `;
        }
        window.location.href = waUrl;
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
      showToast(`Thank you! Your message has been sent to ${window.__shimlaBrandName || 'Shimla Wali'}.`);
      contactForm.reset();
    });
  }

  // 9. Newsletter Subscriber
  const newsletterForms = document.querySelectorAll('.newsletter-box');
  newsletterForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast(`Thank you for subscribing to ${window.__shimlaBrandName || 'Shimla Wali'} updates!`);
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
                          <span class="d-circle-text">${window.escapeHtml(window.__shimlaBrandName || 'Shimla Wali')}<br>Pure Pahadi</span>
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
  window.loadStorefrontCatalog()
    .then(data => {
      window.applyStorefrontContent(data);
      if (!customContainer) return;
      const renderHomeCarousel = (catalogData) => {
        const shimlaProducts = (catalogData.products || [])
          .filter(p => p.visible !== false)
          .map(p => {
            const meta = window.getProductStatusPill(p);
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

        if (shimlaProducts.length < 5) {
          shimlaProducts.push({
            title: 'VEDIC BILONA PROCESS',
            subtitle: '100% Curd Churned Heritage',
            price: 'Explore →',
            mrp: '',
            isDiagram: true,
            link: 'about.html'
          });
        }
        new CoverflowCarousel('my-custom-carousel', shimlaProducts);
      };
      renderHomeCarousel(data);
      window.onStorefrontUpdate(renderHomeCarousel);
    })
    .catch(err => {
      console.error('Failed to load products for carousel', err);
      if (!customContainer) return;
      const fallback = [
        { title: 'A2 PAHADI BILONA GHEE', subtitle: '500ml Traditional Jar', price: '₹1,199', mrp: '₹1,500', image: './images/shimla-ghee.webp', link: 'product.html?id=ghee', liveNote: 'Fresh Churn • Only Few Left', pillTone: 'pill-green' },
        { title: 'HIMACHALI WALNUTS', subtitle: '500g Kagzi Akhrot', price: '₹549', mrp: '₹750', image: './images/himachali-walnuts.webp', link: 'product.html?id=walnuts', liveNote: 'Kinnaur Fresh Harvest', pillTone: 'pill-green' },
        { title: 'WILD FOREST RAW HONEY', subtitle: '500g Alpine Nectar', price: '₹599', mrp: '₹799', image: './images/pure-honey.webp?v=4', link: 'product.html?id=honey', liveNote: 'Raw Forest • Only 8 Left', pillTone: 'pill-red' },
        { title: 'HOMEMADE PAHADI PICKLE', subtitle: '400g Handcrafted Jar', price: '₹349', mrp: '₹450', image: './images/homemade-pickle.webp?v=4', link: 'product.html?id=pickle', liveNote: 'Sun-Cured • 10 Jars Left', pillTone: 'pill-gold' },
        { title: 'SHIMLA ROYAL APPLES', subtitle: '5kg Orchard Crate', price: '₹1,249', mrp: '₹1,600', image: './images/shimla-apples.webp?v=4', link: 'product.html?id=apples', liveNote: 'Orchard Picked Fresh', pillTone: 'pill-orange' },
        { title: 'ORGANIC PAHADI RAJMA', subtitle: '1kg Mountain Harvest', price: '₹269', mrp: '₹350', image: './images/pahadi-rajma.webp', link: 'product.html?id=pulses', liveNote: 'Sun-Cured Village Harvest', pillTone: 'pill-green' },
        { title: 'HIMACHALI RED RICE', subtitle: '1kg Chhohartu Grain', price: '₹249', mrp: '₹320', image: './images/himachali-red-rice.webp?v=2', link: 'product.html?id=red-rice', liveNote: 'Stone-Husked • Few Bags Left', pillTone: 'pill-gold' }
      ];
      new CoverflowCarousel('my-custom-carousel', fallback);
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
        const waNum = window.__shimlaWhatsAppNumber || '917018168156';
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
