// "Embed this" on the data pages (2026-10-11): a collapsed <details> with the iframe and script snippets for the
// /embed/<kind> widget, each in a copyable code box. The snippets come from embedSnippets() so the page, the embed
// route and the tests agree on one URL shape. Copy uses the clipboard API after mount only; SSR renders the plain
// button, so hydration never mismatches.
import React, { useEffect, useRef, useState } from "react";
import { dataPageCopy, embedKindForPath, embedSnippets } from "../../data/market-data-pages.js";

function CopyButton({ text, copy }) {
  const [done, setDone] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1800);
    } catch { /* clipboard blocked: the snippet is selectable text */ }
  };
  return <button type="button" className="nxd-embed__copy" onClick={onClick} aria-live="polite">{done ? copy.copied : copy.copy}</button>;
}

export function EmbedThisBlock({ locale, pathname }) {
  const kind = embedKindForPath(pathname);
  if (!kind) return null;
  const copy = dataPageCopy(locale).common;
  const snippets = embedSnippets(kind, locale);
  return (
    <details className="nxd-embed v2-shell" data-rv="1" data-testid={`embed-this-${kind}`}>
      <summary><h2>{copy.embedTitle}</h2></summary>
      <div className="nxd-embed__body">
        <p className="nxd-embed__intro">{copy.embedIntro}</p>
        {[["iframe", copy.embedIframe, snippets.iframe], ["script", copy.embedScript, snippets.script]].map(([key, label, code]) => (
          <div key={key} className="nxd-embed__snippet">
            <div className="nxd-embed__head"><span>{label}</span><CopyButton text={code} copy={copy} /></div>
            <pre dir="ltr" tabIndex={0}><code>{code}</code></pre>
          </div>
        ))}
        <p className="nxd-embed__terms">{copy.embedTerms}</p>
      </div>
    </details>
  );
}

export default EmbedThisBlock;
