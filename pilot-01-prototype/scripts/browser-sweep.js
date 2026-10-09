// In-browser layout + disclosure sweep (paste into the page console or a browser tool on the dev server origin).
// window.__sweep(routes)  -> per route: horizontal overflow, off-scale font sizes, small touch targets, light surfaces.
// window.__rule8(routes)  -> per route: scrolls every 150px; at each stop every visible sponsored link must share the
//                            viewport with a visible commission disclosure (design rule 8).
// Routes load in a same-size hidden iframe, so run it at the width under test (390 / 768 / 1440).
(() => {
  const SCALE = new Set([12, 14, 16, 18, 20, 24, 28, 32, 44, 72]);
  const DISPLAY = '.h7-num, .h7-vin, .h7-vin *, .h7-am, .h7-am *, .v6-close__title, .v6-close__title *';
  const DISC = '[data-disclosure-placement], [class*="disclos"], [class*="disclaim"], .h7-cta-disc, .h7-disc, [class*="inline-disclosure"]';
  const load = async (path, wait = 2500) => {
    const f = document.createElement('iframe');
    f.style.cssText = `position:fixed;left:0;top:0;width:${innerWidth}px;height:${innerHeight}px;opacity:0;pointer-events:none;border:0`;
    f.src = path; document.body.appendChild(f);
    await new Promise((r) => { f.onload = r; });
    await new Promise((r) => setTimeout(r, wait));
    return f;
  };
  const visible = (w, e) => { const r = e.getBoundingClientRect(); const cs = w.getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
  window.__sweep = async (routes) => {
    const out = {};
    for (const p of routes) {
      const f = await load(p); const d = f.contentDocument, w = f.contentWindow;
      const over = d.documentElement.scrollWidth - w.innerWidth;
      const fonts = new Set();
      for (const e of d.querySelectorAll('body *')) {
        if (!e.childNodes.length || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        if (e.closest(DISPLAY) || e.closest('svg') || !visible(w, e)) continue;
        const fs = Math.round(parseFloat(w.getComputedStyle(e).fontSize));
        if (!SCALE.has(fs) && fs < 72) fonts.add(`${fs}px ${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`);
      }
      const small = [];
      for (const e of d.querySelectorAll('a, button, summary, input, select')) {
        if (!visible(w, e) || w.getComputedStyle(e).display === 'inline') continue;
        const r = e.getBoundingClientRect();
        if (r.height < 43.5 || r.width < 43.5) small.push(`${Math.round(r.width)}x${Math.round(r.height)} ${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)}`);
      }
      const sponsored = [...d.querySelectorAll('a[rel~="sponsored"]')].filter((e) => visible(w, e)).length;
      out[p] = { over, fonts: [...fonts].slice(0, 8), small: small.slice(0, 8), sponsored, disclosures: d.querySelectorAll(DISC).length };
      f.remove();
    }
    return out;
  };
  window.__rule8 = async (routes) => {
    const out = {};
    for (const p of routes) {
      const f = await load(p); const d = f.contentDocument, w = f.contentWindow;
      const H = d.documentElement.scrollHeight, bad = []; let stops = 0;
      const inView = (e) => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < w.innerHeight && visible(w, e); };
      for (let y = 0; y < H; y += 150) {
        w.scrollTo(0, y); await new Promise((r) => setTimeout(r, 450)); stops += 1;
        const links = [...d.querySelectorAll('a[rel~="sponsored"]')].filter(inView);
        if (links.length && ![...d.querySelectorAll(DISC)].some(inView)) bad.push(`y${y}: ${links.map((a) => a.textContent.trim().slice(0, 20)).join(', ')}`);
      }
      out[p] = bad.length ? { stops, bad: bad.slice(0, 6) } : `ok ${stops} viewports`;
      f.remove();
    }
    return out;
  };
})();
