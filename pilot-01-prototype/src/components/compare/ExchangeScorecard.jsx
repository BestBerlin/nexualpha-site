import { buildScorecard, countryRankings } from '../../data/exchange-scorecards.js';
import { localizedHref } from '../../data/locale-routing.js';
import './scorecards.css';

// Untranslated explanatory rules carry an explicit language for assistive technology.
const COPY = {
  en: ['Data-backed scorecard', 'Dimension', 'Winner', 'Tie', 'Not available', 'As of', 'Best for', 'Best exchange for', 'Use case', 'Leaders', 'Rule'],
  tr: ['Veriye dayalı karşılaştırma', 'Ölçüt', 'Önde', 'Eşit', 'Veri yok', 'Veri tarihi', 'En uygun kullanım', 'En iyi borsa:', 'Kullanım amacı', 'Önde gelenler', 'Kural'],
  vi: ['So sánh dựa trên dữ liệu', 'Tiêu chí', 'Dẫn đầu', 'Bằng nhau', 'Chưa có dữ liệu', 'Dữ liệu ngày', 'Phù hợp nhất cho', 'Sàn tốt nhất cho', 'Mục đích', 'Dẫn đầu', 'Quy tắc'],
  id: ['Perbandingan berbasis data', 'Kriteria', 'Unggul', 'Seri', 'Data tidak tersedia', 'Data per', 'Terbaik untuk', 'Bursa terbaik untuk', 'Kebutuhan', 'Pemimpin', 'Aturan'],
  'pt-BR': ['Comparação com dados', 'Critério', 'Líder', 'Empate', 'Não disponível', 'Dados de', 'Melhor para', 'Melhor exchange para', 'Uso', 'Líderes', 'Regra'],
  es: ['Comparación con datos', 'Criterio', 'Líder', 'Empate', 'No disponible', 'Datos al', 'Mejor para', 'Mejor exchange para', 'Uso', 'Líderes', 'Regla'],
};
function ui(locale) { return COPY[locale] || COPY.en; }
function asOf(value) {
  if (!value) return 'Date not recorded';
  if (value.includes('SGT')) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value} SGT`;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? `${new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', dateStyle: 'medium', timeStyle: 'short' }).format(date)} SGT` : value;
}
function schema(items, locale, name) {
  return { '@context': 'https://schema.org', '@type': 'ItemList', name, itemListOrder: 'https://schema.org/ItemListUnordered', itemListElement: items.map((v, i) => ({ '@type': 'ListItem', position: i + 1, name: v.name, url: `https://nexualpha.com${localizedHref(`/exchanges/${v.slug}`, { locale })}` })) };
}
function JsonLd({ value }) { return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(value).replace(/</g, '\\u003c') }} />; }
function Leaders({ winners, venues, empty }) { return winners.length ? winners.map((slug) => venues.find((v) => v.slug === slug)?.name || slug).join(' / ') : empty; }

export function ExchangeScorecard({ selected, locale = 'en', market }) {
  const card = buildScorecard(selected, { locale, market });
  const t = ui(locale);
  if (card.venues.length < 2) return null;
  return <section className="v2-section v2-shell exchange-scorecard" id="exchange-scorecard" aria-labelledby="exchange-scorecard-heading" lang={COPY[locale] ? locale : 'en'}>
    <h2 id="exchange-scorecard-heading">{t[0]}</h2>
    <div className="exchange-scorecard__scroll" tabIndex={0} role="region" aria-label={t[0]}>
      <table><caption lang="en">Published data only. Fees are maker / taker, in percent. Missing data cannot win; equal values share the lead.</caption>
        <thead><tr><th scope="col">{t[1]}</th>{card.venues.map((v) => <th scope="col" key={v.slug}><a href={localizedHref(`/exchanges/${v.slug}`, { locale })}>{v.name}</a></th>)}</tr></thead>
        <tbody>{card.rows.map((row) => <tr key={row.key}><th scope="row" lang="en">{row.label}<span className="exchange-scorecard__date">{row.rule}</span></th>{row.values.map((cell, i) => <td key={card.venues[i].slug}>
          <span lang="en">{cell.display || t[4]}</span>
          {row.winners.includes(card.venues[i].slug) && <span className="exchange-scorecard__badge">{row.winners.length > 1 ? t[3] : t[2]}</span>}
          <span className="exchange-scorecard__date" lang="en">{cell.asOf ? `${t[5]} ${asOf(cell.asOf)}` : 'Date not recorded'}</span>
          {cell.sources?.length > 0 && <span className="exchange-scorecard__sources">{cell.sources.map((url, n) => <a key={url} href={url} lang="en">Source {n + 1}</a>)}</span>}
        </td>)}</tr>)}</tbody>
      </table>
    </div>
    <h3>{t[6]}</h3>
    <dl className="exchange-scorecard__verdicts">{card.verdicts.map((v) => <div key={v.key}><dt lang="en">{v.label}</dt><dd><Leaders winners={v.winners} venues={card.venues} empty={t[4]} /><p lang="en">{v.rule}</p></dd></div>)}</dl>
    <JsonLd value={schema(card.venues, locale, card.venues.map((v) => v.name).join(' vs '))} />
  </section>;
}

function CountryRankingTable({ market, locale }) {
  const metrics = ['spotFees', 'perpFees', 'top200Coins', 'localFiatRails'].map((key) => market.rows.find((row) => row.key === key));
  const fee = (slug) => metrics[0]?.values.find((cell) => cell.slug === slug);
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
          {metrics.map((row) => { const value = row.values.find((v) => v.slug === venue.slug); return <td key={row.key}>{value?.display || 'Not available'}<span className="exchange-scorecard__date">{value?.asOf ? `As of ${asOf(value.asOf)}` : 'Date not recorded'}</span></td>; })}
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

export function CountryScorecards({ locale = 'en' }) {
  const markets = countryRankings({ locale });
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
