// Route of the Bybit Stocks campaign page. Kept dependency-free: the browser entry (App.jsx routeState) imports it.
export const BYBIT_STOCKS_PATH = "/activities/bybit-stocks";
export function parseBybitStocksPath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return path === BYBIT_STOCKS_PATH;
}
