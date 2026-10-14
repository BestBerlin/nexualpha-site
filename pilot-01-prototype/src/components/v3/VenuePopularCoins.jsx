import { POPULAR_COINS_BY_VENUE } from "../../data/coins-venue-links.generated.js";
import { LocalLink } from "./v3-pages-shared.jsx";
import "./venue-popular-coins.css";

const VENUE_COINS_COPY = {
  en: { title: "Popular coins on {venue}", all: "All coins" },
  "zh-Hans": { title: "{venue} 上的热门币种", all: "全部币种" },
  "zh-Hant": { title: "{venue} 上的熱門幣種", all: "全部幣種" },
  es: { title: "Monedas populares en {venue}", all: "Todas las monedas" },
  "pt-BR": { title: "Moedas populares na {venue}", all: "Todas as moedas" },
  fr: { title: "Cryptos populaires sur {venue}", all: "Toutes les cryptos" },
  de: { title: "Beliebte Coins auf {venue}", all: "Alle Coins" },
  ja: { title: "{venue}で人気の銘柄", all: "すべての銘柄" },
  ko: { title: "{venue} 인기 코인", all: "전체 코인" },
  tr: { title: "{venue} üzerindeki popüler coinler", all: "Tüm coinler" },
  vi: { title: "Coin phổ biến trên {venue}", all: "Tất cả coin" },
  id: { title: "Koin populer di {venue}", all: "Semua koin" },
  ru: { title: "Популярные монеты на {venue}", all: "Все монеты" },
  ar: { title: "عملات شائعة على {venue}", all: "كل العملات" },
  it: { title: "Monete popolari su {venue}", all: "Tutte le monete" },
  ur: { title: "{venue} پر مقبول کوائنز", all: "تمام کوائنز" },
  uk: { title: "Популярні монети на {venue}", all: "Усі монети" },
};

export function VenuePopularCoins({ slug, name, locale }) {
  const coins = POPULAR_COINS_BY_VENUE[slug] || [];
  if (!coins.length) return null;
  const copy = VENUE_COINS_COPY[locale] || VENUE_COINS_COPY.en;
  return (
    <section className="v2-section v3-venue-coins" aria-labelledby={`coins-${slug}`}>
      <div className="section-lead"><h2 id={`coins-${slug}`}>{copy.title.replace("{venue}", name)}</h2></div>
      <ul className="v3-venue-coins__list">
        {coins.map(([coin, coinName, symbol]) => <li key={coin}><LocalLink locale={locale} href={`/coins/${coin}`}><b>{coinName}</b><span translate="no">{symbol}</span></LocalLink></li>)}
      </ul>
      <p className="v3-venue-coins__all"><LocalLink locale={locale} href="/coins">{copy.all} →</LocalLink></p>
    </section>
  );
}
