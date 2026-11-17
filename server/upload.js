/**
 * Shimla Crunch — Hardened Multipart Parser & Upload Validation (Magic Bytes + Ext + Size)
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB hard cap (supports MP4/WebM demo clips, images capped below)
const IMAGE_PDF_MAX_BYTES = 12 * 1024 * 1024; // 12 MB cap for images & PDFs

const ALLOWED_EXTS = new Set(['.webp', '.jpg', '.jpeg', '.png', '.pdf', '.mp4', '.webm']);

function matchesMagic(ext, buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return false;
  if (ext === '.webp') {
    return buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP';
  }
  if (ext === '.png') {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (ext === '.pdf') {
    return buf.slice(0, 5).toString('ascii') === '%PDF-';
  }
  if (ext === '.mp4') {
    return buf.slice(4, 8).toString('ascii') === 'ftyp';
  }
  if (ext === '.webm') {
    return buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
  }
  return false;
}

function indexOfBuf(buf, search, start = 0) {
  return buf.indexOf(search, start);
}

function parseMultipart(body, boundary) {
  const parts = [];
  const boundaryBuf = Buffer.from('--' + boundary);
  let start = 0;

  while (start < body.length) {
    const boundaryStart = indexOfBuf(body, boundaryBuf, start);
    if (boundaryStart === -1) break;
    const afterBoundary = boundaryStart + boundaryBuf.length;
    if (body.slice(afterBoundary, afterBoundary + 2).toString() === '--') break;

    const headerStart = afterBoundary + 2; // skip \r\n
    const headerEnd = indexOfBuf(body, Buffer.from('\r\n\r\n'), headerStart);
    if (headerEnd === -1) break;

    const headerStr = body.slice(headerStart, headerEnd).toString('utf8');
    const nextBoundary = indexOfBuf(body, boundaryBuf, headerEnd + 4);
    const dataEnd = nextBoundary === -1 ? body.length : nextBoundary - 2; // trim \r\n
    const data = body.slice(headerEnd + 4, Math.max(headerEnd + 4, dataEnd));

    const headers = {};
    headerStr.split('\r\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
    });

    const disposition = headers['content-disposition'] || '';
    const nameMatch = disposition.match(/name="([^"]+)"/);
    const filenameMatch = disposition.match(/filename="([^"]+)"/);
    parts.push({
      name: nameMatch ? nameMatch[1] : null,
      filename: filenameMatch ? path.basename(filenameMatch[1]) : null,
      contentType: headers['content-type'] || 'application/octet-stream',
      data
    });

    start = nextBoundary === -1 ? body.length : nextBoundary;
  }
  return parts;
}

function saveValidatedUpload(part, uploadsDir) {
  if (!part || !part.filename) return null;
  const ext = path.extname(part.filename).toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) {
    throw Object.assign(new Error(`File type "${ext || 'unknown'}" is not allowed. Accepted: WebP, JPG, PNG, PDF, MP4, WebM`), { status: 400 });
  }

  const isVideo = ext === '.mp4' || ext === '.webm';
  const maxAllowed = isVideo ? MAX_UPLOAD_BYTES : IMAGE_PDF_MAX_BYTES;
  if (!part.data || part.data.length === 0) {
    throw Object.assign(new Error('Uploaded file is empty'), { status: 400 });
  }
  if (part.data.length > maxAllowed) {
    throw Object.assign(new Error(`File exceeds maximum size (${isVideo ? '50MB' : '12MB'})`), { status: 413 });
  }

  if (!matchesMagic(ext, part.data)) {
    throw Object.assign(new Error(`File signature does not match "${ext}" format`), { status: 400 });
  }

  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const baseStem = path.basename(part.filename, ext).replace(/[^a-z0-9_-]/gi, '_').slice(0, 40) || 'asset';
  const rand = crypto.randomBytes(4).toString('hex');
  const safeName = `${Date.now()}_${rand}_${baseStem}${ext}`;
  const fullPath = path.join(uploadsDir, safeName);
  fs.writeFileSync(fullPath, part.data);

  return {
    name: part.name,
    filename: safeName,
    url: `/uploads/${safeName}`,
    sizeBytes: part.data.length
  };
}

module.exports = {
  MAX_UPLOAD_BYTES,
  parseMultipart,
  saveValidatedUpload
};
