import { enAttrs } from "../../utils/fallback-lang.js";
import { officialCampaignResearchByVenue } from "../../data/official-campaign-research.js";
import { campaignResearchLocalizedText } from "../../data/official-campaign-localizations.js";
import { SourceLink } from "../shared/SourceLink.jsx";
import { campaignCopy } from "./activity/campaign-copy";
import { textLocaleKey, zhText, LocalLink } from "./v3-pages-shared.jsx";

export function CompareVersusSources({ profile, locale, isZhLocale, compareLabels, contextSearch, text, market, product, growthCampaign }) {
  const pResearch = officialCampaignResearchByVenue[profile.slug];
  const pSources = pResearch?.sources ?? [];
  const pConditions = pResearch?.signupReward?.conditions ?? [];
  return (
    <details className="v3-versus-sources-disclosure" data-testid={`compare-versus-sources-${profile.slug}`}>
      <summary>
        <span>{isZhLocale ? `${profile.name} ${zhText(locale, "官方参考与条款来源", "官方參考與條款來源")}` : `${profile.name} ${compareLabels.sources || "Official References & Sources"}`}</span>
        <b aria-hidden="true">＋</b>
      </summary>
      <div className="v3-versus-side__sources">
        <div className="v3-versus-sources__header">
          <span className="v3-versus-sources__title">
            {isZhLocale ? `${profile.name} ${zhText(locale, "官方参考与条款来源", "官方參考與條款來源")}` : `${profile.name} ${compareLabels.sources || "Official References & Sources"}`}
          </span>
          <LocalLink locale={locale} href={`/activities/research/${profile.slug}`} className="v3-versus-sources__more">
            {campaignCopy(locale).openResearch} →
          </LocalLink>
        </div>

        {pConditions.length > 0 && (
          <ul className="v3-versus-sources__list">
            {pConditions.slice(0, 2).map((cond, cIdx) => (
              <li key={cIdx} className="v3-versus-sources__item">
                <span>•</span>
                {(() => {
                  const localizedCond = campaignResearchLocalizedText(profile.slug, ["signupReward", "conditions", String(cIdx)], locale) || cond[locale] || cond[textLocaleKey(locale)] || cond.en;
                  return <span {...(localizedCond === cond.en ? enAttrs(locale) : undefined)}>{localizedCond}</span>;
                })()}
              </li>
            ))}
          </ul>
        )}

        <div className="v3-versus-sources__links">
          {pSources.slice(0, 2).map((src) => (
            <SourceLink locale={locale} key={src.id || src.url} href={src.url} target="_blank" rel="noopener noreferrer" className="v3-versus-source-link">
              <span className="v3-versus-source-bullet"></span>
              <span className="v3-versus-source-name">{src.title}</span>
              <span aria-hidden="true">↗</span>
            </SourceLink>
          ))}
          <LocalLink locale={locale} href={`/exchanges/${profile.slug}?${contextSearch}`} className="v3-versus-detail-link" data-cta-kind="research" data-cta-platform={profile.slug} data-cta-placement="compare-source-detail" data-growth-decision={profile.slug} data-growth-placement="compare-source-detail" data-growth-market={market} data-growth-product={product} data-growth-campaign={growthCampaign}>
            {text.openDetail} ({profile.name}) →
          </LocalLink>
        </div>
      </div>
    </details>
  );
}
