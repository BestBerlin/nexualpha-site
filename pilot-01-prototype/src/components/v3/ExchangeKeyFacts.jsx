import "./exchange-key-facts.css";
import { licenseTypeLabel, licenseScopeNote, localizedFactLocale, moreFactsLabel, publicFactValue } from "../licenses/license-presentation.js";
import { exchangeResearch } from "../../data/exchange-research.js";
import { exchangeKeyFacts } from "../../data/exchange-key-facts.js";
import { feePair } from "../../data/exchange-facts.js";
import { licenseCopy } from "../../data/licenses.js";
import { outboundLink } from "../../data/exchange-outbound.js";
import { exchangeKeyFactLabels } from "../../data/exchange-key-facts-copy.js";
import { matrixCopy } from "./exchange-matrix-copy.js";

const titles = { en: "Key facts", "zh-Hans": "关键事实", "zh-Hant": "關鍵事實", es: "Datos clave", "pt-BR": "Dados essenciais", fr: "Faits clés", de: "Wichtige Fakten", ja: "主な事実", ko: "주요 정보", tr: "Temel bilgiler", ru: "Основные сведения", ar: "حقائق أساسية", id: "Fakta utama", vi: "Thông tin chính", it: "Dati principali", ur: "اہم حقائق", uk: "Основні факти" };
export function ExchangeKeyFacts({ slug, locale = "en", market }) {
  const sheet = exchangeKeyFacts(slug, { locale, market });
  if (!sheet?.rows.length) return null;
  const licenses = licenseCopy(locale);
  const matrix = matrixCopy(locale);
  const labels = { "source-context": matrix.platform, "product-scope": matrix.products, "spot-fees": `${matrix.spot} (${matrix.maker})`, "perp-fees": `${matrix.perp} (${matrix.maker})`, apps: "iOS / Android", ...exchangeKeyFactLabels(locale) };
  const local = localizedFactLocale(locale);
  const note = locale === "ar" ? "راجع المصدر الرسمي للنطاق والأهلية الحالية." : "当前适用范围及资格请查阅官方来源。";
  const display = (row) => {
    const v = row.value;
    if (row.id.endsWith("-fees")) return `${feePair(v.maker, v.taker, locale)} · ${local ? note : v.scope}`;
    if (row.id.startsWith("license-")) return `${v.entity} — ${v.jurisdiction} / ${v.regulator} / ${licenses.statuses[v.status] || v.status} — ${licenseTypeLabel(v.type, locale)}${licenseScopeNote(v, locale) ? ` · ${licenseScopeNote(v, locale)}` : ""}`;
    if (row.id === "apps") return `${[v.ios && "iOS", v.android && "Android"].filter(Boolean).join(" / ")} · ${local ? note : v.scope}`;
    if (row.id === "proof-of-reserves") return local ? (locale === "ar" ? "إفصاح احتياطيات مؤرخ؛ لا يمثل ضماناً للاحتياطيات الحالية." : "已记录带日期的储备金披露，不代表当前储备金保证。") : v.scope;
    if (local && row.id === "kyc-reference") return locale === "ar" ? "تحقق من الهوية والأهلية والقيود الإقليمية في المسار الرسمي قبل فتح الحساب." : "开户前请在官方流程核对身份验证要求、账户资格及地区限制。";
    if (local && typeof v === "string") {
      const fact = exchangeResearch[slug]?.facts?.find(fact => fact.value?.en === v);
      return fact?.value?.[locale] || note;
    }
    return v;
  };
  const rows = sheet.rows.filter(row => (typeof row.value !== "string" || publicFactValue(row.value)) && publicFactValue(display(row)));
  if (!rows.length) return null;
  const table = items => <table><caption>{sheet.name} · {titles[locale] || titles.en}</caption><tbody>
      {items.map(row => <tr key={row.id}><th scope="row">{row.id.startsWith("license-") ? licenses.type : labels[row.id]}</th>
        <td>{display(row)}<br /><small>{licenses.lastChecked}: <time dateTime={row.checkedOn}>{row.checkedOn}</time></small></td>
        <td><small>{licenses.source}: {row.sourceUrls.map(source => <span key={source} className="exchange-key-facts__source">{row.id === "proof-of-reserves" && outboundLink(source, { locale, market })?.sponsored ? <a href={outboundLink(source, { locale, market }).href} rel="sponsored nofollow">{source}</a> : source}</span>)}</small></td>
      </tr>)}
    </tbody></table>;
  return <section className="v2-section exchange-key-facts" data-exchange-key-facts={slug}>
    <h2>{titles[locale] || titles.en}</h2>
    {table(rows.slice(0, 3))}
    {rows.length > 3 && <details><summary>{moreFactsLabel(locale)} ({rows.length})</summary>{table(rows.slice(3))}</details>}
  </section>;
}
