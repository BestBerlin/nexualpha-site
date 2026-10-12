// /calendar — macro releases, token unlocks, dated exchange listings/delistings and campaign deadlines
// (src/data/crypto-calendar.js). Week view + upcoming list, one type filter for both, iCal export per filter.
// `now` comes from the server render (hydration state) so the first client render matches; the clock moves to the
// browser's time after mount.
import React, { useEffect, useState } from "react";
import { SectionRule } from "../shared/DataRule.jsx";
import { CALENDAR_ICS_PATH, CALENDAR_JSON_PATH } from "../../data/intel-tools-routes.js";
import { fill, intelToolsCopy } from "../../data/intel-tools-copy.js";
import { calendarEventLabel } from "../../data/intel-tools-labels.js";
import { CALENDAR_TYPES, filterEvents, formatEventTime, readCalendar, recentEvents, typeCounts, upcomingGroups, utcDay, weekModel } from "../../data/crypto-calendar.js";
import { formatAmount, formatUsdShort } from "../../data/etf-flows.js";
import { SourcesList, ToolHero, ToolTail, ToolUnavailable, hrefFor, textDirection, useSnapshot } from "./shared.jsx";

const WEEKDAYS = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], "zh-Hans": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
  es: ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"], "pt-BR": ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"],
  tr: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"], vi: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
  id: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"], ja: ["月", "火", "水", "木", "金", "土", "日"], ko: ["월", "화", "수", "목", "금", "토", "일"],
};
const weekdayOf = (day, locale) => (WEEKDAYS[locale] || WEEKDAYS.en)[(new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7];
const VENUE_NAMES = { binance: "Binance", okx: "OKX", bitget: "Bitget", bybit: "Bybit", kucoin: "KuCoin", kraken: "Kraken", gate: "Gate", mexc: "MEXC", htx: "HTX", coinbase: "Coinbase" };
const venueName = (slug) => VENUE_NAMES[slug] || (slug ? slug[0].toUpperCase() + slug.slice(1) : "");
// Week cells stay short: exchange and campaign events show the venue and what happens; the list below has the title.
const chipLabel = (e, locale, t) => (e.type === "exchange" || e.type === "campaign" ? `${venueName(e.venue)} · ${t.kinds[e.kind]}` : calendarEventLabel(e, locale));
const pct = (v) => (v == null ? null : v >= 10 ? v.toFixed(1) : v.toFixed(2));

function EventMeta({ event, t, generatedAt }) {
  const parts = [];
  if (event.type === "unlock") {
    if (event.amount != null) parts.push(fill(t.unlockAmount, { amount: formatAmount(event.amount), symbol: event.asset || "" }));
    if (event.pctSupply != null) parts.push(fill(t.unlockPct, { pct: pct(event.pctSupply) }));
    if (event.usdValue != null) parts.push(fill(t.unlockValue, { usd: formatUsdShort(event.usdValue), date: utcDay(generatedAt) }));
  }
  if ((event.type === "exchange" || event.type === "campaign") && event.venue) parts.unshift(venueName(event.venue));
  return parts.length ? <p className="nxi-ev__meta" dir="auto">{parts.join(" · ")}</p> : null;
}

function EventRow({ event, locale, market, t, generatedAt }) {
  const time = formatEventTime(event);
  return (
    <li className={`nxi-ev nxi-ev--${event.type}`} data-type={event.type}>
      <span className="nxi-ev__time" dir="ltr">{time || t.allDay}</span>
      <div className="nxi-ev__body">
        <p className="nxi-ev__title"><span className={`nxi-kind nxi-kind--${event.type}`}>{event.kind === "listing" || event.kind === "delisting" || event.kind === "campaign-end" ? t.kinds[event.kind] : t.types[event.type]}</span> <span>{calendarEventLabel(event, locale)}</span></p>
        <EventMeta event={event} t={t} generatedAt={generatedAt} />
        <p className="nxi-ev__links">
          {event.pagePath ? <><a href={hrefFor(event.pagePath, locale, market)}>{t.details}</a><span aria-hidden="true"> · </span></> : null}
          <a href={event.sourceUrl} target="_blank" rel="noopener nofollow">{t.source}: {event.sourceName || new URL(event.sourceUrl).hostname}</a>
        </p>
      </div>
    </li>
  );
}

export function CalendarPage({ locale = "en", market, initial, now: serverNow }) {
  const copy = intelToolsCopy(locale);
  const t = copy.calendar;
  const json = useSnapshot(CALENDAR_JSON_PATH, initial);
  const data = readCalendar(json);
  const [type, setType] = useState("all");
  const [weekOffset, setWeekOffset] = useState(0);
  const [now, setNow] = useState(() => (Number.isFinite(serverNow) ? serverNow : Date.parse(data?.generatedAt) || 0));
  useEffect(() => { setNow(Date.now()); }, []);
  const events = data ? filterEvents(data.events, type) : [];
  const counts = data ? typeCounts(data.events) : {};
  const week = weekModel(events, now, weekOffset);
  const today = new Date(now).toISOString().slice(0, 10);
  const groups = upcomingGroups(events, now);
  const recent = recentEvents(events, now);
  const icsHref = (filter) => `${CALENDAR_ICS_PATH}?${filter !== "all" ? `type=${filter}&` : ""}locale=${encodeURIComponent(locale)}`;
  return (
    <main className="v6 v2-page v3-page nxd nxi nxi--calendar" id="top" dir={textDirection(locale)} data-testid="calendar-page">
      <ToolHero locale={locale} market={market} page={t} generatedAt={data?.generatedAt} />
      {!data ? <ToolUnavailable locale={locale} /> : (
        <>
          <div className="nxi-tabs v2-shell" role="group" aria-label={t.filters} data-testid="calendar-filters">
            {["all", ...CALENDAR_TYPES].map((key) => (
              <button key={key} type="button" className="nxi-tab" aria-pressed={type === key} onClick={() => setType(key)} data-type={key}>
                {t.types[key]}{key !== "all" ? <span className="nxi-count" dir="ltr">{counts[key] || 0}</span> : null}
              </button>
            ))}
          </div>

          <section className="nxi-week v2-shell" aria-labelledby="nxi-week-h" data-testid="calendar-week">
            <SectionRule stamp={fill(t.weekOf, { date: week[0].day })} />
            <div className="nxi-chart-head">
              <h2 id="nxi-week-h">{weekOffset === 0 ? t.weekTitle : fill(t.weekOf, { date: week[0].day })}</h2>
              <div className="nxi-tabs nxi-tabs--small">
                <button type="button" className="nxi-tab" onClick={() => setWeekOffset((w) => w - 1)} aria-label={t.prevWeek}>‹</button>
                <button type="button" className="nxi-tab" onClick={() => setWeekOffset(0)} aria-pressed={weekOffset === 0}>{t.today}</button>
                <button type="button" className="nxi-tab" onClick={() => setWeekOffset((w) => w + 1)} aria-label={t.nextWeek}>›</button>
              </div>
            </div>
            <ol className="nxi-grid">
              {week.map((d) => (
                <li key={d.day} className={`nxi-day${d.day === today ? " nxi-day--today" : ""}${d.events.length ? "" : " nxi-day--empty"}`}>
                  <p className="nxi-day__head"><b>{weekdayOf(d.day, locale)}</b> <span dir="ltr">{d.day.slice(5)}</span></p>
                  {d.events.length ? (
                    <ul>{d.events.slice(0, 4).map((e) => (
                      <li key={e.id} className={`nxi-wev nxi-wev--${e.type}`} title={calendarEventLabel(e, locale)}>
                        <span className="nxi-wev__time" dir="ltr">{formatEventTime(e)?.replace(" UTC", "") || t.allDay}</span>
                        <span className="nxi-wev__label">{chipLabel(e, locale, t)}</span>
                      </li>
                    ))}{d.events.length > 4 ? <li className="nxi-wev nxi-wev--more" dir="ltr">+{d.events.length - 4}</li> : null}</ul>
                  ) : <p className="nxd-muted nxi-day__none">{t.noEvents}</p>}
                </li>
              ))}
            </ol>
          </section>

          <section className="nxi-list v2-shell" aria-labelledby="nxi-list-h" data-testid="calendar-list">
            <SectionRule stamp={groups.reduce((s, g) => s + g.events.length, 0)} />
            <h2 id="nxi-list-h">{t.listTitle}</h2>
            {groups.length ? groups.map((g) => (
              <div key={g.day} className="nxi-group">
                <h3><span dir="ltr">{g.day}</span> · {weekdayOf(g.day, locale)}</h3>
                <ul>{g.events.map((e) => <EventRow key={e.id} event={e} locale={locale} market={market} t={t} generatedAt={data.generatedAt} />)}</ul>
              </div>
            )) : <p className="nxd-muted">{t.empty}</p>}
            {recent.length ? (
              <details className="nxi-recent">
                <summary>{t.recentTitle} <span className="nxi-count" dir="ltr">{recent.length}</span></summary>
                <ul>{recent.map((e) => <EventRow key={e.id} event={e} locale={locale} market={market} t={t} generatedAt={data.generatedAt} />)}</ul>
              </details>
            ) : null}
          </section>

          <section className="nxi-ics v2-shell" aria-labelledby="nxi-ics-h">
            <h2 id="nxi-ics-h"><a href={icsHref("all")} data-testid="calendar-ics">{t.ics}</a></h2>
            <p className="nxd-muted">{t.icsHint}</p>
            <p className="nxi-ics__types">
              {CALENDAR_TYPES.map((key, i) => <React.Fragment key={key}>{i ? <span aria-hidden="true"> · </span> : null}<a href={icsHref(key)} rel="nofollow">{fill(t.icsFiltered, { type: t.types[key] })}</a></React.Fragment>)}
            </p>
          </section>
        </>
      )}
      {data ? <SourcesList locale={locale} sources={data.sources} /> : null}
      <ToolTail locale={locale} market={market} page={t} current="calendar" jsonPath={CALENDAR_JSON_PATH} />
    </main>
  );
}

export default CalendarPage;
