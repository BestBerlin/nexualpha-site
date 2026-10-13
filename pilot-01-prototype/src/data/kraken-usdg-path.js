// Route of the Kraken 5M USDG Futures Challenge campaign page. Kept dependency-free: the browser entry (App.jsx
// routeState) imports it.
export const KRAKEN_USDG_PATH = "/activities/kraken-usdg-challenge";
export function parseKrakenUsdgPath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return path === KRAKEN_USDG_PATH;
}
