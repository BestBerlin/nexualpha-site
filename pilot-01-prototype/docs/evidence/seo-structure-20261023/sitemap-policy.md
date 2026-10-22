# Sitemap publication evidence

Baseline source: git HEAD `dfdf926f3369fcb9c3ce4530cba6e3701d0b33d1` extracted with `git archive HEAD pilot-01-prototype` into a temporary directory inside this worktree. The baseline helper imported those original modules, then the temporary directory was removed.

Feed snapshot: `2026-10-04T20:46:19.460Z`, 416 normalized articles. This checked-in snapshot is historical; it is not a production feed or GSC measurement.

| Sitemap or generator | Before | After | Change |
|---|---:|---:|---:|
| sitemap-articles-ar.xml | 0 | 0 | +0 |
| sitemap-articles-de.xml | 0 | 0 | +0 |
| sitemap-articles-en.xml | 224 | 224 | +0 |
| sitemap-articles-es.xml | 0 | 0 | +0 |
| sitemap-articles-fr.xml | 0 | 0 | +0 |
| sitemap-articles-id.xml | 0 | 0 | +0 |
| sitemap-articles-it.xml | 0 | 0 | +0 |
| sitemap-articles-ja.xml | 0 | 0 | +0 |
| sitemap-articles-ko.xml | 0 | 0 | +0 |
| sitemap-articles-pt-br.xml | 0 | 0 | +0 |
| sitemap-articles-ru.xml | 0 | 0 | +0 |
| sitemap-articles-tr.xml | 0 | 0 | +0 |
| sitemap-articles-vi.xml | 0 | 0 | +0 |
| sitemap-articles-zh-hans.xml | 224 | 224 | +0 |
| sitemap-articles-zh-hant.xml | 0 | 0 | +0 |
| sitemap-compare.xml | 264 | 132 | -132 |
| sitemap-locales.xml | 118 | 118 | +0 |
| sitemap-topics-tools.xml | 347 | 323 | -24 |
| sitemap-venues.xml | 260 | 260 | +0 |
| academy | 350 | 350 | +0 |
| beginner | 175 | 155 | -20 |
| licenses | 266 | 228 | -38 |
| deposit | 72 | 68 | -4 |
| coins | 1263 | 1263 | +0 |
| dataTools | 17 | 17 | +0 |
| convert | 12 | 12 | +0 |
| glossary | 1620 | 1620 | +0 |
| apps | 85 | 75 | -10 |
| campaigns | 45 | 45 | +0 |
| tokenizedStocks | 470 | 444 | -26 |
| news-sitemap.xml | 0 | 0 | +0 |
| news-library-sitemap.xml | 72 | 4 | -68 |

The JSON files contain locale counts for every row and separate tracked-public XML counts. Generated advertised sitemap URL total is 5,812 -> 5,558 (254 URLs excluded). The legacy `news-library-sitemap.xml` helper (72 -> 4) is not advertised: its public endpoint redirects to the sitemap index. The Google News sitemap remains unadvertised and empty for this historical feed timestamp.

Removed from advertised sitemaps: 44 generated comparison pairs in three editions (132 URLs) that only recombine existing venue records, plus 61 Urdu and 61 Ukrainian editions formerly admitted by per-route locale lists and dedicated sitemap writers. Urdu and Ukrainian sitemap counts are now zero across every generated child sitemap, with their hreflang alternates also excluded. Curated comparisons and reviewed article editions remain eligible. No feed, source facts, or publication volume changed.

Noindex tally: 3559 -> 3691. Scope: Home plus all generated comparisons across UI_LOCALES; count 200/noindex shared SSR metadata only. Article, archive and auxiliary templates are not enumerated. This is a bounded policy count, not a full-site noindex total. The extra 132 noindex editions correspond to the excluded generated comparisons. Urdu/Ukrainian behavior is additionally tested on specialized routes including legal early returns and article editions. The English UK country route remains indexable.

Noindex pages retain follow links. The compare hub links all generated pairs; existing news pagination remains crawlable and self-canonical. Only populated first-page news categories with native article editions enter the news-library helper.

Advertised URL counts by locale (all child sitemap types combined):

| Locale | Before | After |
|---|---:|---:|
| en | 845 | 801 |
| zh-Hans | 824 | 780 |
| zh-Hant | 180 | 136 |
| ar | 124 | 124 |
| de | 129 | 129 |
| es | 519 | 519 |
| fr | 129 | 129 |
| id | 514 | 514 |
| it | 80 | 80 |
| ja | 342 | 342 |
| ko | 343 | 343 |
| pt-BR | 523 | 523 |
| ru | 105 | 105 |
| tr | 519 | 519 |
| vi | 514 | 514 |
| ur | 61 | 0 |
| uk | 61 | 0 |

Reproduce current counts from the app directory:

```sh
/opt/homebrew/opt/node@24/bin/node scripts/seo-structure-counts.mjs
```

Dedicated-child regression (all split and dedicated generators, including URL and hreflang checks):

```sh
/opt/homebrew/opt/node@24/bin/node --test --test-name-pattern='every generated dedicated' pilot-01-prototype/tests/seo-structure-publication.test.mjs
```

This targeted generator assertion passed. The subsequent full build, packaged render tests and complete crawl cover the final correction; see README.md. No deployment was performed.
