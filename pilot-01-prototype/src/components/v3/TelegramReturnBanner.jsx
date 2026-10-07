import { useEffect, useMemo, useState } from "react";
import {
  buildAnonymousDecisionResumeQuery,
  clearAnonymousDecisionResumeSnapshot,
  loadAnonymousDecisionResumeSnapshot,
  saveAnonymousDecisionResumeSnapshot,
} from "../../data/decision-passport.js";
import { localizedHref } from "../../data/locale-routing.js";
import { resolveTelegramReturnBannerState } from "../../data/telegram-decision-return.js";
import "./telegram-return-banner.css";

const copyByLocale = {
  fr: {
    eyebrow: "Retour depuis Telegram",
    title: "Votre contexte de recherche Telegram a été restauré",
    body: "Poursuivez sur cette page avec le même contexte public de marché, de produit et de parcours. Aucune donnée de compte Telegram ni aucun résultat d’inscription n’est enregistré ici.",
    market: "Marché",
    product: "Produit",
    object: "Parcours",
    expires: "Valable jusqu’au",
    continue: "Continuer sur cette page",
    clear: "Effacer le marqueur Telegram",
  },
  de: {
    eyebrow: "Rückkehr aus Telegram",
    title: "Ihr Recherchekontext aus Telegram wurde wiederhergestellt",
    body: "Setzen Sie Ihre Recherche auf dieser Seite mit demselben öffentlichen Markt-, Produkt- und Pfadkontext fort. Hier werden keine Telegram-Kontodaten oder Registrierungsergebnisse gespeichert.",
    market: "Markt",
    product: "Produkt",
    object: "Pfad",
    expires: "Gültig bis",
    continue: "Auf dieser Seite fortfahren",
    clear: "Telegram-Markierung löschen",
  },
  ar: {
    eyebrow: "العودة من Telegram",
    title: "تمت استعادة سياق بحثك من Telegram",
    body: "تابع البحث في هذه الصفحة باستخدام السياق العام نفسه للسوق والمنتج والمسار. لا تُحفظ هنا بيانات حساب Telegram أو نتائج التسجيل.",
    market: "السوق",
    product: "المنتج",
    object: "المسار",
    expires: "صالح حتى",
    continue: "المتابعة في هذه الصفحة",
    clear: "مسح علامة Telegram",
  },
  ru: {
    eyebrow: "Возвращение из Telegram",
    title: "Контекст вашего исследования из Telegram восстановлен",
    body: "Продолжайте исследование на этой странице с тем же общедоступным контекстом рынка, продукта и маршрута. Здесь не сохраняются данные аккаунта Telegram или результаты регистрации.",
    market: "Рынок",
    product: "Продукт",
    object: "Маршрут",
    expires: "Действует до",
    continue: "Продолжить на этой странице",
    clear: "Удалить отметку Telegram",
  },
  id: {
    eyebrow: "Kembali dari Telegram",
    title: "Konteks riset Anda dari Telegram telah dipulihkan",
    body: "Lanjutkan riset di halaman ini dengan konteks pasar, produk, dan jalur publik yang sama. Data akun Telegram atau hasil pendaftaran tidak disimpan di sini.",
    market: "Pasar",
    product: "Produk",
    object: "Jalur",
    expires: "Berlaku hingga",
    continue: "Lanjutkan di halaman ini",
    clear: "Hapus penanda Telegram",
  },
  it: {
    eyebrow: "Ritorno da Telegram",
    title: "Il tuo contesto di ricerca da Telegram è stato ripristinato",
    body: "Prosegui su questa pagina con lo stesso contesto pubblico di mercato, prodotto e percorso. Qui non vengono salvati dati dell’account Telegram o risultati di registrazione.",
    market: "Mercato",
    product: "Prodotto",
    object: "Percorso",
    expires: "Valido fino al",
    continue: "Continua su questa pagina",
    clear: "Rimuovi il marcatore Telegram",
  },
  en: {
    eyebrow: "Telegram return",
    title: "Your Telegram research context is restored",
    body: "Continue this page with the same public market, product and route context. No Telegram account data or registration outcome is stored here.",
    market: "Market",
    product: "Product",
    object: "Route",
    expires: "Valid until",
    continue: "Continue on this page",
    clear: "Clear Telegram marker",
    resumeEyebrow: "Continue later",
    resumeTitle: "Continue your last anonymous decision",
    resumeBody: "Only market, product, scenario and route fields are restored. No identity, referral link or Telegram account data is stored.",
    resume: "Continue last decision",
    forget: "Forget saved decision",
  },
  "zh-Hans": {
    eyebrow: "Telegram 回站",
    title: "已恢复 Telegram 中的研究上下文",
    body: "继续在本页核对同一个公开市场、产品和路径。这里不会保存 Telegram 账号数据、注册结果或佣金结果。",
    market: "市场",
    product: "产品",
    object: "对象",
    expires: "有效期",
    continue: "继续查看本页",
    clear: "清除回站标记",
    resumeEyebrow: "继续上次决策",
    resumeTitle: "恢复上次匿名决策",
    resumeBody: "只恢复市场、产品、场景和站内路径字段，不保存身份、推荐链接或 Telegram 账号数据。",
    resume: "继续上次决策",
    forget: "清除已保存决策",
  },
  "zh-Hant": {
    eyebrow: "Telegram 回站",
    title: "已恢復 Telegram 中的研究脈絡",
    body: "繼續在本頁核對同一個公開市場、產品與路徑。這裡不會保存 Telegram 帳號資料、註冊結果或佣金結果。",
    market: "市場",
    product: "產品",
    object: "對象",
    expires: "有效期",
    continue: "繼續查看本頁",
    clear: "清除回站標記",
    resumeEyebrow: "繼續上次決策",
    resumeTitle: "恢復上次匿名決策",
    resumeBody: "只恢復市場、產品、場景與站內路徑欄位，不保存身分、推薦連結或 Telegram 帳號資料。",
    resume: "繼續上次決策",
    forget: "清除已保存決策",
  },
  ja: {
    eyebrow: "Telegram から復帰",
    title: "Telegram の調査コンテキストを復元しました",
    body: "同じ公開市場、商品、ルート文脈でこのページを続けます。Telegram アカウント情報や登録結果は保存しません。",
    market: "市場",
    product: "商品",
    object: "対象",
    expires: "有効期限",
    continue: "このページで続ける",
    clear: "復帰マーカーを消去",
  },
  ko: {
    eyebrow: "Telegram 복귀",
    title: "Telegram 리서치 맥락을 복원했습니다",
    body: "같은 공개 시장, 상품, 경로 맥락으로 이 페이지에서 계속 확인합니다. Telegram 계정 데이터나 가입 결과는 저장하지 않습니다.",
    market: "시장",
    product: "상품",
    object: "대상",
    expires: "유효 기간",
    continue: "이 페이지에서 계속",
    clear: "복귀 표시 지우기",
  },
  tr: {
    eyebrow: "Telegram dönüşü",
    title: "Telegram araştırma bağlamı geri yüklendi",
    body: "Aynı herkese açık piyasa, ürün ve rota bağlamıyla bu sayfada devam edin. Telegram hesabı veya kayıt sonucu saklanmaz.",
    market: "Piyasa",
    product: "Ürün",
    object: "Rota",
    expires: "Geçerli",
    continue: "Bu sayfada devam et",
    clear: "Telegram işaretini temizle",
  },
  es: {
    eyebrow: "Regreso desde Telegram",
    title: "Se restauró el contexto de investigación de Telegram",
    body: "Continúa esta página con el mismo mercado, producto y ruta públicos. No se guarda cuenta de Telegram ni resultado de registro.",
    market: "Mercado",
    product: "Producto",
    object: "Ruta",
    expires: "Válido hasta",
    continue: "Continuar en esta página",
    clear: "Quitar marcador de Telegram",
  },
  "pt-BR": {
    eyebrow: "Retorno do Telegram",
    title: "O contexto de pesquisa do Telegram foi restaurado",
    body: "Continue nesta página com o mesmo mercado, produto e rota públicos. Nenhum dado de conta Telegram ou resultado de cadastro é salvo aqui.",
    market: "Mercado",
    product: "Produto",
    object: "Rota",
    expires: "Válido até",
    continue: "Continuar nesta página",
    clear: "Limpar marcador do Telegram",
  },
  vi: {
    eyebrow: "Quay lại từ Telegram",
    title: "Đã khôi phục ngữ cảnh nghiên cứu từ Telegram",
    body: "Tiếp tục trên trang này với cùng thị trường, sản phẩm và tuyến công khai. Không lưu dữ liệu tài khoản Telegram hoặc kết quả đăng ký.",
    market: "Thị trường",
    product: "Sản phẩm",
    object: "Tuyến",
    expires: "Có hiệu lực đến",
    continue: "Tiếp tục trên trang này",
    clear: "Xóa dấu Telegram",
  },
};

// Anonymous resume copy is separate so existing Telegram-return fallbacks stay unchanged.
const anonymousResumeCopyByLocale = {
  en: { ...copyByLocale.en, resumeBody: "Saved in this browser, separately from Bot choices. Restores public market, selected product, purpose and onsite research route, without identity, referral links or Telegram account data." },
  "zh-Hans": { ...copyByLocale["zh-Hans"], resumeBody: "仅保存在此浏览器，与 Bot 的平台选择分开。恢复市场、产品、目的和站内路径，不含身份、邀请链接或 Telegram 账号数据。" },
  "zh-Hant": { ...copyByLocale["zh-Hant"], resumeBody: "僅保存在此瀏覽器，與 Bot 的平台選擇分開。恢復市場、產品、目的和站內路徑，不含身分、邀請連結或 Telegram 帳號資料。" },
  "ja": {
    market: "市場",
    product: "商品",
    object: "対象",
    resumeEyebrow: "後で続ける",
    resumeTitle: "前回の匿名の比較を続ける",
    resumeBody: "このブラウザーだけに保存し、Bot の選択とは別です。市場・商品・目的・サイト内経路を復元し、個人情報・紹介リンク・Telegram アカウント情報は含めません。",
    resume: "前回の比較を続ける",
    forget: "保存した比較を消去",
  },
  "ko": {
    market: "시장",
    product: "상품",
    object: "대상",
    resumeEyebrow: "나중에 이어가기",
    resumeTitle: "이전 익명 비교 이어가기",
    resumeBody: "이 브라우저에만 저장되며 Bot 선택과는 별개입니다. 시장·상품·목적·사이트 내 경로를 복원하며, 신원 정보·추천 링크·Telegram 계정 정보는 포함하지 않습니다.",
    resume: "이전 비교 이어가기",
    forget: "저장된 비교 삭제",
  },
  "tr": {
    market: "Piyasa",
    product: "Ürün",
    object: "Rota",
    resumeEyebrow: "Daha sonra devam edin",
    resumeTitle: "Son anonim karşılaştırmanıza devam edin",
    resumeBody: "Yalnızca bu tarayıcı içinde saklanır, Bot seçimlerinden ayrıdır. Piyasa, ürün, amaç ve site içi rota geri yüklenir; kimlik, davet bağlantıları veya Telegram hesap bilgileri dahil edilmez.",
    resume: "Son karşılaştırmaya devam et",
    forget: "Kaydedilen karşılaştırmayı sil",
  },
  "es": {
    market: "Mercado",
    product: "Producto",
    object: "Ruta",
    resumeEyebrow: "Continuar más tarde",
    resumeTitle: "Continúa tu última comparación anónima",
    resumeBody: "Guardado solo en este navegador, separado de las elecciones del Bot. Recupera mercado, producto, objetivo y ruta del sitio, sin identidad, enlaces de invitación ni datos de cuenta Telegram.",
    resume: "Continuar la última comparación",
    forget: "Borrar la comparación guardada",
  },
  "pt-BR": {
    market: "Mercado",
    product: "Produto",
    object: "Rota",
    resumeEyebrow: "Continuar depois",
    resumeTitle: "Continue sua última comparação anônima",
    resumeBody: "Salvo só neste navegador, separado das escolhas do Bot. Retoma mercado, produto, objetivo e caminho no site, sem identidade, links de convite ou dados da conta Telegram.",
    resume: "Continuar a última comparação",
    forget: "Apagar a comparação salva",
  },
  "vi": {
    market: "Thị trường",
    product: "Sản phẩm",
    object: "Tuyến",
    resumeEyebrow: "Tiếp tục sau",
    resumeTitle: "Tiếp tục so sánh ẩn danh trước đó",
    resumeBody: "Chỉ lưu trong trình duyệt này, khác lựa chọn Bot. Khôi phục thị trường, sản phẩm, mục đích và đường dẫn nội bộ, không gồm danh tính, liên kết giới thiệu hay tài khoản Telegram.",
    resume: "Tiếp tục so sánh trước đó",
    forget: "Xóa so sánh đã lưu",
  },
  "de": {
    market: "Markt",
    product: "Produkt",
    object: "Pfad",
    resumeEyebrow: "Später fortsetzen",
    resumeTitle: "Letzten anonymen Vergleich fortsetzen",
    resumeBody: "Nur in diesem Browser gespeichert, getrennt von Bot-Auswahlen. Stellt öffentlichen Markt, gewähltes Produkt, Vergleichszweck und Pfad innerhalb der Website wieder her, ohne Identitätsdaten, Einladungslinks oder Telegram-Kontodaten.",
    resume: "Letzten Vergleich fortsetzen",
    forget: "Gespeicherten Vergleich löschen",
  },
  "fr": {
    market: "Marché",
    product: "Produit",
    object: "Parcours",
    resumeEyebrow: "Continuer plus tard",
    resumeTitle: "Reprendre votre dernière comparaison anonyme",
    resumeBody: "Enregistré dans ce navigateur, séparément des choix du Bot. Restaure marché, produit, objectif et parcours sur le site, sans identité, liens de parrainage ni données de compte Telegram.",
    resume: "Reprendre la dernière comparaison",
    forget: "Effacer la comparaison enregistrée",
  },
  "it": {
    market: "Mercato",
    product: "Prodotto",
    object: "Percorso",
    resumeEyebrow: "Continua più tardi",
    resumeTitle: "Riprendi il tuo ultimo confronto anonimo",
    resumeBody: "Salvato solo in questo browser, separatamente dalle scelte del Bot. Ripristina mercato, prodotto, obiettivo e percorso nel sito, senza identità, link di invito o dati dell’account Telegram.",
    resume: "Riprendi l’ultimo confronto",
    forget: "Elimina il confronto salvato",
  },
  "ru": {
    market: "Рынок",
    product: "Продукт",
    object: "Маршрут",
    resumeEyebrow: "Продолжить позже",
    resumeTitle: "Продолжить последнее анонимное сравнение",
    resumeBody: "Сохраняется только в этом браузере, отдельно от выбора в Bot. Восстанавливает рынок, продукт, цель и путь внутри сайта, без личных данных, реферальных ссылок или данных аккаунта Telegram.",
    resume: "Продолжить последнее сравнение",
    forget: "Удалить сохранённое сравнение",
  },
  "ar": {
    market: "السوق",
    product: "المنتج",
    object: "المسار",
    resumeEyebrow: "المتابعة لاحقًا",
    resumeTitle: "متابعة آخر مقارنة دون بيانات شخصية",
    resumeBody: "محفوظة في هذا المتصفح فقط، منفصلة عن اختيارات Bot. تُستعاد السوق والمنتج والهدف والمسار داخل الموقع، دون بيانات الهوية أو روابط الدعوة أو بيانات حساب Telegram.",
    resume: "متابعة المقارنة السابقة",
    forget: "حذف المقارنة المحفوظة",
  },
  "id": {
    market: "Pasar",
    product: "Produk",
    object: "Jalur",
    resumeEyebrow: "Lanjutkan nanti",
    resumeTitle: "Lanjutkan perbandingan anonim terakhir",
    resumeBody: "Disimpan hanya di browser ini, terpisah dari pilihan Bot. Memulihkan pasar, produk, tujuan dan jalur dalam situs, tanpa identitas, tautan undangan atau data akun Telegram.",
    resume: "Lanjutkan perbandingan terakhir",
    forget: "Hapus perbandingan tersimpan",
  },
};


const anonymousResumeDetailsCopyByLocale = {
  "en": "Saved context and privacy",
  "zh-Hans": "保存的上下文与隐私",
  "zh-Hant": "儲存的情境與隱私",
  "ja": "保存した条件とプライバシー",
  "ko": "저장된 조건과 개인정보",
  "tr": "Kayıtlı bağlam ve gizlilik",
  "es": "Contexto guardado y privacidad",
  "pt-BR": "Contexto salvo e privacidade",
  "fr": "Contexte enregistré et confidentialité",
  "de": "Gespeicherter Kontext und Datenschutz",
  "ru": "Сохранённый контекст и конфиденциальность",
  "ar": "السياق المحفوظ والخصوصية",
  "id": "Konteks tersimpan dan privasi",
  "vi": "Ngữ cảnh đã lưu và quyền riêng tư",
  "it": "Contesto salvato e privacy"
};

const localeKey = (locale) => {
  const normalized = String(locale || "en");
  if (normalized === "zh-Hant") return "zh-Hant";
  if (normalized.startsWith("zh")) return "zh-Hans";
  if (normalized.toLowerCase() === "pt-br") return "pt-BR";
  return normalized.split("-")[0];
};

const copyForLocale = (locale) => copyByLocale[locale] || copyByLocale[localeKey(locale)] || copyByLocale.en;

function browserLocalStorage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function resumeHrefFor(snapshot, locale, fallbackHash) {
  const state = snapshot?.state || {};
  const path = state.pair ? `/compare/${state.pair}` : state.venue ? `/exchanges/${state.venue}` : "/rates";
  const params = Object.fromEntries(buildAnonymousDecisionResumeQuery(state));
  const hash = fallbackHash || "";
  return `${localizedHref(path, { locale, ...params })}${hash}`;
}

function cleanHrefFor(state, fallbackHash) {
  if (typeof window === "undefined") return "";
  const query = state.cleanSearch ? `?${state.cleanSearch}` : "";
  const hash = fallbackHash === undefined ? window.location.hash || "" : fallbackHash;
  return `${window.location.pathname}${query}${hash}`;
}

function formatExpiry(expiresAt, locale) {
  if (!Number.isFinite(Number(expiresAt))) return "";
  try {
    return new Intl.DateTimeFormat(locale || "en", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(Number(expiresAt)));
  } catch {
    return new Date(Number(expiresAt)).toISOString();
  }
}

export function TelegramReturnBanner({
  expectedKind,
  expectedId,
  objectLabel,
  locale = "en",
  market,
  product,
  accountStage,
  funding,
  continueHash = "#top",
}) {
  const [state, setState] = useState(null);
  const [resumeState, setResumeState] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storage = browserLocalStorage();
    const nextState = resolveTelegramReturnBannerState({
      search: window.location.search,
      expectedKind,
      expectedId,
      locale,
      market,
      product,
      accountStage,
      funding,
    });
    setState(nextState);
    if (nextState?.anonymousResume?.state) {
      saveAnonymousDecisionResumeSnapshot(storage, nextState.anonymousResume.state);
    }
    setResumeState(loadAnonymousDecisionResumeSnapshot(storage));
  }, [expectedKind, expectedId, locale, market, product, accountStage, funding]);

  const copy = copyForLocale(locale);
  const cleanHref = useMemo(() => state ? cleanHrefFor(state, continueHash) : "", [state, continueHash]);
  const resumeHref = useMemo(() => resumeState ? resumeHrefFor(resumeState, locale, continueHash) : "", [resumeState, locale, continueHash]);

  if (!state && !resumeState) return null;

  if (!state && resumeState) {
    const localizedResumeCopy = anonymousResumeCopyByLocale[locale] || anonymousResumeCopyByLocale[localeKey(locale)] || anonymousResumeCopyByLocale.en;
    const resumeCopy = {
      eyebrow: localizedResumeCopy.resumeEyebrow,
      title: localizedResumeCopy.resumeTitle,
      body: localizedResumeCopy.resumeBody,
      button: localizedResumeCopy.resume,
      forget: localizedResumeCopy.forget,
    };
    const resume = resumeState.state;
    const clearResume = () => {
      clearAnonymousDecisionResumeSnapshot(browserLocalStorage());
      setResumeState(null);
    };
    return (
      <aside
        className="v3-telegram-return-banner v3-telegram-return-banner--anonymous"
        aria-label={resumeCopy.title}
        data-anonymous-decision-resume="available"
        data-growth-decision="anonymous_decision_resume"
        data-growth-placement="telegram-return-banner"
        data-growth-market={resume.market || market || "GLOBAL"}
        data-growth-product={resume.product || product || "research"}
      >
        <div className="v3-telegram-return-banner__copy">
          <h2>{resumeCopy.title}</h2>
        </div>
        <div className="v3-telegram-return-banner__actions">
          <a
            href={resumeHref}
            className="v3-telegram-return-banner__continue"
            data-cta-kind="research"
            data-cta-placement="anonymous-decision-resume"
            data-growth-decision="anonymous_decision_resume"
            data-growth-placement="telegram-return-banner"
            data-growth-market={resume.market || market || "GLOBAL"}
            data-growth-product={resume.product || product || "research"}
          >
            {resumeCopy.button}
          </a>
          <button
            type="button"
            className="v3-telegram-return-banner__clear"
            onClick={clearResume}
            data-growth-decision="anonymous_decision_resume_clear"
            data-growth-placement="telegram-return-banner"
          >
            {resumeCopy.forget}
          </button>
        </div>
        <details className="v3-anonymous-resume-details">
          <summary>{anonymousResumeDetailsCopyByLocale[locale] || anonymousResumeDetailsCopyByLocale[localeKey(locale)] || anonymousResumeDetailsCopyByLocale.en}</summary>
          <span className="v3-telegram-return-banner__eyebrow">{resumeCopy.eyebrow}</span>
          <p>{resumeCopy.body}</p>
          <dl>
            {resume.market && <div><dt>{localizedResumeCopy.market}</dt><dd translate="no">{resume.market}</dd></div>}
            {resume.product && <div><dt>{localizedResumeCopy.product}</dt><dd translate="no">{resume.product}</dd></div>}
            {(resume.venue || resume.pair || resume.scenario) && <div><dt>{localizedResumeCopy.object}</dt><dd translate="no">{resume.pair || resume.venue || resume.scenario}</dd></div>}
          </dl>
        </details>
      </aside>
    );
  }

  const shownMarket = state.market || market || "GLOBAL";
  const shownProduct = state.product || product || "research";
  const shownObject = objectLabel || state.objectId || expectedId;
  const expiresLabel = formatExpiry(state.expiresAt, locale);

  const clearMarker = () => {
    if (typeof window === "undefined") return;
    window.history.replaceState(window.history.state, "", cleanHrefFor(state, undefined));
    setState(null);
  };

  return (
    <aside
      className="v3-telegram-return-banner"
      aria-label={copy.title}
      data-telegram-return-banner="restored"
      data-telegram-return-kind={state.object.kind}
      data-telegram-return-id={state.objectId}
      data-telegram-return-status={state.status}
    >
      <div className="v3-telegram-return-banner__copy">
        <span className="v3-telegram-return-banner__eyebrow">{copy.eyebrow}</span>
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
        <dl>
          <div><dt>{copy.market}</dt><dd translate="no">{shownMarket}</dd></div>
          <div><dt>{copy.product}</dt><dd translate="no">{shownProduct}</dd></div>
          <div><dt>{copy.object}</dt><dd translate="no">{shownObject}</dd></div>
          {expiresLabel && <div><dt>{copy.expires}</dt><dd><time dateTime={new Date(Number(state.expiresAt)).toISOString()}>{expiresLabel}</time></dd></div>}
        </dl>
      </div>
      <div className="v3-telegram-return-banner__actions">
        <a
          href={cleanHref}
          className="v3-telegram-return-banner__continue"
          data-cta-kind="research"
          data-cta-placement="telegram-return-banner"
          data-growth-decision="telegram_resume"
          data-growth-placement="telegram-return-banner"
          data-growth-market={shownMarket}
          data-growth-product={shownProduct}
        >
          {copy.continue}
        </a>
        <button
          type="button"
          className="v3-telegram-return-banner__clear"
          onClick={clearMarker}
          data-growth-decision="telegram_resume"
          data-growth-placement="telegram-return-banner"
          data-growth-market={shownMarket}
          data-growth-product={shownProduct}
        >
          {copy.clear}
        </button>
      </div>
    </aside>
  );
}

export default TelegramReturnBanner;
