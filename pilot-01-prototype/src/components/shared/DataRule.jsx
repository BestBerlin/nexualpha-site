// Data rule (v9 editorial signature, docs/design-unified-v8.md "Data rule"): a section head made of a mono label, a
// 1px hairline that fills the line and a mono figure or SGT stamp at the end. Used by the article, news index and hub
// templates. Pure markup, CSS in src/styles/v8/site-signature.css (.nx-rule); pinned to the core-ui chunk.
import React from "react";
import { formatSgt, readerDayKey } from "../../data/local-time.js";

/**
 * as: element for the label (h2 when the rule is the section heading, otherwise span).
 * stamp: mono text at the end (SGT time, count, date); dateTime makes it a <time>.
 */
export function DataRule({ as: Label = "span", label, labelId, labelProps = {}, stamp, dateTime, className = "", children }) {
  return (
    <div className={`nx-rule${className ? ` ${className}` : ""}`}>
      <Label className="nx-rule__label" id={labelId} {...labelProps}>{label}</Label>
      {children}
      <span className="nx-rule__line" aria-hidden="true" />
      {stamp ? (dateTime
        ? <time className="nx-rule__stamp" dateTime={dateTime}>{stamp}</time>
        : <span className="nx-rule__stamp">{stamp}</span>) : null}
    </div>
  );
}

/**
 * Section rule (V3, 2026-10-11): the same signature as the section line above an existing section heading on the
 * venue, compare, activities and data pages, where the heading itself stays a large h2. The label is the section's
 * running number (CSS counter, so hidden or conditional sections never leave gaps); the optional stamp is a figure
 * or SGT time. Decorative: the h2 below names the section, so the rule is hidden from assistive technology.
 */
export function SectionRule({ stamp, dateTime, className = "" }) {
  return (
    <div className={`nx-rule nx-rule--section${className ? ` ${className}` : ""}`} aria-hidden="true">
      <span className="nx-rule__label nx-rule__index" />
      <span className="nx-rule__line" />
      {stamp != null && stamp !== "" ? (dateTime
        ? <time className="nx-rule__stamp" dateTime={dateTime}>{stamp}</time>
        : <span className="nx-rule__stamp">{stamp}</span>) : null}
    </div>
  );
}

// Compatibility exports for existing rule consumers; all visible stamps use SGT.
export function utcStamp(iso, { time = true } = {}) {
  return (time ? formatSgt(iso) : readerDayKey(iso)) || null;
}
export function utcClock(iso) {
  return formatSgt(iso, "en", "clock").replace(/ SGT$/, "") || null;
}

// "2026-10-11 · 17:08 SGT" with the date part in .nx-rule__date (dropped on phones by site-signature.css).
export function UtcRuleStamp({ iso }) {
  const full = utcStamp(iso);
  if (!full) return null;
  const [day, time] = full.split(" · ");
  return <><span className="nx-rule__date">{day} · </span>{time}</>;
}
