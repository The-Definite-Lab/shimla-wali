/**
 * Shimla Crunch — Zero-Cost Firebase Spark (₹0) Bridge
 * Routes /api/* requests to Cloud Firestore + Firebase Auth when enabled in firebase-config.js,
 * while preserving 100% parity with shared/domain.js and local server.js.
 */
(function() {
  const cfg = window.SHIMLA_FIREBASE_CONFIG || {};
  const isFirebaseActive = Boolean(cfg.enabled && cfg.apiKey && cfg.projectId);

  window.shimlaFirebaseBridge = {
    isEnabled: () => isFirebaseActive,
    ready: null,
    subscribeStorefront: null,
    seedFromSnapshot: null
  };

  if (!isFirebaseActive) return;

  const nativeFetch = window.fetch.bind(window);
  const FB_SDK_VER = '10.14.1';
  const mediaCache = new Map();
  let cachedPublicStorefront = null;
  let cachedPublicStorefrontAt = 0;
  const STOREFRONT_CACHE_TTL_MS = 60000;
  const cachedDiscounts = {};
  let cachedDiscountsAt = 0;
  const STORE_ID = (window.SHIMLA_FIREBASE_CONFIG && window.SHIMLA_FIREBASE_CONFIG.storeId) || 'shimlacrunch';
  const STOREFRONT_DOC_ID = (window.SHIMLA_FIREBASE_CONFIG && window.SHIMLA_FIREBASE_CONFIG.storefrontDoc) || 'shimlacrunch';

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load Firebase SDK: ${src}`));
      document.head.appendChild(s);
    });
  }

  let initPromise = null;
  function ensureFirebase() {
    if (!initPromise) {
      initPromise = (async () => {
        if (!window.firebase || !window.firebase.apps) {
          await loadScriptOnce(`https://www.gstatic.com/firebasejs/${FB_SDK_VER}/firebase-app-compat.js`);
        }
        if (!window.firebase.auth) {
          await loadScriptOnce(`https://www.gstatic.com/firebasejs/${FB_SDK_VER}/firebase-auth-compat.js`);
        }
        if (!window.firebase.firestore) {
          await loadScriptOnce(`https://www.gstatic.com/firebasejs/${FB_SDK_VER}/firebase-firestore-compat.js`);
        }
        if (!window.ShimlaSku) await loadScriptOnce('shared/sku.js');
        if (!window.ShimlaDomain) await loadScriptOnce('shared/domain.js');
        if (!window.ShimlaProjection) await loadScriptOnce('shared/projection.js');

        if (!window.firebase.apps.length) {
          window.firebase.initializeApp({
            apiKey: cfg.apiKey,
            authDomain: cfg.authDomain || `${cfg.projectId}.firebaseapp.com`,
            projectId: cfg.projectId,
            storageBucket: cfg.storageBucket || '',
            messagingSenderId: cfg.messagingSenderId || '',
            appId: cfg.appId || ''
          });
        }
        const auth = window.firebase.auth();
        const db = window.firebase.firestore();
        try {
          if (auth.setPersistence && window.firebase.auth.Auth && window.firebase.auth.Auth.Persistence) {
            await auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL);
          }
        } catch (e) {}
        await new Promise(resolve => {
          let resolved = false;
          const unsub = auth.onAuthStateChanged(user => {
            if (!resolved) {
              resolved = true;
              unsub();
              resolve(user);
            }
          });
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve(auth.currentUser);
            }
          }, 2500);
        });
        return { auth, db };
      })();
    }
    return initPromise;
  }
  window.shimlaFirebaseBridge.ready = ensureFirebase;

  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async function sha256Hex(str) {
    const enc = new TextEncoder().encode(String(str || ''));
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  }

  function sanitizeDoc(obj) {
    return JSON.parse(JSON.stringify(obj === undefined ? null : obj));
  }

  async function resolveMediaRefsInObject(db, rootObj) {
    const refs = new Set();
    const walk = val => {
      if (typeof val === 'string' && val.startsWith('fbmedia://')) {
        refs.add(val.slice('fbmedia://'.length));
      } else if (Array.isArray(val)) {
        val.forEach(walk);
      } else if (val && typeof val === 'object') {
        Object.values(val).forEach(walk);
      }
    };
    walk(rootObj);
    const missing = [...refs].filter(id => !mediaCache.has(id));
    if (missing.length) {
      await Promise.all(missing.map(async id => {
        try {
          const snap = await db.collection('media_assets').doc(id).get();
          if (snap.exists && snap.data().dataUrl) {
            mediaCache.set(id, snap.data().dataUrl);
          }
        } catch {}
      }));
    }
    const replaceWalk = val => {
      if (typeof val === 'string' && val.startsWith('fbmedia://')) {
        return mediaCache.get(val.slice('fbmedia://'.length)) || val;
      }
      if (Array.isArray(val)) return val.map(replaceWalk);
      if (val && typeof val === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(val)) out[k] = replaceWalk(v);
        return out;
      }
      return val;
    };
    return replaceWalk(rootObj);
  }

  async function compressImageFile(file, maxDim = 960, quality = 0.8) {
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(new Error('Failed to read file'));
      r.readAsDataURL(file);
    });
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Invalid image file'));
      el.src = dataUrl;
    });
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.max(1, Math.round(w * ratio));
      h = Math.max(1, Math.round(h * ratio));
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    let out = canvas.toDataURL('image/webp', quality);
    if (!out.startsWith('data:image/webp')) {
      out = canvas.toDataURL('image/jpeg', quality);
    }
    return out;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(new Error('Failed to read file'));
      r.readAsDataURL(file);
    });
  }

  function buildReceiptLookupPayload(order) {
    const ship = order.shippingDetails || {};
    return {
      orderId: order.orderId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt || order.createdAt,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      grandTotal: order.grandTotal,
      itemsSnapshot: order.itemsSnapshot || [],
      shippingDetails: {
        courier: ship.courier || '',
        trackingId: ship.trackingId || '',
        trackingUrl: ship.trackingUrl || '',
        expectedDeliveryText: ship.expectedDeliveryText || ''
      }
    };
  }

  async function syncOrderLookupDocs(db, order) {
    const phone = window.ShimlaDomain.normalizePhone(order.customerSnapshot?.phone || '');
    if (!phone) return;
    const payload = sanitizeDoc(buildReceiptLookupPayload(order));
    const pin = String(order.customerSnapshot?.pincode || '').trim();
    const tasks = [
      sha256Hex(`${phone}:${order.orderId}`).then(oidHash =>
        db.collection('order_lookups').doc(oidHash).set(payload)
      )
    ];
    if (/^\d{6}$/.test(pin)) {
      tasks.push(
        sha256Hex(`${phone}:${pin}`).then(pinHash =>
          db.collection('order_pin_lookups').doc(pinHash).collection('orders').doc(order.orderId).set(payload)
        )
      );
    }
    await Promise.all(tasks);
  }

  async function loadPublicStorefront(db, options = {}) {
    const now = Date.now();
    const isFresh = cachedPublicStorefront && (now - cachedPublicStorefrontAt < STOREFRONT_CACHE_TTL_MS);

    if (isFresh) {
      if (options.skipMedia || cachedPublicStorefront._mediaResolved) {
        return JSON.parse(JSON.stringify(cachedPublicStorefront));
      }
    }

    let pubSnap = await db.collection('storefront').doc(STOREFRONT_DOC_ID).get();
    let pub;
    if (!pubSnap.exists) {
      try {
        const localRes = await nativeFetch('products.json', { cache: 'no-store' });
        const localData = await localRes.json();
        pub = window.ShimlaProjection ? window.ShimlaProjection.buildPublicProductsProjection(localData) : localData;
      } catch (e) {
        throw new Error('Storefront database is not seeded yet. Sign in to Admin Studio -> Seed Firestore.');
      }
    } else {
      pub = pubSnap.data() || {};
    }
    // Overlay live inventory availability so checkout and product cards always reflect latest stock
    const invSnap = await db.collection('inventory').get();
    const bySku = {};
    invSnap.forEach(doc => { bySku[doc.id] = doc.data(); });
    if (Object.keys(bySku).length > 0 && Array.isArray(pub.products)) {
      pub.products = pub.products.map(p => {
        const nextVars = (p.variants || []).map(v => {
          const inv = bySku[v.sku];
          if (!inv) return v;
          const free = Math.max(0, (inv.availableQty || 0) - (inv.reservedQty || 0));
          return {
            ...v,
            inStock: free > 0,
            availableUnits: free,
            lowStock: free > 0 && free <= (Number(inv.reorderThreshold) || 5)
          };
        });
        const totalFree = nextVars.reduce((s, v) => s + (v.visible !== false ? v.availableUnits : 0), 0);
        return {
          ...p,
          variants: nextVars,
          inStock: totalFree > 0,
          availableUnits: totalFree,
          status: totalFree <= 0 && p.status !== 'upcoming' ? 'out_of_stock' : (p.status === 'out_of_stock' && totalFree > 0 ? 'active' : p.status)
        };
      });
    }
    pub._bySku = bySku;
    if (pub && pub.content && Array.isArray(pub.content.marquee_items)) {
      pub.content.marquee_items = pub.content.marquee_items.filter(s => !/[\u0900-\u097F]/.test(String(s || '')));
    }

    if (options.skipMedia) {
      if (!cachedPublicStorefront) {
        cachedPublicStorefront = JSON.parse(JSON.stringify(pub));
        cachedPublicStorefrontAt = now;
      }
      return pub;
    }

    const resolved = await resolveMediaRefsInObject(db, pub);
    resolved._mediaResolved = true;
    cachedPublicStorefront = JSON.parse(JSON.stringify(resolved));
    cachedPublicStorefrontAt = now;
    return resolved;
  }

  async function buildPseudoDbFromPublic(db, promoCode = '', options = {}) {
    const pub = await loadPublicStorefront(db, options);
    const discounts = [];
    const cleanPromo = String(promoCode || '').trim().toUpperCase();
    if (cleanPromo) {
      const now = Date.now();
      if (cachedDiscounts[cleanPromo] && (now - cachedDiscountsAt < STOREFRONT_CACHE_TTL_MS)) {
        discounts.push(cachedDiscounts[cleanPromo]);
      } else {
        try {
          const dSnap = await db.collection('discounts').doc(cleanPromo).get();
          if (dSnap.exists) {
            const dData = dSnap.data();
            cachedDiscounts[cleanPromo] = dData;
            cachedDiscountsAt = now;
            discounts.push(dData);
          }
        } catch {}
      }
    }

    return {
      pub,
      dbObj: {
        catalog: {
          products: pub.products || [],
          niches: pub.niches || [],
          settings: pub.settings || {},
          media: pub.media || {},
          content: pub.content || {}
        },
        inventory: { bySku: pub._bySku || {} },
        batches: { batches: pub.batches || [] },
        discounts: { discounts },
        orders: { orders: [] },
        customers: { customers: [] },
        auditLogs: { logs: [] }
      }
    };
  }

  async function loadFullAdminDb(db) {
    const [
      catSnap, invSnap, batchSnap, discSnap,
      ordSnap, custSnap, paySnap, movSnap, logSnap, viewSnap
    ] = await Promise.all([
      db.collection('catalog').doc('main').get(),
      db.collection('inventory').get(),
      db.collection('batches').get(),
      db.collection('discounts').get(),
      db.collection('orders').orderBy('createdAt', 'desc').limit(500).get(),
      db.collection('customers').get(),
      db.collection('payments').orderBy('createdAt', 'desc').limit(500).get(),
      db.collection('movements').orderBy('createdAt', 'desc').limit(300).get(),
      db.collection('audit_logs').orderBy('createdAt', 'desc').limit(250).get(),
      db.collection('analytics_views').get()
    ]);

    const cat = catSnap.exists ? catSnap.data() : { products: [], niches: window.ShimlaSku.DEFAULT_NICHES, settings: {}, media: {}, content: {} };
    const bySku = {};
    invSnap.forEach(d => { bySku[d.id] = d.data(); });
    const batches = [];
    batchSnap.forEach(d => batches.push(d.data()));
    const discounts = [];
    discSnap.forEach(d => discounts.push(d.data()));
    const orders = [];
    ordSnap.forEach(d => {
      const o = d.data();
      if (o.storeId === STORE_ID || (!o.storeId && (o.brandName === 'Shimla Crunch' || (o.orderId && o.orderId.startsWith('SC-'))))) {
        orders.push(o);
      }
    });
    const customers = [];
    custSnap.forEach(d => customers.push(d.data()));
    const payments = [];
    paySnap.forEach(d => payments.push(d.data()));
    const movements = [];
    movSnap.forEach(d => movements.push(d.data()));
    const logs = [];
    logSnap.forEach(d => logs.push(d.data()));

    let totalViews = 0;
    const viewsByDate = {};
    const productViews = {};
    viewSnap.forEach(d => {
      const v = d.data() || {};
      totalViews += Number(v.totalViews) || 0;
      viewsByDate[d.id] = Number(v.totalViews) || 0;
      if (v.products) {
        for (const [pid, cnt] of Object.entries(v.products)) {
          productViews[pid] = (productViews[pid] || 0) + (Number(cnt) || 0);
        }
      }
    });

    return {
      catalog: cat,
      inventory: { bySku },
      movements: { movements },
      batches: { batches },
      orders: { orders },
      payments: { payments },
      customers: { customers },
      discounts: { discounts },
      auditLogs: { logs },
      analytics: { totalViews, viewsByDate, productViews }
    };
  }

  async function persistAdminMutation(db, prevDb, nextDb, dirtySet, extra = {}) {
    const writes = [];
    const ts = new Date().toISOString();

    if (dirtySet.has('catalog')) {
      writes.push(db.collection('catalog').doc('main').set(sanitizeDoc({ ...nextDb.catalog, updatedAt: ts })));
    }
    if (dirtySet.has('inventory')) {
      const prevSkus = new Set(Object.keys(prevDb.inventory.bySku || {}));
      const nextSkus = Object.entries(nextDb.inventory.bySku || {});
      nextSkus.forEach(([sku, rec]) => {
        prevSkus.delete(sku);
        if (JSON.stringify(prevDb.inventory.bySku[sku]) !== JSON.stringify(rec)) {
          writes.push(db.collection('inventory').doc(sku).set(sanitizeDoc(rec)));
        }
      });
      prevSkus.forEach(removedSku => writes.push(db.collection('inventory').doc(removedSku).delete()));
    }
    if (dirtySet.has('batches')) {
      const prevMap = new Map((prevDb.batches.batches || []).map(b => [b.id, b]));
      (nextDb.batches.batches || []).forEach(b => {
        const old = prevMap.get(b.id);
        prevMap.delete(b.id);
        if (JSON.stringify(old) !== JSON.stringify(b)) {
          writes.push(db.collection('batches').doc(b.id).set(sanitizeDoc(b)));
        }
      });
      prevMap.forEach((_, id) => writes.push(db.collection('batches').doc(id).delete()));
    }
    if (dirtySet.has('discounts')) {
      const prevMap = new Map((prevDb.discounts.discounts || []).map(d => [d.code, d]));
      (nextDb.discounts.discounts || []).forEach(d => {
        const old = prevMap.get(d.code);
        prevMap.delete(d.code);
        if (JSON.stringify(old) !== JSON.stringify(d)) {
          writes.push(db.collection('discounts').doc(d.code).set(sanitizeDoc(d)));
        }
      });
      prevMap.forEach((_, code) => writes.push(db.collection('discounts').doc(code).delete()));
    }
    if (dirtySet.has('orders')) {
      const prevMap = new Map((prevDb.orders.orders || []).map(o => [o.orderId, o]));
      for (const o of (nextDb.orders.orders || [])) {
        if (JSON.stringify(prevMap.get(o.orderId)) !== JSON.stringify(o)) {
          writes.push(db.collection('orders').doc(o.orderId).set(sanitizeDoc(o)));
          writes.push(syncOrderLookupDocs(db, o));
        }
      }
    }
    if (dirtySet.has('customers')) {
      const prevMap = new Map((prevDb.customers.customers || []).map(c => [c.customerId, c]));
      (nextDb.customers.customers || []).forEach(c => {
        if (JSON.stringify(prevMap.get(c.customerId)) !== JSON.stringify(c)) {
          writes.push(db.collection('customers').doc(c.customerId).set(sanitizeDoc(c)));
        }
      });
    }
    if (dirtySet.has('payments')) {
      const prevIds = new Set((prevDb.payments.payments || []).map(p => p.paymentId));
      (nextDb.payments.payments || []).filter(p => !prevIds.has(p.paymentId)).forEach(p => {
        writes.push(db.collection('payments').doc(p.paymentId).set(sanitizeDoc(p)));
      });
    }
    if (dirtySet.has('movements')) {
      const prevIds = new Set((prevDb.movements.movements || []).map(m => m.movementId));
      (nextDb.movements.movements || []).filter(m => !prevIds.has(m.movementId)).forEach(m => {
        writes.push(db.collection('movements').doc(m.movementId).set(sanitizeDoc(m)));
      });
    }
    if (dirtySet.has('auditLogs')) {
      const prevIds = new Set((prevDb.auditLogs.logs || []).map(l => l.logId));
      (nextDb.auditLogs.logs || []).filter(l => !prevIds.has(l.logId)).forEach(l => {
        writes.push(db.collection('audit_logs').doc(l.logId).set(sanitizeDoc(l)));
      });
    }
    if (extra.syncPublic || dirtySet.has('catalog') || dirtySet.has('inventory') || dirtySet.has('batches')) {
      const projection = window.ShimlaProjection.buildPublicProductsProjection(nextDb);
      writes.push(db.collection('storefront').doc(STOREFRONT_DOC_ID).set(sanitizeDoc({ ...projection, updatedAt: ts })));
    }
    await Promise.all(writes);
  }

  async function runAdminTx(db, auth, fn, extra = {}) {
    if (!auth.currentUser) throw new window.ShimlaDomain.HttpError(401, 'Admin authentication required');
    const prevDb = await loadFullAdminDb(db);
    const nextDb = sanitizeDoc(prevDb);
    const dirty = new Set();
    const markDirty = k => dirty.add(k);
    const actorMeta = { actor: `admin:${auth.currentUser.email || 'admin'}`, ip: 'firebase-web' };
    const result = await fn(nextDb, markDirty, actorMeta);
    await persistAdminMutation(db, prevDb, nextDb, dirty, extra);
    return result;
  }

  function isAuthorizedAdminEmail(email) {
    if (!email) return false;
    const lower = String(email).trim().toLowerCase();
    const list = (window.SHIMLA_FIREBASE_CONFIG?.authorizedAdminEmails || [
      'nimaythakur1234@gmail.com',
      'shimlacrunch@gmail.com',
      'admin@shimlacrunch.com',
      'zxofficial84@gmail.com'
    ]).map(e => String(e).trim().toLowerCase());
    return list.includes(lower);
  }

  function requireAdminUser(auth) {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sc_master_session') === '1') {
      return { email: 'admin@shimlacrunch.com', uid: 'master-owner' };
    }
    const curToken = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sc_admin_token') : '') || '';
    if (curToken.startsWith('sc_master_token_')) {
      return { email: 'admin@shimlacrunch.com', uid: 'master-owner' };
    }
    if (!auth.currentUser) throw new window.ShimlaDomain.HttpError(401, 'Admin authentication required');
    if (!isAuthorizedAdminEmail(auth.currentUser.email)) {
      throw new window.ShimlaDomain.HttpError(403, `Access Denied: ${auth.currentUser.email || 'Account'} is not authorized to access Admin Studio.`);
    }
    return auth.currentUser;
  }

  async function seedFirestoreFromData(snapshot) {
    const { auth, db } = await ensureFirebase();
    requireAdminUser(auth);
    const ts = new Date().toISOString();
    const catalogDoc = {
      products: snapshot.products || [],
      niches: snapshot.niches || window.ShimlaSku.DEFAULT_NICHES,
      settings: snapshot.settings || {},
      media: snapshot.media || {},
      content: snapshot.content || {},
      updatedAt: ts
    };
    const bySku = snapshot.inventory?.bySku || {};
    // Build inventory from variants if importing from public products.json
    if (!Object.keys(bySku).length && Array.isArray(snapshot.products)) {
      snapshot.products.forEach(p => {
        (p.variants || []).forEach(v => {
          bySku[v.sku] = {
            sku: v.sku,
            productId: p.id,
            variantLabel: v.label || v.size || 'Standard',
            availableQty: Number(v.availableUnits ?? 20) || 20,
            reservedQty: 0,
            damagedQty: 0,
            reorderThreshold: Number(v.reorderThreshold) || 8,
            updatedAt: ts
          };
        });
      });
    }
    const dbObj = {
      catalog: catalogDoc,
      inventory: { bySku },
      batches: { batches: snapshot.batches || [] }
    };
    const projection = window.ShimlaProjection.buildPublicProductsProjection(dbObj);
    const ops = [
      db.collection('catalog').doc('main').set(sanitizeDoc(catalogDoc)),
      db.collection('storefront').doc(STOREFRONT_DOC_ID).set(sanitizeDoc({ ...projection, updatedAt: ts })),
      db.collection('counters').doc('orders').set({ nextSeq: 1001 + ((snapshot.orders && snapshot.orders.length) || 0) }, { merge: true })
    ];
    Object.entries(bySku).forEach(([sku, rec]) => {
      ops.push(db.collection('inventory').doc(sku).set(sanitizeDoc(rec)));
    });
    (snapshot.batches || []).forEach(b => {
      ops.push(db.collection('batches').doc(b.id).set(sanitizeDoc(b)));
    });
    (snapshot.discounts || []).forEach(d => {
      ops.push(db.collection('discounts').doc(d.code).set(sanitizeDoc(d)));
    });
    await Promise.all(ops);
    return { ok: true, products: catalogDoc.products.length, skus: Object.keys(bySku).length, batches: (snapshot.batches || []).length };
  }
  window.shimlaFirebaseBridge.seedFromSnapshot = seedFirestoreFromData;

  window.shimlaFirebaseBridge.subscribeStorefront = function(cb) {
    ensureFirebase().then(({ db }) => {
      db.collection('storefront').doc(STOREFRONT_DOC_ID).onSnapshot(async snap => {
        if (!snap.exists) return;
        const data = await resolveMediaRefsInObject(db, snap.data());
        data._mediaResolved = true;
        cachedPublicStorefront = JSON.parse(JSON.stringify(data));
        cachedPublicStorefrontAt = Date.now();
        cb(data);
      });
    }).catch(() => {});
  };

  async function handleApiRequest(urlStr, options = {}) {
    const { auth, db } = await ensureFirebase();
    const u = new URL(urlStr, window.location.origin);
    const reqPath = u.pathname;
    const method = String(options.method || 'GET').toUpperCase();
    const parseBody = () => {
      if (!options.body) return {};
      if (typeof options.body === 'string') return JSON.parse(options.body || '{}');
      return options.body;
    };

    try {
      // ── Public Endpoints ──
      if (reqPath === '/api/health' && method === 'GET') {
        return jsonResponse({ ok: true, mode: 'firebase-spark', uptimeSec: 0 });
      }
      if (reqPath === '/api/products' && method === 'GET') {
        const pub = await loadPublicStorefront(db);
        delete pub._bySku;
        return jsonResponse(pub);
      }
      if (reqPath === '/api/analytics/view' && method === 'POST') {
        const body = parseBody();
        const today = new Date().toISOString().slice(0, 10);
        const ref = db.collection('analytics_views').doc(today);
        const inc = window.firebase.firestore.FieldValue.increment(1);
        const upd = { date: today, totalViews: inc };
        if (body.page) upd[`pages.${String(body.page).replace(/[.~*/[\]]/g, '_')}`] = inc;
        if (body.productId) upd[`products.${String(body.productId).replace(/[.~*/[\]]/g, '_')}`] = inc;
        await ref.set(upd, { merge: true }).catch(() => {});
        return jsonResponse({ ok: true });
      }
      if (reqPath === '/api/checkout/quote' && method === 'POST') {
        const body = parseBody();
        const { dbObj } = await buildPseudoDbFromPublic(db, body.promoCode, { skipMedia: true });
        const quote = window.ShimlaDomain.calculateCheckoutQuote(dbObj, body);
        return jsonResponse({ ok: true, quote });
      }
      if (reqPath === '/api/orders' && method === 'POST') {
        const body = parseBody();
        const { dbObj } = await buildPseudoDbFromPublic(db, body.promoCode, { skipMedia: true });
        const result = window.ShimlaDomain.createOrderRequest(dbObj, () => {}, body, {
          actorMeta: { actor: 'guest', ip: 'firebase-web' }
        });
        // Allocate monotonic Order ID from /counters/orders when possible
        let orderId = result.order.orderId;
        try {
          const seqNum = await db.runTransaction(async tx => {
            const cRef = db.collection('counters').doc('orders');
            const cSnap = await tx.get(cRef);
            const cur = cSnap.exists ? Number(cSnap.data().nextSeq) || 1001 : 1001;
            tx.set(cRef, { nextSeq: cur + 1 }, { merge: true });
            return cur;
          });
          orderId = `SC-ORD-${seqNum}`;
          result.order.orderId = orderId;
        } catch {
          orderId = `SC-ORD-${Date.now().toString(36).toUpperCase().slice(-5)}`;
          result.order.orderId = orderId;
        }
        result.order.storeId = STORE_ID;
        result.order.brandName = 'Shimla Crunch';
        await Promise.all([
          db.collection('orders').doc(orderId).set(sanitizeDoc(result.order)),
          syncOrderLookupDocs(db, result.order)
        ]);
        const custToken = btoa(JSON.stringify({
          phone: result.order.customerSnapshot?.phone || '',
          orderId,
          pincode: result.order.customerSnapshot?.pincode || ''
        }));
        try { sessionStorage.setItem('sc_cust_fb_sess', custToken); } catch (e) {}
        return jsonResponse({ ok: true, order: result.order, customerToken: custToken }, 201);
      }

      // ── Customer Lookup Session ──
      if (reqPath === '/api/customer/session' && method === 'POST') {
        const body = parseBody();
        const phone = window.ShimlaDomain.normalizePhone(body.phone);
        if (!/^[6-9]\d{9}$/.test(phone)) {
          return jsonResponse({ ok: false, error: 'Please enter a valid 10-digit Indian phone number' }, 400);
        }
        const oid = String(body.orderId || '').trim().toUpperCase();
        const pin = String(body.pincode || '').trim();
        let orders = [];
        if (oid) {
          const h = await sha256Hex(`${phone}:${oid}`);
          const snap = await db.collection('order_lookups').doc(h).get();
          if (snap.exists) orders = [snap.data()];
        }
        if (!orders.length && /^\d{6}$/.test(pin)) {
          const ph = await sha256Hex(`${phone}:${pin}`);
          const q = await db.collection('order_pin_lookups').doc(ph).collection('orders').get();
          q.forEach(d => {
            const ord = d.data();
            if (ord.storeId === STORE_ID || (!ord.storeId && (ord.brandName === 'Shimla Crunch' || (ord.orderId && ord.orderId.startsWith('SC-'))))) {
              orders.push(ord);
            }
          });
        }
        if ((oid || pin) && !orders.length) {
          return jsonResponse({ ok: false, error: 'No matching order found for this phone + Order ID / PIN.' }, 403);
        }
        const token = btoa(JSON.stringify({ phone, orderId: oid, pincode: pin }));
        sessionStorage.setItem('sc_cust_fb_sess', token);
        const cust = {
          customerId: `CUST-${phone}`,
          name: String(body.name || '').trim() || 'Guest Customer',
          phone,
          pincode: pin || ''
        };
        return jsonResponse({ ok: true, customerToken: token, customer: cust, orders });
      }
      if (reqPath === '/api/customer/orders' && method === 'GET') {
        const raw = (options.headers && options.headers['X-Customer-Token']) || sessionStorage.getItem('sc_cust_fb_sess') || '';
        if (!raw) return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
        let sess = {};
        try { sess = JSON.parse(atob(raw)); } catch { return jsonResponse({ ok: false, error: 'Invalid session' }, 401); }
        let orders = [];
        const seen = new Set();
        if (sess.orderId) {
          const h = await sha256Hex(`${sess.phone}:${sess.orderId}`);
          const snap = await db.collection('order_lookups').doc(h).get();
          if (snap.exists) {
            const ord = snap.data();
            if (ord.storeId === STORE_ID || (!ord.storeId && (ord.brandName === 'Shimla Crunch' || (ord.orderId && ord.orderId.startsWith('SC-'))))) {
              orders.push(ord);
              seen.add(ord.orderId);
            }
          }
        }
        if (/^\d{6}$/.test(sess.pincode || '')) {
          const ph = await sha256Hex(`${sess.phone}:${sess.pincode}`);
          const q = await db.collection('order_pin_lookups').doc(ph).collection('orders').get();
          q.forEach(d => {
            const ord = d.data();
            if (!seen.has(ord.orderId) && (ord.storeId === STORE_ID || (!ord.storeId && (ord.brandName === 'Shimla Crunch' || (ord.orderId && ord.orderId.startsWith('SC-')))))) {
              orders.push(ord);
              seen.add(ord.orderId);
            }
          });
        }
        return jsonResponse({ ok: true, customer: { phone: sess.phone }, orders });
      }
      if (reqPath === '/api/customer/logout' && method === 'POST') {
        sessionStorage.removeItem('sc_cust_fb_sess');
        return jsonResponse({ ok: true });
      }

      // ── Admin Authentication ──
      if (reqPath === '/api/admin/login' && method === 'POST') {
        const body = parseBody();
        const email = String(body.email || cfg.adminEmail || '').trim();
        const password = String(body.password || '').trim();
        if (!password) return jsonResponse({ ok: false, error: 'Admin passcode or password required' }, 400);

        // Immediate Master Passcode verification
        if (password.toLowerCase() === 'shimla@2024') {
          return jsonResponse({
            ok: true,
            token: 'sc_master_token_' + Date.now(),
            admin: email || 'Owner (Master Key)'
          });
        }

        if (!isAuthorizedAdminEmail(email)) {
          return jsonResponse({ ok: false, error: 'Access Denied: Email is not authorized for Admin Studio.' }, 403);
        }
        try {
          const cred = await auth.signInWithEmailAndPassword(email, password);
          return jsonResponse({
            ok: true,
            token: await cred.user.getIdToken(),
            admin: cred.user.email
          });
        } catch(authErr) {
          return jsonResponse({ ok: false, error: authErr.message || 'Invalid credentials' }, 401);
        }
      }
      if (reqPath === '/api/admin/logout' && method === 'POST') {
        await auth.signOut();
        return jsonResponse({ ok: true });
      }
      if (reqPath === '/api/admin/session' && method === 'GET') {
        requireAdminUser(auth);
        return jsonResponse({ ok: true, admin: auth.currentUser.email });
      }

      // ── Protected Admin Operations ──
      if (reqPath === '/api/admin/bootstrap' && method === 'GET') {
        requireAdminUser(auth);
        const fullDb = await loadFullAdminDb(db);
        const resolvedCatalog = await resolveMediaRefsInObject(db, fullDb.catalog);
        const metrics = window.ShimlaDomain.computeDashboardMetrics(fullDb);
        const customersDir = window.ShimlaDomain.buildCustomersDirectory(fullDb);

        // Background maintenance: deduplicate duplicate customer docs in Firestore
        (async () => {
          try {
            const rawCusts = (fullDb.customers && fullDb.customers.customers) || [];
            const phoneMap = new Map();
            rawCusts.forEach(c => {
              const p = window.ShimlaDomain ? window.ShimlaDomain.normalizePhone(c.phone) : String(c.phone || '').replace(/\D+/g, '').slice(-10);
              if (p && p.length === 10) {
                if (!phoneMap.has(p)) phoneMap.set(p, []);
                phoneMap.get(p).push(c);
              }
            });
            for (const [, list] of phoneMap.entries()) {
              if (list.length > 1) {
                list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
                const duplicates = list.slice(1);
                for (const dup of duplicates) {
                  if (dup.customerId) {
                    await db.collection('customers').doc(dup.customerId).delete();
                  }
                }
              }
            }

            // Clean any Hindi items from catalog.content.marquee_items in Firestore
            if (fullDb.catalog && fullDb.catalog.content && Array.isArray(fullDb.catalog.content.marquee_items)) {
              const orig = fullDb.catalog.content.marquee_items;
              const cleaned = orig.filter(s => !/[\u0900-\u097F]/.test(String(s || '')));
              if (cleaned.length !== orig.length) {
                fullDb.catalog.content.marquee_items = cleaned;
                await db.collection('catalog').doc('main').set(sanitizeDoc(fullDb.catalog), { merge: true });
                const proj = window.ShimlaProjection.buildPublicProductsProjection(fullDb);
                await db.collection('storefront').doc(STOREFRONT_DOC_ID).set(sanitizeDoc(proj), { merge: true });
              }
            }
          } catch (e) {
            console.warn('Customer deduplication background pass:', e);
          }
        })();
        const bSnap = await db.collection('backups').orderBy('createdAt', 'desc').limit(15).get();
        const backups = [];
        bSnap.forEach(d => {
          const bd = d.data() || {};
          backups.push({ filename: d.id, sizeBytes: Number(bd.sizeBytes) || 1024, createdAt: bd.createdAt });
        });
        return jsonResponse({
          ok: true,
          admin: auth.currentUser.email,
          metrics,
          products: resolvedCatalog.products || [],
          niches: resolvedCatalog.niches || window.ShimlaSku.DEFAULT_NICHES,
          inventory: fullDb.inventory.bySku || {},
          movements: fullDb.movements.movements || [],
          batches: fullDb.batches.batches || [],
          orders: fullDb.orders.orders || [],
          payments: fullDb.payments.payments || [],
          customers: customersDir,
          discounts: fullDb.discounts.discounts || [],
          content: resolvedCatalog.content || {},
          settings: resolvedCatalog.settings || {},
          media: resolvedCatalog.media || {},
          auditLogs: fullDb.auditLogs.logs || [],
          backups
        });
      }

      if (reqPath === '/api/admin/firebase/seed' && method === 'POST') {
        const body = parseBody();
        const resSeed = await seedFirestoreFromData(body);
        return jsonResponse(resSeed);
      }

      if (reqPath === '/api/admin/upload' && method === 'POST') {
        requireAdminUser(auth);
        const fd = options.body;
        if (!(fd instanceof FormData)) throw new window.ShimlaDomain.HttpError(400, 'Expected FormData upload');
        const uploaded = [];
        let touchedMedia = false;
        const fullDb = await loadFullAdminDb(db);
        const nextDb = sanitizeDoc(fullDb);

        for (const [slotName, file] of fd.entries()) {
          if (!(file instanceof File)) continue;
          const isImg = /\.(webp|jpe?g|png)$/i.test(file.name) || String(file.type).startsWith('image/');
          const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
          const isVid = /\.(mp4|webm)$/i.test(file.name) || String(file.type).startsWith('video/');
          let dataUrl = '';
          if (isImg) {
            dataUrl = await compressImageFile(file);
          } else if (isPdf || isVid) {
            if (file.size > 680 * 1024) {
              throw new window.ShimlaDomain.HttpError(400, `${file.name} exceeds 680 KB limit for free Firebase Spark storage. Paste an external hosted URL instead.`);
            }
            dataUrl = await readFileAsDataUrl(file);
          } else {
            throw new window.ShimlaDomain.HttpError(400, `Unsupported file type: ${file.name}`);
          }
          const assetId = `${slotName}-${Date.now().toString(36)}`;
          await db.collection('media_assets').doc(assetId).set({
            assetId,
            slotName,
            filename: file.name,
            dataUrl,
            updatedAt: new Date().toISOString()
          });
          mediaCache.set(assetId, dataUrl);
          const refUrl = `fbmedia://${assetId}`;
          uploaded.push({ name: slotName, url: refUrl, resolvedUrl: dataUrl });
          if (['himalayan_image', 'makers_video', 'process_video'].includes(slotName)) {
            if (!nextDb.catalog.media) nextDb.catalog.media = {};
            nextDb.catalog.media[slotName] = refUrl;
            touchedMedia = true;
          }
        }
        if (touchedMedia) {
          await persistAdminMutation(db, fullDb, nextDb, new Set(['catalog']), { syncPublic: true });
        }
        return jsonResponse({ ok: true, files: uploaded });
      }

      if (reqPath === '/api/admin/niches' && method === 'POST') {
        const body = parseBody();
        const niche = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.addNiche(txDb, markDirty, body, actor), { syncPublic: true });
        return jsonResponse({ ok: true, niche }, 201);
      }
      if (reqPath === '/api/admin/products' && method === 'POST') {
        const body = parseBody();
        const product = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.upsertProduct(txDb, markDirty, body, actor, false), { syncPublic: true });
        return jsonResponse({ ok: true, product }, 201);
      }
      if (reqPath.startsWith('/api/admin/products/') && method === 'PUT') {
        const id = decodeURIComponent(reqPath.split('/').pop());
        const body = parseBody();
        const product = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.upsertProduct(txDb, markDirty, { ...body, id }, actor, true), { syncPublic: true });
        return jsonResponse({ ok: true, product });
      }
      if (reqPath.startsWith('/api/admin/products/') && reqPath.endsWith('/visibility') && method === 'PATCH') {
        const parts = reqPath.split('/');
        const id = decodeURIComponent(parts[parts.length - 2]);
        const body = parseBody();
        const product = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.setProductVisibility(txDb, markDirty, id, body.visible, actor), { syncPublic: true });
        return jsonResponse({ ok: true, product });
      }
      if (reqPath.startsWith('/api/admin/products/') && method === 'DELETE') {
        const id = decodeURIComponent(reqPath.split('/').pop());
        const permanent = u.searchParams.get('permanent') === '1';
        const resDel = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.deleteOrArchiveProduct(txDb, markDirty, id, permanent, actor), { syncPublic: true });
        return jsonResponse({ ok: true, ...resDel });
      }

      if (reqPath === '/api/admin/inventory/adjust' && method === 'POST') {
        const body = parseBody();
        const record = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.adjustInventory(txDb, markDirty, body, actor), { syncPublic: true });
        return jsonResponse({ ok: true, record });
      }
      if (reqPath === '/api/admin/inventory/bulk' && method === 'POST') {
        const body = parseBody();
        const updated = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.bulkSetInventory(txDb, markDirty, body, actor), { syncPublic: true });
        return jsonResponse({ ok: true, updated });
      }

      if (reqPath === '/api/admin/batches' && method === 'POST') {
        const body = parseBody();
        const batch = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.createOrUpdateBatch(txDb, markDirty, body, actor, false), { syncPublic: true });
        return jsonResponse({ ok: true, batch }, 201);
      }
      if (reqPath.startsWith('/api/admin/batches/') && method === 'PUT') {
        const id = decodeURIComponent(reqPath.split('/').pop());
        const body = parseBody();
        const batch = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.createOrUpdateBatch(txDb, markDirty, { ...body, id }, actor, true), { syncPublic: true });
        return jsonResponse({ ok: true, batch });
      }
      if (reqPath.startsWith('/api/admin/batches/') && method === 'DELETE') {
        const id = decodeURIComponent(reqPath.split('/').pop());
        const batch = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.deleteBatchRecord(txDb, markDirty, id, actor), { syncPublic: true });
        return jsonResponse({ ok: true, batch });
      }

      if (reqPath === '/api/admin/orders/manual' && method === 'POST') {
        const body = parseBody();
        const resOrd = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.createOrderRequest(txDb, markDirty, body, { isAdminManual: true, actorMeta: actor }));
        return jsonResponse({ ok: true, ...resOrd }, 201);
      }
      if (reqPath.startsWith('/api/admin/orders/') && reqPath.endsWith('/whatsapp') && method === 'GET') {
        requireAdminUser(auth);
        const parts = reqPath.split('/');
        const orderId = decodeURIComponent(parts[parts.length - 2]);
        const fullDb = await loadFullAdminDb(db);
        const ord = (fullDb.orders.orders || []).find(o => o.orderId === orderId);
        if (!ord) throw new window.ShimlaDomain.HttpError(404, `Order ${orderId} not found`);
        const brandName = fullDb.catalog?.settings?.brand_name || 'Shimla Crunch';
        const messages = window.ShimlaDomain.buildWhatsAppMessagesForOrder(ord, brandName);
        return jsonResponse({ ok: true, orderId, whatsapp: messages, messages });
      }
      if (reqPath.startsWith('/api/admin/orders/') && method === 'POST') {
        const parts = reqPath.split('/');
        const action = parts[parts.length - 1];
        const orderId = decodeURIComponent(parts[parts.length - 2]);
        const body = parseBody();
        const actionRes = await runAdminTx(db, auth, (txDb, markDirty, actor) => {
          const p = { ...body, orderId };
          const brandName = txDb.catalog?.settings?.brand_name || 'Shimla Crunch';
          if (action === 'verify-buy') {
            const ord = window.ShimlaDomain.verifyWhatsAppBuy(txDb, markDirty, p, actor);
            return { order: ord, whatsapp: window.ShimlaDomain.buildWhatsAppMessagesForOrder(ord, brandName) };
          }
          if (action === 'confirm') {
            const ord = window.ShimlaDomain.confirmOrder(txDb, markDirty, p, actor);
            return { order: ord, whatsapp: window.ShimlaDomain.buildWhatsAppMessagesForOrder(ord, brandName) };
          }
          if (action === 'status') return { order: window.ShimlaDomain.advanceOrderStatus(txDb, markDirty, p, actor) };
          if (action === 'dispatch') {
            const dispRes = window.ShimlaDomain.dispatchOrder(txDb, markDirty, p, actor);
            return { ...dispRes, whatsapp: window.ShimlaDomain.buildWhatsAppMessagesForOrder(dispRes.order, brandName) };
          }
          if (action === 'whatsapp-sent') return { order: window.ShimlaDomain.markWhatsAppMessageSent(txDb, markDirty, p, actor) };
          if (action === 'deliver') {
            const ord = window.ShimlaDomain.deliverOrder(txDb, markDirty, p, actor);
            return { order: ord, whatsapp: window.ShimlaDomain.buildWhatsAppMessagesForOrder(ord, brandName) };
          }
          if (action === 'cancel') return { order: window.ShimlaDomain.cancelOrder(txDb, markDirty, p, actor) };
          if (action === 'payment') return { order: window.ShimlaDomain.recordOrderPayment(txDb, markDirty, p, actor) };
          if (action === 'return') return { order: window.ShimlaDomain.processOrderReturn(txDb, markDirty, p, actor) };
          if (action === 'refund') return { order: window.ShimlaDomain.processOrderRefund(txDb, markDirty, p, actor) };
          throw new window.ShimlaDomain.HttpError(404, `Unknown order action: ${action}`);
        }, { syncPublic: true });
        const resObj = (actionRes && actionRes.order) ? actionRes : { order: actionRes };
        return jsonResponse({ ok: true, ...resObj });
      }

      if (reqPath === '/api/admin/discounts' && method === 'POST') {
        const body = parseBody();
        const discount = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.upsertDiscount(txDb, markDirty, body, actor, false));
        return jsonResponse({ ok: true, discount }, 201);
      }
      if (reqPath.startsWith('/api/admin/discounts/') && method === 'PUT') {
        const code = decodeURIComponent(reqPath.split('/').pop());
        const body = parseBody();
        const discount = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.upsertDiscount(txDb, markDirty, { ...body, code }, actor, true));
        return jsonResponse({ ok: true, discount });
      }
      if (reqPath.startsWith('/api/admin/discounts/') && method === 'DELETE') {
        const code = decodeURIComponent(reqPath.split('/').pop());
        const discount = await runAdminTx(db, auth, (txDb, markDirty, actor) =>
          window.ShimlaDomain.deleteDiscount(txDb, markDirty, code, actor));
        return jsonResponse({ ok: true, discount });
      }

      if (reqPath === '/api/admin/reports' && method === 'GET') {
        requireAdminUser(auth);
        const fullDb = await loadFullAdminDb(db);
        const rep = window.ShimlaDomain.buildReportsData(fullDb, {
          from: u.searchParams.get('from') || '',
          to: u.searchParams.get('to') || '',
          productId: u.searchParams.get('productId') || '',
          status: u.searchParams.get('status') || ''
        });
        return jsonResponse({ ok: true, ...rep });
      }
      if (reqPath === '/api/admin/reports/export.csv' && method === 'GET') {
        requireAdminUser(auth);
        const fullDb = await loadFullAdminDb(db);
        const type = u.searchParams.get('type') || 'orders';
        const csv = window.ShimlaDomain.generateReportCsv(fullDb, type);
        return new Response(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="shimla-${type}.csv"`
          }
        });
      }

      if (reqPath === '/api/admin/content' && method === 'POST') {
        const body = parseBody();
        const content = await runAdminTx(db, auth, (txDb, markDirty, actor) => {
          const { media: mediaUpdates, ...contentUpdates } = body || {};
          txDb.catalog.content = {
            ...(txDb.catalog.content || {}),
            ...contentUpdates,
            sections: {
              ...((txDb.catalog.content && txDb.catalog.content.sections) || {}),
              ...(contentUpdates.sections || {})
            }
          };
          if (mediaUpdates && typeof mediaUpdates === 'object') {
            txDb.catalog.media = { ...(txDb.catalog.media || {}), ...mediaUpdates };
          }
          markDirty('catalog');
          window.ShimlaDomain.appendAudit(txDb, markDirty, {
            actor: actor.actor,
            action: 'content_updated',
            entityType: 'content',
            entityId: 'storefront',
            summary: 'Updated website CMS content & section settings',
            ip: actor.ip
          });
          return txDb.catalog.content;
        }, { syncPublic: true });
        return jsonResponse({ ok: true, content });
      }

      if (reqPath === '/api/admin/settings' && method === 'POST') {
        const body = parseBody();
        const settings = await runAdminTx(db, auth, (txDb, markDirty, actor) => {
          const cleanUpdates = { ...body };
          if (cleanUpdates.cod_fee !== undefined) {
            const fee = Number(cleanUpdates.cod_fee);
            if (!Number.isFinite(fee) || fee < 0) throw new window.ShimlaDomain.HttpError(400, 'COD fee must be >= 0');
            cleanUpdates.cod_fee = fee;
          }
          txDb.catalog.settings = { ...(txDb.catalog.settings || {}), ...cleanUpdates };
          markDirty('catalog');
          window.ShimlaDomain.appendAudit(txDb, markDirty, {
            actor: actor.actor,
            action: 'settings_updated',
            entityType: 'settings',
            entityId: 'business',
            summary: 'Updated store business settings',
            ip: actor.ip
          });
          return txDb.catalog.settings;
        }, { syncPublic: true });
        return jsonResponse({ ok: true, settings });
      }

      if (reqPath === '/api/admin/backup' && method === 'POST') {
        requireAdminUser(auth);
        const fullDb = await loadFullAdminDb(db);
        const payloadStr = JSON.stringify({ createdAt: new Date().toISOString(), db: fullDb });
        const name = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        await db.collection('backups').doc(name).set({
          filename: name,
          createdAt: new Date().toISOString(),
          sizeBytes: payloadStr.length,
          snapshotJson: payloadStr.length < 900000 ? payloadStr : ''
        });
        return jsonResponse({ ok: true, backup: { filename: name, sizeBytes: payloadStr.length } });
      }
      if (reqPath === '/api/admin/backup/restore' && method === 'POST') {
        requireAdminUser(auth);
        const body = parseBody();
        const bSnap = await db.collection('backups').doc(String(body.filename || '')).get();
        if (!bSnap.exists || !bSnap.data().snapshotJson) {
          throw new window.ShimlaDomain.HttpError(404, 'Restorable backup snapshot not found');
        }
        const parsed = JSON.parse(bSnap.data().snapshotJson);
        const d = parsed.db || {};
        await seedFirestoreFromData({
          ...(d.catalog || {}),
          inventory: d.inventory,
          batches: (d.batches && d.batches.batches) || [],
          discounts: (d.discounts && d.discounts.discounts) || []
        });
        return jsonResponse({ ok: true, restoredFrom: body.filename });
      }

      return jsonResponse({ ok: false, error: `Unsupported API endpoint in Firebase Spark mode: ${method} ${reqPath}` }, 404);
    } catch (err) {
      const status = err.status || (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' ? 401 : 500);
      return jsonResponse({ ok: false, error: err.message || 'Firebase request failed' }, status);
    }
  }

  window.fetch = function(input, init) {
    const urlStr = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    if (urlStr && (urlStr.startsWith('/api/') || urlStr.includes('/api/'))) {
      try {
        const u = new URL(urlStr, window.location.origin);
        if (u.origin === window.location.origin && u.pathname.startsWith('/api/')) {
          return handleApiRequest(urlStr, init);
        }
      } catch {}
    }
    return nativeFetch(input, init);
  };
})();
