import React, { useEffect, useId, useRef, useState } from "react";
import { NexuAlphaWordmark } from "../brand/NexuAlphaWordmark";
import { LanguageMenu } from "./LanguageMenu.jsx";
import { shellCopy } from "./shell-copy.js";

const PRIMARY_COUNT = 4;

function Chevron() {
  return <svg className="nx-ico nx-chev" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>;
}
function SearchIcon() {
  return <svg className="nx-ico" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true" focusable="false"><circle cx="7" cy="7" r="4.75" /><path d="m10.5 10.5 3.25 3.25" /></svg>;
}

function linkProps(href, state, placement) {
  const telegram = href.includes("/telegram");
  return {
    "aria-current": state.current,
    "data-active": state.active ? "true" : undefined,
    "data-cta-kind": telegram ? "telegram" : undefined,
    "data-cta-placement": telegram ? `${placement}-telegram` : undefined,
    "data-growth-decision": telegram ? "telegram_hub" : undefined,
    "data-growth-placement": telegram ? placement : undefined,
  };
}

/** Skip control is a button (not an anchor) so it adds no href to the page's link set. */
function skipToContent() {
  const target = document.querySelector("main h1") || document.querySelector("main") || document.getElementById("top");
  if (!target) return;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: "start" });
}

export function SiteHeader({
  copy, locale, brazil, nav, homeHref, navState, localeOptions, onLocaleChange, onSearch,
  mobileOpen, onMobileToggle, mobileTriggerRef, headerRef,
}) {
  const text = shellCopy(locale);
  const moreId = useId();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const moreBtnRef = useRef(null);
  const sentinelRef = useRef(null);
  const primary = nav.slice(0, PRIMARY_COUNT);
  const secondary = nav.slice(PRIMARY_COUNT);
  const secondaryActive = secondary.some(([, href]) => navState(href).active);

  // Scroll-linked state without a scroll listener: a sentinel at the very top of the
  // document leaves the viewport once the page scrolls; the attribute is written
  // straight to the DOM so nothing re-renders.
  useEffect(() => {
    const bar = headerRef?.current;
    const sentinel = sentinelRef.current;
    if (!bar || !sentinel || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) bar.removeAttribute("data-scrolled");
      else bar.setAttribute("data-scrolled", "true");
    }, { threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [headerRef]);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onPointer = (event) => { if (!moreRef.current?.contains(event.target)) setMoreOpen(false); };
    const onKey = (event) => { if (event.key === "Escape") { setMoreOpen(false); moreBtnRef.current?.focus({ preventScroll: true }); } };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [moreOpen]);

  const languageMenu = (inline) => <LanguageMenu locale={locale} options={localeOptions} label={copy.ui.language} disabled={brazil} onSelect={onLocaleChange} inline={inline} />;

  return <header ref={headerRef} className="nx-hdr">
    <span className="nx-hdr__sentinel" ref={sentinelRef} aria-hidden="true" />
    <div className="nx-hdr__bar">
      <div className="nx-hdr__inner">
        <button type="button" className="nx-skip" onClick={skipToContent}>{text.skip}</button>
        <NexuAlphaWordmark href={homeHref} />
        <nav className="nx-nav" aria-label={copy.ui.menu}>
          <ul>
            {primary.map(([label, href]) => <li key={href}><a href={href} {...linkProps(href, navState(href), "header")}>{label}</a></li>)}
            {secondary.length > 0 && <li className="nx-more" ref={moreRef} data-open={moreOpen ? "true" : undefined} data-active={secondaryActive ? "true" : undefined}>
              <button ref={moreBtnRef} type="button" className="nx-more__btn" aria-expanded={moreOpen} aria-controls={moreId} onClick={() => setMoreOpen((v) => !v)}>
                {text.more}<Chevron />
              </button>
              <ul id={moreId} className="nx-more__panel" hidden={!moreOpen}>
                {secondary.map(([label, href]) => <li key={href}><a href={href} onClick={() => setMoreOpen(false)} {...linkProps(href, navState(href), "header")}>{label}</a></li>)}
              </ul>
            </li>}
          </ul>
        </nav>
        <div className="nx-tools">
          <button type="button" className="nx-search" onClick={onSearch} aria-keyshortcuts="Control+K Meta+K">
            <SearchIcon /><span className="nx-search__label">{copy.hero.search}</span><kbd className="nx-search__kbd" aria-hidden="true">⌘K</kbd>
          </button>
          {languageMenu(false)}
        </div>
        <button ref={mobileTriggerRef} className="nx-burger" type="button" aria-expanded={mobileOpen} aria-controls={mobileOpen ? "v2-mobile-menu" : undefined} aria-label={copy.ui.menu} onClick={onMobileToggle}>
          <span className="nx-burger__bars" aria-hidden="true"><i /><i /></span>
        </button>
      </div>
    </div>
  </header>;
}

export function MobileSheet({ copy, nav, homeHref, navState, onClose, onSearch, dialogRef, languageMenu }) {
  return <dialog ref={dialogRef} id="v2-mobile-menu" className="nx-sheet" aria-label={copy.ui.menu} onKeyDown={(event) => event.stopPropagation()}>
    <div className="nx-sheet__top">
      <NexuAlphaWordmark href={homeHref} />
      <button type="button" className="nx-sheet__close" onClick={onClose} aria-label={copy.actions.close}>
        <span className="nx-burger__bars" aria-hidden="true" data-open="true"><i /><i /></span>
      </button>
    </div>
    <nav className="nx-sheet__nav" aria-label={copy.ui.menu}>
      <ul>
        {nav.map(([label, href], index) => <li key={href} style={{ "--i": index }}><a href={href} onClick={onClose} {...linkProps(href, navState(href), "mobile-menu")}>{label}</a></li>)}
      </ul>
    </nav>
    <div className="nx-sheet__tools">
      <button type="button" className="nx-search nx-search--block" onClick={() => onSearch()}>
        <SearchIcon /><span className="nx-search__label">{copy.hero.search}</span>
      </button>
      {languageMenu}
    </div>
  </dialog>;
}
