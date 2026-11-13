/**
 * Shimla Wali — Storefront + Production Admin Backend Server
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { createStoreManager } = require('./server/db');
const { runMigrationIfNeeded } = require('./scripts/migrate-store');
const {
  ensureSessionSecret,
  getConfiguredAdminConfig,
  verifyAdminPassword,
  getClientIp,
  checkLoginRateLimit,
  recordLoginFailure,
  clearLoginFailure,
  issueSignedSession,
  authenticateRequest,
  revokeSession
} = require('./server/auth');
const { parseMultipart, saveValidatedUpload, MAX_UPLOAD_BYTES } = require('./server/upload');
const domain = require('./server/domain');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf'
};

const BLOCKED_STATIC_PREFIXES = ['/db/', '/server/', '/scripts/', '/tests/', '/.git/', '/node_modules/'];
const BLOCKED_STATIC_FILES = new Set([
  '/server.js',
  '/package.json',
  '/package-lock.json',
  '/.env',
  '/.gitignore',
  '/swarna-ghee-main.zip',
  '/cloudflared.exe'
]);

function createAppServer(options = {}) {
  const rootDir = options.rootDir || __dirname;
  const dbDir = options.dbDir || path.join(rootDir, 'db');
  const uploadsDir = options.uploadsDir || path.join(rootDir, 'uploads');
  const legacyProductsFile = options.legacyProductsFile ?? path.join(rootDir, 'products.json');
  const publicSnapshotFile = options.publicSnapshotFile ?? path.join(rootDir, 'products.json');

  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const store = createStoreManager({ dbDir, publicSnapshotFile });
  const migrationResult = runMigrationIfNeeded(store, legacyProductsFile);
  if (migrationResult.migrated) {
    console.log(
      `✅ Migrated store to db/: ${migrationResult.products} products, ${migrationResult.skus} SKUs, ${migrationResult.batches} batches`
    );
  } else {
    store.syncPublicSnapshot();
  }

  const sessionSecret = ensureSessionSecret(dbDir);
  const adminCfg = getConfiguredAdminConfig();
  if (adminCfg.usingDevFallback && !options.quiet) {
    console.warn('⚠️  ADMIN_PASSWORD env not set — using local development password. Set ADMIN_PASSWORD / ADMIN_PASSWORD_HASH before production!');
  }

  function sendJSON(res, data, status = 200, extraHeaders = {}) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders
    });
    res.end(JSON.stringify(data));
  }

  function sendCsv(res, csvText, filename) {
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(csvText);
  }

  function collectBody(req, maxBytes = 2 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let total = 0;
      let aborted = false;
      req.on('data', chunk => {
        if (aborted) return;
        total += chunk.length;
        if (total > maxBytes) {
          aborted = true;
          reject(new domain.HttpError(413, 'Request payload too large'));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => {
        if (!aborted) resolve(Buffer.concat(chunks));
      });
      req.on('error', err => reject(err));
    });
  }

  async function readJsonBody(req) {
    const raw = await collectBody(req, 2 * 1024 * 1024);
    if (!raw || raw.length === 0) return {};
    try {
      return JSON.parse(raw.toString('utf8'));
    } catch {
      throw new domain.HttpError(400, 'Invalid JSON body');
    }
  }

  function requireAdmin(req, db) {
    const sess = authenticateRequest(req, db.sessions, 'admin', sessionSecret);
    if (!sess) throw new domain.HttpError(401, 'Admin authentication required', 'UNAUTHORIZED');
    return sess;
  }

  function requireCustomer(req, db) {
    const sess = authenticateRequest(req, db.sessions, 'customer', sessionSecret);
    if (!sess) throw new domain.HttpError(401, 'Customer verification required', 'UNAUTHORIZED');
    return sess;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const method = req.method.toUpperCase();
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      let reqPath = decodeURIComponent(parsedUrl.pathname);

      if (method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Admin-Token,X-Customer-Token'
        });
        return res.end();
      }

      // ─── 1. Public Storefront & Analytics Routes ──────────────────
      if (reqPath === '/api/health' && method === 'GET') {
        return sendJSON(res, { ok: true, time: new Date().toISOString() });
      }

      if (reqPath === '/api/products' && method === 'GET') {
        return sendJSON(res, store.getPublicCatalog());
      }

      if (reqPath === '/api/discounts' && method === 'GET') {
        const db = store.loadAll();
        const activeDiscounts = ((db && db.discounts && db.discounts.discounts) || [])
          .filter(d => d.active)
          .map(d => ({
            code: d.code,
            title: d.title,
            type: d.type || 'percent',
            value: Number(d.value) || 0,
            minOrderAmount: Number(d.minOrderAmount) || 0
          }));
        return sendJSON(res, { ok: true, discounts: activeDiscounts });
      }

      if (reqPath === '/api/analytics/view' && method === 'POST') {
        const body = await readJsonBody(req);
        const page = String(body.page || 'index').slice(0, 40);
        const productId = body.productId ? String(body.productId).slice(0, 60) : '';
        await store.withTransaction((db, markDirty) => {
          const today = new Date().toISOString().slice(0, 10);
          db.analytics.totalViews = (db.analytics.totalViews || 0) + 1;
          db.analytics.viewsByDate[today] = (db.analytics.viewsByDate[today] || 0) + 1;
          if (productId) {
            db.analytics.productViews[productId] = (db.analytics.productViews[productId] || 0) + 1;
          }
          markDirty('analytics');
        });
        return sendJSON(res, { ok: true, recorded: page });
      }

      if (reqPath === '/api/checkout/quote' && method === 'POST') {
        const body = await readJsonBody(req);
        const db = store.loadAll();
        const quote = domain.calculateCheckoutQuote(db, body);
        return sendJSON(res, {
          ok: true,
          quote: {
            items: quote.itemsSnapshot,
            subtotal: quote.subtotal,
            discountCode: quote.discountCode,
            discountAmount: quote.discountAmount,
            shippingCharge: quote.shippingCharge,
            paymentMethod: quote.paymentMethod,
            grandTotal: quote.grandTotal
          }
        });
      }

      if (reqPath === '/api/orders' && method === 'POST') {
        const body = await readJsonBody(req);
        const ip = getClientIp(req);
        const result = await store.withTransaction((db, markDirty) => {
          const { order, customer } = domain.createOrderRequest(db, markDirty, body, {
            isAdminManual: false,
            actorMeta: { ip }
          });
          const custSess = issueSignedSession(
            db.sessions,
            {
              role: 'customer',
              subject: customer.phone,
              phone: customer.phone,
              customerId: customer.customerId,
              ip
            },
            sessionSecret
          );
          markDirty('sessions');
          return { order, customer, custSess };
        });

        const cookie = `swa_cust_sess=${encodeURIComponent(result.custSess.rawToken)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${result.custSess.ttlSec}`;
        return sendJSON(
          res,
          {
            ok: true,
            order: result.order,
            customerToken: result.custSess.rawToken
          },
          201,
          { 'Set-Cookie': cookie }
        );
      }

      // Customer profile & order lookup (verified strictly against phone + orderId or pincode)
      if (reqPath === '/api/customer/session' && method === 'POST') {
        const body = await readJsonBody(req);
        const ip = getClientIp(req);
        const phone = domain.normalizePhone(body.phone);
        if (!/^[6-9]\d{9}$/.test(phone)) {
          throw new domain.HttpError(400, 'Please enter a valid 10-digit Indian phone number');
        }
        const verifyOrderId = String(body.orderId || '').trim().toUpperCase();
        const verifyPincode = String(body.pincode || '').trim();

        const resData = await store.withTransaction((db, markDirty) => {
          const existingOrders = (db.orders.orders || []).filter(o => o.customerSnapshot?.phone === phone);
          const customer = (db.customers.customers || []).find(c => c.phone === phone);

          if (existingOrders.length > 0) {
            const matched =
              (verifyOrderId && existingOrders.some(o => o.orderId === verifyOrderId)) ||
              (verifyPincode && existingOrders.some(o => o.customerSnapshot?.pincode === verifyPincode));
            if (!matched) {
              throw new domain.HttpError(
                403,
                'To view existing order history for this number, enter any matching Order ID (e.g. SW-ORD-1001) or delivery PIN code.'
              );
            }
          }

          const resolvedCustomer = customer || {
            customerId: `CUST-NEW-${phone}`,
            name: String(body.name || '').trim() || 'Guest Customer',
            phone,
            defaultAddress: '',
            landmark: '',
            pincode: verifyPincode || '',
            city: ''
          };

          const sess = issueSignedSession(
            db.sessions,
            {
              role: 'customer',
              subject: phone,
              phone,
              customerId: resolvedCustomer.customerId,
              ip
            },
            sessionSecret
          );
          markDirty('sessions');
          return { sess, customer: resolvedCustomer, orders: existingOrders };
        });

        const cookie = `swa_cust_sess=${encodeURIComponent(resData.sess.rawToken)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${resData.sess.ttlSec}`;
        return sendJSON(
          res,
          {
            ok: true,
            customerToken: resData.sess.rawToken,
            customer: resData.customer,
            orders: resData.orders
          },
          200,
          { 'Set-Cookie': cookie }
        );
      }

      if (reqPath === '/api/customer/orders' && method === 'GET') {
        const db = store.loadAll();
        const custSess = requireCustomer(req, db);
        const myOrders = (db.orders.orders || []).filter(
          o => o.customerId === custSess.customerId || o.customerSnapshot?.phone === custSess.phone
        );
        const myProfile = (db.customers.customers || []).find(c => c.phone === custSess.phone) || {
          phone: custSess.phone
        };
        return sendJSON(res, { ok: true, customer: myProfile, orders: myOrders });
      }

      if (reqPath === '/api/customer/logout' && method === 'POST') {
        await store.withTransaction((db, markDirty) => {
          if (revokeSession(req, db.sessions, 'customer')) markDirty('sessions');
        });
        return sendJSON(res, { ok: true }, 200, {
          'Set-Cookie': 'swa_cust_sess=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
        });
      }

      if (reqPath.startsWith('/api/orders/') && method === 'GET') {
        const orderId = reqPath.split('/').pop();
        const db = store.loadAll();
        const adminSess = authenticateRequest(req, db.sessions, 'admin', sessionSecret);
        const custSess = adminSess ? null : authenticateRequest(req, db.sessions, 'customer', sessionSecret);
        if (!adminSess && !custSess) {
          throw new domain.HttpError(401, 'Authentication required to inspect order details');
        }
        const ord = (db.orders.orders || []).find(o => o.orderId === orderId);
        if (!ord) throw new domain.HttpError(404, 'Order not found');
        if (!adminSess && ord.customerSnapshot?.phone !== custSess.phone) {
          throw new domain.HttpError(403, 'You can only view your own orders');
        }
        return sendJSON(res, { ok: true, order: ord });
      }

      // ─── 2. Admin Auth Routes ────────────────────────────────────
      if (reqPath === '/api/admin/login' && method === 'POST') {
        const ip = getClientIp(req);
        const limit = checkLoginRateLimit(ip);
        if (!limit.allowed) {
          return sendJSON(
            res,
            { ok: false, error: `Too many login attempts. Retry in ${limit.retryAfterSec}s.` },
            429,
            { 'Retry-After': String(limit.retryAfterSec) }
          );
        }

        const body = await readJsonBody(req);
        if (!verifyAdminPassword(body.password)) {
          recordLoginFailure(ip);
          await store.withTransaction((db, markDirty) => {
            domain.appendAudit(db, markDirty, {
              actor: 'anonymous',
              role: 'unauthenticated',
              action: 'admin_login_failed',
              entityType: 'auth',
              entityId: 'admin',
              summary: 'Failed admin login attempt',
              ip
            });
          });
          return sendJSON(res, { ok: false, error: 'Incorrect admin password' }, 401);
        }

        clearLoginFailure(ip);
        const sess = await store.withTransaction((db, markDirty) => {
          const issued = issueSignedSession(
            db.sessions,
            { role: 'admin', subject: adminCfg.username, ip },
            sessionSecret
          );
          markDirty('sessions');
          domain.appendAudit(db, markDirty, {
            actor: `admin:${adminCfg.username}`,
            action: 'admin_login_success',
            entityType: 'auth',
            entityId: adminCfg.username,
            summary: 'Admin signed in to studio portal',
            ip
          });
          return issued;
        });

        const cookie = `swa_admin_sess=${encodeURIComponent(sess.rawToken)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sess.ttlSec}`;
        return sendJSON(
          res,
          { ok: true, token: sess.rawToken, admin: adminCfg.username, expiresAt: sess.expiresAt },
          200,
          { 'Set-Cookie': cookie }
        );
      }

      if (reqPath === '/api/admin/logout' && method === 'POST') {
        await store.withTransaction((db, markDirty) => {
          if (revokeSession(req, db.sessions, 'admin')) markDirty('sessions');
        });
        return sendJSON(res, { ok: true }, 200, {
          'Set-Cookie': 'swa_admin_sess=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
        });
      }

      if (reqPath === '/api/admin/session' && method === 'GET') {
        const db = store.loadAll();
        const sess = requireAdmin(req, db);
        return sendJSON(res, { ok: true, admin: sess.subject, expiresAt: sess.expiresAt });
      }

      // ─── 3. Authenticated Admin APIs ─────────────────────────────
      if (reqPath.startsWith('/api/admin/')) {
        const ip = getClientIp(req);

        // Upload endpoint handled before JSON parsing because multipart binary
        if (reqPath === '/api/admin/upload' && method === 'POST') {
          const authDb = store.loadAll();
          const sess = requireAdmin(req, authDb);
          const contentType = req.headers['content-type'] || '';
          const boundaryMatch = contentType.match(/boundary=(.+)/);
          if (!boundaryMatch) throw new domain.HttpError(400, 'Multipart boundary missing');

          const rawBody = await collectBody(req, MAX_UPLOAD_BYTES + 1024 * 1024);
          const boundaryVal = boundaryMatch[1].replace(/^"|"$/g, '').trim();
          const parts = parseMultipart(rawBody, boundaryVal);
          const savedFiles = [];

          for (const part of parts) {
            if (part.filename) {
              const info = saveValidatedUpload(part, uploadsDir);
              if (info) savedFiles.push(info);
            }
          }
          if (savedFiles.length === 0) {
            throw new domain.HttpError(400, 'No valid files found in upload request');
          }

          await store.withTransaction((db, markDirty) => {
            savedFiles.forEach(file => {
              if (['himalayan_image', 'makers_video', 'process_video'].includes(file.name)) {
                if (!db.catalog.media) db.catalog.media = {};
                db.catalog.media[file.name] = file.url;
                markDirty('catalog');
              }
            });
            domain.appendAudit(db, markDirty, {
              actor: `admin:${sess.subject}`,
              action: 'media_uploaded',
              entityType: 'media',
              entityId: savedFiles.map(f => f.filename).join(','),
              summary: `Uploaded ${savedFiles.length} media file(s): ${savedFiles.map(f => f.url).join(', ')}`,
              ip
            });
          });

          return sendJSON(res, { ok: true, files: savedFiles });
        }

        if (reqPath === '/api/admin/bootstrap' && method === 'GET') {
          const db = store.loadAll();
          const sess = requireAdmin(req, db);
          return sendJSON(res, {
            ok: true,
            admin: sess.subject,
            metrics: domain.computeDashboardMetrics(db),
            products: db.catalog.products || [],
            niches: db.catalog.niches || [],
            inventory: db.inventory.bySku || {},
            movements: (db.movements.movements || []).slice(0, 250),
            batches: db.batches.batches || [],
            orders: db.orders.orders || [],
            payments: (db.payments.payments || []).slice(0, 300),
            customers: domain.buildCustomersDirectory(db),
            discounts: db.discounts.discounts || [],
            content: db.catalog.content || {},
            settings: db.catalog.settings || {},
            media: db.catalog.media || {},
            auditLogs: (db.auditLogs.logs || []).slice(0, 200),
            backups: store.listBackups()
          });
        }

        // Niches
        if (reqPath === '/api/admin/niches' && method === 'POST') {
          const body = await readJsonBody(req);
          const created = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            return domain.addNiche(db, markDirty, body, { actor: `admin:${sess.subject}`, ip });
          });
          return sendJSON(res, { ok: true, niche: created }, 201);
        }

        // Products CRUD + Visibility
        if (reqPath === '/api/admin/products' && method === 'POST') {
          const body = await readJsonBody(req);
          // Backward compatibility: if legacy callers send { products: [...] }, update carefully; if single product object, create/upsert cleanly
          const result = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            const actorMeta = { actor: `admin:${sess.subject}`, ip };
            if (Array.isArray(body.products)) {
              const out = body.products.map(p => {
                const exists = (db.catalog.products || []).some(e => e.id === p.id);
                return domain.upsertProduct(db, markDirty, p, actorMeta, exists);
              });
              return { products: out };
            }
            const exists = Boolean(body.id && (db.catalog.products || []).some(e => e.id === body.id));
            const saved = domain.upsertProduct(db, markDirty, body, actorMeta, exists);
            return { product: saved };
          });
          return sendJSON(res, { ok: true, ...result }, 201);
        }

        if (reqPath.startsWith('/api/admin/products/') && method === 'PUT') {
          const id = reqPath.replace('/api/admin/products/', '').split('/')[0];
          const body = await readJsonBody(req);
          const saved = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            return domain.upsertProduct(db, markDirty, { ...body, id }, { actor: `admin:${sess.subject}`, ip }, true);
          });
          return sendJSON(res, { ok: true, product: saved });
        }

        if (reqPath.endsWith('/visibility') && reqPath.startsWith('/api/admin/products/') && method === 'PATCH') {
          const id = reqPath.slice('/api/admin/products/'.length, -'/visibility'.length);
          const body = await readJsonBody(req);
          const saved = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            return domain.setProductVisibility(db, markDirty, id, body.visible, { actor: `admin:${sess.subject}`, ip });
          });
          return sendJSON(res, { ok: true, product: saved });
        }

        if (reqPath.startsWith('/api/admin/products/') && method === 'DELETE') {
          const id = reqPath.replace('/api/admin/products/', '');
          const permanent = parsedUrl.searchParams.get('permanent') === '1';
          const out = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            return domain.deleteOrArchiveProduct(db, markDirty, id, permanent, { actor: `admin:${sess.subject}`, ip });
          });
          return sendJSON(res, { ok: true, ...out });
        }

        // Inventory
        if (reqPath === '/api/admin/inventory/adjust' && method === 'POST') {
          const body = await readJsonBody(req);
          const inv = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            return domain.adjustInventory(db, markDirty, body, { actor: `admin:${sess.subject}`, ip });
          });
          return sendJSON(res, { ok: true, inventory: inv });
        }

        if (reqPath === '/api/admin/inventory/bulk' && method === 'POST') {
          const body = await readJsonBody(req);
          const updated = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            return domain.bulkSetInventory(db, markDirty, body, { actor: `admin:${sess.subject}`, ip });
          });
          return sendJSON(res, { ok: true, updated });
        }

        if (reqPath === '/api/admin/inventory/hold' && method === 'POST') {
          const body = await readJsonBody(req);
          const out = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            return domain.holdInventoryReservation(db, markDirty, body, { actor: `admin:${sess.subject}`, ip });
          });
          return sendJSON(res, { ok: true, ...out });
        }

        if (reqPath === '/api/admin/inventory/release' && method === 'POST') {
          const body = await readJsonBody(req);
          const out = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            return domain.releaseInventoryReservation(db, markDirty, body, { actor: `admin:${sess.subject}`, ip });
          });
          return sendJSON(res, { ok: true, ...out });
        }

        if (reqPath === '/api/admin/inventory' && method === 'GET') {
          const db = store.loadAll();
          requireAdmin(req, db);
          return sendJSON(res, {
            ok: true,
            inventory: db.inventory.bySku || {},
            movements: db.movements.movements || []
          });
        }

        // Batches
        if (reqPath === '/api/admin/batches' && method === 'POST') {
          const body = await readJsonBody(req);
          const out = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            const actorMeta = { actor: `admin:${sess.subject}`, ip };
            if (Array.isArray(body.batches)) {
              const saved = body.batches.map(b => {
                const exists = (db.batches.batches || []).some(e => e.id === b.id);
                return domain.createOrUpdateBatch(db, markDirty, b, actorMeta, exists);
              });
              return { batches: saved };
            }
            const exists = Boolean(body.id && (db.batches.batches || []).some(e => e.id === body.id) && body.mode === 'edit');
            const batch = domain.createOrUpdateBatch(db, markDirty, body, actorMeta, exists);
            return { batch };
          });
          return sendJSON(res, { ok: true, ...out }, 201);
        }

        if (reqPath.startsWith('/api/admin/batches/') && method === 'PUT') {
          const id = reqPath.replace('/api/admin/batches/', '');
          const body = await readJsonBody(req);
          const batch = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            return domain.createOrUpdateBatch(db, markDirty, { ...body, id }, { actor: `admin:${sess.subject}`, ip }, true);
          });
          return sendJSON(res, { ok: true, batch });
        }

        if ((reqPath.startsWith('/api/admin/batches/') || reqPath.startsWith('/api/admin/batch-delete/')) && method === 'DELETE') {
          const id = reqPath.split('/').pop();
          const out = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            return domain.deleteBatchRecord(db, markDirty, id, { actor: `admin:${sess.subject}`, ip });
          });
          return sendJSON(res, { ok: true, ...out });
        }

        // Orders & Lifecycle
        if (reqPath === '/api/admin/orders/manual' && method === 'POST') {
          const body = await readJsonBody(req);
          const out = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            return domain.createOrderRequest(db, markDirty, body, {
              isAdminManual: true,
              actorMeta: { actor: `admin:${sess.subject}`, ip }
            });
          });
          return sendJSON(res, { ok: true, order: out.order }, 201);
        }

        if (reqPath === '/api/admin/orders' && method === 'GET') {
          const db = store.loadAll();
          requireAdmin(req, db);
          return sendJSON(res, { ok: true, orders: db.orders.orders || [], payments: db.payments.payments || [] });
        }

        if (reqPath.startsWith('/api/admin/orders/') && reqPath.endsWith('/whatsapp') && method === 'GET') {
          const orderId = reqPath.slice('/api/admin/orders/'.length, -'/whatsapp'.length);
          const db = store.loadAll();
          requireAdmin(req, db);
          const ord = (db.orders.orders || []).find(o => o.orderId === orderId);
          if (!ord) throw new domain.HttpError(404, `Order "${orderId}" not found`);
          const brandName = (db.catalog.settings && db.catalog.settings.brand_name) || 'Shimla Wali';
          return sendJSON(res, { ok: true, whatsapp: domain.buildWhatsAppMessagesForOrder(ord, brandName) });
        }

        if (reqPath.startsWith('/api/admin/orders/') && method === 'POST') {
          const parts = reqPath.slice('/api/admin/orders/'.length).split('/');
          const orderId = parts[0];
          const action = parts[1] || '';
          const body = await readJsonBody(req);

          const result = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            const actorMeta = { actor: `admin:${sess.subject}`, ip };
            const brandName = (db.catalog.settings && db.catalog.settings.brand_name) || 'Shimla Wali';
            if (action === 'verify-buy') {
              const order = domain.verifyWhatsAppBuy(db, markDirty, { ...body, orderId }, actorMeta);
              return { order, whatsapp: domain.buildWhatsAppMessagesForOrder(order, brandName) };
            }
            if (action === 'confirm') {
              const order = domain.confirmOrder(db, markDirty, { ...body, orderId }, actorMeta);
              return { order, whatsapp: domain.buildWhatsAppMessagesForOrder(order, brandName) };
            }
            if (action === 'status') return { order: domain.advanceOrderStatus(db, markDirty, { ...body, orderId }, actorMeta) };
            if (action === 'dispatch') {
              const dispRes = domain.dispatchOrder(db, markDirty, { ...body, orderId }, actorMeta);
              return { ...dispRes, whatsapp: domain.buildWhatsAppMessagesForOrder(dispRes.order, brandName) };
            }
            if (action === 'deliver') {
              const order = domain.deliverOrder(db, markDirty, { ...body, orderId }, actorMeta);
              return { order, whatsapp: domain.buildWhatsAppMessagesForOrder(order, brandName) };
            }
            if (action === 'cancel') return { order: domain.cancelOrder(db, markDirty, { ...body, orderId }, actorMeta) };
            if (action === 'payment') return { order: domain.recordOrderPayment(db, markDirty, { ...body, orderId }, actorMeta) };
            if (action === 'return') return { order: domain.processOrderReturn(db, markDirty, { ...body, orderId }, actorMeta) };
            if (action === 'refund') return { order: domain.processOrderRefund(db, markDirty, { ...body, orderId }, actorMeta) };
            if (action === 'whatsapp-sent') return { order: domain.markWhatsAppMessageSent(db, markDirty, { ...body, orderId }, actorMeta) };
            throw new domain.HttpError(404, `Unknown order action "${action}"`);
          });
          return sendJSON(res, { ok: true, ...result });
        }

        // Customers
        if (reqPath === '/api/admin/customers' && method === 'GET') {
          const db = store.loadAll();
          requireAdmin(req, db);
          return sendJSON(res, { ok: true, customers: domain.buildCustomersDirectory(db) });
        }

        // Discounts
        if (reqPath === '/api/admin/discounts' && method === 'POST') {
          const body = await readJsonBody(req);
          const discount = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            const exists = (db.discounts.discounts || []).some(d => d.code === String(body.code || '').toUpperCase());
            return domain.upsertDiscount(db, markDirty, body, { actor: `admin:${sess.subject}`, ip }, Boolean(body.isEdit && exists));
          });
          return sendJSON(res, { ok: true, discount }, 201);
        }

        if (reqPath.startsWith('/api/admin/discounts/') && method === 'PUT') {
          const code = reqPath.replace('/api/admin/discounts/', '');
          const body = await readJsonBody(req);
          const discount = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            return domain.upsertDiscount(db, markDirty, { ...body, code }, { actor: `admin:${sess.subject}`, ip }, true);
          });
          return sendJSON(res, { ok: true, discount });
        }

        if (reqPath.startsWith('/api/admin/discounts/') && method === 'DELETE') {
          const code = reqPath.replace('/api/admin/discounts/', '');
          const out = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            return domain.deleteDiscount(db, markDirty, code, { actor: `admin:${sess.subject}`, ip });
          });
          return sendJSON(res, { ok: true, ...out });
        }

        // Reports & CSV
        if (reqPath === '/api/admin/reports/export.csv' && method === 'GET') {
          const db = store.loadAll();
          requireAdmin(req, db);
          const type = parsedUrl.searchParams.get('type') || 'orders';
          const from = parsedUrl.searchParams.get('from') || '';
          const to = parsedUrl.searchParams.get('to') || '';
          const csv = domain.generateReportCsv(db, type, { from, to });
          return sendCsv(res, csv, `shimlawali-${type}-${new Date().toISOString().slice(0, 10)}.csv`);
        }

        if (reqPath === '/api/admin/reports' && method === 'GET') {
          const db = store.loadAll();
          requireAdmin(req, db);
          const from = parsedUrl.searchParams.get('from') || '';
          const to = parsedUrl.searchParams.get('to') || '';
          return sendJSON(res, { ok: true, ...domain.buildReportsData(db, { from, to }) });
        }

        // Website Content & Store Settings
        if (reqPath === '/api/admin/content' && method === 'POST') {
          const body = await readJsonBody(req);
          const content = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            const { media: mediaUpdates, ...contentUpdates } = body || {};
            db.catalog.content = {
              ...(db.catalog.content || {}),
              ...contentUpdates,
              sections: {
                ...((db.catalog.content && db.catalog.content.sections) || {}),
                ...(contentUpdates.sections || {})
              }
            };
            if (mediaUpdates && typeof mediaUpdates === 'object') {
              db.catalog.media = {
                ...(db.catalog.media || {}),
                ...mediaUpdates
              };
            }
            markDirty('catalog');
            domain.appendAudit(db, markDirty, {
              actor: `admin:${sess.subject}`,
              action: 'content_updated',
              entityType: 'content',
              entityId: 'storefront',
              summary: 'Updated website CMS content & section settings',
              ip
            });
            return db.catalog.content;
          });
          return sendJSON(res, { ok: true, content });
        }

        if (reqPath === '/api/admin/settings' && method === 'POST') {
          const body = await readJsonBody(req);
          const settings = await store.withTransaction((db, markDirty) => {
            const sess = requireAdmin(req, db);
            const cleanUpdates = { ...body };
            if (cleanUpdates.cod_fee !== undefined) {
              const fee = Number(cleanUpdates.cod_fee);
              if (!Number.isFinite(fee) || fee < 0) throw new domain.HttpError(400, 'COD fee must be >= 0');
              cleanUpdates.cod_fee = fee;
            }
            db.catalog.settings = { ...(db.catalog.settings || {}), ...cleanUpdates };
            markDirty('catalog');
            domain.appendAudit(db, markDirty, {
              actor: `admin:${sess.subject}`,
              action: 'settings_updated',
              entityType: 'settings',
              entityId: 'business',
              summary: 'Updated store business settings',
              ip
            });
            return db.catalog.settings;
          });
          return sendJSON(res, { ok: true, settings });
        }

        // Backups & Audit Logs
        if (reqPath === '/api/admin/backup' && method === 'POST') {
          const db = store.loadAll();
          const sess = requireAdmin(req, db);
          const info = store.createBackup('admin-manual');
          await store.withTransaction((txDb, markDirty) => {
            domain.appendAudit(txDb, markDirty, {
              actor: `admin:${sess.subject}`,
              action: 'backup_created',
              entityType: 'system',
              entityId: info.filename,
              summary: `Created database backup ${info.filename}`,
              ip
            });
          });
          return sendJSON(res, { ok: true, backup: info, backups: store.listBackups() });
        }

        if (reqPath === '/api/admin/backup/restore' && method === 'POST') {
          const body = await readJsonBody(req);
          const db = store.loadAll();
          const sess = requireAdmin(req, db);
          const preBackup = store.createBackup('pre-restore');
          const resInfo = await store.restoreBackup(body.filename);
          await store.withTransaction((txDb, markDirty) => {
            domain.appendAudit(txDb, markDirty, {
              actor: `admin:${sess.subject}`,
              action: 'backup_restored',
              entityType: 'system',
              entityId: resInfo.restoredFrom,
              summary: `Restored database snapshot from ${resInfo.restoredFrom} (safety snapshot: ${preBackup.filename})`,
              ip
            });
          });
          return sendJSON(res, { ok: true, ...resInfo, preRestoreBackup: preBackup.filename });
        }

        if (reqPath === '/api/admin/audit-logs' && method === 'GET') {
          const db = store.loadAll();
          requireAdmin(req, db);
          return sendJSON(res, { ok: true, logs: (db.auditLogs.logs || []).slice(0, 500) });
        }

        return sendJSON(res, { ok: false, error: 'Admin endpoint not found' }, 404);
      }

      // ─── 4. Hardened Static File Serving ─────────────────────────
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

      const normalizedPosix = path.posix.normalize(reqPath);
      if (
        normalizedPosix.includes('..') ||
        BLOCKED_STATIC_FILES.has(normalizedPosix) ||
        BLOCKED_STATIC_PREFIXES.some(prefix => normalizedPosix.startsWith(prefix))
      ) {
        return sendJSON(res, { ok: false, error: 'Forbidden' }, 403);
      }

      if (normalizedPosix.startsWith('/uploads/')) {
        const relUpload = normalizedPosix.slice('/uploads/'.length);
        const resolvedUpload = path.resolve(uploadsDir, relUpload);
        const uploadsRoot = path.resolve(uploadsDir);
        if (!resolvedUpload.startsWith(uploadsRoot + path.sep) && resolvedUpload !== uploadsRoot) {
          return sendJSON(res, { ok: false, error: 'Forbidden' }, 403);
        }
        if (fs.existsSync(resolvedUpload) && fs.statSync(resolvedUpload).isFile()) {
          const ext = path.extname(resolvedUpload).toLowerCase();
          res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff'
          });
          return fs.createReadStream(resolvedUpload).pipe(res);
        }
        res.writeHead(404);
        return res.end('Not found');
      }

      const resolvedPublicRoot = path.resolve(rootDir);
      const resolvedFile = path.resolve(resolvedPublicRoot, '.' + normalizedPosix);
      if (!resolvedFile.startsWith(resolvedPublicRoot + path.sep)) {
        return sendJSON(res, { ok: false, error: 'Forbidden' }, 403);
      }

      fs.stat(resolvedFile, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('404 Not Found');
        }
        const ext = path.extname(resolvedFile).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'X-Content-Type-Options': 'nosniff'
        });
        fs.createReadStream(resolvedFile).pipe(res);
      });
    } catch (err) {
      const status = err.status || 500;
      const isExpectedHttp = (err instanceof domain.HttpError) || (status > 0 && status < 500);
      const message = isExpectedHttp ? err.message : 'Internal server error';
      if (!isExpectedHttp && !options.quiet) console.error('Server error:', err);
      sendJSON(res, { ok: false, error: message, code: err.code || 'ERROR' }, status);
    }
  });

  return { server, store, adminCfg };
}

function getLocalLanIps() {
  const nets = os.networkInterfaces();
  const ips = [];
  Object.values(nets).forEach(list => {
    (list || []).forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
    });
  });
  return ips;
}

if (require.main === module) {
  const PORT = Number(process.env.PORT || 3000);
  const { server } = createAppServer();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Shimla Wali Server running at http://localhost:${PORT}/`);
    getLocalLanIps().forEach(ip => console.log(`📱 LAN access: http://${ip}:${PORT}/`));
    console.log(`🔐 Admin panel: http://localhost:${PORT}/admin.html`);
  });
}

module.exports = { createAppServer };
