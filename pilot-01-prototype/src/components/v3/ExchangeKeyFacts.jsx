import "./exchange-key-facts.css";
import { exchangeKeyFacts } from "../../data/exchange-key-facts.js";
import { feePair } from "../../data/exchange-facts.js";
import { licenseProfileCopy, publicFactValue } from "../licenses/license-profile-copy.js";
import { outboundLink } from "../../data/exchange-outbound.js";
import { exchangeKeyFactLabels } from "../../data/exchange-key-facts-copy.js";
import { matrixCopy } from "./exchange-matrix-copy.js";

const titles = { en: "Key facts", "zh-Hans": "关键事实", "zh-Hant": "關鍵事實", es: "Datos clave", "pt-BR": "Dados essenciais", fr: "Faits clés", de: "Wichtige Fakten", ja: "主な事実", ko: "주요 정보", tr: "Temel bilgiler", ru: "Основные сведения", ar: "حقائق أساسية", id: "Fakta utama", vi: "Thông tin chính", it: "Dati principali", ur: "اہم حقائق", uk: "Основні факти" };
export function ExchangeKeyFacts({ slug, locale = "en", market, renderIcon }) {
  const sheet = exchangeKeyFacts(slug, { locale, market });
  if (!sheet?.rows.length) return null;
  const licenses = licenseProfileCopy(locale);
  const matrix = matrixCopy(locale);
  const labels = { "source-context": matrix.platform, "product-scope": matrix.products, "spot-fees": `${matrix.spot} (${matrix.maker})`, "perp-fees": `${matrix.perp} (${matrix.maker})`, apps: "iOS / Android", ...exchangeKeyFactLabels(locale) };
  const display = (row) => {
    const v = row.value;
    if (row.id.endsWith("-fees")) return `${feePair(v.maker, v.taker, locale)} — ${v.scope}`;
    if (row.id.startsWith("license-")) return [publicFactValue(v.entity), [publicFactValue(v.jurisdiction), publicFactValue(v.regulator), licenses.statuses[v.status]].filter(Boolean).join(" / "), publicFactValue(v.type), publicFactValue(v.note)].filter(Boolean).join(" — ");
    if (row.id === "apps") return `${v.ios ? "iOS" : ""} / ${v.android ? "Android" : ""} — ${v.scope}`;
    if (row.id === "proof-of-reserves") return v.scope;
    return publicFactValue(v);
  };
  return <section className="v2-section exchange-key-facts" data-exchange-key-facts={slug}>
    <h2>{titles[locale] || titles.en}</h2>
    <table><caption>{sheet.name} · {titles[locale] || titles.en}</caption><tbody>
      {sheet.rows.filter(row => publicFactValue(display(row))).map(row => <tr key={row.id} data-fact-kind={renderIcon ? row.id : undefined}><th scope="row">{renderIcon?.(row.id)}<span>{row.id.startsWith("license-") ? licenses.type : labels[row.id]}</span></th>
        <td>{publicFactValue(display(row))}<br /><small>{licenses.lastChecked}: <time dateTime={row.checkedOn}>{row.checkedOn}</time></small></td>
        <td><small>{licenses.source}: {row.sourceUrls.map(source => <span key={source} className="exchange-key-facts__source">{row.id === "proof-of-reserves" && outboundLink(source, { locale, market })?.sponsored ? <a href={outboundLink(source, { locale, market }).href} rel="sponsored nofollow">{source}</a> : source}</span>)}</small></td>
      </tr>)}
    </tbody></table>
  </section>;
}
