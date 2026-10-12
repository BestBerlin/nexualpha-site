// Storage is optional; denied browser persistence must not block the product.
export function storedLocale(storage, key, supported) {
  try {
    const value = storage?.getItem(key);
    return supported.includes(value) ? value : "en";
  } catch { return "en"; }
}

export function validComparison(value, venues) {
  const slugs = value.split("-vs-");
  return slugs.length >= 2 && slugs.length <= 3
    && new Set(slugs).size === slugs.length
    && slugs.every((slug) => venues.some((venue) => venue.slug === slug)) ? slugs : null;
}

export function cleanSelection(value, venues) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((slug) => venues.some((venue) => venue.slug === slug)))].slice(0, 3);
}

export function scrollToHash(doc, hash) {
  if (!hash || hash === '#') return false;
  let id;
  try { id = decodeURIComponent(hash.slice(1).split("?")[0]); } catch { return false; }
  if (!id) return false;
  const target = doc.getElementById(id);
  if (!target) return false;
  for (let ancestor = target; ancestor; ancestor = ancestor.parentElement) {
    if (ancestor.tagName === 'DETAILS') ancestor.open = true;
  }
  target.scrollIntoView({ block: 'start', behavior: 'instant' });
  return true;
}

// A deferred route can replace SSR content after the first hash reveal.
// Retry on the existing committed-content signal, without timers or scroll polling.
export function installHashNavigation(doc, win) {
  let alive = true;
  let frame = null;
  const reveal = () => Promise.resolve(doc.fonts?.ready).then(() => {
    if (!alive) return;
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = win.requestAnimationFrame(() => {
      frame = null;
      if (alive) scrollToHash(doc, win.location.hash);
    });
  });
  const onReady = (event) => {
    if (event.detail?.scope === 'page-content') reveal();
  };
  win.addEventListener('hashchange', reveal);
  win.addEventListener('nexualpha:interaction-ready', onReady);
  reveal();
  return () => {
    alive = false;
    if (frame !== null) win.cancelAnimationFrame(frame);
    win.removeEventListener('hashchange', reveal);
    win.removeEventListener('nexualpha:interaction-ready', onReady);
  };
}
