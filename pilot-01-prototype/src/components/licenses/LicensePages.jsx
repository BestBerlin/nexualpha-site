import React, { useState } from 'react';
import { LICENSE_COUNTRIES, LICENSE_INDEX_LOCALES, licenseRecords, licenseCopy, licenseTitle, licenseAnswer, licensePath, venueDisplayName } from '../../data/licenses.js';
import { licenseSignup } from '../../data/licenses-cta.js';
import { localizedHref } from '../../data/locale-routing.js';
import './licenses.css';

const countryName = (country, locale) => new Intl.DisplayNames([locale], { type: 'region' }).of(country.code) || country.name;
const link = (path, locale) => localizedHref(path, { locale });
export function LicenseTable({ records, locale, market }) {
  const t = licenseCopy(locale);
  const rows = records.map(record => ({
    record,
    key: `${record.exchange}-${record.country}-${record.entityName}`,
    country: LICENSE_COUNTRIES.find(item => item.code === record.country),
    signup: licenseSignup(record, { locale, market }),
    name: venueDisplayName(record.exchange),
    status: t.statuses?.[record.status] || record.status,
  }));
  const exchangeLink = ({ record, name }) => <a href={link(`/exchanges/${record.exchange}`, locale)}>{name}</a>;
  const signupLink = ({ record, signup }) => signup && <a className="nx-license-cta" href={signup} data-cta-kind="registration" data-cta-platform={record.exchange} data-cta-placement="license-directory" rel="sponsored nofollow">{t.open}</a>;
  const countryLink = ({ country }) => country && <a href={link(licensePath(country.slug), locale)}>{countryName(country, locale)}</a>;
  return <div className="nx-license-table"><table><thead><tr>{[t.exchange, t.country, t.entity, t.regulator, t.type, t.status, t.source, t.lastChecked].map((label, i) => <th key={i} scope="col">{label}</th>)}</tr></thead><tbody>
    {rows.map(item => {
      const { record } = item;
      return <tr key={item.key}><th scope="row">{exchangeLink(item)}{signupLink(item)}</th>
        <td>{countryLink(item)}</td><td><bdi>{record.entityName}</bdi></td><td>{record.regulator}</td><td>{record.type}{record.number && <><br /><bdi>{record.number}</bdi></>}</td><td>{item.status}</td><td><a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">{t.source}</a></td><td><time dateTime={record.lastChecked}>{record.lastChecked}</time></td></tr>;
    })}
  </tbody></table>
  <ul className="nx-license-cards" aria-label={t.title}>
    {rows.map(item => {
      const { record } = item;
      return <li key={item.key} className={`nx-license-card nx-license-card--${record.status.replace(/\s+/g, '-')}`}>
        <div className="nx-license-card__head"><strong>{exchangeLink(item)}</strong><span className="nx-license-card__status">{item.status}</span></div>
        <dl>
          <div><dt>{t.country}</dt><dd>{countryLink(item)} · {record.regulator}</dd></div>
          <div><dt>{t.entity}</dt><dd><bdi>{record.entityName}</bdi></dd></div>
          <div><dt>{t.type}</dt><dd>{record.type}{record.number && <><br /><bdi>{record.number}</bdi></>}</dd></div>
        </dl>
        <div className="nx-license-card__foot"><a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">{t.source} ↗</a><time dateTime={record.lastChecked}>{record.lastChecked}</time>{signupLink(item)}</div>
      </li>;
    })}
  </ul>{!records.length && <p role="status">{t.empty}</p>}</div>;
}
export function LicenseDirectoryPage({ locale = 'en', country: slug, market }) {
  const t = licenseCopy(locale);
  const country = LICENSE_COUNTRIES.find(item => item.slug === slug);
  const [exchange, setExchange] = useState('');
  const [selectedCountry, setCountry] = useState('');
  const [status, setStatus] = useState('');
  if (slug && !country) return <main className="v2-shell nx-licenses"><h1>404</h1><a href={link('/licenses', locale)}>{t.title}</a></main>;
  const base = country ? licenseRecords.filter(record => record.country === country.code) : licenseRecords;
  const records = base.filter(record => (!exchange || record.exchange === exchange) && (!selectedCountry || record.country === selectedCountry) && (!status || record.status === status));
  return <main className="v2-shell nx-licenses" lang={LICENSE_INDEX_LOCALES.includes(locale) ? locale : "en"} dir={['ar', 'ur'].includes(locale) ? 'rtl' : 'ltr'}><header><a href={link('/licenses', locale)}>{t.title}</a><h1>{licenseTitle(slug, locale)}</h1><p>{licenseAnswer(slug, locale)}</p></header>
    <form className="nx-license-filters" onSubmit={event => event.preventDefault()}>
      <label>{t.exchange}<select value={exchange} onChange={event => setExchange(event.target.value)}><option value="">{t.all}</option>{[...new Set(base.map(record => record.exchange))].map(value => <option key={value} value={value}>{venueDisplayName(value)}</option>)}</select></label>
      {!country && <label>{t.country}<select value={selectedCountry} onChange={event => setCountry(event.target.value)}><option value="">{t.all}</option>{LICENSE_COUNTRIES.map(value => <option key={value.code} value={value.code}>{countryName(value, locale)}</option>)}</select></label>}
      <label>{t.status}<select value={status} onChange={event => setStatus(event.target.value)}><option value="">{t.all}</option>{[...new Set(base.map(record => record.status))].map(value => <option key={value} value={value}>{t.statuses?.[value] || value}</option>)}</select></label>
    </form><LicenseTable records={records} locale={locale} market={market} />
    <nav aria-label={t.country}>{LICENSE_COUNTRIES.map(value => <a key={value.slug} href={link(licensePath(value.slug), locale)}>{countryName(value, locale)}</a>)}</nav>
    <section><h2>{t.question}</h2><p>{t.answer}</p></section>
  </main>;
}
export function ExchangeLicenseSection({ slug, locale = 'en', market }) {
  const records = licenseRecords.filter(record => record.exchange === slug);
  if (!records.length) return null;
  const t = licenseCopy(locale);
  return <section className="v2-shell nx-licenses" id="licenses"><h2>{t.title}</h2><LicenseTable records={records} locale={locale} market={market} /><a href={link('/licenses', locale)}>{t.all} · {t.title}</a></section>;
}
