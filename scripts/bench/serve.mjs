#!/usr/bin/env node
// Serveur statique local qui reproduit le comportement de Netlify pour les mesures
// de laboratoire : URL sans extension, dossiers avec barre finale, _redirects
// (redirections et reecritures 200), _headers, compression brotli/gzip.
// Aucune requete ne part vers la production.
//
// Usage : node scripts/bench/serve.mjs <racine> <port>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = path.resolve(process.argv[2] || '.');
const PORT = +(process.argv[3] || 8700);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.pdf': 'application/pdf',
  '.ics': 'text/calendar; charset=utf-8', '.mp4': 'video/mp4', '.webm': 'video/webm',
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml|manifest\+json)|image\/svg)/;

function globRx(p) {
  return new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
}

// _headers : bloc « chemin » puis lignes indentees « Nom: valeur »
const headerRules = [];
try {
  let cur = null;
  for (const line of fs.readFileSync(path.join(ROOT, '_headers'), 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { cur = { rx: globRx(line.trim()), h: [] }; headerRules.push(cur); continue; }
    const i = line.indexOf(':');
    if (cur && i > 0) cur.h.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
  }
} catch { /* pas de _headers */ }

// _redirects : « source destination statut[!] », :splat et :param
const redirectRules = [];
try {
  for (const line of fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [from, to, st = '301'] = t.split(/\s+/);
    const names = [];
    const rx = new RegExp('^' + from.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/:(\w+)/g, (_, n) => { names.push(n); return '([^/]+)'; })
      .replace(/\*/g, () => { names.push('splat'); return '(.*)'; }) + '$');
    redirectRules.push({ rx, names, to, status: parseInt(st, 10), force: st.endsWith('!') });
  }
} catch { /* pas de _redirects */ }

function fileFor(p) {
  const abs = path.join(ROOT, decodeURIComponent(p));
  if (!abs.startsWith(ROOT)) return null;
  try {
    const st = fs.statSync(abs);
    if (st.isFile()) return { abs };
    if (st.isDirectory()) {
      if (!p.endsWith('/')) return { redirect: p + '/' };
      const idx = path.join(abs, 'index.html');
      if (fs.existsSync(idx)) return { abs: idx };
    }
  } catch { /* absent */ }
  if (!p.endsWith('/') && fs.existsSync(abs + '.html')) return { abs: abs + '.html' };
  return null;
}

function matchRedirect(p) {
  for (const r of redirectRules) {
    const m = p.match(r.rx);
    if (!m) continue;
    let to = r.to;
    r.names.forEach((n, i) => { to = to.split(':' + n).join(m[i + 1]); });
    return { ...r, to };
  }
  return null;
}

const zcache = new Map();
function body(abs, enc) {
  const key = abs + '|' + enc;
  if (!zcache.has(key)) {
    const raw = fs.readFileSync(abs);
    zcache.set(key, enc === 'br'
      ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } })
      : enc === 'gzip' ? zlib.gzipSync(raw, { level: 9 }) : raw);
  }
  return zcache.get(key);
}

function send(req, res, abs, status = 200) {
  const type = TYPES[path.extname(abs).toLowerCase()] || 'application/octet-stream';
  const ae = req.headers['accept-encoding'] || '';
  const enc = COMPRESSIBLE.test(type) ? (/\bbr\b/.test(ae) ? 'br' : /\bgzip\b/.test(ae) ? 'gzip' : '') : '';
  const urlPath = req.url.split('?')[0];
  const h = { 'Content-Type': type, 'Cache-Control': 'public, max-age=0, must-revalidate' };
  for (const r of headerRules) if (r.rx.test(urlPath)) for (const [k, v] of r.h) h[k] = v;
  if (enc) { h['Content-Encoding'] = enc; h['Vary'] = 'Accept-Encoding'; }
  const b = body(abs, enc);
  h['Content-Length'] = b.length;
  res.writeHead(status, h);
  res.end(req.method === 'HEAD' ? undefined : b);
}

http.createServer((req, res) => {
  const [p, q] = req.url.split('?');
  const r = matchRedirect(p);
  if (r && (r.force || !fileFor(p)) && r.status >= 300 && r.status < 400) {
    res.writeHead(r.status, { Location: r.to + (q ? '?' + q : '') });
    return res.end();
  }
  let f = fileFor(p);
  if (!f && r && r.status === 200) f = fileFor(r.to);
  if (f && f.redirect) { res.writeHead(301, { Location: f.redirect + (q ? '?' + q : '') }); return res.end(); }
  if (f) return send(req, res, f.abs);
  const nf = path.join(ROOT, '404.html');
  if (fs.existsSync(nf)) return send(req, res, nf, 404);
  res.writeHead(404); res.end();
}).listen(PORT, '127.0.0.1', () => console.log(`serve ${ROOT} -> http://127.0.0.1:${PORT}`));
