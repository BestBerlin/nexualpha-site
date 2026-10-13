// Official Android APK downloads (lead-verified 2026-10-13). We never host an APK: /go/<venue>-apk counts the click and
// redirects to the exchange's own URL; a cached probe (server/exchange-apk-probe.mjs) checks that every hop stays on the
// exchange's own host and ends in an Android APK, otherwise visitors go to the exchange's official download page.
// - OKX: www.okx.com affiliate download URL for channel NEXU888 302s to a channel APK on static.okx.com; the APK's
//   signing block carries the invite binding, so the sign-up is bound automatically. The visible code stays as today.
// - Binance: the channel APK on download.binance.com (channel of our referral account) does not embed the invite code,
//   so the button sits next to the code and the line telling visitors to enter it when they sign up.
export const APK_CONTENT_TYPE = "application/vnd.android.package-archive";

const httpsUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.port && !url.username && !url.password ? url : null;
  } catch { return null; }
};
const okxHost = (host) => host === "okx.com" || host.endsWith(".okx.com");

export const EXCHANGE_APKS = Object.freeze({
  okx: Object.freeze({
    venue: "okx", goSlug: "okx-apk", sizeMb: 568, codeBuiltIn: true,
    officialUrl: "https://www.okx.com/affiliatedownload/apk?channelId=NEXU888",
    fallbackUrl: "https://www.okx.com/download",
    hostAllowed: okxHost,
  }),
  binance: Object.freeze({
    venue: "binance", goSlug: "binance-apk", sizeMb: 322, codeBuiltIn: false,
    officialUrl: "https://download.binance.com/pack/BNApp_F0000928.apk",
    fallbackUrl: "https://www.binance.com/download",
    hostAllowed: (host) => host === "download.binance.com",
  }),
});
export const EXCHANGE_APK_BY_GO_SLUG = Object.freeze(Object.fromEntries(Object.values(EXCHANGE_APKS).map((apk) => [apk.goSlug, apk])));

/** True only for an https URL (no credentials, no port) on the venue's own APK host. */
export function apkHostAllowed(venue, value) {
  const apk = EXCHANGE_APKS[venue];
  const url = httpsUrl(value);
  return Boolean(apk && url && apk.hostAllowed(url.hostname.toLowerCase()));
}
export const isApkContentType = (value) => String(value || "").split(";")[0].trim().toLowerCase() === APK_CONTENT_TYPE;

export const exchangeApkHref = (venue, src) => `/go/${EXCHANGE_APKS[venue].goSlug}?src=${encodeURIComponent(src)}`;

// Native copy for every locale that may show a sign-up block (neutral ru/ar/zh-Hant/ur/uk never do).
const COPY = Object.freeze({
  en: { okx: "Download Android APK (invite code built in)", binance: "Download Android APK", size: "about {mb} MB", enterCode: "Enter code {code} when you sign up", copy: "Copy", copied: "Copied" },
  "zh-Hans": { okx: "Android 直接下载（已绑定邀请码）", binance: "Android 直接下载", size: "约 {mb} MB", enterCode: "注册时填写邀请码 {code}", copy: "复制", copied: "已复制" },
  es: { okx: "Descargar APK para Android (código de invitación incluido)", binance: "Descargar APK para Android", size: "unos {mb} MB", enterCode: "Introduce el código {code} al registrarte", copy: "Copiar", copied: "Copiado" },
  "pt-BR": { okx: "Baixar APK para Android (código de convite já incluído)", binance: "Baixar APK para Android", size: "cerca de {mb} MB", enterCode: "Informe o código {code} ao se cadastrar", copy: "Copiar", copied: "Copiado" },
  fr: { okx: "Télécharger l’APK Android (code d’invitation intégré)", binance: "Télécharger l’APK Android", size: "environ {mb} Mo", enterCode: "Saisissez le code {code} lors de l’inscription", copy: "Copier", copied: "Copié" },
  de: { okx: "Android-APK herunterladen (Einladungscode bereits enthalten)", binance: "Android-APK herunterladen", size: "ca. {mb} MB", enterCode: "Gib bei der Registrierung den Code {code} ein", copy: "Kopieren", copied: "Kopiert" },
  ja: { okx: "Android APK を直接ダウンロード（招待コード適用済み）", binance: "Android APK を直接ダウンロード", size: "約 {mb} MB", enterCode: "登録時に招待コード {code} を入力してください", copy: "コピー", copied: "コピーしました" },
  ko: { okx: "Android APK 바로 다운로드 (초대 코드 적용됨)", binance: "Android APK 바로 다운로드", size: "약 {mb}MB", enterCode: "가입할 때 코드 {code}를 입력하세요", copy: "복사", copied: "복사됨" },
  tr: { okx: "Android APK indir (davet kodu dahil)", binance: "Android APK indir", size: "yaklaşık {mb} MB", enterCode: "Kaydolurken {code} kodunu girin", copy: "Kopyala", copied: "Kopyalandı" },
  id: { okx: "Unduh APK Android (kode undangan sudah terpasang)", binance: "Unduh APK Android", size: "sekitar {mb} MB", enterCode: "Masukkan kode {code} saat mendaftar", copy: "Salin", copied: "Disalin" },
  vi: { okx: "Tải APK Android (đã gắn sẵn mã mời)", binance: "Tải APK Android", size: "khoảng {mb} MB", enterCode: "Nhập mã {code} khi đăng ký", copy: "Sao chép", copied: "Đã sao chép" },
  it: { okx: "Scarica l’APK Android (codice invito già incluso)", binance: "Scarica l’APK Android", size: "circa {mb} MB", enterCode: "Inserisci il codice {code} quando ti registri", copy: "Copia", copied: "Copiato" },
});
export const EXCHANGE_APK_COPY_LOCALES = Object.freeze(Object.keys(COPY));
const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));

/** Button copy for a venue in a locale: { label, size, enterCode } (enterCode only when the APK does not embed the code). */
export function exchangeApkCopy(venue, locale, code) {
  const apk = EXCHANGE_APKS[venue];
  if (!apk) return null;
  const t = COPY[locale] || COPY.en;
  return { label: t[venue], size: fill(t.size, { mb: apk.sizeMb }), enterCode: apk.codeBuiltIn ? null : fill(t.enterCode, { code }) };
}
export const codeCopyLabels = (locale) => { const t = COPY[locale] || COPY.en; return { copy: t.copy, copied: t.copied }; };
