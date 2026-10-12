const COPY = {
  en: {
    title: "Academy widget",
    priceBoard: "Price board",
    orderTicket: "Order ticket",
    balanceLedger: "Balance ledger",
    addressForm: "Transfer address",
    riskMeter: "Risk meter",
    candlestickChart: "Candlestick chart",
    margin: "Margin",
    checklist: "Checklist",
    identity: "Identity check",
    warning: "Warning",
    symbol: "Symbol",
    value: "Value",
    market: "Market",
    limit: "Limit",
    side: "Side",
    type: "Type",
    price: "Price",
    quantity: "Quantity",
    asset: "Asset",
    available: "Available",
    locked: "Locked",
    balance: "Balance",
    network: "Network",
    address: "Address",
    memo: "Memo",
    level: "Level",
    isolated: "Isolated box",
    cross: "Cross pool",
    autoAdd: "Auto-add",
    moneyAtRisk: "Money at risk",
    poolScope: "Pool scope",
    position: "Position",
    amount: "Amount",
    open: "Open",
    high: "High",
    low: "Low",
    close: "Close",
    photos: "Photos",
    status: "Status",
    step: "Step",
    note: "Note",
    on: "On",
    off: "Off",
    pending: "Pending",
    complete: "Complete",
    notProvided: "Not provided",
    amount_: "Amount",
    orderBook: "Order book",
    size: "Size",
    average: "Average",
    lastPrice: "Last price",
    studyDesk: "Study desk",
    tradingDesk: "Trading desk",
    transferStation: "Transfer station",
  },
  "zh-Hans": {
    title: "学院组件",
    priceBoard: "价格看板",
    orderTicket: "下单票据",
    balanceLedger: "余额账本",
    addressForm: "转账地址",
    riskMeter: "风险仪表",
    candlestickChart: "K 线小图",
    margin: "保证金",
    checklist: "检查清单",
    identity: "身份检查",
    warning: "风险提示",
    symbol: "标的",
    value: "数值",
    market: "市价",
    limit: "限价",
    side: "方向",
    type: "类型",
    price: "价格",
    quantity: "数量",
    asset: "资产",
    available: "可用",
    locked: "锁定",
    balance: "余额",
    network: "网络",
    address: "地址",
    memo: "备注",
    level: "等级",
    isolated: "逐仓盒子",
    cross: "全仓池",
    autoAdd: "自动追加",
    moneyAtRisk: "风险资金",
    poolScope: "池范围",
    position: "仓位",
    amount: "数量",
    open: "开",
    high: "高",
    low: "低",
    close: "收",
    photos: "照片",
    status: "状态",
    step: "步骤",
    note: "说明",
    on: "开启",
    off: "关闭",
    pending: "待处理",
    complete: "完成",
    notProvided: "未提供",
    amount_: "金额",
    orderBook: "订单簿",
    size: "数量",
    average: "均价",
    lastPrice: "最新价",
    studyDesk: "学习桌",
    tradingDesk: "模拟交易台",
    transferStation: "转账站",
  },
};

const TYPES = {
  "price-board": "priceBoard",
  "order-ticket": "orderTicket",
  "balance-ledger": "balanceLedger",
  "address-form": "addressForm",
  "risk-meter": "riskMeter",
  "candlestick-chart": "candlestickChart",
  margin: "margin",
  "margin-flow": "marginFlow",
  "id-samples": "idSamples",
  "transfer-match": "transferMatch",
  checklist: "checklist",
  identity: "identity",
  warning: "warning",
  formula: "formula",
  cards: "cards",
  flow: "flow",
  quiz: "quiz",
  compare: "compare",
  "order-book": "orderBook",
  "buffer-gauge": "bufferGauge",
};

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function widget(spec = {}, locale = "en") {
  const copy = COPY[locale] || COPY.en;
  const type = String(spec.type || "");
  const key = TYPES[type];
  if (!key || !RENDER[key]) throw new TypeError(`Unsupported widget type: ${type || "(missing)"}`);
  const title = spec.title ? `<div class="title">${esc(spec.title)}</div>` : "";
  const long = type === "checklist" && asArray(spec.items).length > 5 ? " widget--long" : "";
  return `<section class="widget widget-${esc(type)}${long}" data-type="${esc(type)}">${title}${RENDER[key](spec, copy)}</section>`;
}

export function setBackdrop(name, locale = "en") {
  const copy = COPY[locale] || COPY.en;
  const label = {
    "study-desk": copy.studyDesk,
    "trading-desk": copy.tradingDesk,
    "transfer-station": copy.transferStation,
  }[name] || copy.studyDesk;
  const decor = {
    "study-desk": '<path class="lamp" d="M94 156h68l-18-35h-32z"/><path d="M128 157v66h-27m27 0h27" fill="none" stroke="#516074" stroke-width="5"/><path class="book" d="M180 238h92v38h-92zM288 238h92v38h-92z"/>',
    "trading-desk": '<path class="term" d="M176 102h248v126H176z"/><path class="spark" d="M206 190l42-36 42 18 54-52 44 28"/>',
    "transfer-station": '<path class="gate" d="M146 118h132v118H146zM346 118h132v118H346z"/><path class="route" d="M284 174h54m-18-18 18 18-18 18"/>',
  }[name] || "";
  return `<svg class="set-backdrop set-${esc(name)}" viewBox="0 0 640 360" role="img" aria-label="${esc(label)}">`
    + '<rect class="room" x="0" y="0" width="640" height="360" rx="18"/>'
    + '<path d="M32 40h112v100H32z" fill="#fff" stroke="#c2cee4" stroke-width="6"/><path d="M88 40v100M32 90h112" stroke="#c2cee4" stroke-width="4"/><path d="M450 96h140v8H450zM470 58h22v38h-22zM500 68h30v28h-30z" fill="#a8b9e3"/>'
    + '<path class="floor" d="M0 276h640v84H0z"/>'
    + '<path class="desk" d="M118 226h404l34 78H84z"/>'
    + '<path class="desk-edge" d="M96 304h448"/>'
    + decor
    + "</svg>";
}

const RENDER = {
  idSamples: (spec, copy) => `<div class="id-samples">${(spec.labels ?? []).map(label=>`<div class="sample-id"><div class="id-portrait"></div><div class="id-lines">SAMPLE ID<br><span>— — —</span></div><div class="rejection">✗ ${esc(label)}</div><div class="correction"><span class="mark mark--ok" aria-hidden="true">✓</span></div></div>`).join('')}</div>${spec.note ? `<small>${esc(spec.note)}</small>` : ''}`,
  transferMatch: (spec, copy) => `<div class="transfer-match"><div class="transfer-end"><h2>${esc(spec.sender)}</h2><p>${esc(copy.asset)} · <b>${esc(spec.coin)}</b></p><p>${esc(copy.network)} · <b>${esc(spec.network)}</b></p></div><div class="match-connector">✓</div><div class="transfer-end"><h2>${esc(spec.receiver)}</h2><p>${esc(copy.asset)} · <b>${esc(spec.coin)}</b></p><p>${esc(copy.network)} · <b>${esc(spec.network)}</b></p></div></div>${spec.note ? `<small>${esc(spec.note)}</small>` : ''}`,
  marginFlow: (spec, copy) => `<div class="margin-flow"><div class="box">${esc(copy.available)}<b>${esc(spec.balance)}</b></div><div class="pipe"><i></i></div><div class="box">${esc(copy.isolated)}<b>${esc(spec.margin)}</b></div></div><div class="auto-toggle" data-auto-add="${Boolean(spec.autoAdd)}">${esc(copy.autoAdd)} · ${esc(spec.autoAdd ? copy.on : copy.off)}</div>${spec.autoAdd ? `<div class="risk-total">${esc(copy.moneyAtRisk)} · <b data-risk-initial="${esc(spec.margin)}">${esc(spec.margin)} + …</b></div>` : ''}<p>${esc(spec.label ?? '')}</p>${spec.note ? `<small>${esc(spec.note)}</small>` : ''}`,
  priceBoard: (spec, copy) => {
    const rows = asArray(spec.rows || spec.items).map((row) => rowBlock([
      cell(copy.symbol, row.symbol),
      cell(copy.price, row.price),
      cell(copy.value, row.change ?? row.value),
    ]));
    return panel(copy.priceBoard, rows);
  },
  orderTicket: (spec, copy) => {
    if (!["market", "limit"].includes(spec.orderType)) throw new TypeError("Invalid order type");
    const mode = spec.orderType === "limit" ? copy.limit : copy.market;
    // `amount` (money to spend) and `quantity` (coins) are different fields; show whichever the lesson supplies.
    const cells = [cell(copy.type, mode), cell(copy.side, spec.side), spec.amount !== undefined ? cell(copy.amount_, spec.amount) : cell(copy.quantity, spec.quantity)];
    if (spec.orderType === "limit") cells.splice(2, 0, cell(copy.price, spec.price));
    return panel(copy.orderTicket, [rowBlock(cells, "order-row")]);
  },
  balanceLedger: (spec, copy) => panel(copy.balanceLedger, asArray(spec.rows).map((row) => rowBlock([
    cell(copy.asset, row.asset),
    cell(copy.available, row.available),
    cell(copy.locked, row.locked),
  ]))),
  addressForm: (spec, copy) => panel(copy.addressForm, [rowBlock([
    cell(copy.network, spec.network),
    cell(copy.address, spec.address),
    cell(copy.memo, spec.memo),
  ])]),
  riskMeter: (spec, copy) => {
    const level = finiteInRange(spec.level, 0, 100, "risk level");
    return panel(copy.riskMeter, [`<div class="meter risk-meter-fill" data-level="${esc(level)}"><span class="meter-bar" style="width:${esc(level)}%"></span></div>${rowBlock([cell(copy.level, level)], "risk-row")}`]);
  },
  // Readable at 1080p: wide candles, one OHLC legend row for the latest candle; `annotate` labels its four prices in-chart.
  candlestickChart: (spec, copy) => {
    const rawCandles = asArray(spec.ohlc);
    if (!rawCandles.length) throw new TypeError("Invalid candles: empty");
    const candles = rawCandles.map(validCandle);
    const min = Math.min(...candles.map((x) => x.low));
    const max = Math.max(...candles.map((x) => x.high));
    const span = max - min || 1;
    const annotate = Boolean(spec.annotate);
    const [W, H, top, bottom] = [640, 260, 24, 236];
    const plotWidth = annotate ? 180 : W - 40;
    const step = plotWidth / candles.length;
    const bodyWidth = Math.min(64, step * 0.5);
    const y = (v) => bottom - ((v - min) / span) * (bottom - top);
    const num = (v) => Number(v).toLocaleString("en-US");
    const bars = candles.map((c, i) => {
      const x = 20 + i * step + step / 2;
      const yOpen = y(c.open), yClose = y(c.close);
      const bodyTop = Math.min(yOpen, yClose), h = Math.max(4, Math.abs(yOpen - yClose));
      const direction = c.close >= c.open ? "up" : "down";
      const labels = annotate && i === candles.length - 1
        ? [[copy.high, c.high, y(c.high)], [direction === "up" ? copy.close : copy.open, direction === "up" ? c.close : c.open, bodyTop], [direction === "up" ? copy.open : copy.close, direction === "up" ? c.open : c.close, bodyTop + h], [copy.low, c.low, y(c.low)]]
          .map(([label, value, ly]) => `<path class="chart-leader" d="M${fmt(x + bodyWidth / 2 + 6)} ${fmt(ly)}H${fmt(x + bodyWidth / 2 + 40)}"/><text x="${fmt(x + bodyWidth / 2 + 48)}" y="${fmt(ly + 13)}">${esc(label)} ${esc(num(value))}</text>`).join("")
        : "";
      return `<g class="candle candle-${direction}" data-o="${esc(c.open)}" data-h="${esc(c.high)}" data-l="${esc(c.low)}" data-c="${esc(c.close)}"><path d="M${fmt(x)} ${fmt(y(c.high))}V${fmt(y(c.low))}"/><rect x="${fmt(x - bodyWidth / 2)}" y="${fmt(bodyTop)}" width="${fmt(bodyWidth)}" height="${fmt(h)}" rx="4"/></g>${labels}`;
    }).join("");
    const last = candles.at(-1);
    const legend = annotate ? [] : [rowBlock([
      cell(copy.open, num(last.open)),
      cell(copy.high, num(last.high)),
      cell(copy.low, num(last.low)),
      cell(copy.close, num(last.close)),
    ], `ohlc-row candle-${last.close >= last.open ? "up" : "down"}`)];
    return panel(copy.candlestickChart, [`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(copy.candlestickChart)}">${bars}</svg>`, ...legend]);
  },
  margin: (spec, copy) => {
    if (!["isolated", "cross"].includes(spec.mode)) throw new TypeError("Invalid margin mode");
    const modeClass = spec.mode === "cross" ? "margin-pool" : "margin-box";
    const modeLabel = spec.mode === "cross" ? copy.cross : copy.isolated;
    const positionRows = asArray(spec.positions).map((position) => rowBlock([
      cell(copy.position, position.label),
      cell(copy.amount, position.amount),
    ], "position-row"));
    return panel(copy.margin, [`<div class="${modeClass}">${rowBlock([
      cell(copy.type, modeLabel),
      cell(copy.balance, spec.balance),
      cell(copy.autoAdd, spec.autoAdd ? copy.on : copy.off),
      cell(copy.poolScope, spec.poolScope),
    ], "margin-summary")}${positionRows.join("")}</div>`]);
  },
  checklist: (spec, copy) => panel(copy.checklist, asArray(spec.items).map((item) => rowBlock([
    mark(item.done),
    cell(copy.step, item.label ?? item),
  ]))),
  identity: (spec, copy) => panel(copy.identity, [
    ...asArray(spec.steps).map((step) => rowBlock([cell(copy.step, step.label ?? step), cell(copy.status, step.status)])),
    rowBlock([cell(copy.photos, spec.photos ? copy.complete : copy.notProvided), cell(copy.note, spec.fictionalNote)]),
  ]),
  // Season 1 teaching widgets. Every value is a preformatted, supplied prop; `.reveal` items are staged by motion.js.
  formula: (spec) => `<div class="formula">${asArray(spec.rows).map((row) => `<div class="formula-row reveal${row.emphasis ? " formula-row--em" : ""}"><span class="formula-expr">${esc(row.expr)}</span>${row.result !== undefined ? `<span class="formula-eq">=</span><b class="formula-result">${esc(row.result)}</b>` : ""}</div>`).join("")}${spec.note ? `<p class="formula-note reveal">${esc(spec.note)}</p>` : ""}</div>`,
  cards: (spec) => {
    const items = asArray(spec.items);
    if (!items.length) throw new TypeError("Invalid cards: empty");
    const sep = spec.separator ? `<span class="card-sep" aria-hidden="true">${esc(spec.separator)}</span>` : "";
    return `<div class="cards cards--${Math.min(items.length, 4)}">${items.map((item) => `<div class="teach-card reveal${item.mark ? ` teach-card--${esc(item.mark)}` : ""}">${item.mark ? tone(item.mark) : ""}<b>${esc(item.label)}</b>${item.value !== undefined ? `<span class="teach-card-value">${esc(item.value)}</span>` : ""}</div>`).join(sep)}</div>`;
  },
  flow: (spec) => {
    const steps = asArray(spec.steps);
    if (steps.length < 2) throw new TypeError("Invalid flow: needs at least two steps");
    return `<div class="flow">${steps.map((step) => {
      const item = typeof step === "object" && step !== null ? step : { label: step };
      return `<div class="flow-step reveal${item.state ? ` flow-step--${esc(item.state)}` : ""}">${item.state ? tone(item.state) : ""}<b>${esc(item.label)}</b>${item.note !== undefined ? `<span>${esc(item.note)}</span>` : ""}</div>`;
    }).join('<span class="flow-arrow reveal" aria-hidden="true">→</span>')}</div>${spec.note ? `<p class="flow-note reveal">${esc(spec.note)}</p>` : ""}`;
  },
  quiz: (spec) => {
    if (!spec.question) throw new TypeError("Invalid quiz: question required");
    const options = asArray(spec.options);
    const verdictTone = spec.tone === "ok" ? "ok" : "no";
    return `<div class="quiz"><p class="quiz-question">${esc(spec.question)}</p>${options.length ? `<div class="quiz-options">${options.map((option) => `<div class="quiz-option" data-correct="${Boolean(option.correct)}"><span class="quiz-mark">${option.correct ? tone("ok") : tone("no")}</span><b>${esc(option.label)}</b></div>`).join("")}</div>` : ""}${spec.verdict ? `<div class="quiz-verdict quiz-verdict--${verdictTone}">${esc(spec.verdict)}</div>` : ""}</div>`;
  },
  compare: (spec) => {
    const side = (value, key) => `<div class="compare-side compare-side--${key} reveal"><h2>${esc(value?.title)}</h2>${asArray(value?.rows).map((row) => `<p>${esc(row)}</p>`).join("")}</div>`;
    if (!spec.left?.title || !spec.right?.title) throw new TypeError("Invalid compare: both sides need a title");
    return `<div class="compare">${side(spec.left, "left")}<span class="compare-vs" aria-hidden="true">${esc(spec.divider ?? "≠")}</span>${side(spec.right, "right")}</div>`;
  },
  orderBook: (spec, copy) => {
    const levels = asArray(spec.levels);
    if (!levels.length) throw new TypeError("Invalid order book: empty");
    const rows = levels.map((level) => `<div class="book-level reveal${level.fill ? " book-level--fill" : ""}"><b>${esc(level.price)}</b><span>${esc(level.size)}</span>${level.fill ? tone("ok") : ""}</div>`).join("");
    const head = `<div class="book-head"><span>${esc(copy.price)}</span><span>${esc(copy.size)}</span></div>`;
    const foot = spec.average !== undefined ? `<div class="book-foot reveal">${esc(copy.average)} <b>${esc(spec.average)}</b></div>` : spec.last !== undefined ? `<div class="book-foot reveal">${esc(copy.lastPrice)} <b>${esc(spec.last)}</b></div>` : "";
    return `<div class="order-book"><div class="chip">${esc(copy.orderBook)}</div>${head}${rows}${foot}</div>`;
  },
  bufferGauge: (spec) => {
    const from = finiteInRange(spec.from, 0, 100, "gauge start");
    const to = finiteInRange(spec.to ?? spec.from, 0, 100, "gauge end");
    const line = finiteInRange(spec.line, 0, 100, "gauge line");
    return `<div class="buffer-gauge" data-from="${esc(from)}" data-to="${esc(to)}"><div class="gauge-track"><span class="gauge-fill" style="width:${esc(from)}%"></span><i class="gauge-line" style="inset-inline-start:${esc(line)}%"></i></div><div class="gauge-legend"><span class="gauge-key gauge-key--fill">${esc(spec.fillLabel)}</span><span class="gauge-key gauge-key--line">${esc(spec.lineLabel)}</span></div></div>`;
  },
  warning: (spec, copy) => panel(copy.warning, [rowBlock([`<span class="mark mark--warn" aria-hidden="true">!</span>`, cell(copy.note, spec.message)])]),
};

function panel(label, rows) {
  return `<div class="panel"><div class="chip">${esc(label)}</div><div class="rows">${rows.join("")}</div></div>`;
}

function rowBlock(cells, className = "") {
  return `<div class="row${className ? ` ${esc(className)}` : ""}">${cells.join("")}</div>`;
}

function cell(label, value) {
  return `<div class="field"><span>${esc(label)}</span><b>${esc(value ?? "—")}</b></div>`;
}

// Owner review 2026-10-12: text badges ("Complete"/"Pending") read like a status log — lessons use ✓ / ✗ marks.
function mark(ok) {
  return `<span class="mark ${ok ? "mark--ok" : "mark--no"}" aria-hidden="true">${ok ? "✓" : "✗"}</span>`;
}

function tone(kind) {
  const glyph = { ok: "✓", no: "✗", warn: "!" }[kind];
  if (!glyph) throw new TypeError(`Invalid mark: ${kind}`);
  return `<span class="mark mark--${kind}" aria-hidden="true">${glyph}</span>`;
}

function chip(value) {
  return `<span class="chip">${esc(value)}</span>`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function finiteInRange(value, min, max, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new TypeError(`Invalid ${label}`);
  return number;
}

function validCandle(value) {
  const candle = {
    open: Number(value?.open),
    high: Number(value?.high),
    low: Number(value?.low),
    close: Number(value?.close),
  };
  for (const [key, number] of Object.entries(candle)) {
    if (!Number.isFinite(number)) throw new TypeError(`Invalid candle ${key}`);
  }
  if (candle.high < Math.max(candle.open, candle.close, candle.low)) throw new TypeError("Invalid candle high");
  if (candle.low > Math.min(candle.open, candle.close, candle.high)) throw new TypeError("Invalid candle low");
  return candle;
}

function fmt(number) {
  return Number(number).toFixed(2).replace(/\.?0+$/, "");
}
