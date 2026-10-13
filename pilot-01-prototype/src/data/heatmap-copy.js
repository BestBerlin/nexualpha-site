import { localizedPath } from './locale-routing.js';
import { dataPageCopy } from './market-data-pages.js';
const rows = {
 en: ['Liquidation heatmap','Liquidation timeline','Estimated levels','Biggest single liquidations','All symbols','Learn about leverage','Mark price and liquidation','Equal leverage weights and balanced sides; modeled exposure, not an order book.','Partner venues'],
 'zh-Hans': ['清算热力图','清算时间线','估算清算价位','最大单笔清算','全部币种','了解杠杆','标记价格与清算','杠杆档位等权、多空均衡；为模型敞口，并非真实订单簿。','合作交易所'],
 'zh-Hant': ['清算熱力圖','清算時間線','估算清算價位','最大單筆清算','全部幣種','了解槓桿','標記價格與清算','槓桿檔位等權、多空均衡；為模型曝險，並非真實訂單簿。','合作交易所'],
 es: ['Mapa de liquidaciones','Cronología de liquidaciones','Niveles estimados','Mayores liquidaciones individuales','Todos los símbolos','Aprender sobre apalancamiento','Precio de marca y liquidación','Pesos iguales y lados equilibrados; exposición modelada, no un libro de órdenes.','Plataformas asociadas'],
 'pt-BR': ['Mapa de liquidações','Linha do tempo de liquidações','Níveis estimados','Maiores liquidações individuais','Todos os símbolos','Aprenda sobre alavancagem','Preço de marca e liquidação','Pesos iguais e lados equilibrados; exposição modelada, não um livro de ofertas.','Plataformas parceiras'],
 fr: ['Carte des liquidations','Chronologie des liquidations','Niveaux estimés','Plus grandes liquidations individuelles','Tous les symboles','Comprendre le levier','Prix de référence et liquidation','Pondérations égales et côtés équilibrés ; exposition modélisée, pas un carnet d’ordres.','Plateformes partenaires'],
 de: ['Liquidationskarte','Liquidationsverlauf','Geschätzte Niveaus','Größte einzelne Liquidationen','Alle Symbole','Hebel verstehen','Markpreis und Liquidation','Gleiche Gewichtung und ausgeglichene Seiten; modelliertes Engagement, kein Orderbuch.','Partnerplattformen'],
 it: ['Mappa delle liquidazioni','Cronologia delle liquidazioni','Livelli stimati','Maggiori liquidazioni singole','Tutti i simboli','Capire la leva','Prezzo mark e liquidazione','Pesi uguali e lati bilanciati; esposizione modellata, non un libro ordini.','Piattaforme partner'],
 ja: ['清算ヒートマップ','清算タイムライン','推定価格帯','最大の単一清算','全銘柄','レバレッジを学ぶ','マーク価格と清算','レバレッジ等配分・ロングとショート均等のモデルであり、注文板ではありません。','提携取引所'],
 ko: ['청산 히트맵','청산 타임라인','추정 가격대','최대 단일 청산','모든 종목','레버리지 학습','마크 가격과 청산','레버리지 균등 배분과 양방향 균형을 가정한 모델이며 주문장이 아닙니다.','제휴 거래소'],
 ru: ['Карта ликвидаций','Хронология ликвидаций','Расчётные уровни','Крупнейшие отдельные ликвидации','Все символы','Изучить плечо','Маркировочная цена и ликвидация','Равные веса и баланс сторон; модель экспозиции, не книга ордеров.','Партнёрские площадки'],
 tr: ['Likidasyon haritası','Likidasyon zaman çizelgesi','Tahmini seviyeler','En büyük tekil likidasyonlar','Tüm semboller','Kaldıracı öğrenin','Mark fiyatı ve likidasyon','Eşit ağırlık ve dengeli yönler; modellenmiş risk, emir defteri değildir.','Ortak platformlar'],
 id: ['Peta likuidasi','Linimasa likuidasi','Level perkiraan','Likuidasi tunggal terbesar','Semua simbol','Pelajari leverage','Harga mark dan likuidasi','Bobot setara dan sisi seimbang; eksposur model, bukan buku pesanan.','Platform mitra'],
 vi: ['Bản đồ thanh lý','Dòng thời gian thanh lý','Mức giá ước tính','Thanh lý đơn lẻ lớn nhất','Tất cả mã','Tìm hiểu đòn bẩy','Giá đánh dấu và thanh lý','Trọng số bằng nhau và hai phía cân bằng; mô hình vị thế, không phải sổ lệnh.','Sàn đối tác'],
 ar: ['خريطة التصفية','الجدول الزمني للتصفية','مستويات تقديرية','أكبر عمليات التصفية الفردية','كل الرموز','تعلم الرافعة المالية','سعر العلامة والتصفية','أوزان متساوية وجانبان متوازنان؛ تعرض نموذجي وليس دفتر أوامر.','منصات شريكة'],
 ur: ['لیکویڈیشن نقشہ','لیکویڈیشن ٹائم لائن','تخمینی سطحیں','سب سے بڑی انفرادی لیکویڈیشن','تمام علامات','لیوریج سیکھیں','مارک قیمت اور لیکویڈیشن','یکساں وزن اور متوازن سمتیں؛ ماڈل شدہ نمائش، آرڈر بک نہیں۔','پارٹنر پلیٹ فارمز'],
 uk: ['Карта ліквідацій','Хронологія ліквідацій','Розрахункові рівні','Найбільші окремі ліквідації','Усі символи','Вивчити плече','Маркувальна ціна та ліквідація','Рівні ваги та баланс сторін; модель експозиції, не книга ордерів.','Партнерські платформи'],
};
const gaps = {en:'Unobserved buckets (gray)', 'zh-Hans':'未观测时间段（灰色）', 'zh-Hant':'未觀測時段（灰色）', es:'Intervalos sin observar (gris)', 'pt-BR':'Intervalos não observados (cinza)', fr:'Intervalles non observés (gris)', de:'Unbeobachtete Intervalle (grau)', it:'Intervalli non osservati (grigio)', ja:'未観測の区間（灰色）', ko:'관측되지 않은 구간 (회색)', ru:'Ненаблюдаемые интервалы (серый)', tr:'Gözlemlenmeyen aralıklar (gri)', id:'Interval tidak teramati (abu-abu)', vi:'Khoảng chưa quan sát (xám)', ar:'فترات غير مرصودة (رمادي)', ur:'غیر مشاہدہ شدہ وقفے (سرمئی)', uk:'Неспостережені інтервали (сірий)'};
const lowerBound = {en:'Observed lower bound', 'zh-Hans':'已观测下限', 'zh-Hant':'已觀測下限',es:'Límite inferior observado','pt-BR':'Limite inferior observado',fr:'Minimum observé',de:'Beobachtete Untergrenze',it:'Limite inferiore osservato',ja:'観測された下限',ko:'관측된 하한',ru:'Наблюдаемый минимум',tr:'Gözlemlenen alt sınır',id:'Batas bawah teramati',vi:'Mức tối thiểu quan sát',ar:'الحد الأدنى المرصود',ur:'مشاہدہ شدہ کم از کم',uk:'Спостережений мінімум'};
export function heatmapCopy(locale = 'en') {
 const [title,timeline,levels,biggest,all,leverage,liquidation,model,partners] = rows[locale] || rows.en;
 return { lowerBound:lowerBound[locale] || lowerBound.en, gaps:gaps[locale] || gaps.en, title, description: `${title}: ${timeline.toLowerCase()}, ${levels.toLowerCase()}. ${model}`, timeline, levels, biggest, all, leverage, liquidation, model, partners, ...dataPageCopy(locale).common, longs: dataPageCopy(locale).liquidations.longs, shorts: dataPageCopy(locale).liquidations.shorts, sideLong: dataPageCopy(locale).liquidations.sideLong, sideShort: dataPageCopy(locale).liquidations.sideShort };
}
export function heatmapSchemas(locale) {
 const c = heatmapCopy(locale), url = `https://nexualpha.com${localizedPath('/liquidations/heatmap', locale)}`;
 return [{ '@context':'https://schema.org', '@type':'WebPage', name:c.title, description:c.description, url, inLanguage:locale, isPartOf:{'@type':'WebSite',name:'NexuAlpha',url:'https://nexualpha.com'} }];
}
