import { NEUTRAL_CTA_LOCALES } from "../../../data/locale-policy.js";
const NEUTRAL_LOCALES = NEUTRAL_CTA_LOCALES;

const withShare = (base, share, rebate, end = ".") => (share == null ? `${base}${end}` : `${base}${rebate(share)}`);

const COPY = {
  en: {
    month: "This month's campaigns",
    season: "Start-of-month campaigns",
    synced: "Synced from official announcements every 5 minutes.",
    official: "Open official campaign page",
    body: (name, code, share) => withShare(
      `To join, you need a ${name} account. New here? Register through the official link below (code ${code} included) and you can enter the campaign`,
      share,
      (value) => ` — plus up to ${value}% of your trading fees back.`,
    ),
    button: (name) => `Register on ${name} & join →`,
  },
  "zh-Hans": {
    month: "本月活动",
    season: "月初活动季",
    synced: "每 5 分钟同步官方公告。",
    official: "打开官方活动页面",
    body: (name, code, share) => withShare(
      `参加条件：需要先有 ${name} 账户。还没注册？通过下方官方链接注册，注册后即可报名活动`,
      share,
      (value) => `，手续费另享最高 ${value}% 返还。`,
      "。",
    ),
    button: (name) => `注册 ${name}，参加活动 →`,
  },
  "zh-Hant": {
    month: "本月活動",
    season: "月初活動季",
    synced: "每 5 分鐘同步官方公告。",
    official: "開啟官方活動頁面",
    body: (name) => `參加條件：需要先有 ${name} 帳戶。可透過下方官方入口建立帳戶，註冊後再到官方活動頁面確認能否報名。`,
    button: (name) => `前往 ${name} 官方帳戶入口 →`,
  },
  ja: {
    month: "今月のキャンペーン",
    season: "月初キャンペーン期間",
    synced: "公式告知から5分ごとに同期。",
    official: "公式キャンペーンページを開く",
    body: (name, code, share) => withShare(`${name} のアカウントが必要です。未登録の場合は、下の公式リンクから登録してください（コード ${code} 入り）。登録後にキャンペーンへ参加できます`, share, (value) => `。さらに取引手数料の最大 ${value}% が戻る場合があります。`),
    button: (name) => `${name} に登録して参加 →`,
  },
  ko: {
    month: "이번 달 캠페인",
    season: "월초 캠페인 시즌",
    synced: "공식 공지에서 5분마다 동기화됩니다.",
    official: "공식 캠페인 페이지 열기",
    body: (name, code, share) => withShare(`${name} 계정이 있어야 참여할 수 있습니다. 처음이라면 아래 공식 링크로 가입하세요(코드 ${code} 포함). 가입 후 캠페인에 참여할 수 있습니다`, share, (value) => `. 거래 수수료도 최대 ${value}%까지 돌려받을 수 있습니다.`),
    button: (name) => `${name} 가입 후 참여 →`,
  },
  tr: {
    month: "Bu ayın kampanyaları",
    season: "Ay başı kampanyaları",
    synced: "Resmî duyurulardan her 5 dakikada bir eşitlenir.",
    official: "Resmî kampanya sayfasını aç",
    body: (name, code, share) => withShare(`Katılmak için bir ${name} hesabınız gerekir. Yeniyseniz aşağıdaki resmî bağlantıdan kaydolun (kod ${code} dahil); ardından kampanyaya girebilirsiniz`, share, (value) => ` ve işlem ücretlerinizin en fazla %${value} kadarı geri dönebilir.`),
    button: (name) => `${name} üzerinde kaydol ve katıl →`,
  },
  es: {
    month: "Campañas de este mes",
    season: "Campañas de inicio de mes",
    synced: "Sincronizado desde anuncios oficiales cada 5 minutos.",
    official: "Abrir página oficial de la campaña",
    body: (name, code, share) => withShare(`Para participar necesitas una cuenta de ${name}. Si eres nuevo, regístrate con el enlace oficial de abajo (código ${code} incluido) y podrás entrar en la campaña`, share, (value) => `, además de recuperar hasta el ${value}% de tus comisiones de trading.`),
    button: (name) => `Regístrate en ${name} y participa →`,
  },
  "pt-BR": {
    month: "Campanhas deste mês",
    season: "Campanhas de início de mês",
    synced: "Sincronizado dos anúncios oficiais a cada 5 minutos.",
    official: "Abrir página oficial da campanha",
    body: (name, code, share) => withShare(`Para participar, você precisa de uma conta na ${name}. Novo por aqui? Cadastre-se pelo link oficial abaixo (código ${code} incluído) e depois entre na campanha`, share, (value) => `, além de receber de volta até ${value}% das suas taxas de trading.`),
    button: (name) => `Cadastrar na ${name} e participar →`,
  },
  fr: {
    month: "Campagnes du mois",
    season: "Campagnes de début de mois",
    synced: "Synchronisé depuis les annonces officielles toutes les 5 minutes.",
    official: "Ouvrir la page officielle de la campagne",
    body: (name, code, share) => withShare(`Pour participer, vous devez avoir un compte ${name}. Nouveau ? Inscrivez-vous via le lien officiel ci-dessous (code ${code} inclus), puis vous pourrez rejoindre la campagne`, share, (value) => `, avec jusqu’à ${value}% de vos frais de trading reversés.`),
    button: (name) => `S’inscrire sur ${name} et participer →`,
  },
  de: {
    month: "Kampagnen dieses Monats",
    season: "Kampagnen zum Monatsanfang",
    synced: "Alle 5 Minuten aus offiziellen Ankündigungen synchronisiert.",
    official: "Offizielle Kampagnenseite öffnen",
    body: (name, code, share) => withShare(`Zur Teilnahme benötigen Sie ein ${name}-Konto. Neu hier? Registrieren Sie sich über den offiziellen Link unten (Code ${code} enthalten), danach können Sie an der Kampagne teilnehmen`, share, (value) => ` und bis zu ${value}% Ihrer Trading-Gebühren zurückerhalten.`),
    button: (name) => `Bei ${name} registrieren und teilnehmen →`,
  },
  ru: {
    month: "Кампании этого месяца",
    season: "Кампании начала месяца",
    synced: "Синхронизировано с официальными объявлениями каждые 5 минут.",
    official: "Открыть официальную страницу кампании",
    body: (name) => `Для участия нужен аккаунт ${name}. Откройте официальный путь ниже, затем проверьте условия участия на странице кампании.`,
    button: (name) => `Открыть путь к аккаунту ${name} →`,
  },
  ar: {
    month: "حملات هذا الشهر",
    season: "حملات بداية الشهر",
    synced: "تتم المزامنة من الإعلانات الرسمية كل 5 دقائق.",
    official: "فتح صفحة الحملة الرسمية",
    body: (name) => `للمشاركة تحتاج إلى حساب في ${name}. افتح المسار الرسمي أدناه، ثم راجع أهلية المشاركة في صفحة الحملة الرسمية.`,
    button: (name) => `فتح مسار حساب ${name} →`,
  },
  id: {
    month: "Kampanye bulan ini",
    season: "Kampanye awal bulan",
    synced: "Disinkronkan dari pengumuman resmi setiap 5 menit.",
    official: "Buka halaman kampanye resmi",
    body: (name, code, share) => withShare(`Untuk ikut, Anda perlu akun ${name}. Baru di sini? Daftar melalui tautan resmi di bawah (kode ${code} sudah disertakan), lalu Anda bisa mengikuti kampanye`, share, (value) => `, plus hingga ${value}% biaya trading kembali.`),
    button: (name) => `Daftar di ${name} dan ikut →`,
  },
  vi: {
    month: "Chiến dịch tháng này",
    season: "Chiến dịch đầu tháng",
    synced: "Đồng bộ từ thông báo chính thức mỗi 5 phút.",
    official: "Mở trang chiến dịch chính thức",
    // Neutral locale (Vietnam Resolution 05/2025/NQ-CP): no sign-up wording, no code.
    body: (name) => `Để tham gia cần có tài khoản ${name}. Hãy xem điều kiện tham gia trên trang chiến dịch chính thức.`,
    button: (name) => `Mở trang chính thức của ${name} →`,
  },
  it: {
    month: "Campagne di questo mese",
    season: "Campagne di inizio mese",
    synced: "Sincronizzato dagli annunci ufficiali ogni 5 minuti.",
    official: "Apri la pagina ufficiale della campagna",
    body: (name, code, share) => withShare(`Per partecipare ti serve un account ${name}. Sei nuovo? Registrati dal link ufficiale qui sotto (codice ${code} incluso) e potrai entrare nella campagna`, share, (value) => `, oltre a ricevere indietro fino al ${value}% delle commissioni di trading.`),
    button: (name) => `Registrati su ${name} e partecipa →`,
  },
  ur: {
    month: "اس ماہ کی مہمات",
    season: "ماہ کے آغاز کی مہمات",
    synced: "سرکاری اعلانات سے ہر 5 منٹ بعد ہم آہنگ کیا جاتا ہے۔",
    official: "سرکاری مہم کا صفحہ کھولیں",
    body: (name) => `شامل ہونے کے لیے ${name} اکاؤنٹ درکار ہے۔ نیچے سرکاری راستہ کھولیں، پھر مہم کے سرکاری صفحے پر اہلیت دیکھیں۔`,
    button: (name) => `${name} اکاؤنٹ کا راستہ کھولیں →`,
  },
  uk: {
    month: "Кампанії цього місяця",
    season: "Кампанії початку місяця",
    synced: "Синхронізовано з офіційних оголошень кожні 5 хвилин.",
    official: "Відкрити офіційну сторінку кампанії",
    body: (name) => `Для участі потрібен акаунт ${name}. Відкрийте офіційний шлях нижче, а потім перевірте право на участь на сторінці кампанії.`,
    button: (name) => `Відкрити шлях до акаунта ${name} →`,
  },
};

export const campaignJoinCopyByLocale = Object.freeze(COPY);

export function campaignJoinCopy(locale = "en") {
  const raw = String(locale || "en");
  const key = raw === "zh" || raw === "zh-CN" ? "zh-Hans" : raw === "zh-TW" || raw === "zh-HK" ? "zh-Hant" : raw;
  return COPY[key] || COPY[key.split("-")[0]] || (NEUTRAL_LOCALES.has(raw) ? COPY[raw] : COPY.en);
}
