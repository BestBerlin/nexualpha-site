// Live exchange campaigns (owner 2026-10-10): sign-up drives, airdrops, trading competitions and launch events,
// read from the exchanges' own announcement feeds (category "event"), plus owner-curated campaigns. Every card links
// the official campaign page and that exchange's sign-up with our invite code; the commission disclosure sits with
// the list. Nothing is invented: no feed, no cards.
import React, { useEffect, useMemo, useState } from "react";
import { SectionRule } from "../../shared/DataRule.jsx";
import { BrandMark } from "../../brand/BrandMark.jsx";
import { publicCtaForVenue } from "../../../data/source-bound-cta.js";
import { ownerRebateLine } from "../../../data/owner-rebate-line.js";
import { activeOwnerCampaigns } from "../../../data/owner-campaigns.js";
import { CommissionDisclosureLine } from "../CommissionDisclosureLine.jsx";
import { GROUP_PREVIEW_COUNT, showAllCopy } from "./show-all-copy.js";
import "./live-campaigns.css";

// Official announcement rows arrive in English from the exchanges' feeds; owner campaigns carry their own locale editions.
const feedLang = (item, locale) => (!item.featured && !/^en(?:-|$)/i.test(String(locale || "en")) ? "en" : undefined);

const FEED = "/intel/official-announcements.json";
const NAMES = { okx: "OKX", bitget: "Bitget", binance: "Binance", bybit: "Bybit", kucoin: "KuCoin", kraken: "Kraken", "gate-io": "Gate.io", hyperliquid: "Hyperliquid", mexc: "MEXC", htx: "HTX" };
const COPY = {
  en: { h: "Live exchange campaigns", sub: "Sign-up drives, airdrops and trading competitions from each exchange's official announcements, updated every 15 minutes.", all: "All", featured: "Featured", details: "Official details", join: (n) => `Join via ${n} sign-up`, empty: "No campaigns from these exchanges right now.", loading: "Loading campaigns…", failed: "Campaigns could not be loaded. Check each exchange's official page.", note: "Terms, eligibility and regions are set by each exchange; read them on the official page before joining." },
  "zh-Hans": { h: "交易所实时活动", sub: "注册活动、空投与交易赛，来自各交易所官方公告，每 15 分钟更新。", all: "全部", featured: "精选", details: "官方活动详情", join: (n) => `注册 ${n} 参加`, empty: "这些交易所暂时没有活动。", loading: "正在加载活动…", failed: "活动暂时无法加载，请到各交易所官方页面查看。", note: "活动规则、参与资格和适用地区以交易所官方页面为准，参加前请先阅读。" },
  "zh-Hant": { h: "交易所即時活動", sub: "註冊活動、空投與交易賽，來自各交易所官方公告，每 15 分鐘更新。", all: "全部", featured: "精選", details: "官方活動詳情", join: (n) => `註冊 ${n} 參加`, empty: "這些交易所暫時沒有活動。", loading: "正在載入活動…", failed: "活動暫時無法載入，請到各交易所官方頁面查看。", note: "活動規則、參與資格和適用地區以交易所官方頁面為準，參加前請先閱讀。" },
  ja: { h: "取引所の最新キャンペーン", sub: "登録キャンペーン、エアドロップ、取引大会。各取引所の公式告知から15分ごとに更新。", all: "すべて", featured: "注目", details: "公式の詳細", join: (n) => `${n} に登録して参加`, empty: "現在キャンペーンはありません。", loading: "読み込み中…", failed: "読み込めませんでした。各取引所の公式ページをご確認ください。", note: "規約・対象・地域は各取引所が定めます。参加前に公式ページをご確認ください。" },
  ko: { h: "거래소 실시간 이벤트", sub: "가입 이벤트, 에어드롭, 트레이딩 대회. 각 거래소 공식 공지에서 15분마다 갱신.", all: "전체", featured: "추천", details: "공식 상세", join: (n) => `${n} 가입 후 참여`, empty: "현재 이벤트가 없습니다.", loading: "불러오는 중…", failed: "불러오지 못했습니다. 각 거래소 공식 페이지를 확인하세요.", note: "조건·자격·지역은 각 거래소가 정합니다. 참여 전 공식 페이지를 확인하세요." },
  tr: { h: "Borsalarda güncel kampanyalar", sub: "Kayıt kampanyaları, airdrop'lar ve yarışmalar; borsaların resmî duyurularından, 15 dakikada bir.", all: "Tümü", featured: "Öne çıkan", details: "Resmî ayrıntılar", join: (n) => `${n} kaydıyla katıl`, empty: "Şu an kampanya yok.", loading: "Yükleniyor…", failed: "Yüklenemedi. Borsaların resmî sayfasına bakın.", note: "Koşullar, uygunluk ve bölgeler borsa tarafından belirlenir; katılmadan önce resmî sayfayı okuyun." },
  es: { h: "Campañas activas de exchanges", sub: "Registros con bono, airdrops y competiciones, de los anuncios oficiales de cada exchange, cada 15 minutos.", all: "Todas", featured: "Destacada", details: "Detalles oficiales", join: (n) => `Únete con registro en ${n}`, empty: "No hay campañas ahora.", loading: "Cargando…", failed: "No se pudieron cargar. Consulta la página oficial de cada exchange.", note: "Condiciones, elegibilidad y regiones las fija cada exchange; léelas en la página oficial antes de participar." },
  "pt-BR": { h: "Campanhas ativas das corretoras", sub: "Cadastros com bônus, airdrops e competições, dos anúncios oficiais de cada corretora, a cada 15 minutos.", all: "Todas", featured: "Destaque", details: "Detalhes oficiais", join: (n) => `Participe pelo cadastro na ${n}`, empty: "Sem campanhas no momento.", loading: "Carregando…", failed: "Não foi possível carregar. Veja a página oficial de cada corretora.", note: "Regras, elegibilidade e regiões são definidas por cada corretora; leia a página oficial antes de participar." },
  fr: { h: "Campagnes en cours des plateformes", sub: "Bonus d’inscription, airdrops et compétitions, depuis les annonces officielles, toutes les 15 minutes.", all: "Toutes", featured: "À la une", details: "Détails officiels", join: (n) => `Participer via l’inscription ${n}`, empty: "Aucune campagne pour l’instant.", loading: "Chargement…", failed: "Chargement impossible. Consultez la page officielle de chaque plateforme.", note: "Conditions, éligibilité et régions sont fixées par chaque plateforme ; lisez la page officielle avant de participer." },
  de: { h: "Aktuelle Börsenaktionen", sub: "Anmeldeboni, Airdrops und Trading-Wettbewerbe aus den offiziellen Meldungen, alle 15 Minuten.", all: "Alle", featured: "Empfohlen", details: "Offizielle Details", join: (n) => `Über ${n}-Registrierung teilnehmen`, empty: "Derzeit keine Aktionen.", loading: "Lädt…", failed: "Laden fehlgeschlagen. Bitte die offizielle Seite der Börse prüfen.", note: "Bedingungen, Berechtigung und Regionen legt jede Börse fest; vor der Teilnahme die offizielle Seite lesen." },
  ru: { h: "Актуальные акции бирж", sub: "Бонусы за регистрацию, аирдропы и конкурсы из официальных объявлений, каждые 15 минут.", all: "Все", featured: "Избранное", details: "Официальные условия", join: (n) => `Участвовать через регистрацию на ${n}`, empty: "Сейчас акций нет.", loading: "Загрузка…", failed: "Не удалось загрузить. Смотрите официальную страницу биржи.", note: "Условия, допуск и регионы определяет биржа; прочитайте официальную страницу перед участием." },
  ar: { h: "حملات المنصات الجارية", sub: "مكافآت التسجيل والإسقاطات الجوية والمسابقات من الإعلانات الرسمية، كل 15 دقيقة.", all: "الكل", featured: "مميز", details: "التفاصيل الرسمية", join: (n) => `شارك عبر التسجيل في ${n}`, empty: "لا توجد حملات الآن.", loading: "جارٍ التحميل…", failed: "تعذر التحميل. راجع الصفحة الرسمية لكل منصة.", note: "تحدد كل منصة الشروط والأهلية والمناطق؛ اقرأ الصفحة الرسمية قبل المشاركة." },
  id: { h: "Kampanye bursa terbaru", sub: "Bonus pendaftaran, airdrop, dan kompetisi dari pengumuman resmi, tiap 15 menit.", all: "Semua", featured: "Unggulan", details: "Detail resmi", join: (n) => `Ikut lewat pendaftaran ${n}`, empty: "Belum ada kampanye.", loading: "Memuat…", failed: "Gagal memuat. Cek halaman resmi bursa.", note: "Syarat, kelayakan, dan wilayah ditentukan bursa; baca halaman resmi sebelum ikut." },
  vi: { h: "Sự kiện sàn đang diễn ra", sub: "Thưởng đăng ký, airdrop và giải giao dịch từ thông báo chính thức, cập nhật mỗi 15 phút.", all: "Tất cả", featured: "Nổi bật", details: "Chi tiết chính thức", join: (n) => `Tham gia qua đăng ký ${n}`, empty: "Hiện chưa có sự kiện.", loading: "Đang tải…", failed: "Không tải được. Xem trang chính thức của sàn.", note: "Điều khoản, điều kiện và khu vực do sàn quy định; hãy đọc trang chính thức trước khi tham gia." },
  it: { h: "Campagne in corso degli exchange", sub: "Bonus di iscrizione, airdrop e competizioni dagli annunci ufficiali, ogni 15 minuti.", all: "Tutte", featured: "In evidenza", details: "Dettagli ufficiali", join: (n) => `Partecipa con l’iscrizione a ${n}`, empty: "Nessuna campagna al momento.", loading: "Caricamento…", failed: "Impossibile caricare. Controlla la pagina ufficiale dell’exchange.", note: "Termini, idoneità e regioni li stabilisce l’exchange; leggi la pagina ufficiale prima di partecipare." },
};
const copyFor = (locale) => COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);
const pick = (v, locale) => (v && typeof v === "object" ? v[locale] || (String(locale).startsWith("zh") ? v["zh-Hans"] : null) || v.en : v);

// `initialFeed` is the worker's request-time snapshot (prerender state `officialAnnouncements`): the server renders the
// same cards the browser would, and the client refresh below only replaces them with newer rows of the same shape.
function useCampaignFeed(initialFeed) {
  const [state, setState] = useState(() => ({ items: Array.isArray(initialFeed?.items) ? initialFeed.items : null, failed: false }));
  useEffect(() => {
    let alive = true;
    const load = () => fetch(FEED, { headers: { accept: "application/json" }, cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : Promise.reject())).then((j) => { if (alive) setState({ items: Array.isArray(j?.items) ? j.items : [], failed: false }); })
      .catch(() => { if (alive) setState((s) => ({ items: s.items, failed: !s.items })); });
    load();
    const id = setInterval(() => { if (document.visibilityState === "visible") load(); }, 5 * 60 * 1000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return state;
}

function route(slug, locale) {
  const cta = publicCtaForVenue(slug, locale);
  return cta?.hasReferral && /^https:\/\//i.test(cta.registrationUrl || "") ? cta : null;
}

export function LiveCampaigns({ locale = "en", initialFeed }) {
  const t = copyFor(locale);
  const { items, failed } = useCampaignFeed(initialFeed);
  const [venue, setVenue] = useState("all");
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const toggleGroup = (slug) => setOpenGroups((current) => { const next = new Set(current); if (next.has(slug)) next.delete(slug); else next.add(slug); return next; });
  const rtf = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" }), [locale]);
  const ago = (iso) => { const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000)); return m < 60 ? rtf.format(-m, "minute") : m < 1440 ? rtf.format(-Math.round(m / 60), "hour") : rtf.format(-Math.round(m / 1440), "day"); };

  const featured = activeOwnerCampaigns().map((c) => ({ id: `owner:${c.id}`, venue: c.venue, title: pick(c.title, locale), summary: pick(c.summary, locale), url: c.url, publishedAt: c.startAt || c.checkedAt, endAt: c.endAt, featured: true }));
  const events = (items || []).filter((i) => i.category === "event" && Date.now() - Date.parse(i.publishedAt) < 30 * 864e5);
  const all = [...featured, ...events];
  const venues = [...new Set(all.map((c) => c.venue))];
  // Grouped by exchange (owner 2026-10-10): every card is rendered; a group shows three and folds the rest behind
  // "Show all (n)", so one exchange's batch never hides the others. The chips narrow the list to one exchange.
  const shown = venue === "all" ? all : all.filter((c) => c.venue === venue);
  const groups = venues.filter((v) => venue === "all" || v === venue).map((v) => ({ venue: v, items: shown.filter((c) => c.venue === v) })).filter((g) => g.items.length);

  return (
    <section className="live-campaigns" aria-labelledby="live-campaigns-h">
      <SectionRule />
      <header className="live-campaigns__head">
        <h2 id="live-campaigns-h">{t.h}</h2>
        <p>{t.sub}</p>
      </header>
      {venues.length > 1 && (
        <div className="live-campaigns__chips" role="tablist" aria-label={t.h}>
          {["all", ...venues].map((v) => <button key={v} type="button" role="tab" aria-selected={venue === v} className={venue === v ? "is-on" : undefined} onClick={() => setVenue(v)}>{v === "all" ? t.all : NAMES[v] || v}</button>)}
        </div>
      )}
      {/* No feed yet (assets-only host or feed down): a fixed-height placeholder the size of one group of three cards, so the
          research section, notes and disclosure below do not move when the client inserts the real cards. */}
      {!items && !featured.length && (
        <section className="live-campaigns__group live-campaigns__group--skeleton" data-campaign-group="skeleton" aria-busy={!failed} role="status">
          <p className="live-campaigns__state live-campaigns__state--inline">{failed ? t.failed : t.loading}</p>
          <ul className="live-campaigns__list" aria-hidden="true">
            {Array.from({ length: GROUP_PREVIEW_COUNT }, (_, index) => (
              <li key={`skeleton-${index}`} className="live-campaigns__card live-campaigns__card--skeleton">
                <span className="live-campaigns__skeleton-line live-campaigns__skeleton-line--meta" />
                <span className="live-campaigns__skeleton-line live-campaigns__skeleton-line--title" />
                <span className="live-campaigns__skeleton-line" />
                <span className="live-campaigns__skeleton-line live-campaigns__skeleton-line--action" />
              </li>
            ))}
          </ul>
        </section>
      )}
      {items && !shown.length && <p className="live-campaigns__state">{t.empty}</p>}
      {groups.map((group) => {
        const expanded = openGroups.has(group.venue) || group.items.length <= GROUP_PREVIEW_COUNT;
        const labels = showAllCopy(locale, group.items.length);
        return (
        <section key={group.venue} className="live-campaigns__group" data-campaign-group={group.venue} data-expanded={expanded ? "true" : "false"}>
          <h3 className="live-campaigns__group-head"><BrandMark slug={group.venue} compact /><b>{NAMES[group.venue] || group.venue}</b><span>{group.items.length}</span></h3>
        <ul className="live-campaigns__list">
          {group.items.map((c, itemIndex) => {
            const cta = route(c.venue, locale);
            const name = NAMES[c.venue] || c.venue;
            const terms = cta ? ownerRebateLine(c.venue, locale, name) : null;
            return (
              <li key={c.id} className={`live-campaigns__card${c.featured ? " is-featured" : ""}`} data-group-overflow={itemIndex >= GROUP_PREVIEW_COUNT ? "true" : undefined}>
                <div className="live-campaigns__meta">
                  <BrandMark slug={c.venue} compact />
                  <b>{name}</b>
                  {c.featured && <span className="live-campaigns__tag">{t.featured}</span>}
                  {/* Relative time depends on the clock and the ICU build; the server text may differ by a minute. */}
                  {c.publishedAt && <time dateTime={c.publishedAt} suppressHydrationWarning>{ago(c.publishedAt)}</time>}
                </div>
                {/* Feed rows are the exchanges' own English announcement titles (data): marked lang="en" on other pages. */}
                <h4 dir="auto" lang={feedLang(c, locale)}>{c.title}</h4>
                {c.summary && <p className="live-campaigns__sum" lang={feedLang(c, locale)}>{c.summary}</p>}
                <div className="live-campaigns__acts">
                  <a className="live-campaigns__details" href={c.url} target="_blank" rel="noopener noreferrer nofollow">{t.details} ↗</a>
                  {cta && (
                    <a className="live-campaigns__join" href={cta.registrationUrl} target="_blank" rel="sponsored noopener noreferrer" data-cta-kind="registration" data-cta-platform={c.venue} data-cta-placement="activities-live-campaign" data-cta-code={cta.inviteCode || undefined}>
                      {t.join(name)}{cta.inviteCode ? <small> · {cta.inviteCode}</small> : null}
                    </a>
                  )}
                </div>
                {terms && <p className="live-campaigns__terms">{terms}</p>}
              </li>
            );
          })}
        </ul>
          {group.items.length > GROUP_PREVIEW_COUNT && <button type="button" className="live-campaigns__group-toggle" aria-expanded={expanded} onClick={() => toggleGroup(group.venue)}>{expanded ? labels.fewer : labels.all}</button>}
        </section>
        );
      })}
      <p className="live-campaigns__note">{t.note}</p>
      <CommissionDisclosureLine locale={locale} className="live-campaigns__ad" placement="activities-live-campaigns" />
    </section>
  );
}

export default LiveCampaigns;
