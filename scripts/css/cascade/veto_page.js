// Refonte de la cascade, étape 1 — veto par sur-approximation (recommandation de l'advisor, 2 nov. 2026).
// Évalué dans la page : (CANDS, STATE) => résultats. Pour chaque déclaration candidate D d'une feuille cible, et pour
// trois variantes d'affaiblissement (retrait du !important, retrait de la chaîne :not(#…), les deux), cherche un
// concurrent C (toutes feuilles et blocs de la page, valeur différente, même propriété longue, même pseudo-élément)
// qui s'applique à un même élément en IGNORANT media queries, @supports et états transitoires (survol, focus, classes
// et attributs posés par script), que D battait et qui battrait D affaibli. Un seul cas suffit à mettre D sous veto.
// Les styles en ligne (attribut style) qui battraient D affaibli mettent aussi D sous veto.
(args) => {
  const { cands, stateClasses, stateAttrs } = args;
  const STATE_PSEUDO = new Set(['hover', 'focus', 'focus-visible', 'focus-within', 'active', 'visited', 'target', 'target-within', 'checked', 'indeterminate',
    'placeholder-shown', 'open', 'closed', 'popover-open', 'modal', 'fullscreen', 'autofill', '-webkit-autofill', 'user-invalid', 'user-valid', 'invalid', 'valid',
    'playing', 'paused', 'current', 'past', 'future', 'focus-ring', '-moz-focusring', 'default', 'in-range', 'out-of-range', 'read-only', 'read-write', 'enabled', 'disabled', 'required', 'optional', 'blank']);
  const LEGACY_PE = new Set(['before', 'after', 'first-line', 'first-letter']);
  const SC = new Set(stateClasses), SA = new Set(stateAttrs);

  // ---------- découpage ----------
  function splitTop(s, sep) { // virgules de premier niveau
    const out = []; let depth = 0, br = 0, q = null, cur = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) { cur += c; if (c === '\\') { cur += s[++i] || ''; } else if (c === q) q = null; continue; }
      if (c === '"' || c === "'") { q = c; cur += c; continue; }
      if (c === '(') depth++; else if (c === ')') depth--; else if (c === '[') br++; else if (c === ']') br--;
      if (c === sep && depth === 0 && br === 0) { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur); return out.map(x => x.trim()).filter(Boolean);
  }
  function readParen(s, i) { // s[i] === '(' ; renvoie [contenu, index après ')']
    let depth = 0, q = null, j = i;
    for (; j < s.length; j++) {
      const c = s[j];
      if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
      if (c === '"' || c === "'") { q = c; continue; }
      if (c === '(') depth++; else if (c === ')') { depth--; if (depth === 0) return [s.slice(i + 1, j), j + 1]; }
    }
    return [s.slice(i + 1), s.length];
  }
  function readIdent(s, i) { let j = i; while (j < s.length && /[\w\-\\ -￿]/.test(s[j])) { if (s[j] === '\\') j++; j++; } return [s.slice(i, j), j]; }

  // ---------- spécificité et dépouillement d'un sélecteur complexe ----------
  // walk renvoie { spec:[a,b,c], stripped, pe, chain } ; chainless=true calcule la spécificité sans les :not(#id)
  function analyse(sel, chainless) {
    // sélecteur relatif (:has(> a)) : combinateur de tête conservé tel quel
    const lead = sel.match(/^\s*([>+~])\s*/);
    if (lead) { const r = analyse(sel.slice(lead[0].length), chainless); r.stripped = lead[1] + ' ' + r.stripped; return r; }
    let a = 0, b = 0, c = 0, out = '', pe = '', compoundEmpty = true, i = 0, touched = false;
    const s = sel;
    const flush = () => { if (compoundEmpty) out += '*'; compoundEmpty = true; };
    while (i < s.length) {
      const ch = s[i];
      if (/\s|>|\+|~/.test(ch)) { // combinateur
        let j = i, comb = ''; while (j < s.length && /\s|>|\+|~/.test(s[j])) { if (!/\s/.test(s[j])) comb += s[j]; j++; }
        if (j >= s.length) break;
        flush(); out += comb ? ' ' + comb + ' ' : ' '; i = j; continue;
      }
      if (ch === '#') { const [id, j] = readIdent(s, i + 1); a++; out += '#' + id; compoundEmpty = false; i = j; continue; }
      if (ch === '.') { const [cl, j] = readIdent(s, i + 1); b++; if (!SC.has(cl)) { out += '.' + cl; compoundEmpty = false; } else touched = true; i = j; continue; }
      if (ch === '[') { let j = i + 1, q = null; for (; j < s.length; j++) { const x = s[j]; if (q) { if (x === '\\') j++; else if (x === q) q = null; continue; } if (x === '"' || x === "'") q = x; else if (x === ']') break; }
        const body = s.slice(i, j + 1); const name = (body.slice(1).match(/^\s*([\w-]+)/) || [])[1] || ''; b++;
        if (!SA.has(name)) { out += body; compoundEmpty = false; } else touched = true; i = j + 1; continue; }
      if (ch === '*') { out += '*'; compoundEmpty = false; i++; continue; }
      if (ch === '&') { out += '&'; compoundEmpty = false; i++; continue; }
      if (ch === ':') {
        const isPE = s[i + 1] === ':'; const [name, j0] = readIdent(s, i + (isPE ? 2 : 1)); let j = j0, arg = null;
        if (s[j] === '(') { [arg, j] = readParen(s, j); }
        const lname = name.toLowerCase();
        if (isPE || LEGACY_PE.has(lname)) { c++; pe = '::' + lname + (arg !== null ? '(' + arg + ')' : ''); i = j; continue; }
        if (lname === 'where') { const items = splitTop(arg || '', ',').map(x => analyse(x, chainless)); if (items.some(x => x.touched)) touched = true; const keep = items.map(x => x.stripped).filter(x => x !== null); if (keep.length) { out += ':where(' + keep.join(',') + ')'; compoundEmpty = false; } i = j; continue; }
        if (lname === 'is' || lname === 'matches' || lname === '-webkit-any' || lname === 'has' || lname === 'not') {
          const items = splitTop(arg || '', ',').map(x => analyse(x, chainless));
          const best = items.reduce((m, x) => (x.spec[0] > m[0] || (x.spec[0] === m[0] && (x.spec[1] > m[1] || (x.spec[1] === m[1] && x.spec[2] > m[2])))) ? x.spec : m, [0, 0, 0]);
          const isIdChain = lname === 'not' && /^#[\w-]+$/.test((arg || '').trim());
          if (!(chainless && isIdChain)) { a += best[0]; b += best[1]; c += best[2]; }
          if (lname === 'not') {
            // un :not() qui contient un état transitoire est retiré (sur-approximation : il pourrait être vrai)
            const inner = items.some(x => x.touched);
            if (!inner) { out += ':not(' + arg + ')'; compoundEmpty = false; } else touched = true;
          } else {
            if (items.some(x => x.touched)) touched = true;
            const keep = items.map(x => x.stripped).filter(x => x !== null);
            if (keep.length) { out += ':' + name + '(' + keep.join(',') + ')'; compoundEmpty = false; }
          }
          i = j; continue;
        }
        if (/^nth-(last-)?(child|of-type)$/.test(lname)) { b++; out += ':' + name + '(' + arg + ')'; compoundEmpty = false; i = j; continue; }
        b++;
        if (STATE_PSEUDO.has(lname)) { touched = true; i = j; continue; }
        out += ':' + name + (arg !== null ? '(' + arg + ')' : ''); compoundEmpty = false; i = j; continue;
      }
      // sélecteur de type
      const [t, j] = readIdent(s, i); if (t) { c++; out += t; compoundEmpty = false; i = j; continue; }
      out += ch; i++;
    }
    flush();
    const stripped = out.trim();
    return { spec: [a, b, c], stripped, pe, touched };
  }
  // retour propre pour l'appelant : on ne garde que la marque « touched » pour :not
  const cmpSpec = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];

  // ---------- inventaire CSSOM de la page ----------
  const layerNames = [];
  const decls = []; // {ruleId, sheetKey, ordinal, items:[{spec, specChainless, stripped, pe}], layer, order, style}
  let order = 0;
  const sheetKey = s => { if (s.href) return s.href.split('?')[0].split('/').pop(); const n = s.ownerNode; return 'inline:' + ([...document.querySelectorAll('style')].indexOf(n)); };
  const ordinals = {};
  function walk(rules, sk, layer) {
    for (const r of rules) {
      if (r instanceof CSSLayerStatementRule) { for (const n of r.nameList) { const q = layer ? layer + '.' + n : n; if (!layerNames.includes(q)) layerNames.push(q); } continue; }
      if (r instanceof CSSLayerBlockRule) { const q = layer ? layer + '.' + r.name : r.name; if (!layerNames.includes(q)) layerNames.push(q); walk(r.cssRules, sk, q); continue; }
      if (r instanceof CSSKeyframesRule) continue;
      if (r instanceof CSSStyleRule) {
        ordinals[sk] = (ordinals[sk] || 0) + 1;
        const items = splitTop(r.selectorText, ',').map(x => { const an = analyse(x, false); const an2 = analyse(x, true); return { text: x, spec: an.spec, specChainless: an2.spec, stripped: an.stripped, pe: an.pe }; });
        decls.push({ id: decls.length, sk, ordinal: ordinals[sk], items, layer, order: order++, style: r.style, rule: r });
        if (r.cssRules && r.cssRules.length) walk(r.cssRules, sk, layer); // CSS imbriqué
        continue;
      }
      if (r.cssRules) walk(r.cssRules, sk, layer); // @media, @supports, @container, @scope : condition ignorée
    }
  }
  for (const s of document.styleSheets) { try { walk(s.cssRules, sheetKey(s), null); } catch (e) { /* feuille inaccessible */ } }
  const layerRank = l => l === null ? null : layerNames.indexOf(l);

  // ---------- éléments par item (dépouillé) ----------
  const ALL = [...document.querySelectorAll('*')];
  const elIndex = new Map(ALL.map((e, i) => [e, i]));
  const onEl = new Map(); // elIdx -> [ [declId, itemIdx] ]
  const itemEls = new Map(); // declId:itemIdx -> [elIdx]
  let bad = 0;
  for (const d of decls) {
    d.items.forEach((it, k) => {
      let els = [];
      try { els = [...document.querySelectorAll(it.stripped || '*')].map(e => elIndex.get(e)).filter(x => x !== undefined); } catch (e) { bad++; els = null; }
      it.invalid = els === null;
      itemEls.set(d.id + ':' + k, els || []);
      for (const x of els || []) { if (!onEl.has(x)) onEl.set(x, []); onEl.get(x).push([d.id, k]); }
    });
  }
  // ---------- cascade ----------
  function key(imp, layer, spec, ord) {
    const lr = layerRank(layer);
    const lp = imp ? (lr === null ? [1, 0] : [2, -lr]) : (lr === null ? [2, 0] : [1, lr]);
    return [imp ? 1 : 0, lp[0], lp[1], spec[0], spec[1], spec[2], ord];
  }
  const beats = (k1, k2) => { for (let i = 0; i < k1.length; i++) { if (k1[i] !== k2[i]) return k1[i] > k2[i]; } return false; };
  const probe = document.createElement('div');
  const csetCache = new Map(); const ALLSET = { has: () => true };
  const csets = C => { let v = csetCache.get(C.id); if (!v) { v = C.style.getPropertyValue('all') !== '' ? ALLSET : new Set([...C.style]); csetCache.set(C.id, v); } return v; };
  const ALL_LONGHANDS = [...getComputedStyle(document.documentElement)].filter(n => !n.startsWith('--'));
  // familles logiques/physiques et alias : deux déclarations de la même famille se départagent par l'ORDRE d'apparition
  // (groupes de propriétés logiques, CSS Cascade 5), pas par la spécificité : tout concurrent de la famille compte.
  const FAM = {};
  const group = (...members) => { for (const m of members) FAM[m] = members; };
  for (const base of ['margin', 'padding', 'scroll-margin', 'scroll-padding']) {
    group(base + '-left', base + '-right', base + '-inline-start', base + '-inline-end');
    group(base + '-top', base + '-bottom', base + '-block-start', base + '-block-end');
  }
  for (const k of ['width', 'style', 'color']) {
    group('border-left-' + k, 'border-right-' + k, 'border-inline-start-' + k, 'border-inline-end-' + k);
    group('border-top-' + k, 'border-bottom-' + k, 'border-block-start-' + k, 'border-block-end-' + k);
  }
  group('left', 'right', 'inset-inline-start', 'inset-inline-end'); group('top', 'bottom', 'inset-block-start', 'inset-block-end');
  group('width', 'height', 'inline-size', 'block-size'); group('min-width', 'min-height', 'min-inline-size', 'min-block-size'); group('max-width', 'max-height', 'max-inline-size', 'max-block-size');
  group('row-gap', 'grid-row-gap'); group('column-gap', 'grid-column-gap'); group('overflow-wrap', 'word-wrap');
  group('border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius', 'border-start-start-radius', 'border-start-end-radius', 'border-end-start-radius', 'border-end-end-radius');
  const famCache = new Map();
  const family = lh => { if (famCache.has(lh)) return famCache.get(lh); const r = FAM[lh] ? [lh].concat(FAM[lh].filter(m => m !== lh)) : [lh]; famCache.set(lh, r); return r; };
  const longhands = prop => { if (prop.toLowerCase() === 'all') return ALL_LONGHANDS; probe.removeAttribute('style'); try { probe.style.setProperty(prop, 'inherit'); } catch (e) {} const l = [...probe.style].filter(n => n !== 'all'); probe.removeAttribute('style'); return l.length ? l : [prop]; };

  // ---------- candidats : alignement des règles source (postcss) sur les règles CSSOM de la même feuille ----------
  const norm = t => t.replace(/\s+/g, '').replace(/["']/g, '').replace(/(^|[^:]):(before|after|first-line|first-letter)\b/gi, '$1::$2');
  const results = [];
  let misaligned = 0, dropped = 0;
  const work = [];
  for (const [sheet, list] of Object.entries(cands)) {
    const cssom = decls.filter(d => d.sk === sheet);
    if (!cssom.length) continue; // feuille absente de la page
    let j = 0;
    list.forEach((cand, ordinal) => {
      // la règle source peut avoir été écartée par le navigateur (sélecteur inconnu) : on cherche dans une petite fenêtre
      let k = j; while (k < cssom.length && k < j + 4 && norm(cssom[k].rule.selectorText) !== cand.selNorm) k++;
      if (k < cssom.length && norm(cssom[k].rule.selectorText) === cand.selNorm) { work.push([sheet, ordinal, cand, cssom[k]]); j = k + 1; }
      else { dropped++; results.push({ sheet, ordinal, absent: true }); }
    });
    if (j < cssom.length) misaligned += cssom.length - j;
  }
  for (const [sheet, ordinal, cand, d] of work) {
    const res = { sheet, ordinal, decls: [] };
    // variantes : 'imp' (sans !important), 'chain' (sans chaîne), 'both'
    const evalDecl = (prop, variants) => {
      const lhs = longhands(prop);
      const veto = { imp: null, chain: null, both: null };
      const shorthandVal = d.style.getPropertyValue(prop);
      const imp = d.style.getPropertyPriority(prop) === 'important';
      for (const lh of lhs) {
        let val = d.style.getPropertyValue(lh);
        // abrégée contenant var() : les longues restent vides (substitution différée) → valeur inconnue, comparaison prudente
        if (val === '') { if (shorthandVal === '') continue; val = null; }
        d.items.forEach((it, k) => {
          const els = itemEls.get(d.id + ':' + k) || [];
          const kOrig = key(imp, d.layer, it.spec, d.order);
          const kv = { imp: key(false, d.layer, it.spec, d.order), chain: key(imp, d.layer, it.specChainless, d.order), both: key(false, d.layer, it.specChainless, d.order) };
          for (const ei of els) {
            const E = ALL[ei];
            // style en ligne
            if (!it.pe && E.style && E.style.getPropertyValue(lh) !== '' && (val === null || E.style.getPropertyValue(lh) !== val)) {
              const inlImp = E.style.getPropertyPriority(lh) === 'important';
              const kIn = [inlImp ? 1 : 0, 3, 0, 9999, 0, 0, 1e9]; // en ligne : bat toute déclaration normale de feuille
              for (const v of variants) if (!veto[v] && beats(kOrig, kIn) && beats(kIn, kv[v])) veto[v] = 'style-attr ' + lh;
            }
            for (const [cid, ck] of onEl.get(ei) || []) {
              if (cid === d.id) continue;
              const C = decls[cid], cit = C.items[ck];
              if (cit.pe !== it.pe) continue;
              for (const clh of family(lh)) {
                let cval = C.style.getPropertyValue(clh);
                if (cval === '' && !csets(C).has(clh)) continue; // non posée par C
                if (cval === '' && csets(C) === ALLSET) cval = C.style.getPropertyValue('all'); // all: unset/initial… vaut pour chaque propriété
                if (clh === lh && cval !== '' && val !== null && cval === val) continue; // même valeur : pas un vrai concurrent
                const cimp = C.style.getPropertyPriority(clh) === 'important' || (csets(C) === ALLSET && C.style.getPropertyPriority('all') === 'important');
                if (clh !== lh) { // famille logique/physique ou alias : l'ordre d'apparition décide, pas la spécificité → tout concurrent fait veto
                  for (const v of variants) if (!veto[v]) veto[v] = lh + ' ~ ' + clh + ' ← ' + C.sk + ' ' + cit.text.slice(0, 80);
                  continue;
                }
                const kC = key(cimp, C.layer, cit.spec, C.order);
                if (!beats(kOrig, kC)) continue;
                for (const v of variants) if (!veto[v] && beats(kC, kv[v])) veto[v] = lh + ' ← ' + C.sk + ' ' + cit.text.slice(0, 80);
              }
            }
            if (variants.every(v => veto[v])) break;
          }
        });
      }
      return veto;
    };
    for (const dc of cand.decls) {
      const variants = [];
      if (dc.important) variants.push('imp');
      if (cand.hasChain) variants.push('chain');
      if (dc.important && cand.hasChain) variants.push('both');
      if (!variants.length) continue;
      res.decls.push({ prop: dc.prop, important: dc.important, veto: evalDecl(dc.prop, variants) });
    }
    results.push(res);
  }
  return { results, misaligned, dropped, badSelectors: bad, rules: decls.length, elements: ALL.length, layers: layerNames };
}
