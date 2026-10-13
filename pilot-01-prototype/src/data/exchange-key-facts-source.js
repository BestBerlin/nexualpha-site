import { EXCHANGE_FACTS, feeFact, factsForVenue } from "./exchange-facts.js";
import { FACTBOOK_REGISTRY, FACTBOOK_SLUGS, AUDIT_DATE } from "./factbook-registry.js";
import { licenseRecords } from "./licenses.js";
import { APP_DOWNLOADS } from "./app-downloads.js";
import { exchangeResearch } from "./exchange-research.js";

export const EXCHANGE_KEY_FACT_SLUGS = Object.freeze([...new Set([...FACTBOOK_SLUGS, ...Object.keys(EXCHANGE_FACTS)])]);
const sourceWithoutCodes = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      ![...url.searchParams.keys()].some(key => /ref|invite|code|affiliate/i.test(key)) ? url.href : null;
  } catch { return null; }
};

// A dated extraction, never a live eligibility or reserve-ratio assertion. Fields without item-level evidence are omitted.
export function buildExchangeKeyFacts(slug) {
  if (!EXCHANGE_KEY_FACT_SLUGS.includes(slug)) return null;
  const rows = [];
  const add = (id, value, sources, checkedOn) => {
    const sourceUrls = [...new Set(sources.map(sourceWithoutCodes).filter(Boolean))];
    if (sourceUrls.length && checkedOn) rows.push({ id, value, sourceUrls, checkedOn });
  };
  const fees = factsForVenue(slug);
  const registry = FACTBOOK_REGISTRY[slug];
  for (const product of ["spot", "perp"]) {
    const fee = feeFact(slug, product);
    if (fee.state === "checked") add(`${product}-fees`, {
      maker: fee.maker, taker: fee.taker, units: "percent", scope: fee.note,
    }, fees.sourceUrls, fee.checkedOn);
  }
  for (const record of licenseRecords.filter(record => record.exchange === slug)) {
    add(`license-${record.country}-${record.regulator}`, {
      jurisdiction: record.country, regulator: record.regulator, status: record.status,
      entity: record.entityName, type: record.type, note: record.statusNote || record.evidence || "",
    }, [record.sourceUrl], record.lastChecked);
  }
  const porUrl = registry?.por?.merkleUrl;
  // Exclude generic homepages masquerading as reserve records; expose only dated factbook fields with the recorded disclosure URL.
  if (porUrl && new URL(porUrl).pathname.includes("proof-of-reserves")) {
    const reserveContext = [
      registry.por.cleanRatio ? `clean reserve ratio ${registry.por.cleanRatio}` : null,
      registry.por.auditor ? `review method ${registry.por.auditor}` : null,
      registry.por.securityFund ? `security fund ${registry.por.securityFund}` : null,
    ].filter(Boolean).join("; ");
    add("proof-of-reserves", {
      url: porUrl,
      scope: `Recorded disclosure URL${reserveContext ? `; ${reserveContext}` : ""}. Reserve figures are dated factbook fields, not live guarantees.`,
    }, [porUrl], registry.por.checkedOn || AUDIT_DATE);
  }
  const compliance = registry?.compliance;
  if (compliance?.kycSummaryEn || compliance?.kycLevel) {
    const details = [
      "Dated factbook research note; confirm eligibility in the official KYC flow before relying on account access.",
      compliance.kycLevel ? `KYC level: ${compliance.kycLevel}` : null,
      compliance.kycSummaryEn,
      compliance.kycTiersEn?.length ? `tiers: ${compliance.kycTiersEn.join(" / ")}` : null,
      compliance.supportedRegions?.length ? `supported regions: ${compliance.supportedRegions.join(", ")}` : null,
      compliance.restrictedRegions?.length ? `restricted regions: ${compliance.restrictedRegions.join(", ")}` : null,
    ].filter(Boolean).join("; ");
    add("kyc-reference", details, [`https://${registry.officialDomain}`], AUDIT_DATE);
  }
  const app = APP_DOWNLOADS[slug];
  if (app) add("apps", { ios: Boolean(app.appStore), android: Boolean(app.googlePlay), scope: "Recorded store listings; regional availability requires checking the store." }, app.sources, app.lastChecked);
  const research = exchangeResearch[slug];
  const productFact = research?.facts.find(fact => fact.axis === "products");
  if (productFact) add("product-scope", productFact.value.en, [productFact.sourceUrl], research.checkedAt.slice(0, 10));
  if (!rows.length && research?.facts[0]) {
    const fact = research.facts[0];
    add("source-context", fact.value.en, [fact.sourceUrl], research.checkedAt.slice(0, 10));
  }
  for (const fact of research?.facts || []) {
    if (fact.label.en === "USDC funding route") add("deposit-methods", fact.value.en, [fact.sourceUrl], research.checkedAt.slice(0, 10));
  }
  if (!rows.length && registry?.apiEndpoints?.docUrl) {
    add("source-context", "Recorded API documentation URL (discovery only).", [registry.apiEndpoints.docUrl], AUDIT_DATE);
  }
  return {
    schemaVersion: 1, slug, name: registry?.name || fees?.name,
    profileUrl: `https://nexualpha.com/exchanges/${slug}`,
    jsonUrl: `https://nexualpha.com/api/exchange-facts/${slug}.json`,
    limitations: "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    rows,
  };
}

