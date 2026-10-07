import { useEffect, useId, useMemo, useRef, useState } from "react";
import { track } from "../../data/market-command";
import { buildFinderResults, finderSafeContext, finderTrackPayload, searchFinderResults } from "./finder-results";

export function CommandFinder({ copy, command, autoFocus = false, compact = false, onClose }) {
  const input = useRef(null);
  const root = useRef(null);
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const finderContext = useMemo(() => {
    if (typeof window === "undefined") return finderSafeContext("", { locale: copy.locale });
    return finderSafeContext(window.location.search, { locale: copy.locale });
  }, [copy.locale]);
  const allResults = useMemo(() => buildFinderResults({ copy, command, locale: copy.locale, context: finderContext }), [command, copy, finderContext]);
  const results = useMemo(() => searchFinderResults(allResults, query, copy.locale), [allResults, copy.locale, query]);
  useEffect(() => { if (autoFocus) input.current?.focus(); }, [autoFocus]);
  useEffect(() => {
    const dismiss = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  useEffect(() => { setActive(0); }, [results.length]);
  const choose = (result) => {
    setQuery(result.label);
    setOpen(false);
    track("hero_search_submit", finderTrackPayload(result, finderContext));
    if (result.href && typeof window !== "undefined") {
      const destination = new URL(result.href, window.location.origin);
      window.location.assign(destination);
    }
  };
  const submit = () => { if (results[active]) choose(results[active]); else setOpen(true); };
  const onKeyDown = (event) => {
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); if (onClose) { event.stopPropagation(); onClose(); } return; }
    if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive((value) => Math.min(value + 1, Math.max(results.length - 1, 0))); }
    if (event.key === "ArrowUp") { event.preventDefault(); setOpen(true); setActive((value) => Math.max(value - 1, 0)); }
    if (event.key === "Enter") { event.preventDefault(); submit(); }
  };
  return <div ref={root} className={compact ? "command-finder command-finder--compact" : "command-finder"} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <div className="command-input">
      <span aria-hidden="true">⌕</span>
      <input ref={input} value={query} placeholder={copy.hero.placeholder} onFocus={() => { setOpen(true); track("hero_search_focus"); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(0); }} onKeyDown={onKeyDown} aria-label={copy.hero.searchAria} role="combobox" aria-expanded={open} aria-controls={open ? listboxId : undefined} aria-haspopup="listbox" aria-autocomplete="list" aria-activedescendant={open && results[active] ? `${listboxId}-result-${active}` : undefined} />
      <button type="button" onClick={submit} aria-label={copy.hero.search}>→</button>
    </div>
    {open && <div id={listboxId} className="command-results" role="listbox">
      {results.length ? results.map((result, index) => <button id={`${listboxId}-result-${index}`} type="button" key={`${result.group}-${result.href}`} role="option" aria-selected={index === active} className={index === active ? "is-active" : ""} onMouseEnter={() => setActive(index)} onClick={() => choose(result)}><small>{result.group}</small><span>{result.label}</span></button>) : <p role="status">{copy.finder.empty}</p>}
    </div>}
  </div>;
}
