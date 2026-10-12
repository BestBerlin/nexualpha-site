// Route of the Binance October campaign page. Kept dependency-free: the browser entry (App.jsx routeState) imports it.
export const BINANCE_OCTOBER_PATH = "/activities/binance-october-gifts";
export function parseBinanceOctoberPath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return path === BINANCE_OCTOBER_PATH;
}
