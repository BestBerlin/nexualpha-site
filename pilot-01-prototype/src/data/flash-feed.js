import { formatSgt } from "./local-time.js";
// NexuAlpha Flash feed (server-only: Worker, sitemap, tests). Builds the 7x24 flash items from feeds we already
// publish — official exchange announcements (+ archive and localized campaign briefs), the market collector's feed and
// our published news — and renders each item's headline and 1–2 sentence body from its structured fields with
// per-locale templates. Numbers and tickers are formatted once, the same way in every language; free text is never
// machine-translated (announcement titles are quoted as the official source, campaign briefs and news use the
// localized text they were published with). No external calls happen here.
import { FLASH_PATH, FLASH_TYPES, flashItemPath, flashKey, flashSlug } from "./flash.js";
import { updatePath } from "./activity-update-path.js";
import { flashUiCopy } from "./flash.js";
import { campaignVisibleInLocale } from "./campaign-locale-policy.js";
import { budgetTitle, titleBudgetForLocale } from "./meta-description.js";
import { carriesSignupPath, isReferralTopicArticle, neutralArticleMarkdown } from "./neutral-article.js";
import { isNeutralCtaLocale } from "./locale-policy.js";
import { COIN_ROWS } from "./coins-data.generated.js";

// Search editions (same set as the Worker's INDEXABLE_LOCALES): every one has its own templates below.
export const FLASH_INDEX_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"]);
export const FLASH_THRESHOLDS = Object.freeze({ liquidationHourUsd: 3e6, majorMove1hPct: 1.5, mover24hPct: 15, moverMinVolumeUsd: 1e8, fundingAbsRate: 0.0005 });
const RETENTION_MS = 400 * 24 * 60 * 60 * 1000;
const NEWS_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 10 * 60 * 1000;
const MAX_MARKET_ITEMS = 3000;
const MAX_ASSETS = 4;

// "Important" level (2026-10-13): rule-based, never editorial. An item is important when it is a large liquidation hour,
// a sharp BTC/ETH hour, a listing/delisting of a top-20 coin by market cap (stablecoins excluded; ranks from the
// baked coin table) or an official exchange service notice about an outage or a withdrawal halt. The browser gets a
// boolean plus the rule name, so the red marker, the "Important only" filter and notifications all agree.
export const FLASH_IMPORTANT_RULES = Object.freeze({ liquidationHourUsd: 50e6, majorMove1hPct: 3, majorAssets: ["BTC", "ETH"] });
const rowRank = (row) => (Array.isArray(row) ? row[4] : row?.rank);
const rowSymbol = (row) => (Array.isArray(row) ? row[3] : row?.symbol);
const rowCategory = (row) => (Array.isArray(row) ? row[5] : row?.category);
export const FLASH_TOP_COINS = Object.freeze([...(Array.isArray(COIN_ROWS) ? COIN_ROWS : [])]
  .filter((row) => Number(rowRank(row)) > 0 && rowCategory(row) !== "stablecoin" && rowSymbol(row))
  .sort((a, b) => rowRank(a) - rowRank(b)).slice(0, 20).map((row) => String(rowSymbol(row)).toUpperCase()));
const TOP_COIN_SET = new Set(FLASH_TOP_COINS);
// Official service notices: suspensions, halts, outages. A notice is an "incident" flash item; it is important when it
// reads like an outage (system-wide, trading halted) or halts deposits/withdrawals of a top-20 coin or of everything.
const INCIDENT_RE = /\b(?:suspend(?:s|ed|ing)?|suspension|halt(?:s|ed|ing)?|paus(?:e|es|ed|ing)|cease(?:s|d)?|ceasing|temporarily (?:closed|closes|close|unavailable|disabled)|outage|downtime|disruption|interruption|degraded|unscheduled maintenance)\b|暂停|中断|故障|暫停|中斷/i;
const OUTAGE_RE = /\b(?:outage|downtime|disruption|interruption|degraded|unscheduled maintenance|(?:all|trading|system|platform|exchange)[\w\s-]{0,24}(?:suspend|halt|paus))|系统|系統|故障/i;
const FUNDS_RE = /\b(?:deposits?|withdrawals?|withdraw)\b|提现|提币|充值|充提|提現|提幣/i;
const ALL_FUNDS_RE = /\ball\b[^.]{0,30}\b(?:deposits?|withdrawals?)\b|全部(?:充值|提现|提币|充提)/i;
export function flashImportance(item) {
  const d = item?.data || {};
  const assets = Array.isArray(item?.assets) ? item.assets.map((a) => String(a).toUpperCase().replace(/\/.*$/, "")) : [];
  if (item?.type === "liquidation-spike" && Number(d.totalUsd) >= FLASH_IMPORTANT_RULES.liquidationHourUsd) return "liquidations";
  if (item?.type === "sharp-move" && d.kind === "1h" && FLASH_IMPORTANT_RULES.majorAssets.includes(assets[0])
    && Math.abs(Number(d.change1hPct) || 0) >= FLASH_IMPORTANT_RULES.majorMove1hPct) return "major-move";
  if ((item?.type === "listing" || item?.type === "delisting") && assets.some((a) => TOP_COIN_SET.has(a))) return "top-coin";
  if (item?.type === "incident") {
    const title = String(item.source?.title || "");
    if (OUTAGE_RE.test(title)) return "outage";
    if (FUNDS_RE.test(title) && (ALL_FUNDS_RE.test(title) || assets.some((a) => TOP_COIN_SET.has(a)))) return "withdrawals";
  }
  return null;
}

const VENUE_NAMES = { binance: "Binance", okx: "OKX", bitget: "Bitget", bybit: "Bybit", kucoin: "KuCoin", kraken: "Kraken", "gate-io": "Gate", mexc: "MEXC", htx: "HTX", hyperliquid: "Hyperliquid", coinbase: "Coinbase" };
const ZH_VENUE_NAMES = { "zh-Hans": { binance: "币安" }, "zh-Hant": { binance: "幣安" } };
export const flashVenueName = (slug, locale = "en") => ZH_VENUE_NAMES[locale]?.[slug] || VENUE_NAMES[slug] || slug || "";

// ------------------------------------------------------------------------------------------------ number formatting
// One format for every locale, so a flash reads the same numbers in Tokyo and São Paulo.
const MINUS = "−";
export function fmtUsd(value) {
  const n = Math.abs(Number(value) || 0);
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}
export function fmtPct(value, digits = 2) {
  const n = Number(value) || 0;
  return `${n > 0 ? "+" : n < 0 ? MINUS : ""}${Math.abs(n).toFixed(digits)}%`;
}
export const fmtRate = (rate) => (Number.isFinite(Number(rate)) && rate !== null ? fmtPct(Number(rate) * 100, 4) : "—");
export const fmtPrice = (value) => `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 8 })}`;
export const fmtUtc = (iso) => formatSgt(iso).replace(" · ", " ").replace(/ SGT$/, "");
const fmtClock = (iso) => fmtUtc(iso).slice(11);
const baseSymbol = (symbol) => String(symbol || "").replace(/^[A-Z]+:/, "").replace(/USDT$|USDC$/, "") || String(symbol || "");

// --------------------------------------------------------------------------------------------------- templates
// {placeholders} are filled with the formatted values above; the template only chooses the words around them.
const T = {
  en: {
    listing: "{venue} lists {assets}{market}", listingNotice: "{venue} listing notice: {assets}{market}", listingGeneric: "{venue} posts a new listing notice",
    delisting: "{venue} delists {assets}", delistingNotice: "{venue} delisting notice: {assets}", delistingGeneric: "{venue} posts a delisting notice",
    campaignPrize: "{venue} campaign: {amount} {asset} prize pool", campaignMaxReward: "{venue} campaign: up to {amount} {asset} per user", campaignVoucher: "{venue} campaign: {amount} {asset} voucher", campaignGeneric: "{venue} posts a new event notice",
    annBody: "{venue} published this in its official announcements on {published} SGT.", whenBody: "Date given in the notice: {when}.",
    mk: { spot: "spot", perp: "perpetual futures", stocks: "tokenized stocks" }, mkWrap: " ({m})",
    liqHead: "Liquidations hit {total} in 1 hour, {share}% {side}", side: { long: "longs", short: "shorts" },
    liqBody: "NexuAlpha's liquidation tracker (Binance and OKX) recorded {total} in the hour to {hour} SGT: longs {long}, shorts {short}.",
    moveHead: "{sym} {pct} in 1 hour, now {price}", moveBody: "{sym} traded at {price} on Binance USDT-M perpetuals at {time} SGT, {pct} over 1 hour and {pct24} over 24 hours.",
    moverHead: "{sym} {pct} in 24 hours", moverBody: "The {sym} perpetual on Binance USDT-M moved {pct} over 24 hours on {vol} of trading volume, as of {time} SGT.",
    fundHead: "{sym} funding rate at {rate} on {venue}", fundBody: "Funding on the {sym} perpetual: Binance {binance}, OKX {okx}. Next settlement at {next} SGT. {payer}",
    payLong: "Longs pay shorts.", payShort: "Shorts pay longs.",
    incidentHead: "{venue} service notice: {assets}", incidentGeneric: "{venue} posts a service notice", incidentBody: "Deposits, withdrawals or trading may be affected. Check the official notice for the exact scope and timing.",
  },
  "zh-Hans": {
    listing: "{venue} 上线 {assets}{market}", listingNotice: "{venue}上币公告：{assets}{market}", listingGeneric: "{venue}发布新的上币公告",
    delisting: "{venue}下架 {assets}", delistingNotice: "{venue}下架公告：{assets}", delistingGeneric: "{venue}发布下架公告",
    campaignPrize: "{venue}活动：奖池 {amount} {asset}", campaignMaxReward: "{venue}活动：每位用户最高 {amount} {asset}", campaignVoucher: "{venue}活动：{amount} {asset} 卡券", campaignGeneric: "{venue}发布新的活动公告",
    annBody: "{venue} 于 {published} SGT 发布官方公告。", whenBody: "公告中给出的时间：{when}。",
    mk: { spot: "现货", perp: "永续合约", stocks: "代币化股票" }, mkWrap: "（{m}）",
    liqHead: "1 小时爆仓 {total}，{share}% 为{side}", side: { long: "多单", short: "空单" },
    liqBody: "NexuAlpha 爆仓追踪（Binance 与 OKX）显示，截至 {hour} SGT 的 1 小时内爆仓 {total}：多单 {long}，空单 {short}。",
    moveHead: "{sym} 1 小时 {pct}，现报 {price}", moveBody: "{time} SGT，{sym} 在 Binance USDT 本位永续合约报 {price}，1 小时 {pct}，24 小时 {pct24}。",
    moverHead: "{sym} 24 小时 {pct}", moverBody: "截至 {time} SGT，{sym} 在 Binance USDT 本位永续合约 24 小时变动 {pct}，成交额 {vol}。",
    fundHead: "{sym} 资金费率 {rate}（{venue}）", fundBody: "{sym} 永续合约资金费率：Binance {binance}，OKX {okx}。下次结算 {next} SGT。{payer}",
    payLong: "多头向空头支付。", payShort: "空头向多头支付。",
    incidentHead: "{venue}服务公告：{assets}", incidentGeneric: "{venue}发布服务状态公告", incidentBody: "充值、提现或交易可能受到影响，具体范围和时间以官方公告为准。",
  },
  "zh-Hant": {
    listing: "{venue}上線 {assets}{market}", listingNotice: "{venue}上幣公告：{assets}{market}", listingGeneric: "{venue}發布新的上幣公告",
    delisting: "{venue}下架 {assets}", delistingNotice: "{venue}下架公告：{assets}", delistingGeneric: "{venue}發布下架公告",
    campaignPrize: "{venue}活動：獎池 {amount} {asset}", campaignMaxReward: "{venue}活動：每位用戶最高 {amount} {asset}", campaignVoucher: "{venue}活動：{amount} {asset} 卡券", campaignGeneric: "{venue}發布新的活動公告",
    annBody: "{venue}於 {published} SGT 在官方公告欄發布了這則消息。", whenBody: "公告中給出的時間：{when}。",
    mk: { spot: "現貨", perp: "永續合約", stocks: "代幣化股票" }, mkWrap: "（{m}）",
    liqHead: "1 小時爆倉 {total}，{share}% 為{side}", side: { long: "多單", short: "空單" },
    liqBody: "NexuAlpha 爆倉追蹤（Binance 與 OKX）顯示，截至 {hour} SGT 的 1 小時內爆倉 {total}：多單 {long}，空單 {short}。",
    moveHead: "{sym} 1 小時 {pct}，現報 {price}", moveBody: "{time} SGT，{sym} 在 Binance USDT 本位永續合約報 {price}，1 小時 {pct}，24 小時 {pct24}。",
    moverHead: "{sym} 24 小時 {pct}", moverBody: "截至 {time} SGT，{sym} 在 Binance USDT 本位永續合約 24 小時變動 {pct}，成交額 {vol}。",
    fundHead: "{sym} 資金費率 {rate}（{venue}）", fundBody: "{sym} 永續合約資金費率：Binance {binance}，OKX {okx}。下次結算 {next} SGT。{payer}",
    payLong: "多頭向空頭支付。", payShort: "空頭向多頭支付。",
    incidentHead: "{venue}服務公告：{assets}", incidentGeneric: "{venue}發布服務狀態公告", incidentBody: "充值、提現或交易可能受到影響，具體範圍和時間以官方公告為準。",
  },
  es: {
    listing: "{venue} lista {assets}{market}", listingNotice: "Aviso de listado de {venue}: {assets}{market}", listingGeneric: "{venue} publica un nuevo aviso de listado",
    delisting: "{venue} retira {assets}", delistingNotice: "Aviso de retirada de {venue}: {assets}", delistingGeneric: "{venue} publica un aviso de retirada",
    campaignPrize: "Campaña de {venue}: bolsa de premios de {amount} {asset}", campaignMaxReward: "Campaña de {venue}: hasta {amount} {asset} por usuario", campaignVoucher: "Campaña de {venue}: cupón de {amount} {asset}", campaignGeneric: "{venue} publica un nuevo aviso de evento",
    annBody: "{venue} lo publicó en sus anuncios oficiales el {published} SGT.", whenBody: "Fecha indicada en el aviso: {when}.",
    mk: { spot: "spot", perp: "futuros perpetuos", stocks: "acciones tokenizadas" }, mkWrap: " ({m})",
    liqHead: "Las liquidaciones llegan a {total} en 1 hora, {share}% {side}", side: { long: "largos", short: "cortos" },
    liqBody: "El rastreador de liquidaciones de NexuAlpha (Binance y OKX) registró {total} en la hora hasta las {hour} SGT: largos {long}, cortos {short}.",
    moveHead: "{sym} {pct} en 1 hora, ahora en {price}", moveBody: "{sym} cotizaba a {price} en los perpetuos USDT-M de Binance a las {time} SGT: {pct} en 1 hora y {pct24} en 24 horas.",
    moverHead: "{sym} {pct} en 24 horas", moverBody: "El perpetuo {sym} de Binance USDT-M se movió {pct} en 24 horas con un volumen de {vol}, a las {time} SGT.",
    fundHead: "Financiación de {sym} en {rate} en {venue}", fundBody: "Financiación del perpetuo {sym}: Binance {binance}, OKX {okx}. Próxima liquidación a las {next} SGT. {payer}",
    payLong: "Los largos pagan a los cortos.", payShort: "Los cortos pagan a los largos.",
    incidentHead: "{venue}: aviso de servicio sobre {assets}", incidentGeneric: "{venue} publica un aviso de servicio", incidentBody: "Los depósitos, retiros o la operativa pueden verse afectados. Consulta el aviso oficial para el alcance y los horarios exactos.",
  },
  "pt-BR": {
    listing: "{venue} lista {assets}{market}", listingNotice: "Aviso de listagem da {venue}: {assets}{market}", listingGeneric: "{venue} publica novo aviso de listagem",
    delisting: "{venue} remove {assets}", delistingNotice: "Aviso de remoção da {venue}: {assets}", delistingGeneric: "{venue} publica aviso de remoção",
    campaignPrize: "Campanha da {venue}: prêmio total de {amount} {asset}", campaignMaxReward: "Campanha da {venue}: até {amount} {asset} por usuário", campaignVoucher: "Campanha da {venue}: voucher de {amount} {asset}", campaignGeneric: "{venue} publica novo aviso de evento",
    annBody: "A {venue} publicou isto nos anúncios oficiais em {published} SGT.", whenBody: "Data informada no aviso: {when}.",
    mk: { spot: "spot", perp: "futuros perpétuos", stocks: "ações tokenizadas" }, mkWrap: " ({m})",
    liqHead: "Liquidações somam {total} em 1 hora; {share}% em posições {side}", side: { long: "compradas (long)", short: "vendidas (short)" },
    liqBody: "O monitor de liquidações da NexuAlpha (Binance e OKX) registrou {total} na hora até as {hour} SGT: posições compradas {long}, vendidas {short}.",
    moveHead: "{sym} {pct} em 1 hora, agora a {price}", moveBody: "{sym} era negociado a {price} nos perpétuos USDT-M da Binance às {time} SGT: {pct} em 1 hora e {pct24} em 24 horas.",
    moverHead: "{sym} {pct} em 24 horas", moverBody: "O perpétuo {sym} na Binance USDT-M variou {pct} em 24 horas com volume de {vol}, às {time} SGT.",
    fundHead: "Funding de {sym} em {rate} na {venue}", fundBody: "Funding do perpétuo {sym}: Binance {binance}, OKX {okx}. Próxima liquidação às {next} SGT. {payer}",
    payLong: "Comprados pagam os vendidos.", payShort: "Vendidos pagam os comprados.",
    incidentHead: "{venue}: aviso de serviço sobre {assets}", incidentGeneric: "{venue} publica um aviso de serviço", incidentBody: "Depósitos, saques ou negociações podem ser afetados. Veja o aviso oficial para o escopo e os horários exatos.",
  },
  fr: {
    listing: "{venue} cote {assets}{market}", listingNotice: "Avis de cotation {venue} : {assets}{market}", listingGeneric: "{venue} publie un nouvel avis de cotation",
    delisting: "{venue} retire {assets}", delistingNotice: "Avis de retrait {venue} : {assets}", delistingGeneric: "{venue} publie un avis de retrait",
    campaignPrize: "Campagne {venue} : cagnotte de {amount} {asset}", campaignMaxReward: "Campagne {venue} : jusqu’à {amount} {asset} par utilisateur", campaignVoucher: "Campagne {venue} : bon de {amount} {asset}", campaignGeneric: "{venue} publie un nouvel avis d’événement",
    annBody: "Publié dans les annonces officielles de {venue} le {published} SGT.", whenBody: "Date indiquée dans l’avis : {when}.",
    mk: { spot: "spot", perp: "contrats perpétuels", stocks: "actions tokenisées" }, mkWrap: " ({m})",
    liqHead: "Les liquidations atteignent {total} en 1 heure, dont {share} % de positions {side}", side: { long: "longues", short: "courtes" },
    liqBody: "Le suivi des liquidations de NexuAlpha (Binance et OKX) a enregistré {total} sur l’heure jusqu’à {hour} SGT : longs {long}, shorts {short}.",
    moveHead: "{sym} {pct} en 1 heure, à {price}", moveBody: "{sym} cotait {price} sur les perpétuels USDT-M de Binance à {time} SGT : {pct} sur 1 heure et {pct24} sur 24 heures.",
    moverHead: "{sym} {pct} en 24 heures", moverBody: "Le perpétuel {sym} sur Binance USDT-M a varié de {pct} en 24 heures pour un volume de {vol}, à {time} SGT.",
    fundHead: "Taux de financement de {sym} à {rate} sur {venue}", fundBody: "Financement du perpétuel {sym} : Binance {binance}, OKX {okx}. Prochain règlement à {next} SGT. {payer}",
    payLong: "Les longs paient les shorts.", payShort: "Les shorts paient les longs.",
    incidentHead: "{venue} : avis de service sur {assets}", incidentGeneric: "{venue} publie un avis de service", incidentBody: "Les dépôts, retraits ou le trading peuvent être affectés. Consultez l’avis officiel pour le périmètre et le calendrier exacts.",
  },
  de: {
    listing: "{venue} listet {assets}{market}", listingNotice: "{venue}-Listing-Mitteilung: {assets}{market}", listingGeneric: "{venue} veröffentlicht eine neue Listing-Mitteilung",
    delisting: "{venue} delistet {assets}", delistingNotice: "{venue}-Delisting-Mitteilung: {assets}", delistingGeneric: "{venue} veröffentlicht eine Delisting-Mitteilung",
    campaignPrize: "{venue}-Aktion: Preispool von {amount} {asset}", campaignMaxReward: "{venue}-Aktion: bis zu {amount} {asset} pro Nutzer", campaignVoucher: "{venue}-Aktion: Gutschein über {amount} {asset}", campaignGeneric: "{venue} veröffentlicht eine neue Event-Mitteilung",
    annBody: "{venue} hat dies am {published} SGT in seinen offiziellen Mitteilungen veröffentlicht.", whenBody: "Zeitpunkt laut Mitteilung: {when}.",
    mk: { spot: "Spot", perp: "Perpetual Futures", stocks: "tokenisierte Aktien" }, mkWrap: " ({m})",
    liqHead: "Liquidationen erreichen {total} in 1 Stunde, {share}% {side}", side: { long: "Longs", short: "Shorts" },
    liqBody: "Der Liquidations-Tracker von NexuAlpha (Binance und OKX) erfasste {total} in der Stunde bis {hour} SGT: Longs {long}, Shorts {short}.",
    moveHead: "{sym} {pct} in 1 Stunde, jetzt {price}", moveBody: "{sym} notierte um {time} SGT bei {price} auf den USDT-M-Perpetuals von Binance: {pct} in 1 Stunde und {pct24} in 24 Stunden.",
    moverHead: "{sym} {pct} in 24 Stunden", moverBody: "Der {sym}-Perpetual auf Binance USDT-M bewegte sich in 24 Stunden um {pct} bei {vol} Handelsvolumen, Stand {time} SGT.",
    fundHead: "{sym}-Funding-Rate bei {rate} auf {venue}", fundBody: "Funding des {sym}-Perpetuals: Binance {binance}, OKX {okx}. Nächste Abrechnung um {next} SGT. {payer}",
    payLong: "Longs zahlen an Shorts.", payShort: "Shorts zahlen an Longs.",
    incidentHead: "{venue}: Servicehinweis zu {assets}", incidentGeneric: "{venue} veröffentlicht einen Servicehinweis", incidentBody: "Ein- und Auszahlungen oder der Handel können betroffen sein. Umfang und Zeitplan stehen in der offiziellen Mitteilung.",
  },
  it: {
    listing: "{venue} quota {assets}{market}", listingNotice: "Avviso di listing {venue}: {assets}{market}", listingGeneric: "{venue} pubblica un nuovo avviso di listing",
    delisting: "{venue} rimuove {assets}", delistingNotice: "Avviso di delisting {venue}: {assets}", delistingGeneric: "{venue} pubblica un avviso di delisting",
    campaignPrize: "Campagna {venue}: montepremi di {amount} {asset}", campaignMaxReward: "Campagna {venue}: fino a {amount} {asset} per utente", campaignVoucher: "Campagna {venue}: voucher da {amount} {asset}", campaignGeneric: "{venue} pubblica un nuovo avviso di evento",
    annBody: "{venue} lo ha pubblicato negli annunci ufficiali il {published} SGT.", whenBody: "Data indicata nell’avviso: {when}.",
    mk: { spot: "spot", perp: "futures perpetui", stocks: "azioni tokenizzate" }, mkWrap: " ({m})",
    liqHead: "Liquidazioni a {total} in 1 ora, {share}% {side}", side: { long: "long", short: "short" },
    liqBody: "Il tracker delle liquidazioni di NexuAlpha (Binance e OKX) ha registrato {total} nell’ora fino alle {hour} SGT: long {long}, short {short}.",
    moveHead: "{sym} {pct} in 1 ora, ora a {price}", moveBody: "{sym} quotava {price} sui perpetui USDT-M di Binance alle {time} SGT: {pct} in 1 ora e {pct24} in 24 ore.",
    moverHead: "{sym} {pct} in 24 ore", moverBody: "Il perpetuo {sym} su Binance USDT-M si è mosso del {pct} in 24 ore con {vol} di volume, alle {time} SGT.",
    fundHead: "Funding di {sym} a {rate} su {venue}", fundBody: "Funding del perpetuo {sym}: Binance {binance}, OKX {okx}. Prossimo regolamento alle {next} SGT. {payer}",
    payLong: "I long pagano gli short.", payShort: "Gli short pagano i long.",
    incidentHead: "{venue}: avviso di servizio su {assets}", incidentGeneric: "{venue} pubblica un avviso di servizio", incidentBody: "Depositi, prelievi o trading potrebbero essere interessati. Controlla l’avviso ufficiale per portata e orari esatti.",
  },
  ja: {
    listing: "{venue}、{assets}{market}を上場", listingNotice: "{venue} 上場のお知らせ：{assets}{market}", listingGeneric: "{venue}、新規上場のお知らせを公開",
    delisting: "{venue}、{assets}を上場廃止", delistingNotice: "{venue} 上場廃止のお知らせ：{assets}", delistingGeneric: "{venue}、上場廃止のお知らせを公開",
    campaignPrize: "{venue}キャンペーン：賞金総額 {amount} {asset}", campaignMaxReward: "{venue}キャンペーン：1ユーザーあたり最大 {amount} {asset}", campaignVoucher: "{venue}キャンペーン：{amount} {asset} バウチャー", campaignGeneric: "{venue}、新しいイベントのお知らせを公開",
    annBody: "{venue}が {published} SGT に公式のお知らせで公開しました。", whenBody: "お知らせに記載の日時：{when}。",
    mk: { spot: "現物", perp: "無期限先物", stocks: "トークン化株式" }, mkWrap: "（{m}）",
    liqHead: "1時間の清算額が {total} に、約{share}%が{side}", side: { long: "ロング", short: "ショート" },
    liqBody: "NexuAlpha の清算トラッカー（Binance と OKX）によると、{hour} SGT までの1時間の清算額は {total}：ロング {long}、ショート {short}。",
    moveHead: "{sym} 1時間で {pct}、現在 {price}", moveBody: "{time} SGT 時点で {sym} は Binance USDT-M 無期限先物で {price}。1時間で {pct}、24時間で {pct24}。",
    moverHead: "{sym} 24時間で {pct}", moverBody: "{time} SGT 時点で、Binance USDT-M の {sym} 無期限先物は24時間で {pct} 変動、出来高は {vol}。",
    fundHead: "{sym} の資金調達率が {rate}（{venue}）", fundBody: "{sym} 無期限先物の資金調達率：Binance {binance}、OKX {okx}。次回精算は {next} SGT。{payer}",
    payLong: "ロングがショートに支払います。", payShort: "ショートがロングに支払います。",
    incidentHead: "{venue}のサービスのお知らせ：{assets}", incidentGeneric: "{venue}がサービスに関するお知らせを公開", incidentBody: "入出金や取引に影響が出る可能性があります。対象範囲と時間は公式のお知らせをご確認ください。",
  },
  ko: {
    listing: "{venue}, {assets}{market} 상장", listingNotice: "{venue} 상장 공지: {assets}{market}", listingGeneric: "{venue}, 신규 상장 공지 게시",
    delisting: "{venue}, {assets} 상장 폐지", delistingNotice: "{venue} 상장 폐지 공지: {assets}", delistingGeneric: "{venue}, 상장 폐지 공지 게시",
    campaignPrize: "{venue} 이벤트: 총상금 {amount} {asset}", campaignMaxReward: "{venue} 이벤트: 사용자당 최대 {amount} {asset}", campaignVoucher: "{venue} 이벤트: {amount} {asset} 바우처", campaignGeneric: "{venue}, 새 이벤트 공지 게시",
    annBody: "{venue}가 {published} SGT에 공식 공지로 게시했습니다.", whenBody: "공지에 적힌 일시: {when}.",
    mk: { spot: "현물", perp: "무기한 선물", stocks: "토큰화 주식" }, mkWrap: " ({m})",
    liqHead: "1시간 청산 {total}, {share}%가 {side}", side: { long: "롱", short: "숏" },
    liqBody: "NexuAlpha 청산 트래커(Binance, OKX)에 따르면 {hour} SGT까지 1시간 동안 {total}가 청산됐습니다: 롱 {long}, 숏 {short}.",
    moveHead: "{sym} 1시간 {pct}, 현재 {price}", moveBody: "{time} SGT 기준 {sym}는 Binance USDT-M 무기한 선물에서 {price}에 거래됐습니다. 1시간 {pct}, 24시간 {pct24}.",
    moverHead: "{sym} 24시간 {pct}", moverBody: "{time} SGT 기준 Binance USDT-M {sym} 무기한 선물은 24시간 동안 {pct} 움직였고 거래대금은 {vol}입니다.",
    fundHead: "{sym} 펀딩비 {rate} ({venue})", fundBody: "{sym} 무기한 선물 펀딩비: Binance {binance}, OKX {okx}. 다음 정산 {next} SGT. {payer}",
    payLong: "롱이 숏에게 지급합니다.", payShort: "숏이 롱에게 지급합니다.",
    incidentHead: "{venue} 서비스 공지: {assets}", incidentGeneric: "{venue}, 서비스 공지 게시", incidentBody: "입출금 또는 거래에 영향이 있을 수 있습니다. 정확한 범위와 시간은 공식 공지를 확인하세요.",
  },
  ru: {
    listing: "{venue} добавляет {assets}{market}", listingNotice: "Объявление о листинге на {venue}: {assets}{market}", listingGeneric: "{venue} опубликовала объявление о листинге",
    delisting: "{venue} проводит делистинг {assets}", delistingNotice: "Объявление о делистинге на {venue}: {assets}", delistingGeneric: "{venue} опубликовала объявление о делистинге",
    campaignPrize: "Акция {venue}: призовой фонд {amount} {asset}", campaignMaxReward: "Акция {venue}: до {amount} {asset} на пользователя", campaignVoucher: "Акция {venue}: ваучер на {amount} {asset}", campaignGeneric: "{venue} публикует новое объявление о событии",
    annBody: "{venue} опубликовала это в официальных объявлениях {published} SGT.", whenBody: "Дата в объявлении: {when}.",
    mk: { spot: "спот", perp: "бессрочные фьючерсы", stocks: "токенизированные акции" }, mkWrap: " ({m})",
    liqHead: "Ликвидации за 1 час: {total}, {share}% — {side}", side: { long: "лонги", short: "шорты" },
    liqBody: "Трекер ликвидаций NexuAlpha (Binance и OKX) зафиксировал {total} за час до {hour} SGT: лонги {long}, шорты {short}.",
    moveHead: "{sym} {pct} за 1 час, сейчас {price}", moveBody: "В {time} SGT {sym} торговался по {price} на бессрочных фьючерсах Binance USDT-M: {pct} за 1 час и {pct24} за 24 часа.",
    moverHead: "{sym} {pct} за 24 часа", moverBody: "Бессрочный фьючерс {sym} на Binance USDT-M изменился на {pct} за 24 часа при объёме торгов {vol}, данные на {time} SGT.",
    fundHead: "Ставка финансирования {sym}: {rate} на {venue}", fundBody: "Финансирование бессрочного фьючерса {sym}: Binance {binance}, OKX {okx}. Следующее начисление в {next} SGT. {payer}",
    payLong: "Лонги платят шортам.", payShort: "Шорты платят лонгам.",
    incidentHead: "{venue}: сервисное уведомление по {assets}", incidentGeneric: "{venue} публикует сервисное уведомление", incidentBody: "Возможны ограничения на ввод, вывод или торговлю. Точный объём и сроки — в официальном уведомлении.",
  },
  tr: {
    listing: "{venue}, {assets}{market} listeliyor", listingNotice: "{venue} listeleme duyurusu: {assets}{market}", listingGeneric: "{venue} yeni bir listeleme duyurusu yayımladı",
    delisting: "{venue}, {assets} varlığını listeden çıkarıyor", delistingNotice: "{venue} listeden çıkarma duyurusu: {assets}", delistingGeneric: "{venue} listeden çıkarma duyurusu yayımladı",
    campaignPrize: "{venue} kampanyası: {amount} {asset} ödül havuzu", campaignMaxReward: "{venue} kampanyası: kullanıcı başına en fazla {amount} {asset}", campaignVoucher: "{venue} kampanyası: {amount} {asset} kupon", campaignGeneric: "{venue} yeni bir etkinlik duyurusu yayımladı",
    annBody: "{venue} bunu {published} SGT'de resmi duyurularında yayımladı.", whenBody: "Duyuruda belirtilen tarih: {when}.",
    mk: { spot: "spot", perp: "vadesiz vadeli işlemler", stocks: "tokenize hisseler" }, mkWrap: " ({m})",
    liqHead: "1 saatte {total} likidasyon, %{share} {side}", side: { long: "long", short: "short" },
    liqBody: "NexuAlpha likidasyon takipçisi (Binance ve OKX), {hour} SGT'ye kadarki 1 saatte {total} likidasyon kaydetti: long {long}, short {short}.",
    moveHead: "{sym} 1 saatte {pct}, şu an {price}", moveBody: "{sym}, {time} SGT'de Binance USDT-M vadeli işlemlerinde {price} seviyesindeydi: 1 saatte {pct}, 24 saatte {pct24}.",
    moverHead: "{sym} 24 saatte {pct}", moverBody: "Binance USDT-M'deki {sym} vadeli kontratı 24 saatte {pct} hareket etti, işlem hacmi {vol} ({time} SGT itibarıyla).",
    fundHead: "{sym} fonlama oranı: {rate} ({venue})", fundBody: "{sym} vadeli kontratında fonlama: Binance {binance}, OKX {okx}. Bir sonraki ödeme {next} SGT. {payer}",
    payLong: "Long pozisyonlar short pozisyonlara öder.", payShort: "Short pozisyonlar long pozisyonlara öder.",
    incidentHead: "{venue} hizmet duyurusu: {assets}", incidentGeneric: "{venue} bir hizmet duyurusu yayımladı", incidentBody: "Para yatırma, çekme veya işlemler etkilenebilir. Kapsam ve zamanlama için resmi duyuruya bakın.",
  },
  id: {
    listing: "{venue} melisting {assets}{market}", listingNotice: "Pengumuman listing {venue}: {assets}{market}", listingGeneric: "{venue} merilis pengumuman listing baru",
    delisting: "{venue} melakukan delisting {assets}", delistingNotice: "Pengumuman delisting {venue}: {assets}", delistingGeneric: "{venue} merilis pengumuman delisting",
    campaignPrize: "Kampanye {venue}: total hadiah {amount} {asset}", campaignMaxReward: "Kampanye {venue}: hingga {amount} {asset} per pengguna", campaignVoucher: "Kampanye {venue}: voucher {amount} {asset}", campaignGeneric: "{venue} merilis pengumuman acara baru",
    annBody: "{venue} memuat ini di pengumuman resminya pada {published} SGT.", whenBody: "Waktu yang tertulis di pengumuman: {when}.",
    mk: { spot: "spot", perp: "futures perpetual", stocks: "saham ter-tokenisasi" }, mkWrap: " ({m})",
    liqHead: "Likuidasi capai {total} dalam 1 jam, {share}% {side}", side: { long: "posisi long", short: "posisi short" },
    liqBody: "Pelacak likuidasi NexuAlpha (Binance dan OKX) mencatat {total} dalam satu jam hingga {hour} SGT: long {long}, short {short}.",
    moveHead: "{sym} {pct} dalam 1 jam, kini {price}", moveBody: "{sym} diperdagangkan di {price} pada perpetual USDT-M Binance pukul {time} SGT: {pct} dalam 1 jam dan {pct24} dalam 24 jam.",
    moverHead: "{sym} {pct} dalam 24 jam", moverBody: "Perpetual {sym} di Binance USDT-M bergerak {pct} dalam 24 jam dengan volume {vol}, per {time} SGT.",
    fundHead: "Funding rate {sym} {rate} di {venue}", fundBody: "Funding perpetual {sym}: Binance {binance}, OKX {okx}. Penyelesaian berikutnya pukul {next} SGT. {payer}",
    payLong: "Posisi long membayar short.", payShort: "Posisi short membayar long.",
    incidentHead: "Pemberitahuan layanan {venue}: {assets}", incidentGeneric: "{venue} merilis pemberitahuan layanan", incidentBody: "Deposit, penarikan, atau perdagangan dapat terdampak. Cek pengumuman resmi untuk cakupan dan waktu pastinya.",
  },
  vi: {
    listing: "{venue} niêm yết {assets}{market}", listingNotice: "Thông báo niêm yết của {venue}: {assets}{market}", listingGeneric: "{venue} đăng thông báo niêm yết mới",
    delisting: "{venue} hủy niêm yết {assets}", delistingNotice: "Thông báo hủy niêm yết của {venue}: {assets}", delistingGeneric: "{venue} đăng thông báo hủy niêm yết",
    campaignPrize: "Sự kiện {venue}: tổng giải thưởng {amount} {asset}", campaignMaxReward: "Sự kiện {venue}: tối đa {amount} {asset} cho mỗi người dùng", campaignVoucher: "Sự kiện {venue}: voucher {amount} {asset}", campaignGeneric: "{venue} đăng thông báo sự kiện mới",
    annBody: "{venue} đã đăng tin này trên kênh thông báo chính thức lúc {published} SGT.", whenBody: "Thời gian ghi trong thông báo: {when}.",
    mk: { spot: "giao ngay", perp: "hợp đồng vĩnh cửu", stocks: "cổ phiếu token hóa" }, mkWrap: " ({m})",
    liqHead: "Thanh lý đạt {total} trong 1 giờ, {share}% là {side}", side: { long: "lệnh long", short: "lệnh short" },
    liqBody: "Bộ theo dõi thanh lý của NexuAlpha (Binance và OKX) ghi nhận {total} bị thanh lý trong 1 giờ tính đến {hour} SGT: lệnh Long {long}, lệnh Short {short}.",
    moveHead: "{sym} {pct} trong 1 giờ, hiện ở {price}", moveBody: "Lúc {time} SGT, {sym} giao dịch ở {price} trên hợp đồng vĩnh cửu USDT-M của Binance: {pct} trong 1 giờ và {pct24} trong 24 giờ.",
    moverHead: "{sym} {pct} trong 24 giờ", moverBody: "Hợp đồng vĩnh cửu {sym} trên Binance USDT-M biến động {pct} trong 24 giờ với khối lượng {vol}, tính đến {time} SGT.",
    fundHead: "Funding rate của {sym} ở mức {rate} trên {venue}", fundBody: "Funding hợp đồng vĩnh cửu {sym}: Binance {binance}, OKX {okx}. Lần thanh toán tiếp theo lúc {next} SGT. {payer}",
    payLong: "Bên long trả cho bên short.", payShort: "Bên short trả cho bên long.",
    incidentHead: "Thông báo dịch vụ của {venue}: {assets}", incidentGeneric: "{venue} đăng thông báo dịch vụ", incidentBody: "Nạp, rút hoặc giao dịch có thể bị ảnh hưởng. Xem thông báo chính thức để biết phạm vi và thời gian cụ thể.",
  },
  ar: {
    listing: "{venue} تدرج {assets}{market}", listingNotice: "إعلان إدراج من {venue}: {assets}{market}", listingGeneric: "{venue} تنشر إعلان إدراج جديدًا",
    delisting: "{venue} تلغي إدراج {assets}", delistingNotice: "إعلان إلغاء إدراج من {venue}: {assets}", delistingGeneric: "{venue} تنشر إعلان إلغاء إدراج",
    campaignPrize: "حملة {venue}: مجموع جوائز {amount} {asset}", campaignMaxReward: "حملة {venue}: حتى {amount} {asset} لكل مستخدم", campaignVoucher: "حملة {venue}: قسيمة {amount} {asset}", campaignGeneric: "{venue} تنشر إعلان فعالية جديدًا",
    annBody: "نشرت {venue} هذا في إعلاناتها الرسمية في {published} SGT.", whenBody: "الموعد المذكور في الإعلان: {when}.",
    mk: { spot: "فوري", perp: "عقود دائمة", stocks: "أسهم مرمّزة" }, mkWrap: " ({m})",
    liqHead: "التصفيات تبلغ {total} خلال ساعة، {share}% منها {side}", side: { long: "مراكز شراء", short: "مراكز بيع" },
    liqBody: "سجّل متتبع التصفيات في NexuAlpha (Binance وOKX) تصفيات بقيمة {total} في الساعة المنتهية {hour} SGT: مراكز الشراء {long}، ومراكز البيع {short}.",
    moveHead: "{sym} {pct} خلال ساعة، والسعر الآن {price}", moveBody: "تداول {sym} عند {price} في العقود الدائمة USDT-M على Binance في {time} SGT: {pct} خلال ساعة و{pct24} خلال 24 ساعة.",
    moverHead: "{sym} {pct} خلال 24 ساعة", moverBody: "تحرّك العقد الدائم {sym} على Binance USDT-M بنسبة {pct} خلال 24 ساعة بحجم تداول {vol}، حتى {time} SGT.",
    fundHead: "معدل تمويل {sym} عند {rate} على {venue}", fundBody: "تمويل العقد الدائم {sym}: Binance {binance}، OKX {okx}. التسوية التالية في {next} SGT. {payer}",
    payLong: "مراكز الشراء تدفع لمراكز البيع.", payShort: "مراكز البيع تدفع لمراكز الشراء.",
    incidentHead: "إشعار خدمة من {venue}: {assets}", incidentGeneric: "{venue} تنشر إشعار خدمة", incidentBody: "قد تتأثر الإيداعات أو السحوبات أو التداول. راجع الإشعار الرسمي لمعرفة النطاق والتوقيت بدقة.",
  },
};
export const FLASH_TEMPLATE_LOCALES = Object.freeze(Object.keys(T));
const templatesFor = (locale) => T[locale] || null;
const fill = (template, vars) => String(template).replace(/\{(\w+)\}/g, (_m, key) => (vars[key] ?? ""));

// ------------------------------------------------------------------------------------ announcement title parsing
const STOP = new Set(["OKX", "BINANCE", "BITGET", "BYBIT", "KUCOIN", "KRAKEN", "UTC", "USD", "USDT", "USDC", "API", "AI", "VIP", "KYC", "TRADFI", "ETF", "IPO", "NFT", "APR", "APY", "CEO", "US", "EU", "UK", "FAQ", "P2P", "OTC", "ID", "TBA", "NEW", "DEX", "CEX", "AM", "PM", "GMT", "HODLER", "ALPHA", "BSTOCKS", "SEED"]);
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad2 = (n) => String(n).padStart(2, "0");

/** Structured fields of an official announcement title: assets, market kind, effective time, reward semantics. */
export function parseAnnouncementTitle(title = "") {
  const text = String(title);
  const assets = [];
  const push = (token) => { const t = token.trim(); if (t && !STOP.has(t.toUpperCase()) && /[A-Za-z]/.test(t) && !assets.includes(t)) assets.push(t); };
  for (const m of text.matchAll(/(?<![\w/-])([a-z]?[A-Z][A-Z0-9]{1,14}(?:\/[A-Z]{3,5})?)(?![\w-])/g)) push(m[1]);
  const perp = /perp|perpetual|futures|contract|swap/i.test(text);
  const stocks = /stock|equit|bstocks|tokeni[sz]ed/i.test(text);
  const spot = /\bspot\b|available for trading|listed on|trading pairs?/i.test(text);
  const market = perp ? "perp" : stocks ? "stocks" : spot ? "spot" : null;
  let when = null;
  const long = text.match(/\bon ([A-Z][a-z]{2})[a-z]* (\d{1,2}),? (\d{4}),? (\d{1,2}):(\d{2})\s*([AP]M)\s*\(?UTC\)?/i);
  if (long && MONTHS[long[1].toLowerCase()]) {
    let hour = Number(long[4]) % 12; if (/pm/i.test(long[6])) hour += 12;
    when = `${long[3]}-${pad2(MONTHS[long[1].toLowerCase()])}-${pad2(long[2])} ${pad2(hour)}:${long[5]} UTC`;
  } else {
    const iso = text.match(/\b(?:on|from|at) (\d{4}-\d{2}-\d{2})\b/i);
    if (iso) when = iso[1];
  }
  const rewardToken = (match, kind) => {
    if (!match) return null;
    const amount = match[1];
    const asset = String(match[2] || "").toUpperCase();
    if (!amount || !asset || (!["USDT", "USDC", "USD"].includes(asset) && STOP.has(asset))) return null;
    return { kind, amount, asset };
  };
  const perUserMax = rewardToken(text.match(/(?:earn|get|receive|claim|win|grab)[^\d.]{0,24}?(?:up to|max(?:imum)?|as much as)[^\d]{0,16}([\d][\d,]*(?:\.\d+)?)\s*([A-Z][A-Z0-9]{1,9})\b/i)
    || text.match(/(?:up to|max(?:imum)?|as much as)[^\d]{0,16}([\d][\d,]*(?:\.\d+)?)\s*([A-Z][A-Z0-9]{1,9})\b[^.]{0,24}?(?:per user|each|for every|for each)/i), "perUserMax");
  const voucher = rewardToken(text.match(/([\d][\d,]*(?:\.\d+)?)\s*([A-Z][A-Z0-9]{1,9})\b[^.]{0,36}?(?:voucher|coupon|bonus voucher|trial fund|trading bonus)/i)
    || text.match(/(?:voucher|coupon|bonus voucher|trial fund|trading bonus)[^\d]{0,36}([\d][\d,]*(?:\.\d+)?)\s*([A-Z][A-Z0-9]{1,9})\b/i), "voucherFaceValue");
  const totalPrizePool = rewardToken(text.match(/([\d][\d,]*(?:\.\d+)?)\s*([A-Z][A-Z0-9]{1,9})\b[^.]{0,36}?(?:total prize pool|prize pool|reward pool|total rewards)/i)
    || text.match(/(?:total prize pool|prize pool|reward pool|total rewards)[^\d]{0,36}([\d][\d,]*(?:\.\d+)?)\s*([A-Z][A-Z0-9]{1,9})\b/i), "totalPrizePool");
  const reward = voucher || perUserMax || totalPrizePool;
  return {
    assets: assets.slice(0, 12), market, when,
    reward,
    prize: reward?.kind === "totalPrizePool" ? { amount: reward.amount, asset: reward.asset } : null,
    verb: /\b(will list|to list|will launch|new listing|initial listing|listed|lists|launch(?:es)?|available for trading|will add)\b/i.test(text),
    delistVerb: /\bdelist/i.test(text),
  };
}

// First one or two sentences. A Latin full stop ends a sentence only before whitespace + a capital/quote/digit-free
// start and not after a one-letter abbreviation ("U.S."); CJK sentence marks always end one. Decimals never split.
export function firstSentences(text, max = 320) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  const ends = [];
  for (let i = 0; i < value.length && ends.length < 2; i += 1) {
    const c = value[i];
    if ("。！？".includes(c)) { ends.push(i + 1); continue; }
    if (!".!?".includes(c)) continue;
    const next = value.slice(i + 1, i + 3);
    if (!/^\s[A-Z"“‘(\u0400-\u04FF\u0600-\u06FF]/.test(next) && i + 1 < value.length) continue;
    if (c === "." && /(?:^|[\s.])[A-Za-z]$/.test(value.slice(Math.max(0, i - 2), i))) continue;
    ends.push(i + 1);
  }
  let out = value.slice(0, ends[0] || value.length);
  if (ends[1] && ends[1] <= max) out = value.slice(0, ends[1]);
  if (out.length > max) out = `${out.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
  return out.trim();
}

// ------------------------------------------------------------------------------------------------- item builders
const withIdentity = (item, enHeadline) => {
  const key = flashKey(item.id);
  return { ...item, key, slug: flashSlug(enHeadline) };
};

function announcementItem(row, brief) {
  if (!row || typeof row.id !== "string" || !row.title || !row.url || !Number.isFinite(Date.parse(row.publishedAt))) return null;
  const incident = !brief && ["news", "product"].includes(row.category) && INCIDENT_RE.test(String(row.title));
  const type = brief ? "campaign" : incident ? "incident" : ({ listing: "listing", delisting: "delisting", event: "campaign" })[row.category];
  if (!type) return null;
  const parsed = parseAnnouncementTitle(row.title);
  const item = {
    id: `a:${row.id}`, type, time: new Date(Date.parse(row.publishedAt)).toISOString(), venue: row.venue || null,
    assets: type === "campaign" ? [] : parsed.assets, data: { market: parsed.market, when: parsed.when, prize: parsed.prize, reward: parsed.reward, verb: parsed.verb, delistVerb: parsed.delistVerb, category: row.category },
    source: { kind: "official", url: row.url, title: row.title }, updatePath: updatePath(row),
    ...(brief ? { brief: { headline: brief.headline || null, summary: brief.summary || null } } : {}),
  };
  return withIdentity(item, renderText(item, "en").headline);
}

function newsItem(article) {
  if (!article?.slug || article.status !== "PUBLISHED" || !Number.isFinite(Date.parse(article.publishedAt))) return null;
  const title = typeof article.title === "object" ? article.title : { en: article.title };
  if (!title?.en) return null;
  const summary = typeof article.summary === "object" ? article.summary : { en: article.summary || "" };
  const locales = Array.isArray(article.availableLocales) && article.availableLocales.length ? article.availableLocales : Object.keys(title);
  const venue = (Array.isArray(article.relatedVenues) ? article.relatedVenues : []).find((slug) => VENUE_NAMES[slug]) || null;
  const item = { id: `n:${article.slug}`, type: "news", time: new Date(Date.parse(article.publishedAt)).toISOString(), venue, assets: [], data: {},
    source: { kind: "news", url: `/news/${article.slug}` }, news: { title, summary, locales } };
  return withIdentity(item, title.en);
}

/** Market items derived from one collector snapshot; ids are stable per hour / day / funding window. */
export function marketFlashItems(feed, { now = Date.now() } = {}) {
  if (!feed || typeof feed !== "object") return [];
  const out = [];
  const generatedAt = Number.isFinite(Date.parse(feed.generatedAt)) ? new Date(Date.parse(feed.generatedAt)).toISOString() : new Date(now).toISOString();
  for (const row of Array.isArray(feed.history?.hourly) ? feed.history.hourly : []) {
    const total = Number(row?.totalUsd) || 0;
    if (total < FLASH_THRESHOLDS.liquidationHourUsd || !Number.isFinite(Date.parse(row.t))) continue;
    const t = new Date(Date.parse(row.t)).toISOString();
    out.push({ id: `liq:${t.slice(0, 13)}`, type: "liquidation-spike", time: t, venue: null, assets: [],
      data: { totalUsd: total, longUsd: Number(row.longUsd) || 0, shortUsd: Number(row.shortUsd) || 0 }, source: { kind: "market", url: "/liquidations" } });
  }
  for (const row of Array.isArray(feed.market?.majors) ? feed.market.majors : []) {
    if (Math.abs(Number(row?.change1hPct) || 0) < FLASH_THRESHOLDS.majorMove1hPct || !Number.isFinite(Number(row.price))) continue;
    const sym = baseSymbol(row.symbol);
    out.push({ id: `move:${sym}:${generatedAt.slice(0, 13)}`, type: "sharp-move", time: generatedAt, venue: "binance", assets: [sym],
      data: { kind: "1h", price: Number(row.price), change1hPct: Number(row.change1hPct), change24hPct: Number(row.change24hPct) || 0 }, source: { kind: "market", url: "/liquidations" } });
  }
  for (const row of Array.isArray(feed.market?.movers) ? feed.market.movers : []) {
    if (Math.abs(Number(row?.change24hPct) || 0) < FLASH_THRESHOLDS.mover24hPct || (Number(row.quoteVolume24h) || 0) < FLASH_THRESHOLDS.moverMinVolumeUsd) continue;
    const sym = baseSymbol(row.symbol);
    out.push({ id: `mover:${sym}:${generatedAt.slice(0, 10)}`, type: "sharp-move", time: generatedAt, venue: "binance", assets: [sym],
      data: { kind: "24h", change24hPct: Number(row.change24hPct), volumeUsd: Number(row.quoteVolume24h) }, source: { kind: "market", url: "/liquidations" } });
  }
  const fundingAt = Number.isFinite(Date.parse(feed.funding?.generatedAt)) ? new Date(Date.parse(feed.funding.generatedAt)).toISOString() : generatedAt;
  for (const row of Array.isArray(feed.funding?.rows) ? feed.funding.rows : []) {
    const binance = Number(row?.binanceRate);
    if (!Number.isFinite(binance) || Math.abs(binance) < FLASH_THRESHOLDS.fundingAbsRate) continue;
    const next = Number.isFinite(Date.parse(row.binanceNextAt)) ? new Date(Date.parse(row.binanceNextAt)).toISOString() : null;
    out.push({ id: `fund:${row.symbol}:${(next || fundingAt).slice(0, 13)}`, type: "funding-extreme", time: fundingAt, venue: "binance", assets: [String(row.symbol)],
      data: { binanceRate: binance, okxRate: Number.isFinite(Number(row.okxRate)) && row.okxRate !== null ? Number(row.okxRate) : null, nextAt: next }, source: { kind: "market", url: "/funding-rates" } });
  }
  return out.filter((item) => Date.parse(item.time) <= now + MAX_FUTURE_SKEW_MS).map((item) => withIdentity(item, renderText(item, "en").headline));
}

/**
 * Every flash item, newest first. `remembered` are market items kept from earlier snapshots (first sighting wins);
 * the result's `marketItems` is the updated memory to persist.
 */
export function buildFlashItems({ announcements = null, archive = null, briefs = [], market = null, news = [], remembered = [], now = Date.now() } = {}) {
  const briefById = new Map((Array.isArray(briefs) ? briefs : []).filter((b) => b && typeof b.id === "string").map((b) => [b.id, b]));
  const rows = new Map();
  for (const row of [...(Array.isArray(archive?.items) ? archive.items : []), ...(Array.isArray(announcements?.items) ? announcements.items : [])]) {
    if (row && typeof row.id === "string") rows.set(row.id, { ...(rows.get(row.id) || {}), ...row });
  }
  const items = [];
  for (const row of rows.values()) { const item = announcementItem(row, briefById.get(row.id)); if (item) items.push(item); }
  for (const article of Array.isArray(news) ? news : []) {
    if (now - Date.parse(article?.publishedAt) > NEWS_WINDOW_MS) continue;
    const item = newsItem(article); if (item) items.push(item);
  }
  const memory = new Map((Array.isArray(remembered) ? remembered : []).filter((item) => item?.id && item.key && FLASH_TYPES.includes(item.type)).map((item) => [item.id, item]));
  for (const item of marketFlashItems(market, { now })) if (!memory.has(item.id)) memory.set(item.id, item);
  const marketItems = [...memory.values()].filter((item) => now - Date.parse(item.time) <= RETENTION_MS)
    .sort((a, b) => Date.parse(b.time) - Date.parse(a.time)).slice(0, MAX_MARKET_ITEMS);
  const all = [...items, ...marketItems].filter((item) => {
    const t = Date.parse(item.time);
    return Number.isFinite(t) && t <= now + MAX_FUTURE_SKEW_MS && now - t <= RETENTION_MS;
  });
  const byKey = new Map();
  for (const item of all) if (!byKey.has(item.key)) byKey.set(item.key, item);
  return { items: [...byKey.values()].sort((a, b) => Date.parse(b.time) - Date.parse(a.time) || a.id.localeCompare(b.id)), marketItems };
}

// ------------------------------------------------------------------------------------------------------ rendering
const assetsText = (assets) => {
  const shown = assets.slice(0, MAX_ASSETS).join(", ");
  return assets.length > MAX_ASSETS ? `${shown} +${assets.length - MAX_ASSETS}` : shown;
};

/** Headline and body of an item in a locale. `localized` is false when the text falls back to English. */
export function renderText(item, locale = "en") {
  if (item.type === "news") {
    const native = item.news.locales.includes(locale) && item.news.title[locale];
    const lang = native ? locale : "en";
    return { headline: item.news.title[lang], body: firstSentences(item.news.summary?.[lang] || item.news.summary?.en || ""), localized: Boolean(native), lang, facts: [] };
  }
  const t = templatesFor(locale);
  const lang = t ? locale : "en";
  const tt = t || T.en;
  const venue = flashVenueName(item.venue, lang);
  const d = item.data || {};
  if (item.brief?.headline) {
    const native = typeof item.brief.headline[locale] === "string" && item.brief.headline[locale].trim();
    const blang = native ? locale : "en";
    const headline = (item.brief.headline[blang] || "").trim();
    if (headline) {
      const summary = item.brief.summary?.[blang] || item.brief.summary?.en || "";
      return { headline, body: summary ? firstSentences(summary) : fill(tt.annBody, { venue, published: fmtUtc(item.time) }), localized: Boolean(native), lang: blang, facts: [] };
    }
  }
  const facts = [];
  const f = (value) => { facts.push(value); return value; };
  let headline = "", body = "", generic = false;
  if (item.type === "incident") {
    const published = f(fmtUtc(item.time));
    const assets = item.assets.length ? f(assetsText(item.assets)) : "";
    generic = !assets;
    headline = assets ? fill(tt.incidentHead, { venue, assets }) : fill(tt.incidentGeneric, { venue });
    const lead = fill(tt.annBody, { venue, published });
    body = `${lead}${/[。！？]$/.test(lead) ? "" : " "}${tt.incidentBody}`;
  } else if (item.type === "listing" || item.type === "delisting" || item.type === "campaign") {
    const published = f(fmtUtc(item.time));
    body = fill(tt.annBody, { venue, published });
    if (d.when) body += ` ${fill(tt.whenBody, { when: f(/\d{4}-\d\d-\d\d \d\d:\d\d UTC$/.test(d.when) ? formatSgt(d.when.replace(" ", "T").replace(" UTC", ":00Z")) : d.when) })}`;
    if (item.type === "campaign") {
      const reward = d.reward || (d.prize ? { ...d.prize, kind: "totalPrizePool" } : null);
      generic = !reward;
      if (reward?.kind === "totalPrizePool") {
        headline = fill(tt.campaignPrize || T.en.campaignPrize, { venue, amount: f(reward.amount), asset: f(reward.asset) });
      } else if (reward?.kind === "perUserMax") {
        headline = fill(tt.campaignMaxReward || T.en.campaignMaxReward, { venue, amount: f(reward.amount), asset: f(reward.asset) });
      } else if (reward?.kind === "voucherFaceValue") {
        headline = fill(tt.campaignVoucher || T.en.campaignVoucher, { venue, amount: f(reward.amount), asset: f(reward.asset) });
      } else {
        headline = fill(tt.campaignGeneric, { venue });
      }
      if (reward) body += ` ${headline}.`;
    } else {
      const assets = item.assets.length ? f(assetsText(item.assets)) : "";
      const market = item.type === "listing" && d.market ? fill(tt.mkWrap, { m: tt.mk[d.market] }) : "";
      const key = item.type === "listing"
        ? (assets ? (d.verb ? "listing" : "listingNotice") : "listingGeneric")
        : (assets ? (d.delistVerb ? "delisting" : "delistingNotice") : "delistingGeneric");
      generic = !assets;
      headline = fill(tt[key], { venue, assets, market });
      if (assets) body += ` ${headline}.`;
    }
  } else if (item.type === "liquidation-spike") {
    const longSide = d.longUsd >= d.shortUsd;
    const share = String(Math.round(((longSide ? d.longUsd : d.shortUsd) / (d.totalUsd || 1)) * 100));
    const vars = { total: f(fmtUsd(d.totalUsd)), share: f(share), side: tt.side[longSide ? "long" : "short"], long: f(fmtUsd(d.longUsd)), short: f(fmtUsd(d.shortUsd)), hour: f(fmtClock(item.time)) };
    headline = fill(tt.liqHead, vars);
    body = fill(tt.liqBody, vars);
  } else if (item.type === "sharp-move") {
    const sym = f(item.assets[0]);
    if (d.kind === "1h") {
      const vars = { sym, pct: f(fmtPct(d.change1hPct)), price: f(fmtPrice(d.price)), pct24: f(fmtPct(d.change24hPct)), time: f(fmtClock(item.time)) };
      headline = fill(tt.moveHead, vars); body = fill(tt.moveBody, vars);
    } else {
      const vars = { sym, pct: f(fmtPct(d.change24hPct)), vol: f(fmtUsd(d.volumeUsd)), time: f(fmtClock(item.time)) };
      headline = fill(tt.moverHead, vars); body = fill(tt.moverBody, vars);
    }
  } else if (item.type === "funding-extreme") {
    const vars = { sym: f(item.assets[0]), rate: f(fmtRate(d.binanceRate)), venue: "Binance", binance: fmtRate(d.binanceRate), okx: f(fmtRate(d.okxRate)), next: f(d.nextAt ? fmtClock(d.nextAt) : "—"), payer: d.binanceRate > 0 ? tt.payLong : tt.payShort };
    headline = fill(tt.fundHead, vars); body = fill(tt.fundBody, vars);
  }
  return { headline, body, localized: Boolean(t), lang, facts, generic };
}

const VENUE_PROFILES = new Set(["binance", "okx", "bitget", "bybit", "kucoin", "kraken", "gate-io", "mexc", "htx", "hyperliquid", "coinbase"]);

/** Related internal links of an item (relative paths; the page localizes them). */
export function flashLinks(item) {
  const links = [];
  if (item.updatePath) links.push({ kind: "update", href: item.updatePath });
  if (item.type === "news") links.push({ kind: "article", href: item.source.url });
  if (item.type === "liquidation-spike" || item.type === "sharp-move") links.push({ kind: "liquidations", href: "/liquidations" });
  if (item.type === "funding-extreme") links.push({ kind: "funding", href: "/funding-rates" });
  if (item.venue && VENUE_PROFILES.has(item.venue)) links.push({ kind: "profile", href: `/exchanges/${item.venue}` });
  return links;
}

export function flashItemHasIndexableFacts(item, locale = "en") {
  if (!item || item.type === "news") return false;
  const d = item.data || {};
  if (item.source?.kind !== "official") return true;
  const hasBriefBody = Boolean(String(item.brief?.summary?.[locale] || "").trim());
  if (item.type === "campaign") return hasBriefBody || Boolean(d.reward || d.prize || d.when);
  return Boolean((Array.isArray(item.assets) && item.assets.length) || d.when);
}

export const isFlashIndexable = () => false;

/** Locales whose edition of this item is indexable (hreflang set and sitemap). */
export function flashItemIndexLocales(item, { now = Date.now() } = {}) {
  return FLASH_INDEX_LOCALES.filter((locale) => campaignVisibleInLocale(item, locale) && isFlashIndexable(item, locale, { now, localized: renderText(item, locale).localized }));
}

// Neutral locales (locale-policy.js): an item about a referral code, or whose text carries a code or sign-up link, is
// left out of the stream and the related list; an item page opened directly loses those sentences.
function neutralFlashHidden(item, locale) {
  if (!isNeutralCtaLocale(locale)) return false;
  const text = renderText(item, locale);
  const slug = item.type === "news" ? String(item.source?.url || "").split(/[?#]/)[0].split("/").filter(Boolean).pop() : "";
  return isReferralTopicArticle({ slug, title: { en: renderText(item, "en").headline } }) || carriesSignupPath(`${text.headline}\n${text.body}`);
}

/** Compact, locale-rendered row the browser receives (no templates ship to the client). */
export function flashView(item, locale = "en", { now = Date.now() } = {}) {
  const rendered = renderText(item, locale);
  const text = isNeutralCtaLocale(locale) ? { ...rendered, body: neutralArticleMarkdown(rendered.body, locale) } : rendered;
  const importance = flashImportance(item);
  return {
    ...(importance ? { important: true, importance } : {}),
    id: item.id, key: item.key, path: flashItemPath(item), type: item.type, typeLabel: flashUiCopy(locale).types[item.type], time: item.time, venue: item.venue || null,
    venueName: item.venue ? flashVenueName(item.venue, text.lang) : null, assets: item.assets || [],
    headline: text.headline, body: text.body, lang: text.lang, ...(text.generic ? { generic: true } : {}),
    source: { kind: item.source.kind, url: item.source.url, ...(item.source.title ? { title: item.source.title } : {}) },
    links: flashLinks(item), indexable: isFlashIndexable(item, locale, { now, localized: text.localized }),
  };
}

export const findFlashItem = (items, key) => (Array.isArray(items) ? items : []).find((item) => item.key === key) || null;

/** Stream page / JSON payload: newest first, optional type, venue and `before` cursor. */
export function flashStreamPayload(items, locale = "en", { limit = 40, before = null, type = null, venue = null, important = false, now = Date.now(), generatedAt = null } = {}) {
  const all = (Array.isArray(items) ? items : []).filter((item) => !neutralFlashHidden(item, locale));
  let rows = all.filter((item) => campaignVisibleInLocale(item, locale));
  if (important) rows = rows.filter((item) => flashImportance(item));
  if (type && FLASH_TYPES.includes(type)) rows = rows.filter((item) => item.type === type);
  if (venue) rows = rows.filter((item) => item.venue === venue);
  if (before && Number.isFinite(Date.parse(before))) rows = rows.filter((item) => Date.parse(item.time) < Date.parse(before));
  const page = rows.slice(0, Math.max(1, Math.min(100, Number(limit) || 40)));
  const counts = new Map();
  for (const item of all.filter((row) => campaignVisibleInLocale(row, locale)).slice(0, 400)) if (item.venue && VENUE_PROFILES.has(item.venue)) counts.set(item.venue, (counts.get(item.venue) || 0) + 1);
  return {
    generatedAt: generatedAt || new Date(now).toISOString(), locale,
    items: page.map((item) => flashView(item, locale, { now })),
    hasMore: rows.length > page.length,
    venues: [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([slug]) => ({ slug, name: flashVenueName(slug, templatesFor(locale) ? locale : "en") })),
  };
}

/** Item page payload: the item plus related items (same exchange first, then the latest of the same type). */
export function flashItemPayload(items, item, locale = "en", { now = Date.now() } = {}) {
  const others = (Array.isArray(items) ? items : []).filter((row) => row.key !== item.key && !neutralFlashHidden(row, locale));
  const sameVenue = item.venue ? others.filter((row) => row.venue === item.venue) : [];
  const sameType = others.filter((row) => row.type === item.type);
  const related = [...new Map([...sameVenue.slice(0, 3), ...sameType.slice(0, 6), ...others.slice(0, 6)].filter((row) => campaignVisibleInLocale(row, locale)).map((row) => [row.key, row])).values()].slice(0, 6);
  return { item: flashView(item, locale, { now }), related: related.map((row) => flashView(row, locale, { now })) };
}

// ------------------------------------------------------------------------------------------------------------ SEO
const ORIGIN = "https://nexualpha.com";
const ORGANIZATION = Object.freeze({ "@type": "Organization", "@id": `${ORIGIN}/#organization`, name: "NexuAlpha", url: `${ORIGIN}/`, logo: { "@type": "ImageObject", url: `${ORIGIN}/brand/nexualpha/nexualpha-social-v1.jpg` } });
const SOCIAL_IMAGE = `${ORIGIN}/brand/nexualpha/nexualpha-social-v1.jpg`;
const absolute = (href) => (/^https?:\/\//.test(href) ? href : `${ORIGIN}${href}`);
const fitTitle = (candidates, locale) => {
  const budget = titleBudgetForLocale(locale);
  return candidates.find((title) => title && title.length <= budget) || budgetTitle(candidates[candidates.length - 1], budget);
};
const crumbs = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })) });

/** Head of /flash: title, description and a LiveBlogPosting with the latest updates. urlFor(path) = canonical URL. */
export function flashStreamSeo(payload, locale, { urlFor }) {
  const t = flashUiCopy(locale);
  const url = urlFor(FLASH_PATH);
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const newest = items[0]?.time || payload?.generatedAt || new Date().toISOString();
  const oldest = items[items.length - 1]?.time || newest;
  return {
    title: fitTitle([`${t.h1} | NexuAlpha`, t.h1, `${t.nav} | NexuAlpha`], locale),
    description: t.lead,
    schemas: [
      { "@context": "https://schema.org", "@type": "LiveBlogPosting", "@id": `${url}#live`, headline: t.h1, description: t.lead, url, inLanguage: locale,
        coverageStartTime: oldest, datePublished: oldest, dateModified: newest, publisher: ORGANIZATION, author: ORGANIZATION, image: SOCIAL_IMAGE,
        liveBlogUpdate: items.slice(0, 10).map((item) => ({ "@type": "BlogPosting", headline: item.headline.slice(0, 110), datePublished: item.time, url: urlFor(item.path), ...(item.lang !== locale ? { inLanguage: item.lang } : {}) })) },
      crumbs([["NexuAlpha", urlFor("/")], [t.nav, url]]),
    ],
  };
}

/** Head of one flash item. Generic headlines carry their time so titles stay distinct. */
export function flashItemSeo(view, locale, { urlFor }) {
  const t = flashUiCopy(locale);
  const url = urlFor(view.path);
  const headline = view.generic ? `${view.headline} · ${fmtUtc(view.time)} SGT` : view.headline;
  const titleHeadline = view.generic ? `${fmtUtc(view.time).slice(5)} SGT · ${view.headline}` : headline;
  const description = view.body && view.body !== view.headline
    ? `${fmtUtc(view.time)} SGT · ${view.headline}. ${view.body}`
    : `${fmtUtc(view.time)} SGT · ${view.headline}`;
  return {
    title: fitTitle([`${titleHeadline} | NexuAlpha`, titleHeadline], locale),
    description,
    schemas: [crumbs([["NexuAlpha", urlFor("/")], [t.nav, urlFor(FLASH_PATH)], [headline.slice(0, 110), url]])],
  };
}

const xml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const NEWS_LANGUAGE = { "zh-Hans": "zh-cn", "zh-Hant": "zh-tw", "pt-BR": "pt" };
/**
 * sitemap-flash.xml: indexable items of the last 7 days, one entry per indexable locale with the full hreflang set;
 * items of the last 48 hours also carry Google News tags. urlFor(path, locale) = canonical URL; alternates(path, locales).
 */
export function renderFlashSitemap(items, { now = Date.now(), urlFor, alternates, windowMs = 7 * 24 * 60 * 60 * 1000 } = {}) {
  const rows = [];
  for (const item of Array.isArray(items) ? items : []) {
    const time = Date.parse(item.time);
    if (item.type === "news" || !Number.isFinite(time) || now - time > windowMs || time > now + MAX_FUTURE_SKEW_MS) continue;
    const locales = flashItemIndexLocales(item, { now });
    const path = flashItemPath(item);
    const altLines = alternates(path, locales).map((alt) => `    <xhtml:link rel="alternate" hreflang="${xml(alt.hreflang)}" href="${xml(alt.href)}" />`);
    for (const locale of locales) {
      const lines = ["  <url>", `    <loc>${xml(urlFor(path, locale))}</loc>`, ...altLines, `    <lastmod>${new Date(time).toISOString()}</lastmod>`];
      if (now - time <= 48 * 60 * 60 * 1000) {
        lines.push("    <news:news>", "      <news:publication>", "        <news:name>NexuAlpha</news:name>",
          `        <news:language>${NEWS_LANGUAGE[locale] || locale.toLowerCase()}</news:language>`, "      </news:publication>",
          `      <news:publication_date>${new Date(time).toISOString()}</news:publication_date>`, `      <news:title>${xml(renderText(item, locale).headline)}</news:title>`, "    </news:news>");
      }
      lines.push("  </url>");
      rows.push(lines.join("\n"));
    }
  }
  return ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...rows.slice(0, 40000), "</urlset>", ""].join("\n");
}

export { FLASH_PATH };
