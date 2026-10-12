// Paths of the original pt-BR Brazil decision pages (BRAZIL_PAGES in brazil-market.js). The router only needs to know
// whether a path is one of them; importing brazil-market.js from App.jsx put the whole Brazil content (~12 KB gzip)
// in every page's initial JS (2026-10-12 home budget). tests/brazil-market.test.mjs keeps this list equal to BRAZIL_PAGES.
export const BRAZIL_PAGE_PATHS = Object.freeze(["/br", "/br/comparar", "/br/pix", "/br/saque-pix", "/br/custos", "/br/conta", "/br/kyc-cpf"]);
const PATH_SET = new Set(BRAZIL_PAGE_PATHS);

export function isBrazilPagePath(pathname) {
  return typeof pathname === "string" && PATH_SET.has(pathname);
}
