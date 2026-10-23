// Release gate manifest (release engineering, 2026-10-14). The regression runner (scripts/qa-regression.mjs) reads this
// file; tests/qa-regression-manifest.test.mjs validates its shape so a typo cannot silently drop a check.
//
// Why this exists: ~15 deploys in 48 h shipped with headless-only checks and no real-device regression, and the owner
// saw bugs the smoke never covered (count-up stalling on Android, codes drifting from the registry, "www. x. com" in
// articles). Every entry here is a user-visible promise; the runner fails the deploy when any of them breaks.
//
// Expected values (rebate shares, invite codes, /go targets) are NOT written here: the runner reads them from the same
// data modules the site renders from (home-rebate-tiers.js, partner-registry.js, backup-signup.js), so the gate checks
// "page == registry", never "page == a copy of the registry".

const UA = Object.freeze({
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 15; SM-F956B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
  androidChromeTablet:
    "Mozilla/5.0 (Linux; Android 15; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  macChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
});

// Real user agents and viewports. 344 = Galaxy Z Fold cover screen (the narrowest phone we support), 390 = iPhone,
// 768 = tablet portrait, 884 = Fold inner screen, 1440 = laptop. Widths used by a suite are listed on the suite.
export const DEVICES = Object.freeze([
  { id: "fold-cover-344", width: 344, height: 882, dpr: 2.6, mobile: true, touch: true, ua: UA.androidChrome, family: "android-chrome" },
  { id: "iphone-390", width: 390, height: 844, dpr: 3, mobile: true, touch: true, ua: UA.iphoneSafari, family: "iphone-safari" },
  { id: "tablet-768", width: 768, height: 1024, dpr: 2, mobile: true, touch: true, ua: UA.androidChromeTablet, family: "android-chrome" },
  { id: "fold-open-884", width: 884, height: 1104, dpr: 2.2, mobile: true, touch: true, ua: UA.androidChromeTablet, family: "android-chrome" },
  { id: "mac-1440", width: 1440, height: 900, dpr: 2, mobile: false, touch: false, ua: UA.macChrome, family: "mac-chrome" },
]);

// Owner 2026-10-13: no fine print or commission wording in any page body. The site footer carries the single legal
// disclosure (HomeV7.jsx comment), so the body check excludes `footer`; footer hits are reported, not failed.
export const FINE_PRINT_STRINGS = Object.freeze([
  "已内置邀请码",
  "仅链接官方注册页",
  "部分链接为合作推广链接",
  "不构成投资建议",
  "not financial advice",
]);

export const QA_MANIFEST = Object.freeze({
  version: 1,
  budgets: Object.freeze({
    sectionTimeoutMs: 5000, // every expected section must exist within 5 s of load
    idleJsMsPer5s: 50, // main-thread task time while the page sits idle for 5 s
    cls: 0.1, // Chrome session-window CLS during load + idle
    consoleErrors: 0,
    hydrationErrors: 0,
    navigationTimeoutMs: 45000,
  }),
  home: Object.freeze({
    widths: Object.freeze([344, 390, 768, 1440]),
    // mode "full": rebate desk, codes and /go CTAs are expected. mode "neutral": information-only (locale-policy.js
    // NEUTRAL_CTA_LOCALES) - no codes, no /go, no sponsored links, no desk.
    locales: Object.freeze([
      { code: "zh-Hans", path: "/zh-hans", mode: "full" },
      { code: "en", path: "/", mode: "full" },
      // Owner 2026-10-13 (legal): Bitget is on the SPK list; no Bitget on any tr surface.
      { code: "tr", path: "/tr", mode: "full", forbiddenVenues: Object.freeze(["bitget"]) },
      { code: "ru", path: "/ru", mode: "neutral" },
    ]),
    // Sections rendered on every home (all locales, all widths). Each must be in the DOM within sectionTimeoutMs.
    // Owner 2026-10-14 (PR #243): the flash rail and the hero terminal mockup are gone from home.
    sections: Object.freeze([
      { id: "hero", selector: ".h7 > .h7-hero" },
      { id: "partner-strip", selector: ".h7-strip .h7-pw li" },
      { id: "telegram-strip", selector: ".tg-signal-strip--home" },
      { id: "how", selector: ".h7-how" },
      { id: "academy", selector: ".h7-academy" },
      { id: "data-rail", selector: '[data-testid="home-data-rail"]' },
      { id: "whales", selector: "#h7-whales" },
      { id: "calculator", selector: "#h7-calc" },
      { id: "funding", selector: "#h7-funding" },
      { id: "intel", selector: "#h7-intel" },
      { id: "telegram", selector: ".h7-tg" },
      { id: "close", selector: ".v6-close" },
      { id: "footer", selector: "footer" },
    ]),
    // Only on "full" homes.
    fullSections: Object.freeze([
      { id: "desk", selector: "#h7-desk[data-pick]" },
      { id: "desk-tabs", selector: "#h7-desk .hx-tab" },
      { id: "rebate-figure", selector: "#h7-desk .hx-rate-n" },
      { id: "invite-code", selector: "#h7-desk .hx-code code" },
      { id: "hero-cta", selector: '#h7-desk a.h7-lg-go[href^="/go/"]' },
    ]),
    // Extra sections per locale (e.g. the Türkiye local-market brief).
    localeSections: Object.freeze({
      tr: Object.freeze([{ id: "local-market", selector: '#h7-local[data-local-market="TR"]' }]),
    }),
    selectors: Object.freeze({
      desk: "#h7-desk",
      tabs: "#h7-desk .hx-tab",
      rebateDigits: "#h7-desk .hx-rate-n",
      rebatePercentSign: "#h7-desk .hx-rate-pct", // hero v3: the currency glyph ("$") of the dollar figure
      code: "#h7-desk .hx-code code",
      heroCta: "#h7-desk a.h7-lg-go",
      headline: ".h7-hero h1",
      stripVenue: ".h7-strip .h7-pw li a",
      stripVenueShare: "small",
      brandSlugAttr: "data-brand-slug",
    }),
    finePrint: FINE_PRINT_STRINGS,
    finePrintExcludeSelector: "footer, .h7-dock",
  }),
  exchanges: Object.freeze({
    path: "/zh-hans/exchanges",
    widths: Object.freeze([344, 884, 1440]),
    rowSelector: "td.mx-td--code[data-row-slug]",
    rowSlugAttr: "data-row-slug",
    rowCodeAttr: "data-row-invite-code",
    rowCodeTextSelector: ".mx-code",
    minRowsWithCode: 5,
  }),
  venuePages: Object.freeze({
    width: 390,
    slugs: Object.freeze(["bitget", "okx"]),
    pathFor: "/zh-hans/exchanges/{slug}",
    primaryCtaSelector: ".registration-card a[href]",
    codeSelectors: Object.freeze([
      ".registration-card__code-value",
      ".v3-venue-quick-registration__code strong",
      '.r9-route__stop[data-stop="code"] .r9-route__v',
      "#referral-answer bdi",
    ]),
    // Paths on an exchange host that mean "sign-up"; any anchor pointing at one directly (not via /go) fails.
    directSignupPattern: "(join|register|signup|sign-up|/bg/|ref=|invite|affiliate_id|inviteCode|\\?r=)",
  }),
  rates: Object.freeze({
    path: "/zh-hans/rates",
    width: 344,
    nameSelector: ".ft-venue__name a",
    minNames: 5,
  }),
  news: Object.freeze({
    listPath: "/zh-hans/news",
    width: 390,
    articleLinkSelector: 'a[href^="/zh-hans/news/"]',
    articleHrefPattern: "^/zh-hans/news/(?!category/|tag/|page/|topic/)[a-z0-9][a-z0-9-]+$",
    articleBodySelector: "article",
    // "www. x. com" style breaks (a domain split by spaces after the importer).
    brokenDomainPatterns: Object.freeze([
      "\\bwww\\.\\s+\\S",
      "\\b[a-z0-9-]+\\.\\s+(com|io|net|org|xyz|exchange|finance|cafe|cc)\\b",
    ]),
  }),
  go: Object.freeze({
    // Bot UA: server/go-redirect.mjs BOT_UA skips click recording for it, so the gate never writes fake clicks.
    userAgent: "Mozilla/5.0 (compatible; NexuAlpha-QA-bot/1.0; +https://nexualpha.com/methodology)",
    src: "qa-regression",
    maxHops: 6,
    // Partners with a placeholder code (NEXU_*) never get a /go route (home-rebate-tiers.js gate); the runner derives the
    // slug list from partner-registry.js with this pattern, plus "<venue>-alt" for every mirror in backup-signup.js.
    placeholderCodePattern: "^NEXU_[A-Z0-9]+$",
    includeMirrorRoutes: true,
  }),
});

export function deviceForWidth(width) {
  const device = DEVICES.find((d) => d.width === width);
  if (!device) throw new Error(`qa-regression manifest: no device profile for width ${width}`);
  return device;
}

export default QA_MANIFEST;
