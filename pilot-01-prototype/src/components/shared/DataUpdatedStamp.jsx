import { dataUpdatedStamp } from "../../data/data-updated.js";

// SSR-rendered freshness stamp; styles in src/styles/v8/site-signature.css (.nx-data-updated).
export function DataUpdatedStamp({ at, locale, className = "" }) {
  const stamp = dataUpdatedStamp(at, locale);
  if (!stamp) return null;
  return (
    <p className={`nx-data-updated${className ? ` ${className}` : ""}`} data-updated-stamp={stamp.dateOnly ? "review-date" : "live"}>
      <time dateTime={stamp.dateTime}>{stamp.text}</time>
    </p>
  );
}
