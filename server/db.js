/**
 * Shimla Crunch — Transactional JSON Data Store with Mutex & Atomic Writes
 */
const fs = require('fs');
const path = require('path');
const { buildPublicProductsProjection } = require('../shared/projection');

const COLLECTIONS = {
  catalog: 'catalog.json',
  inventory: 'inventory.json',
  movements: 'inventory_movements.json',
  batches: 'batches.json',
  orders: 'orders.json',
  payments: 'payments.json',
  customers: 'customers.json',
  discounts: 'discounts.json',
  auditLogs: 'audit_logs.json',
  analytics: 'analytics_events.json',
  sessions: 'sessions.json'
};

function defaultStoreData(key) {
  switch (key) {
    case 'catalog':
      return { products: [], niches: [], settings: {}, media: {}, content: {} };
    case 'inventory':
      return { bySku: {} };
    case 'movements':
      return { movements: [] };
    case 'batches':
      return { batches: [] };
    case 'orders':
      return { orders: [] };
    case 'payments':
      return { payments: [] };
    case 'customers':
      return { customers: [] };
    case 'discounts':
      return { discounts: [] };
    case 'auditLogs':
      return { logs: [] };
    case 'analytics':
      return { totalViews: 0, viewsByDate: {}, productViews: {} };
    case 'sessions':
      return { sessions: [] };
    default:
      return {};
  }
}

function readJsonSafe(filePath, fallbackVal) {
  try {
    if (!fs.existsSync(filePath)) return fallbackVal;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return fallbackVal;
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Corrupt JSON store file ${path.basename(filePath)}: ${err.message}`);
  }
}

function writeJsonAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

function createStoreManager({ dbDir, publicSnapshotFile = null }) {
  const backupsDir = path.join(dbDir, 'backups');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

  let lockChain = Promise.resolve();

  function loadAll() {
    const out = {};
    for (const [key, filename] of Object.entries(COLLECTIONS)) {
      const fp = path.join(dbDir, filename);
      out[key] = readJsonSafe(fp, defaultStoreData(key));
    }
    return out;
  }

  function saveChanged(nextState, dirtyKeys = null) {
    const keysToSave = dirtyKeys ? Array.from(dirtyKeys) : Object.keys(COLLECTIONS);
    for (const key of keysToSave) {
      if (!COLLECTIONS[key]) continue;
      writeJsonAtomic(path.join(dbDir, COLLECTIONS[key]), nextState[key]);
    }
    if (
      publicSnapshotFile &&
      (!dirtyKeys ||
        dirtyKeys.has('catalog') ||
        dirtyKeys.has('inventory') ||
        dirtyKeys.has('batches'))
    ) {
      writeJsonAtomic(publicSnapshotFile, buildPublicProductsProjection(nextState));
    }
  }

  /**
   * Serializes read-modify-write transactions inside this Node process.
   * Usage: withTransaction(async (db, markDirty) => { ... })
   */
  function withTransaction(fn) {
    const run = async () => {
      const db = loadAll();
      const dirty = new Set();
      const markDirty = (...keys) => keys.forEach(k => dirty.add(k));
      const result = await fn(db, markDirty);
      if (dirty.size > 0) {
        saveChanged(db, dirty);
      }
      return result;
    };
    const next = lockChain.then(run, run);
    lockChain = next.catch(() => {});
    return next;
  }

  function createBackup(label = 'manual') {
    const safeLabel = String(label).replace(/[^a-z0-9_-]/gi, '-').slice(0, 32) || 'manual';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = `backup-${stamp}-${safeLabel}.json`;
    const db = loadAll();
    const payload = {
      createdAt: new Date().toISOString(),
      label: safeLabel,
      collections: db
    };
    const target = path.join(backupsDir, name);
    writeJsonAtomic(target, payload);
    return { filename: name, path: target, createdAt: payload.createdAt };
  }

  function listBackups() {
    if (!fs.existsSync(backupsDir)) return [];
    return fs
      .readdirSync(backupsDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .map(name => {
        const stats = fs.statSync(path.join(backupsDir, name));
        return { filename: name, sizeBytes: stats.size, mtime: stats.mtime.toISOString() };
      });
  }

  async function restoreBackup(filename) {
    const clean = path.basename(String(filename || ''));
    const full = path.join(backupsDir, clean);
    if (!clean.endsWith('.json') || !fs.existsSync(full)) {
      throw new Error('Backup file not found');
    }
    const parsed = JSON.parse(fs.readFileSync(full, 'utf8'));
    if (!parsed || !parsed.collections || !parsed.collections.catalog) {
      throw new Error('Invalid backup snapshot format');
    }
    return withTransaction((db, markDirty) => {
      for (const key of Object.keys(COLLECTIONS)) {
        if (parsed.collections[key]) {
          db[key] = parsed.collections[key];
          markDirty(key);
        }
      }
      return { restoredFrom: clean };
    });
  }

  return {
    dbDir,
    backupsDir,
    loadAll,
    saveChanged,
    withTransaction,
    createBackup,
    listBackups,
    restoreBackup,
    syncPublicSnapshot: () => {
      if (publicSnapshotFile) writeJsonAtomic(publicSnapshotFile, buildPublicProductsProjection(loadAll()));
    },
    getPublicCatalog: () => buildPublicProductsProjection(loadAll())
  };
}

module.exports = {
  COLLECTIONS,
  createStoreManager,
  buildPublicProductsProjection,
  writeJsonAtomic
};
