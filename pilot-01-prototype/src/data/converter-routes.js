// Entry-safe route parser: the coin universe and page copy stay in the lazy route.
export const FIATS = Object.freeze(["USD", "EUR", "BRL", "TRY", "IDR", "VND", "MXN", "JPY", "KRW", "CNY", "GBP", "INR"]);
export function parseConverterPath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "");
  if (path !== "/convert" && !path.startsWith("/convert/")) return null;
  const match = path.match(/^\/convert\/([a-z0-9]{1,12})-to-([a-z]{3})$/);
  return match && FIATS.includes(match[2].toUpperCase()) ? { kind: "pair", symbol: match[1], fiat: match[2].toUpperCase() } : { kind: "missing" };
}
