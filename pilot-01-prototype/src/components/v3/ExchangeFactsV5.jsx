import { GlossaryTooltip } from "../shared/GlossaryTooltip.jsx";
import { factsForVenue, feeFact, venueCheckedOn, feePct } from "../../data/exchange-facts.js";
import { matrixCopy } from "./exchange-matrix-copy.js";
import { venueDatabase } from "../../data/venue-database.js";
import { paymentMethodLabels, paymentMethodSeparator } from "../../data/payment-method-labels.js";
import { uniqueTextEntries } from "../../utils/unique-text.js";
import { useEffect, useRef } from "react";
import { SectionRule } from "../shared/DataRule.jsx";
import { Reveal, prefersReducedMotion } from "../../lib/v5/index.js";

// Short labels only. Everything else on the page comes from existing localized content.
const L = {
  en: { feesChecked: "Fees checked", fees: "Fees", spot: "Spot", perp: "Perpetual", maker: "Maker", taker: "Taker", discount: "Fee discount", check: "Check official page", checked: "Checked", products: "Products", eligibility: "Regions and eligibility", spotSub: "Base tier", perpSub: "Futures base tier", pays: "when fees are paid in" },
  "zh-Hans": { feesChecked: "费率核验于", fees: "费率", spot: "现货", perp: "永续合约", maker: "挂单", taker: "吃单", discount: "手续费折扣", check: "以官方页面为准", checked: "核验于", products: "产品", eligibility: "地区与资格", spotSub: "基础等级", perpSub: "合约基础等级", pays: "以此币种支付手续费时" },
  "zh-Hant": { feesChecked: "費率核驗於", fees: "費率", spot: "現貨", perp: "永續合約", maker: "掛單", taker: "吃單", discount: "手續費折扣", check: "以官方頁面為準", checked: "核驗於", products: "產品", eligibility: "地區與資格", spotSub: "基礎等級", perpSub: "合約基礎等級", pays: "以此幣種支付手續費時" },
  es: { feesChecked: "Comisiones revisadas", fees: "Comisiones", spot: "Spot", perp: "Perpetuos", maker: "Maker", taker: "Taker", discount: "Descuento", check: "Ver página oficial", checked: "Revisado", products: "Productos", eligibility: "Regiones y requisitos", spotSub: "Nivel base", perpSub: "Nivel base de futuros", pays: "al pagar comisiones con" },
  "pt-BR": { feesChecked: "Taxas verificadas", fees: "Taxas", spot: "Spot", perp: "Perpétuos", maker: "Maker", taker: "Taker", discount: "Desconto", check: "Ver página oficial", checked: "Verificado", products: "Produtos", eligibility: "Regiões e elegibilidade", spotSub: "Nível base", perpSub: "Nível base de futuros", pays: "ao pagar taxas com" },
  fr: { feesChecked: "Frais vérifiés", fees: "Frais", spot: "Spot", perp: "Perpétuels", maker: "Maker", taker: "Taker", discount: "Réduction", check: "Voir la page officielle", checked: "Vérifié", products: "Produits", eligibility: "Régions et éligibilité", spotSub: "Palier de base", perpSub: "Palier futures de base", pays: "si les frais sont payés en" },
  de: { feesChecked: "Gebühren geprüft", fees: "Gebühren", spot: "Spot", perp: "Perpetuals", maker: "Maker", taker: "Taker", discount: "Gebührenrabatt", check: "Offizielle Seite prüfen", checked: "Geprüft", products: "Produkte", eligibility: "Regionen und Zugang", spotSub: "Basisstufe", perpSub: "Futures-Basisstufe", pays: "bei Zahlung in" },
  ja: { feesChecked: "手数料確認日", fees: "手数料", spot: "現物", perp: "無期限先物", maker: "メイカー", taker: "テイカー", discount: "手数料割引", check: "公式ページで確認", checked: "確認日", products: "商品", eligibility: "地域と利用資格", spotSub: "基本ティア", perpSub: "先物の基本ティア", pays: "手数料の支払いに使う場合" },
  ko: { feesChecked: "수수료 확인일", fees: "수수료", spot: "현물", perp: "무기한", maker: "메이커", taker: "테이커", discount: "수수료 할인", check: "공식 페이지 확인", checked: "확인일", products: "상품", eligibility: "지역 및 자격", spotSub: "기본 등급", perpSub: "선물 기본 등급", pays: "수수료를 다음으로 낼 때" },
  tr: { feesChecked: "Ücretler kontrol edildi", fees: "Ücretler", spot: "Spot", perp: "Perpetual", maker: "Maker", taker: "Taker", discount: "Ücret indirimi", check: "Resmî sayfayı kontrol et", checked: "Kontrol", products: "Ürünler", eligibility: "Bölgeler ve uygunluk", spotSub: "Temel kademe", perpSub: "Vadeli temel kademe", pays: "ücret şununla ödenirse" },
  ru: { feesChecked: "Комиссии проверены", fees: "Комиссии", spot: "Спот", perp: "Бессрочные", maker: "Мейкер", taker: "Тейкер", discount: "Скидка", check: "Проверьте на официальной странице", checked: "Проверено", products: "Продукты", eligibility: "Регионы и доступ", spotSub: "Базовый уровень", perpSub: "Базовый уровень фьючерсов", pays: "при оплате комиссии в" },
  ar: { feesChecked: "تم التحقق من الرسوم", fees: "الرسوم", spot: "فوري", perp: "عقود دائمة", maker: "صانع", taker: "آخذ", discount: "خصم الرسوم", check: "راجع الصفحة الرسمية", checked: "تم التحقق", products: "المنتجات", eligibility: "المناطق والأهلية", spotSub: "المستوى الأساسي", perpSub: "المستوى الأساسي للعقود", pays: "عند دفع الرسوم بعملة" },
  id: { feesChecked: "Biaya dicek", fees: "Biaya", spot: "Spot", perp: "Perpetual", maker: "Maker", taker: "Taker", discount: "Diskon biaya", check: "Cek halaman resmi", checked: "Dicek", products: "Produk", eligibility: "Wilayah dan kelayakan", spotSub: "Tingkat dasar", perpSub: "Tingkat dasar futures", pays: "jika biaya dibayar dengan" },
  vi: { feesChecked: "Phí đã kiểm tra", fees: "Phí", spot: "Giao ngay", perp: "Vĩnh cửu", maker: "Maker", taker: "Taker", discount: "Giảm phí", check: "Xem trang chính thức", checked: "Đã kiểm tra", products: "Sản phẩm", eligibility: "Khu vực và điều kiện", spotSub: "Bậc cơ bản", perpSub: "Bậc futures cơ bản", pays: "khi trả phí bằng" },
  it: { feesChecked: "Commissioni verificate", fees: "Commissioni", spot: "Spot", perp: "Perpetui", maker: "Maker", taker: "Taker", discount: "Sconto", check: "Vedi pagina ufficiale", checked: "Verificato", products: "Prodotti", eligibility: "Regioni e idoneità", spotSub: "Livello base", perpSub: "Livello base futures", pays: "pagando le commissioni in" },
  // l10n: needs native review
  ur: { feesChecked: "فیس چیک ہوئی", fees: "فیس", spot: "اسپاٹ", perp: "پرپیچوئل", maker: "Maker", taker: "Taker", discount: "فیس رعایت", check: "سرکاری صفحہ چیک کریں", checked: "چیک شدہ", products: "مصنوعات", eligibility: "علاقے اور اہلیت", spotSub: "بنیادی سطح", perpSub: "فیوچرز بنیادی سطح", pays: "جب فیس اس میں ادا ہو" },
  // l10n: needs native review
  uk: { feesChecked: "Комісії перевірено", fees: "Комісії", spot: "Спот", perp: "Безстрокові", maker: "Maker", taker: "Taker", discount: "Знижка комісії", check: "Перевірити офіційну сторінку", checked: "Перевірено", products: "Продукти", eligibility: "Регіони й доступність", spotSub: "Базовий рівень", perpSub: "Базовий рівень ф’ючерсів", pays: "коли комісії сплачуються в" },
};

export const labels = (locale) => L[locale] || L[String(locale || "en").split("-")[0]] || L.en;

function HeroCount({ value, decimals, suffix, locale, className, text }) {
  const ref = useRef(null);
  const fmt = (n) => text || new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n) + suffix;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !el.animate) return undefined;
    // Final value is always rendered; only opacity/translate animate (no intermediate figures).
    const anim = el.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 480, delay: 200, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" });
    return () => anim.cancel();
  }, [value, decimals, suffix, locale]);
  return <span ref={ref} className={className} data-value={value}>{fmt(value)}</span>;
}

export function factsFor(slug) {
  return factsForVenue(slug);
}
// Header badge: only when at least one fee figure of this venue is published as checked.
export function feesCheckedLabel(slug, locale) {
  const on = venueCheckedOn(slug);
  return on ? `${labels(locale).feesChecked} ${on}` : null;
}
// The one primary date on a venue record: "Fees checked 2026-10-08", or "Fees: Not yet checked" with no stamp.
export function feesStatusLabel(slug, locale) {
  return feesCheckedLabel(slug, locale) || `${labels(locale).fees}: ${matrixCopy(locale).unchecked}`;
}

// The record's check date is shown once, as the page's primary date; cells carry only the figure.
function StripCell({ value, locale, none = false }) {
  if (value == null) return <span className="d5-rate d5-rate--null"><span className="d5-null-note">{none ? matrixCopy(locale).notOffered : matrixCopy(locale).unchecked}</span></span>;
  return (
    <span className="d5-rate">
      <HeroCount value={value} text={feePct(value, locale)} locale={locale} className="num d5-figure d5-figure--hero" />
    </span>
  );
}

export function FactsStrip({ slug, locale }) {
  const entry = factsForVenue(slug);
  if (!entry || entry.type === "dex") return null;
  const l = labels(locale);
  const spot = feeFact(slug, "spot");
  const perp = feeFact(slug, "perp");
  // A discount is shown only for a product whose base fee is checked (exchange-facts.js enforces it).
  const parts = [];
  if (entry.discount.token && entry.discount.spot) parts.push([l.spot, entry.discount.spot]);
  if (entry.discount.token && entry.discount.perp) parts.push([l.perp, entry.discount.perp]);
  const d = { token: entry.discount.token };
  const rows = [[l.spot, l.spotSub, spot], [l.perp, l.perpSub, perp]];
  return (
    <section className={`d5-strip enter${rows.every(([, , r]) => r?.maker == null && r?.taker == null) ? " d5-strip--empty" : ""}`} style={{ "--i": 1 }} aria-label={l.fees}>
      <div className="d5-strip__head"><span /><span><GlossaryTooltip term="maker-taker-fees" locale={locale}>{l.maker} / {l.taker}</GlossaryTooltip></span><span>{l.taker}</span></div>
      {rows.map(([title, sub, row]) => (
        <div className="d5-strip__row" key={title}>
          <div className="d5-strip__name"><b>{title === l.perp ? <GlossaryTooltip term="perpetual-futures" locale={locale}>{title}</GlossaryTooltip> : title}</b><small>{sub}</small></div>
          <div className="d5-strip__cell"><span className="d5-cell-label">{l.maker}</span><StripCell value={row?.maker ?? null} locale={locale} none={row?.state === "none"} /></div>
          <div className="d5-strip__cell"><span className="d5-cell-label">{l.taker}</span><StripCell value={row?.taker ?? null} locale={locale} none={row?.state === "none"} /></div>
        </div>
      ))}
      {parts.length > 0 && (
        <p className="d5-strip__discount">
          <span>{l.discount}</span>
          {parts.map(([k, v]) => <span key={k} className="d5-discount__item"><span className="d5-up num">−<HeroCount value={v} decimals={0} suffix="%" locale={locale} className="num" /></span><span>{k}</span></span>)}
          <span className="d5-discount__token" translate="no">{l.pays} {d.token}</span>
        </p>
      )}
    </section>
  );
}

export function ExchangeFactsV5({ slug, locale, profile, visual = false }) {
  const l = labels(locale);
  const hasList = (a) => Array.isArray(a) && a.length > 0;
  // "Products" lists actual product lines (spot, perps, fiat rails, on-chain), not editorial claims.
  const mc = matrixCopy(locale);
  const db = venueDatabase[slug] || {};
  const category = db.category || profile?.category;
  const perpChecked = Boolean(factsForVenue(slug)?.fields?.perp && feeFact(slug, "perp").state === "checked");
  const strengths = [];
  if (category && category !== "Perp DEX") strengths.push(mc.pSpot);
  if (category === "Perp DEX" || (category === "CEX" && (db.futuresFee || perpChecked))) strengths.push(mc.pPerp);
  if (category === "CEX" && hasList(db.fiatChannels)) strengths.push(`${mc.pFiat}: ${paymentMethodLabels(db.fiatChannels, locale).join(paymentMethodSeparator(locale))}`);
  if (category && category !== "CEX") strengths.push(mc.pChain);
  // venueProfile already removes limitations that repeat a check; dedupe again here so no source can list one item twice.
  const eligibility = uniqueTextEntries([...(profile?.checks || []), ...(profile?.limitations || [])]).slice(0, 6);
  if (!strengths.length && !eligibility.length) return null;

  return (
    <div className="d5-facts">
      {(strengths.length > 0 || eligibility.length > 0) && (
        <section className="d5-block d5-scope">
          <SectionRule />
          {strengths.length > 0 && (
            <Reveal as="div" className="d5-scope__col">
              <h2>{visual?.products}{l.products}</h2>
              <ul className="d5-list">{strengths.slice(0, 5).map((s) => <li key={s}>{s}</li>)}</ul>
            </Reveal>
          )}
          {eligibility.length > 0 && (
            <Reveal as="div" index={1} className="d5-scope__col">
              <h2>{visual?.eligibility}{l.eligibility}</h2>
              <ul className="d5-list d5-list--caution">{eligibility.map((s) => <li key={s}>{s}</li>)}</ul>
            </Reveal>
          )}
        </section>
      )}
    </div>
  );
}
