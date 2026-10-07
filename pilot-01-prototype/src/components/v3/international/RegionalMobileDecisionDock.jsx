import React from "react";
import { buildAnonymousDecisionResumeQuery } from "../../../data/decision-passport.js";
import { localizedHref } from "../../../data/locale-routing.js";
import { regionalDirectoryHref, regionalToolHref } from "../../../data/regional-directory.js";
import "./regional-mobile-decision-dock.css";

const DOCK_MARKETS = new Set(["JP", "KR", "TR", "MX", "ID"]);

const COPY = {
  en: { directory: "Candidates", compare: "Compare", telegram: "Telegram", select: "Choose candidates" },
  ja: { directory: "候補", compare: "比較", telegram: "Telegram", select: "候補を選ぶ" },
  ko: { directory: "후보", compare: "비교", telegram: "Telegram", select: "후보 선택" },
  tr: { directory: "Adaylar", compare: "Karşılaştır", telegram: "Telegram", select: "Aday seç" },
  es: { directory: "Candidatos", compare: "Comparar", telegram: "Telegram", select: "Elegir candidatos" },
  id: { directory: "Kandidat", compare: "Bandingkan", telegram: "Telegram", select: "Pilih kandidat" },
  "zh-Hans": { directory: "候选", compare: "比较", telegram: "Telegram", select: "选择候选" },
  "zh-Hant": { directory: "候選", compare: "比較", telegram: "Telegram", select: "選擇候選" },
};

function copyFor(locale) {
  const base = String(locale || "en").split("-")[0];
  return COPY[locale] || COPY[base] || COPY.en;
}

function withHash(href, hash) {
  const [base] = String(href || "/").split("#");
  return `${base}${hash}`;
}

export function RegionalMobileDecisionDock({
  locale = "en",
  market = "MX",
  product = "spot",
  accountStage = "new_account",
  funding = "",
  shortlist = {},
} = {}) {
  const normalizedMarket = String(market || "").toUpperCase();
  if (!DOCK_MARKETS.has(normalizedMarket)) return null;

  const text = copyFor(locale);
  const directoryHref = regionalDirectoryHref({ market: normalizedMarket, locale, product, stage: accountStage, funding });
  const hasReviewedPair = Boolean(shortlist?.pair);
  const compareHref = hasReviewedPair
    ? regionalToolHref({ path: `/compare/${shortlist.pair}`, market: normalizedMarket, locale, product, accountStage, funding })
    : withHash(directoryHref, "#exchanges");
  const telegramParams = buildAnonymousDecisionResumeQuery({
    market: normalizedMarket,
    product,
    accountStage,
    funding,
    scenario: hasReviewedPair ? "compare" : "selected",
    ...(hasReviewedPair ? { pair: shortlist.pair } : {}),
  });
  const telegramHref = localizedHref(`/telegram?${telegramParams.toString()}`, { locale });
  const compareLabel = hasReviewedPair ? text.compare : text.select;

  const items = [
    ["directory", text.directory, directoryHref],
    ["compare", compareLabel, compareHref],
    ["telegram", text.telegram, telegramHref],
  ];

  return (
    <nav className="regional-mobile-decision-dock" aria-label={`${normalizedMarket} decision actions`} data-regional-mobile-decision-dock={normalizedMarket}>
      {items.map(([id, label, href]) => (
        <a
          key={id}
          href={href}
          data-cta-kind="research"
          data-cta-placement={`regional-mobile-dock-${id}`}
          data-growth-decision={`regional_mobile_dock_${id}_${normalizedMarket}`}
          data-growth-placement={`regional-mobile-dock-${id}`}
          data-growth-market={normalizedMarket}
          data-growth-product={product}
          data-regional-funding={funding}
          data-regional-compare-mode={id === "compare" ? (hasReviewedPair ? "reviewed-pair" : "select-candidates") : undefined}
        >
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
