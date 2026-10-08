// V6 Act 1: the route finder. Intent -> animated routes -> venue node -> the same registration card as before.
// The legacy hero (ticker, LeanHero, Brazil entry, section nav) is re-hosted: LeanHero renders through its `render`
// prop so copy, data, hrefs, codes and rel attributes stay exactly the ones the old hero produced.
import { Children, cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { EXCHANGE_FACTS } from "../../data/exchange-facts.js";

const NODE_SLUGS = ["binance", "okx", "bybit", "bitget", "kraken", "gate-io", "hyperliquid", "gmx"];
const INTENTS = ["spot", "perps", "fiat", "chain"];
// Which venues offer which product. Derived from catalog + verified facts, never ranked: order is the fixed catalog order.
const OFFERS = {
  spot: (v, f) => v.category === "CEX" || Number.isFinite(f?.spot?.[0]),
  perps: (v) => v.hasPerp,
  fiat: (v) => v.category === "CEX" && v.fiat >= 2,
  chain: (v) => v.category !== "CEX",
};

const T = {
  en: { group: "What do you want to do?", venues: "Venues for this route", none: "Not yet checked", spot: "Spot", perp: "Perp", off: "Not offered on this route", mt: "Maker / taker", i: { spot: ["Spot", "Buy and sell coins"], perps: ["Perps", "Leveraged contracts"], fiat: ["Fiat on-ramp", "Card, bank or P2P"], chain: ["On-chain", "DEX trading from a wallet"] } },
  "zh-Hans": { group: "你想做什么?", venues: "适用此路线的平台", none: "尚未核验", spot: "现货", perp: "永续", off: "此路线不提供", mt: "挂单 / 吃单", i: { spot: ["现货", "买卖币种"], perps: ["永续合约", "杠杆合约"], fiat: ["法币入金", "银行卡、转账或 P2P"], chain: ["链上", "钱包直连 DEX 交易"] } },
  "zh-Hant": { group: "你想做什麼?", venues: "適用此路線的平台", none: "尚未核驗", spot: "現貨", perp: "永續", off: "此路線不提供", mt: "掛單 / 吃單", i: { spot: ["現貨", "買賣幣種"], perps: ["永續合約", "槓桿合約"], fiat: ["法幣入金", "銀行卡、轉帳或 P2P"], chain: ["鏈上", "錢包直連 DEX 交易"] } },
  ja: { group: "何をしたいですか?", venues: "このルートの取引所", none: "未確認", spot: "現物", perp: "無期限", off: "このルートは非対応", mt: "メイカー / テイカー", i: { spot: ["現物", "コインの売買"], perps: ["無期限先物", "レバレッジ取引"], fiat: ["法定通貨入金", "カード・銀行・P2P"], chain: ["オンチェーン", "ウォレットからDEX取引"] } },
  ko: { group: "무엇을 하고 싶으세요?", venues: "이 경로의 플랫폼", none: "확인 전", spot: "현물", perp: "무기한", off: "이 경로 미지원", mt: "메이커 / 테이커", i: { spot: ["현물", "코인 매매"], perps: ["무기한 선물", "레버리지 계약"], fiat: ["법정화폐 입금", "카드, 은행, P2P"], chain: ["온체인", "지갑에서 DEX 거래"] } },
  tr: { group: "Ne yapmak istiyorsunuz?", venues: "Bu rotadaki platformlar", none: "Henüz kontrol edilmedi", spot: "Spot", perp: "Vadesiz", off: "Bu rotada yok", mt: "Maker / taker", i: { spot: ["Spot", "Coin al-sat"], perps: ["Vadesiz", "Kaldıraçlı sözleşmeler"], fiat: ["Fiat girişi", "Kart, banka veya P2P"], chain: ["Zincir üstü", "Cüzdanla DEX işlemi"] } },
  es: { group: "¿Qué quieres hacer?", venues: "Plataformas para esta ruta", none: "Aún sin revisar", spot: "Spot", perp: "Perp", off: "No disponible en esta ruta", mt: "Maker / taker", i: { spot: ["Spot", "Compra y venta de monedas"], perps: ["Perpetuos", "Contratos con apalancamiento"], fiat: ["Entrada fiat", "Tarjeta, banco o P2P"], chain: ["On-chain", "DEX desde tu wallet"] } },
  "pt-BR": { group: "O que você quer fazer?", venues: "Plataformas para esta rota", none: "Ainda não verificado", spot: "Spot", perp: "Perp", off: "Indisponível nesta rota", mt: "Maker / taker", i: { spot: ["Spot", "Compre e venda moedas"], perps: ["Perpétuos", "Contratos alavancados"], fiat: ["Entrada fiat", "Cartão, banco ou P2P"], chain: ["On-chain", "DEX direto da carteira"] } },
  fr: { group: "Que voulez-vous faire ?", venues: "Plateformes pour cette route", none: "Pas encore vérifié", spot: "Spot", perp: "Perp", off: "Non proposé sur cette route", mt: "Maker / taker", i: { spot: ["Spot", "Acheter et vendre"], perps: ["Perpétuels", "Contrats à effet de levier"], fiat: ["Entrée fiat", "Carte, banque ou P2P"], chain: ["On-chain", "DEX depuis le wallet"] } },
  de: { group: "Was möchten Sie tun?", venues: "Plattformen für diese Route", none: "Noch nicht geprüft", spot: "Spot", perp: "Perp", off: "Auf dieser Route nicht verfügbar", mt: "Maker / Taker", i: { spot: ["Spot", "Coins kaufen und verkaufen"], perps: ["Perps", "Hebel-Kontrakte"], fiat: ["Fiat-Einzahlung", "Karte, Bank oder P2P"], chain: ["On-Chain", "DEX direkt aus der Wallet"] } },
  ru: { group: "Что вы хотите сделать?", venues: "Платформы для этого маршрута", none: "Ещё не проверено", spot: "Спот", perp: "Перп", off: "Недоступно на этом маршруте", mt: "Мейкер / тейкер", i: { spot: ["Спот", "Покупка и продажа монет"], perps: ["Перпы", "Контракты с плечом"], fiat: ["Ввод фиата", "Карта, банк или P2P"], chain: ["Ончейн", "DEX из кошелька"] } },
  ar: { group: "ماذا تريد أن تفعل؟", venues: "المنصات لهذا المسار", none: "لم يُتحقق بعد", spot: "فوري", perp: "دائم", off: "غير متاح في هذا المسار", mt: "صانع / آخذ", i: { spot: ["فوري", "شراء العملات وبيعها"], perps: ["عقود دائمة", "عقود برافعة"], fiat: ["إيداع نقدي", "بطاقة أو بنك أو P2P"], chain: ["على السلسلة", "DEX من المحفظة"] } },
  id: { group: "Apa yang ingin Anda lakukan?", venues: "Platform untuk rute ini", none: "Belum diperiksa", spot: "Spot", perp: "Perp", off: "Tidak tersedia di rute ini", mt: "Maker / taker", i: { spot: ["Spot", "Beli dan jual koin"], perps: ["Perpetual", "Kontrak berleverage"], fiat: ["Setor fiat", "Kartu, bank, atau P2P"], chain: ["On-chain", "DEX langsung dari dompet"] } },
  vi: { group: "Bạn muốn làm gì?", venues: "Nền tảng cho lộ trình này", none: "Chưa kiểm tra", spot: "Giao ngay", perp: "Perp", off: "Không hỗ trợ ở lộ trình này", mt: "Maker / taker", i: { spot: ["Giao ngay", "Mua bán coin"], perps: ["Vĩnh cửu", "Hợp đồng đòn bẩy"], fiat: ["Nạp fiat", "Thẻ, ngân hàng hoặc P2P"], chain: ["On-chain", "DEX từ ví"] } },
  it: { group: "Cosa vuoi fare?", venues: "Piattaforme per questa rotta", none: "Non ancora verificato", spot: "Spot", perp: "Perp", off: "Non disponibile su questa rotta", mt: "Maker / taker", i: { spot: ["Spot", "Compra e vendi monete"], perps: ["Perpetui", "Contratti con leva"], fiat: ["Ingresso fiat", "Carta, banca o P2P"], chain: ["On-chain", "DEX dal wallet"] } },
};
const copyFor = (locale) => T[locale] || T[String(locale || "en").split("-")[0]] || T.en;

// "You" origin + official-domain verify gate captions (every locale; English fallback).
const HUB = {
  en: ["You", "Official domain check"], "zh-Hans": ["你", "官方域名核验"], "zh-Hant": ["你", "官方網域核驗"], ja: ["あなた", "公式ドメイン確認"],
  ko: ["나", "공식 도메인 확인"], tr: ["Siz", "Resmî alan adı kontrolü"], es: ["Tú", "Verificación del dominio oficial"], "pt-BR": ["Você", "Checagem do domínio oficial"],
  fr: ["Vous", "Vérification du domaine officiel"], de: ["Sie", "Prüfung der offiziellen Domain"], ru: ["Вы", "Проверка официального домена"], ar: ["أنت", "فحص النطاق الرسمي"],
  id: ["Anda", "Cek domain resmi"], vi: ["Bạn", "Kiểm tra tên miền chính thức"], it: ["Tu", "Verifica del dominio ufficiale"],
};
const hubFor = (locale) => HUB[locale] || HUB[String(locale || "en").split("-")[0]] || HUB.en;

const ICONS = {
  spot: <path d="M4 8h13m0 0-3-3m3 3-3 3M20 16H7m0 0 3-3m-3 3 3 3" />,
  perps: <path d="M4 17l5-5 3 3 7-8M15 7h4v4" />,
  fiat: <><rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="M3.5 10.5h17M7 15h3" /></>,
  chain: <><circle cx="6" cy="12" r="2.2" /><circle cx="18" cy="6.5" r="2.2" /><circle cx="18" cy="17.5" r="2.2" /><path d="M8 11l8-3.5M8 13l8 3.5" /></>,
};
const Icon = ({ name }) => (
  <svg className="rf-ico" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{ICONS[name]}</svg>
);

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isWide = () => typeof window !== "undefined" && window.matchMedia("(min-width: 74rem)").matches;
const bareDomain = (d) => String(d || "").replace(/^(www|app)\./, "");

// Fee figure: ALWAYS the final verified value, in the first frame and on the server. Change is signalled by opacity/translate only
// (a keyed remount replays the CSS entrance); no intermediate number is ever rendered.
function Fee({ value, locale, tick, min = 2, max = 3 }) {
  const text = new Intl.NumberFormat(locale, { minimumFractionDigits: min, maximumFractionDigits: max }).format(value);
  return <span key={tick} className="rf-fee">{text}</span>;
}

function FeePair({ pair, locale, tick, none }) {
  if (!pair || !Number.isFinite(pair[0]) || !Number.isFinite(pair[1])) return <span className="rf-na">{none}</span>;
  return <span dir="ltr"><Fee value={pair[0]} locale={locale} tick={tick} /> / <Fee value={pair[1]} locale={locale} tick={tick} />%</span>;
}

// The gate stamps the official domain character by character.
function Typed({ text }) {
  const ref = useRef(null);
  const first = useRef(true);
  useEffect(() => {
    const el = ref.current;
    if (first.current) { first.current = false; return undefined; }
    if (!el || reduced()) return undefined;
    let i = 0;
    el.textContent = "";
    const id = setInterval(() => {
      i += 1;
      el.textContent = text.slice(0, i);
      if (i >= text.length) clearInterval(id);
    }, 26);
    return () => { clearInterval(id); el.textContent = text; };
  }, [text]);
  return <span ref={ref} dir="ltr">{text}</span>;
}

// Route geometry, measured from the DOM so the SVG always meets the real ports (LTR/RTL, wide and stacked).
function useRoutes(stageRef, refs, intent, litKey, slug) {
  const [geo, setGeo] = useState({ w: 0, h: 0, base: [], chain: [], fan: [] });
  const raf = useRef(0);
  const { intentRefs, nodeRefs, youRef, gateRef, cardRef } = refs;
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const from = intentRefs.current[intent];
    const you = youRef.current;
    const gate = gateRef.current;
    if (!stage || !from || !you || !gate) return;
    const sr = stage.getBoundingClientRect();
    const rtl = getComputedStyle(stage).direction === "rtl";
    const dir = rtl ? -1 : 1;
    const wide = isWide();
    const f1 = (n) => n.toFixed(1);
    const X = (x) => f1(x - sr.left);
    const Y = (y) => f1(y - sr.top);
    const fr = from.getBoundingClientRect();
    const yr = you.getBoundingClientRect();
    const gr = gate.getBoundingClientRect();
    const slugs = litKey ? litKey.split(",") : [];
    const ax = fr.left + fr.width / 2;
    const ay = fr.bottom;
    let intro;
    let link;
    let origin;
    if (wide) {
      const yc = yr.top + yr.height / 2;
      const toYou = rtl ? yr.right : yr.left;
      intro = `M${X(ax)} ${Y(ay)}V${Y(yc - 10)}Q${X(ax)} ${Y(yc)} ${X(ax + dir * 10)} ${Y(yc)}H${X(toYou)}`;
      link = `M${X(rtl ? yr.left : yr.right)} ${Y(yc)}H${X(rtl ? gr.right : gr.left)}`;
      origin = [rtl ? gr.left : gr.right, gr.top + gr.height / 2];
    } else {
      const ux = rtl ? yr.right - 18 : yr.left + 18; // rail sits on the You / gate icon axis
      intro = `M${X(ax)} ${Y(ay)}C${X(ax)} ${Y(ay + 28)} ${X(ux)} ${Y(yr.top - 28)} ${X(ux)} ${Y(yr.top)}`;
      link = `M${X(ux)} ${Y(yr.bottom)}V${Y(gr.top + gr.height / 2)}`;
      origin = [ux, gr.top + gr.height / 2];
    }
    const base = [];
    let fan = [];
    slugs.forEach((s) => {
      const el = nodeRefs.current[s];
      if (!el) return;
      const r = el.getBoundingClientRect();
      const bx = rtl ? r.right : r.left;
      const by = r.top + r.height / 2;
      // metro line: along the trunk, then a rounded branch into the node port (trunk sits just before the nodes on wide, on the rail when stacked)
      const tx = wide ? bx - dir * 24 : origin[0];
      const d = `M${X(origin[0])} ${Y(origin[1])}H${X(tx)}V${Y(by + (by > origin[1] ? -10 : 10))}Q${X(tx)} ${Y(by)} ${X(tx + dir * 10)} ${Y(by)}H${X(bx)}`;
      base.push({ slug: s, d });
      if (s === slug) {
        fan = [d];
        if (wide && cardRef.current) {
          const cr = cardRef.current.getBoundingClientRect();
          const x0 = rtl ? r.left : r.right;
          const x1 = rtl ? cr.right : cr.left;
          const y1 = Math.min(Math.max(by, cr.top + 40), cr.bottom - 40);
          const m = (x0 + x1) / 2;
          fan.push(`M${X(x0)} ${Y(by)}C${X(m)} ${Y(by)} ${X(m)} ${Y(y1)} ${X(x1)} ${Y(y1)}`);
        }
      }
    });
    const next = { w: Math.round(sr.width), h: Math.round(sr.height), base, chain: [intro, link], fan };
    setGeo((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [stageRef, intentRefs, nodeRefs, youRef, gateRef, cardRef, intent, litKey, slug]);
  useEffect(() => {
    const schedule = () => { cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(measure); };
    schedule();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
    if (ro) {
      if (stageRef.current) ro.observe(stageRef.current);
      Object.values(nodeRefs.current).forEach((el) => el && ro.observe(el));
      if (cardRef.current) ro.observe(cardRef.current);
    }
    window.addEventListener("resize", schedule);
    document.fonts?.ready?.then(schedule);
    return () => { cancelAnimationFrame(raf.current); ro?.disconnect(); window.removeEventListener("resize", schedule); };
  }, [measure, stageRef, nodeRefs, cardRef]);
  return geo;
}

const withData = (intent, f) => ((intent === "spot" || intent === "perps")
  ? f?.status === "verified" && Number.isFinite((intent === "perps" ? f.perp : f.spot)?.[0])
  : true);

// The one bold type moment: the selected venue's fee at display size, counting up on every route change.
function BigFee({ className, pair, locale, tick, none }) {
  return (
    <p className={className} aria-hidden="true" dir="ltr">
      {pair && Number.isFinite(pair[0])
        ? <><span className="rf-big__n"><Fee value={pair[0]} locale={locale} tick={tick} /></span><span className="rf-big__u">%</span></>
        : <span className="rf-big__n rf-big__n--na rf-big__n--text">{none}</span>}
    </p>
  );
}

function Finder({ kit }) {
  const { locale } = kit;
  const t = copyFor(locale);
  const [youLabel, gateLabel] = hubFor(locale);
  const uid = useId();
  const nodes = NODE_SLUGS.map((slug) => kit.venue(slug)).filter(Boolean);
  const offered = (intent) => nodes.filter((v) => OFFERS[intent](v, EXCHANGE_FACTS[v.slug])).map((v) => v.slug);
  // Default node = first venue that actually has data for the intent (catalog order, never a ranking).
  const pickDefault = (intent) => { const l = offered(intent); return l.find((s) => withData(intent, EXCHANGE_FACTS[s])) || l[0]; };
  const [intent, setIntent] = useState("spot");
  const [slug, setSlug] = useState(() => pickDefault("spot") || nodes[0]?.slug);
  const [hot, setHot] = useState(null);
  const [tick, setTick] = useState(0);
  const stageRef = useRef(null);
  const intentRefs = useRef({});
  const nodeRefs = useRef({});
  const youRef = useRef(null);
  const gateRef = useRef(null);
  const cardRef = useRef(null);
  const listRef = useRef(null);
  const kbd = useRef(false);
  const lit = offered(intent);
  const litKey = lit.join(",");
  const geo = useRoutes(stageRef, { intentRefs, nodeRefs, youRef, gateRef, cardRef }, intent, litKey, slug);

  // Pointer light on the map grid + magnetic primary CTAs (progressive: static without JS or with reduced motion).
  useEffect(() => {
    const el = stageRef.current;
    if (!el || reduced()) return undefined;
    let raf = 0;
    const R = 96;
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const CTA = ".rf-btn--primary, .registration-card__primary-btn";
    const move = (e) => {
      const { clientX: x, clientY: y, pointerType } = e;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${x - r.left}px`);
        el.style.setProperty("--my", `${y - r.top}px`);
        if (pointerType === "touch") return;
        el.querySelectorAll(CTA).forEach((b) => {
          const q = b.getBoundingClientRect();
          const near = x > q.left - R && x < q.right + R && y > q.top - R && y < q.bottom + R;
          b.style.setProperty("--tx", near ? `${clamp((x - (q.left + q.width / 2)) * 0.16, -8, 8).toFixed(1)}px` : "0px");
          b.style.setProperty("--ty", near ? `${clamp((y - (q.top + q.height / 2)) * 0.22, -6, 6).toFixed(1)}px` : "0px");
        });
      });
    };
    const leave = () => el.querySelectorAll(CTA).forEach((b) => { b.style.setProperty("--tx", "0px"); b.style.setProperty("--ty", "0px"); });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { cancelAnimationFrame(raf); el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, []);

  const pickIntent = (next) => {
    setIntent(next);
    setSlug(pickDefault(next));
    setHot(null);
    setTick((n) => n + 1);
    // Stacked layout: the venues sit below the intents. Bring them into view on a deliberate tap (not keyboard arrow roving).
    if (!isWide() && !kbd.current) requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = listRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.62) el.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
    }));
  };
  const onRadioKey = (e) => {
    const i = INTENTS.indexOf(intent);
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    let n = null;
    if (e.key === "ArrowDown" || e.key === (rtl ? "ArrowLeft" : "ArrowRight")) n = INTENTS[(i + 1) % 4];
    if (e.key === "ArrowUp" || e.key === (rtl ? "ArrowRight" : "ArrowLeft")) n = INTENTS[(i + 3) % 4];
    if (e.key === "Home") n = INTENTS[0];
    if (e.key === "End") n = INTENTS[3];
    if (!n) return;
    e.preventDefault();
    kbd.current = true;
    pickIntent(n);
    kbd.current = false;
    intentRefs.current[n]?.focus();
  };
  const pickNode = (s) => {
    if (!lit.includes(s)) return;
    setSlug(s);
    setTick((n) => n + 1);
    // Narrow layout: the card opens inline under the node; keep the tapped node in view as the old card collapses.
    if (!isWide()) requestAnimationFrame(() => requestAnimationFrame(() => nodeRefs.current[s]?.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" })));
  };
  const sel = nodes.find((v) => v.slug === slug) || nodes[0];
  const peek = nodes.find((v) => v.slug === hot) || sel;
  const facts = EXCHANGE_FACTS[sel.slug];
  const BrandMark = kit.BrandMark;
  // Fee rows only exist for spot / perps. Fiat on-ramp and on-chain have no checked fee data in the catalog: say so, never show spot fees there.
  const feeIntent = intent === "spot" || intent === "perps";
  const feeKey = intent === "perps" ? "perp" : "spot";
  const bigPair = feeIntent && facts?.status === "verified" ? facts[feeKey] : null;
  const panelId = `${uid}-panel`;
  const selIdx = Math.max(0, nodes.findIndex((v) => v.slug === sel.slug));

  return (
    <>
    <div className="rf-grid" ref={stageRef}>
      <div className="rf-copy">
        <h1 className={`rf-title${/\s/.test(String(kit.title).trim()) && Math.max(...String(kit.title).split(/\s+/).map((w) => w.length)) > 11 ? " rf-title--long" : ""}`}>{kit.title}</h1>
        <p className="rf-lede">{kit.lede}</p>
      </div>


      <div className="rf-intents">
        <p className="rf-label" id={`${uid}-g`}>{t.group}</p>
        <div role="radiogroup" aria-labelledby={`${uid}-g`} className="rf-radios" onKeyDown={onRadioKey}>
          {INTENTS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={intent === k}
              tabIndex={intent === k ? 0 : -1}
              ref={(el) => { intentRefs.current[k] = el; }}
              className="rf-intent"
              onClick={() => pickIntent(k)}
            >
              <Icon name={k} />
              <span className="rf-intent__text"><b>{t.i[k][0]}</b><small>{t.i[k][1]}</small></span>
              <i className="rf-port" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="rf-readout" aria-hidden="true">
        <BigFee className="rf-big" pair={bigPair} locale={locale} tick={tick} none={t.none} />
        <p className="rf-readout__cap"><b translate="no" lang="en">{sel.name}</b> {feeIntent ? <>{feeKey === "perp" ? t.perp : t.spot} {t.mt} {bigPair ? <FeePair pair={bigPair} locale={locale} tick={tick} none={t.none} /> : t.none}</> : <>{t.i[intent][0]}: {t.none}</>}</p>
      </div>

      <div className="rf-hub" aria-hidden="true">
        <span className="rf-you" ref={youRef}>{youLabel}</span>
        <span className="rf-gate" ref={gateRef}>
          <svg className="rf-gate__ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
            <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
            <path key={peek.slug} className="rf-gate__tick" pathLength="1" d="M8.5 12l2.5 2.5 4.5-5" />
          </svg>
          <Typed text={bareDomain(peek.officialDomain)} />
        </span>
        <span className="rf-gate__cap">{gateLabel}</span>
      </div>

      <div className="rf-nodes">
        <p className="rf-label" id={`${uid}-n`} ref={listRef}>
          {t.venues} <span className="rf-count" dir="ltr">{lit.length}/{nodes.length}</span>
        </p>
        <ul className="rf-list" aria-labelledby={`${uid}-n`}>
          {nodes.map((v, i) => {
            const on = lit.includes(v.slug);
            const active = v.slug === sel.slug;
            const f = EXCHANGE_FACTS[v.slug];
            const pair = feeIntent && f?.status === "verified" ? f[feeKey] : null;
            return (
              <li key={v.slug}>
                <button
                  type="button"
                  ref={(el) => { nodeRefs.current[v.slug] = el; }}
                  className="rf-node"
                  style={{ "--ord": 10 + i * 2 }}
                  data-on={on}
                  data-active={active}
                  aria-pressed={active}
                  aria-disabled={!on}
                  aria-controls={panelId}
                  tabIndex={on ? 0 : -1}
                  title={on ? undefined : t.off}
                  onClick={() => pickNode(v.slug)}
                  onPointerEnter={() => { if (on) { setHot(v.slug); setTick((n) => n + 1); } }}
                  onPointerLeave={() => setHot(null)}
                  onFocus={() => { if (on) { setHot(v.slug); setTick((n) => n + 1); } }}
                  onBlur={() => setHot(null)}
                >
                  <i className="rf-port" aria-hidden="true" />
                  <BrandMark slug={v.slug} compact priority />
                  <b className="rf-node__name" translate="no" lang="en">{v.name}</b>
                  <span className="rf-node__fee">
                    {on && feeIntent && pair && Number.isFinite(pair[0])
                      ? <span dir="ltr"><Fee value={pair[0]} locale={locale} tick={hot === v.slug || active ? tick : 0} />%</span>
                      : <><span className="rf-na" aria-hidden={false}>{on ? t.none : ""}</span>{!on && <span className="rf-sr">{t.off}</span>}</>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rf-card" id={panelId} ref={cardRef} role="region" aria-label={sel.name} style={{ "--ord": 11 + selIdx * 2 }} key={sel.slug}>
        <div className="rf-card__head">
          <span className="rf-card__who"><BrandMark slug={sel.slug} priority /><b translate="no" lang="en">{sel.name}</b><small translate="no" lang="en">{sel.category}</small></span>
          <BigFee className="rf-big rf-big--card" pair={bigPair} locale={locale} tick={tick} none={t.none} />
          <dl className="rf-facts">
            <div data-on={feeIntent && feeKey === "spot"}><dt>{t.spot} {t.mt}</dt><dd><FeePair pair={feeIntent && facts?.status === "verified" ? facts.spot : null} locale={locale} tick={tick} none={t.none} /></dd></div>
            <div data-on={feeIntent && feeKey === "perp"}><dt>{t.perp} {t.mt}</dt><dd><FeePair pair={feeIntent && facts?.status === "verified" ? facts.perp : null} locale={locale} tick={tick} none={t.none} /></dd></div>
          </dl>
        </div>
        {kit.card(sel.slug)}
      </div>

      <div className="rf-actions">
        <button type="button" className="rf-btn rf-btn--primary" onClick={kit.openWizard}>{kit.wizardLabel}</button>
        <a className="rf-link" href={kit.exploreHref}>{kit.exploreLabel}</a>
        <a className="rf-btn rf-btn--ghost" href={kit.compareHref}>{kit.compareLabel}</a>
      </div>

      <div className="rf-more">
        <p className="rf-more__badge">{kit.badge}</p>
        <p className="rf-more__sub">{kit.subtitle}</p>
        <div className="rf-more__help">
          <h2>{kit.helpTitle}</h2>
          <p>{kit.helpLead}</p>
        </div>
        <a className="rf-tg" href={kit.telegram.href} target="_blank" rel="noopener noreferrer"><span>{kit.telegram.label}</span><span aria-hidden="true">{"↗"}</span></a>
        <div className="rf-pills">
          {kit.pills.map((p) => <a key={p.text} href={p.href} className="rf-pill">{p.text}</a>)}
        </div>
      </div>

      <svg className="rf-svg" width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w || 1} ${geo.h || 1}`} aria-hidden="true" focusable="false">
        {geo.chain.map((d, i) => <path key={`s${i}`} className="rf-route__line" d={d} />)}
        {geo.base.map((r, i) => (
          <g key={`${intent}-${r.slug}`} className={`rf-route${hot === r.slug ? " is-hot" : ""}`} style={{ "--i": i }}>
            <path className="rf-route__line" d={r.d} pathLength="1" />
          </g>
        ))}
        {geo.fan.length > 0 && (
          <g key={`${intent}-${sel.slug}-on`} className="rf-route is-on">
            {[...geo.chain, ...geo.fan].map((d, i) => <path key={i} className="rf-route__line rf-route__line--on" style={{ "--seg": i }} d={d} pathLength="1" />)}
            <path className="rf-route__pulse" d={geo.fan[0]} pathLength="1" />
          </g>
        )}
      </svg>
      <span className="rf-sr" role="status">{t.i[intent][0]}: {lit.length}/{nodes.length}</span>
    </div>
    {kit.wizardModal}
    </>
  );
}

const nameOf = (el) => el?.type?.displayName || el?.type?.name || "";

export function RouteFinder({ legacy }) {
  // Re-host the legacy hero parts (ticker, hero, Brazil entry, section nav) inside the V6 layout.
  const top = isValidElement(legacy) ? Children.toArray(legacy.props.children) : [];
  const boundary = top.find((el) => isValidElement(el) && Children.toArray(el.props?.children).some((c) => nameOf(c).includes("LeanHero")));
  if (!boundary) return <>{legacy}</>;
  const nav = top.find((el) => el !== boundary);
  const parts = Children.toArray(boundary.props.children).map((c) => (nameOf(c).includes("LeanHero")
    ? cloneElement(c, { render: (kit) => <Finder kit={kit} /> })
    : c));
  return (
    <section className="rf" aria-label="NexuAlpha">
      {cloneElement(boundary, {}, ...parts)}
      {nav}
    </section>
  );
}
