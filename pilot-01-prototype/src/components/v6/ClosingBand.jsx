// V6 act 5: closing band. A large-type statement + next-action CTAs (one line-draw route + a
// word-rise), then the legacy research drawer and CrawlPriorityLinks re-hosted unchanged as a typographic index
// (restyled in src/styles/v6/closing.css). The legacy slot keeps every link in the DOM in its original order.
import { Fragment, useEffect, useRef, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";

const COPY = {
  en: { title: "Pick your route. Then open the account.", lead: "Start from the directory, or put two platforms side by side first. Every sign-up link goes to the official page.", dir: "Browse the directory", cmp: "Compare two platforms", note: "Official sign-up pages only. Affiliate links are disclosed." },
  "zh-Hans": { title: "选好路线，再去开户。", lead: "从平台目录开始，或先把两家平台并排对比。每个注册入口都指向官方页面。", dir: "浏览平台目录", cmp: "对比两家平台", note: "仅链接官方注册页，推广关系已披露。" },
  "zh-Hant": { title: "選好路線，再去開戶。", lead: "從平台目錄開始，或先把兩家平台並排比較。每個註冊入口都指向官方頁面。", dir: "瀏覽平台目錄", cmp: "比較兩家平台", note: "僅連結官方註冊頁，推廣關係已揭露。" },
  ja: { title: "ルートを選んで、口座を開く。", lead: "ディレクトリから始めるか、まず2つのプラットフォームを並べて比較。登録リンクはすべて公式ページに移動します。", dir: "ディレクトリを見る", cmp: "2社を比較する", note: "公式の登録ページのみ。アフィリエイト関係は開示しています。" },
  ko: { title: "경로를 고르고, 계정을 여세요.", lead: "디렉터리에서 시작하거나 두 플랫폼을 먼저 나란히 비교하세요. 모든 가입 링크는 공식 페이지로 연결됩니다.", dir: "디렉터리 보기", cmp: "두 플랫폼 비교", note: "공식 가입 페이지만 연결하며 제휴 관계를 공개합니다." },
  tr: { title: "Rotanı seç, sonra hesabı aç.", lead: "Dizinle başla ya da önce iki platformu yan yana karşılaştır. Tüm kayıt bağlantıları resmî sayfaya gider.", dir: "Dizine göz at", cmp: "İki platformu karşılaştır", note: "Yalnızca resmî kayıt sayfaları. Ortaklık ilişkisi açıkça belirtilir." },
  ru: { title: "Выберите маршрут. Затем откройте счёт.", lead: "Начните с каталога или сначала сравните две платформы. Все ссылки на регистрацию ведут на официальные страницы.", dir: "Открыть каталог", cmp: "Сравнить две платформы", note: "Только официальные страницы регистрации. Партнёрские связи раскрыты." },
  de: { title: "Route wählen. Dann Konto eröffnen.", lead: "Starten Sie im Verzeichnis oder stellen Sie zuerst zwei Plattformen gegenüber. Jeder Anmeldelink führt zur offiziellen Seite.", dir: "Verzeichnis ansehen", cmp: "Zwei Plattformen vergleichen", note: "Nur offizielle Anmeldeseiten. Affiliate-Beziehungen sind offengelegt." },
  fr: { title: "Choisissez la route. Puis ouvrez le compte.", lead: "Commencez par l’annuaire, ou comparez d’abord deux plateformes côte à côte. Chaque lien d’inscription mène à la page officielle.", dir: "Parcourir l’annuaire", cmp: "Comparer deux plateformes", note: "Pages d’inscription officielles uniquement. Les liens d’affiliation sont indiqués." },
  es: { title: "Elige la ruta. Luego abre la cuenta.", lead: "Empieza por el directorio o compara primero dos plataformas lado a lado. Cada enlace de registro lleva a la página oficial.", dir: "Ver el directorio", cmp: "Comparar dos plataformas", note: "Solo páginas de registro oficiales. Los enlaces de afiliado se declaran." },
  "pt-BR": { title: "Escolha a rota. Depois abra a conta.", lead: "Comece pelo diretório ou compare duas plataformas lado a lado. Todo link de cadastro leva à página oficial.", dir: "Ver o diretório", cmp: "Comparar duas plataformas", note: "Apenas páginas oficiais de cadastro. Links de afiliado são divulgados." },
  it: { title: "Scegli la rotta. Poi apri il conto.", lead: "Parti dalla directory o confronta prima due piattaforme fianco a fianco. Ogni link di registrazione porta alla pagina ufficiale.", dir: "Sfoglia la directory", cmp: "Confronta due piattaforme", note: "Solo pagine di registrazione ufficiali. I link di affiliazione sono dichiarati." },
  id: { title: "Pilih rutenya. Lalu buka akun.", lead: "Mulai dari direktori, atau bandingkan dua platform berdampingan lebih dulu. Setiap tautan pendaftaran mengarah ke halaman resmi.", dir: "Lihat direktori", cmp: "Bandingkan dua platform", note: "Hanya halaman pendaftaran resmi. Tautan afiliasi diungkapkan." },
  vi: { title: "Chọn lộ trình. Rồi mở tài khoản.", lead: "Bắt đầu từ danh bạ, hoặc đặt hai nền tảng cạnh nhau trước. Mọi liên kết đăng ký đều dẫn tới trang chính thức.", dir: "Xem danh bạ", cmp: "So sánh hai nền tảng", note: "Chỉ trang đăng ký chính thức. Liên kết tiếp thị liên kết được công khai." },
  ar: { title: "اختر المسار. ثم افتح الحساب.", lead: "ابدأ من الدليل، أو قارن منصتين جنبًا إلى جنب أولًا. كل رابط تسجيل يقود إلى الصفحة الرسمية.", dir: "تصفّح الدليل", cmp: "قارن بين منصتين", note: "صفحات التسجيل الرسمية فقط. علاقات الإحالة معلنة." },
};

// The two next-step CTAs are GET forms, not anchors: they work without JS and keep the page's crawlable <a href> set
// identical to production (those destinations already link from the header, footer and the index below).
function GoForm({ href, className, children }) {
  const u = new URL(href, "https://nexualpha.com");
  return <form className="v6-close__form" action={u.pathname} method="get">
    {[...u.searchParams].map(([k, v]) => <input type="hidden" name={k} value={v} key={k} />)}
    <button type="submit" className={className}>{children}</button>
  </form>;
}

export function ClosingBand({ legacy, locale = "en" }) {
  const t = COPY[locale] || COPY.en;
  const ref = useRef(null);
  const [phase, setPhase] = useState("idle"); // idle (SSR: all visible) -> armed (hidden) -> in (revealed)
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    // Server HTML and no-JS stay fully visible. After mount the band is armed (paper sheet covered) and the reveal plays when
    // the band is actually scrolled to: a visible wipe plus the headline rise. If IO somehow never reports, a scroll check does.
    const open = () => { setPhase("in"); io.disconnect(); window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
    const check = () => { const r = el.getBoundingClientRect(); if (r.top < window.innerHeight * 0.85 && r.bottom > 0) open(); };
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) open(); }, { threshold: 0.2 });
    io.observe(el);
    setPhase("armed");
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    const t = window.setTimeout(check, 400);
    return () => { window.clearTimeout(t); io.disconnect(); window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, []);
  // CJK has no spaces: rise per clause (never per glyph, so kinsoku line breaking stays intact).
  const cjk = /^(zh|ja)/.test(locale);
  // Two display lines: the first sentence, then the follow-up. Words (or CJK clauses) rise one by one.
  const lines = t.title.split(/(?<=[.。])\s*/).filter(Boolean);
  let n = 0;
  return <section className="v6-close" data-phase={phase} aria-labelledby="v6-close-title">
    <div className="v6-close__band">
    <div className="v6-close__stage" ref={ref}>
      <h2 id="v6-close-title" className="v6-close__title" data-len={t.title.length > 34 ? "long" : "short"} aria-label={t.title}>
        {lines.map((line, li) => <span className="v6-close__line" aria-hidden="true" key={li}>{(cjk ? line.split(/(?<=[、，])/) : line.split(" ")).map((w, i, arr) => <Fragment key={i}><span className="v6-close__w"><span style={{ "--i": n++ }}>{w}</span></span>{cjk || i === arr.length - 1 ? "" : " "}</Fragment>)}</span>)}
      </h2>
      <p className="v6-lead v6-close__lead">{t.lead}</p>
      <div className="v6-close__go">
        <svg className="v6-close__route" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path className="track" d="M0 34 H150 C190 34 190 20 230 20 H594" />
          <path className="draw" d="M0 34 H150 C190 34 190 20 230 20 H594" />
        </svg>
        <GoForm href={localizedHref("/exchanges", { locale })} className="btn btn-primary v6-close__cta">{t.dir}<i className="v6-arrow" aria-hidden="true" /></GoForm>
        <GoForm href={localizedHref("/compare/binance-vs-okx", { locale })} className="v6-close__alt"><span>{t.cmp}</span><i className="v6-arrow" aria-hidden="true" /></GoForm>
      </div>
      <p className="v6-small v6-close__note">{t.note}</p>
    </div>
    </div>
    <div className="v6-close__index v6-wrap">{legacy}</div>
  </section>;
}
