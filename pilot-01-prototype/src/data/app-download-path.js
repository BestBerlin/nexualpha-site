// Keep route recognition small: the page and localized copy load only on demand.
export const APP_DOWNLOAD_SLUGS = Object.freeze(["okx", "bitget", "binance", "bybit", "coinw"]);
export const appDownloadPath = (slug) => `/exchanges/${slug}/app`;
export function parseAppDownloadPath(pathname) {
  const match = String(pathname || "").match(/^\/exchanges\/([a-z0-9-]+)\/app$/);
  return match ? { slug: match[1], valid: APP_DOWNLOAD_SLUGS.includes(match[1]) } : null;
}

const APP_DOWNLOAD_LABELS = { en: "App download", "zh-Hans": "App 下载", "zh-Hant": "App 下載", es: "Descargar la app", "pt-BR": "Baixar o app", fr: "Télécharger l’application", de: "App herunterladen", ja: "アプリをダウンロード", ko: "앱 다운로드", ar: "تنزيل التطبيق", tr: "Uygulamayı indir", ru: "Скачать приложение", id: "Unduh aplikasi", vi: "Tải ứng dụng", it: "Scarica l’app", ur: "ایپ ڈاؤن لوڈ", uk: "Завантажити застосунок" };
export const appDownloadLabel = (locale) => APP_DOWNLOAD_LABELS[locale] || APP_DOWNLOAD_LABELS.en;
