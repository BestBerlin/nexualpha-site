/**
 * LiveConversionProof — clearly labelled example decision paths.
 * This component does not claim to represent live users or conversions.
 */
import React, { useState, useEffect, useRef } from "react";
import "./live-conversion-proof.css";

const MOCK_EVENTS = {
  "zh-Hans": [
    { city: "香港 (HK)", trader: "示例路径", action: "核对 OKX 官方账户条件", perk: "用户权益待官方核验", time: "示例", avatar: "🇭🇰" },
    { city: "新加坡 (SG)", trader: "示例路径", action: "核对 Binance 官方域名与来源", perk: "费率与资格以官方页面为准", time: "示例", avatar: "🇸🇬" },
    { city: "台北 (TW)", trader: "示例路径", action: "比较 Bybit 的公开费率与准入条件", perk: "奖励与期限需逐项核对", time: "示例", avatar: "🇹🇼" },
    { city: "吉隆坡 (MY)", trader: "示例路径", action: "查看 Bitget 合约账户要求", perk: "地区与 KYC 条件待核验", time: "示例", avatar: "🇲🇾" },
    { city: "东京 (JP)", trader: "示例路径", action: "审阅 Hyperliquid 链上产品文档", perk: "执行与费用条件以官方为准", time: "示例", avatar: "🇯🇵" },
  ],
  "zh-Hant": [
    { city: "香港 (HK)", trader: "示例路徑", action: "核對 OKX 官方帳戶條件", perk: "用戶權益待官方核驗", time: "示例", avatar: "🇭🇰" },
    { city: "新加坡 (SG)", trader: "示例路徑", action: "核對 Binance 官方網域與來源", perk: "費率與資格以官方頁面為準", time: "示例", avatar: "🇸🇬" },
    { city: "台北 (TW)", trader: "示例路徑", action: "比較 Bybit 公開費率與准入條件", perk: "獎勵與期限需逐項核對", time: "示例", avatar: "🇹🇼" },
    { city: "吉隆坡 (MY)", trader: "示例路徑", action: "查看 Bitget 合約帳戶要求", perk: "地區與 KYC 條件待核驗", time: "示例", avatar: "🇲🇾" },
    { city: "東京 (JP)", trader: "示例路徑", action: "審閱 Hyperliquid 鏈上產品文件", perk: "執行與費用條件以官方為準", time: "示例", avatar: "🇯🇵" },
  ],
  en: [
    { city: "London (UK)", trader: "Example path", action: "Review OKX account and region terms", perk: "User benefits require official verification", time: "Example", avatar: "🇬🇧" },
    { city: "Singapore (SG)", trader: "Example path", action: "Verify Binance official domain and fees", perk: "Eligibility depends on the official account", time: "Example", avatar: "🇸🇬" },
    { city: "Dubai (UAE)", trader: "Example path", action: "Compare Bybit access and product terms", perk: "Rewards and deadlines require verification", time: "Example", avatar: "🇦🇪" },
    { city: "Zurich (CH)", trader: "Example path", action: "Review Bitget futures requirements", perk: "Maker fees depend on current account terms", time: "Example", avatar: "🇨🇭" },
    { city: "Tokyo (JP)", trader: "Example path", action: "Read Hyperliquid L1 product documentation", perk: "Execution conditions follow official terms", time: "Example", avatar: "🇯🇵" },
  ],
};

MOCK_EVENTS.ja = MOCK_EVENTS.en.map((event, index) => ({
  ...event,
  trader: "例示パス",
  time: "例",
  action: ["OKXの口座・地域条件を確認", "Binanceの公式ドメインと手数料を確認", "Bybitのアクセス条件を比較", "Bitget先物の要件を確認", "Hyperliquidの公式ドキュメントを確認"][index],
  perk: ["ユーザー向け条件は公式確認が必要", "適用条件は公式アカウントで確認", "特典と期限は要確認", "地域とKYC条件は確認待ち", "実行条件は公式規約に従います"][index],
}));
MOCK_EVENTS.ko = MOCK_EVENTS.en.map((event, index) => ({
  ...event,
  trader: "예시 경로",
  time: "예시",
  action: ["OKX 계정 및 지역 조건 확인", "Binance 공식 도메인과 수수료 확인", "Bybit 접근 및 상품 조건 비교", "Bitget 선물 요건 확인", "Hyperliquid 공식 문서 확인"][index],
  perk: ["사용자 혜택은 공식 확인 필요", "자격은 공식 계정에 따라 결정", "보상과 기한은 확인 필요", "지역 및 KYC 조건 확인 대기", "실행 조건은 공식 약관을 따릅니다"][index],
}));
MOCK_EVENTS.tr = MOCK_EVENTS.en.map((event, index) => ({
  ...event,
  trader: "Örnek yol",
  time: "Örnek",
  action: ["OKX hesap ve bölge koşullarını incele", "Binance resmi alan adı ve ücretlerini doğrula", "Bybit erişim ve ürün koşullarını karşılaştır", "Bitget vadeli işlem gereksinimlerini incele", "Hyperliquid resmi belgelerini incele"][index],
  perk: ["Kullanıcı koşulları resmi doğrulama gerektirir", "Uygunluk resmi hesaba bağlıdır", "Ödüller ve son tarihler doğrulanmalıdır", "Bölge ve KYC koşulları beklemede", "İşlem koşulları resmi şartlara bağlıdır"][index],
}));

const localizedExampleEvents = {
  es: ["Ruta de ejemplo", "Ejemplo", ["Revisar las condiciones de cuenta y región de OKX", "Verificar el dominio oficial y las comisiones de Binance", "Comparar el acceso y producto de Bybit", "Revisar los requisitos de futuros de Bitget", "Consultar la documentación oficial de Hyperliquid"], "Las condiciones del usuario requieren verificación oficial"],
  "pt-BR": ["Caminho de exemplo", "Exemplo", ["Revisar condições de conta e região da OKX", "Verificar domínio oficial e taxas da Binance", "Comparar acesso e produto da Bybit", "Revisar requisitos de futuros da Bitget", "Consultar documentação oficial da Hyperliquid"], "Condições do usuário exigem confirmação oficial"],
  fr: ["Parcours illustratif", "Exemple", ["Vérifier les conditions de compte et de région d’OKX", "Vérifier le domaine officiel et les frais de Binance", "Comparer l’accès et le produit de Bybit", "Vérifier les exigences futures de Bitget", "Lire la documentation officielle d’Hyperliquid"], "Les conditions utilisateur doivent être vérifiées officiellement"],
  de: ["Beispielpfad", "Beispiel", ["OKX-Konto- und Regionsbedingungen prüfen", "Offizielle Binance-Domain und Gebühren prüfen", "Bybit-Zugang und Produktbedingungen vergleichen", "Bitget-Futures-Anforderungen prüfen", "Offizielle Hyperliquid-Dokumentation lesen"], "Nutzerbedingungen müssen offiziell geprüft werden"],
  ru: ["Пример пути", "Пример", ["Проверить условия аккаунта и региона OKX", "Проверить официальный домен и комиссии Binance", "Сравнить доступ и продукт Bybit", "Проверить требования к фьючерсам Bitget", "Открыть официальную документацию Hyperliquid"], "Условия пользователя требуют проверки у источника"],
  ar: ["مسار توضيحي", "مثال", ["راجع شروط حساب ومنطقة OKX", "تحقق من نطاق ورسوم Binance الرسميين", "قارن الوصول والمنتج لدى Bybit", "راجع متطلبات عقود Bitget", "اقرأ وثائق Hyperliquid الرسمية"], "يجب التحقق من شروط المستخدم رسمياً"],
  id: ["Jalur contoh", "Contoh", ["Tinjau syarat akun dan wilayah OKX", "Verifikasi domain resmi dan biaya Binance", "Bandingkan akses dan produk Bybit", "Tinjau persyaratan futures Bitget", "Baca dokumentasi resmi Hyperliquid"], "Ketentuan pengguna harus diverifikasi resmi"],
  vi: ["Lộ trình minh họa", "Ví dụ", ["Kiểm tra điều kiện tài khoản và khu vực OKX", "Xác minh tên miền chính thức và phí Binance", "So sánh quyền truy cập và sản phẩm Bybit", "Kiểm tra yêu cầu futures Bitget", "Đọc tài liệu chính thức của Hyperliquid"], "Điều kiện người dùng cần được xác minh chính thức"],
  it: ["Percorso illustrativo", "Esempio", ["Verifica condizioni di account e regione OKX", "Verifica dominio ufficiale e commissioni Binance", "Confronta accesso e prodotto Bybit", "Verifica requisiti futures Bitget", "Leggi la documentazione ufficiale Hyperliquid"], "Le condizioni utente richiedono verifica ufficiale"],
  // l10n: needs native review
  ur: ["مثالی راستہ", "مثال", ["OKX کے اکاؤنٹ اور علاقے کی شرائط دیکھیں", "Binance کے سرکاری ڈومین اور فیس کی تصدیق کریں", "Bybit تک رسائی اور مصنوعات کا موازنہ کریں", "Bitget کے فیوچرز کی شرائط دیکھیں", "Hyperliquid کی سرکاری دستاویزات پڑھیں"], "صارف کی شرائط کی سرکاری تصدیق ضروری ہے"],
  // l10n: needs native review
  uk: ["Приклад маршруту", "Приклад", ["Перевірити умови акаунта й регіону OKX", "Перевірити офіційний домен і комісії Binance", "Порівняти доступ і продукти Bybit", "Переглянути вимоги ф’ючерсів Bitget", "Читати офіційну документацію Hyperliquid"], "Умови користувача потребують офіційної перевірки"],
};
for (const [locale, [trader, time, actions, perk]] of Object.entries(localizedExampleEvents)) {
  MOCK_EVENTS[locale] = MOCK_EVENTS.en.map((event, index) => ({ ...event, trader, time, action: actions[index], perk }));
}

const examplePlaybackCopy = {
  en: ["Play examples", "Pause examples"],
  "zh-Hans": ["播放示例", "暂停示例"],
  "zh-Hant": ["播放示例路徑", "暫停示例路徑"],
  ja: ["例を再生", "例を一時停止"],
  ko: ["예시 재생", "예시 일시 정지"],
  tr: ["Örnekleri oynat", "Örnekleri duraklat"],
  es: ["Reproducir ejemplos", "Pausar ejemplos"],
  "pt-BR": ["Reproduzir exemplos", "Pausar exemplos"],
  fr: ["Lire les exemples", "Mettre en pause"],
  de: ["Beispiele abspielen", "Beispiele pausieren"],
  ru: ["Воспроизвести примеры", "Приостановить примеры"],
  ar: ["تشغيل الأمثلة", "إيقاف الأمثلة مؤقتاً"],
  id: ["Putar contoh", "Jeda contoh"],
  vi: ["Phát ví dụ", "Tạm dừng ví dụ"],
  it: ["Riproduci esempi", "Metti in pausa"],

 // l10n: needs native review
 ur: ["مثالیں چلائیں","مثالیں روکیں"],
 // l10n: needs native review
 uk: ["Відтворити приклади","Призупинити приклади"],
};

export function LiveConversionProof({ locale = "en" }) {
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const events = MOCK_EVENTS[locale] || (isHant ? MOCK_EVENTS["zh-Hant"] : isZh ? MOCK_EVENTS["zh-Hans"] : MOCK_EVENTS.en);
  // l10n: needs native review
  const exampleLabel = locale === "ur" ? "مثالی فیصلہ کرنے کا راستہ · کسی صارف کی حقیقی کارروائی نہیں" : locale === "uk" ? "Приклад шляху рішення · не справжня подія користувача" : locale === "ja" ? "例示の判断パス · 実際のユーザーイベントではありません" : locale === "ko" ? "예시 의사결정 경로 · 실제 사용자 이벤트가 아닙니다" : locale === "tr" ? "Örnek karar yolu · gerçek kullanıcı olayı değildir" : locale === "ru" ? "Пример пути · не реальное событие пользователя" : locale === "es" ? "Ruta de ejemplo · no es un evento real de usuario" : locale === "de" ? "Beispielpfad · kein echtes Nutzerereignis" : locale === "fr" ? "Parcours illustratif · pas un événement utilisateur réel" : locale === "pt-BR" ? "Caminho ilustrativo · não é um evento real de usuário" : locale === "ar" ? "مسار توضيحي · ليس حدثاً حقيقياً لمستخدم" : locale === "id" ? "Jalur ilustratif · bukan peristiwa pengguna nyata" : locale === "vi" ? "Lộ trình minh họa · không phải sự kiện người dùng thật" : locale === "it" ? "Percorso illustrativo · non è un evento utente reale" : isHant ? "示例決策路徑 · 非即時用戶事件" : isZh ? "示例决策路径 · 非实时用户事件" : "Illustrative decision path · not a live user event";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const [paused, setPaused] = useState(true);
  const stopPlaybackRef = useRef(() => {});
  const previousLocaleRef = useRef(locale);
  const playbackCopy = examplePlaybackCopy[locale] || (isHant ? examplePlaybackCopy["zh-Hant"] : isZh ? examplePlaybackCopy["zh-Hans"] : examplePlaybackCopy.en);
  const pausePlayback = () => {
    stopPlaybackRef.current();
    setPaused(true);
  };

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileLayout = window.matchMedia("(max-width: 780px)");
    const shortLayout = window.matchMedia("(max-height: 500px)");
    let interval = null;
    let timeout = null;
    let active = true;
    const localeChanged = previousLocaleRef.current !== locale;
    previousLocaleRef.current = locale;
    let permitted = !paused && !localeChanged;
    if (localeChanged) {
      setCurrentIndex(0);
      setPaused(true);
    }
    const stop = () => {
      clearInterval(interval);
      clearTimeout(timeout);
      interval = null;
      timeout = null;
    };
    const cancelPlayback = () => {
      permitted = false;
      stop();
      setVisible(true);
    };
    stopPlaybackRef.current = cancelPlayback;
    const sync = () => {
      stop();
      setVisible(true);
      if (motionPreference.matches) {
        setCurrentIndex(0);
      }
      if (motionPreference.matches || mobileLayout.matches || shortLayout.matches || document.hidden) {
        permitted = false;
        setPaused(true);
        return;
      }
      if (!permitted || events.length < 2) return;
      interval = setInterval(() => {
        setVisible(false);
        timeout = setTimeout(() => {
          timeout = null;
          if (!active || !permitted || mobileLayout.matches || shortLayout.matches || document.hidden || motionPreference.matches) return;
          setCurrentIndex((prev) => (prev + 1) % events.length);
          setVisible(true);
        }, 400);
      }, 4500);
    };
    const watchMedia = (query) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", sync);
        return () => query.removeEventListener("change", sync);
      }
      query.addListener(sync);
      return () => query.removeListener(sync);
    };
    const unwatchMotion = watchMedia(motionPreference);
    const unwatchLayout = watchMedia(mobileLayout);
    const unwatchHeight = watchMedia(shortLayout);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      active = false;
      if (stopPlaybackRef.current === cancelPlayback) stopPlaybackRef.current = () => {};
      stop();
      unwatchMotion();
      unwatchLayout();
      unwatchHeight();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [events, locale, paused]);

  const event = events[currentIndex] || events[0];

  return (
    <aside
      className="conversion-proof-toast conversion-proof-toast--in"
      aria-live="off"
      onPointerEnter={pausePlayback}
      onFocusCapture={pausePlayback}
      aria-label={exampleLabel}
    >
      <div className="conversion-proof__avatar">{event.avatar}</div>
      <div className="conversion-proof__content">
        <div className={`conversion-proof__example ${visible ? "conversion-proof__example--in" : "conversion-proof__example--out"}`}>
        <div className="conversion-proof__label">{exampleLabel}</div>
        <div className="conversion-proof__header">
            <span className="conversion-proof__user">{event.city} · {event.trader}</span>
          <span className="conversion-proof__time">{event.time}</span>
        </div>
        <p className="conversion-proof__action">{event.action}</p>
        <span className="conversion-proof__perk">{event.perk}</span>
        </div>
        <button
          type="button"
          className="conversion-proof__control"
          aria-pressed={!paused}
          onClick={() => paused ? setPaused(false) : pausePlayback()}
        >
          {playbackCopy[paused ? 0 : 1]}
        </button>
      </div>
      <span className="conversion-proof__pulse" aria-hidden="true"></span>
    </aside>
  );
}

export default LiveConversionProof;
