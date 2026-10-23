import { SignupEvidence } from "../shared/SignupEvidence.jsx";
// Deposit & withdraw (出入金, 2026-10-15): the hub (/<localized slug>), country pages (/<slug>/<country>) and the
import { DataUpdatedStamp } from "../shared/DataUpdatedStamp.jsx";
// crypto-card comparison (/crypto-cards). Every figure comes from src/data/fiat-rails.generated.js with its official
// source and check date; unknown values render nothing. One accent CTA per page block (a /go route that carries our
// code); neutral locales and Vietnam render information only; Türkiye pages and the tr locale never show Bitget.
// Static markup: the server HTML is the page, the browser hydrates the same tree (no client-only data).
import React from "react";
import { BrandMark } from "../brand/BrandMark.jsx";
import { SectionRule } from "../shared/DataRule.jsx";
import { localizedHref } from "../../data/locale-routing.js";
import { CRYPTO_CARDS_PATH, depositPath, parseDepositPath } from "../../data/deposit-routes.js";
import { depositCopy, fillDeposit } from "../../data/deposit-copy.js";
import {
  DEPOSIT_COUNTRIES, DEPOSIT_REGIONS, FIAT_CHECKED, cjkSpace, depositCardNotes, depositCards, depositCountryLabel,
  depositCountryModel, depositExchangeLinks, depositHubModel,
} from "../../data/deposit.js";
import "./deposit.css";

const RTL = new Set(["ar", "ur"]);
const dirOf = (locale) => (RTL.has(locale) ? "rtl" : "ltr");
const href = (path, locale) => localizedHref(path, { locale });

function MethodGlyph({ kind }) {
  // 16px line glyphs (no emoji): card, bank, P2P arrows, crypto card.
  const paths = {
    card: <><rect x="1.5" y="3.5" width="13" height="9" rx="1.6" /><path d="M1.5 6.5h13M4 10h3" /></>,
    bank: <><path d="M2 6.2 8 2.8l6 3.4" /><path d="M3.2 6.5v5M6.4 6.5v5M9.6 6.5v5M12.8 6.5v5M2 13h12" /></>,
    p2p: <><path d="M2.5 5.5h9l-2-2M13.5 10.5h-9l2 2" /></>,
    cryptoCard: <><rect x="1.5" y="3.5" width="13" height="9" rx="1.6" /><circle cx="10.6" cy="8" r="2" /><path d="M4 6.2h2.6" /></>,
  };
  return <svg className="nxd-glyph" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">{paths[kind] || paths.bank}</svg>;
}

function Answer({ label, text, stamp }) {
  return <div className="nxd-answer">
    <p className="nxd-answer__label"><span>{label}</span>{stamp ? <time dateTime={FIAT_CHECKED}>{stamp}</time> : null}</p>
    <p className="nxd-answer__text" data-deposit-answer>{text}</p>
  </div>;
}

function SignupButton({locale = "en", market,  href: target, slug, label, placement }) {
  if (!target) return null;
  return <span data-signup-cta={slug} className="signup-cta-block"><a className="nxd-btn" href={target} rel="sponsored nofollow noopener" target="_blank" data-cta-kind="registration" data-cta-platform={slug} data-cta-placement={placement}>
    <BrandMark slug={slug} compact /><span>{label}</span><span className="nxd-btn__arrow" aria-hidden="true">→</span>
  </a><SignupEvidence slug={slug} locale={locale} market={market} /></span>;
}

function SourceList({ notes, t, locale }) {
  if (!notes.length) return null;
  return <section className="nxd-section nxd-sources" aria-labelledby="nxd-sources-h">
    <SectionRule stamp={String(notes.length)} />
    <h2 id="nxd-sources-h">{t.sources}</h2>
    <ol className="nxd-sources__list">
      {notes.map((note) => <li key={note.id} id={`nxd-src-${note.n}`}>
        <span className="nxd-sources__n" aria-hidden="true">[{String(note.n).padStart(2, "0")}]</span>
        <span className="nxd-sources__body">
          {note.href ? <a href={note.href} rel={note.href.startsWith("/go/") ? "sponsored nofollow noopener" : "noopener noreferrer"} target="_blank" lang="en" dir="ltr">{note.title || note.label}</a>
            : <span lang="en" dir="ltr">{note.title || note.label}</span>}
          <small><bdi dir="ltr">{note.label}</bdi>{note.published ? ` · ${fillDeposit(t.updated, { date: note.published })}` : ""} · {fillDeposit(t.checkedOn, { date: note.checked })}</small>
        </span>
      </li>)}
    </ol>
  </section>;
}

const refs = (numbers) => numbers.length ? <sup className="nxd-ref">{numbers.map((n, i) => <React.Fragment key={n}>{i ? "," : ""}<a href={`#nxd-src-${n}`} aria-label={`[${n}]`}>{n}</a></React.Fragment>)}</sup> : null;

function RouteCell({ items, dirLabel }) {
  if (!items.length) return null;
  return <ul className="nxd-routes">
    {items.map((item, index) => <li key={`${item.label}-${item.dir}-${index}`}>
      <span className="nxd-routes__rail" dir="auto">{item.label}{refs(item.notes)}</span>
      {(item.fee || item.speed || dirLabel?.[item.dir]) ? <span className="nxd-routes__meta">
        {[item.fee, item.speed].filter(Boolean).join(" · ")}
      </span> : null}
    </li>)}
  </ul>;
}

function ExchangeName({ entry, locale }) {
  const name = <span translate="no">{entry.name}</span>;
  // Profile link lands on the exchange's "Deposits and withdrawals" block (ExchangeFiatSection, id="deposits").
  return <span className="nxd-ex"><BrandMark slug={entry.slug} compact />{entry.profile ? <a href={`${href(`/exchanges/${entry.slug}`, locale)}#deposits`} data-deposit-exchange={entry.slug}>{name}</a> : name}</span>;
}

function MethodTable({ model, t, locale }) {
  const cols = ["card", "bankIn", "bankOut", "p2p"].filter((key) => model.exchanges.some((entry) => entry.cells[key].length));
  return <section className="nxd-section" aria-labelledby="nxd-table-h">
    <SectionRule stamp={String(model.exchanges.length)} />
    <h2 id="nxd-table-h">{t.tableTitle}</h2>
    <div className="nxd-table-wrap">
      <table className="nxd-table">
        <thead><tr><th scope="col">{t.col.exchange}</th>{cols.map((key) => <th scope="col" key={key}>{t.col[key]}</th>)}</tr></thead>
        <tbody>
          {model.exchanges.map((entry) => <tr key={entry.slug} data-exchange={entry.slug}>
            <th scope="row"><ExchangeName entry={entry} locale={locale} />
              {entry.signup ? <span data-signup-cta={entry.slug} className="signup-cta-block"><a className="nxd-row-cta" href={entry.signup} rel="sponsored nofollow noopener" target="_blank" data-cta-kind="registration" data-cta-platform={entry.slug} data-cta-placement="deposit-table">{fillDeposit(t.cta, { ex: entry.name })}</a><SignupEvidence slug={entry.slug} locale={locale} market={undefined} /></span> : null}
            </th>
            {cols.map((key) => <td key={key} data-label={t.col[key]}><RouteCell items={entry.cells[key]} /></td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
  </section>;
}

function CountryNav({ current, locale, t }) {
  return <nav className="nxd-section nxd-countries" aria-label={current ? t.otherCountries : t.pickCountry}>
    {DEPOSIT_REGIONS.map((region) => {
      const list = DEPOSIT_COUNTRIES.filter((country) => country.region === region && country.slug !== current);
      if (!list.length) return null;
      return <div className="nxd-countries__group" key={region}>
        <p className="nxd-countries__region">{t.regions[region]}</p>
        <ul>{list.map((country) => <li key={country.slug}><a href={href(depositPath(locale, country.slug), locale)}>{depositCountryLabel(country, locale)}</a></li>)}</ul>
      </div>;
    })}
  </nav>;
}

/** Hub -> exchange deposit sections, push order (tr skips Bitget; vi/ru render nothing). */
function ExchangeLinks({ locale, t }) {
  const links = depositExchangeLinks(locale);
  if (!links.length) return null;
  return <nav className="nxd-section nxd-countries nxd-exlinks" aria-label={t.col.exchange}>
    <div className="nxd-countries__group">
      <p className="nxd-countries__region">{t.col.exchange}</p>
      <ul>{links.map((link) => <li key={link.slug}><a href={`${href(`/exchanges/${link.slug}`, locale)}#deposits`} data-deposit-exchange={link.slug} translate="no">{link.name}</a></li>)}</ul>
    </div>
  </nav>;
}

export function DepositHubPage({ locale = "en" }) {
  const t = depositCopy(locale);
  const hub = depositHubModel(locale);
  const kindsLabel = (kind) => (kind === "cryptoCard" ? t.method.cryptoCard : t.method[kind]);
  return <main className="nxd" id="top" lang={locale} dir={dirOf(locale)} data-deposit-page="hub">
    <div className="nxd-shell">
      <header className="nxd-head">
        <h1>{t.hubTitle}</h1>
        <DataUpdatedStamp at={FIAT_CHECKED} locale={locale} />
        <Answer label={t.shortAnswer} text={cjkSpace(fillDeposit(t.hubAnswer, { n: hub.countries.length, date: FIAT_CHECKED }), locale)} stamp={FIAT_CHECKED} />
      </header>

      <section className="nxd-section" aria-labelledby="nxd-pick-h">
        <SectionRule stamp={String(hub.countries.length)} />
        <h2 id="nxd-pick-h">{t.pickCountry}</h2>
        <div className="nxd-regions">
          {DEPOSIT_REGIONS.map((region) => {
            const list = hub.countries.filter((country) => country.region === region);
            if (!list.length) return null;
            return <section className="nxd-region" key={region} aria-labelledby={`nxd-region-${region}`}>
              <h3 className="nxd-region__name" id={`nxd-region-${region}`}>{t.regions[region]}<span aria-hidden="true">{list.length}</span></h3>
              <ul className="nxd-clist">
                {list.map((country) => <li key={country.slug}>
                  <a className="nxd-crow" href={href(country.href, locale)} data-deposit-country={country.slug}>
                    <span className="nxd-crow__name">{country.label}</span>
                    <span className="nxd-crow__kinds">{country.kinds.map(kindsLabel).join(" · ")}</span>
                    {country.top ? <span className="nxd-crow__pick">
                      <small>{country.informational ? t.localRoutes : t.topPick}</small>
                      <BrandMark slug={country.top.slug} compact /><span translate="no">{country.top.name}</span>
                    </span> : <span className="nxd-crow__pick" aria-hidden="true" />}
                    {country.headline ? <span className="nxd-crow__route">
                      <span dir="auto">{country.headline.label}</span>
                      <span className="nxd-crow__meta">{[country.headline.dir, country.headline.fee, country.headline.speed].filter(Boolean).join(" · ")}</span>
                    </span> : <span className="nxd-crow__route" aria-hidden="true" />}
                    <span className="nxd-crow__arrow" aria-hidden="true">→</span>
                  </a>
                </li>)}
              </ul>
            </section>;
          })}
        </div>
      </section>

      <ExchangeLinks locale={locale} t={t} />

      <section className="nxd-section" aria-labelledby="nxd-methods-h">
        <SectionRule stamp="4" />
        <h2 id="nxd-methods-h">{t.methodsTitle}</h2>
        <ul className="nxd-methods">
          {["card", "bank", "p2p", "cryptoCard"].map((kind) => <li key={kind}>
            <h3><MethodGlyph kind={kind} />{t.method[kind]}</h3>
            <p>{t.methodBody[kind]}</p>
            <a href={kind === "cryptoCard" ? href(CRYPTO_CARDS_PATH, locale) : `${href("/exchanges", locale)}?fiat=${kind}`}>{t.methodLink[kind]} <span aria-hidden="true">→</span></a>
          </li>)}
        </ul>
      </section>

      {hub.cn ? <section className="nxd-section nxd-note" aria-labelledby="nxd-cn-h">
        <h2 id="nxd-cn-h">{hub.cn.title}</h2>
        <p>{hub.cn.body}</p>
        <p className="nxd-note__src"><a href={hub.cn.url} target="_blank" rel="noopener noreferrer">{t.cnSource}</a> · {fillDeposit(t.updated, { date: hub.cn.published })} · {fillDeposit(t.checkedOn, { date: hub.cn.checked })}</p>
      </section> : null}
    </div>
  </main>;
}

export function DepositCountryPage({ slug, locale = "en" }) {
  const t = depositCopy(locale);
  const model = depositCountryModel(slug, locale);
  if (!model) return null;
  const title = cjkSpace(fillDeposit(t.countryTitle, { country: model.name }), locale);
  return <main className="nxd" id="top" lang={locale} dir={dirOf(locale)} data-deposit-page="country" data-deposit-country={slug}>
    <div className="nxd-shell">
      <nav className="nxd-crumbs" aria-label={t.breadcrumb}><a href={href(depositPath(locale), locale)}>{t.breadcrumb}</a><span aria-hidden="true">/</span><span>{model.label}</span></nav>
      <header className="nxd-head">
        <h1>{title}</h1>
        <DataUpdatedStamp at={FIAT_CHECKED} locale={locale} />
        <Answer label={t.shortAnswer} text={model.answer} stamp={FIAT_CHECKED} />
        {model.cta ? <div className="nxd-head__cta"><SignupButton locale={locale} market={undefined} href={model.cta.href} slug={model.cta.slug} label={fillDeposit(t.cta, { ex: model.cta.name })} placement="deposit-country-hero" /></div> : null}
      </header>

      {model.steps.length ? <section className="nxd-section" aria-labelledby="nxd-steps-h">
        <SectionRule stamp={String(model.steps.length)} />
        <h2 id="nxd-steps-h">{t.stepsTitle}</h2>
        <ol className="nxd-steps">{model.steps.map((step, index) => <li key={index}><span className="nxd-steps__n" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol>
      </section> : null}

      {model.exchanges.length ? <MethodTable model={model} t={t} locale={locale} /> : null}

      {model.negatives.length ? <section className="nxd-section nxd-not" aria-labelledby="nxd-not-h">
        <h2 id="nxd-not-h">{t.notOffered}</h2>
        <ul>{model.negatives.map((entry) => <li key={`${entry.x}-${entry.what.join("-")}`}>
          <strong translate="no">{entry.name}</strong> · {entry.what.join(" · ")}{entry.since ? ` · ${fillDeposit(t.since, { date: entry.since })}` : ""}
          {entry.note ? <small> · <bdi dir="ltr">{entry.note.label}</bdi> · {fillDeposit(t.checkedOn, { date: entry.note.checked })}</small> : null}
        </li>)}</ul>
      </section> : null}

      {model.cards.length ? <section className="nxd-section" aria-labelledby="nxd-cards-h">
        <SectionRule stamp={String(model.cards.length)} />
        <h2 id="nxd-cards-h">{cjkSpace(fillDeposit(t.cardsHere, { country: model.name }), locale)}</h2>
        <ul className="nxd-minicards">{model.cards.map((card) => <li key={card.id}>
          <BrandMark slug={card.x} compact /><span className="nxd-minicards__name" translate="no">{card.name}</span>
          <span className="nxd-minicards__meta">{[card.net, card.reward].filter(Boolean).join(" · ")}</span>
        </li>)}</ul>
        <p><a className="nxd-link" href={href(CRYPTO_CARDS_PATH, locale)}>{t.methodLink.cryptoCard} <span aria-hidden="true">→</span></a></p>
      </section> : null}

      {model.faqs.length ? <section className="nxd-section nxd-faq" aria-labelledby="nxd-faq-h">
        <SectionRule stamp={String(model.faqs.length)} />
        <h2 id="nxd-faq-h" className="nxd-visually-hidden">FAQ</h2>
        {model.faqs.map(([q, a]) => <div key={q}><h3>{q}</h3><p>{a}</p></div>)}
      </section> : null}

      <SourceList notes={model.notes} t={t} locale={locale} />
      <CountryNav current={slug} locale={locale} t={t} />
    </div>
  </main>;
}

export function CryptoCardsPage({ locale = "en" }) {
  const t = depositCopy(locale);
  const cards = depositCards(locale);
  const { notes, byCard } = depositCardNotes(cards, locale);
  return <main className="nxd" id="top" lang={locale} dir={dirOf(locale)} data-deposit-page="cards">
    <div className="nxd-shell">
      <nav className="nxd-crumbs" aria-label={t.breadcrumb}><a href={href(depositPath(locale), locale)}>{t.breadcrumb}</a><span aria-hidden="true">/</span><span>{t.method.cryptoCard}</span></nav>
      <header className="nxd-head">
        <h1>{t.cardsTitle}</h1>
        <DataUpdatedStamp at={FIAT_CHECKED} locale={locale} />
        <Answer label={t.shortAnswer} text={cjkSpace(fillDeposit(t.cardsAnswer, { n: cards.length, date: FIAT_CHECKED }), locale)} stamp={FIAT_CHECKED} />
      </header>
      <section className="nxd-section" aria-labelledby="nxd-cardlist-h">
        <SectionRule stamp={String(cards.length)} />
        <h2 id="nxd-cardlist-h" className="nxd-visually-hidden">{t.cardsTitle}</h2>
        <ul className="nxd-cards">
          {cards.map((card) => <li key={card.id} className="nxd-card" data-card={card.id}>
            <div className="nxd-card__head">
              <BrandMark slug={card.x} compact />
              <div>
                <h3 translate="no">{card.name}{refs(byCard[card.id] || [])}</h3>
                <p className="nxd-card__status">{[card.net, card.status].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <dl className="nxd-card__facts">
              {card.regionsText ? <div><dt>{t.cardCol.regions}</dt><dd>{card.regionsText}</dd></div> : null}
              {card.reward ? <div><dt>{t.cardCol.rewards}</dt><dd className="nxd-card__reward">{card.reward}</dd></div> : null}
              {card.feeList.length ? <div><dt>{t.cardCol.fees}</dt><dd><ul className="nxd-card__fees">{card.feeList.map((fee) => <li key={fee.name}><span>{fee.name}</span><b>{fee.text}</b></li>)}</ul></dd></div> : null}
              {card.steps.length ? <div><dt>{t.cardCol.apply}</dt><dd><ol className="nxd-card__apply">{card.steps.map((step) => <li key={step}>{step}</li>)}</ol></dd></div> : null}
            </dl>
            {card.signup ? <span data-signup-cta={card.x} className="signup-cta-block"><a className="nxd-btn nxd-btn--ghost" href={card.signup} rel="sponsored nofollow noopener" target="_blank" data-cta-kind="registration" data-cta-platform={card.x} data-cta-placement="crypto-cards">{fillDeposit(t.cardCta, { ex: card.exchangeName })}</a><SignupEvidence slug={card.x} locale={locale} market={undefined} /></span> : null}
          </li>)}
        </ul>
      </section>
      <SourceList notes={notes} t={t} locale={locale} />
      <p className="nxd-section"><a className="nxd-link" href={href(depositPath(locale), locale)}>{t.breadcrumb} <span aria-hidden="true">→</span></a></p>
    </div>
  </main>;
}

/** Router entry: hub, country or cards view for a content path. */
export function DepositPage({ pathname, locale = "en" }) {
  const route = parseDepositPath(pathname, locale);
  if (route?.kind === "cards") return <CryptoCardsPage locale={locale} />;
  if (route?.kind === "country") return <DepositCountryPage slug={route.country} locale={locale} />;
  return <DepositHubPage locale={locale} />;
}
