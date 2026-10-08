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

// Fee figure: final value on the server and under reduced motion; counts up when `tick` changes (hover, focus, selection).
function Fee({ value, locale, tick }) {
  const ref = useRef(null);
  const first = useRef(true);
  const fmt = useCallback((n) => `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(n)}`, [locale]);
  useEffect(() => {
    const el = ref.current;
    if (first.current) { first.current = false; return undefined; }
    if (!el || reduced()) return undefined;
    let raf = 0;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / 400, 1);
      el.textContent = fmt(value * (p >= 1 ? 1 : 1 - 2 ** (-10 * p)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); el.textContent = fmt(value); };
  }, [tick, value, fmt]);
  return <span ref={ref}>{fmt(value)}</span>;
}

function FeePair({ pair, locale, tick, none }) {
  if (!pair || !Number.isFinite(pair[0]) || !Number.isFinite(pair[1])) return <span className="rf-na">{none}</span>;
  return <span dir="ltr"><Fee value={pair[0]} locale={locale} tick={tick} /> / <Fee value={pair[1]} locale={locale} tick={tick} />%</span>;
}

function useRoutes(stageRef, intentRefs, nodeRefs, intent, litKey) {
  const [geo, setGeo] = useState({ w: 0, h: 0, routes: [], from: null });
  const raf = useRef(0);
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const from = intentRefs.current[intent];
    if (!stage || !from) return;
    const sr = stage.getBoundingClientRect();
    const rtl = getComputedStyle(stage).direction === "rtl";
    const fr = from.getBoundingClientRect();
    const slugs = litKey ? litKey.split(",") : [];
    const firstNode = nodeRefs.current[slugs[0]];
    if (!firstNode) return;
    const stacked = firstNode.getBoundingClientRect().top >= fr.bottom - 4;
    const a = stacked ? [fr.left + fr.width / 2 - sr.left, fr.bottom - sr.top] : [(rtl ? fr.left : fr.right) - sr.left, fr.top + fr.height / 2 - sr.top];
    const routes = slugs.map((slug) => {
      const el = nodeRefs.current[slug];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const b = stacked ? [r.left + r.width / 2 - sr.left, r.top - sr.top] : [(rtl ? r.right : r.left) - sr.left, r.top + r.height / 2 - sr.top];
      const d = stacked
        ? `M${a[0].toFixed(1)} ${a[1].toFixed(1)}C${a[0].toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)} ${b[0].toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`
        : `M${a[0].toFixed(1)} ${a[1].toFixed(1)}C${(a[0] + (b[0] - a[0]) * 0.55).toFixed(1)} ${a[1].toFixed(1)} ${(b[0] - (b[0] - a[0]) * 0.55).toFixed(1)} ${b[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
      return { slug, d, end: b };
    }).filter(Boolean);
    const next = { w: Math.round(sr.width), h: Math.round(sr.height), routes, from: a };
    setGeo((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [stageRef, intentRefs, nodeRefs, intent, litKey]);
  useEffect(() => {
    const schedule = () => { cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(measure); };
    schedule();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
    if (ro) {
      if (stageRef.current) ro.observe(stageRef.current);
      Object.values(nodeRefs.current).forEach((el) => el && ro.observe(el));
    }
    window.addEventListener("resize", schedule);
    document.fonts?.ready?.then(schedule);
    return () => { cancelAnimationFrame(raf.current); ro?.disconnect(); window.removeEventListener("resize", schedule); };
  }, [measure, stageRef, nodeRefs]);
  return geo;
}

function Finder({ kit }) {
  const { locale } = kit;
  const t = copyFor(locale);
  const uid = useId();
  const nodes = NODE_SLUGS.map((slug) => kit.venue(slug)).filter(Boolean);
  const offered = (intent) => nodes.filter((v) => OFFERS[intent](v, EXCHANGE_FACTS[v.slug])).map((v) => v.slug);
  const [intent, setIntent] = useState("spot");
  const [slug, setSlug] = useState(nodes[0]?.slug);
  const [hot, setHot] = useState(null);
  const [tick, setTick] = useState(0);
  const stageRef = useRef(null);
  const intentRefs = useRef({});
  const nodeRefs = useRef({});
  const lit = offered(intent);
  const litKey = lit.join(",");
  const geo = useRoutes(stageRef, intentRefs, nodeRefs, intent, litKey);

  // Pointer light on the map grid (progressive: static without JS or with reduced motion).
  useEffect(() => {
    const el = stageRef.current;
    if (!el || reduced()) return undefined;
    let raf = 0;
    const move = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    el.addEventListener("pointermove", move);
    return () => { cancelAnimationFrame(raf); el.removeEventListener("pointermove", move); };
  }, []);

  const pickIntent = (next) => {
    setIntent(next);
    const l = offered(next);
    if (!l.includes(slug)) setSlug(l[0]);
    setTick((n) => n + 1);
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
    pickIntent(n);
    intentRefs.current[n]?.focus();
  };
  const pickNode = (s) => { if (!lit.includes(s)) return; setSlug(s); setTick((n) => n + 1); };
  const sel = nodes.find((v) => v.slug === slug) || nodes[0];
  const facts = EXCHANGE_FACTS[sel.slug];
  const BrandMark = kit.BrandMark;
  const feeKey = intent === "perps" ? "perp" : "spot";
  const panelId = `${uid}-panel`;

  return (
    <>
    <div className="rf-grid" ref={stageRef}>
      <div className="rf-copy">
        <h1 className="rf-title">{kit.title}</h1>
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

      <div className="rf-nodes">
        <p className="rf-label" id={`${uid}-n`}>
          {t.venues} <span className="rf-count" dir="ltr">{lit.length}/{nodes.length}</span>
        </p>
        <ul className="rf-list" aria-labelledby={`${uid}-n`}>
          {nodes.map((v) => {
            const on = lit.includes(v.slug);
            const active = v.slug === sel.slug;
            const f = EXCHANGE_FACTS[v.slug];
            const pair = f?.status === "verified" ? f[feeKey] : null;
            return (
              <li key={v.slug}>
                <button
                  type="button"
                  ref={(el) => { nodeRefs.current[v.slug] = el; }}
                  className="rf-node"
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
                  <span className="rf-node__id">
                    <b translate="no" lang="en">{v.name}</b>
                    <small className="rf-mono" translate="no" lang="en" dir="ltr">{v.officialDomain}</small>
                  </span>
                  <span className="rf-node__fee rf-mono">
                    {on ? <FeePair pair={pair} locale={locale} tick={hot === v.slug || active ? tick : 0} none={t.none} /> : <span className="rf-na">{t.off}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rf-card" id={panelId} role="region" aria-label={sel.name} key={sel.slug}>
        <div className="rf-card__head">
          <span className="rf-card__who"><BrandMark slug={sel.slug} priority /><b translate="no" lang="en">{sel.name}</b><small translate="no" lang="en">{sel.category}</small></span>
          <dl className="rf-facts">
            <div><dt>{t.spot} {t.mt}</dt><dd className="rf-mono"><FeePair pair={facts?.status === "verified" ? facts.spot : null} locale={locale} tick={tick} none={t.none} /></dd></div>
            <div><dt>{t.perp} {t.mt}</dt><dd className="rf-mono"><FeePair pair={facts?.status === "verified" ? facts.perp : null} locale={locale} tick={tick} none={t.none} /></dd></div>
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
        <a className="rf-tg" href={kit.telegram.href} target="_blank" rel="noopener noreferrer"><span>{kit.telegram.label}</span><span aria-hidden="true">&nearr;</span></a>
        <div className="rf-pills">
          {kit.pills.map((p) => <a key={p.text} href={p.href} className="rf-pill">{p.text}</a>)}
        </div>
      </div>

      <svg className="rf-svg" width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w || 1} ${geo.h || 1}`} aria-hidden="true" focusable="false">
        {geo.routes.map((r, i) => {
          const isSel = r.slug === sel.slug;
          return (
            <g key={`${intent}-${r.slug}`} className={`rf-route${isSel ? " is-on" : ""}${hot === r.slug ? " is-hot" : ""}`} style={{ "--i": i }}>
              <path className="rf-route__line" d={r.d} pathLength="1" />
              {isSel && <path className="rf-route__pulse" d={r.d} pathLength="1" />}
            </g>
          );
        })}
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
