import facts from "../../data/exchange-facts-20261008.json";
import { Reveal, CountUp } from "../../lib/v5/index.js";

// Short labels only. Everything else on the page comes from existing localized content.
const L = {
  en: { fees: "Fees", spot: "Spot", perp: "Perpetual", maker: "Maker", taker: "Taker", discount: "Fee discount", check: "Check official page", checked: "Checked", products: "Products", eligibility: "Regions and eligibility", spotSub: "Base tier", perpSub: "Futures base tier", pays: "when fees are paid in" },
  "zh-Hans": { fees: "费率", spot: "现货", perp: "永续合约", maker: "挂单", taker: "吃单", discount: "手续费折扣", check: "以官方页面为准", checked: "核验于", products: "产品", eligibility: "地区与资格", spotSub: "基础等级", perpSub: "合约基础等级", pays: "以此币种支付手续费时" },
  "zh-Hant": { fees: "費率", spot: "現貨", perp: "永續合約", maker: "掛單", taker: "吃單", discount: "手續費折扣", check: "以官方頁面為準", checked: "核驗於", products: "產品", eligibility: "地區與資格", spotSub: "基礎等級", perpSub: "合約基礎等級", pays: "以此幣種支付手續費時" },
  es: { fees: "Comisiones", spot: "Spot", perp: "Perpetuos", maker: "Maker", taker: "Taker", discount: "Descuento", check: "Ver página oficial", checked: "Revisado", products: "Productos", eligibility: "Regiones y requisitos", spotSub: "Nivel base", perpSub: "Nivel base de futuros", pays: "al pagar comisiones con" },
  "pt-BR": { fees: "Taxas", spot: "Spot", perp: "Perpétuos", maker: "Maker", taker: "Taker", discount: "Desconto", check: "Ver página oficial", checked: "Verificado", products: "Produtos", eligibility: "Regiões e elegibilidade", spotSub: "Nível base", perpSub: "Nível base de futuros", pays: "ao pagar taxas com" },
  fr: { fees: "Frais", spot: "Spot", perp: "Perpétuels", maker: "Maker", taker: "Taker", discount: "Réduction", check: "Voir la page officielle", checked: "Vérifié", products: "Produits", eligibility: "Régions et éligibilité", spotSub: "Palier de base", perpSub: "Palier futures de base", pays: "si les frais sont payés en" },
  de: { fees: "Gebühren", spot: "Spot", perp: "Perpetuals", maker: "Maker", taker: "Taker", discount: "Gebührenrabatt", check: "Offizielle Seite prüfen", checked: "Geprüft", products: "Produkte", eligibility: "Regionen und Zugang", spotSub: "Basisstufe", perpSub: "Futures-Basisstufe", pays: "bei Zahlung in" },
  ja: { fees: "手数料", spot: "現物", perp: "無期限先物", maker: "メイカー", taker: "テイカー", discount: "手数料割引", check: "公式ページで確認", checked: "確認日", products: "商品", eligibility: "地域と利用資格", spotSub: "基本ティア", perpSub: "先物の基本ティア", pays: "手数料の支払いに使う場合" },
  ko: { fees: "수수료", spot: "현물", perp: "무기한", maker: "메이커", taker: "테이커", discount: "수수료 할인", check: "공식 페이지 확인", checked: "확인일", products: "상품", eligibility: "지역 및 자격", spotSub: "기본 등급", perpSub: "선물 기본 등급", pays: "수수료를 다음으로 낼 때" },
  tr: { fees: "Ücretler", spot: "Spot", perp: "Perpetual", maker: "Maker", taker: "Taker", discount: "Ücret indirimi", check: "Resmî sayfayı kontrol et", checked: "Kontrol", products: "Ürünler", eligibility: "Bölgeler ve uygunluk", spotSub: "Temel kademe", perpSub: "Vadeli temel kademe", pays: "ücret şununla ödenirse" },
  ru: { fees: "Комиссии", spot: "Спот", perp: "Бессрочные", maker: "Мейкер", taker: "Тейкер", discount: "Скидка", check: "Проверьте на официальной странице", checked: "Проверено", products: "Продукты", eligibility: "Регионы и доступ", spotSub: "Базовый уровень", perpSub: "Базовый уровень фьючерсов", pays: "при оплате комиссии в" },
  ar: { fees: "الرسوم", spot: "فوري", perp: "عقود دائمة", maker: "صانع", taker: "آخذ", discount: "خصم الرسوم", check: "راجع الصفحة الرسمية", checked: "تم التحقق", products: "المنتجات", eligibility: "المناطق والأهلية", spotSub: "المستوى الأساسي", perpSub: "المستوى الأساسي للعقود", pays: "عند دفع الرسوم بعملة" },
  id: { fees: "Biaya", spot: "Spot", perp: "Perpetual", maker: "Maker", taker: "Taker", discount: "Diskon biaya", check: "Cek halaman resmi", checked: "Dicek", products: "Produk", eligibility: "Wilayah dan kelayakan", spotSub: "Tingkat dasar", perpSub: "Tingkat dasar futures", pays: "jika biaya dibayar dengan" },
  vi: { fees: "Phí", spot: "Giao ngay", perp: "Vĩnh viễn", maker: "Maker", taker: "Taker", discount: "Giảm phí", check: "Xem trang chính thức", checked: "Đã kiểm tra", products: "Sản phẩm", eligibility: "Khu vực và điều kiện", spotSub: "Bậc cơ bản", perpSub: "Bậc futures cơ bản", pays: "khi trả phí bằng" },
  it: { fees: "Commissioni", spot: "Spot", perp: "Perpetui", maker: "Maker", taker: "Taker", discount: "Sconto", check: "Vedi pagina ufficiale", checked: "Verificato", products: "Prodotti", eligibility: "Regioni e idoneità", spotSub: "Livello base", perpSub: "Livello base futures", pays: "pagando le commissioni in" },
};

const labels = (locale) => L[locale] || L[String(locale || "en").split("-")[0]] || L.en;
const decimalsOf = (n) => (n >= 0.1 || Number.isInteger(n * 100) ? 2 : 3);

function Rate({ value, l, verified, locale }) {
  if (value == null) {
    return (
      <span className="d5-rate d5-rate--null">
        <span className="d5-dash" aria-hidden="true">–</span>
        <span className="d5-null-note">{l.check}</span>
        <span className="d5-sr">{l.check}</span>
      </span>
    );
  }
  return (
    <span className="d5-rate">
      <CountUp value={value} decimals={decimalsOf(value)} suffix="%" locale={locale} className="num d5-figure" />
      {verified && <span className="d5-checked">{l.checked} {facts.as_of}</span>}
    </span>
  );
}

function FeeRow({ title, sub, row, l, verified, index, locale }) {
  return (
    <Reveal as="div" index={index} className="d5-row" role="row">
      <div className="d5-row__name" role="rowheader"><b>{title}</b><small>{sub}</small></div>
      <div className="d5-row__cell" role="cell"><span className="d5-cell-label">{l.maker}</span><Rate value={row?.maker ?? null} l={l} verified={verified} locale={locale} /></div>
      <div className="d5-row__cell" role="cell"><span className="d5-cell-label">{l.taker}</span><Rate value={row?.taker ?? null} l={l} verified={verified} locale={locale} /></div>
    </Reveal>
  );
}

export function ExchangeFactsV5({ slug, locale, profile }) {
  const entry = facts.exchanges.find((e) => e.slug === slug);
  const l = labels(locale);
  const hasList = (a) => Array.isArray(a) && a.length > 0;
  const strengths = (hasList(profile?.strengths) ? profile.strengths : profile?.useCases) || [];
  const eligibility = [...(profile?.checks || []), ...(profile?.limitations || [])].slice(0, 6);
  if (!entry && !strengths.length && !eligibility.length) return null;
  const verified = entry?.status === "verified";
  const spotVerified = verified && !/re-check/i.test(entry?.fees?.spot?.note || "");
  const perpVerified = verified && !/re-check/i.test(entry?.fees?.perp?.note || "");
  const disc = entry?.discount;
  const token = disc?.token;
  const discParts = [];
  if (token && disc.spot_pct) discParts.push({ k: l.spot, v: disc.spot_pct });
  if (token && disc.perp_pct) discParts.push({ k: l.perp, v: disc.perp_pct });

  return (
    <div className="d5-facts">
      {entry && (
        <section className="d5-block d5-fees" aria-labelledby="d5-fees-h">
          <Reveal as="div" className="d5-block__head">
            <h2 id="d5-fees-h">{l.fees}</h2>
            {discParts.length > 0 && (
              <p className="d5-discount">
                <span className="d5-discount__label">{l.discount}</span>
                {discParts.map((p) => (
                  <span key={p.k} className="d5-discount__item">
                    <span className="d5-up num">−<CountUp value={p.v} suffix="%" locale={locale} className="num" /></span>
                    <span>{p.k}</span>
                  </span>
                ))}
                <span className="d5-discount__token" translate="no">{l.pays} {token}</span>
              </p>
            )}
          </Reveal>
          <div className="d5-table" role="table" aria-label={l.fees}>
            <div className="d5-row d5-row--head" role="row">
              <span role="columnheader">{l.fees}</span>
              <span role="columnheader">{l.maker}</span>
              <span role="columnheader">{l.taker}</span>
            </div>
            <FeeRow index={0} title={l.spot} sub={l.spotSub} row={entry.fees?.spot} l={l} verified={spotVerified} locale={locale} />
            <FeeRow index={1} title={l.perp} sub={l.perpSub} row={entry.fees?.perp} l={l} verified={perpVerified} locale={locale} />
          </div>
        </section>
      )}

      {(strengths.length > 0 || eligibility.length > 0) && (
        <section className="d5-block d5-scope">
          {strengths.length > 0 && (
            <Reveal as="div" className="d5-scope__col">
              <h2>{l.products}</h2>
              <ul className="d5-list">{strengths.slice(0, 5).map((s) => <li key={s}>{s}</li>)}</ul>
            </Reveal>
          )}
          {eligibility.length > 0 && (
            <Reveal as="div" index={1} className="d5-scope__col">
              <h2>{l.eligibility}</h2>
              <ul className="d5-list d5-list--caution">{eligibility.map((s) => <li key={s}>{s}</li>)}</ul>
            </Reveal>
          )}
        </section>
      )}
    </div>
  );
}
