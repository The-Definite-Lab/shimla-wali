/**
 * Shimla Crunch — Security, Cryptographic Sessions, Rate Limiting & Auth Middleware
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const CUSTOMER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

const loginAttempts = new Map();

function ensureSessionSecret(dbDir) {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 24) {
    return process.env.SESSION_SECRET;
  }
  const secretPath = path.join(dbDir, '.session.secret');
  try {
    if (fs.existsSync(secretPath)) {
      const val = fs.readFileSync(secretPath, 'utf8').trim();
      if (val.length >= 24) return val;
    }
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    const generated = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(secretPath, generated, { mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

function getConfiguredAdminConfig() {
  const hash = (process.env.ADMIN_PASSWORD_HASH || '').trim();
  const plain = process.env.ADMIN_PASSWORD || '';
  const usingDevFallback = !hash && !plain;
  return {
    username: (process.env.ADMIN_USERNAME || 'Owner').trim() || 'Owner',
    passwordHash: hash,
    passwordPlain: usingDevFallback ? 'shimla@2024' : plain,
    usingDevFallback
  };
}

function hashPasswordPbkdf2(password, saltHex = crypto.randomBytes(16).toString('hex'), iterations = 120000) {
  const derived = crypto.pbkdf2Sync(String(password), saltHex, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2$${iterations}$${saltHex}$${derived}`;
}

function timingSafeStrEqual(a, b) {
  const bufA = Buffer.from(String(a || ''), 'utf8');
  const bufB = Buffer.from(String(b || ''), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyAdminPassword(candidate) {
  const cfg = getConfiguredAdminConfig();
  if (typeof candidate !== 'string' || !candidate) return false;
  const input = candidate.trim();
  if (!input) return false;

  if (cfg.passwordHash && cfg.passwordHash.startsWith('pbkdf2$')) {
    const [, iterStr, saltHex, expectedHex] = cfg.passwordHash.split('$');
    const iterations = parseInt(iterStr, 10) || 120000;
    const derived = crypto.pbkdf2Sync(input, saltHex, iterations, 64, 'sha512').toString('hex');
    return timingSafeStrEqual(derived, expectedHex);
  }

  if (cfg.usingDevFallback) {
    const devAllowed = ['shimla@2024', 'shimla-artisan-2026', 'shimlacrunch2026', 'admin'];
    return devAllowed.some(p => timingSafeStrEqual(input, p));
  }

  return timingSafeStrEqual(input, cfg.passwordPlain);
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken || '')).digest('hex');
}

function signPayload(payloadStr, secret) {
  return crypto.createHmac('sha256', secret).update(payloadStr).digest('base64url');
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      if (k) out[k] = decodeURIComponent(v);
    }
  });
  return out;
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec) return { allowed: true };
  if (now - rec.windowStart > LOGIN_WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }
  if (rec.count >= LOGIN_MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((LOGIN_WINDOW_MS - (now - rec.windowStart)) / 1000);
    return { allowed: false, retryAfterSec };
  }
  return { allowed: true };
}

function recordLoginFailure(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec || now - rec.windowStart > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
  } else {
    rec.count += 1;
  }
}

function clearLoginFailure(ip) {
  loginAttempts.delete(ip);
}

function extractToken(req, roleHint = 'admin') {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (roleHint === 'admin' && req.headers['x-admin-token']) {
    return String(req.headers['x-admin-token']).trim();
  }
  if (roleHint === 'customer' && req.headers['x-customer-token']) {
    return String(req.headers['x-customer-token']).trim();
  }
  const cookies = parseCookies(req);
  if (roleHint === 'admin' && cookies.swa_admin_sess) return cookies.swa_admin_sess;
  if (roleHint === 'customer' && cookies.swa_cust_sess) return cookies.swa_cust_sess;
  return '';
}

function issueSignedSession(sessionsStore, { role, subject, phone = '', customerId = '', ip = '' }, secret) {
  const now = Date.now();
  const ttl = role === 'admin' ? SESSION_TTL_MS : CUSTOMER_SESSION_TTL_MS;
  const sessionId = crypto.randomBytes(24).toString('base64url');
  const sig = signPayload(`${role}:${sessionId}:${subject}`, secret);
  const rawToken = `${sessionId}.${sig}`;

  // Prune expired sessions opportunistically
  const active = (sessionsStore.sessions || []).filter(s => new Date(s.expiresAt).getTime() > now);
  active.push({
    sessionId,
    tokenHash: hashToken(rawToken),
    role,
    subject,
    phone,
    customerId,
    ip,
    expiresAt: new Date(now + ttl).toISOString(),
    createdAt: new Date(now).toISOString()
  });
  sessionsStore.sessions = active.slice(-500);

  return { rawToken, expiresAt: new Date(now + ttl).toISOString(), ttlSec: Math.floor(ttl / 1000) };
}

function authenticateRequest(req, sessionsStore, requiredRole, secret) {
  const token = extractToken(req, requiredRole);
  if (!token || !token.includes('.')) return null;

  const [sessionId, sig] = token.split('.');
  if (!sessionId || !sig) return null;

  const tokenHash = hashToken(token);
  const now = Date.now();
  const sess = (sessionsStore.sessions || []).find(
    s => s.sessionId === sessionId && s.role === requiredRole && new Date(s.expiresAt).getTime() > now
  );
  if (!sess) return null;
  if (!timingSafeStrEqual(sess.tokenHash, tokenHash)) return null;

  const expectedSig = signPayload(`${sess.role}:${sess.sessionId}:${sess.subject}`, secret);
  if (!timingSafeStrEqual(sig, expectedSig)) return null;

  return sess;
}

function revokeSession(req, sessionsStore, roleHint = 'admin') {
  const token = extractToken(req, roleHint);
  if (!token) return false;
  const tokenHash = hashToken(token);
  const before = (sessionsStore.sessions || []).length;
  sessionsStore.sessions = (sessionsStore.sessions || []).filter(s => s.tokenHash !== tokenHash);
  return sessionsStore.sessions.length < before;
}

module.exports = {
  ensureSessionSecret,
  getConfiguredAdminConfig,
  hashPasswordPbkdf2,
  verifyAdminPassword,
  getClientIp,
  checkLoginRateLimit,
  recordLoginFailure,
  clearLoginFailure,
  issueSignedSession,
  authenticateRequest,
  revokeSession
};
