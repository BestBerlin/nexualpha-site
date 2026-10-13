// Exchange keyword plan 2026-10-11: first-party answers for "hyperliquid fees / referral code / funded account" and
// "backpack exchange tokenized stocks" on the existing profiles (data: src/data/venue-keyword-sections.js). Styles live
// in profile-density.css (already linked on every profile) so the SSR page never waits for a separate stylesheet.
// The invite code comes from the CTA (partner feed), never typed here.
import { referralTitleAllowed } from "../../data/referral-seo.js";
import { SourceLink } from "../shared/SourceLink.jsx";
import {
  BACKPACK_SOURCES,
  HYPERLIQUID_FEE_TIERS,
  HYPERLIQUID_SOURCES,
  SECTIONS_REVIEWED_AT,
  backpackStocksCopy,
  hyperliquidKeywordCopy,
} from "../../data/venue-keyword-sections.js";

function SourceLinks({ items, placement, locale, market }) {
  return (
    <p className="v3-kw__sources">
      {items.map(([label, href]) => (
        <SourceLink locale={locale} market={market} key={href} href={href} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement={placement}>{label} ↗</SourceLink>
      ))}
    </p>
  );
}

function HyperliquidSections({ locale, market, inviteCode }) {
  const t = hyperliquidKeywordCopy(locale);
  const showReferral = Boolean(inviteCode && t.referralTitle && referralTitleAllowed("hyperliquid", locale, market));
  return (
    <section className="v3-kw" data-keyword-section="hyperliquid" aria-labelledby="hl-fees-title">
      <h2 id="hl-fees-title">{t.feesTitle}</h2>
      <p>{t.feesLead}</p>
      <div className="v3-kw__table-wrap" role="region" aria-labelledby="hl-fees-title" tabIndex={0}>
        <table className="v3-kw__table">
          <thead><tr>{t.cols.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
          <tbody>
            {HYPERLIQUID_FEE_TIERS.map((row) => (
              <tr key={row.tier}>
                <th scope="row" className="v6-num">{row.tier}</th>
                <td className="v6-num" translate="no">{row.volume || "—"}</td>
                <td className="v6-num" translate="no">{row.perpTaker}</td>
                <td className="v6-num" translate="no">{row.perpMaker}</td>
                <td className="v6-num" translate="no">{row.spotTaker}</td>
                <td className="v6-num" translate="no">{row.spotMaker}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="v3-kw__note">{t.staking}</p>
      {showReferral && (
        <div className="v3-kw__block" data-keyword-block="referral">
          <h3>{t.referralTitle}</h3>
          <p>{t.referralBody} <code translate="no">{inviteCode}</code>{/[\u3000-\u9fff]/.test(t.referralBody) ? "。" : "."}{t.noShare ? <> {t.noShare}</> : null}</p>
        </div>
      )}
      <div className="v3-kw__block" data-keyword-block="funded-account">
        <h3>{t.fundedTitle}</h3>
        <p>{t.fundedBody}</p>
      </div>
      <p className="v3-kw__checked">{t.checked} <time dateTime={SECTIONS_REVIEWED_AT}>{SECTIONS_REVIEWED_AT}</time></p>
      <SourceLinks locale={locale} market={market}
        placement="hyperliquid-keyword-source"
        items={[[t.sources[0], HYPERLIQUID_SOURCES.fees], [t.sources[1], HYPERLIQUID_SOURCES.referrals], [t.sources[2], HYPERLIQUID_SOURCES.subAccounts], [t.sources[3], HYPERLIQUID_SOURCES.vaults]]}
      />
    </section>
  );
}

function BackpackStocksSection({ locale, market }) {
  const t = backpackStocksCopy(locale);
  return (
    <section className="v3-kw" data-keyword-section="backpack-stocks" aria-labelledby="bp-stocks-title">
      <h2 id="bp-stocks-title">{t.title}</h2>
      <p>{t.lead}</p>
      <ul className="v3-kw__list">{t.items.map((item) => <li key={item}>{item}</li>)}</ul>
      <p className="v3-kw__note">{t.boundary}</p>
      <p className="v3-kw__checked">{t.checked} <time dateTime={SECTIONS_REVIEWED_AT}>{SECTIONS_REVIEWED_AT}</time></p>
      <SourceLinks locale={locale} market={market} placement="backpack-stocks-source" items={[[t.sources[0], BACKPACK_SOURCES.securities], [t.sources[1], BACKPACK_SOURCES.tokenized]]} />
    </section>
  );
}

export function VenueKeywordSections({ slug, locale = "en", market, inviteCode = null }) {
  if (slug === "hyperliquid") return <HyperliquidSections locale={locale} market={market} inviteCode={inviteCode} />;
  if (slug === "backpack") return <BackpackStocksSection locale={locale} market={market} />;
  return null;
}

export default VenueKeywordSections;
