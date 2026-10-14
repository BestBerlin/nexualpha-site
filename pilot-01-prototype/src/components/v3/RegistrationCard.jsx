import { registrationEntryContext } from "./registration-entry-context.js";
import { BackupSignupLink } from "../shared/BackupSignupLink.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPartner } from "../../data/partner-registry";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { regionalVenueCta } from "../../data/source-bound-cta.js";
import { directoryContext, directoryContextSearch } from "../../data/directory-context.js";
import { localizedHref } from "../../data/locale-routing.js";
import { buildTelegramWebsiteFunnelContext } from "../../data/telegram-config.js";
import { v3Copy } from "../../data/v3-product.js";
import { appendDecisionPassportQuery, readDecisionPassport } from "../../data/decision-passport.js";
import { regionalShortlistAccountStageOptions, regionalShortlistCopy } from "../../data/regional-shortlist.js";
import { bleedCopyFeedback } from "../../data/trading-bleed-feedback.js";
import { buildRegistrationDecisionState } from "./registration-decision-state.js";
import { trackCodeCopy } from "../../data/cta-ui-copy.js";
import { ownerRebateLine, partnerBenefitParts } from "../../data/owner-rebate-line.js";
import "./registration-card.css";

const passportLabels = Object.freeze({
  en: { title: "Your decision passport", market: "Market", product: "Product", accountStage: "Account stage", funding: "Funding route", edit: "Edit conditions" },
  "zh-Hans": { title: "本次决策条件", market: "地区", product: "产品", accountStage: "账户阶段", funding: "入金路径", edit: "修改条件" },
  "zh-Hant": { title: "本次決策條件", market: "地區", product: "產品", accountStage: "帳戶階段", funding: "入金路徑", edit: "修改條件" },
  ja: { title: "今回の判断条件", market: "地域", product: "商品", accountStage: "口座段階", funding: "入金経路", edit: "条件を変更" },
  ko: { title: "현재 선택 조건", market: "지역", product: "상품", accountStage: "계정 단계", funding: "입금 경로", edit: "조건 수정" },
  tr: { title: "Karar koşullarınız", market: "Pazar", product: "Ürün", accountStage: "Hesap aşaması", funding: "Fonlama yolu", edit: "Koşulları değiştir" },
  es: { title: "Tus condiciones de decisión", market: "Mercado", product: "Producto", accountStage: "Etapa de cuenta", funding: "Ruta de fondos", edit: "Cambiar condiciones" },
  "pt-BR": { title: "Suas condições de decisão", market: "Mercado", product: "Produto", accountStage: "Etapa da conta", funding: "Rota de depósito", edit: "Alterar condições" },
  vi: { title: "Điều kiện quyết định", market: "Thị trường", product: "Sản phẩm", accountStage: "Giai đoạn tài khoản", funding: "Đường nạp tiền", edit: "Đổi điều kiện" },
  // l10n: needs native review
  ur: { title: "آپ کے فیصلے کی شرائط", market: "مارکیٹ", product: "پروڈکٹ", accountStage: "اکاؤنٹ مرحلہ", funding: "فنڈنگ راستہ", edit: "شرائط بدلیں" },
  // l10n: needs native review
  uk: { title: "Умови вашого рішення", market: "Ринок", product: "Продукт", accountStage: "Етап акаунта", funding: "Маршрут поповнення", edit: "Змінити умови" },
});

function passportCopy(locale) {
  const base = String(locale || "en").split("-")[0];
  return passportLabels[locale] || passportLabels[base] || passportLabels.en;
}

function marketResearchPath(market) {
  const paths = { BR: "/br", MX: "/mx", TW: "/tw", HK: "/hk", ID: "/id", VN: "/vn", EU: "/eu", UK: "/uk", JP: "/jp", KR: "/kr", SG: "/sg", TR: "/tr/markets/turkiye" };
  return paths[market] || "/exchanges";
}

function registrationCardGoHref(slug, { locale, market, product, accountStage, funding, placement = "registration-card-primary" } = {}) {
  const query = new URLSearchParams();
  query.set("src", placement);
  if (locale) query.set("locale", locale);
  if (market) query.set("market", market);
  if (product) query.set("product", product);
  if (accountStage) query.set("accountStage", accountStage);
  if (funding) query.set("funding", funding);
  const search = query.toString();
  return `/go/${encodeURIComponent(slug)}${search ? `?${search}` : ""}`;
}

const copyDict = {
  "zh-Hans": {
    officialDomain: "官方主域名",
    antiPhishingTip: "在注册或交易前，请仔细核对浏览器地址栏主域名与上方完全一致，防范仿冒钓鱼网站。",
    referralCode: "专属邀请码",
    copyCode: "复制邀请码",
    copied: "已复制 ✓",
    openSignup: "前往官方注册开户 ↗",
    openApp: "访问官方链上应用 ↗",
    fullUrl: "完整官方链接",
    noCodeNeeded: "链上钱包直连 · 无需邀请码",
    routeState: "合作入口",
    routeReady: "合作入口可用",
    routePending: "需核验",
    benefitState: "用户优惠",
    benefitVerified: "来源已记录",
    benefitPending: "以官方开户注册页显示为准",
    regionState: "地区资格",
    regionReady: "在官方账户流程核对资格",
    regionVerify: "需在官方流程确认",
    regionBlocked: "当前地区不建议直达注册",
    unavailable: "该平台当前暂无可核验的官方合作链接，请先核对上方官方主域名。",
    officialRouteState: "官方入口",
    openOfficial: "打开官方入口 ↗",
    continueCompare: "继续比较平台",
    telegramResearch: "打开 Telegram 研究助手 ↗",
    preflightTitle: "注册前核对",
    routeDetailsTitle: "路径、邀请码与资格详情",
    preflightWithCode: "将打开第三方开户注册页；请确认页面邀请码为 {code}，若未自动带入，请在提交前手动填写。",
    preflightNoCode: "将打开第三方开户注册页；请在提交前确认官方页面显示的地区、KYC 与产品条件。",
    preflightOfficial: "将打开第三方官方入口；该平台当前没有专属邀请码路径。",
    preflightBlocked: "当前不建议直达注册，请先完成地区资格和官方条款核对。",
  },
  "zh-Hant": {
    officialDomain: "官方主網域",
    antiPhishingTip: "在註冊或交易前，請仔細核對瀏覽器網址列主網域與上方完全一致，防範仿冒釣魚網站。",
    referralCode: "專屬邀請碼",
    copyCode: "複製邀請碼",
    copied: "已複製 ✓",
    openSignup: "前往官方註冊開戶 ↗",
    openApp: "訪問官方鏈上應用 ↗",
    fullUrl: "完整官方連結",
    noCodeNeeded: "鏈上錢包直連 · 無需邀請碼",
    routeState: "合作入口",
    routeReady: "合作入口可用",
    routePending: "需核验",
    benefitState: "用戶優惠",
    benefitVerified: "來源已記錄",
    benefitPending: "以官方開戶註冊頁顯示為準",
    regionState: "地區資格",
    regionReady: "在官方帳戶流程核對資格",
    regionVerify: "需在官方流程確認",
    regionBlocked: "目前地區不建議直達註冊",
    unavailable: "該平台目前暫無可核驗的官方合作連結，請先核對上方官方主網域。",
    officialRouteState: "官方入口",
    openOfficial: "打開官方入口 ↗",
    continueCompare: "繼續比較平台",
    telegramResearch: "打開 Telegram 研究助手 ↗",
    preflightTitle: "註冊前核對",
    routeDetailsTitle: "路徑、邀請碼與資格詳情",
    preflightWithCode: "將打開第三方開戶註冊頁；請確認頁面邀請碼為 {code}，若未自動帶入，請在提交前手動填寫。",
    preflightNoCode: "將打開第三方開戶註冊頁；請在提交前確認官方頁面顯示的地區、KYC 與產品條件。",
    preflightOfficial: "將打開第三方官方入口；該平台目前沒有專屬邀請碼路徑。",
    preflightBlocked: "目前不建議直達註冊，請先完成地區資格和官方條款核對。",
  },
  en: {
    officialDomain: "Official domain",
    antiPhishingTip: "Verify that your browser address bar exactly matches the official domain above before entering any credentials.",
    referralCode: "Referral code",
    copyCode: "Copy Code",
    copied: "Copied ✓",
    openSignup: "Go to Official Registration ↗",
    openApp: "Open Official App ↗",
    fullUrl: "Full Official Link",
    noCodeNeeded: "Direct On-chain Connect · No Code Needed",
    routeState: "Partner Route",
    routeReady: "Partner route active",
    routePending: "Needs review",
    benefitState: "User Benefit",
    benefitVerified: "Source recorded",
    benefitPending: "Confirm on the official sign-up page",
    regionState: "Regional Eligibility",
    regionReady: "Check eligibility in the official account flow",
    regionVerify: "Confirm in official flow",
    regionBlocked: "Direct signup is not recommended for this region",
    unavailable: "No recorded partner route is available for this venue yet. Check the official domain above first.",
    officialRouteState: "Official route",
    openOfficial: "Open official route ↗",
    continueCompare: "Continue comparison",
    telegramResearch: "Ask Telegram research bot ↗",
    preflightTitle: "Check before leaving",
    routeDetailsTitle: "Route, code and eligibility details",
    preflightWithCode: "You will leave to a third-party sign-up page. Confirm the referral code is {code}; if it is not prefilled, enter it before submitting.",
    preflightNoCode: "You will leave to a third-party sign-up page. Confirm region, KYC and product terms on the official page before submitting.",
    preflightOfficial: "You will leave to the third-party official route. No referral-code path is recorded for this venue.",
    preflightBlocked: "Direct signup is not recommended yet. Check regional eligibility and official terms first.",
  },
  // l10n: needs native review
  ur: {
    officialDomain: "سرکاری ڈومین", antiPhishingTip: "کوئی بھی معلومات درج کرنے سے پہلے براؤزر کے ایڈریس بار میں ڈومین کو اوپر درج سرکاری ڈومین سے حرف بہ حرف ملائیں۔", referralCode: "ریفرل کوڈ", copyCode: "کوڈ کاپی کریں", copied: "کاپی ہو گیا ✓", openSignup: "سرکاری رجسٹریشن پر جائیں ↗", openApp: "سرکاری ایپ کھولیں ↗", fullUrl: "مکمل سرکاری لنک", noCodeNeeded: "براہ راست آن چین کنکشن · کوڈ درکار نہیں", routeState: "پارٹنر راستہ", routeReady: "پارٹنر راستہ فعال", routePending: "جائزہ درکار", benefitState: "صارف کا فائدہ", benefitVerified: "ماخذ درج ہے", benefitPending: "سرکاری رجسٹریشن صفحے پر تصدیق کریں", regionState: "علاقائی اہلیت", regionReady: "سرکاری اکاؤنٹ کے عمل میں اہلیت چیک کریں", regionVerify: "سرکاری عمل میں تصدیق کریں", regionBlocked: "اس علاقے کے لیے براہ راست رجسٹریشن کی سفارش نہیں",    unavailable: "اس مقام کے لیے ابھی کوئی درج شدہ پارٹنر راستہ موجود نہیں۔ پہلے اوپر سرکاری ڈومین چیک کریں۔", officialRouteState: "سرکاری راستہ", openOfficial: "سرکاری راستہ کھولیں ↗", continueCompare: "موازنہ جاری رکھیں", telegramResearch: "Telegram ریسرچ بوٹ کھولیں ↗", preflightTitle: "آگے بڑھنے سے پہلے", routeDetailsTitle: "راستہ، کوڈ اور اہلیت کی تفصیل", preflightWithCode: "یہ تیسرے فریق کا رجسٹریشن صفحہ کھولتا ہے۔ جمع کرانے سے پہلے تصدیق کریں کہ ریفرل کوڈ {code} ہے؛ اگر پہلے سے درج نہیں تو اسے دستی طور پر درج کریں۔", preflightNoCode: "یہ تیسرے فریق کا رجسٹریشن صفحہ کھولتا ہے۔ جمع کرانے سے پہلے سرکاری صفحے پر علاقہ، KYC اور پروڈکٹ شرائط چیک کریں۔", preflightOfficial: "یہ تیسرے فریق کا سرکاری راستہ کھولتا ہے۔ اس مقام کے لیے ریفرل کوڈ والا راستہ درج نہیں۔", preflightBlocked: "براہ راست رجسٹریشن ابھی تجویز نہیں۔ پہلے علاقائی اہلیت اور سرکاری شرائط چیک کریں۔"
  },
  // l10n: needs native review
  uk: {
    officialDomain: "Офіційний домен", antiPhishingTip: "Перед введенням будь-яких даних переконайтеся, що домен в адресному рядку браузера точно збігається з офіційним доменом вище.", referralCode: "Реферальний код", copyCode: "Скопіювати код", copied: "Скопійовано ✓", openSignup: "Перейти до офіційної реєстрації ↗", openApp: "Відкрити офіційний застосунок ↗", fullUrl: "Повне офіційне посилання", noCodeNeeded: "Пряме ончейн-підключення · код не потрібен", routeState: "Партнерський маршрут", routeReady: "Партнерський маршрут активний", routePending: "Потрібна перевірка", benefitState: "Умова для користувача", benefitVerified: "Джерело записано", benefitPending: "Підтвердьте на офіційній сторінці реєстрації", regionState: "Регіональна доступність", regionReady: "Перевірте доступність в офіційному процесі акаунта", regionVerify: "Підтвердьте в офіційному процесі", regionBlocked: "Пряма реєстрація для цього регіону не рекомендована",    unavailable: "Для цього майданчика ще немає записаного партнерського маршруту. Спершу перевірте офіційний домен вище.", officialRouteState: "Офіційний маршрут", openOfficial: "Відкрити офіційний маршрут ↗", continueCompare: "Продовжити порівняння", telegramResearch: "Відкрити дослідницького Telegram-бота ↗", preflightTitle: "Перед продовженням", routeDetailsTitle: "Маршрут, код і умови доступності", preflightWithCode: "Відкриється сторінка реєстрації третьої сторони. Перед надсиланням переконайтеся, що реферальний код — {code}; якщо його не підставлено, введіть вручну.", preflightNoCode: "Відкриється сторінка реєстрації третьої сторони. Перед надсиланням перевірте регіон, KYC та умови продукту на офіційній сторінці.", preflightOfficial: "Відкриється офіційний маршрут третьої сторони. Для цього майданчика немає маршруту з реферальним кодом.", preflightBlocked: "Пряма реєстрація поки не рекомендована. Спершу перевірте регіональну доступність і офіційні умови."
  },
};

copyDict.ja = {
  ...copyDict.en,
  officialDomain: "公式ドメイン", antiPhishingTip: "認証情報を入力する前に、ブラウザのドメインが上記の公式ドメインと完全に一致することを確認してください。", referralCode: "紹介コード", copyCode: "コードをコピー", copied: "コピーしました ✓", openSignup: "公式登録ページへ ↗", openApp: "公式アプリを開く ↗", fullUrl: "公式リンク全体", noCodeNeeded: "オンチェーンウォレット接続 · コード不要", routeState: "パートナー導線", routeReady: "パートナー導線有効", routePending: "要確認", benefitState: "ユーザー向け条件", benefitVerified: "確認済み", benefitPending: "公式登録ページで確認してください", regionState: "地域適用", regionReady: "公式アカウント手続きで適用条件を確認", regionVerify: "公式フローで確認してください", regionBlocked: "この地域では直接登録を推奨しません",    unavailable: "このサービスには確認済みのパートナー導線がありません。まず上記の公式ドメインを確認してください。"
};
copyDict.ko = {
  ...copyDict.en,
  officialDomain: "공식 도메인", antiPhishingTip: "자격 증명을 입력하기 전에 브라우저의 도메인이 위 공식 도메인과 정확히 일치하는지 확인하세요.", referralCode: "추천 코드", copyCode: "코드 복사", copied: "복사됨 ✓", openSignup: "공식 가입 페이지로 이동 ↗", openApp: "공식 앱 열기 ↗", fullUrl: "공식 링크 전체", noCodeNeeded: "온체인 지갑 연결 · 코드 불필요", routeState: "파트너 경로", routeReady: "파트너 경로 활성", routePending: "검토 필요", benefitState: "사용자 혜택", benefitVerified: "확인됨", benefitPending: "공식 가입 페이지에서 확인", regionState: "지역 이용 자격", regionReady: "공식 계정 절차에서 자격을 확인하세요", regionVerify: "공식 절차에서 확인", regionBlocked: "이 지역에서는 직접 가입을 권장하지 않습니다",    unavailable: "아직 확인된 파트너 경로가 없습니다. 먼저 위 공식 도메인을 확인하세요."
};
copyDict.es = { ...copyDict.en, officialDomain: "Dominio oficial", referralCode: "Código de referido", copyCode: "Copiar código", copied: "Copiado ✓", openSignup: "Ir al registro oficial ↗", openApp: "Abrir aplicación oficial ↗", fullUrl: "Enlace oficial completo", noCodeNeeded: "Conexión on-chain directa · Sin código" };
copyDict["pt-BR"] = { ...copyDict.en, officialDomain: "Domínio oficial", referralCode: "Código de indicação", copyCode: "Copiar código", copied: "Copiado ✓", openSignup: "Ir para o cadastro oficial ↗", openApp: "Abrir aplicativo oficial ↗", fullUrl: "Link oficial completo", noCodeNeeded: "Conexão on-chain direta · Sem código" };
copyDict.fr = { ...copyDict.en, officialDomain: "Domaine officiel", referralCode: "Code de parrainage", copyCode: "Copier le code", copied: "Copié ✓", openSignup: "Ouvrir l’inscription officielle ↗", openApp: "Ouvrir l’application officielle ↗", fullUrl: "Lien officiel complet", noCodeNeeded: "Connexion on-chain directe · Sans code" };
copyDict.de = { ...copyDict.en, officialDomain: "Offizielle Domain", referralCode: "Empfehlungscode", copyCode: "Code kopieren", copied: "Kopiert ✓", openSignup: "Offizielle Registrierung öffnen ↗", openApp: "Offizielle App öffnen ↗", fullUrl: "Vollständiger offizieller Link", noCodeNeeded: "Direkte On-Chain-Verbindung · Kein Code" };
copyDict.ar = { ...copyDict.en, officialDomain: "النطاق الرسمي", referralCode: "رمز الإحالة", copyCode: "نسخ الرمز", copied: "تم النسخ ✓", openSignup: "فتح التسجيل الرسمي ↗", openApp: "فتح التطبيق الرسمي ↗", fullUrl: "الرابط الرسمي الكامل", noCodeNeeded: "اتصال مباشر بالسلسلة · بلا رمز" };
copyDict.ru = { ...copyDict.en, officialDomain: "Официальный домен", referralCode: "Реферальный код", copyCode: "Скопировать код", copied: "Скопировано ✓", openSignup: "Открыть официальную регистрацию ↗", openApp: "Открыть официальное приложение ↗", fullUrl: "Полная официальная ссылка", noCodeNeeded: "Прямое подключение ончейн · без кода" };
copyDict.id = { ...copyDict.en, officialDomain: "Domain resmi", referralCode: "Kode referal", copyCode: "Salin kode", copied: "Tersalin ✓", openSignup: "Buka pendaftaran resmi ↗", openApp: "Buka aplikasi resmi ↗", fullUrl: "Tautan resmi lengkap", noCodeNeeded: "Koneksi on-chain langsung · Tanpa kode" };
copyDict.vi = { ...copyDict.en, officialDomain: "Tên miền chính thức", referralCode: "Mã giới thiệu", copyCode: "Sao chép mã", copied: "Đã sao chép ✓", openSignup: "Mở đăng ký chính thức ↗", openApp: "Mở ứng dụng chính thức ↗", fullUrl: "Liên kết chính thức đầy đủ", noCodeNeeded: "Kết nối on-chain trực tiếp · Không cần mã" };
copyDict.it = { ...copyDict.en, officialDomain: "Dominio ufficiale", referralCode: "Codice referral", copyCode: "Copia codice", copied: "Copiato ✓", openSignup: "Apri la registrazione ufficiale ↗", openApp: "Apri l’app ufficiale ↗", fullUrl: "Link ufficiale completo", noCodeNeeded: "Connessione on-chain diretta · Nessun codice" };
copyDict.tr = {
  ...copyDict.en,
  officialDomain: "Resmi alan adı", antiPhishingTip: "Kimlik bilgilerinizi girmeden önce tarayıcıdaki alan adının yukarıdaki resmi alan adıyla tamamen aynı olduğunu doğrulayın.", referralCode: "Referans kodu", copyCode: "Kodu kopyala", copied: "Kopyalandı ✓", openSignup: "Resmi kayıt sayfasına git ↗", openApp: "Resmi uygulamayı aç ↗", fullUrl: "Resmi bağlantının tamamı", noCodeNeeded: "On-chain cüzdan bağlantısı · Kod gerekmez", routeState: "Ortak yönlendirmesi", routeReady: "Partner rotası aktif", routePending: "İnceleme gerekli", benefitState: "Kullanıcı avantajı", benefitVerified: "Doğrulandı", benefitPending: "Resmi kayıt sayfasından doğrulayın", regionState: "Bölgesel uygunluk", regionReady: "Resmi hesap akışında uygunluğu kontrol edin", regionVerify: "Resmi akışta doğrulayın", regionBlocked: "Bu bölge için doğrudan kayıt önerilmez",    unavailable: "Bu platform için henüz doğrulanmış ortak yönlendirmesi yok. Önce yukarıdaki resmi alan adını kontrol edin."
};
Object.assign(copyDict.en, {
  productSpot: "Spot",
  productChoose: "Product path to confirm",
  stateListLabel: "Partner route, user benefit and regional eligibility",
  regionalContext: (label, product) => `Current research context: ${label} · ${product}. Final eligibility is confirmed in the official account flow.`,
});
Object.assign(copyDict["zh-Hans"], {
  productSpot: "现货",
  productChoose: "产品路径待确认",
  stateListLabel: "合作入口、用户权益与地区资格",
  regionalContext: (label, product) => `当前研究地区：${label} · ${product} · 最终资格以官方账户流程为准。`,
});
Object.assign(copyDict["zh-Hant"], {
  productSpot: "現貨",
  productChoose: "產品路徑待確認",
  stateListLabel: "合作入口、用戶權益與地區資格",
  regionalContext: (label, product) => `目前研究地區：${label} · ${product} · 最終資格以官方帳戶流程為準。`,
});
Object.assign(copyDict.ur, {
  productSpot: "اسپاٹ",
  productChoose: "پروڈکٹ راستہ تصدیق طلب",
  stateListLabel: "پارٹنر راستہ، صارف کا فائدہ اور علاقائی اہلیت",
  regionalContext: (label, product) => `موجودہ تحقیقی تناظر: ${label} · ${product}. حتمی اہلیت سرکاری اکاؤنٹ عمل میں تصدیق ہوتی ہے۔`,
});
Object.assign(copyDict.uk, {
  productSpot: "Спот",
  productChoose: "Маршрут продукту для підтвердження",
  stateListLabel: "Партнерський маршрут, умови для користувача та регіональна доступність",
  regionalContext: (label, product) => `Поточний дослідницький контекст: ${label} · ${product}. Остаточна доступність підтверджується в офіційному процесі акаунта.`,
});
Object.assign(copyDict.ja, {
  routeReady: "パートナー導線有効",
  routePending: "要確認",
  benefitVerified: "出典記録済み",
  benefitPending: "公式登録ページで確認してください",
  regionReady: "公式アカウント手続きで適用条件を確認",
  regionVerify: "公式手続きで確認してください",
  officialRouteState: "公式ルート",
  openOfficial: "公式ルートを開く ↗",
  continueCompare: "比較を続ける",
  telegramResearch: "Telegram 調査Botを開く ↗",
  productSpot: "現物",
  productChoose: "商品ルートを確認",
  stateListLabel: "パートナー導線、ユーザー向け条件、地域適用",
  regionalContext: (label, product) => `現在の調査地域：${label} · ${product}。最終的な利用資格は公式アカウント手続きで確認されます。`,
  preflightTitle: "続行前の確認",
  routeDetailsTitle: "ルート・コード・利用条件の詳細",
  preflightWithCode: "第三者の登録ページを開きます。紹介コードが {code} であることを確認し、自動入力されない場合は送信前に手入力してください。",
  preflightNoCode: "第三者の登録ページを開きます。送信前に、地域、本人確認、商品条件を公式ページで確認してください。",
  preflightOfficial: "第三者の公式ルートを開きます。このサービスには紹介コード付きルートの記録がありません。",
  preflightBlocked: "現時点では直接登録を推奨しません。地域条件と公式条件を先に確認してください。",
});
Object.assign(copyDict.ko, {
  routeReady: "파트너 경로 활성",
  routePending: "검토 필요",
  benefitVerified: "출처 기록됨",
  benefitPending: "공식 가입 페이지에서 확인하세요",
  regionReady: "공식 계정 절차에서 자격을 확인하세요",
  regionVerify: "공식 절차에서 확인하세요",
  officialRouteState: "공식 경로",
  openOfficial: "공식 경로 열기 ↗",
  continueCompare: "플랫폼 비교 계속",
  telegramResearch: "Telegram 리서치 Bot 열기 ↗",
  productSpot: "현물",
  productChoose: "상품 경로 확인",
  stateListLabel: "파트너 경로, 사용자 조건, 지역 자격",
  regionalContext: (label, product) => `현재 리서치 지역: ${label} · ${product}. 최종 자격은 공식 계정 절차에서 확인됩니다.`,
  preflightTitle: "계속하기 전 확인",
  routeDetailsTitle: "경로, 코드 및 자격 세부 정보",
  preflightWithCode: "제3자 가입 페이지가 열립니다. 추천 코드가 {code}인지 확인하고, 자동 입력되지 않으면 제출 전에 직접 입력하세요.",
  preflightNoCode: "제3자 가입 페이지가 열립니다. 제출 전에 지역, 본인확인, 상품 조건을 공식 페이지에서 확인하세요.",
  preflightOfficial: "제3자 공식 경로가 열립니다. 이 플랫폼에는 기록된 추천 코드 경로가 없습니다.",
  preflightBlocked: "아직 직접 가입은 권장하지 않습니다. 지역 자격과 공식 조건을 먼저 확인하세요.",
});
Object.assign(copyDict.es, {
  antiPhishingTip: "Antes de introducir credenciales, comprueba que el dominio del navegador coincide exactamente con el dominio oficial indicado arriba.",
  routeState: "Ruta de socio",
  routeReady: "Ruta de socio activa",
  routePending: "Requiere revisión",
  benefitState: "Condiciones para el usuario",
  benefitVerified: "Fuente registrada",
  benefitPending: "Confirma en la página oficial de registro",
  regionState: "Elegibilidad regional",
  regionReady: "Comprueba la elegibilidad en el flujo oficial de cuenta",
  regionVerify: "Confirma en el flujo oficial",
  regionBlocked: "No se recomienda el registro directo para esta región",
  unavailable: "Esta plataforma aún no tiene una ruta de socio registrada. Comprueba primero el dominio oficial indicado arriba.",
  officialRouteState: "Ruta oficial",
  openOfficial: "Abrir ruta oficial ↗",
  continueCompare: "Seguir comparando",
  telegramResearch: "Abrir asistente de investigación en Telegram ↗",
  productSpot: "Spot",
  productChoose: "Producto por confirmar",
  stateListLabel: "Ruta de socio, condiciones de usuario y elegibilidad regional",
  regionalContext: (label, product) => `Contexto de investigación actual: ${label} · ${product}. La elegibilidad final se confirma en el flujo oficial de cuenta.`,
  preflightTitle: "Antes de continuar",
  routeDetailsTitle: "Detalles de ruta, código y elegibilidad",
  preflightWithCode: "Se abrirá una página de registro de un tercero. Confirma que el código de referido sea {code}; si no aparece rellenado, introdúcelo antes de enviar.",
  preflightNoCode: "Se abrirá una página de registro de un tercero. Confirma región, verificación de identidad y condiciones del producto en la página oficial antes de enviar.",
  preflightOfficial: "Se abrirá la ruta oficial de un tercero. No hay una ruta con código de referido registrada para esta plataforma.",
  preflightBlocked: "Aún no se recomienda el registro directo. Revisa primero la elegibilidad regional y las condiciones oficiales.",
});
Object.assign(copyDict["pt-BR"], {
  antiPhishingTip: "Antes de inserir credenciais, confira se o domínio na barra do navegador é exatamente o domínio oficial indicado acima.",
  routeState: "Rota de parceiro",
  routeReady: "Ruta de socio activa",
  routePending: "Requer revisão",
  benefitState: "Condições para o usuário",
  benefitVerified: "Fonte registrada",
  benefitPending: "Confirme na página oficial de cadastro",
  regionState: "Elegibilidade regional",
  regionReady: "Confira a elegibilidade no fluxo oficial da conta",
  regionVerify: "Confirme no fluxo oficial",
  regionBlocked: "O cadastro direto não é recomendado para esta região",
  unavailable: "Esta plataforma ainda não tem uma rota de parceiro registrada. Confira primeiro o domínio oficial acima.",
  officialRouteState: "Rota oficial",
  openOfficial: "Abrir rota oficial ↗",
  continueCompare: "Continuar comparação",
  telegramResearch: "Abrir assistente de pesquisa no Telegram ↗",
  productSpot: "Spot",
  productChoose: "Produto a confirmar",
  stateListLabel: "Rota de parceiro, condições do usuário e elegibilidade regional",
  regionalContext: (label, product) => `Contexto atual de pesquisa: ${label} · ${product}. A elegibilidade final é confirmada no fluxo oficial da conta.`,
  preflightTitle: "Antes de continuar",
  routeDetailsTitle: "Detalhes de rota, código e elegibilidade",
  preflightWithCode: "Uma página de cadastro de terceiro será aberta. Confirme que o código de indicação é {code}; se não vier preenchido, informe antes de enviar.",
  preflightNoCode: "Uma página de cadastro de terceiro será aberta. Confirme região, verificação de identidade e condições do produto na página oficial antes de enviar.",
  preflightOfficial: "A rota oficial de terceiro será aberta. Esta plataforma não tem uma rota com código de indicação registrada.",
  preflightBlocked: "O cadastro direto ainda não é recomendado. Verifique primeiro a elegibilidade regional e os termos oficiais.",
});
Object.assign(copyDict.fr, {
  antiPhishingTip: "Avant de saisir des identifiants, vérifiez que le domaine du navigateur correspond exactement au domaine officiel indiqué ci-dessus.",
  routeState: "Route partenaire",
  routeReady: "Route partenaire active",
  routePending: "Revue requise",
  benefitState: "Conditions utilisateur",
  benefitVerified: "Source enregistrée",
  benefitPending: "À confirmer sur la page officielle d’inscription",
  regionState: "Éligibilité régionale",
  regionReady: "Vérifiez l’éligibilité dans le parcours officiel du compte",
  regionVerify: "À confirmer dans le parcours officiel",
  regionBlocked: "L’inscription directe n’est pas recommandée pour cette région",
  unavailable: "Aucune route partenaire enregistrée n’est encore disponible pour cette plateforme. Vérifiez d’abord le domaine officiel ci-dessus.",
  officialRouteState: "Route officielle",
  openOfficial: "Ouvrir la route officielle ↗",
  continueCompare: "Continuer la comparaison",
  telegramResearch: "Ouvrir l’assistant de recherche Telegram ↗",
  productSpot: "Spot",
  productChoose: "Produit à confirmer",
  stateListLabel: "Route partenaire, conditions utilisateur et éligibilité régionale",
  regionalContext: (label, product) => `Contexte de recherche actuel : ${label} · ${product}. L’éligibilité finale se confirme dans le parcours officiel du compte.`,
  preflightTitle: "Avant de continuer",
  routeDetailsTitle: "Détails de route, code et éligibilité",
  preflightWithCode: "Une page d’inscription tierce va s’ouvrir. Vérifiez que le code de parrainage est {code}; s’il n’est pas prérempli, saisissez-le avant l’envoi.",
  preflightNoCode: "Une page d’inscription tierce va s’ouvrir. Vérifiez la région, l’identité et les conditions produit sur la page officielle avant l’envoi.",
  preflightOfficial: "La route officielle tierce va s’ouvrir. Aucune route avec code de parrainage n’est enregistrée pour cette plateforme.",
  preflightBlocked: "L’inscription directe n’est pas encore recommandée. Vérifiez d’abord l’éligibilité régionale et les conditions officielles.",
});
Object.assign(copyDict.de, {
  antiPhishingTip: "Prüfen Sie vor der Eingabe von Zugangsdaten, ob die Browser-Domain exakt mit der oben genannten offiziellen Domain übereinstimmt.",
  routeState: "Partnerroute",
  routeReady: "Partnerroute aktiv",
  routePending: "Prüfung erforderlich",
  benefitState: "Nutzerbedingungen",
  benefitVerified: "Quelle erfasst",
  benefitPending: "Auf der offiziellen Registrierungsseite prüfen",
  regionState: "Regionale Eignung",
  regionReady: "Eignung im offiziellen Kontoablauf prüfen",
  regionVerify: "Im offiziellen Weg prüfen",
  regionBlocked: "Direkte Registrierung wird für diese Region nicht empfohlen",
  unavailable: "Für diese Plattform ist noch keine erfasste Partnerroute verfügbar. Prüfen Sie zuerst die oben genannte offizielle Domain.",
  officialRouteState: "Offizieller Weg",
  openOfficial: "Offiziellen Weg öffnen ↗",
  continueCompare: "Vergleich fortsetzen",
  telegramResearch: "Telegram-Rechercheassistent öffnen ↗",
  productSpot: "Spot",
  productChoose: "Produktweg prüfen",
  stateListLabel: "Partnerroute, Nutzerbedingungen und regionale Eignung",
  regionalContext: (label, product) => `Aktueller Recherchekontext: ${label} · ${product}. Die endgültige Eignung wird im offiziellen Kontoweg bestätigt.`,
  preflightTitle: "Vor dem Fortfahren prüfen",
  routeDetailsTitle: "Route, Code und Eignung im Detail",
  preflightWithCode: "Es öffnet sich eine Drittanbieter-Registrierung. Prüfen Sie, ob der Empfehlungscode {code} lautet; falls er nicht vorausgefüllt ist, tragen Sie ihn vor dem Absenden ein.",
  preflightNoCode: "Es öffnet sich eine Drittanbieter-Registrierung. Prüfen Sie Region, Identitätsprüfung und Produktbedingungen auf der offiziellen Seite vor dem Absenden.",
  preflightOfficial: "Es öffnet sich der offizielle Drittanbieter-Weg. Für diese Plattform ist kein Empfehlungscode-Weg eingerichtet.",
  preflightBlocked: "Direkte Registrierung wird derzeit nicht empfohlen. Prüfen Sie zuerst regionale Eignung und offizielle Bedingungen.",
});
Object.assign(copyDict.ar, {
  antiPhishingTip: "قبل إدخال أي بيانات، تحقق من أن نطاق المتصفح يطابق النطاق الرسمي أعلاه تماماً.",
  routeState: "مسار الشراكة",
  routeReady: "مسار الشراكة نشط",
  routePending: "تحتاج مراجعة",
  benefitState: "شروط المستخدم",
  benefitVerified: "تم تسجيل المصدر",
  benefitPending: "يراجع في الصفحة الرسمية للتسجيل",
  regionState: "الأهلية الإقليمية",
  regionReady: "تحقق من الأهلية في مسار الحساب الرسمي",
  regionVerify: "تحقق في المسار الرسمي",
  regionBlocked: "لا نوصي بالتسجيل المباشر لهذه المنطقة",
  unavailable: "لا يوجد مسار شراكة مسجل لهذه المنصة بعد. تحقق أولاً من النطاق الرسمي أعلاه.",
  officialRouteState: "المسار الرسمي",
  openOfficial: "فتح المسار الرسمي ↗",
  continueCompare: "متابعة المقارنة",
  telegramResearch: "فتح مساعد البحث في Telegram ↗",
  productSpot: "التداول الفوري",
  productChoose: "مسار المنتج بحاجة إلى تأكيد",
  stateListLabel: "مسار الشراكة وشروط المستخدم والأهلية الإقليمية",
  regionalContext: (label, product) => `سياق البحث الحالي: ${label} · ${product}. تؤكد الأهلية النهائية داخل مسار الحساب الرسمي.`,
  preflightTitle: "قبل المتابعة",
  routeDetailsTitle: "تفاصيل المسار والرمز والأهلية",
  preflightWithCode: "سيتم فتح صفحة تسجيل تابعة لطرف ثالث. تحقق من أن رمز الإحالة هو {code}؛ وإذا لم يظهر تلقائياً فأدخله قبل الإرسال.",
  preflightNoCode: "سيتم فتح صفحة تسجيل تابعة لطرف ثالث. تحقق من المنطقة والتحقق من الهوية وشروط المنتج في الصفحة الرسمية قبل الإرسال.",
  preflightOfficial: "سيتم فتح المسار الرسمي للطرف الثالث. لا يوجد مسار برمز إحالة مضبوط لهذه المنصة.",
  preflightBlocked: "لا نوصي بالتسجيل المباشر حالياً. تحقق أولاً من الأهلية الإقليمية والشروط الرسمية.",
});
Object.assign(copyDict.ru, {
  antiPhishingTip: "Перед вводом данных проверьте, что домен в браузере точно совпадает с официальным доменом выше.",
  routeState: "Партнёрский маршрут",
  routeReady: "Партнёрский маршрут активен",
  routePending: "Требуется проверка",
  benefitState: "Условия для пользователя",
  benefitVerified: "Источник зафиксирован",
  benefitPending: "Проверьте на официальной странице регистрации",
  regionState: "Региональная доступность",
  regionReady: "Проверьте доступность в официальном процессе аккаунта",
  regionVerify: "Проверьте в официальном процессе",
  regionBlocked: "Прямая регистрация для этого региона не рекомендуется",
  unavailable: "Для этой платформы пока нет зафиксированного партнёрского маршрута. Сначала проверьте официальный домен выше.",
  officialRouteState: "Официальный маршрут",
  openOfficial: "Открыть официальный маршрут ↗",
  continueCompare: "Продолжить сравнение",
  telegramResearch: "Открыть исследовательского помощника Telegram ↗",
  productSpot: "Спот",
  productChoose: "Маршрут продукта нужно подтвердить",
  stateListLabel: "Партнёрский маршрут, условия пользователя и региональная доступность",
  regionalContext: (label, product) => `Текущий контекст исследования: ${label} · ${product}. Финальная доступность подтверждается в официальном аккаунтном процессе.`,
  preflightTitle: "Перед продолжением",
  routeDetailsTitle: "Детали маршрута, кода и доступности",
  preflightWithCode: "Откроется страница регистрации третьей стороны. Проверьте, что реферальный код указан как {code}; если он не подставлен, введите его перед отправкой.",
  preflightNoCode: "Откроется страница регистрации третьей стороны. Перед отправкой проверьте регион, проверку личности и условия продукта на официальной странице.",
  preflightOfficial: "Откроется официальный маршрут третьей стороны. Для этой платформы путь с реферальным кодом не записан.",
  preflightBlocked: "Прямая регистрация пока не рекомендуется. Сначала проверьте региональную доступность и официальные условия.",
});
Object.assign(copyDict.id, {
  antiPhishingTip: "Sebelum memasukkan kredensial, pastikan domain di browser sama persis dengan domain resmi di atas.",
  routeState: "Rute partner",
  routeReady: "Rute partner aktif",
  routePending: "Perlu ditinjau",
  benefitState: "Ketentuan pengguna",
  benefitVerified: "Sumber tercatat",
  benefitPending: "Konfirmasi di halaman pendaftaran resmi",
  regionState: "Kelayakan wilayah",
  regionReady: "Periksa kelayakan di alur akun resmi",
  regionVerify: "Konfirmasi dalam alur resmi",
  regionBlocked: "Pendaftaran langsung tidak disarankan untuk wilayah ini",
  unavailable: "Belum ada rute partner tercatat untuk platform ini. Periksa dulu domain resmi di atas.",
  officialRouteState: "Rute resmi",
  openOfficial: "Buka rute resmi ↗",
  continueCompare: "Lanjutkan perbandingan",
  telegramResearch: "Buka asisten riset Telegram ↗",
  productSpot: "Spot",
  productChoose: "Jalur produk perlu dikonfirmasi",
  stateListLabel: "Rute partner, ketentuan pengguna, dan kelayakan wilayah",
  regionalContext: (label, product) => `Konteks riset saat ini: ${label} · ${product}. Kelayakan akhir dikonfirmasi dalam alur akun resmi.`,
  preflightTitle: "Sebelum melanjutkan",
  routeDetailsTitle: "Detail rute, kode, dan kelayakan",
  preflightWithCode: "Halaman pendaftaran pihak ketiga akan dibuka. Pastikan kode referal adalah {code}; jika belum terisi otomatis, masukkan sebelum mengirim.",
  preflightNoCode: "Halaman pendaftaran pihak ketiga akan dibuka. Pastikan wilayah, verifikasi identitas, dan syarat produk di halaman resmi sebelum mengirim.",
  preflightOfficial: "Rute resmi pihak ketiga akan dibuka. Tidak ada rute kode referal yang tercatat untuk platform ini.",
  preflightBlocked: "Pendaftaran langsung belum disarankan. Periksa kelayakan wilayah dan syarat resmi terlebih dahulu.",
});
Object.assign(copyDict.vi, {
  antiPhishingTip: "Trước khi nhập thông tin đăng nhập, hãy kiểm tra tên miền trên trình duyệt khớp chính xác với tên miền chính thức ở trên.",
  routeState: "Đường dẫn đối tác",
  routeReady: "Tuyến đối tác đang hoạt động",
  routePending: "Cần xem xét",
  benefitState: "Điều kiện người dùng",
  benefitVerified: "Nguồn đã ghi nhận",
  benefitPending: "Xác nhận trên trang đăng ký chính thức",
  regionState: "Điều kiện khu vực",
  regionReady: "Kiểm tra điều kiện trong luồng tài khoản chính thức",
  regionVerify: "Xác nhận trong luồng chính thức",
  regionBlocked: "Không khuyến nghị đăng ký trực tiếp cho khu vực này",
  unavailable: "Nền tảng này chưa có đường dẫn đối tác đã ghi nhận. Hãy kiểm tra tên miền chính thức ở trên trước.",
  officialRouteState: "Đường dẫn chính thức",
  openOfficial: "Mở đường dẫn chính thức ↗",
  continueCompare: "Tiếp tục so sánh",
  telegramResearch: "Mở trợ lý nghiên cứu Telegram ↗",
  productSpot: "Spot",
  productChoose: "Đường sản phẩm cần xác nhận",
  stateListLabel: "Đường dẫn đối tác, điều kiện người dùng và điều kiện khu vực",
  regionalContext: (label, product) => `Bối cảnh nghiên cứu hiện tại: ${label} · ${product}. Điều kiện cuối cùng được xác nhận trong luồng tài khoản chính thức.`,
  preflightTitle: "Trước khi tiếp tục",
  routeDetailsTitle: "Chi tiết đường dẫn, mã và điều kiện",
  preflightWithCode: "Trang đăng ký của bên thứ ba sẽ mở. Hãy xác nhận mã giới thiệu là {code}; nếu chưa được điền sẵn, hãy nhập trước khi gửi.",
  preflightNoCode: "Trang đăng ký của bên thứ ba sẽ mở. Hãy xác nhận khu vực, xác minh danh tính và điều kiện sản phẩm trên trang chính thức trước khi gửi.",
  preflightOfficial: "Đường dẫn chính thức của bên thứ ba sẽ mở. Nền tảng này chưa có đường dẫn kèm mã giới thiệu.",
  preflightBlocked: "Chưa nên đăng ký trực tiếp. Hãy kiểm tra điều kiện khu vực và điều khoản chính thức trước.",
});
Object.assign(copyDict.it, {
  antiPhishingTip: "Prima di inserire credenziali, verifica che il dominio nel browser coincida esattamente con il dominio ufficiale indicato sopra.",
  routeState: "Percorso partner",
  routeReady: "Percorso partner attivo",
  routePending: "Richiede revisione",
  benefitState: "Condizioni utente",
  benefitVerified: "Fonte registrata",
  benefitPending: "Conferma nella pagina ufficiale di registrazione",
  regionState: "Idoneità regionale",
  regionReady: "Verifica l’idoneità nel flusso account ufficiale",
  regionVerify: "Conferma nel flusso ufficiale",
  regionBlocked: "La registrazione diretta non è consigliata per questa regione",
  unavailable: "Per questa piattaforma non è ancora disponibile un percorso partner registrato. Controlla prima il dominio ufficiale sopra.",
  officialRouteState: "Percorso ufficiale",
  openOfficial: "Apri percorso ufficiale ↗",
  continueCompare: "Continua il confronto",
  telegramResearch: "Apri l’assistente di ricerca Telegram ↗",
  productSpot: "Spot",
  productChoose: "Percorso prodotto da confermare",
  stateListLabel: "Percorso partner, condizioni utente e idoneità regionale",
  regionalContext: (label, product) => `Contesto di ricerca attuale: ${label} · ${product}. L’idoneità finale si conferma nel flusso ufficiale dell’account.`,
  preflightTitle: "Prima di continuare",
  routeDetailsTitle: "Dettagli su percorso, codice e idoneità",
  preflightWithCode: "Si aprirà una pagina di registrazione di terze parti. Verifica che il codice referral sia {code}; se non è precompilato, inseriscilo prima dell’invio.",
  preflightNoCode: "Si aprirà una pagina di registrazione di terze parti. Verifica regione, identità e condizioni del prodotto sulla pagina ufficiale prima dell’invio.",
  preflightOfficial: "Si aprirà il percorso ufficiale di terze parti. Per questa piattaforma non è registrato un percorso con codice referral.",
  preflightBlocked: "La registrazione diretta non è ancora consigliata. Controlla prima l’idoneità regionale e i termini ufficiali.",
});
Object.assign(copyDict.tr, {
  routeState: "Partner rotası",
  routeReady: "Partner rotası aktif",
  routePending: "İnceleme gerekli",
  benefitState: "Kullanıcı koşulları",
  benefitVerified: "Kaynak kaydedildi",
  benefitPending: "Resmi kayıt sayfasında kontrol edin",
  regionState: "Bölgesel uygunluk",
  regionReady: "Resmi hesap akışında uygunluğu kontrol edin",
  regionVerify: "Resmi akışta kontrol edin",
  regionBlocked: "Bu bölge için doğrudan kayıt önerilmez",
  officialRouteState: "Resmi rota",
  openOfficial: "Resmi rotayı aç ↗",
  continueCompare: "Karşılaştırmaya devam et",
  telegramResearch: "Telegram araştırma asistanını aç ↗",
  productSpot: "Spot",
  productChoose: "Ürün yolu kontrol edilecek",
  stateListLabel: "Partner rotası, kullanıcı koşulları ve bölgesel uygunluk",
  regionalContext: (label, product) => `Mevcut araştırma bağlamı: ${label} · ${product}. Nihai uygunluk resmi hesap akışında doğrulanır.`,
  preflightTitle: "Devam etmeden önce",
  routeDetailsTitle: "Rota, kod ve uygunluk ayrıntıları",
  preflightWithCode: "Üçüncü taraf kayıt sayfası açılacak. Referans kodunun {code} olduğunu doğrulayın; otomatik dolmazsa göndermeden önce elle girin.",
  preflightNoCode: "Üçüncü taraf kayıt sayfası açılacak. Göndermeden önce bölge, kimlik doğrulama ve ürün koşullarını resmi sayfada kontrol edin.",
  preflightOfficial: "Üçüncü taraf resmi rotası açılacak. Bu platform için kayıtlı referans kodlu rota yok.",
  preflightBlocked: "Doğrudan kayıt henüz önerilmiyor. Önce bölgesel uygunluğu ve resmi koşulları kontrol edin.",
});
function getCopy(locale) {
  if (locale === "zh-Hans" || locale === "zh-CN") return copyDict["zh-Hans"];
  if (locale === "zh-Hant" || locale === "zh-TW") return copyDict["zh-Hant"];
  if (copyDict[locale]) return copyDict[locale];
  const base = String(locale || "").split("-")[0];
  if (copyDict[base]) return copyDict[base];
  return copyDict.en;
}

function registrationRuntimeCopy(locale, baseCopy) {
  const text = v3Copy(locale);
  const isEnglish = locale === "en" || !locale;
  const inheritedEnglish = (key) => !isEnglish && baseCopy[key] === copyDict.en[key];
  return {
    ...baseCopy,
    antiPhishingTip: inheritedEnglish("antiPhishingTip") ? text.noOfficial : baseCopy.antiPhishingTip,
    routeState: inheritedEnglish("routeState") ? text.partnerState : baseCopy.routeState,
    routeReady: inheritedEnglish("routeReady") ? text.registrationLocked : baseCopy.routeReady,
    routePending: inheritedEnglish("routePending") ? text.pendingReview : baseCopy.routePending,
    benefitState: inheritedEnglish("benefitState") ? text.partnerState : baseCopy.benefitState,
    benefitVerified: inheritedEnglish("benefitVerified") ? text.reviewedActivity : baseCopy.benefitVerified,
    benefitPending: inheritedEnglish("benefitPending") ? text.pendingReview : baseCopy.benefitPending,
    regionState: inheritedEnglish("regionState") ? text.verifyBefore : baseCopy.regionState,
    regionReady: inheritedEnglish("regionReady") ? text.registrationPrepCta : baseCopy.regionReady,
    regionVerify: inheritedEnglish("regionVerify") ? text.verifyBefore : baseCopy.regionVerify,
    regionBlocked: inheritedEnglish("regionBlocked") ? text.notConfigured : baseCopy.regionBlocked,
    unavailable: inheritedEnglish("unavailable") ? text.notConfigured : baseCopy.unavailable,
    productSpot: baseCopy.productSpot || text.productFamily,
    productChoose: baseCopy.productChoose || text.productFamily,
    regionalContext: baseCopy.regionalContext || ((label, product) => `${text.researchScope}: ${label} · ${product}. ${text.verifyBefore}.`),
    stateListLabel: baseCopy.stateListLabel || `${text.partnerState} · ${text.verifyBefore}`,
    routeDetailsTitle: baseCopy.routeDetailsTitle || text.openDetail,
  };
}

const registrationNextStepCopy = Object.freeze({
  en: {
    label: "Next step",
    withCode: (code) => `Open the partner signup route, then confirm referral code ${code} on the official page before submitting.`,
    noCode: "Open the official route, then confirm region, KYC and product terms before submitting.",
    research: "Review the official conditions first; direct signup is not recommended for this route yet.",
  },
  "zh-Hans": {
    label: "下一步",
    withCode: (code) => `打开合作开户注册页，提交前确认官方页面的邀请码为 ${code}；如果没有自动带入，请手动填写。`,
    noCode: "打开官方入口，提交前确认地区、KYC 与产品条件。",
    research: "先核对官方条件；当前路径不建议直接注册。",
  },
  "zh-Hant": {
    label: "下一步",
    withCode: (code) => `開啟合作開戶註冊頁，提交前確認官方頁面的邀請碼為 ${code}；若未自動帶入，請手動填寫。`,
    noCode: "開啟官方入口，提交前確認地區、KYC 與產品條件。",
    research: "先核對官方條件；目前路徑不建議直接註冊。",
  },
  // l10n: needs native review
  ur: {
    label: "اگلا قدم",
    withCode: (code) => `پارٹنر رجسٹریشن راستہ کھولیں، پھر جمع کرانے سے پہلے سرکاری صفحے پر ریفرل کوڈ ${code} کی تصدیق کریں۔`,
    noCode: "سرکاری راستہ کھولیں، پھر جمع کرانے سے پہلے علاقہ، KYC اور پروڈکٹ شرائط چیک کریں۔",
    research: "پہلے سرکاری شرائط دیکھیں؛ اس راستے پر براہ راست رجسٹریشن ابھی تجویز نہیں۔",
  },
  // l10n: needs native review
  uk: {
    label: "Наступний крок",
    withCode: (code) => `Відкрийте партнерський маршрут реєстрації, а перед надсиланням підтвердьте на офіційній сторінці реферальний код ${code}.`,
    noCode: "Відкрийте офіційний маршрут, а перед надсиланням перевірте регіон, KYC та умови продукту.",
    research: "Спершу перегляньте офіційні умови; пряма реєстрація для цього маршруту поки не рекомендована.",
  },
  ja: {
    label: "次の確認",
    withCode: (code) => `提携登録ルートを開き、送信前に公式ページの紹介コードが ${code} であることを確認してください。自動入力されない場合は手入力してください。`,
    noCode: "公式ルートを開き、送信前に地域、本人確認、商品条件を確認してください。",
    research: "まず公式条件を確認してください。このルートでは現時点で直接登録を推奨しません。",
  },
  ko: {
    label: "다음 확인",
    withCode: (code) => `파트너 가입 경로를 열고 제출 전에 공식 페이지의 추천 코드가 ${code}인지 확인하세요. 자동 입력되지 않으면 직접 입력하세요.`,
    noCode: "공식 경로를 열고 제출 전에 지역, 본인확인, 상품 조건을 확인하세요.",
    research: "먼저 공식 조건을 확인하세요. 이 경로에서는 아직 직접 가입을 권장하지 않습니다.",
  },
  tr: {
    label: "Sonraki kontrol",
    withCode: (code) => `Partner kayıt rotasını açın ve göndermeden önce resmi sayfadaki referans kodunun ${code} olduğunu kontrol edin. Otomatik dolmazsa elle girin.`,
    noCode: "Resmi rotayı açın; göndermeden önce bölge, kimlik doğrulama ve ürün koşullarını kontrol edin.",
    research: "Önce resmi koşulları kontrol edin; bu rota için doğrudan kayıt henüz önerilmez.",
  },
  "pt-BR": {
    label: "Próximo passo",
    withCode: (code) => `Abra a rota parceira e confirme na página oficial se o código de indicação é ${code}; se não vier preenchido, informe manualmente antes de enviar.`,
    noCode: "Abra a rota oficial e confirme região, KYC e condições do produto antes de enviar.",
    research: "Revise primeiro as condições oficiais; o cadastro direto ainda não é recomendado para esta rota.",
  },
  es: {
    label: "Siguiente paso",
    withCode: (code) => copyDict.es.preflightWithCode.replace("{code}", code),
    noCode: copyDict.es.preflightNoCode,
    research: copyDict.es.preflightBlocked,
  },
  fr: {
    label: "Étape suivante",
    withCode: (code) => copyDict.fr.preflightWithCode.replace("{code}", code),
    noCode: copyDict.fr.preflightNoCode,
    research: copyDict.fr.preflightBlocked,
  },
  de: {
    label: "Nächster Schritt",
    withCode: (code) => copyDict.de.preflightWithCode.replace("{code}", code),
    noCode: copyDict.de.preflightNoCode,
    research: copyDict.de.preflightBlocked,
  },
  ar: {
    label: "الخطوة التالية",
    withCode: (code) => copyDict.ar.preflightWithCode.replace("{code}", code),
    noCode: copyDict.ar.preflightNoCode,
    research: copyDict.ar.preflightBlocked,
  },
  ru: {
    label: "Следующий шаг",
    withCode: (code) => copyDict.ru.preflightWithCode.replace("{code}", code),
    noCode: copyDict.ru.preflightNoCode,
    research: copyDict.ru.preflightBlocked,
  },
  id: {
    label: "Langkah berikutnya",
    withCode: (code) => copyDict.id.preflightWithCode.replace("{code}", code),
    noCode: copyDict.id.preflightNoCode,
    research: copyDict.id.preflightBlocked,
  },
  vi: {
    label: "Bước tiếp theo",
    withCode: (code) => copyDict.vi.preflightWithCode.replace("{code}", code),
    noCode: copyDict.vi.preflightNoCode,
    research: copyDict.vi.preflightBlocked,
  },
  it: {
    label: "Passaggio successivo",
    withCode: (code) => copyDict.it.preflightWithCode.replace("{code}", code),
    noCode: copyDict.it.preflightNoCode,
    research: copyDict.it.preflightBlocked,
  },
});

function getRegistrationNextStep(locale, { inviteCode, primaryRegistrationHref, officialRouteUrl }) {
  const normalizedLocale = locale === "zh-CN" ? "zh-Hans" : locale === "zh-TW" ? "zh-Hant" : locale;
  const base = String(normalizedLocale || "en").split("-")[0];
  const copy = registrationNextStepCopy[normalizedLocale] || registrationNextStepCopy[base] || registrationNextStepCopy.en;
  return {
    label: copy.label,
    body: primaryRegistrationHref
      ? (inviteCode ? copy.withCode(inviteCode) : copy.noCode)
      : officialRouteUrl
        ? copy.noCode
        : copy.research,
  };
}

const compactInviteTaskCopy = Object.freeze({
  "en": {
    "title": "Check before sign-up",
    "body": "Third-party sign-up: check the code above before submitting; enter it manually if missing.",
    "action": "Official sign-up ↗"
  },
  "zh-Hans": {
    "title": "注册前核对",
    "body": "第三方注册：提交前核对上方邀请码，未预填请手动填写。",
    "action": "前往官方注册 ↗"
  },
  "zh-Hant": {
    "title": "註冊前核對",
    "body": "第三方註冊：提交前核對上方邀請碼，未預填請手動填寫。",
    "action": "前往官方註冊 ↗"
  },

  // l10n: needs native review
  "ur": {
    "title": "رجسٹریشن سے پہلے چیک",
    "body": "تیسرے فریق کی رجسٹریشن: جمع کرانے سے پہلے اوپر کا کوڈ چیک کریں؛ اگر خود نہ آیا ہو تو دستی طور پر درج کریں۔",
    "action": "سرکاری رجسٹریشن ↗"
  },

  // l10n: needs native review
  "uk": {
    "title": "Перевірте перед реєстрацією",
    "body": "Реєстрація на сторонньому сайті: перед надсиланням перевірте код вище; якщо його немає, введіть вручну.",
    "action": "Офіційна реєстрація ↗"
  },
  "ja": {
    "title": "登録前に確認",
    "body": "第三者の登録ページで、送信前に上記の紹介コードを確認。未入力なら手入力してください。",
    "action": "公式登録へ ↗"
  },
  "ko": {
    "title": "가입 전 확인",
    "body": "제3자 가입 페이지에서 제출 전 위의 추천 코드를 확인하세요. 미리 입력되지 않았다면 직접 입력하세요.",
    "action": "공식 가입으로 ↗"
  },
  "tr": {
    "title": "Kayıt öncesi kontrol",
    "body": "Üçüncü taraf kayıt sayfasında, göndermeden önce yukarıdaki referans kodunu kontrol edin; dolu değilse elle girin.",
    "action": "Resmi kayıt ↗"
  },
  "es": {
    "title": "Antes del registro",
    "body": "En el registro de terceros, verifica el código de arriba antes de enviar; si falta, introdúcelo manualmente.",
    "action": "Registro oficial ↗"
  },
  "pt-BR": {
    "title": "Antes do cadastro",
    "body": "No cadastro de terceiros, confira o código acima antes de enviar; se não vier preenchido, digite manualmente.",
    "action": "Cadastro oficial ↗"
  },
  "fr": {
    "title": "Avant l’inscription",
    "body": "Sur le site tiers, vérifiez le code ci-dessus avant de valider l’inscription ; s’il manque, saisissez-le manuellement.",
    "action": "Inscription officielle ↗"
  },
  "de": {
    "title": "Vor der Registrierung",
    "body": "Bei der Registrierung auf der Drittseite den Code oben vor dem Absenden prüfen; fehlt er, manuell eingeben.",
    "action": "Offizielle Registrierung ↗"
  },
  "ru": {
    "title": "Перед регистрацией",
    "body": "На сторонней странице регистрации проверьте код выше перед отправкой; если он не заполнен, введите вручную.",
    "action": "Официальная регистрация ↗"
  },
  "ar": {
    "title": "قبل التسجيل",
    "body": "في صفحة تسجيل الطرف الثالث، تحقق من رمز الدعوة أعلاه قبل الإرسال؛ إن لم يُملأ، أدخله يدويًا.",
    "action": "التسجيل الرسمي ↗"
  },
  "id": {
    "title": "Sebelum mendaftar",
    "body": "Di halaman pendaftaran pihak ketiga, periksa kode di atas sebelum mengirim; jika belum terisi, masukkan manual.",
    "action": "Pendaftaran resmi ↗"
  },
  "vi": {
    "title": "Trước khi đăng ký",
    "body": "Trên trang đăng ký bên thứ ba, kiểm tra mã ở trên trước khi gửi; nếu chưa điền sẵn, hãy nhập thủ công.",
    "action": "Đăng ký chính thức ↗"
  },
  "it": {
    "title": "Prima di registrarti",
    "body": "Nella registrazione sul sito terzo, verifica il codice qui sopra prima di inviare; se manca, inseriscilo manualmente.",
    "action": "Registrazione ufficiale ↗"
  }
});

export function RegistrationCard({ venueSlug, fallbackDomain, locale = "en", market, product, accountStage, funding, compact = false, compactCopyLabel, compactCopyAriaLabel, compactSignupLabel, homeCodeIdentity = false }) {
  const [copyState, setCopyState] = useState("idle");
  const copyFeedbackTimerRef = useRef(null);
  const copyRequestRef = useRef(0);
  const copyMountedRef = useRef(true);

  // Copy feedback belongs to the current mounted venue and the latest request.
  useEffect(() => {
    copyMountedRef.current = true;
    setCopyState("idle");
    return () => {
      copyMountedRef.current = false;
      copyRequestRef.current += 1;
      if (copyFeedbackTimerRef.current !== null) {
        clearTimeout(copyFeedbackTimerRef.current);
        copyFeedbackTimerRef.current = null;
      }
    };
  }, [venueSlug]);
  const copy = registrationRuntimeCopy(locale, getCopy(locale));
  const partner = useMemo(() => {
    const configured = getPartner(venueSlug);
    if (configured) return configured;
    return {
      slug: venueSlug,
      name: venueSlug,
      category: "CEX",
      officialDomain: fallbackDomain || "",
      hasReferral: false,
      inviteCode: null,
      registrationUrl: null,
      benefit: { en: "Official route needs review", "zh-Hans": "官方入口需核验", "zh-Hant": "官方入口需核驗" },
    };
  }, [venueSlug, fallbackDomain]);

  // Project commercial fields through the public CTA boundary. Raw partner
  // records may contain unverified codes or benefits and must never render.
  const publicCta = publicCtaForVenue(venueSlug, locale, market);
  const regionalCta = regionalVenueCta(venueSlug, locale, market, product, { accountStage, funding });
  const officialRouteUrl = !publicCta.hasPartnerRoute && /^https:\/\//i.test(publicCta.registrationUrl || "")
    ? `/go/${venueSlug}?src=registration-card-official-route`
    : null;
  const compareHref = localizedHref(`/exchanges?${directoryContextSearch({ market, product, locale, accountStage, funding })}`, { locale });
  const telegramFunnel = buildTelegramWebsiteFunnelContext({ intent: "monitor", venue: venueSlug, market, locale, product, campaign: "registration_card_monitor" });
  const telegramHref = telegramFunnel.deepLink;
  const visiblePartner = {
    ...partner,
    officialDomain: partner.officialDomain || publicCta.officialDomain || fallbackDomain || "",
    registrationUrl: regionalCta.direct ? regionalCta.ctaHref : null,
    hasReferral: publicCta.hasReferral,
    inviteCode: publicCta.inviteCode,
  };

  const handleCopy = async () => {
    if (!visiblePartner.inviteCode) return;
    const request = ++copyRequestRef.current;
    if (copyFeedbackTimerRef.current !== null) {
      clearTimeout(copyFeedbackTimerRef.current);
      copyFeedbackTimerRef.current = null;
    }
    setCopyState("pending");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(visiblePartner.inviteCode);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = visiblePartner.inviteCode;
        document.body.appendChild(textarea);
        try {
          textarea.select();
          if (document.execCommand("copy") !== true) throw new Error("Copy was not confirmed");
        } finally {
          document.body.removeChild(textarea);
        }
      }
      if (!copyMountedRef.current || request !== copyRequestRef.current) return;
      setCopyState("success");
      trackCodeCopy(venueSlug, compact ? "registration-card-compact-code" : "registration-card-code");
      copyFeedbackTimerRef.current = setTimeout(() => {
        if (copyMountedRef.current && request === copyRequestRef.current) {
          setCopyState("idle");
          copyFeedbackTimerRef.current = null;
        }
      }, 2000);
    } catch {
      if (copyMountedRef.current && request === copyRequestRef.current) setCopyState("error");
    }
  };

  // QA 2026-10-10: the home desk promises these terms; the profile must say the same (one shared source).
  const benefitText = ownerRebateLine(publicCta.slug, locale, publicCta.name) || publicCta.benefit;
  // Audit NX-02: the partner benefit row reads the same record as the line above (never "confirm" next to a stated share).
  const partnerBenefit = partnerBenefitParts(publicCta.slug, locale);
  const context = directoryContext({ market, product, locale });
  const decisionPassport = readDecisionPassport("", { market, product, accountStage, funding });
  const decisionCopy = passportCopy(locale);
  const shortlistCopy = regionalShortlistCopy(locale);
  const accountStageLabel = regionalShortlistAccountStageOptions(locale).find((option) => option.value === decisionPassport.accountStage)?.label || decisionPassport.accountStage;
  const showDecisionPassport = Boolean(decisionPassport.accountStage || decisionPassport.funding);
  const passportEditHref = appendDecisionPassportQuery(localizedHref(marketResearchPath(decisionPassport.market), { locale }), decisionPassport);
  const productLabel = context.product === "spot"
    ? (locale === "zh-Hant" ? "現貨" : locale.startsWith("zh") ? "现货" : copy.productSpot || "Spot")
    : (locale === "zh-Hant" ? "產品路徑待選" : locale.startsWith("zh") ? "产品路径待选择" : copy.productChoose || "Choose product");
  const regionalContext = context.scoped
    ? (locale === "zh-Hant"
      ? `目前研究地區：${context.label} · ${productLabel} · 最終資格以官方帳戶流程為準。`
      : locale.startsWith("zh")
        ? `当前研究地区：${context.label} · ${productLabel} · 最终资格以官方账户流程为准。`
        : (copy.regionalContext?.(context.label, productLabel) || `Research context: ${context.label} · ${productLabel}. Final eligibility is decided in the official account flow.`))
    : null;
  const regionStateText = regionalCta.ctaState === "blocked"
    ? copy.regionBlocked
    : regionalCta.ctaState === "verify"
      ? copy.regionVerify
      : copy.regionReady;
  const protectedRegionalCta = regionalCta.direct
    ? {
      ...regionalCta,
      ctaHref: registrationCardGoHref(venueSlug, {
        locale,
        market: context.market,
        product: context.product,
        accountStage: decisionPassport.accountStage,
        funding: decisionPassport.funding,
      }),
    }
    : regionalCta;
  const registrationDecision = buildRegistrationDecisionState({ publicCta, regionalCta: protectedRegionalCta, decisionPassport, officialRouteUrl });
  const primaryRegistrationHref = registrationDecision.canOpenThirdParty ? registrationDecision.protectedHref : null;
  const compactInviteTask = compact && primaryRegistrationHref && visiblePartner.hasReferral && visiblePartner.inviteCode
    ? (compactInviteTaskCopy[locale] || compactInviteTaskCopy[String(locale).split("-")[0]] || compactInviteTaskCopy.en)
    : null;
  const preflightText = officialRouteUrl ? copy.preflightOfficial : copy.preflightBlocked;
  const [mobileRouteOpen, setMobileRouteOpen] = useState(() => !compact);
  const disabledActionLabel = publicCta.hasPartnerRoute ? regionStateText : copy.unavailable;
  const showHomeCodeIdentity = Boolean(homeCodeIdentity && compactInviteTask);
  const entryContext = registrationEntryContext(visiblePartner.category, locale);
  const showProtocolContext = entryContext.kind === "protocol" && !(visiblePartner.hasReferral && visiblePartner.inviteCode);
  const copied = copyState === "success";
  const copyFailed = copyState === "error";
  const copyFeedback = bleedCopyFeedback(locale);
  const copyButtonLabel = copied ? copy.copied : (compactCopyLabel || copy.copyCode);
  const copyButtonAriaLabel = compactCopyAriaLabel ? (copied ? copy.copied : compactCopyAriaLabel) : undefined;

  useEffect(() => {
    setMobileRouteOpen(!compact);
  }, [compact]);

  const guardedPreflight = primaryRegistrationHref ? null : (
    <div
      className="registration-card__preflight"
      data-registration-preflight={officialRouteUrl ? "official-route" : "research-first"}
      data-registration-decision-state={registrationDecision.state}
      data-registration-decision-reason={registrationDecision.reason}
    >
      <strong>{copy.preflightTitle}</strong>
      <span>{preflightText}</span>
    </div>
  );
  const primaryAction = (
    primaryRegistrationHref ? (
      <>
      <a
        href={primaryRegistrationHref}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="registration-card__primary-btn"
        aria-label={compactInviteTask && compactSignupLabel ? compactInviteTask.action : undefined}
        data-cta-kind="registration"
        data-cta-platform={venueSlug}
        data-cta-placement="registration-card-primary"
        data-cta-code={visiblePartner.hasReferral && visiblePartner.inviteCode ? visiblePartner.inviteCode : undefined}
        data-growth-decision={venueSlug}
        data-growth-placement="registration-card-primary"
        data-growth-market={context.market}
        data-growth-product={context.product}
        data-growth-account-stage={decisionPassport.accountStage}
        data-growth-funding={decisionPassport.funding}
        data-growth-decision-state={registrationDecision.state}
      >
        {compactInviteTask ? (compactSignupLabel || compactInviteTask.action) : (visiblePartner.hasReferral ? copy.openSignup : copy.openApp)}
      </a>
      {visiblePartner.hasReferral ? <BackupSignupLink venue={venueSlug} locale={locale} market={context.market} placement="registration-card-primary" /> : null}
      </>
    ) : officialRouteUrl ? (
      <a
        href={officialRouteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="registration-card__primary-btn registration-card__primary-btn--official"
        data-cta-kind="source"
        data-cta-platform={venueSlug}
        data-cta-placement="registration-card-official-route"
        data-growth-decision-state={registrationDecision.state}
      >
        {copy.openOfficial || copy.openApp}
      </a>
    ) : (
      <span className="registration-card__primary-btn registration-card__primary-btn--disabled" aria-disabled="true">
        {disabledActionLabel}
      </span>
    )
  );

  return (
    <div className={`registration-card${compact ? " registration-card--compact" : ""}`} id="registration-path">
      {/* 头部：官方域名核对 */}
      <div className="registration-card__head">
        <div className="registration-card__domain-box">
          <span className="registration-card__domain-badge">
            <span aria-hidden="true" className="registration-card__lock"><svg focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
            <b translate="no" lang="en">{visiblePartner.officialDomain || venueSlug}</b>
          </span>
          <span className="registration-card__domain-hint">
            {copy.officialDomain}
          </span>
        </div>
        {!primaryRegistrationHref && regionalContext && <small className="registration-card__regional-context" data-registration-context={context.market}>
          {regionalContext}
        </small>}
        {showDecisionPassport && <div className="registration-card__passport" data-decision-passport={decisionPassport.market || "unknown"}>
          <strong>{decisionCopy.title}</strong>
          <span><small>{decisionCopy.market}</small><b>{decisionPassport.market || context.label}</b></span>
          <span><small>{decisionCopy.product}</small><b>{decisionPassport.product || context.product}</b></span>
          {decisionPassport.accountStage && <span><small>{decisionCopy.accountStage || shortlistCopy.accountStage}</small><b>{accountStageLabel}</b></span>}
          {decisionPassport.funding && <span><small>{decisionCopy.funding || shortlistCopy.funding}</small><b>{decisionPassport.funding}</b></span>}
          <a href={passportEditHref}>{decisionCopy.edit}</a>
        </div>}
      </div>

      {/* 核心操作主体 */}
      <div className="registration-card__body">
        {/* 邀请码栏目（若有） */}
        {visiblePartner.hasReferral && visiblePartner.inviteCode ? (
          <div className={showHomeCodeIdentity ? "registration-card__code-section registration-card__code-section--home-identity" : "registration-card__code-section"} data-home-code-wide={showHomeCodeIdentity && visiblePartner.inviteCode.length > 10 ? "true" : undefined}>
            <div className="registration-card__code-info">
              <span className="registration-card__code-label">{copy.referralCode}</span>
              <span className="registration-card__code-value" translate="no" lang="en">{visiblePartner.inviteCode}</span>
              {!compact && benefitText && <span className="registration-card__benefit">{benefitText}</span>}
            </div>
            <button
              type="button"
              className="registration-card__copy-btn"
              onClick={handleCopy}
              data-copied={copied}
              aria-label={showHomeCodeIdentity ? (copyButtonAriaLabel || copyButtonLabel) : copyButtonAriaLabel}
            >
              {showHomeCodeIdentity ? <>
                <span className="registration-card__home-copy-label">{copyButtonLabel}</span>
                {copied ? <span aria-hidden="true">✓</span> : <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></svg>}
              </> : copyButtonLabel}
            </button>
            {(showHomeCodeIdentity || copyFailed) && (
              <span className="registration-card__home-copy-status" role="status" aria-live="polite">
                {copied ? copy.copied : copyFailed ? copyFeedback.failed : ""}
              </span>
            )}
            {copyFailed && (
              <input
                className="registration-card__manual-copy"
                aria-label={copyFeedback.codeLabel}
                readOnly
                value={visiblePartner.inviteCode}
                onFocus={(event) => event.currentTarget.select()}
                dir="ltr"
                style={{ minHeight: 44, minWidth: 0, maxWidth: "100%" }}
              />
            )}
            {compact && benefitText && <span className="registration-card__benefit registration-card__code-benefit">{benefitText}</span>}
          </div>
        ) : (
          <div className="registration-card__code-section registration-card__entry-context" data-entry-context={entryContext.kind}>
            <div className="registration-card__code-info">
              <span className="registration-card__entry-context-title">{entryContext.title}</span>
              <span className="registration-card__entry-context-body">{entryContext.body}</span>
            </div>
          </div>
        )}

        {compact && <div className="registration-card__action-group">
          {guardedPreflight}
          {primaryAction}
        </div>}

        {/* 可展开的条件说明；紧凑卡片的主操作始终可见 */}
        <details
          className="registration-card__mobile-route-details"
          open={mobileRouteOpen}
          onToggle={(event) => setMobileRouteOpen(event.currentTarget.open)}
        >
          <summary className="registration-card__mobile-route-summary">
            <span>
              <strong>{copy.routeDetailsTitle}</strong>
            </span>
            <b aria-hidden="true">＋</b>
          </summary>
          <div className="registration-card__mobile-route-body">
            <div className="registration-card__action-group">
              <div className="registration-card__state-list" role="group" aria-label={locale.startsWith("zh") ? "合作入口、优惠和地区状态" : (copy.stateListLabel || "Partner route, benefit and regional states")}>
                <p><span>{publicCta.hasPartnerRoute ? copy.routeState : (copy.officialRouteState || copy.officialDomain)}</span><b>{publicCta.hasPartnerRoute ? copy.routeReady : (officialRouteUrl ? copy.regionVerify : copy.routePending)}</b></p>
                {partnerBenefit && !publicCta.benefitVerified
                  ? <p><span>{partnerBenefit.label}</span><b>{partnerBenefit.value} · {partnerBenefit.confirmed}; {partnerBenefit.account}</b></p>
                  : <p><span>{showProtocolContext && !publicCta.benefitVerified ? entryContext.title : copy.benefitState}</span><b>{publicCta.benefitVerified ? copy.benefitVerified : showProtocolContext ? entryContext.body : copy.benefitPending}</b></p>}
                <p><span>{copy.regionState}</span><b>{regionStateText}</b></p>
              </div>
              {!compact && <>{guardedPreflight}{primaryAction}</>}
              {!publicCta.hasPartnerRoute && (
                <div className="registration-card__research-actions" role="group" aria-label={locale.startsWith("zh") ? "继续研究" : "Continue research"}>
                  <a href={compareHref} data-cta-kind="research" data-cta-placement="registration-card-compare">
                    {copy.continueCompare || "Continue comparison"}
                  </a>
                  {registrationDecision.state !== "blocked" && <a href={telegramHref} target="_blank" rel="noopener noreferrer" data-cta-kind="telegram" data-cta-placement="registration-card-telegram-research" data-growth-market={market} data-growth-product={product} data-telegram-start={telegramFunnel.startPayload} data-telegram-return-href={telegramFunnel.returnHref}>
                    {copy.telegramResearch || "Ask Telegram research bot ↗"}
                  </a>}
                </div>
              )}
            </div>
          </div>
        </details>
	      </div>

    </div>
  );
}

// 兼容旧组件名导出，方便直接热替换
export const OutboundHandoff = RegistrationCard;
export default RegistrationCard;
