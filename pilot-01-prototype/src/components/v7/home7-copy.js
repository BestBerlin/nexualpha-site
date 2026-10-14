// Home v7 copy. zh-Hans and en are the source texts; the other locales live in home7-copy-i18n.js.
// "{max}" is replaced with HOME_REBATE_MAX_PCT at render time. Keep every locale's keys identical (tests/home7-copy.test.mjs).
import { H7_I18N } from "./home7-copy-i18n.js";

export const H7_COPY = {
  "zh-Hans": {
    kick: "NEXUALPHA · 交易所比价与返佣",
    h1a: "别再白送手续费，", h1b: "最高拿回 {max}%。",
    sub: "用我们的合作邀请链接在交易所官网开户，\n手续费按比例返还，主流交易所逐家比价。",
    lgShare: (n) => `${n} 最高返佣比例`, upTo: "最高", settleH: "每小时返佣", settleD: "每天返佣", lgAuto: "返佣自动到账", lgGo: (n) => `前往 ${n} 官方开户`, heroGo: "立即开户，拿返佣", lgTop: "三家最高", dockGo: "立即开户",
    lgTitle: "返佣账本", lgEst: "按公开费率估算", lgVol: (v, m) => `每月成交 ${v} · ${m}`, perpL: "合约", spotL: "现货", sep: "", lgMax: "合作交易所\n最高返佣", lgPick: "选择交易所",
    lgWithout: "不用邀请码 · 一年手续费", lgBack: "通过 NexuAlpha · 一年最高返还", lgNet: "一年实付 · 按最高返佣后", basisBase: "每年 · 基础费率", basisNet: "每年 · 按最高返佣后", ratesGo: "按月对比同一场景（费率计算器）", copy: "复制", copied: "已复制邀请码 ✓",
    cta: (n) => `领取返佣，去 ${n} 开户`, calcLink: "算算一年能省多少",
    pw: (n) => `${n} 家合作交易所`,
    cap: (n) => `${n} 家合作交易所，返佣比例各不相同，最高 {max}%。\n点开任意一家，看比例和邀请码。`,
    t1: "官方域名已核验", t1b: "开户前先看地址栏，我们列出每家的官方域名。", t2: "返佣比例公开", t2b: "每家交易所能返多少手续费，页面上直接写明。", t3: "不经手你的资金", t3b: "注册、认证、入金都在交易所官方页面完成。",
    howH: "三步拿到返佣",
    how: [["挑一家交易所", "官方费率、返佣比例、官方域名逐家公开，先比再选。"], ["一键直达官方开户", "注册和账户流程都在交易所官方页面完成。"], ["正常交易，返佣到账", "OKX、币安每小时、Bitget 每天由交易所官方自动结算，其余按各家规则发放。"]],
    calcEmpty: "输入每月成交额，看看一年能省多少。",
    calcH: "算算你一年能省多少。", perMonth: "/ 月", maker: "挂单", taker: "吃单", volLabel: "每月成交额（美元）",
    inH: "交易所最新公告", inSub: "", inAsOf: (d) => `获取于 ${d}`, inOpen: "公告详情",
    inCat: { listing: "上币", event: "活动", delisting: "下架", news: "公告", product: "产品", security: "安全" },
    inAgo: (ms) => { const h = Math.floor(ms / 36e5); return h < 1 ? "刚刚" : h < 24 ? `${h} 小时前` : `${Math.floor(h / 24)} 天前`; },
    inBtn: "比一比费率", shH: "想参与？先比一下手续费", shSpot: "按现货基础费率", shPerp: "按永续合约基础费率", shAfter: "返佣后约", shClose: "关闭", shSrc: "查看官方公告原文", shNote: "费率为各平台公开的基础费率，不含 VIP 等级和平台币抵扣。返佣比例以各交易所当期规则和你的账户为准。公告本身不代表任何优惠。",
    rate: "费率", code: "邀请码", rebate: "返", pending: "比例见详情", open: "开户拿返佣", detail: "查看详情", unchecked: "费率待核对",
    lowest: (n, v) => `${n} 用我们的码实付最低，一年 ${v}。`, most: (n, v) => `${n} 返还最多，一年返 ${v}。`,
    all: "查看全部交易所", foot: (d) => `费率为各平台公开的基础费率（默认按 USDT 永续合约，可切换现货），数据日期 ${d}，不含 VIP 等级、平台币抵扣和地区差异。首页“最高 {max}%”为合作交易所中的最高档位，各家最高比例不同（如币安 25%、OKX 40%、Bitget 60%），计算按最高比例估算。`,
  },
  en: {
    kick: "NEXUALPHA · EXCHANGE FEES & REBATES",
    h1a: "Stop gifting fees.", h1b: "Get up to {max}% back.",
    sub: "Open on the exchange's official page using NexuAlpha's partner invite link.\nPart of every fee comes back, compared exchange by exchange.",
    lgShare: (n) => `${n} top rebate share`, upTo: "Up to", settleH: "paid hourly", settleD: "paid daily", lgAuto: "Rebate paid automatically", lgGo: (n) => `Sign up on ${n}`, heroGo: "Open an account, get the rebate", lgTop: "Highest of three", dockGo: "Sign up",
    lgTitle: "Rebate ledger", lgEst: "Estimate from published fees", lgVol: (v, m) => `${v} / month · ${m.toLowerCase()}`, perpL: "Perps", spotL: "Spot", sep: " ", lgMax: "Top partner\nrebate", lgPick: "Choose exchange",
    lgWithout: "Without invite code · fees a year", lgBack: "Through NexuAlpha · up to, a year", lgNet: "Paid a year · after max rebate", basisBase: "per year · base fees", basisNet: "per year · after max rebate", ratesGo: "Same scenario per month on the fee calculator", copy: "Copy", copied: "Invite code copied ✓",
    cta: (n) => `Claim rebate, open on ${n}`, calcLink: "See what I could save",
    pw: (n) => `${n} partner exchanges`,
    cap: (n) => `${n} partner exchanges, each with its own rebate share, up to {max}%.\nOpen any of them to see its share and invite code.`,
    t1: "Official domains checked", t1b: "Check the address bar before signing up. We list every official domain.", t2: "Rebate rates shown", t2b: "See exactly how much of your fees each exchange gives back.", t3: "We never touch your funds", t3b: "Sign-up, verification and deposits all happen on the exchange's own pages.",
    howH: "Your rebate in three steps",
    how: [["Pick an exchange", "Official fees, rebate shares and domains are published for each exchange. Compare, then choose."], ["Sign up in one tap", "Complete registration and account checks on the exchange's official page."], ["Trade, get the rebate", "OKX and Binance pay out hourly, Bitget daily, automatically; others follow their own rules."]],
    calcEmpty: "Enter your monthly volume to see the yearly difference.",
    calcH: "What could you save in a year?", perMonth: "/ month", maker: "Maker", taker: "Taker", volLabel: "Monthly trading volume (USD)",
    inH: "Latest exchange notices", inSub: "", inAsOf: (d) => `Fetched ${d}`, inOpen: "Details",
    inCat: { listing: "Listing", event: "Event", delisting: "Delisting", news: "News", product: "Product", security: "Security" },
    inAgo: (ms) => { const h = Math.floor(ms / 36e5); return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`; },
    inBtn: "Compare fees", shH: "Thinking of joining? Compare fees first", shSpot: "Base spot fees", shPerp: "Base perpetual fees", shAfter: "≈ after rebate", shClose: "Close", shSrc: "Read the official post", shNote: "Fees are each exchange's published base rates, excluding VIP tiers and platform-token discounts. Rebates follow each exchange's current rules and your account. The announcement itself implies no offer.",
    rate: "Fee", code: "Invite code", rebate: "Rebate", pending: "See details", open: "Sign up, get rebate", detail: "Details", unchecked: "Fee not yet checked",
    lowest: (n, v) => `${n} is cheapest with our code: ${v} a year.`, most: (n, v) => `${n} returns the most: ${v} a year.`,
    all: "See all exchanges", foot: (d) => `Fees are each exchange's published base rates (USDT perpetuals by default, spot on request) as of ${d}, excluding VIP tiers, platform-token discounts and regional differences. The headline "up to {max}%" is the highest tier among partner exchanges; top shares differ by exchange (for example Binance 25%, OKX 40%, Bitget 60%); estimates use the top share.`,
  },
  // l10n: needs native review
  ur: {
    heroGo: "اکاؤنٹ کھولیں، ریبیٹ حاصل کریں", dockGo: "رجسٹر کریں",
    kick: "NEXUALPHA · ایکسچینج فیس اور ریبیٹس",
    h1a: "فیس ضائع کرنا بند کریں۔", h1b: "{max}% تک واپس حاصل کریں۔",
    sub: "NexuAlpha دعوتی لنک سے سرکاری ایکسچینج صفحے پر اکاؤنٹ کھولیں۔\nفیس کا حصہ واپس ملتا ہے، ہر ایکسچینج کا موازنہ ساتھ ہے۔",
    lgShare: (n) => `${n} سب سے زیادہ ریبیٹ حصہ`, upTo: "تک", settleH: "ہر گھنٹے ادا", settleD: "روزانہ ادا", lgAuto: "ایکسچینج سے سیٹل", lgGo: (n) => `${n} پر سائن اپ`, heroGo: "اکاؤنٹ کھولیں، ریبیٹ حاصل کریں", lgTop: "تین میں سب سے زیادہ", dockGo: "سائن اپ",
    lgTitle: "ریبیٹ لیجر", lgEst: "شائع شدہ فیس سے تخمینہ", lgVol: (v, m) => `${v} / ماہ · ${m.toLowerCase()}`, perpL: "Perps", spotL: "Spot", sep: " ", lgMax: "سر فہرست پارٹنر\nریبیٹ", lgPick: "ایکسچینج منتخب کریں",
    lgWithout: "دعوتی کوڈ کے بغیر · سالانہ فیس", lgBack: "NexuAlpha کے ذریعے · سالانہ زیادہ سے زیادہ", lgNet: "سالانہ ادائیگی · زیادہ سے زیادہ ریبیٹ کے بعد", basisBase: "سالانہ · بنیادی فیس", basisNet: "سالانہ · زیادہ سے زیادہ ریبیٹ کے بعد", ratesGo: "یہی منظر فیس کیلکولیٹر میں دیکھیں", copy: "کاپی", copied: "دعوتی کوڈ کاپی ہو گیا ✓",
    cta: (n) => `ریبیٹ لیں، ${n} پر اکاؤنٹ کھولیں`, calcLink: "ممکنہ بچت دیکھیں",
    pw: (n) => `${n} پارٹنر ایکسچینجز`,
    cap: (n) => `${n} پارٹنر ایکسچینجز، ریبیٹ {max}% تک۔\nحصہ اور دعوتی کوڈ دیکھنے کے لیے کوئی بھی کھولیں۔`,
    t1: "سرکاری ڈومینز چیک شدہ", t1b: "سائن اپ سے پہلے ایڈریس بار چیک کریں۔", t2: "ریبیٹ کی شرحیں واضح", t2b: "ہر ایکسچینج آپ کی فیس کا کتنا حصہ واپس کرتا ہے، صاف لکھا ہے۔", t3: "ہم آپ کے فنڈز کو کبھی نہیں چھوتے", t3b: "سائن اپ، تصدیق اور ڈپازٹ ایکسچینج پر ہوتے ہیں۔",
    howH: "آپ کا ریبیٹ تین مراحل میں",
    how: [["ایکسچینج منتخب کریں", "ہر ایکسچینج کی فیس، ریبیٹ اور ڈومین دکھائے گئے ہیں۔"], ["ایک ٹیپ میں سائن اپ", "رجسٹریشن اور اکاؤنٹ چیکس ایکسچینج کے سرکاری صفحے پر مکمل کریں۔"], ["ٹریڈ کریں، ریبیٹ لیں", "OKX/Binance ہر گھنٹے، Bitget روزانہ؛ باقی اپنے قواعد کے مطابق۔"]],
    calcEmpty: "سالانہ فرق کے لیے ماہانہ حجم درج کریں۔",
    calcH: "آپ ایک سال میں کیا بچا سکتے ہیں؟", perMonth: "/ ماہ", maker: "Maker", taker: "Taker", volLabel: "ماہانہ ٹریڈنگ حجم (USD)",
    inH: "تازہ ایکسچینج نوٹسز", inSub: "", inAsOf: (d) => `حاصل شدہ ${d}`, inOpen: "تفصیلات",
    inCat: { listing: "نئی لسٹنگ", event: "سرگرمی", delisting: "لسٹنگ ختم", news: "خبر", product: "مصنوع", security: "حفاظت" },
    inAgo: (ms) => { const h = Math.floor(ms / 36e5); return h < 1 ? "ابھی" : h < 24 ? `${h} گھنٹے پہلے` : `${Math.floor(h / 24)} دن پہلے`; },
    inBtn: "فیس موازنہ", shH: "شامل ہونے سے پہلے فیس موازنہ کریں", shSpot: "بنیادی اسپاٹ فیس", shPerp: "بنیادی دائمی معاہدہ فیس", shAfter: "≈ ریبیٹ کے بعد", shClose: "بند", shSrc: "سرکاری پوسٹ پڑھیں", shNote: "فیس ہر ایکسچینج کی شائع شدہ بنیادی شرح ہے، جس میں VIP درجے اور پلیٹ فارم ٹوکن رعایتیں شامل نہیں۔ ریبیٹ ہر ایکسچینج کے موجودہ قواعد اور آپ کے اکاؤنٹ کے تابع ہے۔ اعلان بذات خود کوئی آفر ثابت نہیں کرتا۔",
    rate: "فیس", code: "دعوتی کوڈ", rebate: "ریبیٹ", pending: "تفصیلات دیکھیں", open: "سائن اپ، ریبیٹ لیں", detail: "تفصیلات", unchecked: "فیس ابھی چیک نہیں",
    lowest: (n, v) => `${n} ہمارے کوڈ کے ساتھ سب سے سستا ہے: سالانہ ${v}۔`, most: (n, v) => `${n} سب سے زیادہ واپس کرتا ہے: سالانہ ${v}۔`,
    all: "تمام ایکسچینجز دیکھیں", foot: (d) => `فیس ہر ایکسچینج کی شائع شدہ بنیادی شرحیں ہیں (بطور ڈیفالٹ USDT دائمی معاہدے، ضرورت پر اسپاٹ)، تاریخ ${d}، VIP درجوں، پلیٹ فارم ٹوکن رعایتوں اور علاقائی فرق کے بغیر۔ سرخی میں “{max}% تک” شراکتی ایکسچینجز میں سب سے اونچا درجہ ہے؛ ہر ایکسچینج کا زیادہ سے زیادہ حصہ مختلف ہے (مثلاً Binance 25%، OKX 40%، Bitget 60%)؛ اندازے سب سے اونچے حصے سے لگائے جاتے ہیں۔`,
  },
  // l10n: needs native review
  uk: {
    heroGo: "Відкрити акаунт і отримати ребейт", dockGo: "Зареєструватися",
    kick: "NEXUALPHA · КОМІСІЇ БІРЖ І РЕБЕЙТИ",
    h1a: "Досить дарувати комісії.", h1b: "Отримуйте назад до {max}%.",
    sub: "Відкрийте рахунок на офіційній сторінці через запрошення NexuAlpha.\nЧастина комісії повертається; порівняння йде біржа за біржею.",
    lgShare: (n) => `${n} найвища частка ребейту`, upTo: "До", settleH: "виплата щогодини", settleD: "виплата щодня", lgAuto: "Розрахунок біржею", lgGo: (n) => `Зареєструватися на ${n}`, heroGo: "Відкрити рахунок і отримати ребейт", lgTop: "Найвище з трьох", dockGo: "Реєстрація",
    lgTitle: "Леджер ребейтів", lgEst: "Оцінка за опублікованими комісіями", lgVol: (v, m) => `${v} / місяць · ${m.toLowerCase()}`, perpL: "Безстрокові", spotL: "Спот", sep: " ", lgMax: "Найвищий партнерський\nребейт", lgPick: "Оберіть біржу",
    lgWithout: "Без коду запрошення · комісії за рік", lgBack: "Через NexuAlpha · до, за рік", lgNet: "Сплачено за рік · після макс. ребейту", basisBase: "за рік · базові комісії", basisNet: "за рік · після макс. ребейту", ratesGo: "Той самий сценарій у калькуляторі", copy: "Копіювати", copied: "Код запрошення скопійовано ✓",
    cta: (n) => `Отримати ребейт, відкрити на ${n}`, calcLink: "Порахувати економію",
    pw: (n) => `${n} партнерських бірж`,
    cap: (n) => `${n} партнерських бірж із ребейтом до {max}%.\nВідкрийте будь-яку, щоб побачити частку й код.`,
    t1: "Офіційні домени перевірено", t1b: "Перед реєстрацією перевірте адресний рядок. Ми перелічуємо всі офіційні домени.", t2: "Ставки ребейту на виду", t2b: "Точно видно, скільки комісії повертає кожна біржа.", t3: "Ми ніколи не торкаємося ваших коштів", t3b: "Реєстрація, KYC і депозити відбуваються на біржі.",
    howH: "Ваш ребейт у три кроки",
    how: [["Оберіть біржу", "Для кожної біржі опубліковано офіційні комісії, частки ребейту й домени. Порівняйте, потім оберіть."], ["Зареєструйтеся в один дотик", "Реєстрація та перевірки акаунта проходять на офіційній сторінці біржі."], ["Торгуйте й отримуйте ребейт", "OKX і Binance виплачують щогодини, Bitget — щодня, автоматично; інші біржі дотримуються власних правил."]],
    calcEmpty: "Введіть місячний обсяг для річної різниці.",
    calcH: "Скільки можна зекономити за рік?", perMonth: "/ місяць", maker: "Maker", taker: "Taker", volLabel: "Місячний торговий обсяг (USD)",
    inH: "Останні повідомлення бірж", inSub: "", inAsOf: (d) => `Отримано ${d}`, inOpen: "Докладніше",
    inCat: { listing: "Лістинг", event: "Подія", delisting: "Делістинг", news: "Новини", product: "Продукт", security: "Безпека" },
    inAgo: (ms) => { const h = Math.floor(ms / 36e5); return h < 1 ? "щойно" : h < 24 ? `${h} год тому` : `${Math.floor(h / 24)} дн тому`; },
    inBtn: "Порівняти комісії", shH: "Перед реєстрацією порівняйте комісії", shSpot: "Базові спотові комісії", shPerp: "Базові комісії безстрокових контрактів", shAfter: "≈ після ребейту", shClose: "Закрити", shSrc: "Читати офіційну публікацію", shNote: "Комісії — це опубліковані базові ставки кожної біржі без VIP-рівнів і знижок за платформний токен. Ребейти залежать від поточних правил кожної біржі та вашого акаунта. Саме оголошення не означає наявність пропозиції.",
    rate: "Комісія", code: "Код запрошення", rebate: "Ребейт", pending: "Див. деталі", open: "Зареєструватися й отримати ребейт", detail: "Деталі", unchecked: "Комісію ще не перевірено",
    lowest: (n, v) => `${n} найдешевша з нашим кодом: ${v} на рік.`, most: (n, v) => `${n} повертає найбільше: ${v} на рік.`,
    all: "Переглянути всі біржі", foot: (d) => `Комісії — це опубліковані базові ставки кожної біржі (за замовчуванням безстрокові USDT-контракти, спот за запитом) станом на ${d}, без VIP-рівнів, знижок за платформний токен і регіональних відмінностей. Заголовок “до {max}%” означає найвищий рівень серед партнерських бірж; максимальні частки різняться за біржами (наприклад Binance 25%, OKX 40%, Bitget 60%); розрахунки використовують найвищу частку.`,
  },
  ...H7_I18N,
};
// Missing keys fall back to English so a new key never breaks a locale before its translation lands.
export const h7Copy = (locale) => ({ ...H7_COPY.en, ...(H7_COPY[locale] || (String(locale || "").startsWith("zh") ? H7_COPY["zh-Hans"] : {})) });
// Türkiye pages (tr locale or ?market=TR, tr-market-gaps): Bitget is on the SPK liquidation list, so step 3 names only the
// automatic payers promoted there and the footnote's share examples leave Bitget out.
const H7_PAYOUT_TURKEY = Object.freeze({
  "zh-Hans": "OKX、币安每小时由交易所官方自动结算，其余按各家规则发放。",
  "zh-Hant": "OKX、幣安每小時由交易所官方自動結算，其餘依各家規則發放。",
  en: "OKX and Binance pay out hourly, automatically; others follow their own rules.",
  es: "OKX y Binance pagan cada hora, de forma automática; las demás siguen sus propias reglas.",
  "pt-BR": "OKX e Binance pagam a cada hora, de forma automática; as demais seguem as próprias regras.",
  fr: "OKX et Binance versent chaque heure, automatiquement ; les autres suivent leurs propres règles.",
  de: "OKX und Binance zahlen stündlich automatisch aus; andere Börsen folgen ihren eigenen Regeln.",
  it: "OKX e Binance pagano ogni ora, in automatico; le altre seguono le proprie regole.",
  ja: "OKX・Binance は1時間ごとに取引所が自動で精算し、その他は各取引所の規定に従って付与されます。",
  ko: "OKX와 Binance는 매시간 거래소가 자동으로 정산하며, 나머지는 각 거래소 규정에 따라 지급됩니다.",
  ru: "OKX и Binance начисляют возврат автоматически каждый час; остальные биржи — по своим правилам.",
  id: "OKX dan Binance membayar tiap jam secara otomatis; bursa lain mengikuti aturannya masing-masing.",
  vi: "OKX và Binance chi trả mỗi giờ, tự động; các sàn khác theo quy định riêng.",
  ar: "تدفع OKX وBinance كل ساعة بشكل تلقائي، وتتبع المنصات الأخرى قواعدها الخاصة.",
  ur: "OKX/Binance ہر گھنٹے؛ باقی اپنے قواعد کے مطابق۔",
  uk: "OKX і Binance виплачують щогодини, автоматично; інші біржі дотримуються власних правил.",
});
export function h7TurkeyCopy(t, locale) {
  const payout = H7_PAYOUT_TURKEY[locale] || (String(locale || "").startsWith("zh") ? H7_PAYOUT_TURKEY["zh-Hans"] : null);
  const how = Array.isArray(t.how) ? t.how.map((step, index) => (index === 2 && /bitget/i.test(step[1]) ? [step[0], payout || H7_PAYOUT_TURKEY.en] : step)) : t.how;
  const foot = typeof t.foot === "function" ? (...args) => t.foot(...args).replace(/\s*[,،、]\s*Bitget\s*%?\d+%?/g, "") : t.foot;
  return { ...t, how, foot };
}
// True when this locale renders the English fallback; the home block then declares lang="en" dir="ltr" so RTL shells do not mirror English prose.
export const h7IsFallback = (locale) => !H7_COPY[locale] && !String(locale || "").startsWith("zh");
