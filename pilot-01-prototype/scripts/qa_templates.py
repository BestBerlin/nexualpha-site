"""Shared page-template list for the quality sweeps (qa-axe-sweep.py, qa-reduced-motion.py, qa-template-urls.py).

One URL per page template; the article slug is discovered from /news on the target server (the local feed and
production differ). Locale prefixes match the hreflang alternates (en has no prefix; Indonesian is /id-id).
"""
import re
import urllib.request

LOCALE_PREFIX = {
    "en": "", "zh-hans": "/zh-hans", "zh-hant": "/zh-hant", "es": "/es", "pt-br": "/pt-br", "fr": "/fr", "de": "/de",
    "it": "/it", "ja": "/ja", "ko": "/ko", "ru": "/ru", "tr": "/tr", "id": "/id-id", "vi": "/vi", "ar": "/ar",
}
ALL_LOCALES = list(LOCALE_PREFIX)

TEMPLATES = [
    ("home", "/"),
    ("exchanges", "/exchanges"),
    ("venue-okx", "/exchanges/okx"),
    ("venue-hyperliquid", "/exchanges/hyperliquid"),
    ("compare-hub", "/compare"),
    ("compare-pair", "/compare/binance-vs-okx"),
    ("activities", "/activities"),
    ("liquidations", "/liquidations"),
    ("funding-rates", "/funding-rates"),
    ("rates-calculator", "/rates"),
    ("news", "/news"),
    ("article", "/news/{article}"),
    ("topics", "/topics"),
    ("factbook", "/factbook"),
    ("factbook-page", "/factbook/okx"),
    ("about", "/about"),
    ("methodology", "/methodology"),
    ("telegram", "/telegram"),
    ("404", "/this-page-does-not-exist-qa"),
]


def discover_article(base):
    """First article on the server's /news page (falls back to a known slug)."""
    try:
        html = urllib.request.urlopen(base + "/news", timeout=30).read().decode("utf-8", "replace")
        m = re.search(r'href="/news/([a-z0-9-]+)"', html)
        if m:
            return m.group(1)
    except Exception:
        pass
    return "cftc-sec-tokenized-collateral-vs-tokenized-securities-boundary-map"


def select(names=None):
    if not names:
        return TEMPLATES
    wanted = set(names.split(","))
    return [t for t in TEMPLATES if t[0] in wanted]


def page_urls(base, locales, templates=None, article=None):
    article = article or discover_article(base)
    rows = []
    for locale in locales:
        for name, path in templates or TEMPLATES:
            p = path.format(article=article)
            prefix = LOCALE_PREFIX[locale]
            rows.append((name, locale, base + (prefix + p if p != "/" else (prefix or "/"))))
    return rows


if __name__ == "__main__":
    # python3 scripts/qa_templates.py <base_url> [locales|all] > urls.txt  (template x locale list for qa-browser-sweep.py)
    import sys
    base = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "https://nexualpha.com"
    locs = ALL_LOCALES if len(sys.argv) < 3 or sys.argv[2] == "all" else sys.argv[2].split(",")
    for _, _, url in page_urls(base, locs):
        print(url)
