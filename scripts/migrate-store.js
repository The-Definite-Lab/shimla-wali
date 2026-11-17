/**
 * Shimla Crunch — Non-Destructive Data Migration & Store Seeder
 * Migrates legacy products.json + product.html catalog details into normalized db/*.json
 * Automatically creates a backup snapshot before modifying any store files.
 */
const fs = require('fs');
const path = require('path');
const { DEFAULT_NICHES, buildStructuredSku, computeDiscountPercent } = require('../server/sku');
const { writeJsonAtomic } = require('../server/db');

const RICH_PDP_DEFAULTS = {
  ghee: {
    niche: 'ghee',
    nicheTag: 'GHSM',
    specTag: '100% VEDIC BILONA METHOD • HIMALAYAN INDIGENOUS COWS',
    gallery: ['./images/shimla-ghee.webp', './images/farm-cows.webp'],
    initialStock: { '250ml': 18, '500ml': 24, '1000ml': 12 },
    reorderDefault: 10,
    sizes: [
      { size: '250ml', price: 649, mrp: 800, reorderThreshold: 8 },
      { size: '500ml', price: 1199, mrp: 1500, default: true, reorderThreshold: 10 },
      { size: '1000ml', price: 2199, mrp: 2800, reorderThreshold: 5 }
    ],
    specs: {
      ingredients: '100% Pure Cultured A2 Himalayan Cow Curd Butter.',
      method: 'Traditional Vedic Bilona Hand-Churning in clay and brass cookware.',
      nutrients: 'Rich in Omega-3, Omega-6, Butyric Acid, Vitamin A, D, E, and K2.',
      purity: 'Zero preservatives, zero palm oil, zero chemical bleaching.'
    },
    methodTitle: 'VEDIC BILONA METHOD (5 STEPS)',
    methodSteps: [
      '1. Fresh Himalayan A2 Milk boiled and cultured into probiotic curd.',
      '2. Hand-churned with bi-directional wooden Bilona to separate cultured butter.',
      '3. Slow simmered on low flame in traditional brass vessels.',
      '4. Golden liquid strained through organic muslin cloth.',
      '5. Packed in sealed glass jars to lock in divine hill aroma.'
    ],
    mathTitle: 'The Math of Vedic Bilona Purity',
    mathSteps: [
      { val: '1 Pahadi Cow', label: 'Herb-grazing in Shimla hills' },
      { val: '25–30 Litres', label: 'Fresh Himalayan A2 milk' },
      { val: 'Curd → Bilona', label: 'Traditional wooden hand churn' },
      { val: 'Slow Fire', label: 'Simmered in pure brass & clay' },
      { val: 'Pure Liquid Gold', label: 'Shimla Crunch A2 Desi Ghee' }
    ]
  },
  walnuts: {
    niche: 'dryfruits',
    nicheTag: 'AKSM',
    specTag: '100% FARM FRESH • THIN SHELLED (KAGZI) • HIGH OMEGA-3',
    gallery: ['./images/himachali-walnuts.webp', './images/walnuts-cracked.webp', './images/walnut-tree-harvest.webp'],
    initialStock: { '250g': 15, '500g': 22, '1kg': 14 },
    reorderDefault: 8,
    sizes: [
      { size: '250g', price: 299, mrp: 400, reorderThreshold: 8 },
      { size: '500g', price: 549, mrp: 750, default: true, reorderThreshold: 8 },
      { size: '1kg', price: 999, mrp: 1400, reorderThreshold: 5 }
    ],
    specs: {
      ingredients: '100% Raw Thin-Shelled Mountain Walnuts (Kagzi Akhrot).',
      method: 'Natural tree ripening in high-altitude Shimla & Kinnaur orchards.',
      nutrients: 'Packed with brain-boosting Alpha-Linolenic Acid (Omega-3), Vitamin E & Polyphenols.',
      purity: 'Zero sulfur, zero chlorine bleaching, 100% unadulterated golden kernels.'
    },
    methodTitle: 'MOUNTAIN HARVEST & CURING',
    methodSteps: [
      '1. Harvested in crisp autumn sunshine from 7,500+ ft altitude orchards.',
      '2. Green outer husks removed by hand to preserve natural nut shell.',
      '3. Naturally sun-dried on clean terrace mats under Himalayan sun.',
      '4. Hand-cracked testing to ensure plump, golden kernels inside.',
      '5. Sealed in breathable eco-pouches to prevent natural oil rancidity.'
    ],
    mathTitle: 'The Story of Mountain Walnut Harvest',
    mathSteps: [
      { val: '7,500+ ft Altitude', label: 'Sunny Shimla orchards' },
      { val: 'Zero Bleaching', label: 'Natural protective shells' },
      { val: 'Hand Cracking', label: 'Cracks with gentle pressure' },
      { val: 'Cold Climate', label: 'Rich natural walnut oil locked' },
      { val: 'Grade-A Kernels', label: 'Shimla Crunch Walnuts' }
    ]
  },
  honey: {
    niche: 'honey',
    nicheTag: 'HNSM',
    specTag: '100% RAW & UNPROCESSED • MULTIFLORA NECTAR',
    gallery: ['./images/pure-honey.webp?v=2', './images/pure-honey-dipper.webp'],
    initialStock: { '500g': 8, '1kg': 6 },
    reorderDefault: 10,
    sizes: [
      { size: '500g', price: 599, mrp: 799, default: true, reorderThreshold: 10 },
      { size: '1kg', price: 1099, mrp: 1500, reorderThreshold: 5 }
    ],
    specs: {
      ingredients: '100% Raw Unpasteurized Himalayan Multiflora Honey.',
      method: 'Wild forest comb harvest using sustainable bee-friendly practices.',
      nutrients: 'Natural pollen, active live enzymes, royal jelly traces & antimicrobial properties.',
      purity: 'Zero added sugar syrups, zero corn syrup, zero thermal degradation.'
    },
    methodTitle: 'WILD ALPINE NECTAR HARVEST',
    methodSteps: [
      '1. Indigenous bees gather nectar from wild deodar forests and alpine flora.',
      '2. Comb collected without harming wild bee colonies.',
      '3. Cold-gravity filtration through multi-layer food mesh.',
      '4. Zero pasteurization to retain beneficial live pollen & enzymes.',
      '5. Bottled directly in pure glass jars.'
    ],
    mathTitle: 'Pure Wild Alpine Nectar Story',
    mathSteps: [
      { val: 'Alpine Flora', label: 'Wild medicinal mountain blossoms' },
      { val: 'Himalayan Bees', label: 'Naturally built comb honey' },
      { val: 'Zero Heating', label: 'Raw enzymes & pollen preserved' },
      { val: 'Pure Filtration', label: 'Traditional fine cotton mesh' },
      { val: 'Pure Amber Gold', label: 'Shimla Crunch Forest Honey' }
    ]
  },
  pickle: {
    niche: 'pickle',
    nicheTag: 'PKSM',
    specTag: 'VILLAGE HOMEMADE • MOUNTAIN MUSTARD OIL • SUN CURED',
    gallery: ['./images/homemade-pickle.webp?v=2', './images/pickle-martaban.webp'],
    varieties: ['Pahadi Galgal (Hill Lemon)', 'Kacha Aam & Green Chilly', 'Mixed Mountain Spices'],
    initialStock: { '400g': 10, '800g': 8 },
    reorderDefault: 10,
    sizes: [
      { size: '400g', price: 349, mrp: 450, default: true, reorderThreshold: 10 },
      { size: '800g', price: 649, mrp: 850, reorderThreshold: 6 }
    ],
    specs: {
      ingredients: 'Wild Hill Galgal (Citrus), Green Mango, Cold-Pressed Mustard Oil, Fenugreek, Kalonji, Rock Salt.',
      method: 'Hand-sliced and naturally sun-cured in traditional ceramic martabans.',
      nutrients: 'Natural digestive probiotics, Vitamin C, stomach-soothing hill spices.',
      purity: 'Zero chemical vinegar, zero synthetic citric acid, zero artificial color.'
    },
    methodTitle: 'HEIRLOOM 21-DAY SUN CURING',
    methodSteps: [
      '1. Hand-picked hill produce cut and mixed with crushed whole spices.',
      '2. Steeped in wood-pressed mustard oil with pure pink Himalayan salt.',
      '3. Jars sunbathed daily on terrace rooftops for 21 days.',
      '4. Natural lacto-fermentation develops complex spicy tangy flavor.',
      '5. Packaged without chemical stabilizers.'
    ],
    mathTitle: 'Heirloom Sun-Cooked Village Recipe',
    mathSteps: [
      { val: 'Local Produce', label: 'Mountain Galgal, Mango & Chillies' },
      { val: 'Kachi Ghani', label: 'Cold-pressed mountain mustard oil' },
      { val: 'Sun Cured', label: '21 days of slow terrace sunbathing' },
      { val: 'Zero Preservative', label: 'Traditional Himalayan rock salt' },
      { val: 'Pahadi Swad', label: 'Shimla Crunch Homemade Pickle' }
    ]
  },
  apples: {
    niche: 'apples',
    nicheTag: 'APSM',
    specTag: 'FRESH ORCHARD HARVEST • TREE RIPENED • ZERO WAX',
    gallery: ['./images/shimla-apples.webp'],
    initialStock: { '5kg Box': 20, '10kg Box': 10 },
    reorderDefault: 8,
    sizes: [
      { size: '5kg Box', price: 1249, mrp: 1600, default: true, reorderThreshold: 8 },
      { size: '10kg Box', price: 2299, mrp: 3000, reorderThreshold: 4 }
    ],
    specs: {
      ingredients: '100% Freshly Picked Shimla Royal Delicious Apples.',
      method: 'Hand-plucked at optimal brix sweetness from high-altitude slopes.',
      nutrients: 'Dietary pectin fiber, Vitamin C, natural potassium and polyphenols.',
      purity: 'Never wax-coated, never chemically ripened in cold storage gas chambers.'
    },
    methodTitle: 'HIGH-ALTITUDE ORCHARD TO DOORSTEP',
    methodSteps: [
      '1. Nurtured by snow-melt springs and mountain fog at 7,500+ ft.',
      '2. Hand-plucked with stems intact to retain natural moisture.',
      '3. Graded by size and checked for crisp natural snap.',
      '4. Individual foam netting placed on each apple.',
      '5. Express dispatched in ventilated protective corrugated crates.'
    ],
    mathTitle: 'Straight from Mountain Orchards',
    mathSteps: [
      { val: '7,500+ ft Altitude', label: 'Chilled snow-fed breeze' },
      { val: 'Tree Ripened', label: 'Picked by hand at sweet peak' },
      { val: 'Zero Wax Polish', label: '100% natural edible apple skin' },
      { val: 'Foam Cushioned', label: 'Safe transit to your doorstep' },
      { val: 'Crisp & Sweet', label: 'Shimla Crunch Royal Apples' }
    ]
  },
  'red-rice': {
    niche: 'rice',
    nicheTag: 'RCSM',
    specTag: 'ANCIENT HEIRLOOM SEED • UNPOLISHED BRAN • LOW GI',
    gallery: ['./images/himachali-red-rice.webp?v=2', './images/red-rice-paddy.webp'],
    initialStock: { '1kg': 25, '2kg': 16, '5kg': 9 },
    reorderDefault: 10,
    sizes: [
      { size: '1kg', price: 249, mrp: 320, default: true, reorderThreshold: 10 },
      { size: '2kg', price: 469, mrp: 620, reorderThreshold: 6 },
      { size: '5kg', price: 1099, mrp: 1500, reorderThreshold: 4 }
    ],
    specs: {
      ingredients: '100% Whole Grain Unpolished Himachali Red Rice.',
      method: 'Cultivated in stepped mountain terraces fed by glacial streams.',
      nutrients: 'Dense in iron, zinc, natural antioxidants (anthocyanins), and complex fibers.',
      purity: 'Zero chemical polishing, unbleached, retaining its whole natural red bran.'
    },
    methodTitle: 'TRADITIONAL VALLEY CULTIVATION',
    methodSteps: [
      '1. Grown in high-altitude Chhohara Valley in crystal clear glacier streams.',
      '2. Harvested by hand using traditional sickles.',
      '3. Naturally sun-cured on high wooden platforms.',
      '4. Gentle de-husking keeps the nutritious ruby-red bran layer intact.',
      '5. Packed in breathable cotton and jute bags.'
    ],
    mathTitle: 'Heirloom Himalayan Chhohartu Rice',
    mathSteps: [
      { val: 'Glacier Stream', label: 'Snow-melt irrigation' },
      { val: 'Heirloom Seed', label: 'Untouched mountain genetics' },
      { val: 'Red Bran Intact', label: 'Rich in natural iron & zinc' },
      { val: 'Low Glycemic', label: 'Sustained healthy energy' },
      { val: 'Nutty & Fragrant', label: 'Shimla Crunch Red Rice' }
    ]
  },
  pulses: {
    niche: 'pulses',
    nicheTag: 'RJSM',
    specTag: 'SNOW-FED MOUNTAIN HARVEST • ORGANIC SOIL • RICH PROTEIN',
    gallery: ['./images/pahadi-rajma.webp', './images/rajma-village-drying.webp'],
    initialStock: { '1kg': 20, '2kg': 14 },
    reorderDefault: 8,
    sizes: [
      { size: '1kg', price: 269, mrp: 350, default: true, reorderThreshold: 8 },
      { size: '2kg', price: 499, mrp: 680, reorderThreshold: 6 }
    ],
    specs: {
      ingredients: '100% Organic Small-Grain Himalayan Red Kidney Beans.',
      method: 'Cultivated on steep terraced farms in Kinnaur & Chamba.',
      nutrients: 'High dietary fiber, plant protein, folate, potassium and magnesium.',
      purity: 'Unpolished, chemical-free, dissolves into a silky thick gravy.'
    },
    methodTitle: 'ORGANIC MOUNTAIN PULSE HARVEST',
    methodSteps: [
      '1. Grown in mineral-dense soil watered only by Himalayan rains and snowmelt.',
      '2. Hand-picked pods opened gently by village women.',
      '3. Sun dried on mountain terraces to achieve optimal moisture balance.',
      '4. Winnowed in wicker baskets to eliminate chaff naturally.',
      '5. Hand-sealed in airtight freshness pouches.'
    ],
    mathTitle: 'Organic Terraced Himalayan Farming',
    mathSteps: [
      { val: 'Chamba & Kinnaur', label: 'Snow-melt glacier water' },
      { val: 'Natural Manure', label: 'Zero artificial fertilizers' },
      { val: 'Small-Grain Bean', label: 'Distinctive buttery taste' },
      { val: 'Sun Dried', label: 'Traditional terrace sun curing' },
      { val: 'Authentic Dal', label: 'Shimla Crunch Pahadi Rajma' }
    ]
  }
};

function defaultContentFromSettings(settings = {}) {
  return {
    announcement_bar: 'From Our Hills To Your Home',
    hero_heading: 'Pure Mountain Harvest, Delivered Fresh.',
    hero_description: 'Dispatched in fresh small artisanal batches with zero chemical preservatives, shipped straight from Shimla to your doorstep.',
    marquee_items: [
      'FROM OUR HILLS TO YOUR HOME',
      '100% PURE A2 PAHADI COW BILONA GHEE',
      'HIMACHALI KAGZI WALNUTS',
      'PURE WILD FOREST RAW HONEY',
      'TRADITIONAL HOMEMADE PAHADI PICKLES',
      'SHIMLA ROYAL DELICIOUS APPLES'
    ],
    about_heading: 'Crafted by Mountain Households Across Himachal',
    about_body: 'We partner directly with family farms across Shimla, Kinnaur, and Chamba to bring small-batch A2 Bilona Ghee, raw mountain honey, heirloom grains, and sun-cured staples straight to your kitchen.',
    featured_product_ids: ['ghee', 'walnuts', 'honey', 'pickle', 'apples', 'red-rice', 'pulses'],
    sections: {
      featured_products: true,
      our_story: true,
      customer_reviews: true,
      verify_banner: true
    },
    footer_note: settings.tagline || 'From Our Hills To Your Home'
  };
}

function runMigrationIfNeeded(storeManager, legacyProductsFile) {
  const catalogPath = path.join(storeManager.dbDir, 'catalog.json');
  if (fs.existsSync(catalogPath)) {
    return { migrated: false };
  }

  let legacy = { products: [], settings: {}, batches: [], media: {} };
  if (legacyProductsFile && fs.existsSync(legacyProductsFile)) {
    const rawText = fs.readFileSync(legacyProductsFile, 'utf8');
    legacy = JSON.parse(rawText);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    writeJsonAtomic(path.join(storeManager.backupsDir, `products.pre-upgrade-${stamp}.json`), legacy);
  }

  const now = new Date().toISOString();
  const bySku = {};
  const movements = [];
  const usedSkus = [];

  const migratedProducts = (legacy.products || []).map(p => {
    const rich = RICH_PDP_DEFAULTS[p.id] || {};
    const niche = rich.niche || p.category || 'ghee';
    const nicheTag = rich.nicheTag || 'SWSM';
    const sizes = rich.sizes || [{ size: p.subtitle || 'Standard', price: Number(p.price) || 0, mrp: Number(p.mrp) || 0, default: true }];
    const varieties = rich.varieties || (typeof p.varieties === 'string' && p.varieties.trim()
      ? p.varieties.split(',').map(s => s.trim()).filter(Boolean)
      : []);

    const variants = [];
    const hasExplicitDef = sizes.some(s => Boolean(s.default));
    if (varieties.length > 0) {
      varieties.forEach((varietyName, vIdx) => {
        sizes.forEach((sz, sIdx) => {
          const isDef = vIdx === 0 && (hasExplicitDef ? Boolean(sz.default) : sIdx === 0);
          const price = isDef && p.price ? Number(p.price) : Number(sz.price);
          const mrp = isDef && p.mrp ? Number(p.mrp) : Number(sz.mrp);
          const sku = buildStructuredSku({ nicheTag, size: sz.size, variety: varietyName, existingSkus: usedSkus });
          usedSkus.push(sku);

          const startQty = (rich.initialStock && rich.initialStock[sz.size]) ?? 10;
          const threshold = sz.reorderThreshold ?? rich.reorderDefault ?? 8;
          bySku[sku] = {
            sku,
            productId: p.id,
            variantLabel: `${varietyName} · ${sz.size}`,
            availableQty: startQty,
            reservedQty: 0,
            damagedQty: 0,
            reorderThreshold: threshold,
            updatedAt: now
          };
          movements.push({
            movementId: `MOV-INIT-${usedSkus.length}`,
            sku,
            productId: p.id,
            movementType: 'stock_received',
            qtyDelta: startQty,
            qtyBefore: 0,
            qtyAfter: startQty,
            referenceOrderId: null,
            batchId: p.batchNo || null,
            reason: 'Initial catalog migration opening stock',
            createdBy: 'system:migration',
            createdAt: now
          });

          variants.push({
            sku,
            legacySku: isDef ? (p.sku || '') : '',
            label: `${varietyName} · ${sz.size}`,
            size: sz.size,
            variety: varietyName,
            price,
            mrp,
            discount: computeDiscountPercent(price, mrp) || (sz.discount || ''),
            reorderThreshold: threshold,
            isDefault: isDef,
            visible: true
          });
        });
      });
    } else {
      sizes.forEach((sz, idx) => {
        const isDef = hasExplicitDef ? Boolean(sz.default) : idx === 0;
        const price = isDef && p.price ? Number(p.price) : Number(sz.price);
        const mrp = isDef && p.mrp ? Number(p.mrp) : Number(sz.mrp);
        const sku = buildStructuredSku({ nicheTag, size: sz.size, sequence: 1, existingSkus: usedSkus });
        usedSkus.push(sku);

        const startQty = (rich.initialStock && rich.initialStock[sz.size]) ?? 12;
        const threshold = sz.reorderThreshold ?? rich.reorderDefault ?? 8;
        bySku[sku] = {
          sku,
          productId: p.id,
          variantLabel: sz.size,
          availableQty: startQty,
          reservedQty: 0,
          damagedQty: 0,
          reorderThreshold: threshold,
          updatedAt: now
        };
        movements.push({
          movementId: `MOV-INIT-${usedSkus.length}`,
          sku,
          productId: p.id,
          movementType: 'stock_received',
          qtyDelta: startQty,
          qtyBefore: 0,
          qtyAfter: startQty,
          referenceOrderId: null,
          batchId: p.batchNo || null,
          reason: 'Initial catalog migration opening stock',
          createdBy: 'system:migration',
          createdAt: now
        });

        variants.push({
          sku,
          legacySku: isDef ? (p.sku || '') : '',
          label: sz.size,
          size: sz.size,
          variety: '',
          price,
          mrp,
          discount: computeDiscountPercent(price, mrp) || (sz.discount || ''),
          reorderThreshold: threshold,
          isDefault: isDef,
          visible: true
        });
      });
    }

    const defVar = variants.find(v => v.isDefault) || variants[0];
    return {
      id: p.id,
      slug: p.id,
      title: p.title,
      subtitle: p.subtitle,
      niche,
      nicheTag,
      sku: defVar ? defVar.sku : p.sku,
      legacySku: p.sku || '',
      price: defVar ? defVar.price : Number(p.price),
      mrp: defVar ? defVar.mrp : Number(p.mrp),
      discount: defVar ? defVar.discount : (p.discount || ''),
      image: p.image,
      gallery: rich.gallery || [p.image],
      link: p.link || `product.html?id=${p.id}`,
      badge: p.badge || '',
      rating: p.rating || 4.9,
      reviews: p.reviews || 0,
      category: p.category || niche,
      packType: p.packType || '',
      optionLabel: p.optionLabel || 'SELECT PACK SIZE',
      specTag: rich.specTag || '',
      description: p.description || '',
      origin: p.origin || '',
      varieties,
      variants,
      specs: rich.specs || {},
      methodTitle: rich.methodTitle || '',
      methodSteps: rich.methodSteps || [],
      mathTitle: rich.mathTitle || '',
      mathSteps: rich.mathSteps || [],
      visible: p.visible !== false,
      archived: false,
      status: p.tag === 'upcoming' ? 'upcoming' : 'active',
      tag: p.tag || 'always_available',
      pillText: p.pillText || '',
      carouselNote: p.carouselNote || '',
      batchNo: p.batchNo || '',
      upcomingDate: p.upcomingDate || null,
      createdAt: now,
      updatedAt: now
    };
  });

  const migratedBatches = (legacy.batches || []).map(b => {
    const prod = migratedProducts.find(pr => pr.id === b.productId);
    const matchedVar = prod
      ? prod.variants.find(v => v.size.toLowerCase() === String(b.size || '').toLowerCase()) || prod.variants.find(v => v.isDefault)
      : null;
    const invQty = matchedVar && bySku[matchedVar.sku] ? bySku[matchedVar.sku].availableQty : 20;
    return {
      id: b.id,
      productId: b.productId,
      sku: matchedVar ? matchedVar.sku : '',
      nicheTag: prod ? prod.nicheTag : 'SWSM',
      sizeLabel: b.size || (matchedVar ? matchedVar.size : 'Standard'),
      productionDate: b.date || '',
      bestBeforeDate: '',
      initialQty: invQty,
      remainingQty: invQty,
      status: invQty === 0 ? 'depleted' : invQty <= (matchedVar?.reorderThreshold || 8) ? 'low' : 'active',
      originNote: prod ? prod.origin : '',
      report: b.report || null,
      labStatus: b.report ? 'Uploaded' : 'Testing in Progress',
      createdAt: now,
      updatedAt: now
    };
  });

  const settings = {
    ...(legacy.settings || {}),
    whatsapp_number: '918580861606',
    support_email: 'care@shimlacrunch.com',
    upi_id: '',
    accept_orders: true,
    allow_guest_checkout: true,
    cod_fee: 25,
    ga4_measurement_id: ''
  };

  storeManager.saveChanged(
    {
      catalog: {
        products: migratedProducts,
        niches: DEFAULT_NICHES,
        settings,
        media: legacy.media || {},
        content: defaultContentFromSettings(settings)
      },
      inventory: { bySku },
      movements: { movements },
      batches: { batches: migratedBatches },
      orders: { orders: [] },
      payments: { payments: [] },
      customers: { customers: [] },
      discounts: { discounts: [] },
      auditLogs: {
        logs: [
          {
            logId: 'LOG-INIT-01',
            actor: 'system:migration',
            role: 'system',
            action: 'db_migration',
            entityType: 'system',
            entityId: 'products.json',
            summary: `Migrated ${migratedProducts.length} products, ${usedSkus.length} SKUs, and ${migratedBatches.length} batches`,
            ip: 'local',
            createdAt: now
          }
        ]
      },
      analytics: { totalViews: 0, viewsByDate: {}, productViews: {} },
      sessions: { sessions: [] }
    }
  );

  return { migrated: true, products: migratedProducts.length, skus: usedSkus.length, batches: migratedBatches.length };
}

module.exports = { runMigrationIfNeeded, RICH_PDP_DEFAULTS, defaultContentFromSettings };
