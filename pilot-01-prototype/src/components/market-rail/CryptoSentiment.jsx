import { useEffect, useState } from "react";
import { readableCryptoSentiment as readable } from "../../data/market-intelligence-view.js";
import { sentimentLabel } from "../../content/sentiment-labels.js";
import "./crypto-sentiment.css";

const sourceUrl = "https://alternative.me/crypto/fear-and-greed-index/";

function unavailable() { return { freshness: "unavailable", value: null, classification: null, asOf: null }; }

export function CryptoSentiment({ copy, refreshRevision = 0 }) {
  const [snapshot, setSnapshot] = useState(unavailable);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    setSnapshot(unavailable());
    window.fetch("/api/v1/market/crypto-sentiment", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("sentiment unavailable");
      const payload = await response.json();
      if (active) setSnapshot(readable(payload?.data) ? payload.data : unavailable());
    }).catch(() => { if (active) setSnapshot(unavailable()); }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [refreshRevision]);
  const live = readable(snapshot);
  if (!live) return null;
  const asOf = live ? new Intl.DateTimeFormat(copy.locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.asOf)) : null;
  return <section className="v2-section live-market-signal" aria-label={copy.sentiment.title}>
    <aside className={`crypto-sentiment crypto-sentiment--${snapshot.freshness}`} aria-live="polite">
      <div className="crypto-sentiment__reading">
        <span className="crypto-sentiment__eyebrow">{copy.sentiment.title}</span>
        <strong>{snapshot.value} <small>{sentimentLabel(snapshot.classification, copy.locale)}</small></strong>
      </div>
      <div className="crypto-sentiment__meta">
        <time dateTime={snapshot.asOf}>{copy.sentiment.asOf(asOf)}{snapshot.freshness === "stale" ? ` · ${copy.sentiment.stale}` : ""}</time>
        <a href={sourceUrl} target="_blank" rel="noreferrer" aria-label={`${copy.sentiment.source}: Alternative.me Crypto Fear & Greed Index`}><span>{copy.sentiment.source}: </span><span lang="en" dir="ltr" translate="no">Alternative.me</span></a>
      </div>
      <p>{copy.sentiment.context}</p>
    </aside>
  </section>;
}
