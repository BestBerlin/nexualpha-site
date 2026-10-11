// Long-tail "X vs Y" coverage (2026-10-11): every pair of active venues gets a /compare/<a>-vs-<b> page rendered
// from reviewed data only. This module is the single source for
//   - the canonical slug of a pair (curated pairs keep their hand-written order, generated pairs are alphabetical),
//   - the index policy (index,follow only when BOTH venues have reviewed spot or perp fee rows AND at least one is a
//     partner; everything else stays noindex,follow but still renders),
//   - the sitemap locales of an indexable generated pair (en + locales where both venues carry localized facts),
//   - the per-locale templates for the generated title / description / H1 / provenance note and the picker.
// It is imported by worker/index.js (shipped by scripts/prepare-sites-build.mjs), the SSR/client app and
// seo-injection.js, so the three never disagree. No fee figure, product or KYC fact is written here.
import { reviewedBaseFeesForVenue } from "./reviewed-base-fees.js";
import { FACTS_AS_OF } from "./exchange-facts.js";
import { REFERRAL_PARTNERS } from "./referral-partners.generated.js";
import { researchForVenue } from "./exchange-research.js";

export {
  COMPARE_LOCALES, ACTIVE_COMPARE_VENUE_SLUGS, CURATED_COMPARISON_SLUGS, isActiveCompareVenue, isCuratedComparison,
  parseComparePair, canonicalComparePairSlug, canonicalComparePath, isCanonicalComparePair, normalizeCompareLocale,
  comparePickerCopy,
} from "./compare-slug.js";
import { COMPARE_LOCALES, ACTIVE_COMPARE_VENUE_SLUGS, CURATED_COMPARISON_SLUGS, isActiveCompareVenue, isCuratedComparison, parseComparePair, canonicalComparePairSlug, canonicalComparePath, isCanonicalComparePair, normalizeCompareLocale } from "./compare-slug.js";

// Reviewed fee row = exchange-facts.js has a checked maker AND taker figure for spot or perp (reviewed-base-fees.js).
export function venueHasReviewedFees(slug) {
  return (reviewedBaseFeesForVenue(slug)?.rates?.length || 0) > 0;
}
const PARTNER_SLUGS = new Set(REFERRAL_PARTNERS.map((partner) => partner.slug));
// Partner = present in the generated referral partner feed (same feed the bot and /intel/partners.json read).
export const isComparePartnerVenue = (slug) => PARTNER_SLUGS.has(String(slug || ""));

const defaultPolicyOptions = Object.freeze({ hasReviewedFees: venueHasReviewedFees, isPartner: isComparePartnerVenue });

// Index policy for a generated (non-curated) two-venue pair. `options` lets tests supply fixture predicates.
export function generatedComparePolicy(pair, options = {}) {
  const hasReviewedFees = options.hasReviewedFees || defaultPolicyOptions.hasReviewedFees;
  const isPartner = options.isPartner || defaultPolicyOptions.isPartner;
  const slugs = Array.isArray(pair) ? pair : String(pair || "").split("-vs-");
  const curated = isCuratedComparison(Array.isArray(pair) ? canonicalComparePairSlug(pair) : pair);
  const twoVenues = slugs.length === 2 && new Set(slugs).size === 2;
  const bothReviewed = twoVenues && slugs.every((slug) => Boolean(hasReviewedFees(slug)));
  const anyPartner = twoVenues && slugs.some((slug) => Boolean(isPartner(slug)));
  const generated = twoVenues && !curated;
  return Object.freeze({
    curated,
    generated,
    bothReviewed,
    anyPartner,
    indexable: generated && bothReviewed && anyPartner,
    robots: curated || (generated && bothReviewed && anyPartner) ? "index,follow" : "noindex,follow",
  });
}

// Every alphabetical pair of active venues that has no curated page.
export function generatedComparePairs(venues = ACTIVE_COMPARE_VENUE_SLUGS) {
  const sorted = [...new Set(venues)].sort();
  const pairs = [];
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const pair = `${sorted[i]}-vs-${sorted[j]}`;
      if (!isCuratedComparison(canonicalComparePairSlug([sorted[i], sorted[j]]))) pairs.push(pair);
    }
  }
  return pairs;
}
export function indexableGeneratedComparePairs(options = {}) {
  return generatedComparePairs(options.venues).filter((pair) => generatedComparePolicy(pair, options).indexable);
}

// A venue has "localized facts" in a locale when its research record is written natively in that locale.
export function venueHasLocalizedFacts(slug, locale) {
  if (locale === "en") return true;
  return researchForVenue(slug, locale)?.contentLocale === locale;
}
export function generatedCompareLocales(pair, options = {}) {
  const slugs = Array.isArray(pair) ? pair : String(pair || "").split("-vs-");
  const hasLocalizedFacts = options.hasLocalizedFacts || venueHasLocalizedFacts;
  return COMPARE_LOCALES.filter((locale) => locale === "en" || slugs.every((slug) => Boolean(hasLocalizedFacts(slug, locale))));
}

// Review date shown in the provenance note: the newest reviewed fee check of the two venues, else the facts snapshot.
export function generatedCompareDataDate(slugs = []) {
  const dates = slugs.map((slug) => reviewedBaseFeesForVenue(slug)?.checkedAt).filter(Boolean).sort();
  return dates.at(-1) || FACTS_AS_OF;
}

// Curated pairs that share a venue with the selection; generated pairs sharing a venue (indexable first).
export function curatedPairsSharingVenue(slugs = [], exclude = "") {
  const wanted = new Set(slugs);
  return CURATED_COMPARISON_SLUGS.filter((pair) => pair !== exclude && pair.split("-vs-").some((slug) => wanted.has(slug)));
}
export function generatedPairsSharingVenue(slug, { limit = 6, exclude = "", indexableOnly = true } = {}) {
  const pairs = generatedComparePairs().filter((pair) => pair !== exclude && pair.split("-vs-").includes(slug));
  const indexable = pairs.filter((pair) => generatedComparePolicy(pair).indexable);
  const list = indexableOnly ? indexable : [...indexable, ...pairs.filter((pair) => !indexable.includes(pair))];
  return list.slice(0, limit);
}

const fill = (value, vars) => String(value || "").replace(/\{(\w+)\}/g, (_m, key) => vars[key] ?? "");

// Natural per-locale templates. ru / ar / zh-Hant stay neutral; ja / ko stay informational (no sign-up wording).
const COPY = {
  en: {
    title: "{a} vs {b}: Fees, Products and KYC Compared — NexuAlpha",
    description: "{a} vs {b} compared from NexuAlpha's reviewed data: published spot and futures fees, products, KYC and official sources. No editorial verdict.",
    h1: "{a} vs {b}: fees, products and KYC side by side",
    note: "Generated from NexuAlpha's reviewed data on {date} — no editorial verdict. Figures we have not checked stay marked as not verified.",
    relatedCurated: "Curated comparisons with {name}",
    moreWith: "More comparisons with {name}",
    profiles: "Platform profiles",
    picker: { title: "Compare any two platforms", a: "First platform", b: "Second platform", submit: "Compare", hint: "Pick two different platforms; the page opens in its canonical order.", same: "Choose two different platforms.", placeholder: "Select a platform" },
    index: { title: "Compare Crypto Exchanges Side by Side — NexuAlpha", description: "Pick any two reviewed exchanges and compare published fees, products, KYC and official sources. Curated comparisons carry NexuAlpha's editorial notes.", h1: "Compare crypto exchanges", intro: "Every comparison renders from the same reviewed fee, product and KYC records; anything unchecked stays marked as not verified.", curated: "Curated comparisons", generated: "Data-generated comparisons", generatedNote: "Generated pages carry no editorial verdict and are labelled as such.", pageOf: "Page" },
  },
  "zh-Hans": {
    title: "{a} 与 {b} 对比：手续费、产品与 KYC — NexuAlpha",
    description: "基于 NexuAlpha 已审核数据生成的 {a} 与 {b} 并排对比：公开现货与合约费率、产品范围、KYC 与官方来源，不含编辑结论。",
    h1: "{a} vs {b}：手续费、产品与 KYC 并排对比",
    note: "本页由 NexuAlpha 于 {date} 审核的数据自动生成，不含编辑结论；未核验的数据保持“待核验”状态。",
    relatedCurated: "含 {name} 的精选对比",
    moreWith: "更多与 {name} 的对比",
    profiles: "平台资料",
    picker: { title: "任选两家平台对比", a: "第一家平台", b: "第二家平台", submit: "开始对比", hint: "选择两家不同的平台，页面将按统一顺序打开。", same: "请选择两家不同的平台。", placeholder: "选择平台" },
    index: { title: "加密交易所并排对比 — NexuAlpha", description: "任选两家已审核的交易所，对比公开费率、产品、KYC 与官方来源；精选对比附带 NexuAlpha 编辑说明。", h1: "交易所对比", intro: "所有对比页均基于同一套已审核的费率、产品与 KYC 记录；未核验的项目保持“待核验”。", curated: "精选对比", generated: "数据生成的对比", generatedNote: "数据生成页面不含编辑结论，并在页面内标明。", pageOf: "第" },
  },
  "zh-Hant": {
    title: "{a} 與 {b} 比較：手續費、產品與 KYC — NexuAlpha",
    description: "依 NexuAlpha 已審核資料產生的 {a} 與 {b} 並排比較：公開現貨與合約費率、產品範圍、KYC 與官方來源，不含編輯結論。",
    h1: "{a} vs {b}：手續費、產品與 KYC 並排比較",
    note: "本頁由 NexuAlpha 於 {date} 審核的資料自動產生，不含編輯結論；未核驗的資料維持「待核驗」狀態。",
    relatedCurated: "含 {name} 的精選比較",
    moreWith: "更多與 {name} 的比較",
    profiles: "平台資料",
    picker: { title: "任選兩家平台比較", a: "第一家平台", b: "第二家平台", submit: "開始比較", hint: "選擇兩家不同的平台，頁面會以統一順序開啟。", same: "請選擇兩家不同的平台。", placeholder: "選擇平台" },
    index: { title: "加密交易所並排比較 — NexuAlpha", description: "任選兩家已審核的交易所，比較公開費率、產品、KYC 與官方來源；精選比較附有 NexuAlpha 編輯說明。", h1: "交易所比較", intro: "所有比較頁均依同一套已審核的費率、產品與 KYC 記錄產生；未核驗的項目維持「待核驗」。", curated: "精選比較", generated: "資料產生的比較", generatedNote: "資料產生的頁面不含編輯結論，並於頁面內標示。", pageOf: "第" },
  },
  es: {
    title: "{a} vs {b}: comisiones, productos y KYC — NexuAlpha",
    description: "{a} y {b} comparados con los datos revisados de NexuAlpha: comisiones spot y de futuros publicadas, productos, KYC y fuentes oficiales. Sin veredicto editorial.",
    h1: "{a} vs {b}: comisiones, productos y KYC lado a lado",
    note: "Generada a partir de los datos revisados por NexuAlpha el {date}; sin veredicto editorial. Los datos no comprobados siguen marcados como no verificados.",
    relatedCurated: "Comparaciones seleccionadas con {name}",
    moreWith: "Más comparaciones con {name}",
    profiles: "Perfiles de plataforma",
    picker: { title: "Compara dos plataformas cualesquiera", a: "Primera plataforma", b: "Segunda plataforma", submit: "Comparar", hint: "Elige dos plataformas distintas; la página se abre en su orden canónico.", same: "Elige dos plataformas distintas.", placeholder: "Selecciona una plataforma" },
    index: { title: "Compara exchanges de criptomonedas lado a lado — NexuAlpha", description: "Elige dos exchanges revisados y compara comisiones publicadas, productos, KYC y fuentes oficiales; las comparaciones seleccionadas incluyen notas editoriales de NexuAlpha.", h1: "Comparar exchanges", intro: "Todas las comparaciones se generan con los mismos registros revisados de comisiones, productos y KYC; lo no comprobado queda marcado como no verificado.", curated: "Comparaciones seleccionadas", generated: "Comparaciones generadas con datos", generatedNote: "Las páginas generadas no incluyen veredicto editorial y lo indican.", pageOf: "Página" },
  },
  "pt-BR": {
    title: "{a} vs {b}: taxas, produtos e KYC — NexuAlpha",
    description: "{a} e {b} comparados com os dados revisados da NexuAlpha: taxas spot e de futuros publicadas, produtos, KYC e fontes oficiais. Sem veredito editorial.",
    h1: "{a} vs {b}: taxas, produtos e KYC lado a lado",
    note: "Gerada a partir dos dados revisados pela NexuAlpha em {date}; sem veredito editorial. Dados não checados continuam marcados como não verificados.",
    relatedCurated: "Comparações selecionadas com {name}",
    moreWith: "Mais comparações com {name}",
    profiles: "Perfis das plataformas",
    picker: { title: "Compare duas plataformas quaisquer", a: "Primeira plataforma", b: "Segunda plataforma", submit: "Comparar", hint: "Escolha duas plataformas diferentes; a página abre na ordem canônica.", same: "Escolha duas plataformas diferentes.", placeholder: "Selecione uma plataforma" },
    index: { title: "Compare exchanges de criptomoedas lado a lado — NexuAlpha", description: "Escolha duas exchanges revisadas e compare taxas publicadas, produtos, KYC e fontes oficiais; as comparações selecionadas trazem notas editoriais da NexuAlpha.", h1: "Comparar exchanges", intro: "Todas as comparações usam os mesmos registros revisados de taxas, produtos e KYC; o que não foi checado fica marcado como não verificado.", curated: "Comparações selecionadas", generated: "Comparações geradas a partir de dados", generatedNote: "As páginas geradas não trazem veredito editorial e informam isso.", pageOf: "Página" },
  },
  fr: {
    title: "{a} vs {b} : frais, produits et KYC — NexuAlpha",
    description: "{a} et {b} comparés à partir des données vérifiées de NexuAlpha : frais spot et futures publiés, produits, KYC et sources officielles. Sans verdict éditorial.",
    h1: "{a} vs {b} : frais, produits et KYC côte à côte",
    note: "Générée à partir des données vérifiées par NexuAlpha le {date} ; sans verdict éditorial. Les données non contrôlées restent marquées comme non vérifiées.",
    relatedCurated: "Comparaisons sélectionnées avec {name}",
    moreWith: "Plus de comparaisons avec {name}",
    profiles: "Profils des plateformes",
    picker: { title: "Comparer deux plateformes au choix", a: "Première plateforme", b: "Seconde plateforme", submit: "Comparer", hint: "Choisissez deux plateformes différentes ; la page s’ouvre dans l’ordre canonique.", same: "Choisissez deux plateformes différentes.", placeholder: "Sélectionner une plateforme" },
    index: { title: "Comparer les plateformes crypto côte à côte — NexuAlpha", description: "Choisissez deux plateformes vérifiées et comparez frais publiés, produits, KYC et sources officielles ; les comparaisons sélectionnées incluent les notes éditoriales de NexuAlpha.", h1: "Comparer les plateformes", intro: "Toutes les comparaisons s’appuient sur les mêmes enregistrements vérifiés de frais, produits et KYC ; ce qui n’a pas été contrôlé reste marqué comme non vérifié.", curated: "Comparaisons sélectionnées", generated: "Comparaisons générées à partir des données", generatedNote: "Les pages générées ne contiennent aucun verdict éditorial et le précisent.", pageOf: "Page" },
  },
  de: {
    title: "{a} vs. {b}: Gebühren, Produkte und KYC — NexuAlpha",
    description: "{a} und {b} aus den geprüften Daten von NexuAlpha verglichen: veröffentlichte Spot- und Futures-Gebühren, Produkte, KYC, offizielle Quellen. Ohne redaktionelles Urteil.",
    h1: "{a} vs. {b}: Gebühren, Produkte und KYC im Vergleich",
    note: "Erzeugt aus den am {date} geprüften Daten von NexuAlpha; ohne redaktionelles Urteil. Nicht kontrollierte Angaben bleiben als nicht verifiziert markiert.",
    relatedCurated: "Kuratierte Vergleiche mit {name}",
    moreWith: "Weitere Vergleiche mit {name}",
    profiles: "Plattformprofile",
    picker: { title: "Zwei beliebige Plattformen vergleichen", a: "Erste Plattform", b: "Zweite Plattform", submit: "Vergleichen", hint: "Wählen Sie zwei verschiedene Plattformen; die Seite öffnet in kanonischer Reihenfolge.", same: "Wählen Sie zwei verschiedene Plattformen.", placeholder: "Plattform wählen" },
    index: { title: "Krypto-Börsen im direkten Vergleich — NexuAlpha", description: "Wählen Sie zwei geprüfte Börsen und vergleichen Sie veröffentlichte Gebühren, Produkte, KYC und offizielle Quellen; kuratierte Vergleiche enthalten redaktionelle Hinweise von NexuAlpha.", h1: "Börsen vergleichen", intro: "Alle Vergleiche entstehen aus denselben geprüften Gebühren-, Produkt- und KYC-Datensätzen; Ungeprüftes bleibt als nicht verifiziert markiert.", curated: "Kuratierte Vergleiche", generated: "Aus Daten erzeugte Vergleiche", generatedNote: "Erzeugte Seiten enthalten kein redaktionelles Urteil und weisen darauf hin.", pageOf: "Seite" },
  },
  it: {
    title: "{a} vs {b}: commissioni, prodotti e KYC — NexuAlpha",
    description: "{a} e {b} confrontati con i dati verificati di NexuAlpha: commissioni spot e futures pubblicate, prodotti, KYC e fonti ufficiali. Senza verdetto editoriale.",
    h1: "{a} vs {b}: commissioni, prodotti e KYC a confronto",
    note: "Generato dai dati verificati da NexuAlpha il {date}; senza verdetto editoriale. I dati non controllati restano contrassegnati come non verificati.",
    relatedCurated: "Confronti selezionati con {name}",
    moreWith: "Altri confronti con {name}",
    profiles: "Profili delle piattaforme",
    picker: { title: "Confronta due piattaforme a scelta", a: "Prima piattaforma", b: "Seconda piattaforma", submit: "Confronta", hint: "Scegli due piattaforme diverse; la pagina si apre nell’ordine canonico.", same: "Scegli due piattaforme diverse.", placeholder: "Seleziona una piattaforma" },
    index: { title: "Confronta gli exchange crypto fianco a fianco — NexuAlpha", description: "Scegli due exchange verificati e confronta commissioni pubblicate, prodotti, KYC e fonti ufficiali; i confronti selezionati includono le note editoriali di NexuAlpha.", h1: "Confronta gli exchange", intro: "Tutti i confronti nascono dagli stessi record verificati di commissioni, prodotti e KYC; ciò che non è stato controllato resta contrassegnato come non verificato.", curated: "Confronti selezionati", generated: "Confronti generati dai dati", generatedNote: "Le pagine generate non contengono un verdetto editoriale e lo dichiarano.", pageOf: "Pagina" },
  },
  ja: {
    title: "{a}と{b}の比較：手数料・商品・KYC — NexuAlpha",
    description: "NexuAlphaの確認済みデータから生成した{a}と{b}の比較。公開手数料、商品範囲、KYC、公式ソースを並べて確認できます。編集部の結論は含みません。",
    h1: "{a} vs {b}：手数料・商品・KYCを並べて確認",
    note: "このページは NexuAlpha が {date} に確認したデータから自動生成されています。編集部の結論は含まず、未確認の項目は「未確認」のまま表示します。",
    relatedCurated: "{name} を含む編集部選定の比較",
    moreWith: "{name} のその他の比較",
    profiles: "プラットフォームの概要",
    picker: { title: "任意の2つのプラットフォームを比較", a: "1つ目のプラットフォーム", b: "2つ目のプラットフォーム", submit: "比較する", hint: "異なる2つのプラットフォームを選ぶと、統一された順序でページが開きます。", same: "異なる2つのプラットフォームを選んでください。", placeholder: "プラットフォームを選択" },
    index: { title: "暗号資産取引所を並べて比較 — NexuAlpha", description: "確認済みの取引所から任意の2つを選び、公開手数料、商品、KYC、公式ソースを比較できます。編集部選定の比較には NexuAlpha の注記が付きます。", h1: "取引所を比較する", intro: "すべての比較は同じ確認済みの手数料・商品・KYC記録から生成され、未確認の項目は「未確認」のまま表示されます。", curated: "編集部選定の比較", generated: "データから生成した比較", generatedNote: "生成ページには編集部の結論は含まれず、その旨を明記しています。", pageOf: "ページ" },
  },
  ko: {
    title: "{a} vs {b} 비교: 수수료·상품·KYC — NexuAlpha",
    description: "NexuAlpha 검토 데이터로 생성한 {a}와 {b} 비교: 공개 수수료, 상품 범위, KYC, 공식 출처를 나란히 확인합니다. 편집 결론은 없습니다.",
    h1: "{a} vs {b}: 수수료·상품·KYC 나란히 보기",
    note: "이 페이지는 NexuAlpha가 {date}에 검토한 데이터로 자동 생성되었습니다. 편집 결론은 포함하지 않으며, 확인되지 않은 항목은 ‘미확인’으로 표시됩니다.",
    relatedCurated: "{name} 포함 선별 비교",
    moreWith: "{name} 관련 다른 비교",
    profiles: "플랫폼 프로필",
    picker: { title: "원하는 두 플랫폼 비교", a: "첫 번째 플랫폼", b: "두 번째 플랫폼", submit: "비교하기", hint: "서로 다른 두 플랫폼을 선택하면 표준 순서로 페이지가 열립니다.", same: "서로 다른 두 플랫폼을 선택하세요.", placeholder: "플랫폼 선택" },
    index: { title: "암호화폐 거래소 나란히 비교 — NexuAlpha", description: "검토된 거래소 중 두 곳을 선택해 공개 수수료, 상품, KYC, 공식 출처를 비교하세요. 선별 비교에는 NexuAlpha 편집 노트가 포함됩니다.", h1: "거래소 비교", intro: "모든 비교는 동일한 검토 수수료·상품·KYC 기록으로 생성되며, 확인되지 않은 항목은 ‘미확인’으로 표시됩니다.", curated: "선별 비교", generated: "데이터로 생성한 비교", generatedNote: "생성된 페이지는 편집 결론을 포함하지 않으며 이를 명시합니다.", pageOf: "페이지" },
  },
  ru: {
    title: "{a} и {b}: сравнение комиссий, продуктов и KYC — NexuAlpha",
    description: "{a} и {b} по проверенным данным NexuAlpha: опубликованные комиссии спот и фьючерсов, продукты, KYC и официальные источники. Без редакционного вывода.",
    h1: "{a} vs {b}: комиссии, продукты и KYC рядом",
    note: "Сформировано из данных, проверенных NexuAlpha {date}; без редакционного вывода. Непроверенные сведения остаются с пометкой «не подтверждено».",
    relatedCurated: "Отобранные сравнения с {name}",
    moreWith: "Другие сравнения с {name}",
    profiles: "Профили платформ",
    picker: { title: "Сравнить любые две платформы", a: "Первая платформа", b: "Вторая платформа", submit: "Сравнить", hint: "Выберите две разные платформы; страница откроется в каноническом порядке.", same: "Выберите две разные платформы.", placeholder: "Выберите платформу" },
    index: { title: "Сравнение криптобирж рядом — NexuAlpha", description: "Выберите две проверенные биржи и сравните опубликованные комиссии, продукты, KYC и официальные источники; отобранные сравнения содержат редакционные заметки NexuAlpha.", h1: "Сравнить биржи", intro: "Все сравнения строятся на одних и тех же проверенных записях о комиссиях, продуктах и KYC; непроверенное остаётся с пометкой «не подтверждено».", curated: "Отобранные сравнения", generated: "Сравнения, сформированные из данных", generatedNote: "Сформированные страницы не содержат редакционного вывода и сообщают об этом.", pageOf: "Страница" },
  },
  tr: {
    title: "{a} vs {b}: ücretler, ürünler ve KYC — NexuAlpha",
    description: "NexuAlpha'nın incelenmiş verileriyle {a} ve {b} karşılaştırması: yayınlanan spot ve vadeli ücretler, ürünler, KYC ve resmî kaynaklar. Editoryal hüküm yok.",
    h1: "{a} vs {b}: ücretler, ürünler ve KYC yan yana",
    note: "{date} tarihinde NexuAlpha tarafından incelenen verilerden oluşturuldu; editoryal hüküm içermez. Kontrol edilmemiş veriler doğrulanmamış olarak işaretli kalır.",
    relatedCurated: "{name} içeren seçilmiş karşılaştırmalar",
    moreWith: "{name} ile diğer karşılaştırmalar",
    profiles: "Platform profilleri",
    picker: { title: "Herhangi iki platformu karşılaştırın", a: "Birinci platform", b: "İkinci platform", submit: "Karşılaştır", hint: "İki farklı platform seçin; sayfa standart sırayla açılır.", same: "İki farklı platform seçin.", placeholder: "Platform seçin" },
    index: { title: "Kripto borsalarını yan yana karşılaştırın — NexuAlpha", description: "İncelenmiş borsalardan ikisini seçip yayınlanan ücretleri, ürünleri, KYC'yi ve resmî kaynakları karşılaştırın; seçilmiş karşılaştırmalar NexuAlpha'nın editoryal notlarını içerir.", h1: "Borsaları karşılaştır", intro: "Tüm karşılaştırmalar aynı incelenmiş ücret, ürün ve KYC kayıtlarından üretilir; kontrol edilmemiş veriler doğrulanmamış olarak kalır.", curated: "Seçilmiş karşılaştırmalar", generated: "Verilerden oluşturulan karşılaştırmalar", generatedNote: "Oluşturulan sayfalar editoryal hüküm içermez ve bunu belirtir.", pageOf: "Sayfa" },
  },
  id: {
    title: "{a} vs {b}: biaya, produk, dan KYC — NexuAlpha",
    description: "{a} dan {b} dibandingkan dari data terverifikasi NexuAlpha: biaya spot dan futures yang dipublikasikan, produk, KYC, dan sumber resmi. Tanpa penilaian editorial.",
    h1: "{a} vs {b}: biaya, produk, dan KYC berdampingan",
    note: "Dihasilkan dari data yang ditinjau NexuAlpha pada {date}; tanpa penilaian editorial. Data yang belum diperiksa tetap ditandai belum terverifikasi.",
    relatedCurated: "Perbandingan pilihan dengan {name}",
    moreWith: "Perbandingan lain dengan {name}",
    profiles: "Profil platform",
    picker: { title: "Bandingkan dua platform mana pun", a: "Platform pertama", b: "Platform kedua", submit: "Bandingkan", hint: "Pilih dua platform yang berbeda; halaman terbuka dalam urutan kanonis.", same: "Pilih dua platform yang berbeda.", placeholder: "Pilih platform" },
    index: { title: "Bandingkan exchange kripto berdampingan — NexuAlpha", description: "Pilih dua exchange terverifikasi dan bandingkan biaya yang dipublikasikan, produk, KYC, dan sumber resmi; perbandingan pilihan menyertakan catatan editorial NexuAlpha.", h1: "Bandingkan exchange", intro: "Semua perbandingan dibuat dari catatan biaya, produk, dan KYC terverifikasi yang sama; yang belum diperiksa tetap ditandai belum terverifikasi.", curated: "Perbandingan pilihan", generated: "Perbandingan yang dihasilkan dari data", generatedNote: "Halaman yang dihasilkan tidak memuat penilaian editorial dan menyatakannya.", pageOf: "Halaman" },
  },
  vi: {
    title: "{a} vs {b}: phí, sản phẩm và KYC — NexuAlpha",
    description: "So sánh {a} và {b} từ dữ liệu đã kiểm tra của NexuAlpha: phí giao ngay và hợp đồng tương lai đã công bố, sản phẩm, KYC và nguồn chính thức. Không có kết luận biên tập.",
    h1: "{a} vs {b}: phí, sản phẩm và KYC đặt cạnh nhau",
    note: "Được tạo từ dữ liệu NexuAlpha đã kiểm tra ngày {date}; không có kết luận biên tập. Dữ liệu chưa kiểm tra vẫn được đánh dấu là chưa xác minh.",
    relatedCurated: "So sánh chọn lọc có {name}",
    moreWith: "Các so sánh khác với {name}",
    profiles: "Hồ sơ nền tảng",
    picker: { title: "So sánh hai nền tảng bất kỳ", a: "Nền tảng thứ nhất", b: "Nền tảng thứ hai", submit: "So sánh", hint: "Chọn hai nền tảng khác nhau; trang sẽ mở theo thứ tự chuẩn.", same: "Hãy chọn hai nền tảng khác nhau.", placeholder: "Chọn nền tảng" },
    index: { title: "So sánh các sàn giao dịch crypto cạnh nhau — NexuAlpha", description: "Chọn hai sàn đã kiểm tra và so sánh phí công bố, sản phẩm, KYC và nguồn chính thức; các so sánh chọn lọc có ghi chú biên tập của NexuAlpha.", h1: "So sánh sàn giao dịch", intro: "Mọi so sánh đều được tạo từ cùng một bộ hồ sơ phí, sản phẩm và KYC đã kiểm tra; mục chưa kiểm tra vẫn được đánh dấu là chưa xác minh.", curated: "So sánh chọn lọc", generated: "So sánh tạo từ dữ liệu", generatedNote: "Các trang được tạo không có kết luận biên tập và ghi rõ điều đó.", pageOf: "Trang" },
  },
  ar: {
    title: "{a} مقابل {b}: الرسوم والمنتجات وKYC — NexuAlpha",
    description: "مقارنة {a} و{b} من بيانات NexuAlpha المراجَعة: الرسوم المنشورة للتداول الفوري والعقود الآجلة، المنتجات، KYC والمصادر الرسمية. دون حكم تحريري.",
    h1: "{a} مقابل {b}: الرسوم والمنتجات وKYC جنبًا إلى جنب",
    note: "أُنشئت هذه الصفحة من بيانات راجعتها NexuAlpha بتاريخ {date}؛ دون حكم تحريري. تبقى البيانات غير المدقَّقة موسومة بأنها غير موثَّقة.",
    relatedCurated: "مقارنات مختارة تتضمن {name}",
    moreWith: "مقارنات أخرى مع {name}",
    profiles: "ملفات المنصات",
    picker: { title: "قارن أي منصتين", a: "المنصة الأولى", b: "المنصة الثانية", submit: "قارن", hint: "اختر منصتين مختلفتين؛ تُفتح الصفحة بالترتيب القياسي.", same: "اختر منصتين مختلفتين.", placeholder: "اختر منصة" },
    index: { title: "مقارنة منصات العملات المشفرة جنبًا إلى جنب — NexuAlpha", description: "اختر منصتين مراجَعتين وقارن الرسوم المنشورة والمنتجات وKYC والمصادر الرسمية؛ تتضمن المقارنات المختارة ملاحظات تحريرية من NexuAlpha.", h1: "مقارنة المنصات", intro: "تُبنى كل المقارنات من نفس سجلات الرسوم والمنتجات وKYC المراجَعة؛ وما لم يُدقَّق يبقى موسومًا بأنه غير موثَّق.", curated: "مقارنات مختارة", generated: "مقارنات مُولَّدة من البيانات", generatedNote: "لا تتضمن الصفحات المُولَّدة حكمًا تحريريًا وتُصرِّح بذلك.", pageOf: "صفحة" },
  },
  // l10n: needs native review
  ur: {
    title: "{a} بمقابلہ {b}: فیس، مصنوعات اور KYC — NexuAlpha",
    description: "{a} اور {b} کا NexuAlpha کے جائزہ شدہ ڈیٹا سے موازنہ: شائع شدہ اسپاٹ اور فیوچر فیس، مصنوعات، KYC اور سرکاری ذرائع۔ کوئی ادارتی فیصلہ نہیں۔",
    h1: "{a} بمقابلہ {b}: فیس، مصنوعات اور KYC ساتھ ساتھ",
    note: "یہ صفحہ {date} کے NexuAlpha جائزہ شدہ ڈیٹا سے بنا ہے؛ کوئی ادارتی فیصلہ نہیں۔ غیر چیک شدہ اعداد غیر تصدیق شدہ رہتے ہیں۔",
    relatedCurated: "{name} کے ساتھ منتخب موازنے",
    moreWith: "{name} کے ساتھ مزید موازنے",
    profiles: "پلیٹ فارم پروفائلز",
    picker: { title: "کوئی بھی دو پلیٹ فارم موازنہ کریں", a: "پہلا پلیٹ فارم", b: "دوسرا پلیٹ فارم", submit: "موازنہ", hint: "دو مختلف پلیٹ فارم چنیں؛ صفحہ معیاری ترتیب میں کھلے گا۔", same: "دو مختلف پلیٹ فارم چنیں۔", placeholder: "پلیٹ فارم چنیں" },
    index: { title: "کرپٹو ایکسچینجز کا ساتھ ساتھ موازنہ — NexuAlpha", description: "دو جائزہ شدہ ایکسچینجز چنیں اور شائع شدہ فیس، مصنوعات، KYC اور سرکاری ذرائع دیکھیں؛ منتخب موازنوں میں NexuAlpha نوٹس شامل ہیں۔", h1: "کرپٹو ایکسچینجز کا موازنہ", intro: "ہر موازنہ ایک ہی جائزہ شدہ فیس، مصنوعات اور KYC ریکارڈ سے بنتا ہے؛ غیر چیک شدہ چیزیں غیر تصدیق شدہ رہتی ہیں۔", curated: "منتخب موازنے", generated: "ڈیٹا سے بنے موازنے", generatedNote: "ڈیٹا سے بنے صفحات میں ادارتی فیصلہ نہیں ہوتا اور یہ واضح کیا جاتا ہے۔", pageOf: "صفحہ" },
  },
  // l10n: needs native review
  uk: {
    title: "{a} проти {b}: комісії, продукти й KYC — NexuAlpha",
    description: "Порівняння {a} і {b} з перевірених даних NexuAlpha: опубліковані спотові та ф'ючерсні комісії, продукти, KYC та офіційні джерела. Без редакційного вердикту.",
    h1: "{a} проти {b}: комісії, продукти й KYC поруч",
    note: "Сторінку згенеровано з даних NexuAlpha, перевірених {date}; без редакційного вердикту. Неперевірені дані лишаються позначеними.",
    relatedCurated: "Вибрані порівняння з {name}",
    moreWith: "Більше порівнянь із {name}",
    profiles: "Профілі платформ",
    picker: { title: "Порівняйте будь-які дві платформи", a: "Перша платформа", b: "Друга платформа", submit: "Порівняти", hint: "Оберіть дві різні платформи; сторінка відкриється в канонічному порядку.", same: "Оберіть дві різні платформи.", placeholder: "Оберіть платформу" },
    index: { title: "Порівняння криптобірж поруч — NexuAlpha", description: "Оберіть дві перевірені біржі й порівняйте опубліковані комісії, продукти, KYC та офіційні джерела; вибрані порівняння мають нотатки NexuAlpha.", h1: "Порівняти криптобіржі", intro: "Усі порівняння будуються з тих самих перевірених записів про комісії, продукти й KYC; неперевірене лишається позначеним.", curated: "Вибрані порівняння", generated: "Порівняння з даних", generatedNote: "Згенеровані сторінки не містять редакційного вердикту й прямо це вказують.", pageOf: "Сторінка" },
  },
};


// Title / description / H1 / provenance note for a generated pair in one locale.
export function generatedCompareCopy(locale, { nameA = "", nameB = "", date = FACTS_AS_OF } = {}) {
  const copy = COPY[normalizeCompareLocale(locale)];
  const vars = { a: nameA, b: nameB, date };
  return {
    title: fill(copy.title, vars),
    description: fill(copy.description, vars),
    h1: fill(copy.h1, vars),
    note: fill(copy.note, vars),
    profiles: copy.profiles,
    relatedCurated: (name) => fill(copy.relatedCurated, { name }),
    moreWith: (name) => fill(copy.moreWith, { name }),
  };
}
export function compareIndexCopy(locale) {
  return COPY[normalizeCompareLocale(locale)].index;
}
