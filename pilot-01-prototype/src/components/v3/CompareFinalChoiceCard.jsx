import { CodeChip } from "../v6/CodeChip.jsx";
import { BrandMark } from "../brand/BrandMark";
import { SectionRule } from "../shared/DataRule.jsx";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { compareVenueCta } from "../../data/compare-cta.js";
import { sanitizePublicText } from "../../data/public-copy-sanitizer.js";
import { decisionForVenue } from "../../data/venue-decision-content.js";
import { localizedHref } from "../../data/locale-routing.js";
import { appendDecisionPassportQuery } from "../../data/decision-passport.js";
import { getLocalizedVenueName } from "../../utils/venue-name-helper.js";
import { ctaUiCopy, fillCta } from "../../data/cta-ui-copy.js";

// One date format site-wide: "September 22, 2026" in a review label reads "2026-09-22".
const REVIEW_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const isoReviewDates = (text) => String(text || "").replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? (\d{1,2}), (\d{4})\b/g, (m, mon, d, y) => `${y}-${String(REVIEW_MONTHS.indexOf(mon.toLowerCase()) + 1).padStart(2, "0")}-${d.padStart(2, "0")}`);

const localeKey = (locale) => {
  const value = String(locale || "");
  if (value.toLowerCase() === "pt-br") return "pt-BR";
  return value.split("-")[0];
};

const textLocaleKey = (locale) => {
  const value = String(locale || "");
  if (value === "zh-Hant") return "zh-Hant";
  if (value.startsWith("zh")) return "zh-Hans";
  return localeKey(locale);
};

const zhText = (locale, hans, hant) => (String(locale || "") === "zh-Hant" || String(locale || "") === "zh-TW" ? hant : hans);

const localePending = (locale, zh = "待官方来源核验") => String(locale || "").startsWith("zh") ? zhText(locale, zh, "待官方來源核驗") : ({
  ja: "公式ソース確認待ち",
  ko: "공식 출처 확인 대기",
  tr: "Resmi kaynak doğrulaması bekleniyor",
  fr: "Vérification de la source en attente",
  de: "Quellenprüfung ausstehend",
  ru: "Ожидается проверка источника",
  ar: "بانتظار التحقق من المصدر",
  id: "Menunggu verifikasi sumber",
  vi: "Đang chờ xác minh nguồn",
  it: "Verifica della fonte in sospeso",
  es: "Pendiente de verificación de la fuente",
  "pt-BR": "Aguardando verificação da fonte",
  // l10n: needs native review
  ur: "سرکاری ماخذ کی تصدیق باقی ہے",
  // l10n: needs native review
  uk: "Очікує перевірки офіційного джерела",
}[localeKey(locale)] || "Pending official-source verification");

const detailCtaLabel = (locale, { direct, hasReferral }) => {
  const labels = {
    "zh-Hans": { verify: "先核对地区资格", official: "打开官网", register: "在官网注册" },
    "zh-Hant": { verify: "先核對地區資格", official: "打開官網", register: "在官網註冊" },
    es: { verify: "Verificar elegibilidad regional", official: "Abrir sitio oficial", register: "Registrarse en el sitio oficial" },
    "pt-BR": { verify: "Verificar elegibilidade regional", official: "Abrir site oficial", register: "Cadastrar no site oficial" },
    fr: { verify: "Vérifier l’éligibilité régionale", official: "Ouvrir le site officiel", register: "S’inscrire sur le site officiel" },
    de: { verify: "Regionale Berechtigung prüfen", official: "Offizielle Website öffnen", register: "Auf der offiziellen Website registrieren" },
    ja: { verify: "地域の利用条件を確認", official: "公式サイトを開く", register: "公式サイトで登録" },
    ko: { verify: "지역 이용 가능 여부 확인", official: "공식 사이트 열기", register: "공식 사이트에서 가입" },
    ar: { verify: "تحقق من الأهلية الإقليمية", official: "فتح الموقع الرسمي", register: "التسجيل في الموقع الرسمي" },
    tr: { verify: "Bölgesel uygunluğu doğrula", official: "Resmi siteyi aç", register: "Resmi sitede kaydol" },
    ru: { verify: "Проверить доступность в регионе", official: "Открыть официальный сайт", register: "Зарегистрироваться на официальном сайте" },
    id: { verify: "Verifikasi kelayakan wilayah", official: "Buka situs resmi", register: "Daftar di situs resmi" },
    vi: { verify: "Kiểm tra điều kiện khu vực", official: "Mở trang chính thức", register: "Đăng ký trên trang chính thức" },
    it: { verify: "Verifica l’idoneità regionale", official: "Apri il sito ufficiale", register: "Registrati sul sito ufficiale" },
    // l10n: needs native review
    ur: { verify: "پہلے علاقائی اہلیت چیک کریں", official: "سرکاری سائٹ کھولیں", register: "سرکاری سائٹ پر رجسٹر کریں" },
    // l10n: needs native review
    uk: { verify: "Спершу перевірте регіональну доступність", official: "Відкрити офіційний сайт", register: "Зареєструватися на офіційному сайті" },
  };
  const copy = labels[locale] || labels[String(locale).split("-")[0]] || {
    verify: "Verify regional eligibility first",
    official: "Open Official Site",
    register: "Register on Official Site",
  };
  if (!direct) return copy.verify;
  return hasReferral ? copy.register : copy.official;
};

const compareDetailPhrase = (locale, key, fallback) => ({
  en: { accountTerms: "Check official account terms and sources" },
  "zh-Hans": { accountTerms: "以官方账户条件和来源核验为准" },
  "zh-Hant": { accountTerms: "以官方帳戶條件和來源核驗為準" },
  es: { accountTerms: "Comprobar condiciones de cuenta y fuentes oficiales" },
  "pt-BR": { accountTerms: "Confira termos oficiais da conta e fontes" },
  fr: { accountTerms: "Vérifier conditions de compte et sources officielles" },
  de: { accountTerms: "Offizielle Kontobedingungen und Quellen prüfen" },
  ja: { accountTerms: "公式アカウント条件と出典で確認" },
  ko: { accountTerms: "공식 계정 조건과 출처로 확인" },
  ar: { accountTerms: "تحقق من شروط الحساب والمصادر الرسمية" },
  tr: { accountTerms: "Resmî hesap koşulları ve kaynaklarla doğrulayın" },
  ru: { accountTerms: "Проверьте условия аккаунта и официальные источники" },
  id: { accountTerms: "Periksa ketentuan akun resmi dan sumber" },
  vi: { accountTerms: "Kiểm tra điều kiện tài khoản và nguồn chính thức" },
  it: { accountTerms: "Controlla termini account e fonti ufficiali" },

 // l10n: needs native review
 ur:{accountTerms:"سرکاری اکاؤنٹ کی شرائط اور ماخذ جانچیں"},
 // l10n: needs native review
 uk:{accountTerms:"Перевірити офіційні умови акаунта та джерела"},
}[textLocaleKey(locale)]?.[key] || fallback);

const finalChoiceFallbackCopy = (locale) => ({
  eyebrow: locale.startsWith("zh") ? zhText(locale, "注册前最终怎么选", "註冊前最終怎麼選") : ({ ja: "登録前の最終判断", ko: "가입 전 최종 판단", tr: "Kayıt öncesi son karar" }[textLocaleKey(locale)] || "Final call before signup"),
  suitedForLabel: locale.startsWith("zh") ? zhText(locale, "适合谁", "適合誰") : ({ ja: "向いている人", ko: "적합한 사용자", tr: "Kimler için uygun" }[textLocaleKey(locale)] || "Who it fits"),
  verifyLabel: locale.startsWith("zh") ? zhText(locale, "先核验什么", "先核驗什麼") : ({ ja: "先に確認", ko: "먼저 확인", tr: "Önce doğrula" }[textLocaleKey(locale)] || "Verify first"),
  matrixLabel: locale.startsWith("zh") ? zhText(locale, "查看详细矩阵", "查看詳細矩陣") : ({ ja: "詳細マトリクス", ko: "상세 매트릭스", tr: "Detay matrisi" }[textLocaleKey(locale)] || "Full matrix"),
  evidenceLabel: locale.startsWith("zh") ? zhText(locale, "展开来源与判断依据", "展開來源與判斷依據") : ({ ja: "出典と判断根拠", ko: "출처와 판단 근거", tr: "Kaynakları ve karar notlarını aç" }[textLocaleKey(locale)] || "Review sources and decision notes"),
});

const publicVenueAccess = (slug, locale = "en", market) => publicCtaForVenue(slug, locale, market);

function LocalLink({ locale, href, children, className, ...props }) {
  return <a className={className} href={localizedHref(href, { locale })} {...props}>{children}</a>;
}

function hrefContext(href, context = {}) {
  const target = new URL(String(href || "/"), "https://nexualpha.com");
  return {
    market: target.searchParams.get("market") || context.market,
    product: target.searchParams.get("product") || context.product,
    accountStage: context.accountStage,
    funding: context.funding,
  };
}

function contextualInternalHref(href, context = {}) {
  return appendDecisionPassportQuery(href, hrefContext(href, context));
}

// The sources and decision notes behind the choice. On the two-venue answer layout they open inside the page's
// "Sources and decision notes" group instead of a second, near-identically named disclosure in the card.
export function CompareFinalChoiceEvidence({ directAnswer, profiles, locale, market, product, accountStage, funding }) {
  if (!directAnswer || !profiles?.length) return null;
  const { pageContext, detailHref, ctas } = choiceContext({ profiles, locale, market, product, accountStage, funding });
  return <div className="v3-compare-final-choice-evidence" aria-label={directAnswer.seoQuestion || directAnswer.title || "Direct comparison answer"}>
    <FinalChoiceEvidenceBody directAnswer={directAnswer} locale={locale} pageContext={pageContext} ctas={ctas} detailHref={detailHref} market={market} product={product} />
  </div>;
}

function choiceContext({ profiles, locale, market, product, accountStage, funding }) {
  const contextParams = new URLSearchParams();
  if (market) contextParams.set("market", market);
  if (product) contextParams.set("product", product);
  const contextSearch = contextParams.toString();
  const pageContext = { market, product, accountStage, funding };
  const detailHref = (slug) => appendDecisionPassportQuery(`/exchanges/${slug}${contextSearch ? `?${contextSearch}` : ""}#registration-path`, pageContext);
  const ctas = profiles.slice(0, 2).map((profile) => ({
    profile,
    access: publicVenueAccess(profile.slug, locale, market),
    cta: compareVenueCta(profile.slug, profiles.map((p) => p.slug), locale, market, product, { accountStage, funding }),
    decision: decisionForVenue(profile.slug, locale),
  }));
  return { pageContext, detailHref, ctas };
}

// Mobile-first screen of /compare/{a}-vs-{b} (owner 2026-10-10): the H1, the one-line verdict already used by the
// final-choice card, and the two official sign-up routes. Same choiceContext as the card below, so the CTA guard sees
// identical hrefs and codes.
export function CompareHeroActions({ directAnswer, profiles, locale, market, product, accountStage, funding }) {
  if (!profiles || profiles.length !== 2) return null;
  const verdict = sanitizePublicText(directAnswer?.decisionCard?.title) || sanitizePublicText(directAnswer?.title) || null;
  const { ctas } = choiceContext({ profiles, locale, market, product, accountStage, funding });
  const ui = ctaUiCopy(locale);
  return (
    <div className="v3-compare-hero-actions" data-compare-hero-actions="">
      {verdict && <p className="v3-compare-hero-actions__verdict">{verdict}</p>}
      <div className="v3-compare-hero-actions__row" role="group" aria-label={compareDetailPhrase(locale, "accountTerms", "Check official account terms and sources")}>
        {ctas.map(({ profile, access, cta }) => (
          <a
            key={profile.slug}
            href={cta.ctaHref}
            target={cta.direct ? "_blank" : undefined}
            rel={cta.direct ? "sponsored noopener noreferrer" : undefined}
            className="v3-compare-hero-actions__btn"
            data-cta-kind={cta.direct ? "registration" : "research"}
            data-cta-platform={profile.slug}
            data-cta-placement="compare-hero-signup"
            data-cta-code={cta.direct && access.hasReferral && access.inviteCode ? access.inviteCode : undefined}
            data-growth-decision={profile.slug}
            data-growth-placement="compare-hero-signup"
            data-growth-market={market}
            data-growth-product={product}
          >
            <BrandMark slug={profile.slug} compact />
            <span className="v3-compare-hero-actions__label">
              <strong translate="no" lang="en">{cta.direct ? fillCta(ui.openN, { n: profile.name }) : `${getLocalizedVenueName(profile, locale)}: ${detailCtaLabel(locale, { direct: false, hasReferral: access.hasReferral })}`}</strong>
              {cta.direct && access.hasReferral && access.inviteCode && <small translate="no" lang="en" dir="ltr">{ui.code}: {access.inviteCode}</small>}
            </span>
            <span aria-hidden="true">{cta.direct ? "↗" : "→"}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function CompareFinalChoiceCard({ directAnswer, profiles, locale, market, product, accountStage, funding, evidence = "inline" }) {
  if (!directAnswer || !profiles?.length) return null;
  const fallback = finalChoiceFallbackCopy(locale);
  const card = directAnswer.decisionCard || {};
  const title = card.title || directAnswer.title;
  const { pageContext, detailHref, ctas } = choiceContext({ profiles, locale, market, product, accountStage, funding });

  return (
    <article className="v3-compare-final-choice-card" aria-label={title}>
      <SectionRule />
      <div className="v3-compare-final-choice-card__head">
        <h2>{title}</h2>
        <p>{directAnswer.body}</p>
      </div>

      <div className="v3-compare-final-choice-card__grid">
        {ctas.map(({ profile, access, cta, decision }) => {
          const pick = card.picks?.[profile.slug] || {};
          const locName = getLocalizedVenueName(profile, locale);
          return (
            <section key={profile.slug} className="v3-compare-final-choice-card__venue">
              <div className="v3-compare-final-choice-card__venue-head">
                <BrandMark slug={profile.slug} compact />
                <strong translate="no" lang="en">{locName}</strong>
              </div>
              <dl>
                <div>
                  <dt>{card.suitedForLabel || fallback.suitedForLabel}</dt>
                  <dd>{sanitizePublicText(pick.fit) || sanitizePublicText(decision?.fit) || profile.useCases?.[0] || localePending(locale)}</dd>
                </div>
                <div>
                  <dt>{card.verifyLabel || fallback.verifyLabel}</dt>
                  <dd>{sanitizePublicText(pick.verify) || profile.checks?.slice(0, 2).join(" / ") || compareDetailPhrase(locale, "accountTerms", "Check official account terms and sources")}</dd>
                </div>
              </dl>
              <div className="v3-compare-final-choice-card__action-row" role="group" aria-label={compareDetailPhrase(locale, "accountTerms", "Check official account terms and sources")}>
                {access.inviteCode && <CodeChip code={access.inviteCode} slug={profile.slug} placement="compare-final-choice-code" locale={locale} />}
                <a
                  href={cta.ctaHref}
                  target={cta.direct ? "_blank" : undefined}
                  rel={cta.direct ? "sponsored noopener noreferrer" : undefined}
                  className="v3-compare-final-choice-card__primary"
                  data-cta-kind={cta.direct ? "registration" : "research"}
                  data-cta-platform={profile.slug}
                  data-cta-placement="compare-final-choice-registration"
                  data-cta-code={cta.direct && access.hasReferral && access.inviteCode ? access.inviteCode : undefined}
                  data-growth-decision={profile.slug}
                  data-growth-placement="compare-final-choice-registration"
                  data-growth-market={market}
                  data-growth-product={product}
                >
                  {detailCtaLabel(locale, { direct: cta.direct, hasReferral: access.hasReferral })} {cta.direct ? "↗" : "→"}
                </a>
              </div>
            </section>
          );
        })}
      </div>

      {evidence === "inline" && <div className="v3-compare-final-choice-card__actions">
        <details className="v3-compare-final-choice-card__evidence" data-mobile-evidence-default="collapsed" aria-label={directAnswer.seoQuestion || directAnswer.title || "Direct comparison answer"}>
          <summary>{card.evidenceLabel || fallback.evidenceLabel}<span aria-hidden="true">＋</span></summary>
          <FinalChoiceEvidenceBody directAnswer={directAnswer} locale={locale} pageContext={pageContext} ctas={ctas} detailHref={detailHref} market={market} product={product} />
        </details>
      </div>}
    </article>
  );
}


const evidencePairs = (value) => {
  if (Array.isArray(value)) return value.map((entry) => Array.isArray(entry) ? entry : [String(entry), ""]);
  if (value && typeof value === "object") return Object.entries(value);
  return [];
};

function FinalChoiceEvidenceBody({ directAnswer, locale, pageContext, ctas, detailHref, market, product }) {
  return <>
          <h3>{directAnswer.title}</h3>
          {directAnswer.reviewedAt && <time className="v3-compare-direct-answer__reviewed" dateTime={directAnswer.reviewedAt}>{isoReviewDates(directAnswer.reviewedLabel)}</time>}
          {directAnswer.searchIntent && (
            <p className="v3-compare-direct-answer__search-intent">
              <strong>{directAnswer.searchIntent.label}</strong>: {directAnswer.searchIntent.detail}
            </p>
          )}
          {evidencePairs(directAnswer.productTypes).length > 0 && (
            <dl className="v3-compare-direct-answer__product-types">
              {evidencePairs(directAnswer.productTypes).map(([label, detail]) => <div key={label}><dt>{label}</dt><dd>{detail}</dd></div>)}
            </dl>
          )}
          {evidencePairs(directAnswer.searchDemand).length > 0 && (
            <dl className="v3-compare-direct-answer__search-demand">
              {evidencePairs(directAnswer.searchDemand).map(([label, detail]) => <div key={label}><dt>{label}</dt><dd>{detail}</dd></div>)}
            </dl>
          )}
          {directAnswer.checks?.length > 0 && <ul>{directAnswer.checks.map((check) => <li key={check}>{check}</li>)}</ul>}
          {directAnswer.nextSteps?.length > 0 && (
            <ol className="v3-compare-direct-answer__next-steps">
              {directAnswer.nextSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          )}
          {directAnswer.boundary && <small>{directAnswer.boundary}</small>}
          {(directAnswer.sourceLinks?.length || directAnswer.internalLinks?.length || ctas.length) && (
            <div className="v3-compare-direct-answer__links">
              {evidencePairs(directAnswer.sourceLinks).map(([label, href]) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="compare-direct-answer-source"><span {...(/^[\x20-\x7e]+$/.test(label) ? { translate: "no", lang: "en" } : {})}>{label}</span> ↗</a>
              ))}
              {evidencePairs(directAnswer.internalLinks).map(([label, href]) => (
                <LocalLink key={href} locale={locale} href={contextualInternalHref(href, pageContext)} data-cta-kind="research" data-cta-placement="compare-direct-answer-internal">{label}</LocalLink>
              ))}
              {ctas.map(({ profile }) => (
                <LocalLink
                  key={`detail-${profile.slug}`}
                  locale={locale}
                  href={detailHref(profile.slug)}
                  data-cta-kind="research"
                  data-cta-platform={profile.slug}
                  data-cta-placement="compare-final-choice-detail"
                  data-growth-decision={profile.slug}
                  data-growth-placement="compare-final-choice-detail"
                  data-growth-market={market}
                  data-growth-product={product}
                >
                  {detailCtaLabel(locale, { direct: false, hasReferral: publicVenueAccess(profile.slug, locale, market).hasReferral })}: {getLocalizedVenueName(profile, locale)} →
                </LocalLink>
              ))}
            </div>
          )}
  </>;
}
