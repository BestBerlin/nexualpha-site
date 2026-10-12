import React, { useEffect, useId, useRef, useState } from "react";
import { NexuAlphaWordmark } from "../brand/NexuAlphaWordmark";
import { LanguageMenu } from "./LanguageMenu.jsx";
import { shellCopy } from "./shell-copy.js";

const PRIMARY_COUNT = 5; // owner 2026-10-12: exchanges, compare, academy, campaigns, news stay visible

function Chevron() {
  return <svg className="nx-ico nx-chev" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>;
}
// Outline glyph drawn with the same stroke weight as the search icon so it reads as a header control, not a badge.
function TelegramIcon() {
  return <svg className="nx-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M21.2 3.6 2.9 10.7c-.8.3-.8 1 0 1.3l4.6 1.5 1.8 5.6c.2.7.9.8 1.4.4l2.6-2.3 4.7 3.5c.6.4 1.3.1 1.5-.6L22.3 4.6c.2-.8-.4-1.3-1.1-1Z" /><path d="m7.5 13.5 9.8-6.3-7 6.6-.2 3.4" /></svg>;
}
function SearchIcon() {
  return <svg className="nx-ico" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true" focusable="false"><circle cx="7" cy="7" r="4.75" /><path d="m10.5 10.5 3.25 3.25" /></svg>;
}

// Owner 2026-10-12: campaigns are where sign-ups happen, so the campaigns link sparkles (gold shimmer + twinkle,
// static under prefers-reduced-motion) and phones get a compact campaigns chip next to the Telegram icon.
const isCampaignHref = (href) => /\/activities(?:$|[/?#])/.test(href);
const CAMPAIGN_CHIP = { "zh-Hans": "活动", "zh-Hant": "活動", en: "Campaigns", es: "Promos", "pt-BR": "Promoções", fr: "Promos", de: "Aktionen", it: "Promo", ja: "キャンペーン", ko: "이벤트", ru: "Акции", tr: "Kampanyalar", id: "Promo", vi: "Sự kiện", ar: "العروض", ur: "مہمات", uk: "Акції" };

function linkProps(href, state, placement) {
  const telegram = href.includes("/telegram");
  return {
    "data-hot": isCampaignHref(href) ? "campaigns" : undefined,
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
  // Owner 2026-10-10: Telegram is a first-class entry beside search, not an item under "More".
  const telegramItem = nav.find(([, href]) => href.includes("/telegram"));
  const campaignItem = nav.find(([, href]) => isCampaignHref(href));
  const pages = nav.filter((item) => item !== telegramItem);
  const primary = pages.slice(0, PRIMARY_COUNT);
  const secondary = pages.slice(PRIMARY_COUNT);
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
        {campaignItem && <a className="nx-hot-chip" href={campaignItem[1]} data-hot="campaigns" aria-current={navState(campaignItem[1]).current}><span className="nx-hot-chip__star" aria-hidden="true">✦</span>{CAMPAIGN_CHIP[locale] || campaignItem[0]}</a>}
        {telegramItem && <a className="nx-tg nx-tg--compact" href={telegramItem[1]} aria-label={telegramItem[0]} {...linkProps(telegramItem[1], navState(telegramItem[1]), "header-compact")}><TelegramIcon /></a>}
        <div className="nx-tools">
          {telegramItem && <a className="nx-tg" href={telegramItem[1]} {...linkProps(telegramItem[1], navState(telegramItem[1]), "header")}><TelegramIcon /><span className="nx-tg__label">Telegram</span></a>}
          {/* Owner 2026-10-12: the header "搜索平台" box was unused and cluttered the bar — removed. */}
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
      {/* Owner 2026-10-12: search removed from the phone menu too, matching the desktop header. */}
      {languageMenu}
    </div>
  </dialog>;
}
