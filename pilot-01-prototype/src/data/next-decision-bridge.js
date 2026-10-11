import { localizedHref } from "./locale-routing.js";
import { appendDecisionPassportQuery } from "./decision-passport.js";
import { comparePathFor } from "../components/v6/compare-routes.js";

const COPY = {
  en: {
    eyebrow: "NEXT STEP",
    title: "Choose the next research step",
    body: "Stay inside NexuAlpha for the platform profile, side-by-side comparison and Telegram research context before any account action.",
    profile: "Open platform profile",
    compare: "Open comparison",
    telegram: "Continue research in Telegram",
  },
  "zh-Hans": {
    eyebrow: "下一步",
    title: "选择下一步研究路径",
    body: "先在站内查看平台档案、打开对比页，并带当前上下文继续 Telegram 研究，再考虑账户动作。",
    profile: "打开平台档案",
    compare: "打开对比",
    telegram: "Telegram 继续研究",
  },
  "zh-Hant": {
    eyebrow: "下一步",
    title: "選擇下一步研究路徑",
    body: "先在站內檢視平台檔案、開啟比較頁，並帶目前脈絡繼續 Telegram 研究，再考慮帳戶動作。",
    profile: "開啟平台檔案",
    compare: "開啟比較",
    telegram: "Telegram 繼續研究",
  },
  es: {
    eyebrow: "SIGUIENTE PASO",
    title: "Elige la siguiente ruta de investigación",
    body: "Mantén la decisión dentro de NexuAlpha: perfil, comparación y contexto de Telegram antes de cualquier acción de cuenta.",
    profile: "Abrir perfil",
    compare: "Abrir comparación",
    telegram: "Continuar en Telegram",
  },
  "pt-BR": {
    eyebrow: "PRÓXIMO PASSO",
    title: "Escolha a próxima rota de pesquisa",
    body: "Continue dentro da NexuAlpha: perfil, comparação e contexto no Telegram antes de qualquer ação de conta.",
    profile: "Abrir perfil",
    compare: "Abrir comparação",
    telegram: "Continuar no Telegram",
  },
  fr: {
    eyebrow: "ÉTAPE SUIVANTE",
    title: "Choisissez la prochaine étape de recherche",
    body: "Consultez le profil, la comparaison et le contexte Telegram dans NexuAlpha avant toute action sur un compte.",
    profile: "Ouvrir le profil",
    compare: "Ouvrir la comparaison",
    telegram: "Continuer dans Telegram",
  },
  de: {
    eyebrow: "NÄCHSTER SCHRITT",
    title: "Nächsten Rechercheweg auswählen",
    body: "Prüfen Sie Profil, Vergleich und Telegram-Kontext innerhalb von NexuAlpha, bevor Sie eine Kontoaktion ausführen.",
    profile: "Profil öffnen",
    compare: "Vergleich öffnen",
    telegram: "In Telegram fortfahren",
  },
  ja: {
    eyebrow: "次のステップ",
    title: "次の調査ルートを選ぶ",
    body: "口座操作の前に、NexuAlpha内でプロフィール、比較、Telegramの調査コンテキストを確認します。",
    profile: "プロフィールを開く",
    compare: "比較を開く",
    telegram: "Telegramで続ける",
  },
  ko: {
    eyebrow: "다음 단계",
    title: "다음 리서치 경로 선택",
    body: "계정 행동 전에 NexuAlpha 안에서 프로필, 비교, Telegram 리서치 맥락을 확인하세요.",
    profile: "프로필 열기",
    compare: "비교 열기",
    telegram: "Telegram에서 계속",
  },
  ar: {
    eyebrow: "الخطوة التالية",
    title: "اختر مسار البحث التالي",
    body: "راجع ملف المنصة والمقارنة وسياق Telegram داخل NexuAlpha قبل أي إجراء على الحساب.",
    profile: "فتح ملف المنصة",
    compare: "فتح المقارنة",
    telegram: "متابعة البحث في Telegram",
  },
  tr: {
    eyebrow: "SONRAKI ADIM",
    title: "Sonraki araştırma yolunu seçin",
    body: "Hesap aksiyonundan önce NexuAlpha içinde profil, karşılaştırma ve Telegram araştırma bağlamını kontrol edin.",
    profile: "Profili aç",
    compare: "Karşılaştırmayı aç",
    telegram: "Telegram'da devam et",
  },
  ru: {
    eyebrow: "СЛЕДУЮЩИЙ ШАГ",
    title: "Выберите следующий шаг исследования",
    body: "Изучите профиль, сравнение и контекс Telegram внутри NexuAlpha до любых действий с аккаунтом.",
    profile: "Открыть профиль",
    compare: "Открыть сравнение",
    telegram: "Продолжить в Telegram",
  },
  id: {
    eyebrow: "LANGKAH BERIKUT",
    title: "Pilih jalur riset berikutnya",
    body: "Tetap di NexuAlpha untuk profil, perbandingan, dan konteks Telegram sebelum tindakan akun.",
    profile: "Buka profil",
    compare: "Buka perbandingan",
    telegram: "Lanjut di Telegram",
  },
  vi: {
    eyebrow: "BƯỚC TIẾP",
    title: "Chọn lộ trình nghiên cứu tiếp theo",
    body: "Ở lại NexuAlpha để xem hồ sơ, so sánh và ngữ cảnh Telegram trước mọi thao tác tài khoản.",
    profile: "Mở hồ sơ",
    compare: "Mở so sánh",
    telegram: "Tiếp tục trên Telegram",
  },
  it: {
    eyebrow: "PASSO SUCCESSIVO",
    title: "Scegli il prossimo percorso di ricerca",
    body: "Consulta profilo, confronto e contesto Telegram all'interno di NexuAlpha prima di qualsiasi azione sull'account.",
    profile: "Apri il profilo",
    compare: "Apri il confronto",
    telegram: "Continua su Telegram",
  },
};

function localeKey(locale = "en") {
  if (locale === "pt-BR") return "pt-BR";
  if (locale === "zh-Hant" || locale === "zh-TW" || locale === "zh-HK") return "zh-Hant";
  if (String(locale || "").startsWith("zh")) return "zh-Hans";
  return String(locale || "en").split("-")[0] || "en";
}

function cleanSlug(value) {
  const slug = String(value || "").trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(slug) ? slug : "";
}

function uniqueActions(actions) {
  const seen = new Set();
  return actions.filter((action) => {
    if (!action?.href || !action?.label) return false;
    if (!["research", "telegram"].includes(action.kind)) return false;
    if (/^https?:\/\//i.test(action.href)) return false;
    const key = `${action.kind}:${action.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}

export function nextDecisionBridgeCopy(locale = "en") {
  const key = localeKey(locale);
  return COPY[locale] || COPY[key] || COPY.en;
}

export function buildNextDecisionBridge({
  locale = "en",
  market,
  product,
  accountStage,
  funding,
  title,
  body,
  profileSlug,
  profileHref,
  profileLabel,
  compareHref,
  compareSlugs = [],
  telegramHref = "/telegram",
} = {}) {
  const text = nextDecisionBridgeCopy(locale);
  const profile = cleanSlug(profileSlug);
  const profilePath = `/exchanges/${profile}`;
  // Reuse the shortlist's validated route without accepting a different venue
  // or an off-site action in this research-only bridge.
  const suppliedProfilePath = typeof profileHref === "string" ? profileHref.split(/[?#]/)[0] : "";
  const profileRoute = suppliedProfilePath === profilePath ? profileHref : profilePath;
  const slugs = (Array.isArray(compareSlugs) ? compareSlugs : []).map(cleanSlug).filter(Boolean);
  // Factbook-only venues (HTX, HashKey, Aevo) have no compare route: comparePathFor() reports a fallback, and the
  // bridge then offers no comparison instead of a 404 link (QA 2026-10-11: /topics/compliant-exchanges linked
  // /compare/hashkey-vs-kraken).
  const pairPath = slugs.length >= 2 ? comparePathFor(slugs.slice(0, 2)) : null;
  const comparison = compareHref || (pairPath && !pairPath.fallback ? pairPath.path : "");
  const contextualHref = (href) => {
    const target = new URL(String(href || "/"), "https://nexualpha.com");
    return appendDecisionPassportQuery(localizedHref(href, { locale }), {
      market: target.searchParams.get("market") || market,
      product: target.searchParams.get("product") || product,
      accountStage,
      funding,
    });
  };
  const actions = uniqueActions([
    profile ? {
      id: "profile",
      label: profileLabel || text.profile,
      href: contextualHref(profileRoute),
      kind: "research",
    } : null,
    comparison ? {
      id: "compare",
      label: text.compare,
      href: contextualHref(comparison),
      kind: "research",
    } : null,
    {
      id: "telegram",
      label: text.telegram,
      href: contextualHref(telegramHref),
      kind: "telegram",
    },
  ]);

  return {
    eyebrow: text.eyebrow,
    title: title || text.title,
    body: body || text.body,
    actions,
  };
}
