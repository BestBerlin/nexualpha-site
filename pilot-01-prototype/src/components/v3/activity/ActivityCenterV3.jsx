import { useMemo, useState } from "react";
import { SectionRule } from "../../shared/DataRule.jsx";
import { BrandMark } from "../../brand/BrandMark";
import { visibleOfficialUpdates } from "../../official-updates/official-updates-model";
import { activityCenterCopy } from "./activity-copy";
import { campaignCopy } from "./campaign-copy";
import { useActivityNow } from "./useActivityNow";
import { v3Copy } from "../../../data/v3-product";
import { officialCampaignResearchByVenue } from "../../../data/official-campaign-research";
import { researchView } from "../../../data/official-campaign-model";
import { OFFICIAL_EXCHANGE_ACTIVITIES } from "../../../data/generated-official-activities.js";
import { TELEGRAM_CONFIG } from "../../../data/telegram-config.js";
import { DecisionPathRail } from "../DecisionPathRail.jsx";
import { contextualHref as addContext } from "../../../data/contextual-href.js";
import { updateHref } from "../../../data/activity-update.js";
import { normalizeActivityEligibility } from "./activity-eligibility.js";
import "./ActivityCenterV3.css";
import { campaignJoinCopy } from "./campaign-join-copy.js";
import { CampaignJoin } from "./CampaignJoin.jsx";
import { LiveCampaigns } from "./LiveCampaigns.jsx";
import { OfficialResearchIndex } from "./OfficialResearch";
import { isoDay } from "../../../data/exchange-facts.js";
import { r9Text } from "../../v6/inner-r9-copy.js";
import { GROUP_PREVIEW_COUNT, showAllCopy } from "./show-all-copy.js";

const categoryDefinitions = (text) => [
  { key: "all", label: text.all },
  { key: "listing", label: text.listings },
  { key: "reward", label: text.rewards },
  { key: "product", label: text.products },
  { key: "rules", label: text.rules },
];

function asTime(value) {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time) ? time : null;
}

function hostFrom(url) {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

function categoryOf(update) {
  const text = `${update.kind ?? ""} ${update.title ?? ""}`.toLowerCase();
  if (/(listing|list|上币|上市|delist|下架)/i.test(text)) return "listing";
  if (/(reward|campaign|bonus|airdrop|launchpool|活动|奖励|空投)/i.test(text)) return "reward";
  if (/(stock|equity|multi|asset|product|securities|commodity|股票|多资产|產品|商品|产品)/i.test(text)) return "product";
  if (/(region|rule|kyc|terms|policy|地区|规则|規則|条款|條款)/i.test(text)) return "rules";
  return "listing";
}

function normalizeUpdate(update, now) {
  const discoveredAt = asTime(update.discoveredAt);
  const verifiedAt = asTime(update.verifiedAt);
  const expiresAt = asTime(update.expiresAt);
  const url = update.officialSource?.url ?? update.sourceUrl ?? "";
  const sourceType = update.officialSource?.type ?? update.sourceType ?? "official";
  const expired = expiresAt !== null && expiresAt <= now;
  const publishable = discoveredAt !== null
    && verifiedAt !== null
    && Boolean(hostFrom(url))
    && !expired;

  return {
    ...update,
    category: categoryOf(update),
    discoveredAt,
    verifiedAt,
    expiresAt,
    expired,
    publishable,
    url,
    sourceType,
    sourceHost: hostFrom(url),
    state: expired ? "expired" : publishable ? "current" : "pending",
  };
}

function formatDate(locale, time) {
  if (!time) return "—";
  // Fixed UTC zone: the server and the reader's browser must print the same text or hydration fails (React #418).
  return new Intl.DateTimeFormat(locale || "en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(time));
}

function firstReadableSource(record) {
  return record?.sources?.find((source) => source?.access === "READ") ?? null;
}

function researchCardState(view) {
  if (!view) return "pending";
  if (view.signupReward?.status === "NOT_APPLICABLE") return "no-public-offer";
  if (view.signupReward?.status === "ACCOUNT_CONFIRMATION") return "login-required";
  if (view.signupReward?.status === "UNCONFIRMED") return "region-unknown";
  if (view.signupReward?.status === "ENDED") return "ended";
  return view.freshness === "NEEDS_RECHECK" ? "pending" : "publishable";
}

function cardStateLabel(text, rewardsText, state) {
  const labels = {
    current: text.current,
    expired: text.expired,
    pending: text.pending,
    blocked: text.blocked,
    publishable: text.publishable,
    ended: rewardsText.ended,
    "login-required": rewardsText.accountConfirmation,
    "region-unknown": rewardsText.unconfirmed,
    "no-public-offer": rewardsText.notApplicable,
  };
  return labels[state] ?? text.pending;
}

const activitySupportSummary = {
  "en": "Source notes, review rules and Telegram",
  "zh-Hans": "来源说明、审核规则与 Telegram",
  "zh-Hant": "來源說明、審核規則與 Telegram",
  "ja": "出典の説明・審査ルール・Telegram",
  "ko": "출처 설명·검토 규칙·Telegram",
  "tr": "Kaynak notları, inceleme kuralları ve Telegram",
  "ar": "ملاحظات المصادر وقواعد المراجعة وTelegram",
  "es": "Notas de fuentes, reglas de revisión y Telegram",
  "pt-BR": "Notas de fontes, regras de revisão e Telegram",
  "fr": "Notes sur les sources, règles de revue et Telegram",
  "de": "Quellenhinweise, Prüfregeln und Telegram",
  "ru": "Примечания об источниках, правила проверки и Telegram",
  "id": "Catatan sumber, aturan tinjauan, dan Telegram",
  "vi": "Ghi chú nguồn, quy tắc rà soát và Telegram",
  "it": "Note sulle fonti, regole di revisione e Telegram",
 // l10n: needs native review
 ur: "ماخذ کے نوٹس، جائزے کے اصول اور Telegram",
 // l10n: needs native review
 uk: "Примітки щодо джерел, правила перевірки та Telegram",
};


export function ActivityCenterV3({ locale = "en", market, product, venues = [], publicUpdates = [], campaignFeed }) {
  const activityLocaleUi = {
    ja: { badge: "公式出典リサーチ速報", body: "出典付きの活動、上場、条件を掲載します。資格、期限、具体的な条件は公式アカウントで確認してください。", subscribe: "Telegramで出典付き調査を購読 ↗", index: "公式リサーチ索引を開く", indexHint: "サービス別に出典、状態、確認日を見る" },
    ko: { badge: "공식 출처 리서치 브리핑", body: "출처가 있는 활동, 상장 및 조건을 게시합니다. 자격, 기간과 혜택은 공식 계정에서 확인하세요.", subscribe: "Telegram에서 출처 리서치 구독 ↗", index: "공식 리서치 색인 열기", indexHint: "플랫폼별 출처, 상태와 검토일 확인" },
    tr: { badge: "RESMİ KAYNAK ARAŞTIRMA YAYINI", body: "Kaynaklı kampanya, listeleme ve koşul araştırması yayınlanır. Uygunluk, süre ve avantajları resmi hesapta doğrulayın.", subscribe: "Telegram kaynak araştırmasına abone ol ↗", index: "Resmi araştırma dizinini aç", indexHint: "Platforma göre kaynak, durum ve inceleme tarihini görün" },
    es: { badge: "BOLETÍN DE INVESTIGACIÓN CON FUENTES", body: "Publicamos investigación sobre campañas, listados y condiciones con fuentes. Verifica elegibilidad, fechas y beneficios en la cuenta oficial.", subscribe: "Suscribirse a la investigación en Telegram ↗", index: "Abrir índice de investigación oficial", indexHint: "Ver fuentes, estado y fecha de revisión por plataforma" },
    "pt-BR": { badge: "BOLETIM DE PESQUISA COM FONTES", body: "Publicamos pesquisas com fontes sobre campanhas, listagens e condições. Verifique elegibilidade, prazos e benefícios na conta oficial.", subscribe: "Assinar pesquisa no Telegram ↗", index: "Abrir índice oficial de pesquisa", indexHint: "Veja fonte, status e data de revisão por plataforma" },
    fr: { badge: "BRIEFING DE RECHERCHE SOURCÉ", body: "Nous publions des recherches sourcées sur les campagnes, listings et conditions. Vérifiez l’éligibilité, les dates et les avantages sur le compte officiel.", subscribe: "S’abonner à la recherche sur Telegram ↗", index: "Ouvrir l’index de recherche officiel", indexHint: "Voir la source, l’état et la date de revue par plateforme" },
    de: { badge: "QUELLENBASIERTES RESEARCH-BRIEFING", body: "Wir veröffentlichen quellenbasierte Recherchen zu Kampagnen, Listings und Bedingungen. Prüfen Sie Eignung, Fristen und Vorteile im offiziellen Konto.", subscribe: "Quellenforschung auf Telegram abonnieren ↗", index: "Offiziellen Research-Index öffnen", indexHint: "Quelle, Status und Prüfdatum je Plattform ansehen" },
    ru: { badge: "ИССЛЕДОВАТЕЛЬСКИЙ БЮЛЛЕТЕНЬ С ИСТОЧНИКАМИ", body: "Публикуем исследования кампаний, листингов и условий с источниками. Проверяйте доступность, сроки и преимущества в официальном аккаунте.", subscribe: "Подписаться на исследования в Telegram ↗", index: "Открыть официальный индекс исследований", indexHint: "Источник, статус и дата проверки по площадкам" },
    id: { badge: "RINGKASAN RISET BERBASIS SUMBER", body: "Kami menerbitkan riset kampanye, listing, dan ketentuan dengan sumber. Verifikasi kelayakan, waktu, dan manfaat di akun resmi.", subscribe: "Berlangganan riset di Telegram ↗", index: "Buka indeks riset resmi", indexHint: "Lihat sumber, status, dan tanggal tinjauan per platform" },
    vi: { badge: "BẢN TIN NGHIÊN CỨU CÓ NGUỒN", body: "Chúng tôi đăng nghiên cứu có nguồn về chiến dịch, niêm yết và điều kiện. Hãy xác minh tư cách, thời hạn và quyền lợi tại tài khoản chính thức.", subscribe: "Đăng ký nghiên cứu trên Telegram ↗", index: "Mở chỉ mục nghiên cứu chính thức", indexHint: "Xem nguồn, trạng thái và ngày rà soát theo nền tảng" },
    it: { badge: "BRIEFING DI RICERCA CON FONTI", body: "Pubblichiamo ricerche con fonti su campagne, listing e condizioni. Verifica idoneità, scadenze e vantaggi sull’account ufficiale.", subscribe: "Iscriviti alla ricerca su Telegram ↗", index: "Apri l’indice di ricerca ufficiale", indexHint: "Fonte, stato e data di revisione per piattaforma" },
    ar: { badge: "موجز بحثي موثق بالمصادر", body: "ننشر أبحاث الحملات والإدراجات والشروط مع مصادر. تحقق من الأهلية والمواعيد والمزايا في الحساب الرسمي.", subscribe: "اشترك في أبحاث Telegram ↗", index: "فتح فهرس البحث الرسمي", indexHint: "عرض المصدر والحالة وتاريخ المراجعة لكل منصة" },
    // l10n: needs native review
    ur: { badge: "سرکاری ذرائع کی تحقیقی خبریں", body: "ہم ذرائع کے ساتھ سرگرمیوں، لسٹنگز اور شرائط کی تحقیق شائع کرتے ہیں۔ اہلیت، اوقات اور فوائد کی تصدیق سرکاری اکاؤنٹ میں کریں۔", subscribe: "Telegram پر ذرائع پر مبنی تحقیق کی رکنیت لیں ↗", index: "سرکاری تحقیق کا اشاریہ کھولیں", indexHint: "ہر پلیٹ فارم کے ذرائع، حیثیت اور جائزے کی تاریخ دیکھیں" },
    // l10n: needs native review
    uk: { badge: "ОГЛЯД ДОСЛІДЖЕНЬ ОФІЦІЙНИХ ДЖЕРЕЛ", body: "Ми публікуємо дослідження кампаній, лістингів і умов із джерелами. Підтвердьте допуск, строки та переваги в офіційному акаунті.", subscribe: "Підписатися на дослідження джерел у Telegram ↗", index: "Відкрити індекс офіційних досліджень", indexHint: "Переглянути джерела, статус і дату перевірки за платформами" },

  }[locale] || null;
  const [filter, setFilter] = useState("all");
  const [showAllResearch, setShowAllResearch] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const toggleGroup = (slug) => setOpenGroups((current) => { const next = new Set(current); if (next.has(slug)) next.delete(slug); else next.add(slug); return next; });

  const contextualHref = (path) => addContext(path, { locale, market, product });

  const text = activityCenterCopy(locale);
  const rewardsText = campaignCopy(locale);
  const detailCopy = v3Copy(locale);
  const categories = categoryDefinitions(text);
  const venueBySlug = useMemo(() => new Map(venues.map((venue) => [venue.slug, venue])), [venues]);

  const deadlines = useMemo(() => [
    ...publicUpdates.flatMap((update) => [update.expiresAt]).filter(Boolean),
    ...OFFICIAL_EXCHANGE_ACTIVITIES.flatMap((update) => [update.expiresAt]).filter(Boolean),
    ...Object.values(officialCampaignResearchByVenue)
      .flatMap((research) => [research.signupReward?.startAt, research.signupReward?.endAt])
      .filter(Boolean),
  ], [locale, publicUpdates]);
  const now = useActivityNow(deadlines);

  const normalizedUpdates = useMemo(
    () => {
      const liveUpdates = visibleOfficialUpdates(publicUpdates, now);
      const finalUpdates = liveUpdates.length > 0 ? liveUpdates : visibleOfficialUpdates(OFFICIAL_EXCHANGE_ACTIVITIES, now);
      return finalUpdates.map((update) => normalizeUpdate(update, now));
    },
    [publicUpdates, now],
  );
  const publishableUpdates = useMemo(() => normalizedUpdates.filter((update) => update.publishable), [normalizedUpdates]);
  const researchItemList = useMemo(
    () => Object.values(officialCampaignResearchByVenue)
      .map((research) => {
        const view = researchView(research, locale, now);
        if (!view) return null;
        const platform = venueBySlug.get(research.venueSlug);
        const source = firstReadableSource(view);
        return {
          cardType: "research",
          id: research.venueSlug,
          platform: platform ?? { slug: research.venueSlug, name: research.venueSlug },
          detailHref: `/activities/research/${encodeURIComponent(research.venueSlug)}`,
          summary: view.summary,
          contentLocale: view.contentLocale || "en",
          reward: view.signupReward,
          state: researchCardState(view),
          checkedAt: view.checkedAt,
          sourceType: "officialResearch",
          sourceHost: source?.host ?? "—",
          url: source?.url ?? "",
          sources: view.sources,
        };
      })
      .filter(Boolean),
    [locale, market, product, now, venueBySlug],
  );
  // Keep the reviewed activity feed and the independent research index as two
  // distinct decision surfaces. Research cards already have their own
  // bounded section below; merging them here duplicated every venue and made
  // the mobile activity route unnecessarily long.
  const feedItemList = useMemo(() => publishableUpdates, [publishableUpdates]);
  const filteredUpdates = useMemo(
    () => (filter === "all" ? feedItemList : feedItemList.filter((update) => update.category === filter)),
    [feedItemList, filter],
  );
  const visibleResearchCards = showAllResearch ? researchItemList : researchItemList.slice(0, 6);
  // Reviewed feed grouped by exchange (owner 2026-10-10): every item stays in the HTML; items after the third in a
  // group are collapsed with CSS until "Show all (n)".
  const updateGroups = useMemo(() => {
    const groups = new Map();
    for (const update of filteredUpdates) {
      const slug = update.platform?.slug || "other";
      if (!groups.has(slug)) groups.set(slug, { slug, platform: update.platform, items: [] });
      groups.get(slug).items.push(update);
    }
    return [...groups.values()];
  }, [filteredUpdates]);

  const filterControls = (
    <div className="activity-center-v3__filters" role="group" aria-label={text.title}>
      {categories.map((category) => {
        const count = category.key === "all"
          ? feedItemList.length
          : feedItemList.filter((update) => update.category === category.key).length;
        // counts come from the same feed the rows render; an empty category is not offered as a filter
        if (category.key !== "all" && count === 0) return null;
        return <button
          key={category.key}
          type="button"
          aria-pressed={filter === category.key}
          className={filter === category.key ? "is-active" : ""}
          onClick={() => setFilter(category.key)}
        >
          <span>{category.label}</span>
          <b className="activity-center-v3__chip-count" translate="no" lang="en">{count}</b>
        </button>;
      })}
    </div>
  );

  return <section className="activity-center-v3" aria-labelledby="activity-center-v3-title">
    <div className="activity-center-v3__head">
      <div>
        <h1 id="activity-center-v3-title">{text.title}</h1>
        <span>{text.intro}</span>
      </div>

    </div>

    <LiveCampaigns locale={locale} market={market} initialFeed={campaignFeed} />

    {feedItemList.length > 0 && filterControls}

    {filteredUpdates.length ? <div className="activity-center-v3__groups" aria-labelledby="activity-reviewed-title">
      {updateGroups.map((group) => {
        const expanded = openGroups.has(group.slug) || group.items.length <= GROUP_PREVIEW_COUNT;
        const groupName = group.platform?.cnName && locale.startsWith("zh") ? `${group.platform.name} (${group.platform.cnName})` : (group.platform?.name ?? group.slug);
        const labels = showAllCopy(locale, group.items.length);
        return <section key={group.slug} className="activity-center-v3__group" data-activity-group={group.slug} data-expanded={expanded ? "true" : "false"}>
          <h2 className="activity-center-v3__group-head"><span className="activity-center-v3__research-identity" translate="no" lang="en" dir="ltr"><BrandMark slug={group.slug} compact /><b>{groupName}</b></span><b className="activity-center-v3__chip-count" translate="no" lang="en">{group.items.length}</b></h2>
          <div className="activity-center-v3__grid">
      {group.items.map((update, itemIndex) => {
        const titleStr = typeof update.title === "object" ? (update.title[locale] || update.title["zh-Hans"] || update.title.en) : update.title;
        const summaryStr = typeof update.summary === "object" ? (update.summary[locale] || update.summary["zh-Hans"] || update.summary.en) : update.summary;
        const pName = update.platform?.cnName && locale.startsWith("zh")
          ? `${update.platform.name} (${update.platform.cnName})`
          : (update.platform?.name ?? update.platform?.slug ?? "Platform");
        const researchHref = update.platform?.slug
          ? contextualHref(`/activities/research/${encodeURIComponent(update.platform.slug)}`)
          : contextualHref("/activities");
        const eligibility = normalizeActivityEligibility(update, { locale, now, researchHref });

        return <article key={update.id ?? update.slug ?? `${update.platform?.slug}-${titleStr}`} className="activity-card-v3" data-group-overflow={itemIndex >= GROUP_PREVIEW_COUNT ? "true" : undefined}>
        <div className="activity-card-v3__top">
          <div className="activity-center-v3__research-identity" translate="no" lang="en" dir="ltr">
            <BrandMark slug={update.platform?.slug} compact />
            <b>{pName}</b>
          </div>
          <span data-state={eligibility.status}>{eligibility.statusLabel}</span>
        </div>
        <h3>{titleStr}</h3>
        {summaryStr && <p>{update.cardType === "research" && update.contentLocale !== locale
          ? (rewardsText.intro || detailCopy.verifyBefore || text.pending)
          : summaryStr}</p>}
        <dl aria-label={eligibility.statusLabel}>
          {eligibility.rows.map((row) => <div key={row.key} data-missing={row.missing ? "true" : undefined}>
            <dt>{row.label}</dt>
            <dd translate={row.key === "officialSource" ? "no" : undefined} lang={row.key === "officialSource" ? "en" : undefined}>{row.value}</dd>
          </div>)}
          <div><dt>{text.reviewedAt}</dt><dd>{formatDate(locale, update.verifiedAt)}</dd></div>
        </dl>
        {!eligibility.cta.enabled && <small className="activity-card-v3__cta-note">{eligibility.cta.label}</small>}
        {update.cardType === "research" && update.contentLocale === locale && update.reward?.conditions?.length > 0 && <ul className="activity-card-v3__conditions">
          {update.reward.conditions.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
        </ul>}
        <div className="activity-center-v3__source-actions">
          {update.platform?.slug && <a href={contextualHref(`/exchanges/${encodeURIComponent(update.platform.slug)}`)} data-cta-kind="research" data-cta-platform={update.platform.slug} data-cta-placement="activity-card-venue-profile" data-growth-decision={update.platform.slug} data-growth-placement="activity-card-venue-profile">{detailCopy.openDetail}</a>}
          {eligibility.cta.enabled && update.id
            ? <a href={updateHref(update, locale, { market, product })} data-cta-kind="research" data-cta-placement="activity-card-detail" data-growth-decision={update.id} data-growth-placement="activity-card-detail">{detailCopy.openActivityDetail}</a>
            : update.platform?.slug && <a href={eligibility.cta.alternativeHref} data-cta-kind="research" data-cta-platform={update.platform.slug} data-cta-placement="activity-card-research-alternative" data-growth-decision={update.platform.slug} data-growth-placement="activity-card-research-alternative">{eligibility.cta.alternativeLabel}</a>}
          {eligibility.source?.url && <a href={updateHref(update, locale, { market, product })} data-cta-kind="research" data-cta-placement="activity-card-source" data-growth-decision={update.platform?.slug || update.id} data-growth-placement="activity-card-source">{campaignJoinCopy(locale).official}</a>}
        </div>
        <CampaignJoin venue={update.platform?.slug} locale={locale} market={market} placement="activity-card-join" />
      </article>;
      })}
          </div>
          {group.items.length > GROUP_PREVIEW_COUNT && <button type="button" className="activity-center-v3__group-toggle" aria-expanded={expanded} onClick={() => toggleGroup(group.slug)}>{expanded ? labels.fewer : labels.all}</button>}
        </section>;
      })}
    </div> : <div className={`activity-center-v3__empty${researchItemList.length ? " activity-center-v3__empty--actions" : ""}`} role={researchItemList.length ? undefined : "status"}>
      {/* "No verified recent activity" only when nothing below is populated; with research rows the two routes stay as plain actions */}
      {!researchItemList.length && <p><strong>{text.emptyTitle}</strong> <span>{text.emptyBody}</span></p>}
      <div className="activity-center-v3__empty-actions">
        <a href={contextualHref("/exchanges")} data-cta-kind="research" data-cta-placement="activity-footer-directory" data-growth-decision="directory" data-growth-placement="activity-footer-directory" data-growth-market={market} data-growth-product={product}>{text.browsePlatforms}</a>
        <a href={contextualHref("/compare/binance-vs-okx")} data-cta-kind="research" data-cta-placement="activity-footer-comparison" data-growth-decision="comparison" data-growth-placement="activity-footer-comparison" data-growth-market={market} data-growth-product={product}>{text.comparePlatforms}</a>
      </div>
    </div>}


    <section className="activity-center-v3__rewards activity-research-desk" aria-labelledby="activity-center-v3-rewards-title">
      <SectionRule stamp={researchItemList.length || null} />
      <div className="activity-center-v3__sources-head activity-research-desk__heading">
        <div>
          <h2 id="activity-center-v3-rewards-title">{rewardsText.reward}</h2>
          <p>{rewardsText.intro}</p>
        </div>
        {researchItemList.length > 3 && <button type="button" aria-expanded={showAllResearch} onClick={() => setShowAllResearch((value) => !value)}>{showAllResearch ? rewardsText.showFewer : rewardsText.showAll}</button>}
      </div>
    <details className="activity-center-v3__index-drawer">
      <summary>
        <strong>{activityLocaleUi?.index || (locale === "zh-Hant" || locale === "zh-TW" ? "展開完整官方研究索引" : locale.startsWith("zh") ? "展开完整官方研究索引" : "Open the full official research index")}</strong>
        <span>{activityLocaleUi?.indexHint || (locale.startsWith("zh") ? "按平台查看来源、状态和复核日期" : "Browse source, status and review date by venue")}</span>
        <b aria-hidden="true">＋</b>
      </summary>
      <OfficialResearchIndex locale={locale} market={market} product={product} venues={venues} embedded />
    </details>
      <div className={`activity-center-v3__reward-grid${showAllResearch ? "" : " activity-center-v3__reward-grid--collapsed"}`}>
        {visibleResearchCards.map((record, index) => <article key={record.platform.slug} data-lead={index === 0 ? "" : undefined}>
          <div className="activity-center-v3__research-identity" translate="no" lang="en" dir="ltr">
            <BrandMark slug={record.platform.slug} compact />
            <b>{record.platform.name}</b>
            <small>{venueBySlug.get(record.platform.slug)?.category}</small>
          </div>
          <div className="activity-center-v3__research-body">
          {/* the status is said once per run of identical states (the next row with the same state stays quiet); the check date is per row */}
          <p className="activity-center-v3__research-status">{(index === 0 || visibleResearchCards[index - 1].state !== record.state) && <span data-state={record.state}>{cardStateLabel(text, rewardsText, record.state)}</span>}{isoDay(record.checkedAt) && <time className="activity-center-v3__research-checked" dateTime={isoDay(record.checkedAt)}>{rewardsText.checked} {isoDay(record.checkedAt)}</time>}</p>
          <p className="activity-center-v3__research-summary">{record.reward.summary || record.summary}</p>
          {(record.reward.conditions?.length ?? 0) > 0 && <details className="activity-center-v3__conditions-disclosure">
            <summary>{rewardsText.conditions}</summary>
            <ul className="activity-card-v3__conditions">
              {record.reward.conditions.slice(0, 3).map((condition) => <li key={condition}>{condition}</li>)}
            </ul>
          </details>}
          <div className="activity-center-v3__source-actions">
            <a href={contextualHref(`/exchanges/${encodeURIComponent(record.platform.slug)}`)} data-cta-kind="research" data-cta-platform={record.platform.slug} data-cta-placement="activity-reward-venue-profile" data-growth-decision={record.platform.slug} data-growth-placement="activity-reward-venue-profile">{detailCopy.openDetail}</a>
            <a href={contextualHref(record.detailHref)} data-cta-kind="research" data-cta-platform={record.platform.slug} data-cta-placement="activity-reward-research" data-growth-decision={record.platform.slug} data-growth-placement="activity-reward-research">{rewardsText.openResearch}</a>
            {firstReadableSource(record) && <a href={firstReadableSource(record).url} target="_blank" rel="noopener noreferrer">{r9Text(locale).page} ↗</a>}
          </div>
          </div>
        </article>)}
      </div>
    </section>

    <details className="activity-center-v3__support-details">
      <summary>{activitySupportSummary[locale] || activitySupportSummary.en}</summary>
      <div className="activity-center-v3__support-body">
      <aside className="activity-center-v3__gate" role="note">
        <b>{text.qualification}</b>
        <ul>{text.criteria.map((item) => <li key={item}>{item}</li>)}</ul>
        <span>{text.notExchange}</span>
      </aside>
    <DecisionPathRail locale={locale} market={market} product={product} current="activities" />


    {/* Telegram 官方快讯订阅直达条 */}
    <aside className="activity-center-v3__tg-banner">
      <div className="activity-center-v3__tg-banner-left">
        <span className="activity-center-v3__tg-badge"> {activityLocaleUi?.badge || (locale.startsWith("zh") ? "官方来源研究广播" : "SOURCE-REVIEWED BROADCAST")}</span>
        <p>{activityLocaleUi?.body || (locale.startsWith("zh") ? "频道发布带来源的活动、上币与条件研究；资格、时效和具体权益需在官方账户逐项核对。" : "The channel publishes sourced campaign and listing research; verify eligibility, timing, and benefits in the official account.")}</p>
      </div>
      <a href={TELEGRAM_CONFIG.channelUrl} target="_blank" rel="noopener noreferrer" className="activity-center-v3__tg-btn" data-cta-kind="telegram" data-cta-placement="activity-channel-banner" data-growth-decision="telegram_channel" data-growth-placement="activity-channel-banner">
        {activityLocaleUi?.subscribe || (locale.startsWith("zh") ? "在 Telegram 频道订阅来源研究 ↗" : "Subscribe to Telegram source-reviewed research ↗")}
      </a>
    </aside>

      </div>
    </details>
  </section>;
}

export default ActivityCenterV3;
