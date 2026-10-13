import React, { useState } from 'react';
import { LICENSE_COUNTRIES, LICENSE_INDEX_LOCALES, licenseRecords, licenseCopy, licenseTitle, licenseAnswer, licensePath } from '../../data/licenses.js';
import { licenseSignup } from '../../data/licenses-cta.js';
import { localizedHref } from '../../data/locale-routing.js';
import './licenses.css';

const countryName = (country, locale) => new Intl.DisplayNames([locale], { type: 'region' }).of(country.code) || country.name;
const link = (path, locale) => localizedHref(path, { locale });
export function LicenseTable({ records, locale, market }) {
  const t = licenseCopy(locale);
  return <div className="nx-license-table"><table><thead><tr>{[t.exchange, t.country, t.entity, t.regulator, t.type, t.status, t.source, t.lastChecked].map((label, i) => <th key={i} scope="col">{label}</th>)}</tr></thead><tbody>
    {records.map(record => {
      const country = LICENSE_COUNTRIES.find(item => item.code === record.country);
      const signup = licenseSignup(record, { locale, market });
      return <tr key={`${record.exchange}-${record.country}`}><th scope="row"><a href={link(`/exchanges/${record.exchange}`, locale)}>{record.exchange}</a>{signup && <a className="nx-license-cta" href={signup} data-cta-kind="registration" data-cta-platform={record.exchange} data-cta-placement="license-directory" rel="sponsored nofollow">{t.open}</a>}</th>
        <td>{country && <a href={link(licensePath(country.slug), locale)}>{countryName(country, locale)}</a>}</td><td><bdi>{record.entityName}</bdi></td><td>{record.regulator}</td><td>{record.type}{record.number && <><br /><bdi>{record.number}</bdi></>}</td><td>{t.statuses?.[record.status] || record.status}</td><td><a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">{t.source}</a></td><td><time dateTime={record.lastChecked}>{record.lastChecked}</time></td></tr>;
    })}
  </tbody></table>{!records.length && <p role="status">{t.empty}</p>}</div>;
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
      <label>{t.exchange}<select value={exchange} onChange={event => setExchange(event.target.value)}><option value="">{t.all}</option>{[...new Set(base.map(record => record.exchange))].map(value => <option key={value}>{value}</option>)}</select></label>
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
