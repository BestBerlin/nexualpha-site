import { isPartnerPromotableIn } from './partner-geo-policy.js';
import { APP_DOWNLOAD_SLUGS, appDownloadPath } from "./app-download-path.js";
import { BITGET_ALLIANCE_PATH, BITGET_ALLIANCE_VENUE } from "./bitget-alliance.js";
import { BINANCE_OCTOBER_PATH, BINANCE_OCTOBER_VENUE } from "./binance-october.js";
import { BYBIT_STOCKS_PATH, BYBIT_STOCKS_VENUE } from "./bybit-stocks.js";
import { KRAKEN_USDG_PATH, KRAKEN_USDG_VENUE } from "./kraken-usdg.js";
import { localizedHref } from "./locale-routing.js";
import { licenseRecords } from "./licenses.js";

const LABELS = {
  en: { fees: "Fee tools", app: "App guide", licenses: "License records", campaigns: "Campaign research" },
  "zh-Hans": { fees: "费率工具", app: "App 指南", licenses: "牌照记录", campaigns: "活动研究" },
  "zh-Hant": { fees: "費率工具", app: "App 指南", licenses: "牌照記錄", campaigns: "活動研究" },
  es: { fees: "Herramientas de comisiones", app: "Guía de app", licenses: "Registros de licencia", campaigns: "Investigación de campañas" },
  "pt-BR": { fees: "Ferramentas de taxas", app: "Guia do app", licenses: "Registros de licença", campaigns: "Pesquisa de campanhas" },
  fr: { fees: "Outils de frais", app: "Guide de l'app", licenses: "Registres de licence", campaigns: "Recherche de campagne" },
  de: { fees: "Gebühren-Tools", app: "App-Leitfaden", licenses: "Lizenzdaten", campaigns: "Kampagnenrecherche" },
  ja: { fees: "手数料ツール", app: "アプリガイド", licenses: "ライセンス記録", campaigns: "キャンペーン調査" },
  ko: { fees: "수수료 도구", app: "앱 가이드", licenses: "라이선스 기록", campaigns: "캠페인 리서치" },
  tr: { fees: "Ücret araçları", app: "Uygulama rehberi", licenses: "Lisans kayıtları", campaigns: "Kampanya araştırması" },
  vi: { fees: "Công cụ phí", app: "Hướng dẫn ứng dụng", licenses: "Hồ sơ giấy phép", campaigns: "Nghiên cứu chiến dịch" },
  id: { fees: "Alat biaya", app: "Panduan app", licenses: "Catatan lisensi", campaigns: "Riset kampanye" },
  ru: { fees: "Инструменты комиссий", app: "Гид по приложению", licenses: "Лицензионные записи", campaigns: "Исследование кампаний" },
  ar: { fees: "أدوات الرسوم", app: "دليل التطبيق", licenses: "سجلات الترخيص", campaigns: "بحث الحملات" },
  it: { fees: "Strumenti commissioni", app: "Guida app", licenses: "Registri licenze", campaigns: "Ricerca campagne" },
  ur: { fees: "فیس ٹولز", app: "ایپ گائیڈ", licenses: "لائسنس ریکارڈز", campaigns: "مہم تحقیق" },
  uk: { fees: "Інструменти комісій", app: "Гід застосунку", licenses: "Ліцензійні записи", campaigns: "Дослідження кампаній" },
};

const CAMPAIGN_PATHS = Object.freeze({
  [BINANCE_OCTOBER_VENUE]: BINANCE_OCTOBER_PATH,
  [BYBIT_STOCKS_VENUE]: BYBIT_STOCKS_PATH,
  [BITGET_ALLIANCE_VENUE]: BITGET_ALLIANCE_PATH,
  [KRAKEN_USDG_VENUE]: KRAKEN_USDG_PATH,
});

export function exchangeHubToolLinks(slug, locale = "en") {
  const labels = LABELS[locale] || (String(locale || "").startsWith("zh") ? LABELS["zh-Hans"] : LABELS.en);
  const links = [
    { key: "fees", label: labels.fees, href: localizedHref("/rates", { locale }) },
  ];
  if (APP_DOWNLOAD_SLUGS.includes(slug)) links.push({ key: "app", label: labels.app, href: localizedHref(appDownloadPath(slug), { locale }) });
  if (licenseRecords.some((record) => record.exchange === slug)) links.push({ key: "licenses", label: labels.licenses, href: localizedHref("/licenses", { locale }) });
  if (CAMPAIGN_PATHS[slug] && isPartnerPromotableIn(slug, { locale })) links.push({ key: "campaigns", label: labels.campaigns, href: localizedHref(CAMPAIGN_PATHS[slug], { locale }) });
  return links;
}
