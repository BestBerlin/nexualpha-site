// "<exchange> alternatives" pages (owner exchange keyword plan 2026-10-11, keyword map row 43: "bybit alternatives",
// "bybit competitors", "binance perps alternative" had no home and GSC sent them to /topics/derivatives).
//
// Rules: every figure comes from exchange-facts.js (official fee pages, dated) and every code from the partner feed
// (referral-partners.generated.js); nothing is typed by hand. There is no ranking and no score: the candidates are the
// owner's partner exchanges, listed in a fixed order that the page states is not a ranking, next to the commission
// disclosure. A figure the facts file does not publish reads "not yet checked". Rebate shares are not shown here.
// Indexable in English (the searched language); other locales render translated chrome with noindex, like the
// tokenized-asset cluster.
// l10n: needs native review (ru, id, vi, ar, tr strings below)
import { factsForVenue, feeDisplay, feeFact, feePct, primarySourceUrl, venueCheckedOn } from "./exchange-facts.js";
import { REFERRAL_PARTNERS } from "./referral-partners.generated.js";
import { canonicalComparePairSlug } from "./compare-slug.js";
import { VENUE_ALTERNATIVE_SLUGS } from "./venue-alternative-slugs.js";

export const VENUE_ALTERNATIVES_REVIEWED_AT = "2026-10-11";
export const VENUE_ALTERNATIVES_INDEX_LOCALES = Object.freeze(["en"]);

const NAMES = { bybit: "Bybit", okx: "OKX", bitget: "Bitget", binance: "Binance", hyperliquid: "Hyperliquid", backpack: "Backpack" };
// Account model from the venue registry category: "CEX" = exchange account, "Perp DEX" = wallet-connected protocol.
const MODEL = { bybit: "cex", okx: "cex", bitget: "cex", binance: "cex", hyperliquid: "dex", backpack: "cex" };

export const VENUE_ALTERNATIVE_PAGES = Object.freeze({
  "bybit-alternatives": Object.freeze({
    slug: "bybit-alternatives",
    path: "/topics/bybit-alternatives",
    target: "bybit",
    candidates: Object.freeze(["okx", "bitget", "binance", "hyperliquid", "backpack"]),
    // First-party facts shown under the table, keyed by venue (copy: notes.<slug>).
    notes: Object.freeze(["hyperliquid", "backpack"]),
    noteSources: Object.freeze({
      hyperliquid: "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals",
      backpack: "https://learn.backpack.exchange/articles/what-is-backpack-securities",
    }),
  }),
});

if (Object.keys(VENUE_ALTERNATIVE_PAGES).join() !== VENUE_ALTERNATIVE_SLUGS.join()) {
  throw new Error("venue-alternative-slugs.js is out of sync with VENUE_ALTERNATIVE_PAGES");
}

export function venueAlternativePage(slug) {
  return VENUE_ALTERNATIVE_PAGES[slug] || null;
}

const partnerCode = (slug) => REFERRAL_PARTNERS.find((p) => p.slug === slug)?.inviteCode || null;

/** One row per venue (target first as the reference), built only from the facts file and the partner feed. */
export function venueAlternativeRows(page, locale = "en") {
  return [page.target, ...page.candidates].map((slug) => {
    const facts = factsForVenue(slug);
    return {
      slug,
      name: NAMES[slug] || facts?.name || slug,
      model: MODEL[slug] || "cex",
      reference: slug === page.target,
      spot: feeDisplay(slug, "spot", locale),
      perp: feeDisplay(slug, "perp", locale),
      checkedOn: venueCheckedOn(slug),
      source: primarySourceUrl(slug),
      code: slug === page.target ? null : partnerCode(slug),
      profile: `/exchanges/${slug}`,
      compare: slug === page.target ? null : `/compare/${canonicalComparePairSlug([page.target, slug])}`,
    };
  });
}

/** Lowest checked base perps taker fee among the candidates, compared with the target. Pure arithmetic on the facts. */
export function lowestPerpTaker(page, locale = "en") {
  const rows = page.candidates.map((slug) => ({ slug, f: feeFact(slug, "perp") })).filter(({ f }) => f.state === "checked" && f.taker != null);
  if (!rows.length) return null;
  const min = Math.min(...rows.map(({ f }) => f.taker));
  const target = feeFact(page.target, "perp");
  return {
    names: rows.filter(({ f }) => f.taker === min).map(({ slug }) => NAMES[slug] || slug),
    value: feePct(min, locale),
    target: target.state === "checked" ? feePct(target.taker, locale) : null,
    targetName: NAMES[page.target] || page.target,
    checkedOn: rows.map(({ slug }) => venueCheckedOn(slug)).filter(Boolean).sort().pop() || null,
  };
}

export function candidateNames(page) {
  return page.candidates.map((slug) => NAMES[slug] || slug);
}

const listJoin = (items, locale) => {
  try { return new Intl.ListFormat(locale === "zh-Hans" || locale === "zh-Hant" ? "zh" : locale, { style: "long", type: "conjunction" }).format(items); }
  catch { return items.join(", "); }
};

const COPY = {
  en: {
    title: (t) => `${t} alternatives: fees and sign-up facts`,
    metaTitle: (t) => `${t} Alternatives: Fees Compared from Official Pages`,
    metaDescription: (t, list) => `${t} alternatives compared on fees checked from official pages: ${list}. Not a ranking; partner codes disclosed.`,
    lead: (t) => `Exchanges people compare with ${t}, with the base spot and perpetual fees NexuAlpha has checked on each official fee page.`,
    notRanking: "The order is not a ranking. All five are NexuAlpha partner exchanges, and NexuAlpha may earn a commission when you sign up with a partner code.",
    cols: ["Platform", "Account model", "Spot maker / taker", "Perps maker / taker", "Fees checked", "Partner code", "Next step"],
    cex: "Exchange account",
    dex: "Wallet-connected perps",
    notChecked: "Not yet checked",
    reference: "reference",
    profile: "Profile",
    compare: (t) => `Compare with ${t}`,
    notesTitle: "What else differs",
    notes: {
      hyperliquid: "Hyperliquid's docs: a referral code gives a 4% fee discount on your first $25M in volume (not for vaults or sub-accounts).",
      backpack: "Backpack offers US stocks and ETFs through Backpack Securities, with selected stocks tokenized on Solana (not in the US, UK, UAE, Japan or via Backpack EU). Its spot and perps fees are not yet checked by NexuAlpha.",
    },
    sourceNote: "Base tier fees; VIP tiers, token discounts, staking, funding and spreads change the real cost.",
    faqTitle: "Common questions",
    faq: [
      [(t) => `What are the alternatives to ${t}?`, (t, list) => `This page lists ${list} as ${t} alternatives, with the base fees NexuAlpha has checked on each official fee page. The order is not a ranking: all five are NexuAlpha partners, and their partner codes are disclosed.`],
      [(t) => `Which ${t} alternative has the lowest perpetual fee?`, (t, low) => `At the base tier, the lowest perpetual taker fee in this list is ${low.names.join(" / ")} at ${low.value}${low.target ? ` (${t}: ${low.target})` : ""}, from official fee pages checked ${low.checkedOn}. VIP tiers, token discounts, staking, funding and spreads change the real cost.`],
    ],
    sources: "Fee sources",
  },
  "zh-Hans": {
    title: (t) => `${t} 替代平台：费率与注册事实`,
    metaTitle: (t) => `${t} 替代平台：按官方页面对比费率`,
    metaDescription: (t, list) => `${t} 替代平台费率对比（官方页面核对）：${list}。非排名，合作邀请码已披露。`,
    lead: (t) => `常被拿来与 ${t} 比较的平台，列出 NexuAlpha 在各自官方费率页核对的现货与永续基础费率。`,
    notRanking: "排列顺序不是排名。五家均为 NexuAlpha 合作交易所，使用合作邀请码注册时 NexuAlpha 可能获得佣金。",
    cols: ["平台", "账户类型", "现货 maker / taker", "永续 maker / taker", "费率核对", "合作邀请码", "下一步"],
    cex: "交易所账户",
    dex: "钱包直连永续",
    notChecked: "尚未核对",
    reference: "参照",
    profile: "平台档案",
    compare: (t) => `与 ${t} 对比`,
    notesTitle: "其他差异",
    notes: {
      hyperliquid: "Hyperliquid 官方文档：使用邀请码可在前 2,500 万美元成交量内享受 4% 手续费折扣（不适用于 vault 和子账户）。",
      backpack: "Backpack 通过 Backpack Securities 提供美股和 ETF，部分股票在 Solana 上代币化（不向美国、英国、阿联酋、日本及 Backpack EU 提供）。其现货与永续费率 NexuAlpha 尚未核对。",
    },
    sourceNote: "以上为基础等级费率；VIP 等级、平台币折扣、质押、资金费和点差都会改变实际成本。",
    faqTitle: "常见问题",
    faq: [
      [(t) => `${t} 有哪些替代平台？`, (t, list) => `本页把 ${list} 列为 ${t} 的替代平台，并给出 NexuAlpha 在各自官方费率页核对的基础费率。顺序不是排名：五家均为 NexuAlpha 合作伙伴，合作邀请码已披露。`],
      [(t) => `哪个 ${t} 替代平台的永续费率最低？`, (t, low) => `按基础等级，本列表中永续 taker 费率最低的是 ${low.names.join(" / ")}，为 ${low.value}${low.target ? `（${t}：${low.target}）` : ""}，数据来自 ${low.checkedOn} 核对的官方费率页。VIP 等级、平台币折扣、质押、资金费和点差会改变实际成本。`],
    ],
    sources: "费率来源",
  },
  "zh-Hant": {
    title: (t) => `${t} 替代平台：費率與註冊事實`,
    metaTitle: (t) => `${t} 替代平台：依官方頁面比較費率`,
    metaDescription: (t, list) => `${t} 替代平台費率比較（官方頁面核對）：${list}。非排名，合作關係已揭露。`,
    lead: (t) => `常被拿來與 ${t} 比較的平台，列出 NexuAlpha 在各自官方費率頁核對的現貨與永續基礎費率。`,
    notRanking: "排列順序不是排名。五家均為 NexuAlpha 合作交易所，NexuAlpha 可能因合作關係獲得佣金。",
    cols: ["平台", "帳戶類型", "現貨 maker / taker", "永續 maker / taker", "費率核對", "合作代碼", "下一步"],
    cex: "交易所帳戶",
    dex: "錢包直連永續",
    notChecked: "尚未核對",
    reference: "參照",
    profile: "平台檔案",
    compare: (t) => `與 ${t} 比較`,
    notesTitle: "其他差異",
    notes: {
      hyperliquid: "Hyperliquid 官方文件：推薦碼可在前 2,500 萬美元成交量內提供 4% 手續費折扣（不適用於 vault 和子帳戶）。",
      backpack: "Backpack 透過 Backpack Securities 提供美股和 ETF，部分股票在 Solana 上代幣化（不向美國、英國、阿聯酋、日本及 Backpack EU 提供）。其現貨與永續費率 NexuAlpha 尚未核對。",
    },
    sourceNote: "以上為基礎等級費率；VIP 等級、平台幣折扣、質押、資金費和點差都會改變實際成本。",
    faqTitle: "常見問題",
    faq: [
      [(t) => `${t} 有哪些替代平台？`, (t, list) => `本頁把 ${list} 列為 ${t} 的替代平台，並列出 NexuAlpha 在各自官方費率頁核對的基礎費率。順序不是排名：五家均為 NexuAlpha 合作夥伴，合作關係已揭露。`],
      [(t) => `哪個 ${t} 替代平台的永續費率最低？`, (t, low) => `依基礎等級，本列表中永續 taker 費率最低的是 ${low.names.join(" / ")}，為 ${low.value}${low.target ? `（${t}：${low.target}）` : ""}，資料來自 ${low.checkedOn} 核對的官方費率頁。VIP 等級、平台幣折扣、質押、資金費和點差會改變實際成本。`],
    ],
    sources: "費率來源",
  },
  es: {
    title: (t) => `Alternativas a ${t}: comisiones y datos de registro`,
    metaTitle: (t) => `Alternativas a ${t}: comisiones según páginas oficiales`,
    metaDescription: (t, list) => `Alternativas a ${t} con comisiones verificadas en páginas oficiales: ${list}. No es un ranking; códigos de socio divulgados.`,
    lead: (t) => `Exchanges que se comparan con ${t}, con las comisiones base spot y de perpetuos que NexuAlpha verificó en cada página oficial.`,
    notRanking: "El orden no es un ranking. Los cinco son exchanges socios de NexuAlpha, que puede recibir una comisión si te registras con un código de socio.",
    cols: ["Plataforma", "Tipo de cuenta", "Spot maker / taker", "Perpetuos maker / taker", "Comisiones verificadas", "Código de socio", "Siguiente paso"],
    cex: "Cuenta en exchange",
    dex: "Perpetuos con wallet",
    notChecked: "Aún sin verificar",
    reference: "referencia",
    profile: "Perfil",
    compare: (t) => `Comparar con ${t}`,
    notesTitle: "Otras diferencias",
    notes: {
      hyperliquid: "Documentación de Hyperliquid: un código de referido da un 4% de descuento en comisiones durante los primeros 25 M$ de volumen (no en vaults ni subcuentas).",
      backpack: "Backpack ofrece acciones y ETF de EE. UU. con Backpack Securities, con algunas acciones tokenizadas en Solana (no en EE. UU., Reino Unido, EAU, Japón ni vía Backpack EU). NexuAlpha aún no verificó sus comisiones spot y de perpetuos.",
    },
    sourceNote: "Comisiones del nivel base; niveles VIP, descuentos con token, staking, funding y spread cambian el coste real.",
    faqTitle: "Preguntas frecuentes",
    faq: [
      [(t) => `¿Qué alternativas hay a ${t}?`, (t, list) => `Esta página lista ${list} como alternativas a ${t}, con las comisiones base que NexuAlpha verificó en cada página oficial. El orden no es un ranking: los cinco son socios de NexuAlpha y sus códigos están divulgados.`],
      [(t) => `¿Qué alternativa a ${t} tiene la comisión de perpetuos más baja?`, (t, low) => `En el nivel base, la comisión taker de perpetuos más baja de esta lista es la de ${low.names.join(" / ")}, ${low.value}${low.target ? ` (${t}: ${low.target})` : ""}, según páginas oficiales verificadas el ${low.checkedOn}. Niveles VIP, descuentos, staking, funding y spread cambian el coste real.`],
    ],
    sources: "Fuentes de comisiones",
  },
  "pt-BR": {
    title: (t) => `Alternativas à ${t}: taxas e dados de cadastro`,
    metaTitle: (t) => `Alternativas à ${t}: taxas pelas páginas oficiais`,
    metaDescription: (t, list) => `Alternativas à ${t} com taxas conferidas em páginas oficiais: ${list}. Não é ranking; códigos de parceiro divulgados.`,
    lead: (t) => `Corretoras comparadas com a ${t}, com as taxas base de spot e perpétuos que a NexuAlpha conferiu em cada página oficial.`,
    notRanking: "A ordem não é um ranking. As cinco são corretoras parceiras da NexuAlpha, que pode receber comissão quando você se cadastra com um código de parceiro.",
    cols: ["Plataforma", "Tipo de conta", "Spot maker / taker", "Perpétuos maker / taker", "Taxas conferidas", "Código de parceiro", "Próximo passo"],
    cex: "Conta em corretora",
    dex: "Perpétuos via carteira",
    notChecked: "Ainda não conferido",
    reference: "referência",
    profile: "Perfil",
    compare: (t) => `Comparar com a ${t}`,
    notesTitle: "Outras diferenças",
    notes: {
      hyperliquid: "Documentação da Hyperliquid: um código de indicação dá 4% de desconto nas taxas nos primeiros US$ 25 milhões de volume (não vale para vaults nem subcontas).",
      backpack: "A Backpack oferece ações e ETFs dos EUA pela Backpack Securities, com algumas ações tokenizadas na Solana (fora de EUA, Reino Unido, EAU, Japão e Backpack EU). A NexuAlpha ainda não conferiu suas taxas de spot e perpétuos.",
    },
    sourceNote: "Taxas do nível base; níveis VIP, descontos com token, staking, funding e spread mudam o custo real.",
    faqTitle: "Perguntas frequentes",
    faq: [
      [(t) => `Quais são as alternativas à ${t}?`, (t, list) => `Esta página lista ${list} como alternativas à ${t}, com as taxas base que a NexuAlpha conferiu em cada página oficial. A ordem não é um ranking: as cinco são parceiras da NexuAlpha e os códigos estão divulgados.`],
      [(t) => `Qual alternativa à ${t} tem a menor taxa de perpétuos?`, (t, low) => `No nível base, a menor taxa taker de perpétuos desta lista é a da ${low.names.join(" / ")}, ${low.value}${low.target ? ` (${t}: ${low.target})` : ""}, conforme páginas oficiais conferidas em ${low.checkedOn}. Níveis VIP, descontos, staking, funding e spread mudam o custo real.`],
    ],
    sources: "Fontes das taxas",
  },
  fr: {
    title: (t) => `Alternatives à ${t} : frais et inscription`,
    metaTitle: (t) => `Alternatives à ${t} : frais selon les pages officielles`,
    metaDescription: (t, list) => `Alternatives à ${t} avec frais vérifiés sur les pages officielles : ${list}. Pas un classement ; codes partenaires signalés.`,
    lead: (t) => `Les plateformes comparées à ${t}, avec les frais de base spot et perpétuels que NexuAlpha a vérifiés sur chaque page officielle.`,
    notRanking: "L’ordre n’est pas un classement. Les cinq sont des plateformes partenaires de NexuAlpha, qui peut percevoir une commission si vous vous inscrivez avec un code partenaire.",
    cols: ["Plateforme", "Type de compte", "Spot maker / taker", "Perpétuels maker / taker", "Frais vérifiés", "Code partenaire", "Étape suivante"],
    cex: "Compte sur plateforme",
    dex: "Perpétuels via wallet",
    notChecked: "Pas encore vérifié",
    reference: "référence",
    profile: "Profil",
    compare: (t) => `Comparer avec ${t}`,
    notesTitle: "Autres différences",
    notes: {
      hyperliquid: "Documentation Hyperliquid : un code de parrainage donne 4 % de réduction sur les frais pour les premiers 25 M$ de volume (hors vaults et sous-comptes).",
      backpack: "Backpack propose des actions et ETF américains via Backpack Securities, certaines tokenisées sur Solana (pas aux États-Unis, au Royaume-Uni, aux EAU, au Japon ni via Backpack EU). Ses frais spot et perpétuels ne sont pas encore vérifiés par NexuAlpha.",
    },
    sourceNote: "Frais du palier de base ; paliers VIP, réductions en jeton, staking, funding et spread changent le coût réel.",
    faqTitle: "Questions fréquentes",
    faq: [
      [(t) => `Quelles sont les alternatives à ${t} ?`, (t, list) => `Cette page présente ${list} comme alternatives à ${t}, avec les frais de base vérifiés par NexuAlpha sur chaque page officielle. L’ordre n’est pas un classement : les cinq sont partenaires de NexuAlpha et leurs codes sont signalés.`],
      [(t) => `Quelle alternative à ${t} a les frais de perpétuels les plus bas ?`, (t, low) => `Au palier de base, les frais taker perpétuels les plus bas de cette liste sont ceux de ${low.names.join(" / ")}, ${low.value}${low.target ? ` (${t} : ${low.target})` : ""}, d’après les pages officielles vérifiées le ${low.checkedOn}. Paliers VIP, réductions, staking, funding et spread changent le coût réel.`],
    ],
    sources: "Sources des frais",
  },
  de: {
    title: (t) => `${t}-Alternativen: Gebühren und Anmeldung`,
    metaTitle: (t) => `${t}-Alternativen: Gebühren laut offiziellen Seiten`,
    metaDescription: (t, list) => `${t}-Alternativen mit auf offiziellen Seiten geprüften Gebühren: ${list}. Kein Ranking; Partnercodes offengelegt.`,
    lead: (t) => `Plattformen, die mit ${t} verglichen werden, mit den Basisgebühren für Spot und Perpetuals, die NexuAlpha auf der jeweiligen offiziellen Gebührenseite geprüft hat.`,
    notRanking: "Die Reihenfolge ist kein Ranking. Alle fünf sind Partnerbörsen von NexuAlpha; NexuAlpha kann eine Provision erhalten, wenn Sie sich mit einem Partnercode anmelden.",
    cols: ["Plattform", "Kontomodell", "Spot Maker / Taker", "Perps Maker / Taker", "Gebühren geprüft", "Partnercode", "Nächster Schritt"],
    cex: "Börsenkonto",
    dex: "Perps über Wallet",
    notChecked: "Noch nicht geprüft",
    reference: "Referenz",
    profile: "Profil",
    compare: (t) => `Mit ${t} vergleichen`,
    notesTitle: "Weitere Unterschiede",
    notes: {
      hyperliquid: "Hyperliquid-Dokumentation: Ein Empfehlungscode gibt 4 % Gebührenrabatt auf die ersten 25 Mio. $ Volumen (nicht für Vaults oder Unterkonten).",
      backpack: "Backpack bietet US-Aktien und ETFs über Backpack Securities an, ausgewählte Aktien tokenisiert auf Solana (nicht in USA, UK, VAE, Japan oder über Backpack EU). Spot- und Perps-Gebühren sind von NexuAlpha noch nicht geprüft.",
    },
    sourceNote: "Basisstufe; VIP-Stufen, Token-Rabatte, Staking, Funding und Spreads verändern die echten Kosten.",
    faqTitle: "Häufige Fragen",
    faq: [
      [(t) => `Welche Alternativen gibt es zu ${t}?`, (t, list) => `Diese Seite nennt ${list} als Alternativen zu ${t}, mit den Basisgebühren, die NexuAlpha auf den offiziellen Gebührenseiten geprüft hat. Die Reihenfolge ist kein Ranking: Alle fünf sind NexuAlpha-Partner, die Partnercodes sind offengelegt.`],
      [(t) => `Welche ${t}-Alternative hat die niedrigste Perpetual-Gebühr?`, (t, low) => `In der Basisstufe hat ${low.names.join(" / ")} mit ${low.value} die niedrigste Perps-Taker-Gebühr dieser Liste${low.target ? ` (${t}: ${low.target})` : ""}, laut offiziellen Seiten, geprüft am ${low.checkedOn}. VIP-Stufen, Rabatte, Staking, Funding und Spreads verändern die echten Kosten.`],
    ],
    sources: "Gebührenquellen",
  },
  it: {
    title: (t) => `Alternative a ${t}: commissioni e iscrizione`,
    metaTitle: (t) => `Alternative a ${t}: commissioni dalle pagine ufficiali`,
    metaDescription: (t, list) => `Alternative a ${t} con commissioni verificate sulle pagine ufficiali: ${list}. Non è una classifica; codici partner dichiarati.`,
    lead: (t) => `Piattaforme confrontate con ${t}, con le commissioni base spot e perpetual che NexuAlpha ha verificato su ogni pagina ufficiale.`,
    notRanking: "L'ordine non è una classifica. Sono tutte e cinque exchange partner di NexuAlpha, che può ricevere una commissione se ti iscrivi con un codice partner.",
    cols: ["Piattaforma", "Tipo di conto", "Spot maker / taker", "Perps maker / taker", "Commissioni verificate", "Codice partner", "Passo successivo"],
    cex: "Conto exchange",
    dex: "Perps via wallet",
    notChecked: "Non ancora verificato",
    reference: "riferimento",
    profile: "Profilo",
    compare: (t) => `Confronta con ${t}`,
    notesTitle: "Altre differenze",
    notes: {
      hyperliquid: "Documentazione Hyperliquid: un codice referral dà il 4% di sconto sulle commissioni per i primi 25 M$ di volume (non per vault e subaccount).",
      backpack: "Backpack offre azioni ed ETF USA tramite Backpack Securities, con alcune azioni tokenizzate su Solana (non in USA, Regno Unito, EAU, Giappone o tramite Backpack EU). Le commissioni spot e perps non sono ancora verificate da NexuAlpha.",
    },
    sourceNote: "Commissioni del livello base; livelli VIP, sconti in token, staking, funding e spread cambiano il costo reale.",
    faqTitle: "Domande frequenti",
    faq: [
      [(t) => `Quali sono le alternative a ${t}?`, (t, list) => `Questa pagina elenca ${list} come alternative a ${t}, con le commissioni base verificate da NexuAlpha su ogni pagina ufficiale. L'ordine non è una classifica: sono tutti partner di NexuAlpha e i codici sono dichiarati.`],
      [(t) => `Quale alternativa a ${t} ha la commissione perpetual più bassa?`, (t, low) => `Al livello base, la commissione taker perpetual più bassa dell'elenco è quella di ${low.names.join(" / ")}, ${low.value}${low.target ? ` (${t}: ${low.target})` : ""}, secondo pagine ufficiali verificate il ${low.checkedOn}. Livelli VIP, sconti, staking, funding e spread cambiano il costo reale.`],
    ],
    sources: "Fonti delle commissioni",
  },
  ja: {
    title: (t) => `${t} の代替プラットフォーム：手数料と登録情報`,
    metaTitle: (t) => `${t} の代替：公式ページで手数料を比較`,
    metaDescription: (t, list) => `${t} の代替を公式ページで確認した手数料で比較：${list}。ランキングではありません。提携を開示。`,
    lead: (t) => `${t} と比較されるプラットフォームについて、NexuAlpha が各公式手数料ページで確認した現物・無期限先物の基本手数料を示します。`,
    notRanking: "並び順はランキングではありません。5社はいずれも NexuAlpha の提携先で、NexuAlpha は提携により手数料を受け取る場合があります。",
    cols: ["プラットフォーム", "口座の種類", "現物 maker / taker", "先物 maker / taker", "手数料確認日", "提携コード", "次のステップ"],
    cex: "取引所口座",
    dex: "ウォレット接続の先物",
    notChecked: "未確認",
    reference: "基準",
    profile: "プロフィール",
    compare: (t) => `${t} と比較`,
    notesTitle: "その他の違い",
    notes: {
      hyperliquid: "Hyperliquid 公式ドキュメント：紹介コードで最初の2,500万ドルの出来高まで手数料が4%割引（vault とサブアカウントは対象外）。",
      backpack: "Backpack は Backpack Securities で米国株と ETF を提供し、一部は Solana 上でトークン化されています（米国・英国・UAE・日本・Backpack EU では提供なし）。現物・先物手数料は NexuAlpha 未確認です。",
    },
    sourceNote: "基本ティアの手数料です。VIP ティア、トークン割引、ステーキング、資金調達料、スプレッドで実際のコストは変わります。",
    faqTitle: "よくある質問",
    faq: [
      [(t) => `${t} の代替にはどこがありますか？`, (t, list) => `このページでは ${list} を ${t} の代替として、NexuAlpha が各公式手数料ページで確認した基本手数料とともに示しています。並び順はランキングではなく、5社とも NexuAlpha の提携先です。`],
      [(t) => `${t} の代替で無期限先物の手数料が最も低いのは？`, (t, low) => `基本ティアでは、この一覧で先物 taker 手数料が最も低いのは ${low.names.join(" / ")} の ${low.value}${low.target ? `（${t}：${low.target}）` : ""}です（${low.checkedOn} 確認の公式ページ）。VIP、割引、ステーキング、資金調達料、スプレッドで実コストは変わります。`],
    ],
    sources: "手数料の出典",
  },
  ko: {
    title: (t) => `${t} 대안 플랫폼: 수수료와 가입 정보`,
    metaTitle: (t) => `${t} 대안: 공식 페이지 기준 수수료 비교`,
    metaDescription: (t, list) => `공식 페이지에서 확인한 수수료로 본 ${t} 대안: ${list}. 순위가 아니며 제휴를 공개합니다.`,
    lead: (t) => `${t}와 자주 비교되는 플랫폼과, NexuAlpha가 각 공식 수수료 페이지에서 확인한 현물·무기한 기본 수수료입니다.`,
    notRanking: "나열 순서는 순위가 아닙니다. 다섯 곳 모두 NexuAlpha 제휴 거래소이며, NexuAlpha는 제휴로 수수료를 받을 수 있습니다.",
    cols: ["플랫폼", "계정 유형", "현물 maker / taker", "선물 maker / taker", "수수료 확인", "제휴 코드", "다음 단계"],
    cex: "거래소 계정",
    dex: "지갑 연결 선물",
    notChecked: "미확인",
    reference: "기준",
    profile: "프로필",
    compare: (t) => `${t}와 비교`,
    notesTitle: "그 밖의 차이",
    notes: {
      hyperliquid: "Hyperliquid 공식 문서: 추천 코드로 처음 2,500만 달러 거래량까지 수수료 4% 할인(vault·하위 계정 제외).",
      backpack: "Backpack은 Backpack Securities로 미국 주식과 ETF를 제공하며 일부는 Solana에서 토큰화됩니다(미국·영국·UAE·일본·Backpack EU 제외). 현물·선물 수수료는 NexuAlpha가 아직 확인하지 않았습니다.",
    },
    sourceNote: "기본 등급 수수료입니다. VIP 등급, 토큰 할인, 스테이킹, 펀딩, 스프레드에 따라 실제 비용이 달라집니다.",
    faqTitle: "자주 묻는 질문",
    faq: [
      [(t) => `${t}의 대안은 무엇인가요?`, (t, list) => `이 페이지는 ${list}를 ${t}의 대안으로, NexuAlpha가 각 공식 수수료 페이지에서 확인한 기본 수수료와 함께 보여 줍니다. 순서는 순위가 아니며 다섯 곳 모두 NexuAlpha 제휴사입니다.`],
      [(t) => `${t} 대안 중 무기한 선물 수수료가 가장 낮은 곳은?`, (t, low) => `기본 등급 기준 이 목록에서 선물 taker 수수료가 가장 낮은 곳은 ${low.names.join(" / ")}(${low.value})입니다${low.target ? ` (${t}: ${low.target})` : ""}. ${low.checkedOn}에 확인한 공식 페이지 기준이며, VIP·할인·스테이킹·펀딩·스프레드로 실제 비용이 달라집니다.`],
    ],
    sources: "수수료 출처",
  },
  ru: {
    title: (t) => `Альтернативы ${t}: комиссии и регистрация`,
    metaTitle: (t) => `Альтернативы ${t}: комиссии по официальным страницам`,
    metaDescription: (t, list) => `Альтернативы ${t} с комиссиями, проверенными на официальных страницах: ${list}. Не рейтинг; партнёрство раскрыто.`,
    lead: (t) => `Площадки, которые сравнивают с ${t}, и базовые комиссии спота и бессрочных контрактов, проверенные NexuAlpha на официальных страницах.`,
    notRanking: "Порядок не является рейтингом. Все пять — партнёрские биржи NexuAlpha; NexuAlpha может получать комиссию от партнёров.",
    cols: ["Площадка", "Тип аккаунта", "Спот maker / taker", "Perps maker / taker", "Комиссии проверены", "Партнёрский код", "Дальше"],
    cex: "Биржевой аккаунт",
    dex: "Perps через кошелёк",
    notChecked: "Ещё не проверено",
    reference: "ориентир",
    profile: "Профиль",
    compare: (t) => `Сравнить с ${t}`,
    notesTitle: "Другие отличия",
    notes: {
      hyperliquid: "Документация Hyperliquid: реферальный код даёт скидку 4% на комиссии для первых $25 млн объёма (не для vault и субсчетов).",
      backpack: "Backpack предлагает акции и ETF США через Backpack Securities, часть акций токенизирована в Solana (не в США, Великобритании, ОАЭ, Японии и не через Backpack EU). Комиссии спота и perps NexuAlpha ещё не проверила.",
    },
    sourceNote: "Базовый уровень; VIP-уровни, скидки за токен, стейкинг, фандинг и спред меняют реальную стоимость.",
    faqTitle: "Частые вопросы",
    faq: [
      [(t) => `Какие есть альтернативы ${t}?`, (t, list) => `На этой странице как альтернативы ${t} указаны ${list} с базовыми комиссиями, проверенными NexuAlpha на официальных страницах. Порядок не рейтинг: все пять — партнёры NexuAlpha, партнёрство раскрыто.`],
      [(t) => `У какой альтернативы ${t} самая низкая комиссия по бессрочным контрактам?`, (t, low) => `На базовом уровне самая низкая taker-комиссия perps в списке у ${low.names.join(" / ")}: ${low.value}${low.target ? ` (${t}: ${low.target})` : ""}, по официальным страницам, проверенным ${low.checkedOn}. VIP-уровни, скидки, стейкинг, фандинг и спред меняют реальную стоимость.`],
    ],
    sources: "Источники комиссий",
  },
  tr: {
    title: (t) => `${t} alternatifleri: ücretler ve kayıt bilgileri`,
    metaTitle: (t) => `${t} Alternatifleri: Resmî Sayfalara Göre Ücretler`,
    metaDescription: (t, list) => `Resmî sayfalarda kontrol edilen ücretlerle ${t} alternatifleri: ${list}. Sıralama değildir; ortaklık açıklanır.`,
    lead: (t) => `${t} ile karşılaştırılan platformlar ve NexuAlpha'nın her resmî ücret sayfasında kontrol ettiği temel spot ve vadeli ücretler.`,
    notRanking: "Sıra bir sıralama değildir. Beşi de NexuAlpha'nın ortak borsalarıdır; NexuAlpha ortaklık kapsamında komisyon alabilir.",
    cols: ["Platform", "Hesap türü", "Spot maker / taker", "Vadeli maker / taker", "Ücret kontrolü", "Ortaklık kodu", "Sonraki adım"],
    cex: "Borsa hesabı",
    dex: "Cüzdanla vadeli",
    notChecked: "Henüz kontrol edilmedi",
    reference: "referans",
    profile: "Profil",
    compare: (t) => `${t} ile karşılaştır`,
    notesTitle: "Diğer farklar",
    notes: {
      hyperliquid: "Hyperliquid dokümanları: referans kodu, ilk 25 milyon $ hacimde ücretlerde %4 indirim sağlar (vault ve alt hesaplar hariç).",
      backpack: "Backpack, Backpack Securities ile ABD hisseleri ve ETF'ler sunar; seçili hisseler Solana'da tokenleştirilmiştir (ABD, Birleşik Krallık, BAE, Japonya ve Backpack EU hariç). Spot ve vadeli ücretleri NexuAlpha henüz kontrol etmedi.",
    },
    sourceNote: "Temel kademe ücretleri; VIP kademeleri, token indirimleri, staking, fonlama ve spread gerçek maliyeti değiştirir.",
    faqTitle: "Sık sorulan sorular",
    faq: [
      [(t) => `${t} alternatifleri nelerdir?`, (t, list) => `Bu sayfa ${list} platformlarını ${t} alternatifi olarak, NexuAlpha'nın resmî ücret sayfalarında kontrol ettiği temel ücretlerle listeler. Sıra bir sıralama değildir: beşi de NexuAlpha ortağıdır ve ortaklık açıklanmıştır.`],
      [(t) => `En düşük vadeli ücreti olan ${t} alternatifi hangisi?`, (t, low) => `Temel kademede bu listedeki en düşük vadeli taker ücreti ${low.names.join(" / ")} için ${low.value}${low.target ? ` (${t}: ${low.target})` : ""}; ${low.checkedOn} tarihinde kontrol edilen resmî sayfalara göre. VIP, indirimler, staking, fonlama ve spread gerçek maliyeti değiştirir.`],
    ],
    sources: "Ücret kaynakları",
  },
  id: {
    title: (t) => `Alternatif ${t}: biaya dan info pendaftaran`,
    metaTitle: (t) => `Alternatif ${t}: Biaya Menurut Halaman Resmi`,
    metaDescription: (t, list) => `Alternatif ${t} dengan biaya yang dicek di halaman resmi: ${list}. Bukan peringkat; kode mitra diungkapkan.`,
    lead: (t) => `Platform yang sering dibandingkan dengan ${t}, beserta biaya dasar spot dan perpetual yang dicek NexuAlpha di setiap halaman biaya resmi.`,
    notRanking: "Urutan ini bukan peringkat. Kelimanya adalah bursa mitra NexuAlpha, dan NexuAlpha dapat menerima komisi jika Anda mendaftar dengan kode mitra.",
    cols: ["Platform", "Jenis akun", "Spot maker / taker", "Perps maker / taker", "Biaya dicek", "Kode mitra", "Langkah berikut"],
    cex: "Akun bursa",
    dex: "Perps lewat dompet",
    notChecked: "Belum dicek",
    reference: "acuan",
    profile: "Profil",
    compare: (t) => `Bandingkan dengan ${t}`,
    notesTitle: "Perbedaan lain",
    notes: {
      hyperliquid: "Dokumentasi Hyperliquid: kode referral memberi diskon biaya 4% untuk volume US$25 juta pertama (tidak untuk vault atau subakun).",
      backpack: "Backpack menawarkan saham dan ETF AS lewat Backpack Securities, sebagian saham ditokenisasi di Solana (tidak di AS, Inggris, UEA, Jepang, atau lewat Backpack EU). Biaya spot dan perps-nya belum dicek NexuAlpha.",
    },
    sourceNote: "Biaya tingkat dasar; tingkat VIP, diskon token, staking, funding, dan spread mengubah biaya sebenarnya.",
    faqTitle: "Pertanyaan umum",
    faq: [
      [(t) => `Apa saja alternatif ${t}?`, (t, list) => `Halaman ini mencantumkan ${list} sebagai alternatif ${t}, dengan biaya dasar yang dicek NexuAlpha di setiap halaman biaya resmi. Urutannya bukan peringkat: kelimanya mitra NexuAlpha dan kodenya diungkapkan.`],
      [(t) => `Alternatif ${t} mana yang biaya perpetual-nya paling rendah?`, (t, low) => `Pada tingkat dasar, biaya taker perpetual terendah di daftar ini adalah ${low.names.join(" / ")} sebesar ${low.value}${low.target ? ` (${t}: ${low.target})` : ""}, menurut halaman resmi yang dicek ${low.checkedOn}. VIP, diskon, staking, funding, dan spread mengubah biaya sebenarnya.`],
    ],
    sources: "Sumber biaya",
  },
  vi: {
    title: (t) => `Sàn thay thế ${t}: phí và thông tin đăng ký`,
    metaTitle: (t) => `Sàn thay thế ${t}: so sánh phí theo trang chính thức`,
    metaDescription: (t, list) => `Sàn thay thế ${t} với phí kiểm tra trên trang chính thức: ${list}. Không phải xếp hạng; có công bố đối tác.`,
    lead: (t) => `Các sàn thường được so với ${t}, kèm phí cơ bản spot và perpetual mà NexuAlpha đã kiểm tra trên từng trang phí chính thức.`,
    notRanking: "Thứ tự không phải xếp hạng. Cả năm đều là sàn đối tác của NexuAlpha, và NexuAlpha có thể nhận hoa hồng khi bạn đăng ký bằng mã đối tác.",
    cols: ["Nền tảng", "Loại tài khoản", "Spot maker / taker", "Perp maker / taker", "Phí đã kiểm tra", "Mã đối tác", "Bước tiếp theo"],
    cex: "Tài khoản sàn",
    dex: "Perp qua ví",
    notChecked: "Chưa kiểm tra",
    reference: "tham chiếu",
    profile: "Hồ sơ",
    compare: (t) => `So sánh với ${t}`,
    notesTitle: "Khác biệt khác",
    notes: {
      hyperliquid: "Tài liệu Hyperliquid: mã giới thiệu giảm 4% phí cho 25 triệu USD khối lượng đầu tiên (không áp dụng cho vault và tài khoản phụ).",
      backpack: "Backpack cung cấp cổ phiếu và ETF Mỹ qua Backpack Securities, một số cổ phiếu được token hóa trên Solana (không có tại Mỹ, Anh, UAE, Nhật Bản hoặc qua Backpack EU). NexuAlpha chưa kiểm tra phí spot và perp của sàn này.",
    },
    sourceNote: "Phí cấp cơ bản; cấp VIP, giảm giá bằng token, staking, funding và chênh lệch giá làm thay đổi chi phí thực.",
    faqTitle: "Câu hỏi thường gặp",
    faq: [
      [(t) => `Có những sàn nào thay thế ${t}?`, (t, list) => `Trang này liệt kê ${list} là các sàn thay thế ${t}, kèm phí cơ bản mà NexuAlpha đã kiểm tra trên từng trang phí chính thức. Thứ tự không phải xếp hạng: cả năm đều là đối tác của NexuAlpha và mã đối tác được công bố.`],
      [(t) => `Sàn thay thế ${t} nào có phí perpetual thấp nhất?`, (t, low) => `Ở cấp cơ bản, phí taker perpetual thấp nhất trong danh sách là ${low.names.join(" / ")} với ${low.value}${low.target ? ` (${t}: ${low.target})` : ""}, theo trang chính thức kiểm tra ngày ${low.checkedOn}. Cấp VIP, giảm giá, staking, funding và chênh lệch giá làm thay đổi chi phí thực.`],
    ],
    sources: "Nguồn phí",
  },
  ar: {
    title: (t) => `بدائل ${t}: الرسوم ومعلومات التسجيل`,
    metaTitle: (t) => `بدائل ${t}: مقارنة الرسوم من الصفحات الرسمية`,
    metaDescription: (t, list) => `بدائل ${t} برسوم رُوجعت في الصفحات الرسمية: ${list}. ليس تصنيفًا؛ الشراكة مُفصح عنها.`,
    lead: (t) => `منصات تُقارن مع ${t}، مع الرسوم الأساسية للتداول الفوري والعقود الدائمة التي راجعتها NexuAlpha في كل صفحة رسوم رسمية.`,
    notRanking: "الترتيب ليس تصنيفًا. المنصات الخمس كلها شريكة لـ NexuAlpha، وقد تحصل NexuAlpha على عمولة من الشركاء.",
    cols: ["المنصة", "نوع الحساب", "فوري maker / taker", "دائمة maker / taker", "مراجعة الرسوم", "رمز الشريك", "الخطوة التالية"],
    cex: "حساب منصة",
    dex: "عقود دائمة عبر المحفظة",
    notChecked: "لم تُراجع بعد",
    reference: "مرجع",
    profile: "الملف",
    compare: (t) => `قارن مع ${t}`,
    notesTitle: "فروق أخرى",
    notes: {
      hyperliquid: "وثائق Hyperliquid: رمز الإحالة يمنح خصمًا 4% على الرسوم لأول 25 مليون دولار من حجم التداول (لا يشمل الخزائن والحسابات الفرعية).",
      backpack: "تقدم Backpack أسهمًا وصناديق ETF أمريكية عبر Backpack Securities، وبعض الأسهم مرمّزة على Solana (ليست متاحة في الولايات المتحدة والمملكة المتحدة والإمارات واليابان ولا عبر Backpack EU). لم تراجع NexuAlpha رسومها بعد.",
    },
    sourceNote: "رسوم المستوى الأساسي؛ مستويات VIP وخصومات الرموز والتخزين والتمويل والفارق تغيّر التكلفة الفعلية.",
    faqTitle: "أسئلة شائعة",
    faq: [
      [(t) => `ما بدائل ${t}؟`, (t, list) => `تعرض هذه الصفحة ${list} كبدائل لـ ${t} مع الرسوم الأساسية التي راجعتها NexuAlpha في كل صفحة رسوم رسمية. الترتيب ليس تصنيفًا: الخمس كلها شريكة لـ NexuAlpha والشراكة مُفصح عنها.`],
      [(t) => `أي بديل لـ ${t} لديه أقل رسوم للعقود الدائمة؟`, (t, low) => `في المستوى الأساسي، أقل رسوم taker للعقود الدائمة في القائمة لدى ${low.names.join(" / ")} بنسبة ${low.value}${low.target ? ` (${t}: ${low.target})` : ""}، وفق صفحات رسمية رُوجعت في ${low.checkedOn}. مستويات VIP والخصومات والتخزين والتمويل والفارق تغيّر التكلفة الفعلية.`],
    ],
    sources: "مصادر الرسوم",
  },
};

export const VENUE_ALTERNATIVES_COPY_LOCALES = Object.freeze(Object.keys(COPY));
export function venueAlternativesCopy(locale = "en") {
  return COPY[locale] || COPY[String(locale || "").split("-")[0]] || COPY.en;
}

/** Title, description and FAQ (question, answer) pairs — one source for the page, the SSR head and the Worker head. */
export function venueAlternativesContent(page, locale = "en") {
  const copy = venueAlternativesCopy(locale);
  const lang = COPY[locale] ? locale : "en";
  const target = NAMES[page.target] || page.target;
  const list = listJoin(candidateNames(page), lang);
  const low = lowestPerpTaker(page, lang);
  const faq = [[copy.faq[0][0](target), copy.faq[0][1](target, list)]];
  if (low) faq.push([copy.faq[1][0](target), copy.faq[1][1](target, low)]);
  return {
    locale: lang,
    target,
    h1: copy.title(target),
    metaTitle: copy.metaTitle(target),
    metaDescription: copy.metaDescription(target, list),
    faq,
  };
}

/** JSON-LD for the page: breadcrumb, CollectionPage with the venue list, FAQPage. Shared by client SSR and Worker. */
export function venueAlternativesSchemas(page, locale, canonicalUrl, origin = "https://nexualpha.com") {
  const content = venueAlternativesContent(page, locale);
  const rows = venueAlternativeRows(page, content.locale);
  const sources = rows.map((row) => row.source).filter(Boolean);
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "NexuAlpha", item: `${origin}/` },
        { "@type": "ListItem", position: 2, name: "Topics", item: `${origin}/topics` },
        { "@type": "ListItem", position: 3, name: content.h1, item: canonicalUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: content.h1,
      description: content.metaDescription,
      url: canonicalUrl,
      inLanguage: content.locale,
      dateModified: VENUE_ALTERNATIVES_REVIEWED_AT,
      isBasedOn: sources,
      mainEntity: {
        "@type": "ItemList",
        itemListOrder: "https://schema.org/ItemListUnordered",
        itemListElement: rows.filter((row) => !row.reference).map((row, index) => ({
          "@type": "ListItem", position: index + 1, name: row.name, url: `${origin}${row.profile}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: content.locale,
      mainEntity: content.faq.map(([question, answer]) => ({
        "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer, citation: sources },
      })),
    },
  ];
}
