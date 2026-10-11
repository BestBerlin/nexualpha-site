import { useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { ACTIVE_COMPARE_VENUE_SLUGS, canonicalComparePath, comparePickerCopy } from "../../data/compare-slug.js";
import "./compare-any-picker.css";

// "Compare any two" picker (2026-10-11). Works without JavaScript: a GET form to /compare?a=<slug>&b=<slug> that the
// worker normalizes to the canonical pair path. With JavaScript the submit navigates straight to that canonical path.
export function CompareAnyPicker({ locale = "en", venues = [], initial = [], placement = "compare-hub", compact = false }) {
  const copy = comparePickerCopy(locale);
  const options = venues
    .filter((venue) => ACTIVE_COMPARE_VENUE_SLUGS.includes(venue.slug))
    .map((venue) => ({ slug: venue.slug, name: venue.name }));
  const [a, setA] = useState(initial[0] || "");
  const [b, setB] = useState(initial[1] || "");
  const [error, setError] = useState("");
  const action = localizedHref("/compare", { locale });
  const idPrefix = `compare-any-${placement}`;
  const onSubmit = (event) => {
    if (!a || !b || a === b) {
      event.preventDefault();
      setError(copy.same);
      return;
    }
    if (typeof window === "undefined") return;
    event.preventDefault();
    window.location.assign(localizedHref(canonicalComparePath([a, b]), { locale }));
  };
  return (
    <form
      className={`compare-any${compact ? " compare-any--compact" : ""}`}
      method="get"
      action={action}
      onSubmit={onSubmit}
      aria-labelledby={`${idPrefix}-title`}
      data-compare-any-placement={placement}
      dir={["ar", "ur"].includes(locale) ? "rtl" : undefined}
    >
      <div className="compare-any__head">
        <strong id={`${idPrefix}-title`} className="compare-any__title">{copy.title}</strong>
        <span className="compare-any__hint">{copy.hint}</span>
      </div>
      <div className="compare-any__row">
        <label className="compare-any__field">
          <span>{copy.a}</span>
          <select name="a" value={a} onChange={(event) => { setA(event.target.value); setError(""); }} required>
            <option value="">{copy.placeholder}</option>
            {options.map((option) => <option key={option.slug} value={option.slug} disabled={option.slug === b}>{option.name}</option>)}
          </select>
        </label>
        <span className="compare-any__vs" aria-hidden="true">vs</span>
        <label className="compare-any__field">
          <span>{copy.b}</span>
          <select name="b" value={b} onChange={(event) => { setB(event.target.value); setError(""); }} required>
            <option value="">{copy.placeholder}</option>
            {options.map((option) => <option key={option.slug} value={option.slug} disabled={option.slug === a}>{option.name}</option>)}
          </select>
        </label>
        <button type="submit" className="compare-any__submit">{copy.submit}</button>
      </div>
      {error && <p className="compare-any__error" role="alert">{error}</p>}
    </form>
  );
}
