import { buildRegionalDecisionSet } from "../../data/regional-decision.js";
import { localizedHref } from "../../data/locale-routing.js";
import { decisionCopy, directoryCopy, productPathLabel } from "./venue-yellow-pages-copy.js";

export function RegionalDecisionStrip({ venues = [], market, product, locale = "en", context, contextSearch = "", growthCampaign, open = false, onToggle }) {
  if (!context?.scoped) return null;
  const decisions = buildRegionalDecisionSet({ venues, market, product });
  if (!decisions.primary) return null;
  const dc = directoryCopy(locale);
  const decisionUi = decisionCopy(locale);
  return (
    <div className="yellow-pages__decision-strip" data-regional-decision={`${context.market}:${decisions.primary.venue.slug}`}>
      <div className="yellow-pages__decision-header">
        <strong>{context.label} · {productPathLabel(locale, product)}</strong>
        <span>{locale.startsWith("zh") ? "以地区证据缩短首轮选择" : (dc.shortlist || "Shortlist built from recorded regional evidence")}</span>
      </div>
      <div className="yellow-pages__decision-grid">
        {[decisions.primary, ...decisions.alternatives].filter(Boolean).map((item, index) => (
          <article className={`yellow-pages__decision-card${index > 0 && !open ? " yellow-pages__decision-card--mobile-collapsed" : ""}`} key={item.venue.slug}>
            <span className="yellow-pages__decision-label">{index === 0 ? decisionUi.primary : decisionUi.alternative}</span>
            <strong>{item.venue.name}</strong>
            <small>{item.venue.category} · {item.evidence.hasReferral ? (locale.startsWith("zh") ? "合作入口已配置" : (dc.partnerRoute || "Partner route active")) : (locale.startsWith("zh") ? "官方入口" : (dc.officialRoute || "Official route"))}</small>
            <a
              href={localizedHref(`/exchanges/${item.venue.slug}?${contextSearch}`, { locale })}
              data-cta-kind="research"
              data-cta-platform={item.venue.slug}
              data-cta-placement={index === 0 ? "regional-directory-primary" : "regional-directory-alternative"}
              data-growth-decision={item.venue.slug}
              data-growth-placement={index === 0 ? "regional-directory-primary" : "regional-directory-alternative"}
              data-growth-market={context.market}
              data-growth-product={context.product}
              data-growth-campaign={growthCampaign}
            >{decisionUi.open} →</a>
          </article>
        ))}
        {decisions.verification && <article className={`yellow-pages__decision-card yellow-pages__decision-card--verify${!open ? " yellow-pages__decision-card--mobile-collapsed" : ""}`}>
          <span className="yellow-pages__decision-label">{decisionUi.verify}</span>
          <strong>{decisions.verification.venue.name}</strong>
          <small>{decisionUi.verifyBody}</small>
        </article>}
        {(decisions.alternatives.length > 0 || decisions.verification) && <button type="button" className="yellow-pages__decision-toggle" data-regional-decision-toggle aria-expanded={open} onClick={onToggle}>
          {open
            ? (locale === "zh-Hant" ? "收起其他地區入口" : locale.startsWith("zh") ? "收起其他地区入口" : locale === "es" ? "Ocultar otras rutas" : locale === "id" ? "Sembunyikan rute lain" : (dc.hideMoreRoutes || "Hide other regional routes"))
            : (locale === "zh-Hant" ? "查看其他地區入口" : locale.startsWith("zh") ? "查看其他地区入口" : locale === "es" ? "Ver otras rutas" : locale === "id" ? "Lihat rute lain" : (dc.showMoreRoutes || "View other regional routes"))}
          <span aria-hidden="true">{open ? " ↑" : " ↓"}</span>
        </button>}
      </div>
    </div>
  );
}

export default RegionalDecisionStrip;
