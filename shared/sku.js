/**
 * Shimla Crunch — Niche & Structured Alphanumeric SKU / Batch Helpers
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ShimlaSku = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function() {
const DEFAULT_NICHES = [
  { id: 'ghee', name: 'A2 Desi Ghee', tag: 'GHSM' },
  { id: 'dryfruits', name: 'Walnuts & Dry Fruits', tag: 'AKSM' },
  { id: 'honey', name: 'Raw Forest Honey', tag: 'HNSM' },
  { id: 'pickle', name: 'Homemade Pahadi Pickle', tag: 'PKSM' },
  { id: 'apples', name: 'Orchard Apples & Fruits', tag: 'APSM' },
  { id: 'rice', name: 'Heirloom Mountain Rice', tag: 'RCSM' },
  { id: 'pulses', name: 'Pahadi Rajma & Pulses', tag: 'RJSM' }
];

function sanitizeAlnum(str, fallback = 'SC') {
  const cleaned = String(str || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return cleaned || fallback;
}

function normalizeNicheTag(tagOrName) {
  const raw = String(tagOrName || '').trim();
  const known = DEFAULT_NICHES.find(
    n => n.id === raw.toLowerCase() || n.tag.toLowerCase() === raw.toLowerCase() || n.name.toLowerCase() === raw.toLowerCase()
  );
  if (known) return known.tag;
  const alnum = sanitizeAlnum(raw, '');
  if (!alnum) return 'SCSM';
  if (alnum.length >= 4 && alnum.endsWith('SM')) return alnum.slice(0, 6);
  const letters = alnum.slice(0, 2);
  return `${letters}SM`;
}

function normalizeSku(sku) {
  return String(sku || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function isValidSku(sku) {
  return /^[A-Z0-9][A-Z0-9-]{2,31}$/.test(String(sku || ''));
}

function extractPackCode(sizeLabel) {
  const cleaned = String(sizeLabel || '')
    .toUpperCase()
    .replace(/BOX|JAR|POUCH|BOTTLE|CRATE|PACK/gi, '')
    .replace(/[^A-Z0-9]/g, '');
  return cleaned || 'STD';
}

function extractVarietyCode(variety) {
  const raw = String(variety || '').trim().toUpperCase();
  if (!raw) return '';
  if (raw.includes('GALGAL') || raw.includes('LEMON')) return 'GAL';
  if (raw.includes('AAM') || raw.includes('MANGO')) return 'AAM';
  if (raw.includes('MIX')) return 'MIX';
  const words = raw.replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  return (words[0] || 'VAR').slice(0, 3);
}

/**
 * Generates an unambiguous, human-readable SKU code like:
 * - GHSM-500ML-01
 * - PKSM-GAL-400
 */
function buildStructuredSku({ nicheTag, size, variety, sequence = 1, existingSkus = [] }) {
  const prefix = normalizeNicheTag(nicheTag);
  const pack = extractPackCode(size);
  const varCode = extractVarietyCode(variety);
  const seqStr = String(Math.max(1, Number(sequence) || 1)).padStart(2, '0');
  const existingSet = new Set((existingSkus || []).map(s => String(s).toUpperCase()));

  const base = varCode ? `${prefix}-${varCode}-${pack}` : `${prefix}-${pack}-${seqStr}`;
  if (!existingSet.has(base)) return base;

  let counter = Number(sequence) || 1;
  while (counter < 999) {
    counter += 1;
    const alt = varCode
      ? `${prefix}-${varCode}-${pack}-${String(counter).padStart(2, '0')}`
      : `${prefix}-${pack}-${String(counter).padStart(2, '0')}`;
    if (!existingSet.has(alt)) return alt;
  }
  return `${prefix}-${pack}-${Date.now().toString().slice(-4)}`;
}

/**
 * Generates structured batch ID like GHSM-2611-B01
 */
function buildStructuredBatchId({ nicheTag, dateStr, existingBatchIds = [] }) {
  const prefix = normalizeNicheTag(nicheTag);
  const d = dateStr ? new Date(dateStr) : new Date();
  const validDate = Number.isNaN(d.getTime()) ? new Date() : d;
  const yy = String(validDate.getFullYear()).slice(-2);
  const mm = String(validDate.getMonth() + 1).padStart(2, '0');
  const stem = `${prefix}-${yy}${mm}-B`;
  const existingSet = new Set((existingBatchIds || []).map(s => String(s).toUpperCase()));

  let n = 1;
  while (n < 999) {
    const candidate = `${stem}${String(n).padStart(2, '0')}`;
    if (!existingSet.has(candidate)) return candidate;
    n += 1;
  }
  return `${stem}${Date.now().toString().slice(-3)}`;
}

function computeDiscountPercent(price, mrp) {
  const p = Number(price) || 0;
  const m = Number(mrp) || 0;
  if (m <= 0 || m <= p) return '';
  const pct = Math.round(((m - p) / m) * 100);
  return pct > 0 ? `${pct}% off` : '';
}

return {
  DEFAULT_NICHES,
  normalizeNicheTag,
  normalizeSku,
  isValidSku,
  extractPackCode,
  extractVarietyCode,
  buildStructuredSku,
  buildStructuredBatchId,
  computeDiscountPercent
};
}));
