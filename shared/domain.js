/**
 * Shimla Wali — Authoritative Domain Logic, State Machines, Pricing & Reporting
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./sku'), require('crypto'));
  } else {
    root.ShimlaDomain = factory(root.ShimlaSku, null);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function(skuHelpers, nodeCrypto) {
const {
  DEFAULT_NICHES,
  normalizeNicheTag,
  normalizeSku,
  isValidSku,
  buildStructuredSku,
  buildStructuredBatchId,
  computeDiscountPercent
} = skuHelpers;

function randomHexBytes(byteLen) {
  if (nodeCrypto && typeof nodeCrypto.randomBytes === 'function') {
    return nodeCrypto.randomBytes(byteLen).toString('hex').toUpperCase();
  }
  const arr = new Uint8Array(byteLen);
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < byteLen; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

class HttpError extends Error {
  constructor(status, message, code = 'ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomHexBytes(2)}`;
}

function normalizePhone(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

function sanitizeHttpUrl(rawUrl) {
  const s = String(rawUrl || '').trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : '';
}

const COURIER_URL_TEMPLATES = {
  delhivery: awb => `https://www.delhivery.com/track/package/${awb}`,
  bluedart: awb => `https://www.bluedart.com/tracking?handler=tnt&action=awbquery&awb=awb&numbers=${awb}`,
  dtdc: awb => `https://www.dtdc.in/tracking.asp?strCnno=${awb}`,
  indiapost: () => `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`,
  xpressbees: awb => `https://www.xpressbees.com/shipment/tracking?awbNo=${awb}`,
  shadowfax: awb => `https://tracker.shadowfax.in/#/track?waybill=${awb}`,
  ecomexpress: awb => `https://ecomexpress.in/tracking/?awb_field=${awb}`,
  shiprocket: awb => `https://www.shiprocket.in/shipment-tracking/?id=${awb}`
};

function buildCourierTrackingUrl(courier, trackingId, customTrackingUrl = '') {
  const explicit = sanitizeHttpUrl(customTrackingUrl);
  if (explicit) return explicit;
  const awb = String(trackingId || '').trim();
  const cKey = String(courier || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const fn = COURIER_URL_TEMPLATES[cKey];
  if (fn && awb) return fn(encodeURIComponent(awb));
  if (fn && cKey === 'indiapost') return fn('');
  if (awb && courier) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${String(courier).trim()} tracking ${awb}`)}`;
  }
  return '';
}

function buildWhatsAppMessagesForOrder(order, brandName = 'Shimla Wali') {
  const name = String(order.customerSnapshot?.name || 'Customer').trim();
  const phone = normalizePhone(order.customerSnapshot?.phone || '');
  const waTarget = phone ? `91${phone}` : '';
  const itemsLines = (order.itemsSnapshot || []).map(it =>
    `• ${it.productName} (${it.variantLabel}) × ${it.quantity} — ₹${Math.round(Number(it.lineTotal) || 0).toLocaleString('en-IN')}`
  ).join('\n');
  const itemsShippedLines = (order.itemsSnapshot || []).map(it =>
    `• ${it.productName} (${it.variantLabel}) × ${it.quantity}`
  ).join('\n');
  const totalStr = `₹${Math.round(Number(order.grandTotal) || 0).toLocaleString('en-IN')}`;

  const confirmMessage = [
    `Namaste ${name} ji 🙏`,
    `Thank you for ordering from *${brandName}*!`,
    '',
    `Your order *${order.orderId}* has been recorded and confirmed:`,
    itemsLines || '• Fresh Himalayan Harvest Pack',
    `*Order Total:* ${totalStr}`,
    '',
    'We are sharing payment & confirmation details with you shortly. Your order is being freshly packed in Shimla and will be dispatched soon!'
  ].join('\n');

  const ship = order.shippingDetails || {};
  const courierName = String(ship.courier || '').trim() || 'Courier Partner';
  const trackId = String(ship.trackingId || '').trim();
  const trackUrl = sanitizeHttpUrl(ship.trackingUrl || buildCourierTrackingUrl(courierName, trackId));
  const etaText = String(ship.expectedDeliveryText || '').trim() || 'In 2–4 days';

  const dispatchLines = [
    `Namaste ${name} ji 🙏`,
    `Good news — your *${brandName}* order *${order.orderId}* has been *DISPATCHED*! 📦`,
    '',
    '*Items Dispatched:*',
    itemsShippedLines || '• Fresh Himalayan Harvest Pack',
    '',
    `*Courier Partner:* ${courierName}`
  ];
  if (trackId) dispatchLines.push(`*Tracking ID:* ${trackId}`);
  if (trackUrl) dispatchLines.push(`*Track Your Parcel:* ${trackUrl}`);
  dispatchLines.push(`*Estimated Delivery:* ${etaText}`);
  dispatchLines.push('');
  dispatchLines.push('Thank you for supporting small Himachal farm families! 🌿');

  const dispatchMessage = dispatchLines.join('\n');

  const deliveredLines = [
    `Namaste ${name} ji 🙏`,
    `Your *${brandName}* parcel for order *${order.orderId}* has been *DELIVERED*! 🏡✨`,
    '',
    itemsShippedLines || '• Fresh Himalayan Harvest Pack',
    '',
    'We hope you love the pure, unadulterated taste of our handcrafted mountain harvest.',
    'For any queries, culinary guidance, or re-orders, you can reply directly to this chat.',
    '',
    'Thank you for being part of our Shimla Wali family! 🌿'
  ];
  const deliveredMessage = deliveredLines.join('\n');

  return {
    phone,
    confirm: {
      stage: 'confirm',
      phone,
      message: confirmMessage,
      waUrl: waTarget ? `https://wa.me/${waTarget}?text=${encodeURIComponent(confirmMessage)}` : ''
    },
    dispatch: {
      stage: 'dispatch',
      phone,
      trackingUrl: trackUrl,
      message: dispatchMessage,
      waUrl: waTarget ? `https://wa.me/${waTarget}?text=${encodeURIComponent(dispatchMessage)}` : ''
    },
    delivered: {
      stage: 'delivered',
      phone,
      message: deliveredMessage,
      waUrl: waTarget ? `https://wa.me/${waTarget}?text=${encodeURIComponent(deliveredMessage)}` : ''
    }
  };
}

function csvSafeCell(value) {
  let str = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function appendAudit(db, markDirty, { actor = 'admin', role = 'admin', action, entityType, entityId, summary, details = null, ip = 'unknown' }) {
  if (!db.auditLogs.logs) db.auditLogs.logs = [];
  db.auditLogs.logs.unshift({
    logId: makeId('LOG'),
    actor,
    role,
    action,
    entityType,
    entityId: String(entityId || ''),
    summary,
    details,
    ip,
    createdAt: nowIso()
  });
  db.auditLogs.logs = db.auditLogs.logs.slice(0, 2000);
  markDirty('auditLogs');
}

function recordMovement(db, markDirty, {
  sku,
  productId,
  movementType,
  qtyDelta,
  qtyBefore,
  qtyAfter,
  referenceOrderId = null,
  batchId = null,
  reason,
  createdBy = 'admin'
}) {
  if (!db.movements.movements) db.movements.movements = [];
  db.movements.movements.unshift({
    movementId: makeId('MOV'),
    sku,
    productId,
    movementType,
    qtyDelta,
    qtyBefore,
    qtyAfter,
    referenceOrderId,
    batchId,
    reason,
    createdBy,
    createdAt: nowIso()
  });
  db.movements.movements = db.movements.movements.slice(0, 5000);
  markDirty('movements');
}

function ensureInventoryRecord(db, markDirty, sku, productId, variantLabel, reorderThreshold = 8) {
  if (!db.inventory.bySku) db.inventory.bySku = {};
  if (!db.inventory.bySku[sku]) {
    db.inventory.bySku[sku] = {
      sku,
      productId,
      variantLabel: variantLabel || sku,
      availableQty: 0,
      reservedQty: 0,
      damagedQty: 0,
      reorderThreshold: Math.max(0, Number(reorderThreshold) || 8),
      updatedAt: nowIso()
    };
    markDirty('inventory');
  }
  return db.inventory.bySku[sku];
}

function resolveVariantAndProduct(db, itemInput, { requireVisible = false } = {}) {
  const products = (db.catalog && db.catalog.products) || [];
  const rawSku = itemInput.sku ? normalizeSku(itemInput.sku) : '';
  const rawProdId = String(itemInput.productId || itemInput.id || '').trim();
  const reqSize = String(itemInput.size || itemInput.variantLabel || '').trim().toLowerCase();
  const reqVariety = String(itemInput.variety || '').trim().toLowerCase();

  for (const prod of products) {
    if (prod.archived) continue;
    if (requireVisible && prod.visible === false) continue;

    if (rawSku) {
      const matched = (prod.variants || []).find(
        v => normalizeSku(v.sku) === rawSku || (v.legacySku && normalizeSku(v.legacySku) === rawSku)
      );
      if (matched) {
        if (requireVisible && matched.visible === false) continue;
        return { product: prod, variant: matched };
      }
      if (normalizeSku(prod.sku) === rawSku || normalizeSku(prod.legacySku) === rawSku) {
        const def = (prod.variants || []).find(v => v.isDefault) || (prod.variants || [])[0];
        if (def && (!requireVisible || def.visible !== false)) {
          return { product: prod, variant: def };
        }
      }
    }
  }

  if (rawProdId) {
    const prod = products.find(
      p => !p.archived && (p.id === rawProdId || rawProdId.startsWith(p.id + '-'))
    );
    if (prod && (!requireVisible || prod.visible !== false)) {
      const vars = (prod.variants || []).filter(v => !requireVisible || v.visible !== false);
      let matched = null;
      if (reqSize && reqVariety) {
        matched = vars.find(
          v => (v.size || '').toLowerCase() === reqSize && (v.variety || '').toLowerCase() === reqVariety
        );
      }
      if (!matched && reqSize) {
        matched = vars.find(v => (v.size || '').toLowerCase() === reqSize || (v.label || '').toLowerCase() === reqSize);
      }
      if (!matched) matched = vars.find(v => v.isDefault) || vars[0];
      if (matched) return { product: prod, variant: matched };
    }
  }

  return null;
}

// ── Niche & Product Catalog Management ──────────────────────────

function addNiche(db, markDirty, payload, actorMeta = {}) {
  const name = String(payload.name || '').trim();
  if (!name) throw new HttpError(400, 'Niche / category name is required');
  const tag = normalizeNicheTag(payload.tag || name);
  const id = String(payload.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
  if (!id) throw new HttpError(400, 'Valid niche slug required');

  const niches = db.catalog.niches || [...DEFAULT_NICHES];
  if (niches.some(n => n.id === id)) {
    throw new HttpError(409, `Niche "${id}" already exists`);
  }
  const entry = { id, name, tag };
  niches.push(entry);
  db.catalog.niches = niches;
  markDirty('catalog');
  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: 'niche_created',
    entityType: 'niche',
    entityId: tag,
    summary: `Added product niche "${name}" (${tag})`,
    ip: actorMeta.ip
  });
  return entry;
}

function collectAllExistingSkus(db, excludeProductId = null) {
  const skus = [];
  for (const p of db.catalog.products || []) {
    if (excludeProductId && p.id === excludeProductId) continue;
    if (p.sku) skus.push(p.sku);
    (p.variants || []).forEach(v => skus.push(v.sku));
  }
  return skus;
}

function upsertProduct(db, markDirty, payload, actorMeta = {}, isUpdate = false) {
  const title = String(payload.title || payload.name || '').trim();
  if (!title) throw new HttpError(400, 'Product title is required');

  const rawId = String(payload.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
  if (!rawId) throw new HttpError(400, 'Product ID is invalid');

  const existingIdx = (db.catalog.products || []).findIndex(p => p.id === rawId);
  if (!isUpdate && existingIdx !== -1) {
    throw new HttpError(409, `Product "${rawId}" already exists`);
  }
  if (isUpdate && existingIdx === -1) {
    throw new HttpError(404, `Product "${rawId}" not found`);
  }

  const existingProd = existingIdx !== -1 ? db.catalog.products[existingIdx] : null;
  const niche = String(payload.niche || payload.category || existingProd?.niche || 'ghee').trim().toLowerCase();
  const nicheObj = (db.catalog.niches || DEFAULT_NICHES).find(n => n.id === niche);
  const nicheTag = normalizeNicheTag(payload.nicheTag || (nicheObj && nicheObj.tag) || existingProd?.nicheTag || niche);

  const otherSkus = new Set(collectAllExistingSkus(db, existingProd?.id || null).map(s => s.toUpperCase()));
  const rawVariants = Array.isArray(payload.variants) && payload.variants.length > 0 ? payload.variants : null;

  let normalizedVariants = [];
  if (rawVariants) {
    const localSkus = new Set();
    normalizedVariants = rawVariants.map((v, idx) => {
      const size = String(v.size || v.label || 'Standard').trim();
      const variety = String(v.variety || '').trim();
      const candidateSku = v.sku
        ? normalizeSku(v.sku)
        : buildStructuredSku({
            nicheTag,
            size,
            variety,
            sequence: idx + 1,
            existingSkus: [...otherSkus, ...localSkus]
          });
      if (!isValidSku(candidateSku)) {
        throw new HttpError(400, `Invalid SKU format "${candidateSku}". Use uppercase letters, numbers, and hyphens.`);
      }
      if (otherSkus.has(candidateSku) || localSkus.has(candidateSku)) {
        throw new HttpError(409, `Duplicate SKU "${candidateSku}". Every variant must have a unique SKU.`);
      }
      localSkus.add(candidateSku);

      const price = Number(v.price);
      const mrp = Number(v.mrp ?? v.price);
      if (!Number.isFinite(price) || price < 0) throw new HttpError(400, `Invalid selling price for SKU ${candidateSku}`);
      if (!Number.isFinite(mrp) || mrp < price) throw new HttpError(400, `MRP must be >= selling price for SKU ${candidateSku}`);

      const reorderThreshold = Math.max(0, parseInt(v.reorderThreshold ?? payload.reorderThreshold ?? 8, 10) || 0);
      const inv = ensureInventoryRecord(db, markDirty, candidateSku, rawId, variety ? `${variety} · ${size}` : size, reorderThreshold);
      inv.productId = rawId;
      inv.variantLabel = variety ? `${variety} · ${size}` : size;
      inv.reorderThreshold = reorderThreshold;

      if (v.initialStock !== undefined && existingIdx === -1) {
        const initQty = Math.max(0, parseInt(v.initialStock, 10) || 0);
        if (initQty > 0) {
          inv.availableQty = initQty;
          recordMovement(db, markDirty, {
            sku: candidateSku,
            productId: rawId,
            movementType: 'stock_received',
            qtyDelta: initQty,
            qtyBefore: 0,
            qtyAfter: initQty,
            reason: 'Initial stock upon product creation',
            createdBy: actorMeta.actor || 'admin'
          });
        }
      }
      inv.updatedAt = nowIso();
      markDirty('inventory');

      return {
        sku: candidateSku,
        legacySku: v.legacySku || existingProd?.variants?.find(ov => ov.sku === candidateSku)?.legacySku || '',
        label: variety ? `${variety} · ${size}` : size,
        size,
        variety,
        price: Math.round(price),
        mrp: Math.round(mrp),
        discount: String(v.discount || '').trim() || computeDiscountPercent(price, mrp),
        reorderThreshold,
        isDefault: Boolean(v.isDefault),
        visible: v.visible !== false
      };
    });
    if (!normalizedVariants.some(v => v.isDefault)) {
      normalizedVariants[0].isDefault = true;
    } else {
      let seenDef = false;
      normalizedVariants.forEach(v => {
        if (v.isDefault) {
          if (seenDef) v.isDefault = false;
          else seenDef = true;
        }
      });
    }
  } else {
    const price = Number(payload.price ?? existingProd?.price);
    const mrp = Number(payload.mrp ?? payload.price ?? existingProd?.mrp ?? price);
    if (!Number.isFinite(price) || price < 0) throw new HttpError(400, 'Invalid selling price');
    if (!Number.isFinite(mrp) || mrp < price) throw new HttpError(400, 'MRP must be greater than or equal to selling price');

    const sizeLabel = String(payload.subtitle || existingProd?.variants?.[0]?.size || 'Standard Pack').trim();
    const candidateSku = payload.sku
      ? normalizeSku(payload.sku)
      : existingProd?.sku || buildStructuredSku({ nicheTag, size: sizeLabel, existingSkus: [...otherSkus] });
    if (!isValidSku(candidateSku)) throw new HttpError(400, `Invalid SKU "${candidateSku}"`);
    if (otherSkus.has(candidateSku)) throw new HttpError(409, `Duplicate SKU "${candidateSku}"`);

    const threshold = Math.max(0, parseInt(payload.reorderThreshold ?? 8, 10) || 0);
    const inv = ensureInventoryRecord(db, markDirty, candidateSku, rawId, sizeLabel, threshold);
    inv.reorderThreshold = threshold;
    if (payload.initialStock !== undefined && existingIdx === -1) {
      const initQty = Math.max(0, parseInt(payload.initialStock, 10) || 0);
      if (initQty > 0) {
        inv.availableQty = initQty;
        recordMovement(db, markDirty, {
          sku: candidateSku,
          productId: rawId,
          movementType: 'stock_received',
          qtyDelta: initQty,
          qtyBefore: 0,
          qtyAfter: initQty,
          reason: 'Initial stock upon product creation',
          createdBy: actorMeta.actor || 'admin'
        });
      }
    }
    inv.updatedAt = nowIso();
    markDirty('inventory');

    // If updating single top-level price/SKU on existing product, sync ONLY the primary default variant cleanly
    if (existingProd && Array.isArray(existingProd.variants) && existingProd.variants.length > 0) {
      const defIdx = Math.max(0, existingProd.variants.findIndex(v => v.isDefault));
      normalizedVariants = existingProd.variants.map((v, idx) => {
        if (idx !== defIdx) return { ...v, isDefault: false };
        return {
          ...v,
          isDefault: true,
          sku: payload.sku ? candidateSku : v.sku,
          price: Math.round(price),
          mrp: Math.round(mrp),
          discount: String(payload.discount || '').trim() || computeDiscountPercent(price, mrp),
          reorderThreshold: threshold
        };
      });
    } else {
      normalizedVariants = [
        {
          sku: candidateSku,
          legacySku: existingProd?.legacySku || '',
          label: sizeLabel,
          size: sizeLabel,
          variety: '',
          price: Math.round(price),
          mrp: Math.round(mrp),
          discount: String(payload.discount || '').trim() || computeDiscountPercent(price, mrp),
          reorderThreshold: threshold,
          isDefault: true,
          visible: true
        }
      ];
    }
  }

  const defVar = normalizedVariants.find(v => v.isDefault) || normalizedVariants[0];
  const img = String(payload.image || existingProd?.image || './images/shimla-ghee.webp').trim();
  const gallery = Array.isArray(payload.gallery) && payload.gallery.length
    ? payload.gallery.map(x => String(x).trim()).filter(Boolean)
    : existingProd?.gallery?.length
      ? existingProd.gallery
      : [img];

  const varieties = Array.isArray(payload.varieties)
    ? payload.varieties.map(x => String(x).trim()).filter(Boolean)
    : [...new Set(normalizedVariants.map(v => v.variety).filter(Boolean))];

  const productDoc = {
    ...(existingProd || {}),
    id: rawId,
    slug: rawId,
    title,
    subtitle: String(payload.subtitle ?? existingProd?.subtitle ?? defVar.label).trim(),
    niche,
    nicheTag,
    category: String(payload.category || niche).trim().toLowerCase(),
    sku: defVar.sku,
    legacySku: existingProd?.legacySku || '',
    price: defVar.price,
    mrp: defVar.mrp,
    discount: defVar.discount || computeDiscountPercent(defVar.price, defVar.mrp),
    image: img,
    gallery,
    link: `product.html?id=${encodeURIComponent(rawId)}`,
    badge: String(payload.badge ?? existingProd?.badge ?? 'Artisanal').trim(),
    rating: Number(payload.rating ?? existingProd?.rating ?? 4.9) || 4.9,
    reviews: Number(payload.reviews ?? existingProd?.reviews ?? 0) || 0,
    packType: String(payload.packType ?? existingProd?.packType ?? 'Airtisanal Mountain Pack').trim(),
    optionLabel: String(payload.optionLabel ?? existingProd?.optionLabel ?? 'SELECT PACK SIZE').trim(),
    specTag: String(payload.specTag ?? existingProd?.specTag ?? '').trim(),
    description: String(payload.description ?? existingProd?.description ?? '').trim(),
    origin: String(payload.origin ?? existingProd?.origin ?? 'Shimla, Himachal Pradesh').trim(),
    varieties,
    variants: normalizedVariants,
    specs: payload.specs || existingProd?.specs || {},
    methodTitle: payload.methodTitle ?? existingProd?.methodTitle ?? '',
    methodSteps: Array.isArray(payload.methodSteps) ? payload.methodSteps : (existingProd?.methodSteps || []),
    mathTitle: payload.mathTitle ?? existingProd?.mathTitle ?? '',
    mathSteps: Array.isArray(payload.mathSteps) ? payload.mathSteps : (existingProd?.mathSteps || []),
    visible: payload.visible !== undefined ? Boolean(payload.visible) : (existingProd ? existingProd.visible !== false : true),
    archived: payload.archived !== undefined ? Boolean(payload.archived) : Boolean(existingProd?.archived),
    status: String(payload.status ?? existingProd?.status ?? (payload.tag === 'upcoming' ? 'upcoming' : 'active')).trim(),
    tag: String(payload.tag ?? existingProd?.tag ?? 'always_available').trim(),
    pillText: String(payload.pillText ?? existingProd?.pillText ?? '').trim(),
    carouselNote: String(payload.carouselNote ?? existingProd?.carouselNote ?? '').trim(),
    batchNo: String(payload.batchNo ?? existingProd?.batchNo ?? '').trim(),
    upcomingDate: payload.upcomingDate !== undefined ? (payload.upcomingDate || null) : (existingProd?.upcomingDate ?? null),
    createdAt: existingProd?.createdAt || nowIso(),
    updatedAt: nowIso()
  };

  if (existingIdx !== -1) {
    db.catalog.products[existingIdx] = productDoc;
  } else {
    db.catalog.products.push(productDoc);
  }
  markDirty('catalog');

  const priceChanged = existingProd && existingProd.price !== productDoc.price;
  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: existingProd ? (priceChanged ? 'product_and_price_updated' : 'product_updated') : 'product_created',
    entityType: 'product',
    entityId: rawId,
    summary: existingProd
      ? `Updated "${productDoc.title}" (SKU ${productDoc.sku}, ₹${productDoc.price})`
      : `Created product "${productDoc.title}" (SKU ${productDoc.sku}, ₹${productDoc.price})`,
    details: priceChanged ? { oldPrice: existingProd.price, newPrice: productDoc.price } : null,
    ip: actorMeta.ip
  });

  return productDoc;
}

function setProductVisibility(db, markDirty, productId, visible, actorMeta = {}) {
  const prod = (db.catalog.products || []).find(p => p.id === productId);
  if (!prod) throw new HttpError(404, `Product "${productId}" not found`);
  prod.visible = Boolean(visible);
  prod.updatedAt = nowIso();
  markDirty('catalog');
  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: 'product_visibility_changed',
    entityType: 'product',
    entityId: productId,
    summary: `Set visibility of "${prod.title}" to ${prod.visible ? 'Active' : 'Hidden'}`,
    ip: actorMeta.ip
  });
  return prod;
}

function deleteOrArchiveProduct(db, markDirty, productId, permanent = false, actorMeta = {}) {
  const idx = (db.catalog.products || []).findIndex(p => p.id === productId);
  if (idx === -1) throw new HttpError(404, `Product "${productId}" not found`);
  const prod = db.catalog.products[idx];

  const hasOrderHistory = (db.orders.orders || []).some(o =>
    (o.itemsSnapshot || []).some(it => it.productId === productId)
  );
  if (permanent && hasOrderHistory) {
    throw new HttpError(409, 'Cannot permanently delete product with historical orders; archive or hide it instead.');
  }

  if (permanent && !hasOrderHistory) {
    db.catalog.products.splice(idx, 1);
    markDirty('catalog');
    appendAudit(db, markDirty, {
      actor: actorMeta.actor,
      action: 'product_deleted',
      entityType: 'product',
      entityId: productId,
      summary: `Permanently deleted product "${prod.title}"`,
      ip: actorMeta.ip
    });
    return { deleted: true, id: productId };
  }

  prod.archived = !prod.archived;
  if (prod.archived) prod.visible = false;
  prod.updatedAt = nowIso();
  markDirty('catalog');
  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: prod.archived ? 'product_archived' : 'product_restored',
    entityType: 'product',
    entityId: productId,
    summary: `${prod.archived ? 'Archived' : 'Restored'} product "${prod.title}"`,
    ip: actorMeta.ip
  });
  return { archived: prod.archived, product: prod };
}

// ── Stock & Inventory Adjustments ───────────────────────────────

function adjustInventory(db, markDirty, payload, actorMeta = {}) {
  const sku = normalizeSku(payload.sku);
  if (!sku) throw new HttpError(400, 'SKU is required');
  const reason = String(payload.reason || '').trim();
  if (reason.length < 3) throw new HttpError(400, 'A descriptive reason is mandatory for every stock change');

  const inv = db.inventory.bySku && db.inventory.bySku[sku];
  if (!inv) throw new HttpError(404, `SKU "${sku}" not found in inventory`);

  const type = String(payload.movementType || 'manual_adjustment').trim();
  const validTypes = ['stock_received', 'manual_adjustment', 'damaged_stock', 'return_restock'];
  if (!validTypes.includes(type)) throw new HttpError(400, `Unsupported movement type "${type}"`);

  const delta = parseInt(payload.qtyDelta ?? payload.delta, 10);
  if (!Number.isInteger(delta) || delta === 0) {
    throw new HttpError(400, 'Quantity adjustment must be a non-zero integer');
  }

  if (payload.reorderThreshold !== undefined) {
    const rt = parseInt(payload.reorderThreshold, 10);
    if (!Number.isInteger(rt) || rt < 0) throw new HttpError(400, 'Reorder threshold cannot be negative');
    inv.reorderThreshold = rt;
  }

  const before = inv.availableQty;
  if (type === 'damaged_stock') {
    const qtyToQuarantine = Math.abs(delta);
    if (inv.availableQty - inv.reservedQty < qtyToQuarantine) {
      throw new HttpError(409, `Only ${inv.availableQty - inv.reservedQty} unreserved units can be moved to damaged/quarantine`);
    }
    inv.availableQty -= qtyToQuarantine;
    inv.damagedQty = (inv.damagedQty || 0) + qtyToQuarantine;
    recordMovement(db, markDirty, {
      sku,
      productId: inv.productId,
      movementType: 'damaged_stock',
      qtyDelta: -qtyToQuarantine,
      qtyBefore: before,
      qtyAfter: inv.availableQty,
      batchId: payload.batchId || null,
      reason,
      createdBy: actorMeta.actor || 'admin'
    });
  } else {
    const nextQty = before + delta;
    if (nextQty < inv.reservedQty) {
      throw new HttpError(
        409,
        `Cannot reduce available stock to ${nextQty} while ${inv.reservedQty} units are reserved for confirmed orders`
      );
    }
    if (nextQty < 0) {
      throw new HttpError(409, `Stock cannot go negative (current: ${before}, delta: ${delta})`);
    }
    inv.availableQty = nextQty;
    recordMovement(db, markDirty, {
      sku,
      productId: inv.productId,
      movementType: type,
      qtyDelta: delta,
      qtyBefore: before,
      qtyAfter: nextQty,
      batchId: payload.batchId || null,
      reason,
      createdBy: actorMeta.actor || 'admin'
    });
  }

  inv.updatedAt = nowIso();
  markDirty('inventory');

  // Auto-update product pill/tag if it was marked out_of_stock or restored
  const prod = (db.catalog.products || []).find(p => p.id === inv.productId);
  if (prod) {
    prod.updatedAt = nowIso();
    markDirty('catalog');
  }

  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: 'inventory_adjusted',
    entityType: 'inventory',
    entityId: sku,
    summary: `Adjusted ${sku} (${type}): ${before} → ${inv.availableQty} (${reason})`,
    details: { before, after: inv.availableQty, damagedQty: inv.damagedQty, type, reason },
    ip: actorMeta.ip
  });

  return inv;
}

function bulkSetInventory(db, markDirty, payload, actorMeta = {}) {
  const reason = String(payload.reason || '').trim();
  if (reason.length < 3) throw new HttpError(400, 'A mandatory reason is required for bulk physical stock updates');
  const updates = Array.isArray(payload.items) ? payload.items : [];
  if (updates.length === 0) throw new HttpError(400, 'No SKU stock updates provided');

  const bySku = db.inventory.bySku || {};
  const touched = [];
  for (const row of updates) {
    const sku = normalizeSku(row.sku);
    const inv = bySku[sku];
    if (!inv) throw new HttpError(404, `SKU "${sku}" not found`);
    const targetQty = parseInt(row.availableQty, 10);
    if (!Number.isInteger(targetQty) || targetQty < 0) {
      throw new HttpError(400, `Stock for SKU ${sku} must be a non-negative integer`);
    }
    if (targetQty < (inv.reservedQty || 0)) {
      throw new HttpError(409, `SKU ${sku} has ${inv.reservedQty} reserved units; stock cannot be below reserved`);
    }
    if (targetQty !== inv.availableQty || (row.reorderThreshold !== undefined && Number(row.reorderThreshold) !== inv.reorderThreshold)) {
      const before = inv.availableQty;
      const delta = targetQty - before;
      inv.availableQty = targetQty;
      if (row.reorderThreshold !== undefined) {
        const rt = parseInt(row.reorderThreshold, 10);
        if (Number.isInteger(rt) && rt >= 0) inv.reorderThreshold = rt;
      }
      inv.updatedAt = nowIso();
      if (delta !== 0) {
        recordMovement(db, markDirty, {
          sku,
          productId: inv.productId,
          movementType: 'manual_adjustment',
          qtyDelta: delta,
          qtyBefore: before,
          qtyAfter: targetQty,
          reason,
          createdBy: actorMeta.actor || 'admin'
        });
      }
      touched.push({ sku, before, after: targetQty });
    }
  }

  if (touched.length > 0) {
    markDirty('inventory', 'catalog');
    appendAudit(db, markDirty, {
      actor: actorMeta.actor,
      action: 'inventory_bulk_updated',
      entityType: 'inventory',
      entityId: `${touched.length}-skus`,
      summary: `Bulk updated physical stock for ${touched.length} SKU(s) (${reason})`,
      details: touched,
      ip: actorMeta.ip
    });
  }
  return touched;
}

function holdInventoryReservation(db, markDirty, payload, actorMeta = {}) {
  const sku = normalizeSku(payload.sku);
  if (!sku) throw new HttpError(400, 'SKU is required');
  const qty = parseInt(payload.qty ?? payload.quantity, 10);
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new HttpError(400, 'Quantity to hold must be a positive integer');
  }
  const note = String(payload.note || payload.reason || 'Manual reservation hold').trim();

  const inv = db.inventory.bySku && db.inventory.bySku[sku];
  if (!inv) throw new HttpError(404, `SKU "${sku}" not found in inventory`);

  const currentReserved = inv.reservedQty || 0;
  const currentFree = Math.max(0, (inv.availableQty || 0) - currentReserved);

  if (qty > currentFree) {
    throw new HttpError(
      409,
      `Cannot hold ${qty} units of ${sku}. Only ${currentFree} free units available (Available: ${inv.availableQty}, Reserved: ${currentReserved})`
    );
  }

  inv.reservedQty = currentReserved + qty;
  inv.updatedAt = nowIso();
  markDirty('inventory');

  recordMovement(db, markDirty, {
    sku,
    productId: inv.productId,
    movementType: 'manual_reservation_hold',
    qtyDelta: 0,
    qtyBefore: currentFree,
    qtyAfter: currentFree - qty,
    reason: note,
    createdBy: actorMeta.actor || 'admin:copilot'
  });

  appendAudit(db, markDirty, {
    actor: actorMeta.actor || 'admin:copilot',
    action: 'inventory_manual_hold',
    entityType: 'inventory',
    entityId: sku,
    summary: `Held ${qty} units of ${sku} (${note}) — Free stock now ${currentFree - qty}`,
    details: { sku, heldQty: qty, freeBefore: currentFree, freeAfter: currentFree - qty, totalReserved: inv.reservedQty, note },
    ip: actorMeta.ip
  });

  return { ok: true, inventory: inv, heldQty: qty, remainingFree: currentFree - qty };
}

function releaseInventoryReservation(db, markDirty, payload, actorMeta = {}) {
  const sku = normalizeSku(payload.sku);
  if (!sku) throw new HttpError(400, 'SKU is required');
  const qty = parseInt(payload.qty ?? payload.quantity, 10);
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new HttpError(400, 'Quantity to release must be a positive integer');
  }
  const reason = String(payload.reason || payload.note || 'Manual hold released').trim();

  const inv = db.inventory.bySku && db.inventory.bySku[sku];
  if (!inv) throw new HttpError(404, `SKU "${sku}" not found in inventory`);

  const currentReserved = inv.reservedQty || 0;
  if (currentReserved < qty) {
    throw new HttpError(
      409,
      `Cannot release ${qty} units of ${sku}. Only ${currentReserved} units are currently reserved`
    );
  }

  const currentFree = Math.max(0, (inv.availableQty || 0) - currentReserved);
  inv.reservedQty = currentReserved - qty;
  inv.updatedAt = nowIso();
  markDirty('inventory');

  recordMovement(db, markDirty, {
    sku,
    productId: inv.productId,
    movementType: 'manual_reservation_released',
    qtyDelta: 0,
    qtyBefore: currentFree,
    qtyAfter: currentFree + qty,
    reason,
    createdBy: actorMeta.actor || 'admin:copilot'
  });

  appendAudit(db, markDirty, {
    actor: actorMeta.actor || 'admin:copilot',
    action: 'inventory_manual_release',
    entityType: 'inventory',
    entityId: sku,
    summary: `Released ${qty} reserved units of ${sku} (${reason}) — Free stock now ${currentFree + qty}`,
    details: { sku, releasedQty: qty, freeBefore: currentFree, freeAfter: currentFree + qty, totalReserved: inv.reservedQty, reason },
    ip: actorMeta.ip
  });

  return { ok: true, inventory: inv, releasedQty: qty, remainingFree: currentFree + qty };
}

// ── Batch Records ───────────────────────────────────────────────

function computeBatchStatus(batch, threshold = 8) {
  if (batch.status === 'quarantined') return 'quarantined';
  if (batch.bestBeforeDate) {
    const exp = new Date(batch.bestBeforeDate);
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now() - 86400000) {
      return 'expired';
    }
  }
  const rem = Number(batch.remainingQty) || 0;
  if (rem <= 0) return 'depleted';
  if (rem <= threshold) return 'low';
  return 'active';
}

function createOrUpdateBatch(db, markDirty, payload, actorMeta = {}, isUpdate = false) {
  const productId = String(payload.productId || '').trim();
  const prod = (db.catalog.products || []).find(p => p.id === productId);
  if (!prod) throw new HttpError(400, 'Select a valid product for this batch');

  const sku = payload.sku ? normalizeSku(payload.sku) : prod.sku;
  const variant = (prod.variants || []).find(v => v.sku === sku);
  const batches = db.batches.batches || [];

  const batchId = payload.id
    ? normalizeSku(payload.id)
    : buildStructuredBatchId({
        nicheTag: prod.nicheTag,
        dateStr: payload.productionDate || payload.date,
        existingBatchIds: batches.map(b => b.id)
      });

  const existingIdx = batches.findIndex(b => b.id === batchId);
  if (!isUpdate && existingIdx !== -1) throw new HttpError(409, `Batch "${batchId}" already exists`);
  if (isUpdate && existingIdx === -1) throw new HttpError(404, `Batch "${batchId}" not found`);

  const existing = existingIdx !== -1 ? batches[existingIdx] : null;
  const initialQty = Math.max(0, parseInt(payload.initialQty ?? existing?.initialQty ?? 0, 10) || 0);
  const remainingQty = isUpdate
    ? Math.max(0, parseInt(payload.remainingQty ?? existing?.remainingQty ?? 0, 10) || 0)
    : initialQty;
  const threshold = Number(variant?.reorderThreshold ?? 8);

  const nextBatch = {
    ...(existing || {}),
    id: batchId,
    productId,
    sku,
    nicheTag: prod.nicheTag,
    sizeLabel: String(payload.sizeLabel || payload.size || variant?.label || variant?.size || 'Standard').trim(),
    productionDate: String(payload.productionDate || payload.date || existing?.productionDate || '').trim(),
    bestBeforeDate: String(payload.bestBeforeDate ?? existing?.bestBeforeDate ?? '').trim(),
    initialQty,
    remainingQty,
    status: payload.status === 'quarantined' ? 'quarantined' : '',
    originNote: String(payload.originNote ?? existing?.originNote ?? prod.origin ?? '').trim(),
    report: payload.report !== undefined ? payload.report : (existing?.report ?? null),
    labStatus: payload.report ? 'Uploaded' : (payload.labStatus || existing?.labStatus || 'Pending Lab Report'),
    createdAt: existing?.createdAt || nowIso(),
    updatedAt: nowIso()
  };
  nextBatch.status = computeBatchStatus(nextBatch, threshold);

  if (existingIdx !== -1) {
    batches[existingIdx] = nextBatch;
  } else {
    batches.unshift(nextBatch);
    // Optional atomic stock-in when creating a new batch
    if (payload.addToInventory !== false && initialQty > 0) {
      const inv = ensureInventoryRecord(db, markDirty, sku, productId, nextBatch.sizeLabel, threshold);
      const before = inv.availableQty;
      inv.availableQty += initialQty;
      inv.updatedAt = nowIso();
      markDirty('inventory');
      recordMovement(db, markDirty, {
        sku,
        productId,
        movementType: 'stock_received',
        qtyDelta: initialQty,
        qtyBefore: before,
        qtyAfter: inv.availableQty,
        batchId,
        reason: `New production batch ${batchId} stock receipt`,
        createdBy: actorMeta.actor || 'admin'
      });
    }
    if (payload.setAsActiveProductBatch !== false) {
      prod.batchNo = batchId;
      prod.updatedAt = nowIso();
      markDirty('catalog');
    }
  }

  db.batches.batches = batches;
  markDirty('batches');
  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: isUpdate ? 'batch_updated' : 'batch_created',
    entityType: 'batch',
    entityId: batchId,
    summary: `${isUpdate ? 'Updated' : 'Created'} batch ${batchId} for ${sku} (${remainingQty}/${initialQty} units)`,
    ip: actorMeta.ip
  });

  return nextBatch;
}

function deleteBatchRecord(db, markDirty, batchId, actorMeta = {}) {
  const before = (db.batches.batches || []).length;
  db.batches.batches = (db.batches.batches || []).filter(b => b.id !== batchId);
  if (db.batches.batches.length === before) {
    throw new HttpError(404, `Batch "${batchId}" not found`);
  }
  markDirty('batches');
  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: 'batch_deleted',
    entityType: 'batch',
    entityId: batchId,
    summary: `Deleted batch ${batchId}`,
    ip: actorMeta.ip
  });
  return { deleted: true, id: batchId };
}

// ── Discounts & Coupons ─────────────────────────────────────────

function upsertDiscount(db, markDirty, payload, actorMeta = {}, isUpdate = false) {
  const code = String(payload.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!code || code.length < 3) throw new HttpError(400, 'Promo code must be at least 3 alphanumeric characters');

  const discounts = db.discounts.discounts || [];
  const idx = discounts.findIndex(d => d.code === code);
  if (!isUpdate && idx !== -1) throw new HttpError(409, `Offer code "${code}" already exists`);
  if (isUpdate && idx === -1) throw new HttpError(404, `Offer code "${code}" not found`);

  const type = payload.type === 'fixed' ? 'fixed' : 'percent';
  const value = Number(payload.value);
  if (!Number.isFinite(value) || value <= 0) throw new HttpError(400, 'Discount value must be > 0');
  if (type === 'percent' && value > 90) throw new HttpError(400, 'Percentage discount cannot exceed 90%');

  const minOrderAmount = Math.max(0, Number(payload.minOrderAmount) || 0);
  const maxDiscount = payload.maxDiscount !== '' && payload.maxDiscount !== undefined && payload.maxDiscount !== null
    ? Math.max(0, Number(payload.maxDiscount) || 0)
    : null;
  const usageLimit = payload.usageLimit !== '' && payload.usageLimit !== undefined && payload.usageLimit !== null
    ? Math.max(1, parseInt(payload.usageLimit, 10) || 1)
    : null;

  const existing = idx !== -1 ? discounts[idx] : null;
  const record = {
    code,
    title: String(payload.title || code).trim(),
    type,
    value,
    maxDiscount,
    minOrderAmount,
    startsAt: payload.startsAt || null,
    expiresAt: payload.expiresAt || null,
    usageLimit,
    usedCount: existing?.usedCount || 0,
    active: payload.active !== undefined ? Boolean(payload.active) : true,
    createdAt: existing?.createdAt || nowIso(),
    updatedAt: nowIso()
  };

  if (idx !== -1) discounts[idx] = record;
  else discounts.unshift(record);
  db.discounts.discounts = discounts;
  markDirty('discounts');

  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: isUpdate ? 'discount_updated' : 'discount_created',
    entityType: 'discount',
    entityId: code,
    summary: `${isUpdate ? 'Updated' : 'Created'} promo "${code}" (${type === 'percent' ? value + '%' : '₹' + value})`,
    ip: actorMeta.ip
  });
  return record;
}

function deleteDiscount(db, markDirty, code, actorMeta = {}) {
  const norm = String(code || '').trim().toUpperCase();
  const before = (db.discounts.discounts || []).length;
  db.discounts.discounts = (db.discounts.discounts || []).filter(d => d.code !== norm);
  if (db.discounts.discounts.length === before) throw new HttpError(404, `Discount "${norm}" not found`);
  markDirty('discounts');
  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: 'discount_deleted',
    entityType: 'discount',
    entityId: norm,
    summary: `Deleted discount code "${norm}"`,
    ip: actorMeta.ip
  });
  return { deleted: true, code: norm };
}

function validateAndApplyDiscount(db, promoCode, subtotal) {
  const code = String(promoCode || '').trim().toUpperCase();
  if (!code) return { discountObj: null, discountAmount: 0, code: '' };

  const offer = (db.discounts.discounts || []).find(d => d.code === code);
  if (!offer || !offer.active) throw new HttpError(400, `Promo code "${code}" is invalid or inactive`);

  const now = Date.now();
  if (offer.startsAt && new Date(offer.startsAt).getTime() > now) {
    throw new HttpError(400, `Promo code "${code}" is not active yet`);
  }
  if (offer.expiresAt) {
    const expEnd = new Date(offer.expiresAt).getTime() + 86399000; // inclusive of expiry date
    if (expEnd < now) throw new HttpError(400, `Promo code "${code}" has expired`);
  }
  if (offer.usageLimit !== null && offer.usageLimit !== undefined && offer.usedCount >= offer.usageLimit) {
    throw new HttpError(400, `Promo code "${code}" usage limit reached`);
  }
  if (subtotal < (Number(offer.minOrderAmount) || 0)) {
    throw new HttpError(400, `Minimum order of ₹${offer.minOrderAmount} required for code "${code}"`);
  }

  let amount = offer.type === 'percent' ? Math.round((subtotal * offer.value) / 100) : Math.round(offer.value);
  if (offer.maxDiscount !== null && offer.maxDiscount !== undefined && offer.maxDiscount > 0) {
    amount = Math.min(amount, offer.maxDiscount);
  }
  amount = Math.min(subtotal, Math.max(0, amount));

  return { discountObj: offer, discountAmount: amount, code };
}

// ── Authoritative Quote & Checkout Order Creation ───────────────

function calculateCheckoutQuote(db, payload, { isAdminManual = false } = {}) {
  const settings = db.catalog.settings || {};
  if (!isAdminManual && settings.accept_orders === false) {
    throw new HttpError(503, 'Store is temporarily paused from accepting new orders');
  }

  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  if (rawItems.length === 0) throw new HttpError(400, 'Your order bag is empty');

  const skuRequestedTotals = new Map();
  const resolvedLines = rawItems.map(line => {
    const qty = Number(line.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
      throw new HttpError(400, 'Item quantity must be a whole number between 1 and 100');
    }

    const match = resolveVariantAndProduct(db, line, { requireVisible: !isAdminManual });
    if (!match) {
      throw new HttpError(400, `Product or SKU "${line.sku || line.productId || 'unknown'}" is unavailable`);
    }

    const { product, variant } = match;
    const sku = variant.sku;
    skuRequestedTotals.set(sku, (skuRequestedTotals.get(sku) || 0) + qty);

    const unitPrice = Number(variant.price) || 0;
    const mrp = Number(variant.mrp) || unitPrice;
    return {
      productId: product.id,
      sku,
      productName: product.title,
      variantLabel: variant.label || variant.size,
      variety: variant.variety || line.variety || '',
      image: product.image,
      unitPrice,
      mrp,
      quantity: qty,
      lineDiscount: Math.max(0, (mrp - unitPrice) * qty),
      lineTotal: unitPrice * qty
    };
  });

  // Aggregate SKU check prevents bypassing stock via split cart lines
  const bySku = (db.inventory && db.inventory.bySku) || {};
  for (const [sku, neededQty] of skuRequestedTotals.entries()) {
    const inv = bySku[sku] || { availableQty: 0, reservedQty: 0 };
    const freeQty = Math.max(0, (inv.availableQty || 0) - (inv.reservedQty || 0));
    if (freeQty < neededQty) {
      throw new HttpError(
        409,
        freeQty <= 0
          ? `SKU ${sku} is currently out of stock`
          : `Only ${freeQty} unit(s) currently available for SKU ${sku}`
      );
    }
  }

  const subtotal = resolvedLines.reduce((sum, l) => sum + l.lineTotal, 0);
  const { discountObj, discountAmount, code } = validateAndApplyDiscount(db, payload.promoCode, subtotal);
  const paymentMethod = String(payload.paymentMethod || 'COD').toUpperCase() === 'ONLINE' ? 'ONLINE' : 'COD';
  const codFee = Number.isFinite(Number(settings.cod_fee)) ? Number(settings.cod_fee) : 25;
  const shippingCharge = paymentMethod === 'COD' ? codFee : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCharge);

  return {
    itemsSnapshot: resolvedLines,
    subtotal,
    discountCode: code,
    discountAmount,
    discountObj,
    shippingCharge,
    paymentMethod,
    grandTotal
  };
}

function upsertCustomerProfile(db, markDirty, customerInput) {
  const phone = normalizePhone(customerInput.phone);
  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new HttpError(400, 'Please enter a valid 10-digit Indian mobile number');
  }
  const name = String(customerInput.name || '').trim();
  if (name.length < 2) throw new HttpError(400, 'Please enter customer full name');

  if (!db.customers.customers) db.customers.customers = [];
  let customer = db.customers.customers.find(c => c.phone === phone);
  const now = nowIso();
  if (!customer) {
    customer = {
      customerId: makeId('CUST'),
      name,
      phone,
      defaultAddress: String(customerInput.address || '').trim(),
      landmark: String(customerInput.landmark || '').trim(),
      pincode: String(customerInput.pincode || '').trim(),
      city: String(customerInput.city || '').trim(),
      createdAt: now,
      updatedAt: now
    };
    db.customers.customers.push(customer);
  } else {
    customer.name = name || customer.name;
    if (customerInput.address) customer.defaultAddress = String(customerInput.address).trim();
    if (customerInput.landmark !== undefined) customer.landmark = String(customerInput.landmark).trim();
    if (customerInput.pincode) customer.pincode = String(customerInput.pincode).trim();
    if (customerInput.city) customer.city = String(customerInput.city).trim();
    customer.updatedAt = now;
  }
  markDirty('customers');
  return customer;
}

function createOrderRequest(db, markDirty, payload, { isAdminManual = false, actorMeta = {} } = {}) {
  const quote = calculateCheckoutQuote(db, payload, { isAdminManual });
  const c = payload.customer || payload;
  const address = String(c.address || '').trim();
  const pincode = String(c.pincode || '').trim();
  const city = String(c.city || '').trim();
  if (!isAdminManual && (address.length < 5 || !/^\d{6}$/.test(pincode) || city.length < 2)) {
    throw new HttpError(400, 'Complete address, city/state, and valid 6-digit PIN code are required');
  }

  const customer = upsertCustomerProfile(db, markDirty, c);
  if (quote.discountObj) {
    quote.discountObj.usedCount = (quote.discountObj.usedCount || 0) + 1;
    quote.discountObj.updatedAt = nowIso();
    markDirty('discounts');
  }

  const seqNum = 1001 + (db.orders.orders || []).length;
  const orderId = `SW-ORD-${seqNum}`;
  const now = nowIso();
  const orderRecord = {
    orderId,
    customerId: customer.customerId,
    source: isAdminManual ? 'admin_whatsapp' : 'website_checkout',
    customerSnapshot: {
      name: customer.name,
      phone: customer.phone,
      address: address || customer.defaultAddress || '',
      landmark: String(c.landmark || customer.landmark || '').trim(),
      pincode: pincode || customer.pincode || '',
      city: city || customer.city || ''
    },
    itemsSnapshot: quote.itemsSnapshot,
    subtotal: quote.subtotal,
    discountCode: quote.discountCode || '',
    discountAmount: quote.discountAmount || 0,
    shippingCharge: quote.shippingCharge,
    grandTotal: quote.grandTotal,
    orderStatus: 'pending_whatsapp',
    reachedStage: isAdminManual ? 'manual_whatsapp_entry' : 'confirm_whatsapp_clicked',
    whatsappClickedAt: now,
    verificationState: 'needs_verification',
    followUpAt: null,
    followUpDays: 0,
    followUpCount: 0,
    verificationNotes: '',
    verifiedBuyAt: null,
    agreedTotalOverride: null,
    verificationHistory: [
      {
        action: 'whatsapp_intent_logged',
        note: isAdminManual
          ? 'Manual WhatsApp lead added by admin'
          : "Customer clicked 'Confirm Order on WhatsApp' (reached Buy intent)",
        followUpAt: null,
        actedAt: now,
        actor: isAdminManual ? (actorMeta.actor || 'admin') : `customer:${customer.phone}`
      }
    ],
    paymentStatus: 'pending',
    paymentMethod: quote.paymentMethod,
    shippingDetails: { courier: '', trackingId: '', trackingUrl: '', expectedDeliveryText: '', dispatchNotes: '', dispatchedBy: '' },
    whatsappComms: { confirmSentAt: null, confirmSentBy: '', dispatchSentAt: null, dispatchSentBy: '' },
    returnDetails: null,
    stockReserved: false,
    stockDeducted: false,
    confirmedBy: null,
    confirmedAt: null,
    dispatchedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    cancelReason: '',
    adminNotes: String(payload.notes || '').trim(),
    idempotencyKeys: [],
    createdAt: now,
    updatedAt: now
  };

  if (!db.orders.orders) db.orders.orders = [];
  db.orders.orders.unshift(orderRecord);
  markDirty('orders');

  appendAudit(db, markDirty, {
    actor: isAdminManual ? (actorMeta.actor || 'admin') : `customer:${customer.phone}`,
    role: isAdminManual ? 'admin' : 'customer',
    action: 'order_request_created',
    entityType: 'order',
    entityId: orderId,
    summary: `Order request ${orderId} created for ₹${orderRecord.grandTotal} (${orderRecord.itemsSnapshot.length} line item(s))`,
    ip: actorMeta.ip || 'unknown'
  });

  return { order: orderRecord, customer };
}

// ── Order Workflow Transitions ──────────────────────────────────

function findOrderOrThrow(db, orderId) {
  const ord = (db.orders.orders || []).find(o => o.orderId === orderId);
  if (!ord) throw new HttpError(404, `Order "${orderId}" not found`);
  return ord;
}

function aggregateOrderSkuQuantities(order) {
  const map = new Map();
  (order.itemsSnapshot || []).forEach(it => {
    map.set(it.sku, {
      sku: it.sku,
      productId: it.productId,
      qty: (map.get(it.sku)?.qty || 0) + (Number(it.quantity) || 0)
    });
  });
  return Array.from(map.values());
}

function isFollowUpDue(order, nowMs = Date.now()) {
  if (!order || order.orderStatus !== 'waiting_followup' || !order.followUpAt) return false;
  const ts = new Date(order.followUpAt).getTime();
  return Number.isFinite(ts) && ts <= nowMs;
}

function confirmOrder(db, markDirty, { orderId, adminNotes = '' }, actorMeta = {}) {
  const ord = findOrderOrThrow(db, orderId);
  if (!['pending_whatsapp', 'waiting_followup'].includes(ord.orderStatus)) {
    throw new HttpError(409, `Order ${orderId} cannot be confirmed from status "${ord.orderStatus}"`);
  }

  const agg = aggregateOrderSkuQuantities(ord);
  const bySku = db.inventory.bySku || {};
  for (const row of agg) {
    const inv = bySku[row.sku];
    const free = inv ? Math.max(0, inv.availableQty - inv.reservedQty) : 0;
    if (free < row.qty) {
      throw new HttpError(
        409,
        `Insufficient unreserved stock for SKU ${row.sku}: need ${row.qty}, available ${free}. Restock before confirming.`
      );
    }
  }

  // Reserve atomically on confirmation
  for (const row of agg) {
    const inv = bySku[row.sku];
    inv.reservedQty = (inv.reservedQty || 0) + row.qty;
    inv.updatedAt = nowIso();
    recordMovement(db, markDirty, {
      sku: row.sku,
      productId: row.productId,
      movementType: 'reservation',
      qtyDelta: -row.qty,
      qtyBefore: inv.availableQty - (inv.reservedQty - row.qty),
      qtyAfter: inv.availableQty - inv.reservedQty,
      referenceOrderId: ord.orderId,
      reason: `Reserved upon order confirmation (${ord.orderId})`,
      createdBy: actorMeta.actor || 'admin'
    });
  }
  markDirty('inventory');

  const now = nowIso();
  ord.stockReserved = true;
  ord.orderStatus = 'confirmed';
  ord.verificationState = 'accepted_buy';
  ord.verifiedBuyAt = ord.verifiedBuyAt || now;
  ord.followUpAt = null;
  ord.confirmedBy = actorMeta.actor || 'Owner';
  ord.confirmedAt = now;
  if (adminNotes) {
    ord.adminNotes = String(adminNotes).trim();
    ord.verificationNotes = String(adminNotes).trim();
  }
  if (!Array.isArray(ord.verificationHistory)) ord.verificationHistory = [];
  if (!ord.verificationHistory.some(h => h.action === 'accepted_buy')) {
    ord.verificationHistory.unshift({
      action: 'accepted_buy',
      note: String(adminNotes || 'Accepted as Confirmed Buy').trim(),
      followUpAt: null,
      actedAt: now,
      actor: actorMeta.actor || 'admin'
    });
  }
  ord.updatedAt = now;
  markDirty('orders');

  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: 'order_confirmed',
    entityType: 'order',
    entityId: ord.orderId,
    summary: `Confirmed buy order ${ord.orderId} (${ord.customerSnapshot?.name || ''}) — stock reserved`,
    ip: actorMeta.ip
  });
  return ord;
}

function advanceOrderStatus(db, markDirty, { orderId, targetStatus, notes = '' }, actorMeta = {}) {
  const ord = findOrderOrThrow(db, orderId);
  const allowed = {
    processing: ['confirmed'],
    ready_for_dispatch: ['confirmed', 'processing']
  };
  const validFrom = allowed[targetStatus];
  if (!validFrom || !validFrom.includes(ord.orderStatus)) {
    throw new HttpError(409, `Cannot move order ${orderId} from "${ord.orderStatus}" to "${targetStatus}"`);
  }

  ord.orderStatus = targetStatus;
  if (notes) ord.adminNotes = String(notes).trim();
  ord.updatedAt = nowIso();
  markDirty('orders');
  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: `order_${targetStatus}`,
    entityType: 'order',
    entityId: ord.orderId,
    summary: `Moved order ${ord.orderId} to ${targetStatus}`,
    ip: actorMeta.ip
  });
  return ord;
}

function dispatchOrder(db, markDirty, { orderId, courier = '', trackingId = '', trackingUrl = '', expectedDeliveryText = '', batchId = '', dispatchNotes = '', idempotencyKey = '' }, actorMeta = {}) {
  const ord = findOrderOrThrow(db, orderId);
  if (idempotencyKey && Array.isArray(ord.idempotencyKeys) && ord.idempotencyKeys.includes(idempotencyKey)) {
    return { order: ord, idempotentNoOp: true };
  }
  if (ord.stockDeducted && (ord.orderStatus === 'dispatched' || ord.orderStatus === 'delivered')) {
    return { order: ord, idempotentNoOp: true };
  }
  if (!['confirmed', 'processing', 'ready_for_dispatch'].includes(ord.orderStatus)) {
    throw new HttpError(409, `Order ${orderId} must be Confirmed/Processing/Ready before dispatch (current: ${ord.orderStatus})`);
  }

  const agg = aggregateOrderSkuQuantities(ord);
  const bySku = db.inventory.bySku || {};
  for (const row of agg) {
    const inv = bySku[row.sku];
    if (!inv || inv.availableQty < row.qty) {
      throw new HttpError(409, `Insufficient physical stock for SKU ${row.sku} during dispatch`);
    }
  }

  const batches = db.batches.batches || [];
  let batchesTouched = false;

  for (const row of agg) {
    const inv = bySku[row.sku];
    const beforeAvail = inv.availableQty;
    inv.availableQty -= row.qty;
    if (ord.stockReserved) {
      inv.reservedQty = Math.max(0, (inv.reservedQty || 0) - row.qty);
    }
    inv.updatedAt = nowIso();

    // Deduct matching active batch remainingQty if linked (FEFO or explicit batchId)
    let deductedBatchId = null;
    const candidateBatch = batchId
      ? batches.find(b => b.id === batchId && b.productId === row.productId)
      : batches.find(b => b.sku === row.sku && b.status === 'active' && b.remainingQty > 0) ||
        batches.find(b => b.productId === row.productId && b.status === 'active' && b.remainingQty > 0);
    if (candidateBatch) {
      candidateBatch.remainingQty = Math.max(0, (Number(candidateBatch.remainingQty) || 0) - row.qty);
      candidateBatch.status = computeBatchStatus(candidateBatch, inv.reorderThreshold || 8);
      candidateBatch.updatedAt = nowIso();
      deductedBatchId = candidateBatch.id;
      batchesTouched = true;
    }

    recordMovement(db, markDirty, {
      sku: row.sku,
      productId: row.productId,
      movementType: 'dispatch_deduction',
      qtyDelta: -row.qty,
      qtyBefore: beforeAvail,
      qtyAfter: inv.availableQty,
      referenceOrderId: ord.orderId,
      batchId: deductedBatchId,
      reason: `Dispatched order ${ord.orderId}${courier ? ' via ' + courier : ''}`,
      createdBy: actorMeta.actor || 'admin'
    });
  }
  markDirty('inventory');
  if (batchesTouched) markDirty('batches');

  const cleanCourier = String(courier || '').trim();
  const cleanTrackingId = String(trackingId || '').trim();
  const resolvedTrackingUrl = buildCourierTrackingUrl(cleanCourier, cleanTrackingId, trackingUrl);
  const cleanEta = String(expectedDeliveryText || '').trim();

  ord.stockDeducted = true;
  ord.stockReserved = false;
  ord.orderStatus = 'dispatched';
  ord.dispatchedAt = nowIso();
  ord.shippingDetails = {
    courier: cleanCourier,
    trackingId: cleanTrackingId,
    trackingUrl: resolvedTrackingUrl,
    expectedDeliveryText: cleanEta,
    dispatchNotes: String(dispatchNotes || '').trim(),
    dispatchedBy: actorMeta.actor || 'Owner'
  };
  if (idempotencyKey) {
    ord.idempotencyKeys = [...(ord.idempotencyKeys || []), idempotencyKey].slice(-20);
  }
  ord.updatedAt = nowIso();
  markDirty('orders');

  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: 'order_dispatched',
    entityType: 'order',
    entityId: ord.orderId,
    summary: `Dispatched order ${ord.orderId}${courier ? ' (' + courier + ' ' + trackingId + ')' : ''} — stock atomically deducted`,
    ip: actorMeta.ip
  });

  return { order: ord, idempotentNoOp: false };
}

function deliverOrder(db, markDirty, { orderId, autoCollectCod = true }, actorMeta = {}) {
  const ord = findOrderOrThrow(db, orderId);
  if (ord.orderStatus !== 'dispatched') {
    throw new HttpError(409, `Order ${orderId} must be in "dispatched" state before marking Delivered`);
  }
  const now = nowIso();
  ord.orderStatus = 'delivered';
  ord.deliveredAt = now;
  ord.updatedAt = now;

  let codCollected = false;
  if (autoCollectCod && ord.paymentMethod === 'COD' && ord.paymentStatus !== 'paid') {
    ord.paymentStatus = 'paid';
    ord.paidAt = now;
    if (!db.payments) db.payments = { payments: [] };
    if (!Array.isArray(db.payments.payments)) db.payments.payments = [];
    db.payments.payments.unshift({
      paymentId: makeId('PAY'),
      orderId: ord.orderId,
      amount: ord.grandTotal,
      paymentMethod: 'COD',
      type: 'collection',
      paymentStatus: 'paid',
      transactionReference: 'COD_CASH_ON_DELIVERY',
      verifiedBy: actorMeta.actor || 'Owner',
      verifiedAt: now,
      notes: 'Cash collected upon delivery',
      createdAt: now
    });
    markDirty('payments');
    codCollected = true;
  }

  markDirty('orders');

  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: 'order_delivered',
    entityType: 'order',
    entityId: ord.orderId,
    summary: `Marked order ${ord.orderId} as Delivered${codCollected ? ' (Cash collected: ₹' + ord.grandTotal + ')' : ''}`,
    ip: actorMeta.ip
  });
  return ord;
}

function cancelOrder(db, markDirty, { orderId, reason = '' }, actorMeta = {}) {
  const ord = findOrderOrThrow(db, orderId);
  if (['dispatched', 'delivered', 'return_requested', 'return_approved', 'return_received', 'return_inspected'].includes(ord.orderStatus)) {
    throw new HttpError(
      409,
      'Already-dispatched orders cannot be cancelled normally; use the Returns & Inspection workflow.'
    );
  }
  if (ord.orderStatus === 'cancelled') {
    throw new HttpError(409, `Order ${orderId} is already cancelled`);
  }

  if (ord.stockReserved) {
    const agg = aggregateOrderSkuQuantities(ord);
    const bySku = db.inventory.bySku || {};
    for (const row of agg) {
      const inv = bySku[row.sku];
      if (!inv) continue;
      const beforeReserved = inv.reservedQty || 0;
      inv.reservedQty = Math.max(0, beforeReserved - row.qty);
      inv.updatedAt = nowIso();
      recordMovement(db, markDirty, {
        sku: row.sku,
        productId: row.productId,
        movementType: 'reservation_release',
        qtyDelta: row.qty,
        qtyBefore: inv.availableQty - beforeReserved,
        qtyAfter: inv.availableQty - inv.reservedQty,
        referenceOrderId: ord.orderId,
        reason: `Released reservation on cancellation (${reason || 'Cancelled'})`,
        createdBy: actorMeta.actor || 'admin'
      });
    }
    markDirty('inventory');
  }

  if (ord.discountCode) {
    const offer = (db.discounts.discounts || []).find(d => d.code === ord.discountCode);
    if (offer && offer.usedCount > 0) {
      offer.usedCount -= 1;
      markDirty('discounts');
    }
  }

  const wasPreConfirm = ['pending_whatsapp', 'waiting_followup'].includes(ord.orderStatus);
  ord.stockReserved = false;
  ord.orderStatus = 'cancelled';
  if (wasPreConfirm) {
    ord.verificationState = 'not_bought';
  }
  ord.followUpAt = null;
  ord.cancelledAt = nowIso();
  ord.cancelReason = String(reason || 'Cancelled by admin').trim();
  if (!Array.isArray(ord.verificationHistory)) ord.verificationHistory = [];
  ord.verificationHistory.unshift({
    action: wasPreConfirm ? 'not_bought' : 'cancelled',
    note: ord.cancelReason,
    followUpAt: null,
    actedAt: ord.cancelledAt,
    actor: actorMeta.actor || 'admin'
  });
  if (ord.paymentStatus === 'paid') {
    ord.paymentStatus = 'refund_pending';
  }
  ord.updatedAt = nowIso();
  markDirty('orders');

  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: 'order_cancelled',
    entityType: 'order',
    entityId: ord.orderId,
    summary: `Cancelled order ${ord.orderId} pre-dispatch (${ord.cancelReason})`,
    ip: actorMeta.ip
  });
  return ord;
}

function verifyWhatsAppBuy(db, markDirty, payload, actorMeta = {}) {
  const { orderId, decision = 'accept' } = payload;
  const ord = findOrderOrThrow(db, orderId);
  if (!['pending_whatsapp', 'waiting_followup'].includes(ord.orderStatus)) {
    throw new HttpError(
      409,
      `Order ${orderId} has already been resolved (current status: ${ord.orderStatus})`
    );
  }

  const now = nowIso();
  const note = String(payload.notes ?? payload.reason ?? '').trim();
  if (!Array.isArray(ord.verificationHistory)) ord.verificationHistory = [];

  if (decision === 'wait') {
    let followUpIso = '';
    let daysVal = Number(payload.followUpDays);
    if (payload.followUpAt) {
      const parsed = new Date(payload.followUpAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new HttpError(400, 'Please enter a valid follow-up reminder date/time');
      }
      followUpIso = parsed.toISOString();
      daysVal = Math.max(0, Number(((parsed.getTime() - Date.now()) / 86400000).toFixed(2)));
    } else {
      daysVal = Number.isFinite(daysVal) && daysVal > 0 ? Math.min(90, daysVal) : 2;
      followUpIso = new Date(Date.now() + Math.round(daysVal * 86400000)).toISOString();
    }

    ord.orderStatus = 'waiting_followup';
    ord.verificationState = 'waiting_followup';
    ord.followUpAt = followUpIso;
    ord.followUpDays = daysVal;
    ord.followUpCount = (ord.followUpCount || 0) + 1;
    ord.verificationNotes = note || `Follow-up scheduled in ${daysVal} day(s)`;
    if (note) ord.adminNotes = note;
    ord.verificationHistory.unshift({
      action: 'wait_followup',
      note: ord.verificationNotes,
      followUpAt: followUpIso,
      actedAt: now,
      actor: actorMeta.actor || 'admin'
    });
    ord.updatedAt = now;
    markDirty('orders');

    appendAudit(db, markDirty, {
      actor: actorMeta.actor,
      action: 'order_verification_wait',
      entityType: 'order',
      entityId: ord.orderId,
      summary: `Snoozed WhatsApp buy verification for ${ord.orderId} (${daysVal}d · due ${followUpIso.slice(0, 10)})`,
      details: { followUpAt: followUpIso, followUpDays: daysVal, note: ord.verificationNotes },
      ip: actorMeta.ip
    });
    return ord;
  }

  if (decision === 'not_bought' || decision === 'reject') {
    const cancelReason = note || 'Marked Not Bought / Did not confirm on WhatsApp';
    return cancelOrder(db, markDirty, { orderId, reason: cancelReason }, actorMeta);
  }

  if (decision !== 'accept') {
    throw new HttpError(400, `Unknown verification decision "${decision}"`);
  }

  // Decision === 'accept': apply any admin-updated customer / item / deal fields atomically before reserving stock
  if (payload.customer && typeof payload.customer === 'object') {
    const c = payload.customer;
    const prev = ord.customerSnapshot || {};
    const mergedCust = {
      name: String(c.name ?? prev.name ?? '').trim(),
      phone: normalizePhone(c.phone ?? prev.phone ?? ''),
      address: String(c.address ?? prev.address ?? '').trim(),
      landmark: String(c.landmark ?? prev.landmark ?? '').trim(),
      pincode: String(c.pincode ?? prev.pincode ?? '').trim(),
      city: String(c.city ?? prev.city ?? '').trim()
    };
    const updatedCustomer = upsertCustomerProfile(db, markDirty, mergedCust);
    ord.customerId = updatedCustomer.customerId;
    ord.customerSnapshot = {
      name: mergedCust.name || updatedCustomer.name,
      phone: updatedCustomer.phone,
      address: mergedCust.address,
      landmark: mergedCust.landmark,
      pincode: mergedCust.pincode,
      city: mergedCust.city
    };
  }

  const nextPayMethod = payload.paymentMethod
    ? (String(payload.paymentMethod).toUpperCase() === 'ONLINE' ? 'ONLINE' : 'COD')
    : ord.paymentMethod;
  const settings = db.catalog.settings || {};
  const codFee = Number.isFinite(Number(settings.cod_fee)) ? Number(settings.cod_fee) : 25;

  if (Array.isArray(payload.items) && payload.items.length > 0) {
    const skuRequestedTotals = new Map();
    const resolvedLines = payload.items.map(line => {
      const qty = Number(line.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
        throw new HttpError(400, 'Verified quantity must be between 1 and 100');
      }
      const match = resolveVariantAndProduct(db, line, { requireVisible: false });
      if (!match) {
        throw new HttpError(400, `SKU or product "${line.sku || line.productId || 'unknown'}" not found`);
      }
      const { product, variant } = match;
      skuRequestedTotals.set(variant.sku, (skuRequestedTotals.get(variant.sku) || 0) + qty);
      const unitPrice = Number(variant.price) || 0;
      const mrp = Number(variant.mrp) || unitPrice;
      return {
        productId: product.id,
        sku: variant.sku,
        productName: product.title,
        variantLabel: variant.label || variant.size,
        variety: variant.variety || line.variety || '',
        image: product.image,
        unitPrice,
        mrp,
        quantity: qty,
        lineDiscount: Math.max(0, (mrp - unitPrice) * qty),
        lineTotal: unitPrice * qty
      };
    });

    const bySku = db.inventory.bySku || {};
    for (const [sku, needed] of skuRequestedTotals.entries()) {
      const inv = bySku[sku] || { availableQty: 0, reservedQty: 0 };
      const freeQty = Math.max(0, (inv.availableQty || 0) - (inv.reservedQty || 0));
      if (freeQty < needed) {
        throw new HttpError(409, `Insufficient unreserved stock for SKU ${sku}: need ${needed}, available ${freeQty}`);
      }
    }

    ord.itemsSnapshot = resolvedLines;
    ord.subtotal = resolvedLines.reduce((s, l) => s + l.lineTotal, 0);
  }

  ord.paymentMethod = nextPayMethod;
  ord.shippingCharge = nextPayMethod === 'COD' ? codFee : 0;

  let calculatedTotal = Math.max(0, (ord.subtotal || 0) - (ord.discountAmount || 0) + (ord.shippingCharge || 0));
  if (payload.agreedTotal !== undefined && payload.agreedTotal !== '' && payload.agreedTotal !== null) {
    const customAmt = Number(payload.agreedTotal);
    if (!Number.isFinite(customAmt) || customAmt < 0) {
      throw new HttpError(400, 'Agreed total amount must be a valid non-negative number');
    }
    const rounded = Math.round(customAmt);
    if (rounded !== calculatedTotal) {
      ord.agreedTotalOverride = rounded;
      calculatedTotal = rounded;
    } else {
      ord.agreedTotalOverride = null;
    }
  }
  ord.grandTotal = calculatedTotal;

  ord.verificationHistory.unshift({
    action: 'accepted_buy',
    note: note || `Verified & accepted buy (₹${ord.grandTotal}, ${ord.paymentMethod})`,
    followUpAt: null,
    actedAt: now,
    actor: actorMeta.actor || 'admin'
  });

  // Confirm & atomically reserve stock
  confirmOrder(db, markDirty, { orderId, adminNotes: note }, actorMeta);
  ord.verificationNotes = note || ord.verificationNotes;

  if (payload.markPaid === true) {
    recordOrderPayment(
      db,
      markDirty,
      {
        orderId,
        action: 'mark_paid',
        paymentMethod: ord.paymentMethod,
        transactionReference: String(payload.transactionReference || '').trim(),
        notes: String(payload.paymentNotes || note || 'Payment verified during WhatsApp Buy acceptance').trim()
      },
      actorMeta
    );
  }

  if (payload.dispatchNow === true) {
    dispatchOrder(
      db,
      markDirty,
      {
        orderId,
        courier: String(payload.courier || '').trim(),
        trackingId: String(payload.trackingId || '').trim(),
        trackingUrl: String(payload.trackingUrl || '').trim(),
        expectedDeliveryText: String(payload.expectedDeliveryText || '').trim(),
        dispatchNotes: String(payload.dispatchNotes || note || '').trim(),
        idempotencyKey: payload.idempotencyKey || makeId('IDEMP')
      },
      actorMeta
    );
  }

  ord.updatedAt = nowIso();
  markDirty('orders');
  return ord;
}

function markWhatsAppMessageSent(db, markDirty, { orderId, stage = 'confirm' }, actorMeta = {}) {
  const ord = findOrderOrThrow(db, orderId);
  const cleanStage = (stage === 'dispatch' || stage === 'delivered') ? stage : 'confirm';
  const now = nowIso();
  if (!ord.whatsappComms) {
    ord.whatsappComms = { confirmSentAt: null, confirmSentBy: '', dispatchSentAt: null, dispatchSentBy: '', deliveredSentAt: null, deliveredSentBy: '' };
  }
  if (cleanStage === 'delivered') {
    ord.whatsappComms.deliveredSentAt = now;
    ord.whatsappComms.deliveredSentBy = actorMeta.actor || 'Owner';
  } else if (cleanStage === 'dispatch') {
    ord.whatsappComms.dispatchSentAt = now;
    ord.whatsappComms.dispatchSentBy = actorMeta.actor || 'Owner';
  } else {
    ord.whatsappComms.confirmSentAt = now;
    ord.whatsappComms.confirmSentBy = actorMeta.actor || 'Owner';
  }
  ord.updatedAt = now;
  markDirty('orders');

  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: `whatsapp_${cleanStage}_sent`,
    entityType: 'order',
    entityId: ord.orderId,
    summary: `Sent WhatsApp ${cleanStage} update for ${ord.orderId}`,
    ip: actorMeta.ip
  });
  return ord;
}

function recordOrderPayment(db, markDirty, { orderId, action = 'mark_paid', paymentMethod, transactionReference = '', notes = '' }, actorMeta = {}) {
  const ord = findOrderOrThrow(db, orderId);
  if (ord.orderStatus === 'cancelled' && action === 'mark_paid') {
    throw new HttpError(409, 'Cannot collect payment for a cancelled order');
  }

  const now = nowIso();
  if (!db.payments.payments) db.payments.payments = [];

  if (action === 'mark_failed') {
    if (ord.paymentStatus === 'paid') {
      throw new HttpError(409, 'Cannot mark an already-paid order as failed; use Refund instead');
    }
    ord.paymentStatus = 'failed';
    ord.updatedAt = now;
    db.payments.payments.unshift({
      paymentId: makeId('PAY'),
      orderId: ord.orderId,
      amount: 0,
      paymentMethod: paymentMethod || ord.paymentMethod,
      type: 'collection',
      paymentStatus: 'failed',
      transactionReference: String(transactionReference || '').trim(),
      verifiedBy: actorMeta.actor || 'Owner',
      verifiedAt: now,
      notes: String(notes || 'Payment failed / bounced').trim(),
      createdAt: now
    });
    markDirty('orders', 'payments');
    appendAudit(db, markDirty, {
      actor: actorMeta.actor,
      action: 'payment_marked_failed',
      entityType: 'payment',
      entityId: ord.orderId,
      summary: `Marked payment FAILED for ${ord.orderId}`,
      ip: actorMeta.ip
    });
    return ord;
  }

  if (ord.paymentStatus === 'paid') {
    throw new HttpError(409, `Payment for order ${orderId} is already verified as Paid`);
  }

  const ref = String(transactionReference || '').trim();
  const method = String(paymentMethod || ord.paymentMethod || 'ONLINE').toUpperCase();
  const paymentRow = {
    paymentId: makeId('PAY'),
    orderId: ord.orderId,
    amount: ord.grandTotal,
    paymentMethod: method,
    type: 'collection',
    paymentStatus: 'paid',
    transactionReference: ref,
    verifiedBy: actorMeta.actor || 'Owner',
    verifiedAt: now,
    notes: String(notes || '').trim(),
    createdAt: now
  };

  db.payments.payments.unshift(paymentRow);
  ord.paymentStatus = 'paid';
  ord.paymentMethod = method;
  ord.updatedAt = now;
  markDirty('orders', 'payments');

  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: 'payment_verified',
    entityType: 'payment',
    entityId: paymentRow.paymentId,
    summary: `Verified ₹${paymentRow.amount} (${method}${ref ? ', ref ' + ref : ''}) for ${ord.orderId}`,
    ip: actorMeta.ip
  });

  return ord;
}

function processOrderReturn(db, markDirty, payload, actorMeta = {}) {
  const { orderId, stage = 'return_inspected', reason = '', notes = '' } = payload;
  const ord = findOrderOrThrow(db, orderId);

  const allowedInitial = ['dispatched', 'delivered', 'return_requested', 'return_approved', 'return_received'];
  if (!allowedInitial.includes(ord.orderStatus)) {
    throw new HttpError(409, `Return flow requires a dispatched/delivered order (current: ${ord.orderStatus})`);
  }

  const now = nowIso();
  if (!ord.returnDetails) {
    ord.returnDetails = {
      status: 'return_requested',
      reason: String(reason || '').trim(),
      restockedQty: 0,
      damagedQty: 0,
      inspectedBy: null,
      inspectedAt: null,
      refundStatus: ord.paymentStatus === 'paid' ? 'refund_pending' : 'not_applicable',
      refundAmount: 0
    };
  }

  if (stage !== 'return_inspected') {
    const validStage = ['return_requested', 'return_approved', 'return_received'].includes(stage);
    if (!validStage) throw new HttpError(400, `Unsupported return stage "${stage}"`);
    ord.orderStatus = stage;
    ord.returnDetails.status = stage;
    if (reason) ord.returnDetails.reason = String(reason).trim();
    ord.updatedAt = now;
    markDirty('orders');
    appendAudit(db, markDirty, {
      actor: actorMeta.actor,
      action: stage,
      entityType: 'order',
      entityId: ord.orderId,
      summary: `Updated return stage for ${ord.orderId} → ${stage}`,
      ip: actorMeta.ip
    });
    return ord;
  }

  // Final physical return inspection: separates sellable restock from damaged/quarantined stock
  if (ord.returnDetails.inspectedAt) {
    throw new HttpError(409, `Return for ${orderId} was already inspected`);
  }

  const totalOrderedUnits = (ord.itemsSnapshot || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const bySku = db.inventory.bySku || {};
  const skuBreakdown = Array.isArray(payload.inspectedLines) && payload.inspectedLines.length > 0
    ? payload.inspectedLines
    : null;

  let totalRestocked = 0;
  let totalDamaged = 0;

  if (skuBreakdown) {
    const orderedMap = new Map();
    (ord.itemsSnapshot || []).forEach(it => orderedMap.set(it.sku, (orderedMap.get(it.sku) || 0) + it.quantity));

    for (const line of skuBreakdown) {
      const rQty = Math.max(0, parseInt(line.restockedQty, 10) || 0);
      const dQty = Math.max(0, parseInt(line.damagedQty, 10) || 0);
      const maxForSku = orderedMap.get(line.sku) || 0;
      if (rQty + dQty > maxForSku) {
        throw new HttpError(400, `Returned quantities (${rQty + dQty}) exceed shipped qty (${maxForSku}) for ${line.sku}`);
      }
      const inv = bySku[line.sku];
      if (!inv) continue;
      if (rQty > 0) {
        const before = inv.availableQty;
        inv.availableQty += rQty;
        inv.updatedAt = now;
        recordMovement(db, markDirty, {
          sku: line.sku,
          productId: inv.productId,
          movementType: 'return_restock',
          qtyDelta: rQty,
          qtyBefore: before,
          qtyAfter: inv.availableQty,
          referenceOrderId: ord.orderId,
          reason: `Sellable return restocked after inspection (${notes || reason || ord.orderId})`,
          createdBy: actorMeta.actor || 'admin'
        });
      }
      if (dQty > 0) {
        const beforeDam = inv.damagedQty || 0;
        inv.damagedQty = beforeDam + dQty;
        inv.updatedAt = now;
        recordMovement(db, markDirty, {
          sku: line.sku,
          productId: inv.productId,
          movementType: 'damaged_stock',
          qtyDelta: dQty,
          qtyBefore: beforeDam,
          qtyAfter: inv.damagedQty,
          referenceOrderId: ord.orderId,
          reason: `Damaged return quarantined during inspection (${notes || reason || ord.orderId})`,
          createdBy: actorMeta.actor || 'admin'
        });
      }
      totalRestocked += rQty;
      totalDamaged += dQty;
    }
  } else {
    const rQty = Math.max(0, parseInt(payload.restockedQty, 10) || 0);
    const dQty = Math.max(0, parseInt(payload.damagedQty, 10) || 0);
    if (rQty + dQty <= 0 || rQty + dQty > totalOrderedUnits) {
      throw new HttpError(
        400,
        `Specify restocked (${rQty}) + damaged (${dQty}) quantities between 1 and ${totalOrderedUnits}`
      );
    }
    // Distribute sequentially across itemsSnapshot (exact when single-item or summary return)
    let remRestock = rQty;
    let remDamaged = dQty;
    for (const item of ord.itemsSnapshot || []) {
      const inv = bySku[item.sku];
      if (!inv) continue;
      let itemCap = item.quantity;
      const takeRestock = Math.min(itemCap, remRestock);
      remRestock -= takeRestock;
      itemCap -= takeRestock;
      const takeDam = Math.min(itemCap, remDamaged);
      remDamaged -= takeDam;

      if (takeRestock > 0) {
        const before = inv.availableQty;
        inv.availableQty += takeRestock;
        inv.updatedAt = now;
        recordMovement(db, markDirty, {
          sku: item.sku,
          productId: item.productId,
          movementType: 'return_restock',
          qtyDelta: takeRestock,
          qtyBefore: before,
          qtyAfter: inv.availableQty,
          referenceOrderId: ord.orderId,
          reason: `Sellable return restocked (${notes || reason || ord.orderId})`,
          createdBy: actorMeta.actor || 'admin'
        });
      }
      if (takeDam > 0) {
        const beforeDam = inv.damagedQty || 0;
        inv.damagedQty = beforeDam + takeDam;
        inv.updatedAt = now;
        recordMovement(db, markDirty, {
          sku: item.sku,
          productId: item.productId,
          movementType: 'damaged_stock',
          qtyDelta: takeDam,
          qtyBefore: beforeDam,
          qtyAfter: inv.damagedQty,
          referenceOrderId: ord.orderId,
          reason: `Damaged return quarantined (${notes || reason || ord.orderId})`,
          createdBy: actorMeta.actor || 'admin'
        });
      }
      totalRestocked += takeRestock;
      totalDamaged += takeDam;
    }
  }

  markDirty('inventory');
  ord.orderStatus = 'return_inspected';
  ord.returnDetails = {
    status: totalDamaged > 0 && totalRestocked === 0 ? 'Damaged / Quarantined' : totalRestocked > 0 ? 'Restocked' : 'Inspected',
    reason: String(reason || ord.returnDetails.reason || '').trim(),
    restockedQty: totalRestocked,
    damagedQty: totalDamaged,
    inspectedBy: actorMeta.actor || 'Owner',
    inspectedAt: now,
    notes: String(notes || '').trim(),
    refundStatus: ord.paymentStatus === 'paid' ? 'refund_pending' : 'not_applicable',
    refundAmount: ord.returnDetails.refundAmount || 0
  };
  if (ord.paymentStatus === 'paid') {
    ord.paymentStatus = 'refund_pending';
  }
  ord.updatedAt = now;
  markDirty('orders');

  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: 'return_inspected',
    entityType: 'order',
    entityId: ord.orderId,
    summary: `Inspected return for ${ord.orderId}: ${totalRestocked} restocked, ${totalDamaged} damaged/quarantined`,
    ip: actorMeta.ip
  });

  return ord;
}

function processOrderRefund(db, markDirty, { orderId, refundAmount, transactionReference = '', notes = '' }, actorMeta = {}) {
  const ord = findOrderOrThrow(db, orderId);
  const orderPayments = (db.payments.payments || []).filter(p => p.orderId === orderId);
  const collected = orderPayments.filter(p => p.type === 'collection' && p.paymentStatus === 'paid').reduce((s, p) => s + p.amount, 0);
  const refundedSoFar = orderPayments.filter(p => p.type === 'refund').reduce((s, p) => s + Math.abs(p.amount), 0);
  const refundableRemaining = Math.max(0, collected - refundedSoFar);

  if (refundableRemaining <= 0) {
    throw new HttpError(409, `No refundable paid balance remaining on order ${orderId}`);
  }

  const reqAmt = refundAmount !== undefined && refundAmount !== '' ? Number(refundAmount) : refundableRemaining;
  if (!Number.isFinite(reqAmt) || reqAmt <= 0 || reqAmt > refundableRemaining) {
    throw new HttpError(400, `Refund amount must be between ₹1 and ₹${refundableRemaining}`);
  }

  const roundedAmt = Math.round(reqAmt);
  const now = nowIso();
  const isFull = refundedSoFar + roundedAmt >= collected;

  const refundRow = {
    paymentId: makeId('REF'),
    orderId: ord.orderId,
    amount: -roundedAmt,
    paymentMethod: ord.paymentMethod,
    type: 'refund',
    paymentStatus: isFull ? 'refunded' : 'partially_refunded',
    transactionReference: String(transactionReference || '').trim(),
    verifiedBy: actorMeta.actor || 'Owner',
    verifiedAt: now,
    notes: String(notes || 'Order refund processed').trim(),
    createdAt: now
  };
  db.payments.payments.unshift(refundRow);
  ord.paymentStatus = isFull ? 'refunded' : 'partially_refunded';
  if (ord.returnDetails) {
    ord.returnDetails.refundStatus = ord.paymentStatus;
    ord.returnDetails.refundAmount = (ord.returnDetails.refundAmount || 0) + roundedAmt;
  }
  ord.updatedAt = now;
  markDirty('orders', 'payments');

  appendAudit(db, markDirty, {
    actor: actorMeta.actor,
    action: 'refund_processed',
    entityType: 'payment',
    entityId: refundRow.paymentId,
    summary: `Refunded ₹${roundedAmt} for ${ord.orderId} (${ord.paymentStatus})`,
    ip: actorMeta.ip
  });

  return ord;
}

// ── Dashboard KPIs, Analytics & Reports ─────────────────────────

function getOrderNetRefundsMap(payments = []) {
  const refundsByOrder = new Map();
  payments.forEach(p => {
    if (p.type === 'refund') {
      refundsByOrder.set(p.orderId, (refundsByOrder.get(p.orderId) || 0) + Math.abs(p.amount || 0));
    }
  });
  return refundsByOrder;
}

function computeDashboardMetrics(db) {
  const orders = (db.orders && db.orders.orders) || [];
  const payments = (db.payments && db.payments.payments) || [];
  const products = (db.catalog && db.catalog.products) || [];
  const bySku = (db.inventory && db.inventory.bySku) || {};
  const batches = (db.batches && db.batches.batches) || [];
  const customers = (db.customers && db.customers.customers) || [];
  const analytics = db.analytics || { totalViews: 0, viewsByDate: {}, productViews: {} };

  const refundsMap = getOrderNetRefundsMap(payments);

  const isDispatchedOrLater = st => ['dispatched', 'delivered', 'return_requested', 'return_approved', 'return_received', 'return_inspected'].includes(st);
  const nowMs = Date.now();

  const freshWhatsAppCount = orders.filter(o => o.orderStatus === 'pending_whatsapp').length;
  const dueFollowUpCount = orders.filter(o => isFollowUpDue(o, nowMs)).length;
  const waitingNotDueCount = orders.filter(o => o.orderStatus === 'waiting_followup' && !isFollowUpDue(o, nowMs)).length;
  const orderRequestsCount = freshWhatsAppCount + dueFollowUpCount;

  const isAcceptedBuy = o => !['pending_whatsapp', 'waiting_followup', 'cancelled'].includes(o.orderStatus);
  const acceptedOrders = orders.filter(isAcceptedBuy);
  const confirmedActiveCount = orders.filter(o => ['confirmed', 'processing', 'ready_for_dispatch'].includes(o.orderStatus)).length;
  const confirmedCumulativeCount = acceptedOrders.length;
  const dispatchedCount = orders.filter(o => o.orderStatus === 'dispatched').length;
  const deliveredCount = orders.filter(o => o.orderStatus === 'delivered').length;
  const cancelledCount = orders.filter(o => o.orderStatus === 'cancelled').length;
  const notBoughtCount = orders.filter(o => o.orderStatus === 'cancelled' && (o.verificationState === 'not_bought' || !o.confirmedAt)).length;
  const returnedCount = orders.filter(o => o.orderStatus.startsWith('return_') || Boolean(o.returnDetails)).length;

  let paidDispatchedSales = 0;
  let deliveredPaidRevenue = 0;
  let inTransitRevenue = 0;
  let netRevenue = 0;
  let pendingPaymentsTotal = 0;
  let pendingPaymentsCount = 0;
  let acceptedBuysValue = 0;
  let acceptedUnitsSold = 0;
  let dispatchedUnitsSold = 0;
  let inTransitUnitsSold = 0;
  let deliveredUnitsSold = 0;

  const skuAcceptedMap = new Map();
  const skuDispatchedMap = new Map();

  orders.forEach(o => {
    const refunded = refundsMap.get(o.orderId) || 0;
    const isPaid = o.paymentStatus === 'paid' || o.paymentStatus === 'partially_refunded';
    const isFullRefund = o.paymentStatus === 'refunded';
    const isDispatched = o.stockDeducted || isDispatchedOrLater(o.orderStatus);

    if (isAcceptedBuy(o) && !isFullRefund) {
      acceptedBuysValue += Math.max(0, o.grandTotal - refunded);
      (o.itemsSnapshot || []).forEach(it => {
        const q = Number(it.quantity) || 0;
        acceptedUnitsSold += q;
        skuAcceptedMap.set(it.sku, (skuAcceptedMap.get(it.sku) || 0) + q);
      });
    }

    if (isDispatched && !isFullRefund && o.orderStatus !== 'cancelled') {
      (o.itemsSnapshot || []).forEach(it => {
        const q = Number(it.quantity) || 0;
        dispatchedUnitsSold += q;
        if (o.orderStatus === 'dispatched') inTransitUnitsSold += q;
        else if (o.orderStatus === 'delivered') deliveredUnitsSold += q;
        skuDispatchedMap.set(it.sku, (skuDispatchedMap.get(it.sku) || 0) + q);
      });
    }

    if (isDispatched && isPaid && !isFullRefund) {
      const net = Math.max(0, o.grandTotal - refunded);
      paidDispatchedSales += o.grandTotal;
      netRevenue += net;
      if (o.orderStatus === 'delivered') deliveredPaidRevenue += net;
    }

    if (isAcceptedBuy(o) && !isFullRefund && o.orderStatus !== 'delivered') {
      const net = Math.max(0, o.grandTotal - refunded);
      inTransitRevenue += net;
    }

    if (['confirmed', 'processing', 'ready_for_dispatch', 'dispatched', 'delivered'].includes(o.orderStatus) &&
        ['pending', 'failed'].includes(o.paymentStatus)) {
      pendingPaymentsTotal += o.grandTotal;
      pendingPaymentsCount += 1;
    }
  });

  const prodTitleMap = new Map(products.map(p => [p.id, p.title]));
  const skuStockAndSales = Object.values(bySku).map(i => ({
    sku: i.sku,
    productId: i.productId,
    productName: prodTitleMap.get(i.productId) || i.productId,
    variantLabel: i.variantLabel || i.sku,
    availableQty: i.availableQty || 0,
    reservedQty: i.reservedQty || 0,
    remainingFreeQty: Math.max(0, (i.availableQty || 0) - (i.reservedQty || 0)),
    damagedQty: i.damagedQty || 0,
    acceptedSoldQty: skuAcceptedMap.get(i.sku) || 0,
    dispatchedSoldQty: skuDispatchedMap.get(i.sku) || 0,
    reorderThreshold: i.reorderThreshold ?? 8
  }));
  const whatsappResolvedTotal = confirmedCumulativeCount + notBoughtCount;
  const whatsappConversionRate = whatsappResolvedTotal > 0
    ? Math.round((confirmedCumulativeCount / whatsappResolvedTotal) * 100)
    : 0;

  const totalCollectedCash = payments.filter(p => p.type === 'collection' && p.paymentStatus === 'paid').reduce((s, p) => s + p.amount, 0);
  const upiCollected = payments.filter(p => p.type === 'collection' && p.paymentStatus === 'paid' && (p.paymentMethod === 'ONLINE' || p.paymentMethod === 'UPI')).reduce((s, p) => s + p.amount, 0);
  const codCollected = payments.filter(p => p.type === 'collection' && p.paymentStatus === 'paid' && (p.paymentMethod === 'COD' || p.paymentMethod === 'CASH')).reduce((s, p) => s + p.amount, 0);
  const totalRefunds = payments.filter(p => p.type === 'refund').reduce((s, p) => s + Math.abs(p.amount), 0);

  const activeProducts = products.filter(p => !p.archived && p.visible !== false);
  const invValues = Object.values(bySku);
  const totalAvailableUnits = invValues.reduce((s, i) => s + Math.max(0, i.availableQty - (i.reservedQty || 0)), 0);
  const lowStockItems = invValues.filter(i => i.availableQty - (i.reservedQty || 0) <= (i.reorderThreshold ?? 8));
  const outOfStockItems = invValues.filter(i => i.availableQty - (i.reservedQty || 0) <= 0);
  const damagedUnits = invValues.reduce((s, i) => s + (i.damagedQty || 0), 0);

  const expiringOrLowBatches = batches.filter(b => b.status === 'low' || b.status === 'expired');

  // Product-wise sales breakdown (verified paid & dispatched orders, net of full refunds)
  const productMixMap = new Map();
  orders.forEach(o => {
    if (!o.stockDeducted && !isDispatchedOrLater(o.orderStatus)) return;
    if (!['paid', 'partially_refunded'].includes(o.paymentStatus)) return;
    (o.itemsSnapshot || []).forEach(it => {
      const cur = productMixMap.get(it.productId) || { productId: it.productId, name: it.productName, qty: 0, amount: 0 };
      cur.qty += it.quantity;
      cur.amount += it.lineTotal;
      productMixMap.set(it.productId, cur);
    });
  });

  // Daily trend (last 14 days)
  const dailySeries = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const dayRev = orders
      .filter(o => (o.stockDeducted || isDispatchedOrLater(o.orderStatus)) && ['paid', 'partially_refunded'].includes(o.paymentStatus) && (o.createdAt || '').startsWith(key))
      .reduce((s, o) => s + Math.max(0, o.grandTotal - (refundsMap.get(o.orderId) || 0)), 0);
    const dayOrders = orders.filter(o => isAcceptedBuy(o) && (o.createdAt || '').startsWith(key)).length;
    dailySeries.push({ date: key, label, revenue: dayRev, orders: dayOrders });
  }

  return {
    orderRequestsCount,
    freshWhatsAppCount,
    dueFollowUpCount,
    waitingNotDueCount,
    acceptedBuysCount: confirmedCumulativeCount,
    acceptedBuysValue,
    acceptedUnitsSold,
    dispatchedUnitsSold,
    inTransitUnitsSold,
    deliveredUnitsSold,
    notBoughtCount,
    whatsappConversionRate,
    skuStockAndSales,
    confirmedActiveCount,
    confirmedCumulativeCount,
    dispatchedCount,
    deliveredCount,
    cancelledCount,
    returnedCount,
    paidDispatchedSales,
    deliveredPaidRevenue,
    inTransitRevenue,
    totalCollectedCash,
    upiCollected,
    codCollected,
    totalRefunds,
    netRevenue,
    pendingPaymentsTotal,
    pendingPaymentsCount,
    totalCustomers: customers.length,
    totalActiveProducts: activeProducts.length,
    totalProducts: products.filter(p => !p.archived).length,
    totalSkus: invValues.length,
    totalAvailableUnits,
    damagedUnits,
    lowStockCount: lowStockItems.length,
    outOfStockCount: outOfStockItems.length,
    lowStockItems,
    expiringOrLowBatches,
    productSalesDistribution: Array.from(productMixMap.values()).sort((a, b) => b.amount - a.amount),
    dailySeries,
    traffic: {
      totalViews: analytics.totalViews || 0,
      productViews: analytics.productViews || {},
      ga4MeasurementId: (db.catalog.settings && db.catalog.settings.ga4_measurement_id) || ''
    }
  };
}

function buildReportsData(db, filters = {}) {
  const fromMs = filters.from ? new Date(filters.from).getTime() : 0;
  const toMs = filters.to ? new Date(filters.to).getTime() + 86399000 : Number.MAX_SAFE_INTEGER;
  const inRange = iso => {
    if (!iso) return true;
    const t = new Date(iso).getTime();
    return t >= fromMs && t <= toMs;
  };

  const orders = (db.orders.orders || []).filter(o => inRange(o.createdAt));
  const payments = (db.payments.payments || []).filter(p => inRange(p.verifiedAt || p.createdAt));
  const movements = (db.movements.movements || []).filter(m => inRange(m.createdAt));
  const refundsMap = getOrderNetRefundsMap(db.payments.payments || []);
  const bySku = db.inventory.bySku || {};

  // SKU quantity sold: both Dispatched AND Accepted Buy (confirmed+)
  const skuMap = new Map();
  const acceptedSkuMap = new Map();
  orders.forEach(o => {
    if (o.orderStatus === 'cancelled') return;
    const isAccepted = !['pending_whatsapp', 'waiting_followup'].includes(o.orderStatus);
    if (isAccepted && o.paymentStatus !== 'refunded') {
      (o.itemsSnapshot || []).forEach(it => {
        const cur = acceptedSkuMap.get(it.sku) || { sku: it.sku, productId: it.productId, productName: it.productName, variant: it.variantLabel, qtySold: 0, grossSales: 0 };
        cur.qtySold += it.quantity;
        cur.grossSales += it.lineTotal;
        acceptedSkuMap.set(it.sku, cur);
      });
    }
    if (!o.stockDeducted && !['dispatched', 'delivered'].includes(o.orderStatus)) return;
    (o.itemsSnapshot || []).forEach(it => {
      const cur = skuMap.get(it.sku) || { sku: it.sku, productId: it.productId, productName: it.productName, variant: it.variantLabel, qtySold: 0, grossSales: 0 };
      cur.qtySold += it.quantity;
      cur.grossSales += it.lineTotal;
      skuMap.set(it.sku, cur);
    });
  });

  // Payment breakdown
  const upiPaid = payments.filter(p => p.type === 'collection' && p.paymentStatus === 'paid' && (p.paymentMethod === 'ONLINE' || p.paymentMethod === 'UPI')).reduce((s, p) => s + p.amount, 0);
  const codPaid = payments.filter(p => p.type === 'collection' && p.paymentStatus === 'paid' && (p.paymentMethod === 'COD' || p.paymentMethod === 'CASH')).reduce((s, p) => s + p.amount, 0);

  // Weekly & Monthly summaries from verified paid+dispatched orders
  const bucketSales = (keyFn) => {
    const map = new Map();
    orders.forEach(o => {
      if (!(o.stockDeducted || ['dispatched', 'delivered', 'return_inspected'].includes(o.orderStatus))) return;
      if (!['paid', 'partially_refunded', 'refunded'].includes(o.paymentStatus)) return;
      const key = keyFn(o.createdAt);
      const cur = map.get(key) || { period: key, orders: 0, gross: 0, refunds: 0, net: 0 };
      cur.orders += 1;
      cur.gross += o.grandTotal;
      const ref = refundsMap.get(o.orderId) || 0;
      cur.refunds += ref;
      cur.net += Math.max(0, o.grandTotal - ref);
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.period.localeCompare(a.period));
  };

  return {
    metrics: computeDashboardMetrics({ ...db, orders: { orders }, payments: { payments } }),
    dailySales: bucketSales(iso => String(iso).slice(0, 10)),
    monthlySales: bucketSales(iso => String(iso).slice(0, 7)),
    skuSales: Array.from(skuMap.values()).sort((a, b) => b.qtySold - a.qtySold),
    acceptedSkuSales: Array.from(acceptedSkuMap.values()).sort((a, b) => b.qtySold - a.qtySold),
    paymentSummary: {
      upiCollected: upiPaid,
      codCollected: codPaid,
      refundsIssued: payments.filter(p => p.type === 'refund').reduce((s, p) => s + Math.abs(p.amount), 0)
    },
    lowStockReport: Object.values(bySku).filter(i => i.availableQty - (i.reservedQty || 0) <= (i.reorderThreshold ?? 8)),
    recentMovements: movements.slice(0, 200),
    returnsAndCancellations: orders.filter(o => o.orderStatus === 'cancelled' || o.returnDetails)
  };
}

function generateReportCsv(db, reportType = 'orders', filters = {}) {
  const rep = buildReportsData(db, filters);
  let headers = [];
  let rows = [];

  if (reportType === 'skus') {
    headers = ['SKU', 'Product', 'Variant', 'Qty Dispatched', 'Gross Value (INR)'];
    rows = rep.skuSales.map(r => [r.sku, r.productName, r.variant, r.qtySold, r.grossSales]);
  } else if (reportType === 'inventory') {
    headers = ['Movement ID', 'Date', 'SKU', 'Type', 'Delta', 'Before', 'After', 'Order Ref', 'Batch Ref', 'Reason', 'By'];
    rows = (db.movements.movements || []).map(m => [
      m.movementId, m.createdAt, m.sku, m.movementType, m.qtyDelta, m.qtyBefore, m.qtyAfter, m.referenceOrderId || '', m.batchId || '', m.reason, m.createdBy
    ]);
  } else if (reportType === 'low_stock') {
    headers = ['SKU', 'Variant', 'Available', 'Reserved', 'Unreserved Free', 'Damaged', 'Reorder Threshold'];
    rows = Object.values(db.inventory.bySku || {}).map(i => [
      i.sku, i.variantLabel, i.availableQty, i.reservedQty || 0, Math.max(0, i.availableQty - (i.reservedQty || 0)), i.damagedQty || 0, i.reorderThreshold ?? 8
    ]);
  } else if (reportType === 'payments') {
    headers = ['Payment ID', 'Order ID', 'Type', 'Method', 'Status', 'Amount (INR)', 'Reference', 'Verified By', 'Verified At', 'Notes'];
    rows = (db.payments.payments || []).map(p => [
      p.paymentId, p.orderId, p.type, p.paymentMethod, p.paymentStatus, p.amount, p.transactionReference, p.verifiedBy, p.verifiedAt, p.notes
    ]);
  } else {
    headers = ['Order ID', 'Created At', 'Customer', 'Phone', 'Items', 'Subtotal', 'Discount', 'Shipping/COD', 'Grand Total', 'Order Status', 'Payment Status', 'Method', 'Stock Deducted'];
    rows = (db.orders.orders || []).map(o => [
      o.orderId,
      o.createdAt,
      o.customerSnapshot?.name || '',
      o.customerSnapshot?.phone || '',
      (o.itemsSnapshot || []).map(i => `${i.sku} x${i.quantity}`).join('; '),
      o.subtotal,
      o.discountAmount || 0,
      o.shippingCharge || 0,
      o.grandTotal,
      o.orderStatus,
      o.paymentStatus,
      o.paymentMethod,
      o.stockDeducted ? 'YES' : 'NO'
    ]);
  }

  return [headers, ...rows].map(line => line.map(csvSafeCell).join(',')).join('\r\n');
}

function buildCustomersDirectory(db) {
  const customers = (db.customers && db.customers.customers) || [];
  const orders = (db.orders && db.orders.orders) || [];
  const refundsMap = getOrderNetRefundsMap((db.payments && db.payments.payments) || []);

  return customers.map(c => {
    const cOrders = orders.filter(o => o.customerId === c.customerId || o.customerSnapshot?.phone === c.phone);
    const acceptedOrders = cOrders.filter(o => !['pending_whatsapp', 'waiting_followup', 'cancelled'].includes(o.orderStatus));
    const verifiedSpend = cOrders
      .filter(o => (o.stockDeducted || ['dispatched', 'delivered'].includes(o.orderStatus)) && ['paid', 'partially_refunded'].includes(o.paymentStatus))
      .reduce((s, o) => s + Math.max(0, o.grandTotal - (refundsMap.get(o.orderId) || 0)), 0);
    const acceptedSpend = acceptedOrders
      .filter(o => o.paymentStatus !== 'refunded')
      .reduce((s, o) => s + Math.max(0, o.grandTotal - (refundsMap.get(o.orderId) || 0)), 0);
    const lastOrder = cOrders[0] || null;
    return {
      ...c,
      totalOrders: acceptedOrders.length,
      totalRequests: cOrders.length,
      acceptedSpend,
      verifiedSpend,
      lastOrderAt: lastOrder ? lastOrder.createdAt : null,
      orders: cOrders
    };
  });
}

return {
  HttpError,
  normalizePhone,
  appendAudit,
  recordMovement,
  resolveVariantAndProduct,
  addNiche,
  upsertProduct,
  setProductVisibility,
  deleteOrArchiveProduct,
  adjustInventory,
  bulkSetInventory,
  holdInventoryReservation,
  releaseInventoryReservation,
  createOrUpdateBatch,
  deleteBatchRecord,
  upsertDiscount,
  deleteDiscount,
  calculateCheckoutQuote,
  createOrderRequest,
  verifyWhatsAppBuy,
  markWhatsAppMessageSent,
  buildCourierTrackingUrl,
  buildWhatsAppMessagesForOrder,
  isFollowUpDue,
  confirmOrder,
  advanceOrderStatus,
  dispatchOrder,
  deliverOrder,
  cancelOrder,
  recordOrderPayment,
  processOrderReturn,
  processOrderRefund,
  computeDashboardMetrics,
  buildReportsData,
  generateReportCsv,
  buildCustomersDirectory
};
}));
