import { useEffect, useState } from 'react';
import { FACTS_AS_OF } from '../../data/exchange-facts.js';
import { buildScorecard, countryRankings } from '../../data/exchange-scorecards.js';
import { localizedHref } from '../../data/locale-routing.js';
import { SourceLink } from '../shared/SourceLink.jsx';
import './scorecards.css';
import { localizedScorecardRow, localizedScorecardRule, localizedScorecardValue, scorecardCaption, sourceLabel } from './scorecard-copy.js';

// Keep SSR and the first browser render stable; refresh time-sensitive offers after mount.
function useScorecardNow() {
  const [now, setNow] = useState(null);
  useEffect(() => { setNow(Date.now()); }, []);
  return now;
}
const COPY = {
  'zh-Hans': ['逐项对比', '维度', '领先', '并列', '', '截至', '适合场景', '交易所比较', '用途', '领先平台', '规则'],
  'zh-Hant': ['數據比較評分卡', '維度', '領先', '並列', '', '截至', '適合場景', '交易所比較', '用途', '領先平台', '規則'],
  ar: ['بطاقة مقارنة البيانات', 'المعيار', 'المتقدم', 'تعادل', '', 'بتاريخ', 'الأنسب حسب الاستخدام', 'مقارنة المنصات في', 'الاستخدام', 'المنصات المتقدمة', 'القاعدة'],
  en: ['Line by line', 'Dimension', 'Winner', 'Tie', 'Not available', 'As of', 'Best for', 'Best exchange for', 'Use case', 'Leaders', 'Rule'],
  tr: ['Veriye dayalı karşılaştırma', 'Ölçüt', 'Önde', 'Eşit', 'Veri yok', 'Veri tarihi', 'En uygun kullanım', 'En iyi borsa:', 'Kullanım amacı', 'Önde gelenler', 'Kural'],
  vi: ['So sánh dựa trên dữ liệu', 'Tiêu chí', 'Dẫn đầu', 'Bằng nhau', 'Chưa có dữ liệu', 'Dữ liệu ngày', 'Phù hợp nhất cho', 'Sàn tốt nhất cho', 'Mục đích', 'Dẫn đầu', 'Quy tắc'],
  id: ['Perbandingan berbasis data', 'Kriteria', 'Unggul', 'Seri', 'Data tidak tersedia', 'Data per', 'Terbaik untuk', 'Bursa terbaik untuk', 'Kebutuhan', 'Pemimpin', 'Aturan'],
  'pt-BR': ['Comparação com dados', 'Critério', 'Líder', 'Empate', 'Não disponível', 'Dados de', 'Melhor para', 'Melhor exchange para', 'Uso', 'Líderes', 'Regra'],
  es: ['Comparación con datos', 'Criterio', 'Líder', 'Empate', 'No disponible', 'Datos al', 'Mejor para', 'Mejor exchange para', 'Uso', 'Líderes', 'Regla'],
};
function ui(locale) { return COPY[locale] || COPY.en; }
const SCROLL_HINT = {
  en: 'Scroll horizontally to compare all exchanges',
  'zh-Hans': '左右滑动，查看所有交易所',
  'zh-Hant': '左右滑動，查看所有交易所',
  tr: 'Tüm borsaları karşılaştırmak için yana kaydırın',
  vi: 'Cuộn ngang để so sánh tất cả sàn giao dịch',
  id: 'Geser ke samping untuk membandingkan semua bursa',
  'pt-BR': 'Role na horizontal para comparar todas as exchanges',
  es: 'Desplázate horizontalmente para comparar todos los exchanges',
  fr: 'Faites défiler horizontalement pour comparer les plateformes',
  de: 'Horizontal scrollen, um alle Börsen zu vergleichen',
  ja: '横にスクロールしてすべての取引所を比較',
  ko: '가로로 스크롤하여 모든 거래소 비교',
  ar: 'مرّر أفقياً لمقارنة جميع المنصات',
  ru: 'Прокрутите по горизонтали, чтобы сравнить все биржи',
  it: 'Scorri orizzontalmente per confrontare tutti gli exchange',
  ur: 'تمام ایکسچینجز کا موازنہ کرنے کے لیے افقی اسکرول کریں',
  uk: 'Прокрутіть горизонтально, щоб порівняти всі біржі',
};
function asOf(value) {
  if (!value) return 'Date not recorded';
  if (value.includes('SGT')) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value} SGT`;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? `${new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ')} SGT` : value;
}
function schema(items, locale, name) {
  return { '@context': 'https://schema.org', '@type': 'ItemList', name, itemListOrder: 'https://schema.org/ItemListUnordered', itemListElement: items.map((v, i) => ({ '@type': 'ListItem', position: i + 1, name: v.name, url: `https://nexualpha.com${localizedHref(`/exchanges/${v.slug}`, { locale })}` })) };
}
function JsonLd({ value }) { return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(value).replace(/</g, '\\u003c') }} />; }
function Leaders({ winners, venues, empty }) { return winners.length ? winners.map((slug) => venues.find((v) => v.slug === slug)?.name || slug).join(' / ') : empty; }

export function ExchangeScorecard({ selected, locale = 'en', market }) {
  const now = useScorecardNow();
  const card = buildScorecard(selected, { locale, market, now: now ?? `${FACTS_AS_OF}T00:00:00+08:00` });
  const t = ui(locale);
  if (card.venues.length < 2) return null;
  return <section className="v2-section v2-shell exchange-scorecard" id="exchange-scorecard" aria-labelledby="exchange-scorecard-heading" lang={COPY[locale] ? locale : 'en'}>
    <h2 id="exchange-scorecard-heading">{t[0]}</h2>
    <p className="exchange-scorecard__scroll-hint" lang={SCROLL_HINT[locale] ? locale : 'en'}>{SCROLL_HINT[locale] || SCROLL_HINT.en} <span aria-hidden="true">↔</span></p>
    <div className="exchange-scorecard__scroll" tabIndex={0} role="region" aria-label={t[0]}>
      <table><caption>{scorecardCaption(locale)}</caption>
        <thead><tr><th scope="col">{t[1]}</th>{card.venues.map((v) => <th scope="col" key={v.slug}><a href={localizedHref(`/exchanges/${v.slug}`, { locale })}>{v.name}</a></th>)}</tr></thead>
        <tbody>{card.rows.filter((row) => now != null || row.key !== "currentPromotion").map((row) => <tr key={row.key}><th scope="row">{localizedScorecardRow(row.key, locale, row.label)}<span className="exchange-scorecard__date">{localizedScorecardRule(row.key, locale, row.rule)}</span></th>{row.values.map((cell, i) => <td key={card.venues[i].slug}>
          <span>{cell.value != null ? localizedScorecardValue(cell.display, locale) : null}</span>
          {row.winners.includes(card.venues[i].slug) && <span className="exchange-scorecard__badge">{row.winners.length > 1 ? t[3] : t[2]}</span>}
          {cell.value != null && cell.asOf && <span className="exchange-scorecard__date">{t[5]} {asOf(cell.asOf)}</span>}
          {cell.sources?.length > 0 && <span className="exchange-scorecard__sources">{cell.sources.map((url, n) => <SourceLink key={url} locale={locale} href={url}>{sourceLabel(locale)} {n + 1}</SourceLink>)}</span>}
        </td>)}</tr>)}</tbody>
      </table>
    </div>
    <h3>{t[6]}</h3>
    <dl className="exchange-scorecard__verdicts">{card.verdicts.filter((v) => v.winners.length).map((v) => <div key={v.key}><dt>{localizedScorecardRow(v.key, locale, v.label)}</dt><dd><Leaders winners={v.winners} venues={card.venues} empty={t[4]} /><p>{localizedScorecardRule(v.key, locale, v.rule)}</p></dd></div>)}</dl>
    <JsonLd value={schema(card.venues, locale, card.venues.map((v) => v.name).join(' vs '))} />
  </section>;
}

function CountryRankingTable({ market, locale }) {
  const metrics = ['spotFees', 'perpFees', 'top200Coins', 'localFiatRails'].map((key) => market.rows.find((row) => row.key === key)).filter(Boolean);
  const spotFees = market.rows.find((row) => row.key === "spotFees");
  const fee = (slug) => spotFees?.values.find((cell) => cell.slug === slug);
  const ordered = [...market.venues].sort((a, b) => {
    const x = fee(a.slug), y = fee(b.slug);
    return (x?.taker ?? Infinity) - (y?.taker ?? Infinity) || (x?.maker ?? Infinity) - (y?.maker ?? Infinity) || a.slug.localeCompare(b.slug);
  });
  let rank = 0;
  let previous;
  return <div className="exchange-scorecard__scroll" tabIndex={0} role="region" aria-label={`Fee ranking for ${market.name}`} lang="en">
    <table><caption>Fees are maker / taker, in percent. Rank uses spot taker fee, then maker fee. Equal fee pairs share a rank. Unchecked fees remain unranked.</caption>
      <thead><tr><th scope="col">Rank</th><th scope="col">Exchange</th>{metrics.map((row) => <th scope="col" key={row.key}>{row.label}</th>)}</tr></thead>
      <tbody>{ordered.map((venue, index) => {
        const cell = fee(venue.slug);
        const valid = Number.isFinite(cell?.taker) && Number.isFinite(cell?.maker);
        const signature = valid ? `${cell.taker}/${cell.maker}` : null;
        if (valid && signature !== previous) rank = index + 1;
        previous = signature;
        return <tr key={venue.slug}><td>{valid ? rank : 'Unranked'}</td><th scope="row"><a href={localizedHref(`/exchanges/${venue.slug}`, { locale })}>{venue.name}</a></th>
          {metrics.map((row) => { const value = row.values.find((v) => v.slug === venue.slug); return <td key={row.key}>{value?.value != null ? localizedScorecardValue(value.display, locale) : null}{value?.value != null && value.asOf && <span className="exchange-scorecard__date">{ui(locale)[5]} {asOf(value.asOf)}</span>}</td>; })}
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

export function CountryScorecards({ locale = 'en' }) {
  const now = useScorecardNow();
  const markets = countryRankings({ locale, now: now ?? `${FACTS_AS_OF}T00:00:00+08:00` });
  const t = ui(locale);
  return <section className="v2-section v2-shell exchange-scorecard" id="country-scorecards" lang={COPY[locale] ? locale : 'en'}>
    {markets.map((market) => <section key={market.key} aria-labelledby={`scorecard-${market.key}`}>
      <h2 id={`scorecard-${market.key}`}>{t[7]} <span lang="en">{market.name}</span></h2>
      <CountryRankingTable market={market} locale={locale} />
      <div className="exchange-scorecard__scroll" tabIndex={0} role="region" aria-label={`${t[7]} ${market.name}`}>
        <table><caption lang="en">Ranked within the documented comparison universe, after geographic promotion exclusions.</caption><thead><tr><th scope="col">{t[8]}</th><th scope="col">{t[9]}</th><th scope="col">{t[10]}</th></tr></thead>
          <tbody>{market.verdicts.map((v) => <tr key={v.key}><th scope="row" lang="en">{v.label}</th><td>{v.winners.length ? v.winners.map((slug, i) => <span key={slug}>{i > 0 && ' / '}<a href={localizedHref(`/exchanges/${slug}`, { locale })}>{market.venues.find((venue) => venue.slug === slug)?.name || slug}</a></span>) : t[4]}</td><td lang="en">{v.rule}</td></tr>)}</tbody>
        </table>
      </div>
      <JsonLd value={schema(market.venues.filter((v) => market.verdicts.some((rule) => rule.winners.includes(v.slug))), locale, `Best exchange for ${market.name}`)} />
    </section>)}
  </section>;
}
