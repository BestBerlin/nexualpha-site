import React, { useEffect, useRef, useState } from "react";
import { localizedHref, parsePublicRoute } from "../../data/locale-routing.js";
import { homeCopy } from "../../content/home-copy.js";
import "./mobile-bottom-nav.css";


const MOBILE_BOTTOM_NAV_HEIGHT_VAR = "--mobile-bottom-nav-height";

function readMeasuredHeight(nav) {
  const rect = nav?.getBoundingClientRect?.();
  return Number(rect?.height || 0);
}

function roundedCssPixels(height) {
  const value = Number(height || 0);
  return Number.isFinite(value) && value > 0 ? `${Math.ceil(value)}px` : "";
}

export function syncMobileBottomNavReserve(nav, root = typeof document !== "undefined" ? document.documentElement : null, ResizeObserverClass = typeof ResizeObserver !== "undefined" ? ResizeObserver : null) {
  if (!nav || !root?.style) return () => {};
  const previous = root.style.getPropertyValue(MOBILE_BOTTOM_NAV_HEIGHT_VAR);
  let active = true;
  const applyHeight = (height) => {
    if (!active) return;
    const cssValue = roundedCssPixels(height);
    if (cssValue) root.style.setProperty(MOBILE_BOTTOM_NAV_HEIGHT_VAR, cssValue);
    else if (previous) root.style.setProperty(MOBILE_BOTTOM_NAV_HEIGHT_VAR, previous);
    else root.style.removeProperty(MOBILE_BOTTOM_NAV_HEIGHT_VAR);
  };
  const measure = () => applyHeight(readMeasuredHeight(nav));
  measure();
  let observer = null;
  if (ResizeObserverClass) {
    observer = new ResizeObserverClass(() => {
      measure();
    });
    observer.observe(nav);
  }
  return () => {
    active = false;
    observer?.disconnect?.();
    if (previous) root.style.setProperty(MOBILE_BOTTOM_NAV_HEIGHT_VAR, previous);
    else root.style.removeProperty(MOBILE_BOTTOM_NAV_HEIGHT_VAR);
  };
}

// Current location only; this does not report completed work or platform eligibility.
export function mobileNavCurrentValue(href, currentUrl) {
  if (!currentUrl) return undefined;
  try {
    const current = new URL(currentUrl);
    const target = new URL(href, current);
    if (target.origin !== current.origin) return undefined;
    const currentPath = parsePublicRoute(current.pathname, current.searchParams).contentPathname;
    const targetPath = parsePublicRoute(target.pathname, target.searchParams).contentPathname;
    if (currentPath !== targetPath) return undefined;
    if (target.hash) return current.hash === target.hash ? "location" : undefined;
    return "page";
  } catch {
    return undefined;
  }
}

export function MobileBottomNav({ locale, onSearch, brazil = false }) {
  const [currentUrl, setCurrentUrl] = useState(null);
  const navRef = useRef(null);
  useEffect(() => syncMobileBottomNavReserve(navRef.current), []);

  useEffect(() => {
    const updateLocation = () => setCurrentUrl(window.location.href);
    updateLocation();
    window.addEventListener("hashchange", updateLocation);
    window.addEventListener("popstate", updateLocation);
    return () => {
      window.removeEventListener("hashchange", updateLocation);
      window.removeEventListener("popstate", updateLocation);
    };
  }, [locale, brazil]);
  const isPt = locale === "pt-BR";
  const isZh = locale?.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const labels = {
    ja: { directory:"取引所一覧", calculator:"手数料", campaigns:"キャンペーン", compare:"比較", search:"検索" },
    ko: { directory:"거래소", calculator:"수수료", campaigns:"캠페인", compare:"비교", search:"검색" },
    tr: { directory:"Dizin", calculator:"Ücretler", campaigns:"Kampanyalar", compare:"Karşılaştır", search:"Ara" },
    es: { directory:"Directorio", calculator:"Costes", campaigns:"Campañas", compare:"Comparar", search:"Buscar" },
    fr: { directory:"Annuaire", calculator:"Frais", campaigns:"Campagnes", compare:"Comparer", search:"Rechercher" },
    de: { directory:"Verzeichnis", calculator:"Gebühren", campaigns:"Kampagnen", compare:"Vergleichen", search:"Suchen" },
    ru: { directory:"Каталог", calculator:"Комиссии", campaigns:"Кампании", compare:"Сравнить", search:"Поиск" },
    ar: { directory:"الدليل", calculator:"الرسوم", campaigns:"الحملات", compare:"مقارنة", search:"بحث" },
    id: { directory:"Direktori", calculator:"Biaya", campaigns:"Kampanye", compare:"Bandingkan", search:"Cari" },
    vi: { directory:"Danh mục", calculator:"Phí", campaigns:"Chiến dịch", compare:"So sánh", search:"Tìm kiếm" },
    it: { directory:"Directory", calculator:"Costi", campaigns:"Campagne", compare:"Confronta", search:"Cerca" },
    "pt-BR": { directory:"Corretoras", calculator:"Custos", campaigns:"Campanhas", compare:"Comparar", search:"Buscar" },
    "zh-Hant": { directory:"平台黃頁", calculator:"算返傭", campaigns:"活動雷達", compare:"PK對比", search:"搜尋" },
  }[locale] || ({
    ja: { directory:"取引所一覧", calculator:"手数料", campaigns:"キャンペーン", compare:"比較", search:"検索" },
    ko: { directory:"거래소", calculator:"수수료", campaigns:"캠페인", compare:"비교", search:"검색" },
    tr: { directory:"Dizin", calculator:"Ücretler", campaigns:"Kampanyalar", compare:"Karşılaştır", search:"Ara" },
  }[String(locale || "").split("-")[0]] || {});
  const contextParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const contextMarket = contextParams?.get("market");
  const contextProduct = contextParams?.get("product");
  const linkContext = { locale: locale || "en", market: contextMarket, product: contextProduct };
  const homeHref = (hash) => localizedHref(`/${hash}`, linkContext);
  const routeHref = (path) => localizedHref(path, linkContext);
  const mobileNavCompactLabels = {
    de: { directory: "Börsen", campaigns: "Events", compare: "Vergl." },
    fr: { campaigns: "Évén.", search: "Chercher", compare: "Compar." },
    ru: { calculator: "Комиссии", campaigns: "События", compare: "Сравн." },
    tr: { calculator: "Ücret", campaigns: "Etkinlik", compare: "Kıyas" },
  };
  const compactLabels = mobileNavCompactLabels[locale] || mobileNavCompactLabels[String(locale || "").split("-")[0]] || {};
  const campaignLabel = labels.campaigns || (brazil ? "Conta" : isPt ? "Campanhas" : isHant ? "活動雷達" : isZh ? "活动雷达" : "Campaigns");
  const campaignVisibleLabel = compactLabels.campaigns || (!brazil && !isPt && !isZh && !labels.campaigns ? "Events" : campaignLabel);

  const items = [
    {
      id: "exchanges",
      label: labels.directory || (isPt ? "Corretoras" : isHant ? "平台黃頁" : isZh ? "平台黄页" : "Directory"),
      visibleLabel: compactLabels.directory,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
      href: brazil ? "/br" : routeHref("/exchanges"),
    },
    {
      id: "calculator",
      label: homeCopy(locale === "zh-TW" ? "zh-Hant" : locale === "zh-CN" ? "zh-Hans" : locale).compareDimensionLabels[1],
      visibleLabel: compactLabels.calculator,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="16" y1="14" x2="16" y2="18" />
          <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
        </svg>
      ),
      href: brazil ? "/br/custos" : homeHref("#bleed-analyzer"),
    },
    {
      id: "campaigns",
      label: campaignLabel,
      visibleLabel: campaignVisibleLabel,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m4.93 4.93 4.24 4.24" />
          <path d="m14.83 9.17 4.24-4.24" />
          <path d="m14.83 14.83 4.24 4.24" />
          <path d="m9.17 14.83-4.24 4.24" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      ),
      href: brazil ? "/br/conta" : routeHref("/activities"),
    },
    {
      id: "compare",
      label: labels.compare || (isPt ? "Comparar" : isZh ? "PK对比" : "Compare"),
      visibleLabel: compactLabels.compare,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" />
          <line x1="15" y1="15" x2="21" y2="21" />
          <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
      ),
      href: brazil ? "/br/comparar" : homeHref("#compare"),
    },
    {
      id: "search",
      label: labels.search || (isPt ? "Buscar" : isHant ? "搜尋 ⌘K" : isZh ? "搜索 ⌘K" : "Search"),
      visibleLabel: compactLabels.search,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      action: onSearch,
    },
  ];

  return (
    <nav ref={navRef} className="mobile-bottom-nav" aria-label={labels.search ? `${labels.search} navigation` : isPt ? "Navegação móvel" : isHant ? "行動底部導覽" : "Mobile Bottom Navigation"}>
      <div className="mobile-bottom-nav__inner">
        {items.map((item) => {
          if (item.action) {
            return (
              <button
                key={item.id}
                type="button"
                className="mobile-bottom-nav__item"
                aria-label={item.ariaLabel || item.label}
                onClick={item.action}
                data-cta-kind="research"
                data-cta-placement={`mobile-nav-${item.id}`}
              >
                <span className="mobile-bottom-nav__icon" aria-hidden="true">{item.icon}</span>
                <span className="mobile-bottom-nav__label">{item.visibleLabel || item.label}</span>
              </button>
            );
          }
          return (
            <a
              key={item.id}
              href={item.href}
              aria-current={mobileNavCurrentValue(item.href, currentUrl)}
              aria-label={item.ariaLabel || item.label}
              className="mobile-bottom-nav__item"
              data-cta-kind="research"
              data-cta-placement={`mobile-nav-${item.id}`}
            >
              <span className="mobile-bottom-nav__icon" aria-hidden="true">{item.icon}</span>
              <span className="mobile-bottom-nav__label">{item.visibleLabel || item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
