import { formatPercent } from "../../data/format-percent.js";
import { localizedHref } from "../../data/locale-routing.js";
import { BrandMark } from "../brand/BrandMark.jsx";

const PRIMARY_DEFAULT = Object.freeze(["bitget", "okx", "binance"]);
const PRIMARY_TR = Object.freeze(["okx", "binance", "bybit"]);

const LABELS = Object.freeze({
  en: ["More exchanges", "Open more exchange choices", "View details"],
  "zh-Hans": ["更多交易所", "打开更多交易所选择", "查看详情"],
  "zh-Hant": ["更多交易所", "開啟更多交易所選擇", "查看詳情"],
  es: ["Más plataformas", "Abrir más plataformas", "Ver detalles"],
  "pt-BR": ["Mais corretoras", "Abrir mais corretoras", "Ver detalhes"],
  fr: ["Plus de plateformes", "Ouvrir plus de plateformes", "Voir détails"],
  de: ["Weitere Börsen", "Weitere Börsen öffnen", "Details"],
  it: ["Altre piattaforme", "Apri altre piattaforme", "Dettagli"],
  ja: ["その他の取引所", "その他の取引所を開く", "詳細を見る"],
  ko: ["더 많은 거래소", "더 많은 거래소 열기", "자세히 보기"],
  tr: ["Daha fazla borsa", "Daha fazla borsa seçeneğini aç", "Detaylar"],
  ru: ["Еще биржи", "Открыть другие биржи", "Подробнее"],
  ar: ["منصات أخرى", "فتح خيارات منصات أخرى", "التفاصيل"],
  id: ["Bursa lain", "Buka pilihan bursa lain", "Detail"],
  vi: ["Sàn khác", "Mở thêm lựa chọn sàn", "Chi tiết"],
  ur: ["مزید ایکسچینجز", "مزید ایکسچینج انتخاب کھولیں", "تفصیل"],
  uk: ["Інші біржі", "Відкрити інші біржі", "Деталі"],
});

const copyFor = (locale) => {
  const raw = String(locale || "en");
  return LABELS[raw] || LABELS[raw.split("-")[0]] || LABELS.en;
};

function ShareLabel({ venue, t, locale }) {
  if (!venue.share) return null;
  return <b>{t.upTo} {formatPercent(locale, Math.round(venue.share * 100))}</b>;
}

function TabButton({ venue, selectedSlug, topShare, onPick, t, locale, buttonRef }) {
  const selected = venue.slug === selectedSlug;
  return (
    <button
      className="h7-owner-tabs__tab"
      ref={buttonRef}
      type="button"
      data-brand={venue.slug}
      aria-pressed={selected}
      onClick={() => onPick(venue.slug)}
    >
      <BrandMark slug={venue.slug} compact />
      <span>{venue.name}</span>
      <ShareLabel venue={venue} t={t} locale={locale} />
      {venue.share === topShare ? <i>{t.lgTop}</i> : null}
    </button>
  );
}

function DetailLink({ venue, locale, t }) {
  return (
    <a className="h7-owner-tabs__tab h7-owner-tabs__link" href={localizedHref(`/exchanges/${venue.slug}`, { locale })} data-brand={venue.slug}>
      <BrandMark slug={venue.slug} compact />
      <span>{venue.name}</span>
      <ShareLabel venue={venue} locale={locale} t={t} />
    </a>
  );
}

export function HeroExchangeSelector({ locale, market, venues, rebated, selectedSlug, topShare, onPick, t, pillRefs }) {
  const [more, moreAria] = copyFor(locale);
  const selectableBySlug = new Map(rebated.map((venue) => [venue.slug, venue]));
  const venueBySlug = new Map(venues.map((venue) => [venue.slug, venue]));
  const primaryOrder = market === "TR" || /^tr(?:-|$)/i.test(String(locale || "")) ? PRIMARY_TR : PRIMARY_DEFAULT;
  const primary = primaryOrder.map((slug) => selectableBySlug.get(slug) || venueBySlug.get(slug)).filter(Boolean);
  const primarySlugs = new Set(primary.map((venue) => venue.slug));
  const overflow = venues.filter((venue) => !primarySlugs.has(venue.slug));
  const gridCount = primary.length + (overflow.length ? 1 : 0);

  return (
    <div className="h7-lg-tabs h7-owner-tabs" data-has-more={overflow.length ? "true" : undefined} role="group" aria-label={t.lgPick} style={{ "--n": gridCount }}>
      {primary.map((venue, index) => selectableBySlug.has(venue.slug) ? (
          <TabButton
            key={venue.slug}
            venue={selectableBySlug.get(venue.slug)}
            selectedSlug={selectedSlug}
            topShare={topShare}
            onPick={onPick}
            t={t}
            locale={locale}
            buttonRef={(node) => { pillRefs.current[index] = node; }}
          />
        ) : <DetailLink key={venue.slug} venue={venue} locale={locale} t={t} />
      )}
      {overflow.length ? (
        <details className="h7-owner-tabs__more">
          <summary aria-label={moreAria}>
            <span>{more}</span>
            <span aria-hidden="true">▾</span>
          </summary>
          <div className="h7-owner-tabs__menu" role="menu" aria-label={more}>
            {overflow.map((venue) => (
              selectableBySlug.has(venue.slug)
                ? <button
                    key={venue.slug}
                    type="button"
                    role="menuitemradio"
                    aria-checked={venue.slug === selectedSlug}
                    data-brand={venue.slug}
                    onClick={(event) => {
                      onPick(venue.slug);
                      event.currentTarget.closest("details")?.removeAttribute("open");
                    }}
                  >
                    <BrandMark slug={venue.slug} compact />
                    <span>{venue.name}</span>
                    <ShareLabel venue={selectableBySlug.get(venue.slug)} t={t} locale={locale} />
                  </button>
                : <a key={venue.slug} role="menuitem" href={localizedHref(`/exchanges/${venue.slug}`, { locale })} data-brand={venue.slug}>
                    <BrandMark slug={venue.slug} compact />
                    <span>{venue.name}</span>
                    <ShareLabel venue={venue} locale={locale} t={t} />
                  </a>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
