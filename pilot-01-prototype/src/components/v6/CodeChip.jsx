// One code chip for every signup surface: the code itself is the button, the icon flips to a check and a
// polite live region says "Copied". If the clipboard is blocked, the code is shown selected for a manual copy.
import { useEffect, useRef, useState } from "react";
import { copyText, ctaUiCopy, trackCodeCopy } from "../../data/cta-ui-copy.js";

export function CodeChip({ code, slug, placement, locale = "en", className = "" }) {
  const [state, setState] = useState("idle");
  const timer = useRef(0);
  const t = ctaUiCopy(locale);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!code) return null;
  const onCopy = async () => {
    clearTimeout(timer.current);
    const ok = await copyText(code);
    setState(ok ? "done" : "fail");
    if (ok) trackCodeCopy(slug, placement);
    timer.current = setTimeout(() => setState("idle"), ok ? 2200 : 6000);
  };
  return (
    <span className={`cro-code ${className}`.trim()} data-state={state === "idle" ? undefined : state}>
      <button type="button" className="cro-code__btn" onClick={onCopy} aria-label={`${t.copy}: ${code}`} data-cta-kind="code-copy" data-cta-platform={slug} data-cta-placement={placement}>
        <span className="cro-code__lab" aria-hidden="true">{t.code}</span>
        <strong className="cro-code__code" translate="no" lang="en" dir="ltr">{code}</strong>
        <svg className="cro-code__ico" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {state === "done" ? <path d="M3.5 8.5l3 3 6-7" /> : <><rect x="5.5" y="5.5" width="8" height="8" rx="1.8" /><path d="M10.5 5.5v-1.2a1.8 1.8 0 0 0-1.8-1.8H4.3a1.8 1.8 0 0 0-1.8 1.8v4.4a1.8 1.8 0 0 0 1.8 1.8h1.2" /></>}
        </svg>
      </button>
      <span className="cro-code__pop" aria-hidden="true">{state === "fail" ? t.copyFail : t.copied}</span>
      <span className="cro-sr" role="status" aria-live="polite">{state === "done" ? t.copiedHint : state === "fail" ? t.copyFail : ""}</span>
    </span>
  );
}
