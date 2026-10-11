// Executed with Chrome through cua_repl; bindings tab and viewport were initialized using documented APIs.
for (const width of [390, 768, 1440]) {
  await vp.set({width, height: width === 390 ? 900 : 1000});
  for (const prefix of ['ur', 'uk-ua']) for (const suffix of ['', '/exchanges', '/exchanges/okx', '/news', '/about']) {
    await tab.goto('http://127.0.0.1:4189/' + prefix + suffix);
    await tab.playwright.locator('html[data-nexualpha-hydrated="true"]').waitFor({state:'attached', timeoutMs:15000});
    await tab.playwright.locator('body').press('End');
    qaRows.push(await tab.playwright.evaluate(() => ({url:location.href, width:innerWidth, lang:document.documentElement.lang, dir:document.documentElement.dir, hydrated:document.documentElement.dataset.nexualphaHydrated, h1:document.querySelector('h1')?.textContent, client:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth, robots:document.querySelector('meta[name="robots"]')?.content, canonical:document.querySelector('link[rel="canonical"]')?.href, alternates:document.querySelectorAll('link[hreflang]').length})));
  }
}
await tab.dev.logs({levels:['error'],limit:100});
// Screenshots inspected: Urdu home 390, Ukrainian home 390, Ukrainian About 1440.
// Temporary viewport reset and QA tab closed after checks.
