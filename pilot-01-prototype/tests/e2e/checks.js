// In-page audit evaluated by run.py via page.evaluate(). Pure DOM, no dependencies.
// Returns one object with type / overflow / tap / collisions / css / cta / sections.
(opts) => {
  const W = innerWidth;
  // type scale: desktop steps; at <= mobileMax px the clamp tokens step down (20>18, 28>24, 44>32, 72>44), see docs/design/v6-brief.md
  const SIZES = new Set(W <= (opts.mobileMax || 0) && opts.mobileSizes ? opts.mobileSizes : opts.sizes);
  const LHS = opts.lineHeights || [];
  const WEIGHTS = new Set(opts.weights.map(String));
  const famOk = new RegExp(opts.family, 'i');
  const sel = (e) => {
    if (!e || !e.tagName) return '?';
    let s = e.tagName.toLowerCase();
    if (e.id) return s + '#' + e.id;
    const c = [...e.classList].filter((x) => !/^(is-|js-)/.test(x)).slice(0, 2);
    if (c.length) s += '.' + c.join('.');
    const p = e.parentElement;
    if (p && p !== document.body) {
      const ps = p.id ? '#' + p.id : (p.classList[0] ? '.' + p.classList[0] : p.tagName.toLowerCase());
      s = ps + ' > ' + s;
    }
    return s;
  };
  const csCache = new Map();
  const cs = (e) => { let v = csCache.get(e); if (!v) { v = getComputedStyle(e); csCache.set(e, v); } return v; };
  const isSr = (e) => {
    const r = e.getBoundingClientRect();
    return r.width <= 2 || r.height <= 2;
  };
  const hidden = (e) => {
    // checkVisibility covers closed <details> (content-visibility:hidden slot), display:none and visibility
    if (e.checkVisibility && !e.checkVisibility({ visibilityProperty: true, opacityProperty: true })) return true;
    for (let p = e; p && p !== document.documentElement; p = p.parentElement) {
      const s = cs(p);
      if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return true;
    }
    return false;
  };
  const fixedAnc = (e) => {
    for (let p = e; p && p !== document.body; p = p.parentElement) {
      const s = cs(p).position;
      if (s === 'fixed' || s === 'sticky') return true;
    }
    return false;
  };
  const clippedAway = (e, r) => {
    // text rect fully outside an overflow-clipping ancestor (tickers, carousels, sr-only clip)
    for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = cs(p);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible' || s.clipPath !== 'none' || s.clip !== 'auto') {
        const q = p.getBoundingClientRect();
        if (r.right <= q.left + 1 || r.left >= q.right - 1 || r.bottom <= q.top + 1 || r.top >= q.bottom - 1) return true;
        if (q.width <= 2 || q.height <= 2) return true;
      }
    }
    return false;
  };

  // ---------- text nodes ----------
  const texts = [];
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = tw.nextNode())) {
    if (!n.textContent.trim()) continue;
    const e = n.parentElement;
    if (!e || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'OPTION'].includes(e.tagName)) continue;
    if (e.closest('[data-qa-ignore]')) continue;
    if (hidden(e) || isSr(e)) continue;
    texts.push([n, e]);
  }

  // ---------- type scale ----------
  const type = { sizes: {}, weights: {}, families: {}, bad: { size: {}, weight: {}, family: {}, lh: {} }, nodes: texts.length };
  const bump = (m, k, e) => { (m[k] = m[k] || { c: 0, ex: sel(e) }).c++; };
  for (const [, e] of texts) {
    const s = cs(e);
    const fs = Math.round(parseFloat(s.fontSize) * 2) / 2;
    const fw = String(Math.round(parseFloat(s.fontWeight)));
    const ff = s.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    bump(type.sizes, fs, e); bump(type.weights, fw, e); bump(type.families, ff, e);
    if (!SIZES.has(fs)) bump(type.bad.size, fs + 'px', e);
    if (!WEIGHTS.has(fw)) bump(type.bad.weight, fw, e);
    if (!famOk.test(ff)) bump(type.bad.family, ff, e);
    if (LHS.length) {
      const lh = s.lineHeight === 'normal' ? NaN : parseFloat(s.lineHeight) / parseFloat(s.fontSize);
      if (!LHS.some((x) => Math.abs(x - lh) < 0.011)) bump(type.bad.lh, Number.isNaN(lh) ? 'normal' : lh.toFixed(2), e);
    }
  }

  // ---------- horizontal overflow ----------
  const de = document.documentElement;
  const overflow = { sw: de.scrollWidth, cw: de.clientWidth, offenders: [] };
  if (de.scrollWidth > de.clientWidth + 1) {
    for (const e of document.body.querySelectorAll('*')) {
      const r = e.getBoundingClientRect();
      if (r.right > de.clientWidth + 1 && r.width > 0 && !hidden(e)) {
        let inScroller = false;
        for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
          const o = cs(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') { inScroller = true; break; }
        }
        if (!inScroller) overflow.offenders.push({ s: sel(e), right: Math.round(r.right) });
      }
      if (overflow.offenders.length > 40) break;
    }
    // keep outermost offenders only
    overflow.offenders = overflow.offenders.slice(0, 12);
  }

  // ---------- tap targets ----------
  const tap = [];
  if (opts.tap) {
    const q = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=checkbox],[role=radio],[role=switch],label[for]';
    for (const e of document.querySelectorAll(q)) {
      if (hidden(e) || e.closest('[data-qa-ignore]')) continue;
      const r = e.getBoundingClientRect();
      if (r.width <= 2 || r.height <= 2) continue; // sr-only / skip links
      if (e.tagName === 'INPUT' && ['checkbox', 'radio'].includes(e.type) && e.closest('label')) continue;
      // inline links inside running text are exempt (WCAG 2.5.8 inline exception)
      if (e.tagName === 'A' && cs(e).display === 'inline') {
        const p = e.parentElement;
        const own = [...p.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 2);
        if (own) continue;
      }
      if (r.width < opts.tapMin || r.height < opts.tapMin) {
        tap.push({ s: sel(e), w: Math.round(r.width), h: Math.round(r.height), t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30), y: Math.round(r.top + scrollY) });
      }
    }
  }

  // ---------- text/text and rail/text collisions ----------
  const boxes = [];
  for (const [t, e] of texts) {
    if (fixedAnc(e)) continue;
    const rg = document.createRange(); rg.selectNodeContents(t);
    for (const r of rg.getClientRects()) {
      if (r.width < 2 || r.height < 2) continue;
      if (clippedAway(e, r)) continue;
      boxes.push({ e, l: r.left, r: r.right, t: r.top + scrollY, b: r.bottom + scrollY });
    }
    if (boxes.length > 6000) break;
  }
  boxes.sort((a, b) => a.t - b.t);
  const collisions = [];
  const seen = new Set();
  for (let i = 0; i < boxes.length && collisions.length < 40; i++) {
    const a = boxes[i];
    for (let j = i + 1; j < boxes.length && boxes[j].t < a.b; j++) {
      const b = boxes[j];
      if (a.e === b.e || a.e.contains(b.e) || b.e.contains(a.e)) continue;
      const iw = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      const ih = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (iw <= 2 || ih <= 2) continue;
      // adjacent lines of tight-leading display type overlap a little by design
      if (ih < 0.35 * Math.min(a.b - a.t, b.b - b.t)) continue;
      const small = Math.min((a.r - a.l) * (a.b - a.t), (b.r - b.l) * (b.b - b.t));
      if (iw * ih < Math.max(24, small * 0.15)) continue;
      const key = sel(a.e) + '|' + sel(b.e);
      if (seen.has(key)) continue; seen.add(key);
      const rail = !!(a.e.closest(opts.railSel) || b.e.closest(opts.railSel));
      collisions.push({ a: sel(a.e), b: sel(b.e), at: Math.round(Math.max(a.t, b.t)), x: Math.round(Math.max(a.l, b.l)), area: Math.round(iw * ih), rail,
        ta: a.e.textContent.trim().slice(0, 24), tb: b.e.textContent.trim().slice(0, 24) });
    }
  }

  // ---------- required-CSS sanity ----------
  const h1 = document.querySelector('h1');
  const h1s = h1 ? cs(h1) : null;
  const hdr = document.querySelector('header');
  const ftr = document.querySelector('footer');
  const srLeaks = [];
  for (const e of document.querySelectorAll('[class]')) {
    const cl = [...e.classList];
    if (!cl.some((c) => /(^|[-_])sr(-only)?$|^visually-hidden$/.test(c))) continue;
    if (e.matches(':focus-within')) continue;
    if (hidden(e)) continue;
    const r = e.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) {
      const s = cs(e);
      const clipped = s.clip !== 'auto' && s.clip !== '' || (s.clipPath && s.clipPath !== 'none');
      if (!clipped) srLeaks.push({ s: sel(e), w: Math.round(r.width), h: Math.round(r.height), t: e.textContent.trim().slice(0, 40) });
    }
  }
  const styled = new Set();
  const walkRules = (rules) => {
    for (const r of rules) {
      if (r.selectorText) for (const m of r.selectorText.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) styled.add(m[1]);
      if (r.cssRules) walkRules(r.cssRules);
    }
  };
  let sheetErr = 0;
  for (const s of document.styleSheets) { try { walkRules(s.cssRules); } catch (_) { sheetErr++; } }
  const domClasses = new Map();
  for (const e of document.querySelectorAll('body [class]')) for (const c of e.classList) if (!domClasses.has(c)) domClasses.set(c, e);
  const uncovered = [...domClasses.keys()].filter((c) => !styled.has(c) && !/^(js-|is-|has-|qa-|lang-|astro-)/.test(c)).sort();
  const css = {
    h1: h1 ? { size: parseFloat(h1s.fontSize), family: h1s.fontFamily.split(',')[0].replace(/["']/g, '').trim(), weight: h1s.fontWeight, text: h1.textContent.trim().slice(0, 60), visible: !hidden(h1) && h1.getBoundingClientRect().height > 0 } : null,
    bodyFont: cs(document.body).fontFamily.split(',')[0].replace(/["']/g, '').trim(),
    bodyBg: cs(document.body).backgroundColor,
    rootBg: cs(document.documentElement).backgroundColor,
    headerH: hdr ? Math.round(hdr.getBoundingClientRect().height) : 0,
    footer: !!ftr && ftr.getBoundingClientRect().height > 40,
    sheets: document.styleSheets.length, sheetErr, styledClasses: styled.size,
    srLeaks: srLeaks.slice(0, 20), uncovered,
  };

  // ---------- sponsored links + invite codes ----------
  const cta = [];
  for (const a of document.querySelectorAll('a[data-cta-kind="registration"], a[rel~="sponsored"], a[data-cta-code]')) {
    const href = (a.getAttribute('href') || '').replace(/([?&])tg_expires=\d+/, '$1tg_expires=N');
    cta.push(href + ' | ' + (a.getAttribute('data-cta-code') || ''));
  }
  const codes = [...new Set([...document.querySelectorAll('[data-cta-code]')].map((e) => e.getAttribute('data-cta-code')).filter(Boolean))].sort();

  // ---------- section map (for void attribution) ----------
  const sections = [];
  for (const e of document.querySelectorAll('header,footer,main,section,article,aside,nav,form,table,[id],main>div,main>*>div,[class*="section"],[class*="grid"],[class*="rail"]')) {
    const r = e.getBoundingClientRect(); if (r.width < 40 || r.height < 8) continue;
    let d = 0, p = e; while ((p = p.parentElement)) d++;
    const c = [...e.classList].slice(0, 2);
    sections.push({ s: e.tagName.toLowerCase() + (e.id ? '#' + e.id : (c.length ? '.' + c.join('.') : '')), t: Math.round(r.top + scrollY), b: Math.round(r.bottom + scrollY), l: Math.round(r.left), r: Math.round(r.right), d });
  }

  // ---------- JS-off visibility probe (meaningful only with JS disabled) ----------
  let invisible = 0; const invisibleEx = [];
  const main = document.querySelector('main') || document.body;
  for (const e of main.querySelectorAll('h1,h2,h3,p,li,a,button')) {
    const s = cs(e);
    if (s.display === 'none') continue;
    const r = e.getBoundingClientRect(); if (r.width < 3 || r.height < 3) continue;
    let op = 1; for (let p = e; p && p !== document.body; p = p.parentElement) op *= parseFloat(cs(p).opacity);
    if (fixedAnc(e) || (e.checkVisibility && !e.checkVisibility({ visibilityProperty: false, opacityProperty: false }))) continue;
    if (op < 0.05 || s.visibility === 'hidden') { invisible++; if (invisibleEx.length < 5) invisibleEx.push(sel(e)); }
  }

  const stuck = [];
  for (const e of main.querySelectorAll('section,article,div,ul,ol,figure,table,p,h2,h3')) {
    const s = cs(e);
    if (parseFloat(s.opacity) > 0.05 && s.visibility !== 'hidden') continue;
    if (s.display === 'none' || fixedAnc(e)) continue;
    if (e.checkVisibility && !e.checkVisibility({ visibilityProperty: false, opacityProperty: false })) continue;
    if (e.parentElement && e.parentElement.closest('main') && (() => { for (let p = e.parentElement; p && p !== main; p = p.parentElement) { const q = cs(p); if (parseFloat(q.opacity) <= 0.05 || q.visibility === 'hidden') return true; } return false; })()) continue;
    const r = e.getBoundingClientRect();
    if (r.width * r.height < 20000 || !(e.innerText || '').trim()) continue;
    stuck.push({ s: sel(e), y: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width) });
    if (stuck.length > 10) break;
  }

  return {
    stuck,
    W, H: de.scrollHeight, title: document.title, type, overflow, tap, collisions, css, cta: [...new Set(cta)].sort(), codes, sections,
    mainText: (main.innerText || '').length, invisible, invisibleEx,
  };
}
