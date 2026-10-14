// Lightweight academy route recognition for the app shell.
// The full episode index stays in the academy route chunk.
export const ACADEMY_PATH = "/academy";
export const ACADEMY_EPISODE_SLUGS = Object.freeze(["can-i-buy-part-of-a-bitcoin","is-usdt-a-dollar","exchange-vs-wallet","find-the-official-exchange","kyc-who-gets-your-id","first-deposit-paths","first-spot-trade","sell-vs-withdraw","pre-transfer-checklist","transfer-not-arrived","scam-red-flags","season-1-finale","price-vs-fill-price","market-limit-cancel","read-a-candlestick","position-sizing-basics","stop-loss-is-a-plan","spot-vs-futures","what-leverage-does","maintenance-margin","isolated-margin","cross-margin","liquidation-mark-price","funding-fees-final"]);
const ACADEMY_EPISODE_SLUG_SET = new Set(ACADEMY_EPISODE_SLUGS);

/** { kind: "hub" } | { kind: "episode", episode: { slug } } | { kind: "missing" } for /academy paths, null elsewhere. */
export function parseAcademyPath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path === ACADEMY_PATH) return { kind: "hub" };
  const match = path.match(/^\/academy\/([^/]+)$/);
  if (!match) return path.startsWith(`${ACADEMY_PATH}/`) ? { kind: "missing" } : null;
  return ACADEMY_EPISODE_SLUG_SET.has(match[1]) ? { kind: "episode", episode: { slug: match[1] } } : { kind: "missing" };
}

export const isAcademyPath = (pathname) => {
  const route = parseAcademyPath(pathname);
  return Boolean(route && route.kind !== "missing");
};
