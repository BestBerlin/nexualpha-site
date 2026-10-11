// Helpers shared by the venue detail route (VenueDetailPage.jsx) and the compare pages (V3Pages.jsx).
// Split out of V3Pages.jsx (venue-graph perf lane, 2026-10-11) so the venue page no longer loads the compare graph.
// Chunk: route-v3-pages-shared (vite.config.mjs); no stylesheet of its own.
import { feePctOfRate } from "../../data/exchange-facts.js";
import { matrixCopy } from "./exchange-matrix-copy.js";
import { reviewedFeeCopy } from "../../data/reviewed-fee-copy.js";
import { localizedHref } from "../../data/locale-routing.js";
import { interfaceCopyByLocale } from "../../content/v3-interface-copy.js";

const localeKey = (locale) => {
  const value = String(locale || "");
  if (value.toLowerCase() === "pt-br") return "pt-BR";
  return value.split("-")[0];
};

const textLocaleKey = (locale) => {
  const value = String(locale || "");
  if (value === "zh-Hant") return "zh-Hant";
  if (value.startsWith("zh")) return "zh-Hans";
  return localeKey(locale);
};

const isTraditionalChinese = (locale) => String(locale || "") === "zh-Hant" || String(locale || "") === "zh-TW";
const zhText = (locale, hans, hant) => (isTraditionalChinese(locale) ? hant : hans);

// An official evidence page is linked but its figures are not reviewed yet: say exactly that instead of "Pending" beside a link.
const localePending = (locale, zh = "待官方来源核验") => String(locale || "").startsWith("zh") ? zhText(locale, zh, "待官方來源核驗") : ({ ja: "公式ソース確認待ち", ko: "공식 출처 확인 대기", tr: "Resmi kaynak doğrulaması bekleniyor", fr: "Vérification de la source en attente", de: "Quellenprüfung ausstehend", ru: "Ожидается проверка источника", ar: "بانتظار التحقق من المصدر", id: "Menunggu verifikasi sumber", vi: "Đang chờ xác minh nguồn", it: "Verifica della fonte in sospeso", es: "Pendiente de verificación de la fuente", "pt-BR": "Aguardando verificação da fonte" }[localeKey(locale)] || "Pending official-source verification");


const interfaceText = (locale) => interfaceCopyByLocale[locale] ?? interfaceCopyByLocale[localeKey(locale)] ?? interfaceCopyByLocale.en;

const detailCtaLabel = (locale, { direct, hasReferral }) => {
  const labels = {
    "zh-Hans": { verify: "先核对地区资格", official: "打开官网", register: "在官网注册" },
    "zh-Hant": { verify: "先核對地區資格", official: "打開官網", register: "在官網註冊" },
    es: { verify: "Verificar elegibilidad regional", official: "Abrir sitio oficial", register: "Registrarse en el sitio oficial" },
    "pt-BR": { verify: "Verificar elegibilidade regional", official: "Abrir site oficial", register: "Cadastrar no site oficial" },
    fr: { verify: "Vérifier l’éligibilité régionale", official: "Ouvrir le site officiel", register: "S’inscrire sur le site officiel" },
    de: { verify: "Regionale Berechtigung prüfen", official: "Offizielle Website öffnen", register: "Auf der offiziellen Website registrieren" },
    ja: { verify: "地域の利用条件を確認", official: "公式サイトを開く", register: "公式サイトで登録" },
    ko: { verify: "지역 이용 가능 여부 확인", official: "공식 사이트 열기", register: "공식 사이트에서 가입" },
    ar: { verify: "تحقق من الأهلية الإقليمية", official: "فتح الموقع الرسمي", register: "التسجيل في الموقع الرسمي" },
    tr: { verify: "Bölgesel uygunluğu doğrula", official: "Resmi siteyi aç", register: "Resmi sitede kaydol" },
    ru: { verify: "Проверить доступность в регионе", official: "Открыть официальный сайт", register: "Зарегистрироваться на официальном сайте" },
    id: { verify: "Verifikasi kelayakan wilayah", official: "Buka situs resmi", register: "Daftar di situs resmi" },
    vi: { verify: "Kiểm tra điều kiện khu vực", official: "Mở trang chính thức", register: "Đăng ký trên trang chính thức" },
    it: { verify: "Verifica l’idoneità regionale", official: "Apri il sito ufficiale", register: "Registrati sul sito ufficiale" },
  };
  const copy = labels[locale] || labels[String(locale).split("-")[0]] || {
    verify: "Verify regional eligibility first",
    official: "Open Official Site",
    register: "Register on Official Site",
  };
  if (!direct) return copy.verify;
  return hasReferral ? copy.register : copy.official;
};

function LocalLink({ locale, href, children, className, ...props }) {
  return <a className={className} href={localizedHref(href, { locale })} {...props}>{children}</a>;
}

// "September 22, 2026" / "Sep 4, 2026" inside a review label -> "2026-09-22" (one date format site-wide).
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const isoDates = (text) => String(text || "").replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? (\d{1,2}), (\d{4})\b/g, (m, mon, d, y) => `${y}-${String(MONTHS.indexOf(mon.toLowerCase()) + 1).padStart(2, "0")}-${d.padStart(2, "0")}`);
const publishableFeeRate = (summary, product, locale = "en") => {
  const rate = summary.rates.find((item) => item.product === product);
  if (!rate) return null;
  const scope = reviewedFeeCopy(rate, locale);
  const pair = `${feePctOfRate(rate.makerRate, locale)} / ${feePctOfRate(rate.takerRate, locale)}`;
  return { ...rate, publishable: true, pair, tier: scope.tier, display: `${pair} (${matrixCopy(locale).maker}) · ${scope.tier} · ${scope.scope}`, conditions: scope.conditions };
};

export { localeKey, textLocaleKey, isTraditionalChinese, zhText, localePending, interfaceText, detailCtaLabel, LocalLink, MONTHS, isoDates, publishableFeeRate };
