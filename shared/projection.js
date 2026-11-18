/**
 * Shimla Crunch — Shared Public Catalog & Storefront Projection Builder
 * Used identically by both local Node (server/db.js) and Firebase Spark (firebase-bridge.js).
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ShimlaProjection = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function buildPublicProductsProjection(db) {
    const catalog = (db && db.catalog) || {};
    const bySku = (db && db.inventory && db.inventory.bySku) || {};
    const allBatches = (db && db.batches && db.batches.batches) || [];

    const publicProducts = (catalog.products || [])
      .filter(p => !p.archived && p.visible !== false)
      .map(p => {
        const variants = (p.variants || []).map(v => {
          const invKey = v.sku || v.id || `${p.id}-${v.id}`;
          const inv = bySku[invKey] || (v.sku && bySku[v.sku]) || null;
          const hasInv = Boolean(inv && typeof inv.availableQty === 'number');
          const freeQty = hasInv
            ? Math.max(0, (inv.availableQty || 0) - (inv.reservedQty || 0))
            : ((v.inStock !== false && p.inStock !== false) ? (v.availableUnits ?? 15) : 0);
          const isStocked = (v.inStock !== false && p.inStock !== false) && (hasInv ? freeQty > 0 : (freeQty > 0 || v.inStock === true));
          const sizeVal = v.size || v.name || v.label || (v.id ? v.id.toUpperCase() : 'Standard');
          const availUnits = hasInv ? freeQty : (isStocked ? (v.availableUnits ?? 15) : 0);
          const threshold = Number((inv && inv.reorderThreshold) ?? v.reorderThreshold) || 5;
          return {
            sku: v.sku || invKey,
            legacySku: v.legacySku || '',
            label: v.name || v.label || sizeVal,
            size: sizeVal,
            variety: v.variety || '',
            price: Number(v.price) || 0,
            mrp: Number(v.mrp) || 0,
            discount: v.discount || (v.mrp > v.price ? Math.round((1 - v.price / v.mrp) * 100) + '% OFF' : ''),
            isDefault: Boolean(v.isDefault),
            visible: v.visible !== false,
            inStock: isStocked,
            availableUnits: availUnits,
            lowStock: isStocked && availUnits > 0 && availUnits <= threshold
          };
        });

        const defaultVar = variants.find(v => v.isDefault && v.visible) || variants[0];
        const totalFree = variants.reduce((sum, v) => sum + (v.visible ? (v.availableUnits || 0) : 0), 0);

        return {
          id: p.id,
          slug: p.slug || p.id,
          title: p.title,
          subtitle: p.subtitle,
          sku: defaultVar ? defaultVar.sku : p.sku,
          legacySku: p.legacySku || '',
          price: defaultVar ? defaultVar.price : Number(p.price) || 0,
          mrp: defaultVar ? defaultVar.mrp : Number(p.mrp) || 0,
          discount: (defaultVar && defaultVar.discount) || p.discount || '',
          image: p.image,
          gallery: Array.isArray(p.gallery) && p.gallery.length ? p.gallery : [p.image],
          link: p.link || `product.html?id=${encodeURIComponent(p.id)}`,
          badge: p.badge || '',
          rating: p.rating || 4.9,
          reviews: p.reviews || 0,
          category: p.category || p.niche || 'ghee',
          niche: p.niche || p.category || 'ghee',
          nicheTag: p.nicheTag || 'SWSM',
          packType: p.packType || '',
          optionLabel: p.optionLabel || 'SELECT PACK SIZE',
          specTag: p.specTag || '',
          description: p.description || '',
          origin: p.origin || '',
          varieties: Array.isArray(p.varieties) ? p.varieties : [],
          variants,
          specs: p.specs || {},
          methodTitle: p.methodTitle || '',
          methodSteps: Array.isArray(p.methodSteps) ? p.methodSteps : [],
          mathTitle: p.mathTitle || '',
          mathSteps: Array.isArray(p.mathSteps) ? p.mathSteps : [],
          visible: p.visible !== false,
          status: totalFree <= 0 && p.status !== 'upcoming' ? 'out_of_stock' : (p.status || 'active'),
          tag: p.tag || 'always_available',
          pillText: p.pillText || '',
          carouselNote: p.carouselNote || '',
          batchNo: p.batchNo || '',
          upcomingDate: p.upcomingDate || null,
          inStock: totalFree > 0,
          availableUnits: totalFree
        };
      });

    const publicBatches = allBatches
      .filter(b => b.status !== 'quarantined')
      .map(b => ({
        id: b.id,
        productId: b.productId,
        sku: b.sku || '',
        nicheTag: b.nicheTag || '',
        date: b.productionDate || b.date || '',
        bestBeforeDate: b.bestBeforeDate || '',
        size: b.sizeLabel || b.size || '',
        status: b.status || 'active',
        report: b.report || null
      }));

    const s = catalog.settings || {};
    const cleanBrand = (!s.brand_name || /shimla[\s_-]*wali/i.test(s.brand_name)) ? 'Shimla Crunch' : s.brand_name;
    const cleanInsta = (!s.instagram || /shimla_wali/i.test(s.instagram)) ? 'https://www.instagram.com/shimlacrunch' : s.instagram;
    const cleanInstaHandle = (!s.instagram_handle || /shimla_wali/i.test(s.instagram_handle)) ? '@shimlacrunch' : s.instagram_handle;
    const publicSettings = {
      brand_name: cleanBrand,
      tagline: s.tagline || '',
      phone: s.phone || '+91 8580861606',
      whatsapp_number: s.whatsapp_number || '918580861606',
      support_email: s.support_email || 'care@shimlacrunch.com',
      instagram: cleanInsta,
      instagram_handle: cleanInstaHandle,
      fssai_number: s.fssai_number || '',
      maker_households: s.maker_households || '',
      maker_districts: s.maker_districts || '',
      maker_method: s.maker_method || '',
      verify_page_note: s.verify_page_note || '',
      accept_orders: s.accept_orders !== false,
      allow_guest_checkout: s.allow_guest_checkout !== false,
      cod_fee: Number.isFinite(Number(s.cod_fee)) ? Number(s.cod_fee) : 25,
      ga4_measurement_id: s.ga4_measurement_id || ''
    };

    const activeDiscounts = ((db && db.discounts && db.discounts.discounts) || [])
      .filter(d => d.active)
      .map(d => ({
        code: d.code,
        title: d.title,
        type: d.type || 'percent',
        value: Number(d.value) || 0,
        minOrderAmount: Number(d.minOrderAmount) || 0
      }));

    const publicContent = { ...(catalog.content || {}) };
    if (Array.isArray(publicContent.marquee_items)) {
      publicContent.marquee_items = publicContent.marquee_items.filter(s => !/[\u0900-\u097F]/.test(String(s || '')));
    }

    return {
      products: publicProducts,
      niches: catalog.niches || [],
      settings: publicSettings,
      batches: publicBatches,
      media: catalog.media || {},
      content: publicContent,
      discounts: activeDiscounts
    };
  }

  return { buildPublicProductsProjection };
}));
