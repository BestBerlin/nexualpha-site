// Plain-language whale sentences for 17 locales (2026-10-14).
// Each builder returns [before, amount, after] so the UI can make the dollar amount bright and bold in place, e.g.
// "巨鲸 0x7a…3f 连续 3 天加仓 HYPE 多单，累计 " + "$8.2M" + "，均价 $41.2".
// p = { who, coin, side: "long"|"short"|"spot", days, n, period, lev, avg, pnl, pnlUp, from, to, qty }

const cjkGap = (name) => (/^[\x00-\x7F]/.test(String(name || "")) ? ` ${name} ` : name);

const zhHans = {
  dur: (h) => (h >= 48 ? `${Math.round(h / 24)} 天` : `${h} 小时`),
  whale: (a) => `巨鲸 ${a}`, wallet: (a) => `钱包 ${a}`, side: { long: "多单", short: "空单", spot: "现货" },
  avg: (v) => `，均价 ${v}`, exit: (v) => `，均价 ${v}`, lev: (v) => `，${v} 倍`, total: "，累计 ", sum: "，合计 ",
  pnl: (v, up) => `，${up ? "盈利" : "亏损"} ${v}`,
  add: (p) => p.days >= 2 ? `${p.who} 连续 ${p.days} 天加仓 ${p.coin} ${p.sideWord}` : `${p.who} 24 小时内多次加仓 ${p.coin} ${p.sideWord}`,
  buy: (p) => p.days >= 2 ? `${p.who} 连续 ${p.days} 天买入 ${p.coin} 现货` : `${p.who} 24 小时内多次买入 ${p.coin} 现货`,
  reduce: (p) => p.days >= 2 ? `${p.who} 连续 ${p.days} 天减仓 ${p.coin} ${p.sideWord}` : `${p.who} 24 小时内多次减仓 ${p.coin} ${p.sideWord}`,
  sell: (p) => p.days >= 2 ? `${p.who} 连续 ${p.days} 天卖出 ${p.coin} 现货` : `${p.who} 24 小时内多次卖出 ${p.coin} 现货`,
  addPeriod: (p) => `${p.who} ${p.period}内持续加仓 ${p.coin} ${p.sideWord}`,
  fresh: (p) => `${p.who} 新开 ${p.coin} ${p.sideWord}，仓位 `,
  cluster: (p) => `${p.n} 个巨鲸 24 小时内同步${p.side === "short" ? "做空" : "做多"} ${p.coin}`,
  withdraw: (p) => `${p.who} ${p.period}内从交易所提走 ${p.coin}`,
  open: (p) => `${p.who} 在 Hyperliquid 开${p.side === "short" ? "空" : "多"} ${p.coin} `,
  increase: (p) => `${p.who} 在 Hyperliquid 加仓${p.side === "short" ? "做空" : "做多"} ${p.coin}，持仓升至 `,
  decrease: (p) => `${p.who} 在 Hyperliquid 减仓${p.side === "short" ? "做空" : "做多"} ${p.coin}，持仓降至 `,
  close: (p) => `${p.who} 平掉 ${p.coin} ${p.sideWord} `,
  liquidation: (p) => `${p.who} 的 ${p.coin} ${p.sideWord}被强平 `,
  hold: (p) => `${p.who} 持有 ${p.coin} ${p.sideWord} `,
  transfer: (p) => [`${p.qty}（`, `）从${cjkGap(p.from)}转入${cjkGap(p.to)}`.replace(/\s+$/, ""), ], unknown: "未知钱包",
};

const zhHant = {
  ...zhHans,
  dur: (h) => (h >= 48 ? `${Math.round(h / 24)} 天` : `${h} 小時`),
  whale: (a) => `巨鯨 ${a}`, wallet: (a) => `錢包 ${a}`, side: { long: "多單", short: "空單", spot: "現貨" },
  avg: (v) => `，均價 ${v}`, exit: (v) => `，均價 ${v}`, total: "，累計 ", sum: "，合計 ",
  pnl: (v, up) => `，${up ? "獲利" : "虧損"} ${v}`,
  add: (p) => p.days >= 2 ? `${p.who} 連續 ${p.days} 天加倉 ${p.coin} ${p.sideWord}` : `${p.who} 24 小時內多次加倉 ${p.coin} ${p.sideWord}`,
  buy: (p) => p.days >= 2 ? `${p.who} 連續 ${p.days} 天買入 ${p.coin} 現貨` : `${p.who} 24 小時內多次買入 ${p.coin} 現貨`,
  reduce: (p) => p.days >= 2 ? `${p.who} 連續 ${p.days} 天減倉 ${p.coin} ${p.sideWord}` : `${p.who} 24 小時內多次減倉 ${p.coin} ${p.sideWord}`,
  sell: (p) => p.days >= 2 ? `${p.who} 連續 ${p.days} 天賣出 ${p.coin} 現貨` : `${p.who} 24 小時內多次賣出 ${p.coin} 現貨`,
  addPeriod: (p) => `${p.who} ${p.period}內持續加倉 ${p.coin} ${p.sideWord}`,
  fresh: (p) => `${p.who} 新開 ${p.coin} ${p.sideWord}，倉位 `,
  cluster: (p) => `${p.n} 個巨鯨 24 小時內同步${p.side === "short" ? "做空" : "做多"} ${p.coin}`,
  withdraw: (p) => `${p.who} ${p.period}內從交易所提走 ${p.coin}`,
  open: (p) => `${p.who} 在 Hyperliquid 開${p.side === "short" ? "空" : "多"} ${p.coin} `,
  increase: (p) => `${p.who} 在 Hyperliquid 加倉${p.side === "short" ? "做空" : "做多"} ${p.coin}，持倉升至 `,
  decrease: (p) => `${p.who} 在 Hyperliquid 減倉${p.side === "short" ? "做空" : "做多"} ${p.coin}，持倉降至 `,
  close: (p) => `${p.who} 平掉 ${p.coin} ${p.sideWord} `,
  liquidation: (p) => `${p.who} 的 ${p.coin} ${p.sideWord}被強平 `,
  hold: (p) => `${p.who} 持有 ${p.coin} ${p.sideWord} `,
  transfer: (p) => [`${p.qty}（`, `）從${cjkGap(p.from)}轉入${cjkGap(p.to)}`.replace(/\s+$/, "")], unknown: "未知錢包",
};

// Latin-script locales share one shape: subject + verb phrase, ", total $X", ", avg $Y".
function latin(w) {
  return {
    dur: w.dur || ((h) => (h >= 48 ? `${Math.round(h / 24)}d` : `${h}h`)),
    whale: (a) => `${w.whale} ${a}`, wallet: (a) => `${w.wallet} ${a}`, side: w.side,
    avg: (v) => `, ${w.avg} ${v}`, exit: (v) => `, ${w.exit} ${v}`, lev: (v) => `, ${v}x`, total: `, ${w.total} `, sum: `, ${w.sum} `,
    pnl: (v, up) => `, ${up ? w.gain : w.loss} ${v}`,
    add: (p) => p.days >= 2 ? w.addDays(p) : w.addHours(p),
    buy: (p) => p.days >= 2 ? w.buyDays(p) : w.buyHours(p),
    reduce: (p) => p.days >= 2 ? w.reduceDays(p) : w.reduceHours(p),
    sell: (p) => p.days >= 2 ? w.sellDays(p) : w.sellHours(p),
    addPeriod: w.addPeriod, fresh: (p) => `${w.fresh(p)}, `, cluster: w.cluster, withdraw: w.withdraw,
    open: (p) => `${w.open(p)}, `, increase: (p) => `${w.increase(p)}, ${w.now} `, decrease: (p) => `${w.decrease(p)}, ${w.now} `,
    close: (p) => `${w.close(p)}, `, liquidation: (p) => `${w.liquidation(p)}, `, hold: (p) => `${w.hold(p)}, `,
    transfer: (p) => [`${p.qty} (`, `) ${w.moved(p)}`], unknown: w.unknown,
  };
}

const en = latin({
  dur: (h) => (h >= 48 ? `${Math.round(h / 24)} days` : `${h}h`),
  whale: "Whale", wallet: "Wallet", side: { long: "long", short: "short", spot: "spot" }, avg: "avg", exit: "avg exit", total: "total", sum: "combined", gain: "profit", loss: "loss", now: "now", unknown: "an unknown wallet",
  addDays: (p) => `${p.who} added to a ${p.coin} ${p.sideWord} ${p.days} days in a row`, addHours: (p) => `${p.who} added to a ${p.coin} ${p.sideWord} several times in 24h`,
  buyDays: (p) => `${p.who} bought ${p.coin} spot ${p.days} days in a row`, buyHours: (p) => `${p.who} bought ${p.coin} spot several times in 24h`,
  reduceDays: (p) => `${p.who} cut a ${p.coin} ${p.sideWord} ${p.days} days in a row`, reduceHours: (p) => `${p.who} cut a ${p.coin} ${p.sideWord} several times in 24h`,
  sellDays: (p) => `${p.who} sold ${p.coin} spot ${p.days} days in a row`, sellHours: (p) => `${p.who} sold ${p.coin} spot several times in 24h`,
  addPeriod: (p) => `${p.who} kept adding to a ${p.coin} ${p.sideWord} over ${p.period}`, fresh: (p) => `${p.who} opened a new ${p.coin} ${p.sideWord}`,
  cluster: (p) => `${p.n} whales went ${p.side === "short" ? "short" : "long"} ${p.coin} within 24h`, withdraw: (p) => `${p.who} pulled ${p.coin} off exchanges over ${p.period}`,
  open: (p) => `${p.who} opened a ${p.coin} ${p.sideWord} on Hyperliquid`, increase: (p) => `${p.who} added to a ${p.coin} ${p.sideWord} on Hyperliquid`, decrease: (p) => `${p.who} trimmed a ${p.coin} ${p.sideWord} on Hyperliquid`,
  close: (p) => `${p.who} closed a ${p.coin} ${p.sideWord}`, liquidation: (p) => `${p.who} was liquidated on a ${p.coin} ${p.sideWord}`, hold: (p) => `${p.who} holds a ${p.coin} ${p.sideWord}`,
  moved: (p) => `moved from ${p.from} to ${p.to}`,
});

const es = latin({
  whale: "Ballena", wallet: "Billetera", side: { long: "largo", short: "corto", spot: "spot" }, avg: "precio medio", exit: "salida media", total: "en total", sum: "en conjunto", gain: "ganancia", loss: "pérdida", now: "ahora", unknown: "una billetera desconocida",
  addDays: (p) => `${p.who} amplió su ${p.sideWord} en ${p.coin} ${p.days} días seguidos`, addHours: (p) => `${p.who} amplió su ${p.sideWord} en ${p.coin} varias veces en 24 h`,
  buyDays: (p) => `${p.who} compró ${p.coin} spot ${p.days} días seguidos`, buyHours: (p) => `${p.who} compró ${p.coin} spot varias veces en 24 h`,
  reduceDays: (p) => `${p.who} redujo su ${p.sideWord} en ${p.coin} ${p.days} días seguidos`, reduceHours: (p) => `${p.who} redujo su ${p.sideWord} en ${p.coin} varias veces en 24 h`,
  sellDays: (p) => `${p.who} vendió ${p.coin} spot ${p.days} días seguidos`, sellHours: (p) => `${p.who} vendió ${p.coin} spot varias veces en 24 h`,
  addPeriod: (p) => `${p.who} siguió ampliando su ${p.sideWord} en ${p.coin} en ${p.period}`, fresh: (p) => `${p.who} abrió un nuevo ${p.sideWord} en ${p.coin}`,
  cluster: (p) => `${p.n} ballenas abrieron ${p.side === "short" ? "cortos" : "largos"} en ${p.coin} en 24 h`, withdraw: (p) => `${p.who} retiró ${p.coin} de exchanges en ${p.period}`,
  open: (p) => `${p.who} abrió un ${p.sideWord} en ${p.coin} en Hyperliquid`, increase: (p) => `${p.who} amplió su ${p.sideWord} en ${p.coin}`, decrease: (p) => `${p.who} redujo su ${p.sideWord} en ${p.coin}`,
  close: (p) => `${p.who} cerró un ${p.sideWord} en ${p.coin}`, liquidation: (p) => `${p.who} fue liquidada en un ${p.sideWord} de ${p.coin}`, hold: (p) => `${p.who} mantiene un ${p.sideWord} en ${p.coin}`,
  moved: (p) => `de ${p.from} a ${p.to}`,
});

const ptBR = latin({
  whale: "Baleia", wallet: "Carteira", side: { long: "long", short: "short", spot: "spot" }, avg: "preço médio", exit: "saída média", total: "no total", sum: "somados", gain: "lucro", loss: "prejuízo", now: "agora", unknown: "uma carteira desconhecida",
  addDays: (p) => `${p.who} aumentou o ${p.sideWord} em ${p.coin} ${p.days} dias seguidos`, addHours: (p) => `${p.who} aumentou o ${p.sideWord} em ${p.coin} várias vezes em 24 h`,
  buyDays: (p) => `${p.who} comprou ${p.coin} spot ${p.days} dias seguidos`, buyHours: (p) => `${p.who} comprou ${p.coin} spot várias vezes em 24 h`,
  reduceDays: (p) => `${p.who} reduziu o ${p.sideWord} em ${p.coin} ${p.days} dias seguidos`, reduceHours: (p) => `${p.who} reduziu o ${p.sideWord} em ${p.coin} várias vezes em 24 h`,
  sellDays: (p) => `${p.who} vendeu ${p.coin} spot ${p.days} dias seguidos`, sellHours: (p) => `${p.who} vendeu ${p.coin} spot várias vezes em 24 h`,
  addPeriod: (p) => `${p.who} seguiu aumentando o ${p.sideWord} em ${p.coin} em ${p.period}`, fresh: (p) => `${p.who} abriu um novo ${p.sideWord} em ${p.coin}`,
  cluster: (p) => `${p.n} baleias abriram ${p.side === "short" ? "shorts" : "longs"} em ${p.coin} em 24 h`, withdraw: (p) => `${p.who} sacou ${p.coin} de exchanges em ${p.period}`,
  open: (p) => `${p.who} abriu um ${p.sideWord} em ${p.coin} na Hyperliquid`, increase: (p) => `${p.who} aumentou o ${p.sideWord} em ${p.coin}`, decrease: (p) => `${p.who} reduziu o ${p.sideWord} em ${p.coin}`,
  close: (p) => `${p.who} fechou um ${p.sideWord} em ${p.coin}`, liquidation: (p) => `${p.who} foi liquidada num ${p.sideWord} de ${p.coin}`, hold: (p) => `${p.who} mantém um ${p.sideWord} em ${p.coin}`,
  moved: (p) => `de ${p.from} para ${p.to}`,
});

const fr = latin({
  whale: "Baleine", wallet: "Wallet", side: { long: "long", short: "short", spot: "spot" }, avg: "prix moyen", exit: "sortie moyenne", total: "au total", sum: "cumulés", gain: "gain", loss: "perte", now: "désormais", unknown: "un wallet inconnu",
  addDays: (p) => `${p.who} renforce son ${p.sideWord} ${p.coin} ${p.days} jours d’affilée`, addHours: (p) => `${p.who} renforce son ${p.sideWord} ${p.coin} plusieurs fois en 24 h`,
  buyDays: (p) => `${p.who} achète du ${p.coin} spot ${p.days} jours d’affilée`, buyHours: (p) => `${p.who} achète du ${p.coin} spot plusieurs fois en 24 h`,
  reduceDays: (p) => `${p.who} allège son ${p.sideWord} ${p.coin} ${p.days} jours d’affilée`, reduceHours: (p) => `${p.who} allège son ${p.sideWord} ${p.coin} plusieurs fois en 24 h`,
  sellDays: (p) => `${p.who} vend du ${p.coin} spot ${p.days} jours d’affilée`, sellHours: (p) => `${p.who} vend du ${p.coin} spot plusieurs fois en 24 h`,
  addPeriod: (p) => `${p.who} renforce son ${p.sideWord} ${p.coin} sur ${p.period}`, fresh: (p) => `${p.who} ouvre un nouveau ${p.sideWord} ${p.coin}`,
  cluster: (p) => `${p.n} baleines passent ${p.side === "short" ? "short" : "long"} sur ${p.coin} en 24 h`, withdraw: (p) => `${p.who} retire du ${p.coin} des exchanges sur ${p.period}`,
  open: (p) => `${p.who} ouvre un ${p.sideWord} ${p.coin} sur Hyperliquid`, increase: (p) => `${p.who} renforce son ${p.sideWord} ${p.coin}`, decrease: (p) => `${p.who} allège son ${p.sideWord} ${p.coin}`,
  close: (p) => `${p.who} clôt un ${p.sideWord} ${p.coin}`, liquidation: (p) => `${p.who} est liquidée sur un ${p.sideWord} ${p.coin}`, hold: (p) => `${p.who} détient un ${p.sideWord} ${p.coin}`,
  moved: (p) => `de ${p.from} vers ${p.to}`,
});

const de = latin({
  whale: "Whale", wallet: "Wallet", side: { long: "Long", short: "Short", spot: "Spot" }, avg: "Ø", exit: "Ø Ausstieg", total: "insgesamt", sum: "zusammen", gain: "Gewinn", loss: "Verlust", now: "jetzt", unknown: "unbekannter Wallet",
  addDays: (p) => `${p.who} stockt ${p.coin}-${p.sideWord} ${p.days} Tage in Folge auf`, addHours: (p) => `${p.who} stockt ${p.coin}-${p.sideWord} in 24 h mehrfach auf`,
  buyDays: (p) => `${p.who} kauft ${p.coin} spot ${p.days} Tage in Folge`, buyHours: (p) => `${p.who} kauft ${p.coin} spot in 24 h mehrfach`,
  reduceDays: (p) => `${p.who} baut ${p.coin}-${p.sideWord} ${p.days} Tage in Folge ab`, reduceHours: (p) => `${p.who} baut ${p.coin}-${p.sideWord} in 24 h mehrfach ab`,
  sellDays: (p) => `${p.who} verkauft ${p.coin} spot ${p.days} Tage in Folge`, sellHours: (p) => `${p.who} verkauft ${p.coin} spot in 24 h mehrfach`,
  addPeriod: (p) => `${p.who} stockt ${p.coin}-${p.sideWord} über ${p.period} auf`, fresh: (p) => `${p.who} eröffnet neuen ${p.coin}-${p.sideWord}`,
  cluster: (p) => `${p.n} Whales gehen binnen 24 h ${p.side === "short" ? "short" : "long"} auf ${p.coin}`, withdraw: (p) => `${p.who} zieht ${p.coin} über ${p.period} von Börsen ab`,
  open: (p) => `${p.who} eröffnet ${p.coin}-${p.sideWord} auf Hyperliquid`, increase: (p) => `${p.who} stockt ${p.coin}-${p.sideWord} auf`, decrease: (p) => `${p.who} reduziert ${p.coin}-${p.sideWord}`,
  close: (p) => `${p.who} schließt ${p.coin}-${p.sideWord}`, liquidation: (p) => `${p.who}: ${p.coin}-${p.sideWord} liquidiert`, hold: (p) => `${p.who} hält ${p.coin}-${p.sideWord}`,
  moved: (p) => `von ${p.from} zu ${p.to}`,
});

const it = latin({
  whale: "Balena", wallet: "Wallet", side: { long: "long", short: "short", spot: "spot" }, avg: "prezzo medio", exit: "uscita media", total: "in totale", sum: "in tutto", gain: "profitto", loss: "perdita", now: "ora", unknown: "un wallet sconosciuto",
  addDays: (p) => `${p.who} aumenta il ${p.sideWord} su ${p.coin} da ${p.days} giorni di fila`, addHours: (p) => `${p.who} aumenta il ${p.sideWord} su ${p.coin} più volte in 24 h`,
  buyDays: (p) => `${p.who} compra ${p.coin} spot da ${p.days} giorni di fila`, buyHours: (p) => `${p.who} compra ${p.coin} spot più volte in 24 h`,
  reduceDays: (p) => `${p.who} riduce il ${p.sideWord} su ${p.coin} da ${p.days} giorni di fila`, reduceHours: (p) => `${p.who} riduce il ${p.sideWord} su ${p.coin} più volte in 24 h`,
  sellDays: (p) => `${p.who} vende ${p.coin} spot da ${p.days} giorni di fila`, sellHours: (p) => `${p.who} vende ${p.coin} spot più volte in 24 h`,
  addPeriod: (p) => `${p.who} continua ad aumentare il ${p.sideWord} su ${p.coin} in ${p.period}`, fresh: (p) => `${p.who} apre un nuovo ${p.sideWord} su ${p.coin}`,
  cluster: (p) => `${p.n} balene vanno ${p.side === "short" ? "short" : "long"} su ${p.coin} in 24 h`, withdraw: (p) => `${p.who} ritira ${p.coin} dagli exchange in ${p.period}`,
  open: (p) => `${p.who} apre un ${p.sideWord} su ${p.coin} su Hyperliquid`, increase: (p) => `${p.who} aumenta il ${p.sideWord} su ${p.coin}`, decrease: (p) => `${p.who} riduce il ${p.sideWord} su ${p.coin}`,
  close: (p) => `${p.who} chiude un ${p.sideWord} su ${p.coin}`, liquidation: (p) => `${p.who} liquidata su un ${p.sideWord} ${p.coin}`, hold: (p) => `${p.who} detiene un ${p.sideWord} su ${p.coin}`,
  moved: (p) => `da ${p.from} a ${p.to}`,
});

const ru = latin({
  whale: "Кит", wallet: "Кошелёк", side: { long: "лонг", short: "шорт", spot: "спот" }, avg: "средняя", exit: "средний выход", total: "всего", sum: "в сумме", gain: "прибыль", loss: "убыток", now: "теперь", unknown: "неизвестного кошелька",
  addDays: (p) => `${p.who} ${p.days} дня подряд наращивает ${p.sideWord} ${p.coin}`, addHours: (p) => `${p.who} несколько раз за 24 ч нарастил ${p.sideWord} ${p.coin}`,
  buyDays: (p) => `${p.who} ${p.days} дня подряд покупает ${p.coin} на споте`, buyHours: (p) => `${p.who} несколько раз за 24 ч купил ${p.coin} на споте`,
  reduceDays: (p) => `${p.who} ${p.days} дня подряд сокращает ${p.sideWord} ${p.coin}`, reduceHours: (p) => `${p.who} несколько раз за 24 ч сократил ${p.sideWord} ${p.coin}`,
  sellDays: (p) => `${p.who} ${p.days} дня подряд продаёт ${p.coin} на споте`, sellHours: (p) => `${p.who} несколько раз за 24 ч продал ${p.coin} на споте`,
  addPeriod: (p) => `${p.who} наращивает ${p.sideWord} ${p.coin} за ${p.period}`, fresh: (p) => `${p.who} открыл новый ${p.sideWord} ${p.coin}`,
  cluster: (p) => `${p.n} кита за 24 ч открыли ${p.side === "short" ? "шорт" : "лонг"} ${p.coin}`, withdraw: (p) => `${p.who} вывел ${p.coin} с бирж за ${p.period}`,
  open: (p) => `${p.who} открыл ${p.sideWord} ${p.coin} на Hyperliquid`, increase: (p) => `${p.who} нарастил ${p.sideWord} ${p.coin}`, decrease: (p) => `${p.who} сократил ${p.sideWord} ${p.coin}`,
  close: (p) => `${p.who} закрыл ${p.sideWord} ${p.coin}`, liquidation: (p) => `${p.who}: ${p.sideWord} ${p.coin} ликвидирован`, hold: (p) => `${p.who} держит ${p.sideWord} ${p.coin}`,
  moved: (p) => `с ${p.from} на ${p.to}`,
});

const uk = latin({
  whale: "Кит", wallet: "Гаманець", side: { long: "лонг", short: "шорт", spot: "спот" }, avg: "середня", exit: "середній вихід", total: "усього", sum: "разом", gain: "прибуток", loss: "збиток", now: "тепер", unknown: "невідомого гаманця",
  addDays: (p) => `${p.who} ${p.days} дні поспіль нарощує ${p.sideWord} ${p.coin}`, addHours: (p) => `${p.who} кілька разів за 24 год наростив ${p.sideWord} ${p.coin}`,
  buyDays: (p) => `${p.who} ${p.days} дні поспіль купує ${p.coin} на споті`, buyHours: (p) => `${p.who} кілька разів за 24 год купив ${p.coin} на споті`,
  reduceDays: (p) => `${p.who} ${p.days} дні поспіль скорочує ${p.sideWord} ${p.coin}`, reduceHours: (p) => `${p.who} кілька разів за 24 год скоротив ${p.sideWord} ${p.coin}`,
  sellDays: (p) => `${p.who} ${p.days} дні поспіль продає ${p.coin} на споті`, sellHours: (p) => `${p.who} кілька разів за 24 год продав ${p.coin} на споті`,
  addPeriod: (p) => `${p.who} нарощує ${p.sideWord} ${p.coin} за ${p.period}`, fresh: (p) => `${p.who} відкрив новий ${p.sideWord} ${p.coin}`,
  cluster: (p) => `${p.n} кити за 24 год відкрили ${p.side === "short" ? "шорт" : "лонг"} ${p.coin}`, withdraw: (p) => `${p.who} вивів ${p.coin} з бірж за ${p.period}`,
  open: (p) => `${p.who} відкрив ${p.sideWord} ${p.coin} на Hyperliquid`, increase: (p) => `${p.who} наростив ${p.sideWord} ${p.coin}`, decrease: (p) => `${p.who} скоротив ${p.sideWord} ${p.coin}`,
  close: (p) => `${p.who} закрив ${p.sideWord} ${p.coin}`, liquidation: (p) => `${p.who}: ${p.sideWord} ${p.coin} ліквідовано`, hold: (p) => `${p.who} тримає ${p.sideWord} ${p.coin}`,
  moved: (p) => `з ${p.from} на ${p.to}`,
});

const tr = latin({
  whale: "Balina", wallet: "Cüzdan", side: { long: "long", short: "short", spot: "spot" }, avg: "ort.", exit: "ort. çıkış", total: "toplam", sum: "toplam", gain: "kâr", loss: "zarar", now: "şimdi", unknown: "bilinmeyen cüzdan",
  addDays: (p) => `${p.who} ${p.days} gündür ${p.coin} ${p.sideWord} pozisyonunu büyütüyor`, addHours: (p) => `${p.who} 24 saatte birkaç kez ${p.coin} ${p.sideWord} ekledi`,
  buyDays: (p) => `${p.who} ${p.days} gündür spot ${p.coin} alıyor`, buyHours: (p) => `${p.who} 24 saatte birkaç kez spot ${p.coin} aldı`,
  reduceDays: (p) => `${p.who} ${p.days} gündür ${p.coin} ${p.sideWord} pozisyonunu azaltıyor`, reduceHours: (p) => `${p.who} 24 saatte birkaç kez ${p.coin} ${p.sideWord} azalttı`,
  sellDays: (p) => `${p.who} ${p.days} gündür spot ${p.coin} satıyor`, sellHours: (p) => `${p.who} 24 saatte birkaç kez spot ${p.coin} sattı`,
  addPeriod: (p) => `${p.who} ${p.period} boyunca ${p.coin} ${p.sideWord} ekledi`, fresh: (p) => `${p.who} yeni ${p.coin} ${p.sideWord} açtı`,
  cluster: (p) => `${p.n} balina 24 saatte ${p.coin} için ${p.side === "short" ? "short" : "long"} açtı`, withdraw: (p) => `${p.who} ${p.period} içinde borsalardan ${p.coin} çekti`,
  open: (p) => `${p.who} Hyperliquid'de ${p.coin} ${p.sideWord} açtı`, increase: (p) => `${p.who} ${p.coin} ${p.sideWord} büyüttü`, decrease: (p) => `${p.who} ${p.coin} ${p.sideWord} azalttı`,
  close: (p) => `${p.who} ${p.coin} ${p.sideWord} kapattı`, liquidation: (p) => `${p.who}: ${p.coin} ${p.sideWord} likide oldu`, hold: (p) => `${p.who} ${p.coin} ${p.sideWord} tutuyor`,
  moved: (p) => `${p.from} → ${p.to}`,
});

const id = latin({
  whale: "Whale", wallet: "Dompet", side: { long: "long", short: "short", spot: "spot" }, avg: "rata-rata", exit: "rata-rata keluar", total: "total", sum: "gabungan", gain: "untung", loss: "rugi", now: "kini", unknown: "dompet tak dikenal",
  addDays: (p) => `${p.who} menambah ${p.sideWord} ${p.coin} ${p.days} hari berturut-turut`, addHours: (p) => `${p.who} beberapa kali menambah ${p.sideWord} ${p.coin} dalam 24 jam`,
  buyDays: (p) => `${p.who} membeli ${p.coin} spot ${p.days} hari berturut-turut`, buyHours: (p) => `${p.who} beberapa kali membeli ${p.coin} spot dalam 24 jam`,
  reduceDays: (p) => `${p.who} mengurangi ${p.sideWord} ${p.coin} ${p.days} hari berturut-turut`, reduceHours: (p) => `${p.who} beberapa kali mengurangi ${p.sideWord} ${p.coin} dalam 24 jam`,
  sellDays: (p) => `${p.who} menjual ${p.coin} spot ${p.days} hari berturut-turut`, sellHours: (p) => `${p.who} beberapa kali menjual ${p.coin} spot dalam 24 jam`,
  addPeriod: (p) => `${p.who} terus menambah ${p.sideWord} ${p.coin} selama ${p.period}`, fresh: (p) => `${p.who} membuka ${p.sideWord} ${p.coin} baru`,
  cluster: (p) => `${p.n} whale membuka ${p.side === "short" ? "short" : "long"} ${p.coin} dalam 24 jam`, withdraw: (p) => `${p.who} menarik ${p.coin} dari exchange selama ${p.period}`,
  open: (p) => `${p.who} membuka ${p.sideWord} ${p.coin} di Hyperliquid`, increase: (p) => `${p.who} menambah ${p.sideWord} ${p.coin}`, decrease: (p) => `${p.who} mengurangi ${p.sideWord} ${p.coin}`,
  close: (p) => `${p.who} menutup ${p.sideWord} ${p.coin}`, liquidation: (p) => `${p.who} terlikuidasi di ${p.sideWord} ${p.coin}`, hold: (p) => `${p.who} memegang ${p.sideWord} ${p.coin}`,
  moved: (p) => `dari ${p.from} ke ${p.to}`,
});

const vi = latin({
  whale: "Cá voi", wallet: "Ví", side: { long: "long", short: "short", spot: "spot" }, avg: "giá TB", exit: "giá thoát TB", total: "tổng", sum: "cộng lại", gain: "lãi", loss: "lỗ", now: "hiện", unknown: "ví chưa xác định",
  addDays: (p) => `${p.who} tăng vị thế ${p.sideWord} ${p.coin} ${p.days} ngày liên tiếp`, addHours: (p) => `${p.who} nhiều lần tăng ${p.sideWord} ${p.coin} trong 24 giờ`,
  buyDays: (p) => `${p.who} mua ${p.coin} spot ${p.days} ngày liên tiếp`, buyHours: (p) => `${p.who} nhiều lần mua ${p.coin} spot trong 24 giờ`,
  reduceDays: (p) => `${p.who} giảm ${p.sideWord} ${p.coin} ${p.days} ngày liên tiếp`, reduceHours: (p) => `${p.who} nhiều lần giảm ${p.sideWord} ${p.coin} trong 24 giờ`,
  sellDays: (p) => `${p.who} bán ${p.coin} spot ${p.days} ngày liên tiếp`, sellHours: (p) => `${p.who} nhiều lần bán ${p.coin} spot trong 24 giờ`,
  addPeriod: (p) => `${p.who} liên tục tăng ${p.sideWord} ${p.coin} trong ${p.period}`, fresh: (p) => `${p.who} mở mới ${p.sideWord} ${p.coin}`,
  cluster: (p) => `${p.n} cá voi cùng ${p.side === "short" ? "short" : "long"} ${p.coin} trong 24 giờ`, withdraw: (p) => `${p.who} rút ${p.coin} khỏi sàn trong ${p.period}`,
  open: (p) => `${p.who} mở ${p.sideWord} ${p.coin} trên Hyperliquid`, increase: (p) => `${p.who} tăng ${p.sideWord} ${p.coin}`, decrease: (p) => `${p.who} giảm ${p.sideWord} ${p.coin}`,
  close: (p) => `${p.who} đóng ${p.sideWord} ${p.coin}`, liquidation: (p) => `${p.who} bị thanh lý ${p.sideWord} ${p.coin}`, hold: (p) => `${p.who} giữ ${p.sideWord} ${p.coin}`,
  moved: (p) => `từ ${p.from} sang ${p.to}`,
});

// CJK / RTL locales without spaces or with their own punctuation.
const ja = {
  ...zhHans,
  dur: (h) => (h >= 48 ? `${Math.round(h / 24)}日間` : `${h}時間`),
  whale: (a) => `クジラ ${a}`, wallet: (a) => `ウォレット ${a}`, side: { long: "ロング", short: "ショート", spot: "現物" },
  avg: (v) => `、平均 ${v}`, exit: (v) => `、平均 ${v}`, lev: (v) => `、${v}倍`, total: "、累計 ", sum: "、合計 ",
  pnl: (v, up) => `、${up ? "利益" : "損失"} ${v}`,
  add: (p) => p.days >= 2 ? `${p.who} が ${p.days} 日連続で ${p.coin} ${p.sideWord}を積み増し` : `${p.who} が 24 時間で複数回 ${p.coin} ${p.sideWord}を積み増し`,
  buy: (p) => p.days >= 2 ? `${p.who} が ${p.days} 日連続で ${p.coin} 現物を購入` : `${p.who} が 24 時間で複数回 ${p.coin} 現物を購入`,
  reduce: (p) => p.days >= 2 ? `${p.who} が ${p.days} 日連続で ${p.coin} ${p.sideWord}を縮小` : `${p.who} が 24 時間で複数回 ${p.coin} ${p.sideWord}を縮小`,
  sell: (p) => p.days >= 2 ? `${p.who} が ${p.days} 日連続で ${p.coin} 現物を売却` : `${p.who} が 24 時間で複数回 ${p.coin} 現物を売却`,
  addPeriod: (p) => `${p.who} が ${p.period}で ${p.coin} ${p.sideWord}を積み増し`,
  fresh: (p) => `${p.who} が ${p.coin} ${p.sideWord}を新規建て、`,
  cluster: (p) => `${p.n} 頭のクジラが 24 時間で ${p.coin} を${p.side === "short" ? "ショート" : "ロング"}`,
  withdraw: (p) => `${p.who} が ${p.period}で取引所から ${p.coin} を引き出し`,
  open: (p) => `${p.who} が Hyperliquid で ${p.coin} ${p.sideWord}を新規建て `,
  increase: (p) => `${p.who} が ${p.coin} ${p.sideWord}を積み増し、現在 `,
  decrease: (p) => `${p.who} が ${p.coin} ${p.sideWord}を縮小、現在 `,
  close: (p) => `${p.who} が ${p.coin} ${p.sideWord}を決済 `,
  liquidation: (p) => `${p.who} の ${p.coin} ${p.sideWord}が清算 `,
  hold: (p) => `${p.who} が ${p.coin} ${p.sideWord}を保有 `,
  transfer: (p) => [`${p.qty}（`, `）${p.from} → ${p.to}`], unknown: "不明ウォレット",
};

const ko = {
  ...zhHans,
  dur: (h) => (h >= 48 ? `${Math.round(h / 24)}일` : `${h}시간`),
  whale: (a) => `고래 ${a}`, wallet: (a) => `지갑 ${a}`, side: { long: "롱", short: "숏", spot: "현물" },
  avg: (v) => `, 평균 ${v}`, exit: (v) => `, 평균 ${v}`, lev: (v) => `, ${v}배`, total: ", 누적 ", sum: ", 합계 ",
  pnl: (v, up) => `, ${up ? "수익" : "손실"} ${v}`,
  add: (p) => p.days >= 2 ? `${p.who} ${p.days}일 연속 ${p.coin} ${p.sideWord} 추가` : `${p.who} 24시간 동안 여러 차례 ${p.coin} ${p.sideWord} 추가`,
  buy: (p) => p.days >= 2 ? `${p.who} ${p.days}일 연속 ${p.coin} 현물 매수` : `${p.who} 24시간 동안 여러 차례 ${p.coin} 현물 매수`,
  reduce: (p) => p.days >= 2 ? `${p.who} ${p.days}일 연속 ${p.coin} ${p.sideWord} 축소` : `${p.who} 24시간 동안 여러 차례 ${p.coin} ${p.sideWord} 축소`,
  sell: (p) => p.days >= 2 ? `${p.who} ${p.days}일 연속 ${p.coin} 현물 매도` : `${p.who} 24시간 동안 여러 차례 ${p.coin} 현물 매도`,
  addPeriod: (p) => `${p.who} ${p.period} 동안 ${p.coin} ${p.sideWord} 추가`,
  fresh: (p) => `${p.who} ${p.coin} ${p.sideWord} 신규 진입, `,
  cluster: (p) => `고래 ${p.n}곳이 24시간 내 동시에 ${p.coin} ${p.side === "short" ? "숏" : "롱"}`,
  withdraw: (p) => `${p.who} ${p.period} 동안 거래소에서 ${p.coin} 출금`,
  open: (p) => `${p.who} Hyperliquid에서 ${p.coin} ${p.sideWord} 진입 `,
  increase: (p) => `${p.who} ${p.coin} ${p.sideWord} 추가, 현재 `,
  decrease: (p) => `${p.who} ${p.coin} ${p.sideWord} 축소, 현재 `,
  close: (p) => `${p.who} ${p.coin} ${p.sideWord} 청산 `,
  liquidation: (p) => `${p.who} ${p.coin} ${p.sideWord} 강제청산 `,
  hold: (p) => `${p.who} ${p.coin} ${p.sideWord} 보유 `,
  transfer: (p) => [`${p.qty} (`, `) ${p.from} → ${p.to}`], unknown: "미확인 지갑",
};

const ar = latin({
  whale: "الحوت", wallet: "المحفظة", side: { long: "شراء", short: "بيع", spot: "فوري" }, avg: "متوسط", exit: "متوسط الخروج", total: "الإجمالي", sum: "المجموع", gain: "ربح", loss: "خسارة", now: "الآن", unknown: "محفظة غير معروفة",
  addDays: (p) => `${p.who} زاد مركز ${p.sideWord} على ${p.coin} ${p.days} أيام متتالية`, addHours: (p) => `${p.who} زاد مركز ${p.sideWord} على ${p.coin} عدة مرات خلال 24 ساعة`,
  buyDays: (p) => `${p.who} اشترى ${p.coin} فوريًا ${p.days} أيام متتالية`, buyHours: (p) => `${p.who} اشترى ${p.coin} فوريًا عدة مرات خلال 24 ساعة`,
  reduceDays: (p) => `${p.who} خفّض مركز ${p.sideWord} على ${p.coin} ${p.days} أيام متتالية`, reduceHours: (p) => `${p.who} خفّض مركز ${p.sideWord} على ${p.coin} عدة مرات خلال 24 ساعة`,
  sellDays: (p) => `${p.who} باع ${p.coin} فوريًا ${p.days} أيام متتالية`, sellHours: (p) => `${p.who} باع ${p.coin} فوريًا عدة مرات خلال 24 ساعة`,
  addPeriod: (p) => `${p.who} يواصل زيادة مركز ${p.sideWord} على ${p.coin} خلال ${p.period}`, fresh: (p) => `${p.who} فتح مركز ${p.sideWord} جديدًا على ${p.coin}`,
  cluster: (p) => `${p.n} حيتان فتحت مراكز ${p.side === "short" ? "بيع" : "شراء"} على ${p.coin} خلال 24 ساعة`, withdraw: (p) => `${p.who} سحبت ${p.coin} من المنصات خلال ${p.period}`,
  open: (p) => `${p.who} فتح مركز ${p.sideWord} على ${p.coin} في Hyperliquid`, increase: (p) => `${p.who} زاد مركز ${p.sideWord} على ${p.coin}`, decrease: (p) => `${p.who} خفّض مركز ${p.sideWord} على ${p.coin}`,
  close: (p) => `${p.who} أغلق مركز ${p.sideWord} على ${p.coin}`, liquidation: (p) => `${p.who}: تمت تصفية مركز ${p.sideWord} على ${p.coin}`, hold: (p) => `${p.who} يحتفظ بمركز ${p.sideWord} على ${p.coin}`,
  moved: (p) => `من ${p.from} إلى ${p.to}`,
});

const ur = latin({
  whale: "وہیل", wallet: "والٹ", side: { long: "لانگ", short: "شارٹ", spot: "اسپاٹ" }, avg: "اوسط", exit: "اوسط اخراج", total: "کل", sum: "مجموعی", gain: "منافع", loss: "نقصان", now: "اب", unknown: "نامعلوم والٹ",
  addDays: (p) => `${p.who} نے مسلسل ${p.days} دن ${p.coin} ${p.sideWord} بڑھائی`, addHours: (p) => `${p.who} نے 24 گھنٹوں میں کئی بار ${p.coin} ${p.sideWord} بڑھائی`,
  buyDays: (p) => `${p.who} نے مسلسل ${p.days} دن ${p.coin} اسپاٹ خریدا`, buyHours: (p) => `${p.who} نے 24 گھنٹوں میں کئی بار ${p.coin} اسپاٹ خریدا`,
  reduceDays: (p) => `${p.who} نے مسلسل ${p.days} دن ${p.coin} ${p.sideWord} کم کی`, reduceHours: (p) => `${p.who} نے 24 گھنٹوں میں کئی بار ${p.coin} ${p.sideWord} کم کی`,
  sellDays: (p) => `${p.who} نے مسلسل ${p.days} دن ${p.coin} اسپاٹ بیچا`, sellHours: (p) => `${p.who} نے 24 گھنٹوں میں کئی بار ${p.coin} اسپاٹ بیچا`,
  addPeriod: (p) => `${p.who} نے ${p.period} میں ${p.coin} ${p.sideWord} بڑھائی`, fresh: (p) => `${p.who} نے نئی ${p.coin} ${p.sideWord} کھولی`,
  cluster: (p) => `${p.n} وہیلز نے 24 گھنٹوں میں ${p.coin} پر ${p.side === "short" ? "شارٹ" : "لانگ"} لیا`, withdraw: (p) => `${p.who} نے ${p.period} میں ایکسچینجز سے ${p.coin} نکالا`,
  open: (p) => `${p.who} نے Hyperliquid پر ${p.coin} ${p.sideWord} کھولی`, increase: (p) => `${p.who} نے ${p.coin} ${p.sideWord} بڑھائی`, decrease: (p) => `${p.who} نے ${p.coin} ${p.sideWord} کم کی`,
  close: (p) => `${p.who} نے ${p.coin} ${p.sideWord} بند کی`, liquidation: (p) => `${p.who}: ${p.coin} ${p.sideWord} لیکویڈیٹ ہوئی`, hold: (p) => `${p.who} کے پاس ${p.coin} ${p.sideWord} ہے`,
  moved: (p) => `${p.from} سے ${p.to}`,
});

const PACKS = Object.freeze({ en, "zh-Hans": zhHans, "zh-Hant": zhHant, es, "pt-BR": ptBR, fr, de, it, ja, ko, ru, tr, id, vi, ar, ur, uk });

export function sentencePack(locale = "en") {
  return PACKS[locale] || (String(locale || "").startsWith("zh") ? PACKS["zh-Hans"] : PACKS.en);
}
