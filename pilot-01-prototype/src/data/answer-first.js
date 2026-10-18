// Answer-first "short answer" leads for money pages (striking-distance pass 2026-10-18).
// A 40-60 word paragraph of self-contained, citable sentences: each states a figure from site data, names where it comes
// from (the exchange's own fee page, the partner terms) and when it was checked. Nothing here is typed by hand:
// fees come from exchange-facts.js (official fee pages, dated), rebate shares, codes and payout cadence from the partner
// registry (referral-partners.generated.js). The cost examples are arithmetic on those two inputs.
// Locale rules: neutral editions (ru, ar, zh-Hant, ur, uk, vi) never carry a code or a rebate; Türkiye pages leave Bitget
// out entirely (SPK list) and carry no Bitget code. Rebates are framed by trading volume, never by time.
import { EXCHANGE_FACTS, feeFact, primarySourceUrl, FACTS_AS_OF } from "./exchange-facts.js";
import { formatFee } from "./format-fee.js";
import { REFERRAL_PARTNERS } from "./referral-partners.generated.js";
import { isNeutralCtaLocale } from "./locale-policy.js";
import { isPartnerPromotableIn, isTurkeyPage, TURKEY_UNLISTED_VENUES } from "./partner-geo-policy.js";

/** Exchange profiles that open with a short answer (owner push order first). */
export const ANSWER_FIRST_VENUES = Object.freeze(["bitget", "okx", "binance", "bybit", "htx", "gate-io", "mexc"]);
/** Futures volume used for every worked example, in USDT. */
export const EXAMPLE_VOLUME_USDT = 100000;
// exchange-facts.js holds MEXC fees back (state "unchecked") because its official sources disagree; the figures below
// are the two the data note records ("fee page says 0% spot; official API ... most commonly 0/0.08%", 2026-10-10).
// tests/answer-first.test.mjs fails if that note stops saying so.
const MEXC_PAGE_SPOT = 0;
const MEXC_API_MAKER = 0;
const MEXC_API_TAKER = 0.08;

const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];

function normalizeLocale(locale) {
  const raw = String(locale || "en").replaceAll("_", "-");
  const lower = raw.toLowerCase();
  if (/^zh-(hant|tw|hk|mo)(-|$)/.test(lower)) return "zh-Hant";
  if (/^zh($|-(hans|cn|sg)(-|$))/.test(lower)) return "zh-Hans";
  if (/^pt(-|$)/.test(lower)) return "pt-BR";
  const base = lower.split("-")[0];
  return LOCALES.includes(base) ? base : null;
}

const pctOf = (value, locale) => {
  const n = new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : locale, { maximumFractionDigits: 0 }).format(value);
  if (locale === "tr") return `%${n}`;
  if (["fr", "de"].includes(locale)) return `${n} %`;
  return `${n}%`;
};
const usd = (value, locale) => `$${new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : locale, { minimumFractionDigits: Number.isInteger(Math.round(value * 100) / 100) ? 0 : 2, maximumFractionDigits: 2 }).format(Math.round(value * 100) / 100)}`;
const volume = (locale) => new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : locale).format(EXAMPLE_VOLUME_USDT);
const host = (slug) => {
  try { return new URL(primarySourceUrl(slug)).hostname.replace(/^www\./, ""); } catch { return ""; }
};

// One entry per shipped locale. Sentences stay short and plain; every one carries its own subject.
const COPY = {
  en: {
    label: "The short answer:",
    cadence: { hourly: "automatically every hour", daily: "automatically every day" },
    fees: (n, sm, st, pm, pt) => `${n} charges ${sm} maker / ${st} taker on spot and ${pm} / ${pt} on USDT perpetuals at its standard tier.`,
    mexc: (n, page, am, at) => `${n} sets fees per trading pair: its fee page lists ${page} spot fees, while its API charges most pairs ${am} maker / ${at} taker.`,
    rebate: (code, share, cadence, vol, amt) => `With code ${code}, up to ${share} of your trading fees come back${cadence ? ` ${cadence}` : ""}: ${vol} USDT of futures volume → up to ${amt} returned.`,
    code: (code) => `Sign up with code ${code} on the official site.`,
    cost: (vol, amt) => `On ${vol} USDT of futures volume, that is ${amt} in taker fees.`,
    source: (h, date, terms) => `Fees from ${h}'s official fee page, as of ${date}${terms ? `; rebate terms confirmed ${terms}` : ""}.`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `${a} charges ${ast} spot taker and ${apt} perpetual taker; ${b} charges ${bst} and ${bpt}.`,
    cmpCost: (vol, af, bf) => `On ${vol} USDT of futures, taker fees are ${af} vs ${bf}.`,
    cmpRebate: (items) => `With our sign-up codes, ${items.join(" and ")} come back.`,
    rebateItem: (share, n) => `up to ${share} of ${n} fees`,
    cmpSource: (ha, hb, date) => `Fees from the ${ha} and ${hb} official fee pages, as of ${date}.`,
    track: (n) => `NexuAlpha lists standard maker/taker fees for ${n} exchanges, each read from the exchange's official fee page.`,
    directory: (total, n) => `This list covers ${total} crypto exchanges and DEXs; ${n} have standard fees read from their official fee pages.`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `Spot taker fees run from ${smin} (${sminN}) to ${smax} (${smaxN}); perpetual-futures taker fees from ${pmin} (${pminN}) to ${pmax} (${pmaxN}).`,
    costRange: (vol, lo, hi) => `On ${vol} USDT of futures volume, that is ${lo} to ${hi} in taker fees.`,
    checked: (d1, d2) => (d1 === d2 ? `Checked ${d1}.` : `Checked between ${d1} and ${d2}.`),
    list: (names) => names.join(", "),
  },
  "zh-Hans": {
    label: "简短回答：",
    cadence: { hourly: "，每小时自动返还", daily: "，每天自动返还" },
    fees: (n, sm, st, pm, pt) => `${n} 标准费率：现货挂单 ${sm}、吃单 ${st}，USDT 永续合约挂单 ${pm}、吃单 ${pt}。`,
    mexc: (n, page, am, at) => `${n} 按交易对设定费率：官方费率页写现货 ${page}，而官方 API 对多数交易对收取挂单 ${am}、吃单 ${at}。`,
    rebate: (code, share, cadence, vol, amt) => `注册时填写邀请码 ${code}，最高返还 ${share} 手续费${cadence}：合约交易量 ${vol} U → 最高返还 ${amt}。`,
    code: (code) => `在官方网站注册时填写邀请码 ${code}。`,
    cost: (vol, amt) => `合约交易量 ${vol} U，吃单手续费为 ${amt}。`,
    source: (h, date, terms) => `费率来自 ${h} 官方费率页，核对于 ${date}${terms ? `；返佣条款确认于 ${terms}` : ""}。`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `${a} 现货吃单 ${ast}、永续合约吃单 ${apt}；${b} 分别为 ${bst} 和 ${bpt}。`,
    cmpCost: (vol, af, bf) => `合约交易量 ${vol} U，吃单手续费分别为 ${af} 和 ${bf}。`,
    cmpRebate: (items) => `用我们的邀请码注册，${items.join("、")}。`,
    rebateItem: (share, n) => `${n} 最高返还 ${share} 手续费`,
    cmpSource: (ha, hb, date) => `费率来自 ${ha} 和 ${hb} 官方费率页，核对于 ${date}。`,
    track: (n) => `NexuAlpha 收录 ${n} 家交易所的标准挂单/吃单费率，每一项都取自交易所官方费率页。`,
    directory: (total, n) => `本列表收录 ${total} 家加密货币交易所和 DEX，其中 ${n} 家的标准费率取自官方费率页。`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `现货吃单费率从 ${smin}（${sminN}）到 ${smax}（${smaxN}）；永续合约吃单费率从 ${pmin}（${pminN}）到 ${pmax}（${pmaxN}）。`,
    costRange: (vol, lo, hi) => `合约交易量 ${vol} U，吃单手续费在 ${lo} 到 ${hi} 之间。`,
    checked: (d1, d2) => (d1 === d2 ? `核对于 ${d1}。` : `核对于 ${d1} 至 ${d2}。`),
    list: (names) => names.join("、"),
  },
  "zh-Hant": {
    label: "簡短回答：",
    cadence: { hourly: "", daily: "" },
    fees: (n, sm, st, pm, pt) => `${n} 標準費率：現貨掛單 ${sm}、吃單 ${st}，USDT 永續合約掛單 ${pm}、吃單 ${pt}。`,
    mexc: (n, page, am, at) => `${n} 按交易對設定費率：官方費率頁寫現貨 ${page}，而官方 API 對多數交易對收取掛單 ${am}、吃單 ${at}。`,
    rebate: () => "",
    code: () => "",
    cost: (vol, amt) => `合約交易量 ${vol} U，吃單手續費為 ${amt}。`,
    source: (h, date) => `費率來自 ${h} 官方費率頁，核對於 ${date}。`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `${a} 現貨吃單 ${ast}、永續合約吃單 ${apt}；${b} 分別為 ${bst} 和 ${bpt}。`,
    cmpCost: (vol, af, bf) => `合約交易量 ${vol} U，吃單手續費分別為 ${af} 和 ${bf}。`,
    cmpRebate: () => "",
    rebateItem: () => "",
    cmpSource: (ha, hb, date) => `費率來自 ${ha} 和 ${hb} 官方費率頁，核對於 ${date}。`,
    track: (n) => `NexuAlpha 收錄 ${n} 家交易所的標準掛單/吃單費率，每一項都取自交易所官方費率頁。`,
    directory: (total, n) => `本列表收錄 ${total} 家加密貨幣交易所和 DEX，其中 ${n} 家的標準費率取自官方費率頁。`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `現貨吃單費率從 ${smin}（${sminN}）到 ${smax}（${smaxN}）；永續合約吃單費率從 ${pmin}（${pminN}）到 ${pmax}（${pmaxN}）。`,
    costRange: (vol, lo, hi) => `合約交易量 ${vol} U，吃單手續費在 ${lo} 到 ${hi} 之間。`,
    checked: (d1, d2) => (d1 === d2 ? `核對於 ${d1}。` : `核對於 ${d1} 至 ${d2}。`),
    list: (names) => names.join("、"),
  },
  es: {
    label: "Respuesta corta:",
    cadence: { hourly: "automáticamente cada hora", daily: "automáticamente cada día" },
    fees: (n, sm, st, pm, pt) => `${n} cobra ${sm} maker / ${st} taker en spot y ${pm} / ${pt} en perpetuos USDT en su nivel estándar.`,
    mexc: (n, page, am, at) => `${n} fija comisiones por par: su página de comisiones indica ${page} en spot, mientras su API cobra a la mayoría de pares ${am} maker / ${at} taker.`,
    rebate: (code, share, cadence, vol, amt) => `Con el código ${code}, te devuelven hasta el ${share} de tus comisiones${cadence ? ` ${cadence}` : ""}: ${vol} USDT de volumen en futuros → hasta ${amt} de vuelta.`,
    code: (code) => `Regístrate con el código ${code} en el sitio oficial.`,
    cost: (vol, amt) => `Con ${vol} USDT de volumen en futuros, pagas ${amt} en comisiones taker.`,
    source: (h, date, terms) => `Comisiones de la página oficial de ${h}, a ${date}${terms ? `; condiciones de reembolso confirmadas el ${terms}` : ""}.`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `${a} cobra ${ast} taker en spot y ${apt} taker en perpetuos; ${b} cobra ${bst} y ${bpt}.`,
    cmpCost: (vol, af, bf) => `Con ${vol} USDT en futuros, las comisiones taker son ${af} frente a ${bf}.`,
    cmpRebate: (items) => `Con nuestros códigos de registro te devuelven ${items.join(" y ")}.`,
    rebateItem: (share, n) => `hasta el ${share} de las comisiones de ${n}`,
    cmpSource: (ha, hb, date) => `Comisiones de las páginas oficiales de ${ha} y ${hb}, a ${date}.`,
    track: (n) => `NexuAlpha recoge las comisiones maker/taker estándar de ${n} exchanges, cada una leída en la página oficial del exchange.`,
    directory: (total, n) => `Esta lista incluye ${total} exchanges y DEX de cripto; ${n} tienen comisiones estándar leídas en su página oficial.`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `La comisión taker en spot va de ${smin} (${sminN}) a ${smax} (${smaxN}); en perpetuos, de ${pmin} (${pminN}) a ${pmax} (${pmaxN}).`,
    costRange: (vol, lo, hi) => `Con ${vol} USDT de volumen en futuros, eso son entre ${lo} y ${hi} en comisiones taker.`,
    checked: (d1, d2) => (d1 === d2 ? `Revisado el ${d1}.` : `Revisado entre el ${d1} y el ${d2}.`),
    list: (names) => names.join(", "),
  },
  "pt-BR": {
    label: "Resposta curta:",
    cadence: { hourly: "automaticamente a cada hora", daily: "automaticamente todo dia" },
    fees: (n, sm, st, pm, pt) => `A ${n} cobra ${sm} maker / ${st} taker no spot e ${pm} / ${pt} nos perpétuos USDT no nível padrão.`,
    mexc: (n, page, am, at) => `A ${n} define taxas por par: a página de taxas mostra ${page} no spot, enquanto a API cobra da maioria dos pares ${am} maker / ${at} taker.`,
    rebate: (code, share, cadence, vol, amt) => `Com o código ${code}, até ${share} das suas taxas voltam para você${cadence ? ` ${cadence}` : ""}: ${vol} USDT de volume em futuros → até ${amt} de volta.`,
    code: (code) => `Cadastre-se com o código ${code} no site oficial.`,
    cost: (vol, amt) => `Com ${vol} USDT de volume em futuros, isso dá ${amt} em taxas taker.`,
    source: (h, date, terms) => `Taxas da página oficial da ${h}, em ${date}${terms ? `; termos do reembolso confirmados em ${terms}` : ""}.`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `A ${a} cobra ${ast} taker no spot e ${apt} taker nos perpétuos; a ${b} cobra ${bst} e ${bpt}.`,
    cmpCost: (vol, af, bf) => `Com ${vol} USDT em futuros, as taxas taker são ${af} contra ${bf}.`,
    cmpRebate: (items) => `Com nossos códigos de cadastro, voltam para você ${items.join(" e ")}.`,
    rebateItem: (share, n) => `até ${share} das taxas da ${n}`,
    cmpSource: (ha, hb, date) => `Taxas das páginas oficiais da ${ha} e da ${hb}, em ${date}.`,
    track: (n) => `A NexuAlpha lista as taxas maker/taker padrão de ${n} corretoras, cada uma lida na página oficial da corretora.`,
    directory: (total, n) => `Esta lista reúne ${total} corretoras e DEXs de cripto; ${n} têm taxas padrão lidas na página oficial.`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `A taxa taker no spot vai de ${smin} (${sminN}) a ${smax} (${smaxN}); nos perpétuos, de ${pmin} (${pminN}) a ${pmax} (${pmaxN}).`,
    costRange: (vol, lo, hi) => `Com ${vol} USDT de volume em futuros, isso dá de ${lo} a ${hi} em taxas taker.`,
    checked: (d1, d2) => (d1 === d2 ? `Conferido em ${d1}.` : `Conferido entre ${d1} e ${d2}.`),
    list: (names) => names.join(", "),
  },
  fr: {
    label: "En bref :",
    cadence: { hourly: "automatiquement toutes les heures", daily: "automatiquement chaque jour" },
    fees: (n, sm, st, pm, pt) => `${n} facture ${sm} maker / ${st} taker en spot et ${pm} / ${pt} sur les perpétuels USDT au niveau standard.`,
    mexc: (n, page, am, at) => `${n} fixe ses frais par paire : sa page de frais indique ${page} en spot, alors que son API facture à la plupart des paires ${am} maker / ${at} taker.`,
    rebate: (code, share, cadence, vol, amt) => `Avec le code ${code}, jusqu'à ${share} de vos frais vous sont reversés${cadence ? ` ${cadence}` : ""} : ${vol} USDT de volume sur les futures → jusqu'à ${amt} reversés.`,
    code: (code) => `Inscrivez-vous avec le code ${code} sur le site officiel.`,
    cost: (vol, amt) => `Sur ${vol} USDT de volume en futures, cela fait ${amt} de frais taker.`,
    source: (h, date, terms) => `Frais tirés de la page officielle de ${h}, au ${date}${terms ? ` ; conditions de remboursement confirmées le ${terms}` : ""}.`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `${a} facture ${ast} taker en spot et ${apt} taker sur les perpétuels ; ${b} facture ${bst} et ${bpt}.`,
    cmpCost: (vol, af, bf) => `Sur ${vol} USDT en futures, les frais taker sont de ${af} contre ${bf}.`,
    cmpRebate: (items) => `Avec nos codes d'inscription, ${items.join(" et ")} vous sont reversés.`,
    rebateItem: (share, n) => `jusqu'à ${share} des frais ${n}`,
    cmpSource: (ha, hb, date) => `Frais tirés des pages officielles de ${ha} et ${hb}, au ${date}.`,
    track: (n) => `NexuAlpha recense les frais maker/taker standard de ${n} plateformes, chacun relevé sur la page officielle de la plateforme.`,
    directory: (total, n) => `Cette liste couvre ${total} plateformes crypto et DEX ; ${n} ont des frais standard relevés sur leur page officielle.`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `Les frais taker spot vont de ${smin} (${sminN}) à ${smax} (${smaxN}) ; sur les perpétuels, de ${pmin} (${pminN}) à ${pmax} (${pmaxN}).`,
    costRange: (vol, lo, hi) => `Sur ${vol} USDT de volume en futures, cela fait de ${lo} à ${hi} de frais taker.`,
    checked: (d1, d2) => (d1 === d2 ? `Vérifié le ${d1}.` : `Vérifié entre le ${d1} et le ${d2}.`),
    list: (names) => names.join(", "),
  },
  de: {
    label: "Kurz gesagt:",
    cadence: { hourly: "automatisch jede Stunde", daily: "automatisch jeden Tag" },
    fees: (n, sm, st, pm, pt) => `${n} berechnet im Standard-Tarif ${sm} Maker / ${st} Taker im Spot-Handel und ${pm} / ${pt} bei USDT-Perpetuals.`,
    mexc: (n, page, am, at) => `${n} legt Gebühren je Handelspaar fest: Die Gebührenseite nennt ${page} im Spot-Handel, die API berechnet den meisten Paaren ${am} Maker / ${at} Taker.`,
    rebate: (code, share, cadence, vol, amt) => `Mit dem Code ${code} bekommst du bis zu ${share} deiner Gebühren zurück${cadence ? `, ${cadence}` : ""}: ${vol} USDT Futures-Volumen → bis zu ${amt} zurück.`,
    code: (code) => `Registriere dich auf der offiziellen Website mit dem Code ${code}.`,
    cost: (vol, amt) => `Bei ${vol} USDT Futures-Volumen sind das ${amt} Taker-Gebühren.`,
    source: (h, date, terms) => `Gebühren laut offizieller Gebührenseite von ${h}, Stand ${date}${terms ? `; Rückerstattungsbedingungen bestätigt am ${terms}` : ""}.`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `${a} berechnet ${ast} Taker im Spot-Handel und ${apt} Taker bei Perpetuals; ${b} berechnet ${bst} und ${bpt}.`,
    cmpCost: (vol, af, bf) => `Bei ${vol} USDT Futures-Volumen betragen die Taker-Gebühren ${af} gegenüber ${bf}.`,
    cmpRebate: (items) => `Mit unseren Anmeldecodes bekommst du ${items.join(" und ")} zurück.`,
    rebateItem: (share, n) => `bis zu ${share} der ${n}-Gebühren`,
    cmpSource: (ha, hb, date) => `Gebühren laut offiziellen Gebührenseiten von ${ha} und ${hb}, Stand ${date}.`,
    track: (n) => `NexuAlpha listet die Standard-Maker/Taker-Gebühren von ${n} Börsen, jeweils von der offiziellen Gebührenseite der Börse.`,
    directory: (total, n) => `Diese Liste umfasst ${total} Krypto-Börsen und DEXs; für ${n} stammen die Standardgebühren von der offiziellen Gebührenseite.`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `Spot-Taker-Gebühren reichen von ${smin} (${sminN}) bis ${smax} (${smaxN}); bei Perpetuals von ${pmin} (${pminN}) bis ${pmax} (${pmaxN}).`,
    costRange: (vol, lo, hi) => `Bei ${vol} USDT Futures-Volumen sind das ${lo} bis ${hi} Taker-Gebühren.`,
    checked: (d1, d2) => (d1 === d2 ? `Geprüft am ${d1}.` : `Geprüft zwischen ${d1} und ${d2}.`),
    list: (names) => names.join(", "),
  },
  it: {
    label: "In breve:",
    cadence: { hourly: "automaticamente ogni ora", daily: "automaticamente ogni giorno" },
    fees: (n, sm, st, pm, pt) => `${n} applica ${sm} maker / ${st} taker sullo spot e ${pm} / ${pt} sui perpetual USDT al livello standard.`,
    mexc: (n, page, am, at) => `${n} fissa le commissioni per coppia: la pagina commissioni indica ${page} sullo spot, mentre la sua API applica alla maggior parte delle coppie ${am} maker / ${at} taker.`,
    rebate: (code, share, cadence, vol, amt) => `Con il codice ${code} ti torna fino al ${share} delle commissioni${cadence ? `, ${cadence}` : ""}: ${vol} USDT di volume sui futures → fino a ${amt} restituiti.`,
    code: (code) => `Registrati con il codice ${code} sul sito ufficiale.`,
    cost: (vol, amt) => `Con ${vol} USDT di volume sui futures, sono ${amt} di commissioni taker.`,
    source: (h, date, terms) => `Commissioni dalla pagina ufficiale di ${h}, al ${date}${terms ? `; condizioni del rimborso confermate il ${terms}` : ""}.`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `${a} applica ${ast} taker sullo spot e ${apt} taker sui perpetual; ${b} applica ${bst} e ${bpt}.`,
    cmpCost: (vol, af, bf) => `Con ${vol} USDT sui futures, le commissioni taker sono ${af} contro ${bf}.`,
    cmpRebate: (items) => `Con i nostri codici di iscrizione ti tornano ${items.join(" e ")}.`,
    rebateItem: (share, n) => `fino al ${share} delle commissioni ${n}`,
    cmpSource: (ha, hb, date) => `Commissioni dalle pagine ufficiali di ${ha} e ${hb}, al ${date}.`,
    track: (n) => `NexuAlpha riporta le commissioni maker/taker standard di ${n} exchange, ciascuna letta sulla pagina ufficiale dell'exchange.`,
    directory: (total, n) => `Questa lista comprende ${total} exchange e DEX crypto; per ${n} le commissioni standard vengono dalla pagina ufficiale.`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `Le commissioni taker spot vanno da ${smin} (${sminN}) a ${smax} (${smaxN}); sui perpetual da ${pmin} (${pminN}) a ${pmax} (${pmaxN}).`,
    costRange: (vol, lo, hi) => `Con ${vol} USDT di volume sui futures, sono da ${lo} a ${hi} di commissioni taker.`,
    checked: (d1, d2) => (d1 === d2 ? `Verificato il ${d1}.` : `Verificato tra il ${d1} e il ${d2}.`),
    list: (names) => names.join(", "),
  },
  ja: {
    label: "要点：",
    cadence: { hourly: "（毎時自動で返還）", daily: "（毎日自動で返還）" },
    fees: (n, sm, st, pm, pt) => `${n} の標準手数料は、現物がメイカー ${sm}・テイカー ${st}、USDT 無期限先物がメイカー ${pm}・テイカー ${pt} です。`,
    mexc: (n, page, am, at) => `${n} は取引ペアごとに手数料を設定しています。手数料ページでは現物 ${page} ですが、API では多くのペアがメイカー ${am}・テイカー ${at} です。`,
    rebate: (code, share, cadence, vol, amt) => `招待コード ${code} で登録すると、手数料の最大 ${share} が戻ります${cadence}。先物の取引量 ${vol} USDT → 最大 ${amt} 返還。`,
    code: (code) => `公式サイトで招待コード ${code} を入力して登録します。`,
    cost: (vol, amt) => `先物の取引量 ${vol} USDT なら、テイカー手数料は ${amt} です。`,
    source: (h, date, terms) => `手数料は ${h} の公式手数料ページより（${date} 時点${terms ? `、返還条件は ${terms} 確認` : ""}）。`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `${a} は現物テイカー ${ast}、無期限先物テイカー ${apt}。${b} はそれぞれ ${bst} と ${bpt} です。`,
    cmpCost: (vol, af, bf) => `先物 ${vol} USDT のテイカー手数料は ${af} 対 ${bf} です。`,
    cmpRebate: (items) => `当サイトの招待コードで登録すると、${items.join("、")}が戻ります。`,
    rebateItem: (share, n) => `${n} の手数料の最大 ${share}`,
    cmpSource: (ha, hb, date) => `手数料は ${ha} と ${hb} の公式手数料ページより（${date} 時点）。`,
    track: (n) => `NexuAlpha は ${n} 取引所の標準メイカー/テイカー手数料を、各取引所の公式手数料ページから掲載しています。`,
    directory: (total, n) => `このリストは暗号資産取引所と DEX ${total} 件を収録し、うち ${n} 件の標準手数料は公式手数料ページから取得しています。`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `現物テイカー手数料は ${smin}（${sminN}）から ${smax}（${smaxN}）、無期限先物は ${pmin}（${pminN}）から ${pmax}（${pmaxN}）です。`,
    costRange: (vol, lo, hi) => `先物の取引量 ${vol} USDT なら、テイカー手数料は ${lo}〜${hi} です。`,
    checked: (d1, d2) => (d1 === d2 ? `${d1} 確認。` : `${d1}〜${d2} 確認。`),
    list: (names) => names.join("、"),
  },
  ko: {
    label: "핵심 답변:",
    cadence: { hourly: " (매시간 자동 환급)", daily: " (매일 자동 환급)" },
    fees: (n, sm, st, pm, pt) => `${n}의 기본 수수료는 현물 메이커 ${sm} / 테이커 ${st}, USDT 무기한 선물 메이커 ${pm} / 테이커 ${pt}입니다.`,
    mexc: (n, page, am, at) => `${n}는 거래쌍마다 수수료를 정합니다. 수수료 페이지는 현물 ${page}로 안내하지만, API는 대부분의 거래쌍에 메이커 ${am} / 테이커 ${at}를 적용합니다.`,
    rebate: (code, share, cadence, vol, amt) => `추천 코드 ${code}로 가입하면 수수료의 최대 ${share}가 돌아옵니다${cadence}. 선물 거래량 ${vol} USDT → 최대 ${amt} 환급.`,
    code: (code) => `공식 사이트에서 추천 코드 ${code}로 가입하세요.`,
    cost: (vol, amt) => `선물 거래량 ${vol} USDT라면 테이커 수수료는 ${amt}입니다.`,
    source: (h, date, terms) => `수수료 출처: ${h} 공식 수수료 페이지, ${date} 기준${terms ? `; 환급 조건 확인일 ${terms}` : ""}.`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `${a}는 현물 테이커 ${ast}, 무기한 선물 테이커 ${apt}이고, ${b}는 각각 ${bst}와 ${bpt}입니다.`,
    cmpCost: (vol, af, bf) => `선물 ${vol} USDT 기준 테이커 수수료는 ${af} 대 ${bf}입니다.`,
    cmpRebate: (items) => `저희 가입 코드를 쓰면 ${items.join(", ")}가 돌아옵니다.`,
    rebateItem: (share, n) => `${n} 수수료의 최대 ${share}`,
    cmpSource: (ha, hb, date) => `수수료 출처: ${ha}, ${hb} 공식 수수료 페이지, ${date} 기준.`,
    track: (n) => `NexuAlpha는 거래소 ${n}곳의 기본 메이커/테이커 수수료를 각 거래소 공식 수수료 페이지에서 가져와 보여 줍니다.`,
    directory: (total, n) => `이 목록에는 암호화폐 거래소와 DEX ${total}곳이 있으며, 그중 ${n}곳의 기본 수수료는 공식 수수료 페이지에서 확인했습니다.`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `현물 테이커 수수료는 ${smin}(${sminN})부터 ${smax}(${smaxN})까지, 무기한 선물은 ${pmin}(${pminN})부터 ${pmax}(${pmaxN})까지입니다.`,
    costRange: (vol, lo, hi) => `선물 거래량 ${vol} USDT라면 테이커 수수료는 ${lo}~${hi}입니다.`,
    checked: (d1, d2) => (d1 === d2 ? `${d1} 확인.` : `${d1}~${d2} 확인.`),
    list: (names) => names.join(", "),
  },
  ru: {
    label: "Коротко:",
    cadence: { hourly: "", daily: "" },
    fees: (n, sm, st, pm, pt) => `${n} берёт ${sm} мейкер / ${st} тейкер на споте и ${pm} / ${pt} на бессрочных фьючерсах USDT по стандартному тарифу.`,
    mexc: (n, page, am, at) => `${n} задаёт комиссии по каждой паре: на странице комиссий для спота указано ${page}, а API берёт с большинства пар ${am} мейкер / ${at} тейкер.`,
    rebate: () => "",
    code: () => "",
    cost: (vol, amt) => `При объёме фьючерсов ${vol} USDT тейкерская комиссия составит ${amt}.`,
    source: (h, date) => `Комиссии с официальной страницы ${h}, на ${date}.`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `${a} берёт ${ast} тейкер на споте и ${apt} тейкер на бессрочных фьючерсах; ${b} — ${bst} и ${bpt}.`,
    cmpCost: (vol, af, bf) => `При объёме фьючерсов ${vol} USDT тейкерские комиссии составят ${af} против ${bf}.`,
    cmpRebate: () => "",
    rebateItem: () => "",
    cmpSource: (ha, hb, date) => `Комиссии с официальных страниц ${ha} и ${hb}, на ${date}.`,
    track: (n) => `NexuAlpha показывает стандартные комиссии мейкер/тейкер ${n} бирж, каждая взята с официальной страницы комиссий биржи.`,
    directory: (total, n) => `В списке ${total} криптобирж и DEX; у ${n} из них стандартные комиссии взяты с официальных страниц.`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `Тейкерская комиссия на споте — от ${smin} (${sminN}) до ${smax} (${smaxN}); на бессрочных фьючерсах — от ${pmin} (${pminN}) до ${pmax} (${pmaxN}).`,
    costRange: (vol, lo, hi) => `При объёме фьючерсов ${vol} USDT это от ${lo} до ${hi} тейкерских комиссий.`,
    checked: (d1, d2) => (d1 === d2 ? `Проверено ${d1}.` : `Проверено с ${d1} по ${d2}.`),
    list: (names) => names.join(", "),
  },
  tr: {
    label: "Kısa cevap:",
    cadence: { hourly: "her saat otomatik olarak", daily: "her gün otomatik olarak" },
    fees: (n, sm, st, pm, pt) => `${n} standart seviyede spotta ${sm} maker / ${st} taker, USDT sürekli vadelilerde ${pm} / ${pt} ücret alır.`,
    mexc: (n, page, am, at) => `${n} ücretleri parite bazında belirler: ücret sayfası spot için ${page} gösterirken API çoğu paritede ${am} maker / ${at} taker uygular.`,
    rebate: (code, share, cadence, vol, amt) => `${code} koduyla ücretlerinizin ${share} kadarı ${cadence ? `${cadence} ` : ""}size geri döner: ${vol} USDT vadeli işlem hacmi → ${amt} tutarına kadar iade.`,
    code: (code) => `Resmî sitede ${code} koduyla kayıt olun.`,
    cost: (vol, amt) => `${vol} USDT vadeli işlem hacminde bu, ${amt} taker ücreti demektir.`,
    source: (h, date, terms) => `Ücretler ${h} resmî ücret sayfasından, ${date} itibarıyla${terms ? `; iade koşulları ${terms} tarihinde doğrulandı` : ""}.`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `${a} spotta ${ast}, sürekli vadelilerde ${apt} taker ücreti alır; ${b} ise ${bst} ve ${bpt} alır.`,
    cmpCost: (vol, af, bf) => `${vol} USDT vadeli işlemde taker ücretleri ${af} ile ${bf} olur.`,
    cmpRebate: (items) => `Kayıt kodlarımızla ${items.join(" ve ")} size geri döner.`,
    rebateItem: (share, n) => `${n} ücretlerinin ${share} kadarı`,
    cmpSource: (ha, hb, date) => `Ücretler ${ha} ve ${hb} resmî ücret sayfalarından, ${date} itibarıyla.`,
    track: (n) => `NexuAlpha, ${n} borsanın standart maker/taker ücretlerini her borsanın resmî ücret sayfasından okuyarak listeler.`,
    directory: (total, n) => `Bu liste ${total} kripto borsası ve DEX içerir; ${n} tanesinin standart ücretleri resmî ücret sayfasından okunmuştur.`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `Spot taker ücretleri ${smin} (${sminN}) ile ${smax} (${smaxN}) arasında; sürekli vadelilerde ${pmin} (${pminN}) ile ${pmax} (${pmaxN}) arasındadır.`,
    costRange: (vol, lo, hi) => `${vol} USDT vadeli işlem hacminde bu, ${lo} ile ${hi} arası taker ücreti demektir.`,
    checked: (d1, d2) => (d1 === d2 ? `${d1} tarihinde kontrol edildi.` : `${d1} ile ${d2} arasında kontrol edildi.`),
    list: (names) => names.join(", "),
  },
  id: {
    label: "Jawaban singkat:",
    cadence: { hourly: "otomatis setiap jam", daily: "otomatis setiap hari" },
    fees: (n, sm, st, pm, pt) => `${n} mengenakan ${sm} maker / ${st} taker di spot dan ${pm} / ${pt} di perpetual USDT pada tingkat standar.`,
    mexc: (n, page, am, at) => `${n} menetapkan biaya per pasangan: halaman biayanya mencantumkan ${page} untuk spot, sedangkan API-nya mengenakan ${am} maker / ${at} taker pada sebagian besar pasangan.`,
    rebate: (code, share, cadence, vol, amt) => `Dengan kode ${code}, hingga ${share} biaya trading kembali ke Anda${cadence ? ` ${cadence}` : ""}: volume futures ${vol} USDT → hingga ${amt} dikembalikan.`,
    code: (code) => `Daftar dengan kode ${code} di situs resmi.`,
    cost: (vol, amt) => `Untuk volume futures ${vol} USDT, biaya taker-nya ${amt}.`,
    source: (h, date, terms) => `Biaya dari halaman biaya resmi ${h}, per ${date}${terms ? `; ketentuan pengembalian dikonfirmasi ${terms}` : ""}.`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `${a} mengenakan ${ast} taker di spot dan ${apt} taker di perpetual; ${b} mengenakan ${bst} dan ${bpt}.`,
    cmpCost: (vol, af, bf) => `Untuk futures ${vol} USDT, biaya taker-nya ${af} dibanding ${bf}.`,
    cmpRebate: (items) => `Dengan kode pendaftaran kami, ${items.join(" dan ")} kembali ke Anda.`,
    rebateItem: (share, n) => `hingga ${share} biaya ${n}`,
    cmpSource: (ha, hb, date) => `Biaya dari halaman biaya resmi ${ha} dan ${hb}, per ${date}.`,
    track: (n) => `NexuAlpha mencantumkan biaya maker/taker standar ${n} bursa, masing-masing dibaca dari halaman biaya resmi bursa.`,
    directory: (total, n) => `Daftar ini memuat ${total} bursa kripto dan DEX; ${n} di antaranya punya biaya standar dari halaman biaya resmi.`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `Biaya taker spot berkisar dari ${smin} (${sminN}) sampai ${smax} (${smaxN}); di perpetual dari ${pmin} (${pminN}) sampai ${pmax} (${pmaxN}).`,
    costRange: (vol, lo, hi) => `Untuk volume futures ${vol} USDT, biaya taker-nya ${lo} sampai ${hi}.`,
    checked: (d1, d2) => (d1 === d2 ? `Dicek ${d1}.` : `Dicek antara ${d1} dan ${d2}.`),
    list: (names) => names.join(", "),
  },
  vi: {
    label: "Trả lời ngắn:",
    cadence: { hourly: "", daily: "" },
    fees: (n, sm, st, pm, pt) => `${n} thu ${sm} maker / ${st} taker với giao dịch spot và ${pm} / ${pt} với hợp đồng vĩnh cửu USDT ở mức tiêu chuẩn.`,
    mexc: (n, page, am, at) => `${n} đặt phí theo từng cặp: trang phí ghi ${page} cho spot, còn API áp dụng ${am} maker / ${at} taker cho phần lớn các cặp.`,
    rebate: () => "",
    code: () => "",
    cost: (vol, amt) => `Với khối lượng hợp đồng tương lai ${vol} USDT, phí taker là ${amt}.`,
    source: (h, date) => `Phí lấy từ trang phí chính thức của ${h}, tính đến ${date}.`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `${a} thu ${ast} taker với spot và ${apt} taker với hợp đồng vĩnh cửu; ${b} thu ${bst} và ${bpt}.`,
    cmpCost: (vol, af, bf) => `Với ${vol} USDT hợp đồng tương lai, phí taker là ${af} so với ${bf}.`,
    cmpRebate: () => "",
    rebateItem: () => "",
    cmpSource: (ha, hb, date) => `Phí lấy từ trang phí chính thức của ${ha} và ${hb}, tính đến ${date}.`,
    track: (n) => `NexuAlpha liệt kê phí maker/taker tiêu chuẩn của ${n} sàn, mỗi mức phí lấy từ trang phí chính thức của sàn.`,
    directory: (total, n) => `Danh sách này có ${total} sàn crypto và DEX; ${n} sàn có phí tiêu chuẩn lấy từ trang phí chính thức.`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `Phí taker spot từ ${smin} (${sminN}) đến ${smax} (${smaxN}); với hợp đồng vĩnh cửu từ ${pmin} (${pminN}) đến ${pmax} (${pmaxN}).`,
    costRange: (vol, lo, hi) => `Với khối lượng hợp đồng tương lai ${vol} USDT, phí taker từ ${lo} đến ${hi}.`,
    checked: (d1, d2) => (d1 === d2 ? `Kiểm tra ngày ${d1}.` : `Kiểm tra từ ${d1} đến ${d2}.`),
    list: (names) => names.join(", "),
  },
  ar: {
    label: "الإجابة المختصرة:",
    cadence: { hourly: "", daily: "" },
    fees: (n, sm, st, pm, pt) => `تفرض ${n} في المستوى القياسي ${sm} لصانع السوق و${st} لآخذ السوق في التداول الفوري، و${pm} / ${pt} على العقود الدائمة بعملة USDT.`,
    mexc: (n, page, am, at) => `تحدد ${n} الرسوم لكل زوج تداول: صفحة الرسوم تذكر ${page} للتداول الفوري، بينما تطبق واجهتها البرمجية على معظم الأزواج ${am} لصانع السوق و${at} لآخذ السوق.`,
    rebate: () => "",
    code: () => "",
    cost: (vol, amt) => `مع حجم عقود آجلة قدره ${vol} USDT تبلغ رسوم آخذ السوق ${amt}.`,
    source: (h, date) => `الرسوم من صفحة الرسوم الرسمية لـ ${h} بتاريخ ${date}.`,
    cmpFees: (a, ast, apt, b, bst, bpt) => `تفرض ${a} ${ast} لآخذ السوق في الفوري و${apt} في العقود الدائمة، بينما تفرض ${b} ${bst} و${bpt}.`,
    cmpCost: (vol, af, bf) => `مع ${vol} USDT من العقود الآجلة تبلغ رسوم آخذ السوق ${af} مقابل ${bf}.`,
    cmpRebate: () => "",
    rebateItem: () => "",
    cmpSource: (ha, hb, date) => `الرسوم من صفحتي الرسوم الرسميتين لـ ${ha} و${hb} بتاريخ ${date}.`,
    track: (n) => `تعرض NexuAlpha رسوم صانع/آخذ السوق القياسية لـ ${n} منصات، وكل رقم مأخوذ من صفحة الرسوم الرسمية للمنصة.`,
    directory: (total, n) => `تضم هذه القائمة ${total} منصة تداول عملات مشفرة ومنصة لامركزية، منها ${n} برسوم قياسية مأخوذة من صفحات الرسوم الرسمية.`,
    range: (smin, sminN, smax, smaxN, pmin, pminN, pmax, pmaxN) => `تتراوح رسوم آخذ السوق في الفوري من ${smin} (${sminN}) إلى ${smax} (${smaxN})، وفي العقود الدائمة من ${pmin} (${pminN}) إلى ${pmax} (${pmaxN}).`,
    costRange: (vol, lo, hi) => `مع حجم عقود آجلة قدره ${vol} USDT تتراوح رسوم آخذ السوق بين ${lo} و${hi}.`,
    checked: (d1, d2) => (d1 === d2 ? `تم التحقق في ${d1}.` : `تم التحقق بين ${d1} و${d2}.`),
    list: (names) => names.join("، "),
  },
};

const partnerFor = (slug) => REFERRAL_PARTNERS.find((partner) => partner.slug === slug) || null;
const venueName = (slug) => EXCHANGE_FACTS[slug]?.name || partnerFor(slug)?.name || slug;
const turkeyHidden = (slug, locale, market) => isTurkeyPage({ locale, market }) && TURKEY_UNLISTED_VENUES.includes(slug);
const checkedPair = (slug) => {
  const spot = feeFact(slug, "spot");
  const perp = feeFact(slug, "perp");
  return spot.state === "checked" && perp.state === "checked" ? { spot, perp } : null;
};
const takerCost = (perp) => EXAMPLE_VOLUME_USDT * perp.taker / 100;

// The rebate this edition may show for a venue, or null (neutral edition, Türkiye gate, no confirmed share or code).
function rebateFor(slug, locale, market) {
  if (isNeutralCtaLocale(locale) || turkeyHidden(slug, locale, market) || !isPartnerPromotableIn(slug, { locale, market })) return null;
  const partner = partnerFor(slug);
  if (!partner?.inviteCode) return null;
  const share = partner.share != null && partner.termsConfirmedOn ? partner.share : null;
  return { code: partner.inviteCode, share, settle: share != null ? partner.settle || null : null, termsConfirmedOn: share != null ? partner.termsConfirmedOn : null };
}

function result(locale, sentences, asOf, sources) {
  const copy = COPY[locale];
  const text = sentences.filter(Boolean).join(locale.startsWith("zh") || locale === "ja" ? "" : " ");
  return text ? { locale, label: copy.label, text, asOf, sources } : null;
}

/** Short answer for one exchange profile, or null when the venue is not a money page or the edition is not shipped. */
export function venueShortAnswer(slug, rawLocale = "en", market) {
  const locale = normalizeLocale(rawLocale);
  if (!locale || !ANSWER_FIRST_VENUES.includes(slug) || turkeyHidden(slug, locale, market)) return null;
  const copy = COPY[locale];
  const name = venueName(slug);
  const fmt = (value) => (value === 0 ? pctOf(0, locale) : formatFee(value, locale));
  const fees = checkedPair(slug);
  const rebate = rebateFor(slug, locale, market);
  const sentences = [];
  let asOf = FACTS_AS_OF;
  if (fees) {
    asOf = [fees.spot.checkedOn, fees.perp.checkedOn].sort().at(-1);
    sentences.push(copy.fees(name, fmt(fees.spot.maker), fmt(fees.spot.taker), fmt(fees.perp.maker), fmt(fees.perp.taker)));
  } else if (slug === "mexc" && /0% spot/.test(feeFact("mexc", "spot").note || "")) {
    sentences.push(copy.mexc(name, fmt(MEXC_PAGE_SPOT), fmt(MEXC_API_MAKER), fmt(MEXC_API_TAKER)));
  } else {
    return null;
  }
  if (rebate?.share != null && fees) {
    const amount = takerCost(fees.perp) * rebate.share;
    sentences.push(copy.rebate(rebate.code, pctOf(rebate.share * 100, locale), rebate.settle ? copy.cadence[rebate.settle] : "", volume(locale), usd(amount, locale)));
  } else {
    if (rebate?.code) sentences.push(copy.code(rebate.code));
    if (fees) sentences.push(copy.cost(volume(locale), usd(takerCost(fees.perp), locale)));
  }
  sentences.push(copy.source(host(slug), asOf, rebate?.share != null && fees ? rebate.termsConfirmedOn : null));
  return result(locale, sentences, asOf, [primarySourceUrl(slug)].filter(Boolean));
}

/** dateModified for a money page: the later of its editorial review and the fee/partner dates its short answer cites. */
export function venueAnswerModified(slug, reviewedAt) {
  const answer = venueShortAnswer(slug, "en");
  const partner = partnerFor(slug);
  return [reviewedAt, answer?.asOf, answer ? partner?.termsConfirmedOn : null].filter(Boolean).sort().at(-1) || reviewedAt;
}

/** Short answer for a two-venue comparison when both venues have checked spot and perpetual fees. */
export function compareShortAnswer(a, b, rawLocale = "en", market) {
  const locale = normalizeLocale(rawLocale);
  if (!locale || !a || !b || a === b) return null;
  if (turkeyHidden(a, locale, market) || turkeyHidden(b, locale, market)) return null;
  const fa = checkedPair(a);
  const fb = checkedPair(b);
  if (!fa || !fb) return null;
  const copy = COPY[locale];
  const fmt = (value) => formatFee(value, locale);
  const [na, nb] = [venueName(a), venueName(b)];
  const asOf = [fa.spot.checkedOn, fa.perp.checkedOn, fb.spot.checkedOn, fb.perp.checkedOn].sort().at(-1);
  const items = [a, b].map((slug) => {
    const rebate = rebateFor(slug, locale, market);
    return rebate?.share != null ? copy.rebateItem(pctOf(rebate.share * 100, locale), venueName(slug)) : "";
  }).filter(Boolean);
  return result(locale, [
    copy.cmpFees(na, fmt(fa.spot.taker), fmt(fa.perp.taker), nb, fmt(fb.spot.taker), fmt(fb.perp.taker)),
    copy.cmpCost(volume(locale), usd(takerCost(fa.perp), locale), usd(takerCost(fb.perp), locale)),
    items.length ? copy.cmpRebate(items) : "",
    copy.cmpSource(host(a), host(b), asOf),
  ], asOf, [primarySourceUrl(a), primarySourceUrl(b)].filter(Boolean));
}

// Fee range across every venue with a checked figure (Türkiye pages leave Bitget out).
function feeRange(locale, market) {
  const slugs = Object.keys(EXCHANGE_FACTS).filter((slug) => !turkeyHidden(slug, locale, market));
  const rows = (product) => slugs.map((slug) => ({ slug, fact: feeFact(slug, product) })).filter((row) => row.fact.state === "checked" && Number.isFinite(row.fact.taker));
  const spot = rows("spot");
  const perp = rows("perp");
  if (!spot.length || !perp.length) return null;
  const ends = (list) => {
    const values = list.map((row) => row.fact.taker);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { min, max, minNames: list.filter((row) => row.fact.taker === min).map((row) => venueName(row.slug)), maxNames: list.filter((row) => row.fact.taker === max).map((row) => venueName(row.slug)) };
  };
  const venues = new Set([...spot, ...perp].map((row) => row.slug));
  const dates = [...spot, ...perp].map((row) => row.fact.checkedOn).filter(Boolean).sort();
  return { count: venues.size, spot: ends(spot), perp: ends(perp), first: dates[0], last: dates.at(-1), sources: [...venues].map(primarySourceUrl).filter(Boolean) };
}

function rangeSentence(copy, range, locale) {
  const fmt = (value) => formatFee(value, locale);
  return copy.range(fmt(range.spot.min), copy.list(range.spot.minNames), fmt(range.spot.max), copy.list(range.spot.maxNames),
    fmt(range.perp.min), copy.list(range.perp.minNames), fmt(range.perp.max), copy.list(range.perp.maxNames));
}

/** Latest fee review date behind /rates (static data: its real review day, used as the page's dateModified). */
export function ratesDataModified() {
  return feeRange("en")?.last || FACTS_AS_OF;
}

/** Short answer for /rates: how many exchanges, the taker-fee range and the cost spread on the example volume. */
export function ratesShortAnswer(rawLocale = "en", market) {
  const locale = normalizeLocale(rawLocale);
  const range = locale ? feeRange(locale, market) : null;
  if (!range) return null;
  const copy = COPY[locale];
  return result(locale, [
    copy.track(range.count),
    rangeSentence(copy, range, locale),
    copy.costRange(volume(locale), usd(EXAMPLE_VOLUME_USDT * range.perp.min / 100, locale), usd(EXAMPLE_VOLUME_USDT * range.perp.max / 100, locale)),
    copy.checked(range.first, range.last),
  ], range.last, range.sources);
}

/** Short answer for the /exchanges list. `total` is the number of venues the list renders. */
export function directoryShortAnswer(total, rawLocale = "en", market) {
  const locale = normalizeLocale(rawLocale);
  const range = locale ? feeRange(locale, market) : null;
  if (!range || !Number.isFinite(total) || total < range.count) return null;
  const copy = COPY[locale];
  return result(locale, [copy.directory(total, range.count), rangeSentence(copy, range, locale), copy.checked(range.first, range.last)], range.last, range.sources);
}

/** Words for Latin-script editions, characters for CJK: used by tests to keep leads in the 40-60 word band. */
export function answerLength(text, locale = "en") {
  return /^(zh|ja|ko)/.test(locale) ? String(text).replace(/\s+/g, "").length : String(text).trim().split(/\s+/).length;
}

export const ANSWER_FIRST_LOCALES = Object.freeze(LOCALES.slice());
