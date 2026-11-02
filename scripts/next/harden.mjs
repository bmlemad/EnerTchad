// Lot 20 : traitements de l'export statique (out/) apres la normalisation Next.js.
//  1. minifyCss : retire commentaires et blancs superflus des feuilles servies et
//     des blocs <style> en ligne, sans reordonner ni fusionner de regles (cascade
//     inchangee). Les sources du depot restent commentees.
//  2. hardenHtml : pose, en fin de <head>, une politique CSP par page
//     (<meta http-equiv>) qui n'autorise que les scripts en ligne et attributs
//     on*= presents dans CETTE page, par empreinte SHA-256. L'en-tete HTTP (_headers,
//     redirects.json, .htaccess OVH) reste generique : hotes autorises et 'unsafe-inline'
//     que la politique de la page neutralise (une ressource doit satisfaire les deux).
//     Les pages qui fabriquent des attributs on*= en JavaScript (boutique : produits
//     generes a l'execution) ne recoivent pas de politique de page : leurs empreintes
//     ne sont pas connues au build.
// verify.mjs applique les memes fonctions pour comparer source et export.
import { Parser } from 'htmlparser2';
import { createHash } from 'node:crypto';

export const SCRIPT_HOSTS = ['https://*.googletagmanager.com'];
export const CSP_MARK = 'data-et-csp';

const TOKEN = /("(?:\\[\s\S]|[^"\\\n])*"|'(?:\\[\s\S]|[^'\\\n])*'|url\(\s*[^)"'\s][^)]*\)|\/\*[\s\S]*?\*\/|\s+|[^"'\/\su]+|[\s\S])/gi;
const TIGHT = new Set(['{', '}', ';', ',']);
const MARKER = /^\/\* et-[\w-]+:(?:start|end) \*\/$/;

export function minifyCss(css) {
  const tokens = [];
  for (const [token] of css.matchAll(TOKEN)) {
    // Les reperes de blocs (/* et-xxx:start */ ... :end */) restent : des audits les lisent.
    const blank = (token.startsWith('/*') && !MARKER.test(token)) || /^\s+$/.test(token);
    if (blank) { if (tokens.length && tokens[tokens.length - 1] !== ' ') tokens.push(' '); }
    else tokens.push(token);
  }
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === ' ') {
      const prev = out[out.length - 1] ?? '';
      const next = tokens[i + 1] ?? '';
      // « --x: ; » : une propriete personnalisee vide garde son blanc.
      if (prev.endsWith(':')) { out.push(token); continue; }
      if (!prev || !next || TIGHT.has(prev.slice(-1)) || TIGHT.has(next[0])) continue;
      out.push(token);
      continue;
    }
    if (token === '}' && out[out.length - 1] === ';' && !(out[out.length - 2] ?? '').endsWith(':')) out.pop();
    out.push(token);
  }
  return out.join('').trim();
}

const DATA_TYPES = /^(?:application\/(?:ld\+)?json|text\/(?:template|plain|x-template)|importmap)$/i;
const DYNAMIC_HANDLER = /\bon[a-z]+=\\?["']/i;

// Inventaire des blocs <script> et <style> reels (pas les chaines dans le JS).
export function inventory(html) {
  const scripts = [], styles = [], handlers = new Set();
  let open = null;
  const parser = new Parser({
    onopentag(name, attribs) {
      for (const [key, value] of Object.entries(attribs)) if (/^on[a-z]+$/i.test(key)) handlers.add(value);
      if (name === 'script' || name === 'style') open = { name, attribs, start: parser.endIndex + 1 };
    },
    onclosetag(name) {
      if (open && name === open.name) {
        const item = { ...open, end: parser.startIndex, text: html.slice(open.start, parser.startIndex) };
        (name === 'script' ? scripts : styles).push(item);
        open = null;
      }
    },
  }, { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true });
  parser.end(html);
  return { scripts, styles, handlers: [...handlers] };
}

const sha = text => "'sha256-" + createHash('sha256').update(text, 'utf8').digest('base64') + "'";

export function pagePolicy(html) {
  const { scripts, handlers } = inventory(html);
  const inline = scripts.filter(s => !('src' in s.attribs) && !DATA_TYPES.test((s.attribs.type || '').trim()));
  if (inline.some(s => DYNAMIC_HANDLER.test(s.text))) return null;
  const hashes = [...new Set([...inline.map(s => s.text), ...handlers].map(sha))];
  const sources = ["'self'", ...(handlers.length ? ["'unsafe-hashes'"] : []), ...hashes, ...SCRIPT_HOSTS];
  return `script-src ${sources.join(' ')}; object-src 'none'; base-uri 'self'`;
}

export function hardenHtml(html) {
  if (html.includes(CSP_MARK)) return html;
  // 1. <style> en ligne minifies (positions reelles, de la fin vers le debut).
  const { styles } = inventory(html);
  for (const style of styles.slice().reverse()) {
    html = html.slice(0, style.start) + minifyCss(style.text) + html.slice(style.end);
  }
  // 2. Politique de page, calculee sur le HTML final.
  const policy = pagePolicy(html);
  if (!policy) return html;
  const meta = `<meta http-equiv="Content-Security-Policy" ${CSP_MARK} content="${policy}">`;
  // En fin de <head> : place juste apres <meta charset>, la balise faisait suspendre au
  // scanner de prechargement de Chromium les feuilles et images qui la suivent (FCP de
  // l'accueil +0,5 s mesure, CPU x4). Les scripts du <head> sont ceux du gabarit ; tout
  // le <body> et tout script ajoute a l'execution restent soumis a la politique.
  // Sans </head> explicite (gabarit du configurateur), avant <body>.
  let at = html.indexOf('</head>');
  if (at < 0) at = html.search(/<body[\s>]/i);
  if (at < 0) return html;
  return html.slice(0, at) + meta + html.slice(at);
}
