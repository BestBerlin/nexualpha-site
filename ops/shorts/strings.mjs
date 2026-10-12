import {localizedPath} from '../../pilot-01-prototype/src/data/locale-routing.js';
export const SUPPORTED_LOCALES = ['en','es','pt-BR','vi','id','tr','ru','zh-Hans','ar'];
export const RTL_LOCALES = ['ar'];
export const PLATFORM_KEYS = ['youtube','tiktok','x','telegram'];
export const LIQUIDATION_REACTION_THRESHOLD_USD = 100_000_000;
export const liquidationsPath = locale => localizedPath('/liquidations',locale);
const LOCALES = {
  "en": {
    "dir": "ltr",
    "labels": {
      "long": "long",
      "short": "short",
      "longs": "Longs",
      "shorts": "Shorts",
      "sideLong": "LONG",
      "sideShort": "SHORT"
    },
    "copy": {
      "fullData": "Full market data",
      "negativeFunding": "Negative funding means shorts pay longs.",
      "longs": "Longs",
      "shorts": "Shorts",
      "long": "Long",
      "short": "Short",
      "cta": "Open the full liquidation board.",
      "domain": "nexualpha.com"
    },
    "hashtags": [
      "#Bitcoin",
      "#Crypto",
      "#Liquidations",
      "#FundingRates",
      "#NexuAlpha",
      "#Shorts"
    ]
  },
  "es": {
    "dir": "ltr",
    "labels": {
      "long": "largo",
      "short": "corto",
      "longs": "Largos",
      "shorts": "Cortos",
      "sideLong": "LARGO",
      "sideShort": "CORTO"
    },
    "copy": {
      "fullData": "Datos completos del mercado",
      "negativeFunding": "La financiación negativa significa que los cortos pagan a los largos.",
      "longs": "Largos",
      "shorts": "Cortos",
      "long": "Largo",
      "short": "Corto",
      "cta": "Abre el panel completo de liquidaciones.",
      "domain": "nexualpha.com"
    },
    "hashtags": [
      "#Bitcoin",
      "#Cripto",
      "#Liquidaciones",
      "#FundingRates",
      "#NexuAlpha",
      "#Shorts"
    ]
  },
  "pt-BR": {
    "dir": "ltr",
    "labels": {
      "long": "comprada",
      "short": "vendida",
      "longs": "Comprados",
      "shorts": "Vendidos",
      "sideLong": "COMPRADA",
      "sideShort": "VENDIDA"
    },
    "copy": {
      "fullData": "Dados completos do mercado",
      "negativeFunding": "Funding negativo significa que vendidos pagam comprados.",
      "longs": "Comprados",
      "shorts": "Vendidos",
      "long": "Comprada",
      "short": "Vendida",
      "cta": "Abra o painel completo de liquidações.",
      "domain": "nexualpha.com"
    },
    "hashtags": [
      "#Bitcoin",
      "#Cripto",
      "#Liquidacoes",
      "#FundingRates",
      "#NexuAlpha",
      "#Shorts"
    ]
  },
  "vi": {
    "dir": "ltr",
    "labels": {
      "long": "long",
      "short": "short",
      "longs": "Long",
      "shorts": "Short",
      "sideLong": "LONG",
      "sideShort": "SHORT"
    },
    "copy": {
      "fullData": "Dữ liệu thị trường đầy đủ",
      "negativeFunding": "Funding âm nghĩa là vị thế short trả cho vị thế long.",
      "longs": "Long",
      "shorts": "Short",
      "long": "Long",
      "short": "Short",
      "cta": "Mở bảng thanh lý đầy đủ.",
      "domain": "nexualpha.com"
    },
    "hashtags": [
      "#Bitcoin",
      "#Crypto",
      "#ThanhLy",
      "#FundingRates",
      "#NexuAlpha",
      "#Shorts"
    ]
  },
  "id": {
    "dir": "ltr",
    "labels": {
      "long": "long",
      "short": "short",
      "longs": "Long",
      "shorts": "Short",
      "sideLong": "LONG",
      "sideShort": "SHORT"
    },
    "copy": {
      "fullData": "Data pasar lengkap",
      "negativeFunding": "Funding negatif berarti short membayar long.",
      "longs": "Long",
      "shorts": "Short",
      "long": "Long",
      "short": "Short",
      "cta": "Buka papan likuidasi lengkap.",
      "domain": "nexualpha.com"
    },
    "hashtags": [
      "#Bitcoin",
      "#Crypto",
      "#Likuidasi",
      "#FundingRates",
      "#NexuAlpha",
      "#Shorts"
    ]
  },
  "tr": {
    "dir": "ltr",
    "labels": {
      "long": "long",
      "short": "short",
      "longs": "Longlar",
      "shorts": "Shortlar",
      "sideLong": "LONG",
      "sideShort": "SHORT"
    },
    "copy": {
      "fullData": "Tam piyasa verisi",
      "negativeFunding": "Negatif fonlama, shortların longlara ödeme yaptığı anlamına gelir.",
      "longs": "Longlar",
      "shorts": "Shortlar",
      "long": "Long",
      "short": "Short",
      "cta": "Tam likidasyon panelini aç.",
      "domain": "nexualpha.com"
    },
    "hashtags": [
      "#Bitcoin",
      "#Kripto",
      "#Likidasyon",
      "#FundingRates",
      "#NexuAlpha",
      "#Shorts"
    ]
  },
  "ru": {
    "dir": "ltr",
    "labels": {
      "long": "лонг",
      "short": "шорт",
      "longs": "Лонги",
      "shorts": "Шорты",
      "sideLong": "ЛОНГ",
      "sideShort": "ШОРТ"
    },
    "copy": {
      "fullData": "Полные рыночные данные",
      "negativeFunding": "Отрицательный фандинг означает, что шорты платят лонгам.",
      "longs": "Лонги",
      "shorts": "Шорты",
      "long": "Лонг",
      "short": "Шорт",
      "cta": "Откройте полную доску ликвидаций.",
      "domain": "nexualpha.com"
    },
    "hashtags": [
      "#Bitcoin",
      "#Crypto",
      "#Ликвидации",
      "#FundingRates",
      "#NexuAlpha",
      "#Shorts"
    ]
  },
  "zh-Hans": {
    "dir": "ltr",
    "labels": {
      "long": "多头",
      "short": "空头",
      "longs": "多头",
      "shorts": "空头",
      "sideLong": "多头",
      "sideShort": "空头"
    },
    "copy": {
      "fullData": "完整市场数据",
      "negativeFunding": "负资金费率表示空头付钱给多头。",
      "longs": "多头",
      "shorts": "空头",
      "long": "多头",
      "short": "空头",
      "cta": "打开完整爆仓看板。",
      "domain": "nexualpha.com"
    },
    "hashtags": [
      "#比特币",
      "#加密货币",
      "#爆仓",
      "#资金费率",
      "#NexuAlpha",
      "#Shorts"
    ]
  },
  "ar": {
    "dir": "rtl",
    "labels": {
      "long": "شراء",
      "short": "بيع",
      "longs": "صفقات الشراء",
      "shorts": "صفقات البيع",
      "sideLong": "شراء",
      "sideShort": "بيع"
    },
    "copy": {
      "fullData": "بيانات السوق الكاملة",
      "negativeFunding": "يعني التمويل السلبي أن مراكز البيع تدفع لمراكز الشراء.",
      "longs": "صفقات الشراء",
      "shorts": "صفقات البيع",
      "long": "شراء",
      "short": "بيع",
      "cta": "افتح لوحة التصفية الكاملة.",
      "domain": "nexualpha.com"
    },
    "hashtags": [
      "#Bitcoin",
      "#Crypto",
      "#Liquidations",
      "#FundingRates",
      "#NexuAlpha",
      "#Shorts"
    ]
  }
};

// Each spoken line explains the metric instead of reading its headline back.
const EXPLANATIONS = {
  en: {labels:['Liquidated in the last 24h','Who took the hit?','Largest liquidation','Top funding rates'], hero:'Leveraged positions were forced to close.', split:['Most forced closures hit short sellers.','Most forced closures hit long buyers.'], receipt:'One leveraged position was closed in a single order.', positive:'Positive funding means longs pay shorts.', zero:'Zero funding means no funding payment.'},
  es: {labels:['Liquidado en las últimas 24 h','¿Quién recibió el golpe?','Mayor liquidación','Mayores tasas de financiación'], hero:'Las posiciones apalancadas se cerraron por la fuerza.', split:['Los cortos sufrieron la mayoría de los cierres forzosos.','Los largos sufrieron la mayoría de los cierres forzosos.'], receipt:'Una posición apalancada se cerró en una sola orden.', positive:'Con financiación positiva, los largos pagan a los cortos.', zero:'Con financiación cero, no hay pago de financiación.'},
  'pt-BR': {labels:['Liquidado nas últimas 24h','Quem sofreu mais?','Maior liquidação','Maiores taxas de funding'], hero:'Posições alavancadas foram encerradas à força.', split:['Os vendidos sofreram a maioria dos encerramentos forçados.','Os comprados sofreram a maioria dos encerramentos forçados.'], receipt:'Uma posição alavancada foi encerrada em uma única ordem.', positive:'Funding positivo significa que comprados pagam vendidos.', zero:'Funding zero significa que não há pagamento de funding.'},
  vi: {labels:['Bị thanh lý trong 24 giờ qua','Bên nào chịu thiệt hại?','Lệnh thanh lý lớn nhất','Funding rate cao nhất'], hero:'Các vị thế dùng đòn bẩy đã bị buộc đóng.', split:['Phần lớn vị thế bị buộc đóng là short.','Phần lớn vị thế bị buộc đóng là long.'], receipt:'Một vị thế đòn bẩy đã bị đóng trong một lệnh.', positive:'Funding dương nghĩa là long trả cho short.', zero:'Funding bằng không nghĩa là không có khoản thanh toán funding.'},
  id: {labels:['Dilikuidasi dalam 24 jam terakhir','Siapa yang paling terdampak?','Likuidasi terbesar','Funding rate tertinggi'], hero:'Posisi dengan leverage terpaksa ditutup.', split:['Sebagian besar penutupan paksa menimpa posisi short.','Sebagian besar penutupan paksa menimpa posisi long.'], receipt:'Satu posisi dengan leverage ditutup dalam satu order.', positive:'Funding positif berarti long membayar short.', zero:'Funding nol berarti tidak ada pembayaran funding.'},
  tr: {labels:['Son 24 saatte likide edilen','En çok kim etkilendi?','En büyük likidasyon','En yüksek fonlama oranları'], hero:'Kaldıraçlı pozisyonlar zorunlu olarak kapatıldı.', split:['Zorunlu kapanışların çoğu short pozisyonları etkiledi.','Zorunlu kapanışların çoğu long pozisyonları etkiledi.'], receipt:'Tek bir kaldıraçlı pozisyon tek emirle kapatıldı.', positive:'Pozitif fonlamada longlar shortlara ödeme yapar.', zero:'Sıfır fonlamada fonlama ödemesi yoktur.'},
  ru: {labels:['Ликвидировано за последние 24 часа','Кто пострадал больше?','Крупнейшая ликвидация','Высокие ставки фандинга'], hero:'Позиции с плечом были принудительно закрыты.', split:['Большинство принудительных закрытий пришлось на шорты.','Большинство принудительных закрытий пришлось на лонги.'], receipt:'Одна позиция с плечом была закрыта одним ордером.', positive:'При положительном фандинге лонги платят шортам.', zero:'При нулевом фандинге платежа нет.'},
  'zh-Hans': {labels:['过去24小时爆仓金额','哪一方损失更多？','最大单笔爆仓','高资金费率'], hero:'使用杠杆的仓位被强制平仓。', split:['大部分强制平仓发生在空头仓位。','大部分强制平仓发生在多头仓位。'], receipt:'一个杠杆仓位通过单笔订单被强制平仓。', positive:'正资金费率表示多头付钱给空头。', zero:'零资金费率表示无需支付资金费用。'},
  ar: {labels:['تمت تصفيته خلال آخر 24 ساعة','من تضرر أكثر؟','أكبر تصفية','أعلى معدلات التمويل'], hero:'أُغلقت مراكز الرافعة المالية قسراً.', split:['معظم الإغلاقات القسرية طالت مراكز البيع.','معظم الإغلاقات القسرية طالت مراكز الشراء.'], receipt:'أُغلق مركز واحد برافعة مالية في أمر واحد.', positive:'التمويل الإيجابي يعني أن مراكز الشراء تدفع لمراكز البيع.', zero:'التمويل الصفري يعني عدم وجود دفعة تمويل.'},
};
function scene(label, explanation, details = () => []) {
  return {title:label, label, support:v=>[explanation(v)], lines:v=>[...details(v),explanation(v)], narration:explanation};
}
export const STRINGS = Object.fromEntries(SUPPORTED_LOCALES.map(locale => {
  const s=LOCALES[locale], e=EXPLANATIONS[locale];
  const funding=v=>v.topRate<0?s.copy.negativeFunding:v.topRate>0?e.positive:e.zero;
  const slides={
    hero:scene(e.labels[0],()=>e.hero,v=>[v.total]),
    split:scene(e.labels[1],v=>e.split[v.dominantSide==='short'?0:1],v=>[s.labels.longs+' '+v.longUsd+' / '+v.longShare,s.labels.shorts+' '+v.shortUsd+' / '+v.shortShare]),
    receipt:scene(e.labels[2],()=>e.receipt,v=>[v.venue+' · '+v.symbol,v.sideLabel+' '+v.bigUsd,v.time]),
    funding:scene(e.labels[3],funding,v=>[v.topRates]),
    end:scene(s.copy.fullData,()=>s.copy.cta,()=>[s.copy.domain]),
  };
  const entry={title:v=>e.labels[0]+' '+v.total,description:v=>e.labels[0]+': '+v.total+'. '+slides.split.narration(v),hashtags:s.hashtags,ctaLabel:s.copy.cta.replace(/[。.]$/u,'')};
  return [locale,{...s,slides,meta:Object.fromEntries(PLATFORM_KEYS.map(key=>[key,entry]))}];
}));
export function getShortsStrings(locale) {
  if(!STRINGS[locale]) throw new Error('Unsupported locale: '+locale);
  return STRINGS[locale];
}
