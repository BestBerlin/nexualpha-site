// Static closing panel: all content is visible in SSR, with CSS-only decoration and no reveal lifecycle.
import { localizedHref } from "../../data/locale-routing.js";
import { CLOSE_COPY } from "../v3/LeanHeroCopyV6.js";
import { homePartnersFor } from "../../data/home-rebate-tiers.js";
import { partnerRebateShare } from "../../data/partner-benefit-status.js";
import { jurisdictionPromotionBan } from "../../data/partner-geo-policy.js";
import { isNeutralCtaLocale } from "../../data/locale-policy.js";
import { formatPercent } from "../../data/format-percent.js";
import { h7Copy } from "../v7/home7-copy.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { nameOf } from "../v7/home7-shared.jsx";

// Retain the GET destinations and no-JS behavior of the existing closing CTAs.
function GoForm({ href, className, children }) {
  const u = new URL(href, "https://nexualpha.com");
  return <form className="nx-close__form" action={u.pathname} method="get">
    {[...u.searchParams].map(([k, v]) => <input type="hidden" name={k} value={v} key={k} />)}
    <button type="submit" className={className}>{children}<span aria-hidden="true">↗</span></button>
  </form>;
}

export const directoryLabel = (locale) => (CLOSE_COPY[locale] || CLOSE_COPY.en).dir;

export function ClosingBand({ locale = "en", market }) {
  const t = CLOSE_COPY[locale] || CLOSE_COPY.en;
  const banned = Boolean(jurisdictionPromotionBan({ locale, market })) || isNeutralCtaLocale(locale);
  const home = h7Copy(locale);
  return <section className="v6-close nx-close" aria-labelledby="v6-close-title">
    <div className="nx-close__panel">
      <span className="nx-close__node" aria-hidden="true"><i /></span>
      <h2 id="v6-close-title">{t.title}</h2>
      <p className="nx-close__lead">{t.lead}</p>
      <div className="nx-close__actions">
        <GoForm href={localizedHref("/exchanges", { locale })} className="nx-close__primary">{t.dir}</GoForm>
        <GoForm href={localizedHref("/compare/binance-vs-okx", { locale })} className="nx-close__secondary">{t.cmp}</GoForm>
      </div>
      <ul className="nx-close__partners" aria-label={home.pw(homePartnersFor(locale, market).length)}>
        {homePartnersFor(locale, market).map((slug) => {
          const share = banned ? null : partnerRebateShare(slug);
          return <li key={slug}><a href={localizedHref(banned ? `/exchanges/${slug}` : `/exchanges/${slug}#registration-path`, { locale })}>
            <BrandMark slug={slug} compact /><span>{nameOf(slug)}</span>
            {share ? <small>{home.upTo} <bdi>{formatPercent(locale, Math.round(share * 100))}</bdi></small> : null}
          </a></li>;
        })}
      </ul>
    </div>
  </section>;
}
