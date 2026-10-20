
  import React from "react";
  import { renderToStaticMarkup } from "react-dom/server";
  import { NewsDetailPage } from "../../src/components/v3/news/NewsDetailPage.jsx";
  import { OnChainLiquidityBoard } from "../../src/components/v3/OnChainLiquidityBoard.jsx";
  import { ExchangeFactsV5 } from "../../src/components/v3/ExchangeFactsV5.jsx";
  import { v3Copy, venueProfile } from "../../src/data/v3-product.js";
  import { venueDatabase } from "../../src/data/venue-database.js";
  import feed from "../../public/content/news-feed.json";
  const source = feed.articles.find((article) => article.slug === "okx-usd-to-usdc-spot-pair-migration");
  const article = { ...source, content: { en: "## Direct answer\n\nOKX lists these stocks. Our framework on [custodial vs synthetic tokenized stocks](/news/custodial-vs-synthetic-tokenized-stocks-shareholder-rights-framework) explains the difference.\n\nDividends follow the issuer; see how Bitget handles its [ACN stock perp](/news/bitget-acn-stock-perp-dividend-settlement-longs-shorts) on 13 Oct.\n\n- Read **the [tokenized stocks vs stock perpetuals](/news/tokenized-stocks-vs-stock-perpetuals) guide** first\n- Check fees (see [/rates](/rates)) and *the [OKX profile](/exchanges/okx)*\n- Unknown target [internal tool](/admin/tools) and script [x](javascript:alert(1))\n\n| Route | Link |\n| --- | --- |\n| Activities | [/activities](/activities) |\n| Funding | [funding rates](/funding-rates) |\n\n> Quote with a [Bybit vs Bitget comparison](/compare/bybit-vs-bitget) inside.\n\nOfficial source: [OKX announcement](https://www.okx.com/help/x). Later OKX and Bitget appear again." }, availableLocales: ["en"] };
  const out = { article: {}, onchain: {}, facts: {}, profiles: {}, resultVenues: { fr: v3Copy("fr").resultVenues(1), es: v3Copy("es").resultVenues(1) } };
  for (const locale of ["en", "ja"]) out.article[locale] = renderToStaticMarkup(React.createElement(NewsDetailPage, { slug: article.slug, locale, initialArticles: [article] }));
  for (const locale of ["en","zh-Hans","zh-Hant","es","pt-BR","fr","de","it","ja","ko","ru","tr","id","vi","ar","ur","uk"]) {
    out.onchain[locale] = renderToStaticMarkup(React.createElement(OnChainLiquidityBoard, { locale, headingLevel: 1 }));
    const venue = { ...venueDatabase.okx, slug: "okx", name: "OKX", category: "CEX" };
    out.facts[locale] = renderToStaticMarkup(React.createElement(ExchangeFactsV5, { slug: "okx", locale, profile: venueProfile(venue, locale) }));
    out.profiles[locale] = Object.entries(venueDatabase).map(([slug, record]) => {
      const profile = venueProfile({ ...record, slug, name: record.name || slug, category: record.category || "CEX" }, locale);
      return { slug, items: [...(profile.checks || []), ...(profile.limitations || [])] };
    });
  }
  console.log(JSON.stringify(out));
